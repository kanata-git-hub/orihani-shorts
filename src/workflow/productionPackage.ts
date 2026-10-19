import { validateKling4Plan } from '../kling4';
import type { HistoryItem, SourceEpisode } from '../types';
import { sourceEpisode } from './package';
import { parseWeekly } from './weekly';
import { compileProductionPlan } from '../productionContinuity';
import { validateClipTiming } from '../utils/clipTiming';
import { parseReferencePlans, readReferencePlan } from '../referencePlan';
import { readShotDirection, readSceneTransition } from '../shotDirection';
import { clipVideoText, KLING_PROMPT_TARGET } from '../videoPrompt';

export const MAX_PRODUCTION_CHARS = 300000;
export const MAX_WEEKLY_SOURCES = 8;
export type ProductionImage = { fileId: string; sha256: string };
export type PreparedEpisode = { number: number; characterId: string; episode: SourceEpisode; plan: Record<string, any>; assets?: Record<string, ProductionImage> };
export type ProductionPackage = { format: 'orihani-production'; version: 1; revision: string; episodes: PreparedEpisode[] };
export type WeeklyChoice = SourceEpisode & { characters: string[]; prepared?: PreparedEpisode; preparedRevision?: string };
const fail = (detail: string): never => { throw Error(`완성 제작안: ${detail}`); };
function text(value: unknown, label: string, max = 30000): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label}을 확인해주세요.`);
}

function imageAssets(value: unknown, names: string[]): Record<string, ProductionImage> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Drive 이미지 연결을 확인해주세요.');
  const entries = Object.entries(value);
  if (entries.length !== names.length) fail('모든 주요장면의 Drive 이미지가 필요합니다.');
  const assets: Record<string, ProductionImage> = {};
  for (const [name, asset] of entries) {
    const a = asset as ProductionImage;
    if (!names.includes(name) || ['__proto__','constructor','prototype'].includes(name) || !a ||
      Object.keys(a).some(k => !['fileId','sha256'].includes(k)) ||
      typeof a.fileId !== 'string' || !/^[\w-]{20,200}$/.test(a.fileId) ||
      typeof a.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(a.sha256)) fail('Drive 이미지 파일과 원본 확인값이 올바르지 않습니다.');
    assets[name] = { fileId: a.fileId, sha256: a.sha256 };
  }
  return assets;
}

// Validate, never ask a model to rewrite or repair an authored package.
// The production compiler is used only for structural checks; discard its output
// so the supplied image/video prompt strings remain byte-for-byte unchanged.
export function readProductionPackage(raw: string): ProductionPackage {
  if (raw.length > MAX_PRODUCTION_CHARS) fail('파일이 너무 큽니다.');
  let value: any;
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { fail('올바른 JSON 파일이 아닙니다.'); }
  if (value?.format !== 'orihani-production' || value.version !== 1) fail('지원하지 않는 파일 형식입니다.');
  text(value.revision, '제작안 버전', 200);
  if (!Array.isArray(value.episodes) || !value.episodes.length || value.episodes.length > 3) fail('1~3개 에피소드가 필요합니다.');
  const numbers = new Set<number>();
  const episodes = value.episodes.map((entry: any): PreparedEpisode => {
    if (!Number.isInteger(entry?.number) || entry.number < 1 || numbers.has(entry.number)) fail('회차 번호가 잘못되었거나 중복됩니다.');
    numbers.add(entry.number);
    if (!['owonjang', 'nurse', 'deoki'].includes(entry.characterId)) fail('주인공을 확인해주세요.');
    const episode = sourceEpisode(entry.episode);
    const plan = entry.plan;
    if (!plan || typeof plan !== 'object' || Array.isArray(plan)) fail('기획이 없습니다.');
    for (const key of ['title', 'location', 'scenario', 'instagramCaption']) text(plan[key], key, key === 'scenario' ? 40000 : 5000);
    if (plan.scenario !== episode.scenario || plan.title !== episode.title.replace(/^\[에피소드\s*\d+\]\s*/, '')) fail('대본과 기획이 일치하지 않습니다.');
    const number = episode.title.match(/^\[에피소드\s*(\d+)\]/)?.[1];
    if (Number(number) !== entry.number) fail('제목의 회차 번호가 다릅니다.');
    if (!Array.isArray(plan.hashtags) || plan.hashtags.length !== 5 || plan.hashtags.some((t: unknown) => typeof t !== 'string' || !t.trim() || t.length > 100)) fail('해시태그 5개가 필요합니다.');
    if (plan.workflow === 'kling4') {
      validateKling4Plan(plan);
      if(plan.duration !== episode.duration) fail('대본과 전체 영상 길이가 다릅니다.');
      if(plan.needsVideoReview) fail('전체 영상 프롬프트 확인을 완료해주세요.');
      const assets = imageAssets(entry.assets, plan.keyframes.map((f: any) => f.imageTitle));
      return { number: entry.number, characterId: entry.characterId, episode, plan, ...(assets ? {assets} : {}) };
    }
    validateClipTiming(JSON.stringify(plan), `${episode.duration}s`);
    compileProductionPlan(plan);
    const references = parseReferencePlans(episode.scenario);
    if (!references || references.length !== plan.clips.length) fail('각 장면의 참고 연결이 필요합니다.');
    const names = new Set<string>();
    plan.clips.forEach((clip: any, i: number) => {
      for (const key of ['title', 'imageTitle', 'videoTitle', 'imagePrompt', 'videoPrompt', 'locationId']) text(clip[key], `장면 ${i + 1} ${key}`);
      const copyLength = clipVideoText(clip.videoPrompt, i, clip.title).length;
      if (copyLength > KLING_PROMPT_TARGET) fail(`${entry.number}화 장면 ${i + 1} 영상 프롬프트가 복사 머리말 포함 ${copyLength}자입니다. ${KLING_PROMPT_TARGET}자 이내로 작성해주세요. 내용을 자동으로 자르지 않습니다.`);
      if (names.has(clip.imageTitle) || ['__proto__', 'constructor', 'prototype'].includes(clip.imageTitle)) fail('장면 이름이 중복되거나 올바르지 않습니다.');
      names.add(clip.imageTitle);
      if (!['pantry', 'treatment', 'reception', 'none'].includes(clip.backgroundAsset)) fail('배경 에셋을 확인해주세요.');
      if (!readShotDirection(clip.shot) || !readSceneTransition(clip.sceneTransition)) fail('구도와 장면 연결이 필요합니다.');
      const link = readReferencePlan(clip.referencePlan, i + 1);
      if (JSON.stringify(link) !== JSON.stringify(references[i])) fail('대본과 이미지 참고 연결이 다릅니다.');
      for (const heading of ['REFERENCE INSTRUCTION', 'OUTPUT SPECS', 'CINEMATOGRAPHY', 'ENVIRONMENT', 'ACTION', 'DIALOGUE', 'AUDIO', 'STRICT RULES']) {
        if (!new RegExp(`^${heading}:`, 'm').test(clip.videoPrompt)) fail(`장면 ${i + 1}의 ${heading} 항목이 필요합니다.`);
      }
    });
    const assets = imageAssets(entry.assets, plan.clips.map((c: any) => c.imageTitle));
    return { number: entry.number, characterId: entry.characterId, episode, plan, ...(assets ? {assets} : {}) };
  });
  return { format: 'orihani-production', version: 1, revision: value.revision, episodes };
}

export function readWeeklyInput(raw: string): WeeklyChoice[] {
  const clean = raw.replace(/^\uFEFF/, '').trim();
  if (!clean.startsWith('{')) return parseWeekly(raw);
  const pack = readProductionPackage(clean);
  return pack.episodes.map(prepared => ({
    ...prepared.episode, characters: [prepared.characterId], prepared, preparedRevision: pack.revision,
  }));
}

// Keep each source's own revision and asset manifest, including separately added bonuses.
// A production file still contains at most three episodes.
export function readWeeklySources(sources: string[]): WeeklyChoice[] {
  if (!Array.isArray(sources) || !sources.length || sources.length > MAX_WEEKLY_SOURCES || sources.some(s => typeof s !== 'string')) fail('주간 제작안 목록을 확인해주세요.');
  const choices = sources.flatMap(readWeeklyInput);
  const seen = new Set<string>();
  for (const choice of choices) {
    const key = choice.prepared ? `${choice.preparedRevision}:${choice.prepared.number}` : choice.title;
    if (seen.has(key)) fail('주간 제작안의 회차와 버전이 중복됩니다.');
    seen.add(key);
  }
  return choices;
}

export function preparedHistory(entry: PreparedEpisode, revision: string): HistoryItem {
  // Revalidate at the persistence boundary as well as at file selection.
  const checked = readProductionPackage(JSON.stringify({ format: 'orihani-production', version: 1, revision, episodes: [entry] })).episodes[0];
  return {
    id: crypto.randomUUID(), timestamp: Date.now(), characterId: checked.characterId,
    duration: checked.episode.duration, episode: checked.episode,
    result: JSON.stringify({ ...checked.plan, productionSource: 'authored', productionRevision: revision }),
  };
}

export function isAuthoredPlan(raw: string): boolean {
  try { return JSON.parse(raw).productionSource === 'authored'; } catch { return false; }
}

