import type { SourceEpisode } from './types';
import { episodePrompt } from './workflow/weekly';

// A selected weekly script is a finished screenplay, not a seed for another
// creative-writing pass. Legacy free-form requests still use the planner.
export function readSourceEpisode(value: unknown, duration: '5s' | '15s', customPrompt: unknown): SourceEpisode | undefined {
  if (value == null) return undefined;
  const v = value as SourceEpisode;
  if (!v || v.duration !== (duration === '15s' ? 15 : 5) ||
      !['title', 'scenario', 'korean', 'caption', 'thumbnail'].every(k => typeof (v as any)[k] === 'string' && (v as any)[k].length <= 200000) ||
      !v.title.trim() || !v.scenario.trim() || !v.korean.trim()) {
    throw Error('선택한 원본 대본의 길이 또는 내용이 올바르지 않습니다. 대본을 다시 선택해주세요.');
  }
  const episode = { duration: v.duration, title: v.title, scenario: v.scenario, korean: v.korean, caption: v.caption, thumbnail: v.thumbnail };
  if (episodePrompt(episode) !== customPrompt) throw Error('원본 대본과 입력 내용이 달라졌습니다. 대본을 다시 선택해주세요.');
  return episode;
}

export const sourceConversionInstruction = `AUTHORITATIVE FINISHED SCREENPLAY:
Convert this screenplay into generation prompts without rewriting its plot. Preserve every clip's location, scale, camera direction, starting state, main action, ending state, character goal, spoken line and silent beat. Translate the production directions into English. Keep Korean dialogue verbatim with its original speaker and clip. Preserve intentional large-scale fantasy, visual metaphor, physical events and cinematic reveals. Do not replace them with safer-looking clinic dialogue, a giant prop held in place, or tiny gestures. Do not add, remove or reorder narrative beats. Keep the supplied Korean title and metadata rather than making a new bilingual meme title.`;
