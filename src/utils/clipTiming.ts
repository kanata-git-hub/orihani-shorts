export function clipDurations(duration: string): number[] {
  if (duration === '5s') return [2, 3];
  if (duration === '15s') return [4, 4, 3, 4];
  throw new Error('영상 길이는 5초 또는 15초여야 합니다.');
}

export function timingInstruction(duration: string): string {
  const durations = clipDurations(duration);
  let start = 0;
  const schedule = durations.map((seconds, i) => {
    const end = start + seconds;
    const line = `CLIP ${i + 1}: [${start}-${end}초], OUTPUT SPECS: ${seconds}s, vertical 9:16.`;
    start = end;
    return line;
  }).join('\n');
  return `MANDATORY CLIP TIMING: Exactly ${durations.length} clips, in this order:\n${schedule}\nUse exactly one image prompt and one video prompt per clip. Do not add, remove, split or merge clips. Scenario time ranges and actions must fit this schedule. This schedule overrides all example durations and variable cut counts.`;
}

export function validateClipTiming(text: string, duration: string): void {
  const plan = JSON.parse(text);
  const expected = clipDurations(duration);
  if (!Array.isArray(plan.clips) || plan.clips.length !== expected.length) {
    throw new Error(`기획의 클립 수가 ${expected.length}개와 맞지 않습니다.`);
  }
  plan.clips.forEach((clip: { videoPrompt?: string }, i: number) => {
    const specs = [...(clip.videoPrompt || '').matchAll(/OUTPUT\s+SPECS\s*:\s*(\d+(?:\.\d+)?)\s*(?:s\b|seconds?\b|초)/gi)];
    if (specs.length !== 1 || Number(specs[0][1]) !== expected[i]) {
      throw new Error(`Clip ${i + 1} 길이가 ${expected[i]}초와 맞지 않습니다.`);
    }
  });
}
