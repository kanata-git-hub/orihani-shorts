export const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3-pro-image'] as const;
export type ImageModel = typeof IMAGE_MODELS[number];
export const MAX_IMAGE_EDITS = 3;
export const MAX_IMAGE_ATTEMPTS = 1 + MAX_IMAGE_EDITS;
export const IMAGE_GENERATION_NOTICE = `최초 생성 후 Flash가 검수하고, 명확한 오류가 있으면 직전 그림의 해당 부분을 최대 ${MAX_IMAGE_EDITS}회 수정합니다. 통과 즉시 종료하며, 장면당 최대 이미지 ${MAX_IMAGE_ATTEMPTS}회·검수 ${MAX_IMAGE_ATTEMPTS}회 비용이 발생합니다. 통과한 그림만 적용합니다.`;
export type ImageOperation = 'generate' | 'compare' | 'review' | 'repair';
export type ImageReview = {
  status: 'pass' | 'fail' | 'uncertain' | 'unavailable';
  issues: { category: 'anatomy' | 'cast' | 'identity' | 'geometry' | 'start-state'; severity: 'error' | 'uncertain'; evidence: string; fix?: string }[];
  error?: string;
};
export type ImageAttempt = {
  candidate: string; model: string; providerModel?: string; review: ImageReview;
  reviewModel: string; reviewProviderModel?: string; generationMs: number; reviewMs: number;
  usage?: unknown; reviewUsage?: unknown;
};
export type ImageResult = {
  model: string; providerModel?: string; inputHash?: string; elapsedMs?: number;
  generationMs?: number; reviewMs?: number; usage?: unknown; reviewUsage?: unknown;
  candidate?: string; result?: string; review?: ImageReview; error?: string;
  operation?: ImageOperation; reviewModel?: string; repairCount?: number; maxRepairs?: number;
  attempts?: ImageAttempt[]; repairError?: string;
};
export const isImageData = (v: unknown): v is string => typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
export function readImageReview(raw: string): ImageReview {
  const v = JSON.parse(raw);
  if (!v || !Array.isArray(v.issues) || v.issues.length > 12) throw Error('이미지 검수 응답의 형식이 올바르지 않습니다.');
  const categories = ['anatomy', 'cast', 'identity', 'geometry', 'start-state'];
  for (const issue of v.issues) {
    if (!issue || !categories.includes(issue.category) || !['error', 'uncertain'].includes(issue.severity) ||
      typeof issue.evidence !== 'string' || !issue.evidence.trim() || issue.evidence.length > 1600) throw Error('이미지 검수 근거가 올바르지 않습니다.');
    if (issue.fix !== undefined && (typeof issue.fix !== 'string' || !issue.fix.trim() || issue.fix.length > 1600)) throw Error('이미지 수정 지시가 올바르지 않습니다.');
  }
  return { status: v.issues.some(i => i.severity === 'error') ? 'fail' : v.issues.length ? 'uncertain' : 'pass', issues: v.issues };
}
export function approvedImage(value: ImageResult): string | undefined {
  // Missing or failed review must not silently replace a working scene image.
  return value.review?.status === 'pass' && value.review.issues?.length === 0 && isImageData(value.result) ? value.result : undefined;
}
export const connectedAnatomyInstruction = `Physical continuity: each character is one connected body. When a prop hides the torso, keep visible feet/limbs directly at that body's occluding edge with coherent contact and scale; never put detached feet elsewhere on the floor. Foreground/midground labels describe framing, not permission to separate a character's parts. Multiple reference views depict the SAME individual, not extra cast members.`;
