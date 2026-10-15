import type { HistoryItem } from '../types';
import type { ProductionPackage } from './productionPackage';
import { clipVideoText, KLING_PROMPT_TARGET } from '../videoPrompt';

function planOf(item: HistoryItem): any {
  try { const plan = JSON.parse(item.result); return plan.productionSource === 'authored' && Array.isArray(plan.clips) ? plan : null; }
  catch { return null; }
}
export function needsVideoPromptRefresh(item: HistoryItem): boolean {
  return !!planOf(item)?.clips.some((c: any, i: number) => typeof c.videoPrompt === 'string' && clipVideoText(c.videoPrompt, i, c.title).length > KLING_PROMPT_TARGET);
}
const stable = (value: any): string => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v);
function withoutVideoPrompts(plan: any) {
  const { productionSource, productionRevision, ...rest } = plan;
  return { ...rest, clips: rest.clips.map(({ videoPrompt, ...clip }: any) => clip) };
}

/** Update only a matching authored story. IDs, media keys, editor links and all other data survive. */
export function refreshAuthoredVideoPrompts(item: HistoryItem, pack: ProductionPackage): HistoryItem {
  if (!needsVideoPromptRefresh(item)) return item;
  const plan = planOf(item);
  const entry = pack.episodes.find(e => Array.isArray(e.plan.clips) && e.characterId === item.characterId && stable(e.episode) === stable(item.episode)
    && stable(withoutVideoPrompts(e.plan)) === stable(withoutVideoPrompts(plan)));
  if (!entry || plan.productionRevision === pack.revision || entry.plan.clips.some((c: any, i: number) => clipVideoText(c.videoPrompt, i, c.title).length > KLING_PROMPT_TARGET)) return item;
  return { ...item, result: JSON.stringify({ ...plan, productionRevision: pack.revision,
    clips: plan.clips.map((clip: any, i: number) => ({ ...clip, videoPrompt: entry.plan.clips[i].videoPrompt })) }) };
}
