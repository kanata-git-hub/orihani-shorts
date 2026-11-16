export type ThumbnailSettings = {
  imageTitle: string;
  title: string;
  showTitle: boolean;
  position: 'top' | 'bottom';
};

export const MAX_THUMBNAIL_TITLE_LENGTH = 80;

/** This is a still-image title, independent of any video headline or dialogue. */
export function validateThumbnailTitle(title: unknown, required = true): asserts title is string {
  if (typeof title !== 'string') throw Error('썸네일 제목을 확인해주세요.');
  if (Array.from(title).length > MAX_THUMBNAIL_TITLE_LENGTH) throw Error('썸네일 제목은 80자 이내로 적어주세요.');
  if (title.split('\n').length > 2) throw Error('썸네일 제목은 최대 두 줄까지 적어주세요.');
  if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/u.test(title)) {
    throw Error('썸네일 제목에 사용할 수 없는 문자가 있습니다.');
  }
  if (required && !title.trim()) throw Error('짧은 제목을 적거나 글자 없는 썸네일을 선택해주세요.');
  if (title.includes('\n') && title.split('\n').some(line => !line.trim())) {
    throw Error('빈 줄을 지우고 제목을 한두 줄로 적어주세요.');
  }
}

/** Optional on older work files; reject malformed metadata without changing originals. */
export function validateThumbnailSettings(value: unknown, imageTitles: readonly string[]): ThumbnailSettings | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('썸네일 설정을 확인해주세요.');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some(key => !['imageTitle', 'title', 'showTitle', 'position'].includes(key))) {
    throw Error('썸네일 설정에 알 수 없는 항목이 있습니다.');
  }
  if (typeof record.imageTitle !== 'string' || !imageTitles.includes(record.imageTitle)) {
    throw Error('썸네일의 원본 주요 장면을 확인해주세요.');
  }
  if (typeof record.showTitle !== 'boolean' || !['top', 'bottom'].includes(record.position as string)) {
    throw Error('썸네일 제목 표시 설정을 확인해주세요.');
  }
  validateThumbnailTitle(record.title, record.showTitle);
  return { imageTitle: record.imageTitle, title: record.title, showTitle: record.showTitle, position: record.position as 'top' | 'bottom' };
}

/** Only remove known administrative prefixes; never invent or truncate story copy. */
export function defaultThumbnailTitle(publicTitle: string): string {
  const title = publicTitle.replace(/\r\n?/g, '\n').trim()
    .replace(/^\[에피소드\s*\d+\]\s*/u, '')
    .replace(/^(?:번외\s*\d+\s*(?:화)?|\d+\s*화)\s*[:.\-–—]?\s*/u, '')
    .replace(/\s*\(하찮은 오리 일상\)\s*$/u, '').trim();
  try { validateThumbnailTitle(title, false); return title; } catch { return ''; }
}
