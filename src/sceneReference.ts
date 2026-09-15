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
