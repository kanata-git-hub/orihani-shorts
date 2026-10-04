export const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-3-pro-image'] as const;
export type ImageModel = typeof IMAGE_MODELS[number];
export const MAX_IMAGE_EDITS = 3;
export const MAX_IMAGE_ATTEMPTS = 1 + MAX_IMAGE_EDITS;
export const MAX_REVIEW_RETRIES = 1;
export const IMAGE_GENERATION_NOTICE = `최초 생성 후 Flash가 검수하고, 명확한 오류가 있으면 직전 그림의 해당 부분을 최대 ${MAX_IMAGE_EDITS}회 수정합니다. 검수 응답이 비거나 불완전하면 그림을 유지한 채 검수만 전체 작업에서 1회 재시도합니다. 장면당 최대 이미지 ${MAX_IMAGE_ATTEMPTS}회·검수 ${MAX_IMAGE_ATTEMPTS + MAX_REVIEW_RETRIES}회 비용이 발생합니다. 통과한 그림은 자동 적용하며, 검수가 끝나지 않아도 결과에서 그림을 확인·다운로드·직접 적용할 수 있습니다.`;
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
  reviewCalls?: ReviewCall[];
};
export type ReviewCall = {
  code?: string; finishReason?: string; blockReason?: string; responseId?: string;
  responseLength: number; providerModel?: string; usage?: unknown; elapsedMs: number;
};
export type ImageResult = {
  model: string; providerModel?: string; inputHash?: string; elapsedMs?: number;
  generationMs?: number; reviewMs?: number; usage?: unknown; reviewUsage?: unknown;
  candidate?: string; result?: string; review?: ImageReview; error?: string;
  operation?: ImageOperation; reviewModel?: string; repairCount?: number; maxRepairs?: number;
  attempts?: ImageAttempt[]; repairError?: string;
};
export const isImageData = (v: unknown): v is string => typeof v === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v);
export class ImageReviewResponseError extends Error {
  constructor(public code: 'EMPTY_RESPONSE' | 'INVALID_JSON' | 'INVALID_REVIEW', message: string) { super(message); }
}
export function readImageReview(raw: string): ImageReview {
  const text = raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
  if (!text) throw new ImageReviewResponseError('EMPTY_RESPONSE', 'Flash가 검수 결과를 보내지 않았습니다.');
  let v: any;
  try { v = JSON.parse(text); }
  catch { throw new ImageReviewResponseError('INVALID_JSON', 'Flash 검수 응답이 불완전하여 결과를 읽지 못했습니다.'); }
  if (!v || !Array.isArray(v.issues) || v.issues.length > 12) throw new ImageReviewResponseError('INVALID_REVIEW', 'Flash 검수 응답의 형식이 올바르지 않습니다.');
  const categories = ['anatomy', 'cast', 'identity', 'geometry', 'start-state'];
  for (const issue of v.issues) {
    if (!issue || !categories.includes(issue.category) || !['error', 'uncertain'].includes(issue.severity) ||
      typeof issue.evidence !== 'string' || !issue.evidence.trim() || issue.evidence.length > 1600) throw new ImageReviewResponseError('INVALID_REVIEW', 'Flash 검수 근거가 올바르지 않습니다.');
    if (issue.fix !== undefined && (typeof issue.fix !== 'string' || !issue.fix.trim() || issue.fix.length > 1600)) throw new ImageReviewResponseError('INVALID_REVIEW', 'Flash 이미지 수정 지시가 올바르지 않습니다.');
  }
  return { status: v.issues.some(i => i.severity === 'error') ? 'fail' : v.issues.length ? 'uncertain' : 'pass', issues: v.issues };
}
export function approvedImage(value: ImageResult): string | undefined {
  // Missing or failed review must not silently replace a working scene image.
  return value.review?.status === 'pass' && value.review.issues?.length === 0 && isImageData(value.result) ? value.result : undefined;
}
export const connectedAnatomyInstruction = `Physical continuity: each character is one connected body. When a prop hides the torso, keep visible feet/limbs directly at that body's occluding edge with coherent contact and scale; never put detached feet elsewhere on the floor. Foreground/midground labels describe framing, not permission to separate a character's parts. Multiple reference views depict the SAME individual, not extra cast members.`;
