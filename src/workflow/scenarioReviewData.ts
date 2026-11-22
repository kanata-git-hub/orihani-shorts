type ReviewLink = { reviewUrl?: string; reviewLabel?: string };
export type ReviewCut = { start: number; end: number; action: string; subtitle?: string; frame?: string };
export type ReviewEpisode = ReviewLink & {
  number: number; title: string; duration: 15; scenarioRevision: string; summary: string;
  cuts: ReviewCut[]; scenario?: string; keyShot?: string; klingPrompt?: string;
  props?: string | string[]; editNotes?: string | string[];
};
export type ScenarioReviewData = ReviewLink & {
  format: 'orihani-scenario-review'; version: 1; revision: string; episodes: ReviewEpisode[];
};

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const optionalText = (value: unknown) => value === undefined || typeof value === 'string';
const notes = (value: unknown) => optionalText(value) || (Array.isArray(value) && value.every(hasText));
function validLink(value: ReviewLink) {
  if (!optionalText(value.reviewLabel)) return false;
  if (value.reviewUrl === undefined) return true;
  if (typeof value.reviewUrl !== 'string') return false;
  try {
    const url = new URL(value.reviewUrl);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}

export function parseScenarioReview(raw: string): ScenarioReviewData {
  const bad = () => { throw Error('시나리오 검토본의 판본, 회차와 컷 시간을 확인해주세요.'); };
  let data: ScenarioReviewData;
  try { data = JSON.parse(raw); } catch { return bad(); }
  if (data?.format !== 'orihani-scenario-review' || data.version !== 1 || !hasText(data.revision) ||
      !validLink(data) || !Array.isArray(data.episodes) || !data.episodes.length) return bad();
  const numbers = new Set<number>();
  for (const ep of data.episodes) {
    if (!ep || !Number.isSafeInteger(ep.number) || ep.number < 1 || numbers.has(ep.number) ||
        ep.duration !== 15 || !hasText(ep.title) || !hasText(ep.scenarioRevision) || !hasText(ep.summary) ||
        !optionalText(ep.scenario) || !optionalText(ep.keyShot) || !optionalText(ep.klingPrompt) || !notes(ep.props) || !notes(ep.editNotes) ||
        !validLink(ep) || !Array.isArray(ep.cuts) || !ep.cuts.length) return bad();
    numbers.add(ep.number);
    let time = 0;
    for (const cut of ep.cuts) {
      if (!cut || cut.start !== time || !Number.isFinite(cut.end) || cut.end <= cut.start ||
          cut.end > ep.duration || !hasText(cut.action) || !optionalText(cut.subtitle) || !optionalText(cut.frame)) return bad();
      time = cut.end;
    }
    if (time !== ep.duration) return bad();
  }
  return data;
}
