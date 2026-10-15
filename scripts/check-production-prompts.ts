import { readFileSync } from 'node:fs';
import { readProductionPackage } from '../src/workflow/productionPackage';
import { clipVideoText, KLING_PROMPT_TARGET } from '../src/videoPrompt';

const file = process.argv[2];
if (!file) throw Error('Usage: node --import tsx scripts/check-production-prompts.ts production.json');
const pack = readProductionPackage(readFileSync(file, 'utf8'));
console.table(pack.episodes.flatMap(ep => ep.plan.clips.map((clip: any, i: number) => ({
  episode: ep.number, clip: i + 1, copiedCharacters: clipVideoText(clip.videoPrompt, i, clip.title).length, target: KLING_PROMPT_TARGET,
}))));
