import type { HistoryItem } from './types';
import { readReferencePlan, type ReferencePlan } from './referencePlan';

export type VideoDuration = 5 | 15 | 30;
export type VideoLayout = 'single' | 'legacy-clips';
export type Keyframe = { time: number; title: string; imageTitle: string; imagePrompt: string; referencePlan: ReferencePlan; locationId?: string; backgroundAsset?: string };
export type Kling4Plan = {
  workflow: 'kling4'; duration: VideoDuration; title: string; location: string; scenario: string;
  instagramCaption: string; hashtags: string[]; continuity: string; videoPrompt: string; keyframes: Keyframe[];
  needsVideoReview?: boolean;
};
// These are production defaults, not model limits. Extra frames are only useful
// when a particular pose, prop state or location really needs to be pinned down.
export const defaultKeyframeTimes = (duration: VideoDuration): number[] => duration === 5 ? [0, 5] : duration === 15 ? [0, 7.5, 15] : [0, 7.5, 15, 22.5, 30];
export const CHARACTER_DRIVE_URL = 'https://drive.google.com/drive/folders/1lEWI-ISBZ44Fa_-FYj9S2EWzgHV1Pckt';
export function getKling4Plan(raw: string): Kling4Plan | null {
  try { const plan = JSON.parse(raw); return plan?.workflow === 'kling4' ? plan : null; } catch { return null; }
}
export function validateKling4Plan(plan: any): asserts plan is Kling4Plan {
  const fail = (message: string): never => { throw Error(`Kling 4.0 제작안: ${message}`); };
  if (!plan || plan.workflow !== 'kling4' || ![5, 15, 30].includes(plan.duration)) fail('5초·15초·30초 중 영상 길이를 정해주세요.');
  for (const [key, max] of Object.entries({ title: 1000, location: 3000, scenario: 40000, instagramCaption: 5000, continuity: 10000, videoPrompt: 30000 })) {
    if (typeof plan[key] !== 'string' || !plan[key].trim() || plan[key].length > max) fail(`${key} 내용을 확인해주세요.`);
  }
  if (!Array.isArray(plan.hashtags) || plan.hashtags.length !== 5 || plan.hashtags.some((s: unknown) => typeof s !== 'string' || !s.trim() || s.length > 100)) fail('해시태그 5개가 필요합니다.');
  if (!Array.isArray(plan.keyframes) || plan.keyframes.length < 2 || plan.keyframes.length > 10) fail('주요장면 이미지는 2~10장입니다.');
  const names = new Set<string>(); let previous = -1;
  plan.keyframes.forEach((frame: any, i: number) => {
    if (!frame || !Number.isFinite(frame.time) || frame.time < 0 || frame.time > plan.duration || frame.time <= previous || (i === 0 && frame.time !== 0)) fail('이미지 시점은 0초부터 영상 길이 안에서 순서대로 지정해주세요.');
    previous = frame.time;
    for (const [key, max] of Object.entries({ title: 1000, imageTitle: 500, imagePrompt: 30000 })) if (typeof frame[key] !== 'string' || !frame[key].trim() || frame[key].length > max) fail(`이미지 ${i + 1}의 ${key} 내용을 확인해주세요.`);
    if (names.has(frame.imageTitle) || ['__proto__', 'constructor', 'prototype'].includes(frame.imageTitle)) fail('서로 다른 이미지 이름이 필요합니다.');
    names.add(frame.imageTitle);
    if (frame.backgroundAsset !== undefined && !['pantry','treatment','reception','none'].includes(frame.backgroundAsset)) fail('배경 에셋을 확인해주세요.');
    if (frame.locationId !== undefined && (typeof frame.locationId !== 'string' || !frame.locationId.trim() || frame.locationId.length > 500)) fail('장소 식별자를 확인해주세요.');
    if (!readReferencePlan(frame.referencePlan, i + 1)) fail(`이미지 ${i + 1}의 배경·소품 참고 연결이 필요합니다.`);
  });
  if (plan.needsVideoReview !== undefined && typeof plan.needsVideoReview !== 'boolean') fail('프롬프트 확인 상태가 올바르지 않습니다.');
  if (plan.clips !== undefined) fail('주요장면 이미지와 예전 클립 목록을 동시에 넣을 수 없습니다.');
  if (JSON.stringify(plan).length > 200000) fail('전체 기획은 200,000자 이하로 넣어주세요.');
}

// An explicit, local copy: keep every supplied start image at its REAL time.
// Do not relabel the last clip's starting pose as the ending pose, discard paid
// images, or claim that concatenated legacy directions are already reviewed.
export function legacyKling4Copy(item: HistoryItem, clips: any[], overview: any): HistoryItem {
  const duration = item.duration || (clips.length === 2 ? 5 : 15);
  if ((duration !== 5 && duration !== 15) || clips.length !== (duration === 5 ? 2 : 4)) throw Error('기존 기획의 영상 길이와 장면 수를 확인해주세요.');
  const starts = duration === 5 ? [0, 2] : [0, 4, 8, 11];
  const plan: Kling4Plan = {
    workflow: 'kling4', duration, title: overview.title || '이전 기획', location: overview.location || '기존 대본 참고',
    scenario: overview.scenario || item.episode?.scenario || '기존 영상 프롬프트 참고',
    instagramCaption: overview.instagramCaption || item.episode?.caption || overview.title || '이전 기획',
    hashtags: overview.hashtags, continuity: 'Preserve the supplied character designs, recurring props and physical set. Keyframes are timed states, not separate video clips.',
    videoPrompt: `Create ONE continuous ${duration}-second vertical 9:16 video. The following sections describe successive story beats in this single timeline; their local action times are relative to each section. Preserve every action and dialogue line. The reference images show the indicated timestamps, not separate video beginnings or an assumed final pose.\n\n` + clips.map((c, i) => `[${starts[i]}–${starts[i + 1] ?? duration}s]\n${c.videoPrompt.replace(/^OUTPUT\s+SPECS:[^\n]*/gmi, '')}`).join('\n\n'),
    keyframes: clips.map((c, i) => ({ time: starts[i], title: c.title, imageTitle: c.imageTitle, imagePrompt: c.imagePrompt,
      referencePlan: c.referencePlan || { background: null, props: [] }, locationId: c.locationId, backgroundAsset: c.backgroundAsset })), needsVideoReview: true,
  };
  validateKling4Plan(plan);
  return { ...item, id: crypto.randomUUID(), timestamp: Date.now(), editorKey: undefined, duration, result: JSON.stringify(plan) };
}
