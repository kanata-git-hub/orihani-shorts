import type { HistoryItem } from './types';
import { extractClips, extractOverview } from './utils/extractors';
import { referenceData } from './characterReference';

// Store the chosen image with the receiving record, never as a live link to
// a source image that may later be regenerated or deleted. Kept in IndexedDB.
export type SceneReference = {
  sourceId: string;
  sourceTitle: string;
  sceneTitle: string;
  sceneNumber: number;
  imageUrl: string;
};

export type ClipReferences = Record<string, SceneReference>;

export function readClipReferences(value: unknown, item?: HistoryItem): ClipReferences {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 100) {
    throw Error('장면별 소품 참고 정보를 읽지 못했습니다.');
  }
  const clips = item ? extractClips(item.result) : undefined;
  const entries = Object.entries(value).map(([title, raw]) => {
    if (!title.trim() || title.length > 500 || ['__proto__','constructor','prototype'].includes(title)) {
      throw Error('소품을 참고할 장면을 다시 선택해주세요.');
    }
    const reference = readSceneReference(raw);
    if (!reference) throw Error('참고 장면의 사진을 다시 선택해주세요.');
    if (clips) {
      const index = clips.findIndex(clip => clip.imageTitle === title);
      if (index < 0) throw Error('소품을 참고할 장면이 이 기획에 없습니다.');
      if (reference.sourceId === item!.id && (reference.sceneNumber > index ||
          clips[reference.sceneNumber - 1]?.imageTitle !== reference.sceneTitle)) {
        throw Error('현재 화에서는 앞서 나온 장면의 사진을 선택해주세요.');
      }
    }
    return [title, reference] as const;
  });
  return Object.fromEntries(entries);
}

export function captureClipReference(item: HistoryItem, targetTitle: string, source: HistoryItem, sourceTitle: string, images: Record<string,string>) {
  return readClipReferences({[targetTitle]:captureSceneReference(source, sourceTitle, images)}, item)[targetTitle];
}

export function clipReferenceInstruction(reference: SceneReference, sceneNumber: number): string {
  return `[USER-SELECTED PROP REFERENCE FOR SCENE ${sceneNumber} ONLY]
The separately labelled PROP DESIGN STILL is source scene ${reference.sceneNumber}. Use it only for the appearance of recurring props that are required in the CURRENT scene: their silhouette, materials, colors, proportions and attached components. This selected prop design takes priority over incidental prop descriptions and other generated stills, including the set anchor and an episode-wide reference.
Do not copy this still's room, background, camera, lighting, character pose or facial expression. Do not insert characters or objects absent from the current script. The CURRENT shot controls the location, framing, performance and starting state; a box may open or close, food may be eaten, and a prop may move as scripted. This is a prop design reference, not an instruction to continue the source scene. Original character sheets remain authoritative for character identity, anatomy and colors.`;
}

export function readSceneReference(value: unknown): SceneReference | null {
  if (value == null) return null;
  const v = value as SceneReference;
  const text = (s: unknown, max: number) => typeof s === 'string' && !!s.trim() && s.length <= max;
  if (!v || !text(v.sourceId, 200) || !text(v.sourceTitle, 1000) || !text(v.sceneTitle, 500) ||
      !Number.isInteger(v.sceneNumber) || v.sceneNumber < 1 || v.sceneNumber > 100 ||
      !text(v.imageUrl, 16000000) || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v.imageUrl)) {
    throw Error('참고 장면의 사진을 읽지 못했습니다. 장면을 다시 선택하거나 연결을 해제해주세요.');
  }
  return { sourceId:v.sourceId, sourceTitle:v.sourceTitle, sceneTitle:v.sceneTitle, sceneNumber:v.sceneNumber, imageUrl:v.imageUrl };
}

export function captureSceneReference(item: HistoryItem, sceneTitle: string, images: Record<string,string>): SceneReference {
  const sceneNumber = extractClips(item.result).findIndex(c => c.imageTitle === sceneTitle) + 1;
  return readSceneReference({ sourceId:item.id, sourceTitle:item.episode?.title || extractOverview(item.result).title || '제목 없는 기획', sceneTitle, sceneNumber, imageUrl:images[sceneTitle] })!;
}

export function sceneReferenceInstruction(): string {
  return `[USER-SELECTED EARLIER EPISODE STILL — RECURRING PROP CONTINUITY]
The attached earlier-episode still was explicitly selected for THIS episode only. It is a visual reference, not a required starting frame.
For recurring objects required by the CURRENT script, preserve the reference object's recognizable silhouette, materials, colors, proportions and attached components. Describe those visible features consistently in BOTH image and video prompts. Resolve incidental conflicting prop descriptions in favor of this selected design, while retaining the current story's actions and dialogue. Power, light, motion and damage states may change when the current script calls for them.
Only reuse props and shared setting details that belong in the CURRENT scene. Do not insert absent objects or characters just because they appear in the reference. Do not repeat its pose, camera composition or action. The new script controls staging and narrative; the current room selection controls the location. Never force a different location back into the earlier room.
Original character design sheets remain authoritative for character identity, anatomy and colors. The selected still is the recurring object's design anchor even if intermediate generated scenes drift. This is not an instruction to continue any unselected episode.`;
}

export function planWithSceneReference(prompt: string, reference: SceneReference | null) {
  if (!reference) return prompt;
  return { parts: [
    { text: prompt + '\n\n' + sceneReferenceInstruction() },
    { text: '[USER-SELECTED EARLIER EPISODE STILL]' },
    { inlineData: referenceData(reference.imageUrl) },
  ] };
}
