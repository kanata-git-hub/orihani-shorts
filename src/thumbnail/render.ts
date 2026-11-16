import { validateThumbnailTitle, type ThumbnailSettings } from './settings';

export type ThumbnailAspectRatio = '9:16' | '16:9';
type Rect = { x: number; y: number; width: number; height: number };
export type ThumbnailTitleLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  x: number;
  y: number;
  strokeWidth: number;
  gradientStart: number;
  gradientEnd: number;
};

const FONT_FAMILY = 'OriThumbnailCafe24';
let fontPromise: Promise<void> | undefined;

export function thumbnailDimensions(aspectRatio: ThumbnailAspectRatio): { width: number; height: number } {
  if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
  if (aspectRatio === '16:9') return { width: 1920, height: 1080 };
  throw Error('썸네일은 세로 9:16 또는 가로 16:9로 만들 수 있습니다.');
}

export function containImageRect(imageWidth: number, imageHeight: number, width: number, height: number): Rect {
  if (![imageWidth, imageHeight, width, height].every(value => Number.isFinite(value) && value > 0)) {
    throw Error('원본 이미지 크기를 확인할 수 없습니다.');
  }
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const fittedWidth = imageWidth * scale, fittedHeight = imageHeight * scale;
  return { x: (width - fittedWidth) / 2, y: (height - fittedHeight) / 2, width: fittedWidth, height: fittedHeight };
}

function titleLines(title: string, availableWidth: number, measure: (text: string) => number): string[] | undefined {
  const explicit = title.split('\n').map(line => line.trim());
  if (explicit.length === 2) return explicit.every(line => measure(line) <= availableWidth) ? explicit : undefined;
  const line = explicit[0];
  if (measure(line) <= availableWidth) return [line];
  const chars = Array.from(line);
  let best: { lines: string[]; score: number } | undefined;
  for (let i = 1; i < chars.length; i++) {
    const first = chars.slice(0, i).join('').trimEnd(), second = chars.slice(i).join('').trimStart();
    if (!first || !second) continue;
    const firstWidth = measure(first), secondWidth = measure(second);
    if (firstWidth > availableWidth || secondWidth > availableWidth) continue;
    // Prefer balanced lines and word boundaries without losing any visible text.
    const wordBoundary = /\s/u.test(chars[i - 1]) || /\s/u.test(chars[i]);
    const badPunctuation = /^[,.;:!?，。！？)\]}]/u.test(second) || /[(\[{]$/u.test(first);
    const score = Math.abs(firstWidth - secondWidth) + (wordBoundary ? 0 : availableWidth * .14) + (badPunctuation ? availableWidth : 0);
    if (!best || score < best.score) best = { lines: [first, second], score };
  }
  return best?.lines;
}

/** The same measured layout drives the JPEG shown in preview and downloaded. */
export function layoutThumbnailTitle(
  title: string, width: number, height: number, position: 'top' | 'bottom',
  measure: (text: string, fontSize: number) => number,
): ThumbnailTitleLayout {
  validateThumbnailTitle(title);
  if (![width, height].every(value => Number.isFinite(value) && value > 0) || !['top', 'bottom'].includes(position)) {
    throw Error('썸네일 제목 위치를 확인해주세요.');
  }
  const portrait = height > width;
  const maxFont = portrait ? 132 : 112, minFont = portrait ? 72 : 64;
  const horizontalMargin = width * .07, verticalMargin = height * .08;
  for (let fontSize = maxFont; fontSize >= minFont; fontSize -= 2) {
    const strokeWidth = Math.max(7, fontSize * .075);
    const lines = titleLines(title.trim(), width - horizontalMargin * 2 - strokeWidth * 2, text => {
      const measured = measure(text, fontSize);
      if (!Number.isFinite(measured) || measured < 0) throw Error('썸네일 글자 크기를 확인할 수 없습니다.');
      return measured;
    });
    if (!lines) continue;
    const lineHeight = Math.ceil(fontSize * 1.28), blockHeight = lineHeight * lines.length;
    if (blockHeight + verticalMargin * 2 + strokeWidth * 2 > height) continue;
    const y = position === 'top' ? verticalMargin : height - verticalMargin - blockHeight;
    const padding = Math.max(36, fontSize * .7);
    return { lines, fontSize, lineHeight, x: width / 2, y, strokeWidth,
      gradientStart: Math.max(0, y - padding), gradientEnd: Math.min(height, y + blockHeight + padding) };
  }
  throw Error('제목을 읽기 좋은 두 줄로 담기 어렵습니다. 문구를 짧게 줄이거나 줄바꿈을 바꿔주세요.');
}

function loadFont(): Promise<void> {
  if (!fontPromise) {
    fontPromise = (async () => {
      if (typeof FontFace === 'undefined' || !document.fonts) throw Error('이 브라우저에서 썸네일 글꼴을 불러올 수 없습니다.');
      const font = new FontFace(FONT_FAMILY, 'url("/fonts/Cafe24Ssurround.ttf")', { weight: '400' });
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([font.load(), new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(Error('썸네일 글꼴을 불러오지 못했습니다. 다시 시도해주세요.')), 15000);
        })]);
        document.fonts.add(font);
        if (font.status !== 'loaded' || !document.fonts.check(`400 100px "${FONT_FAMILY}"`, '썸네일 제목')) {
          throw Error('썸네일 글꼴을 확인할 수 없습니다.');
        }
      } finally { if (timeout) clearTimeout(timeout); }
    })().catch(cause => { fontPromise = undefined; throw cause; });
  }
  return fontPromise;
}

/** No URL supplied by an imported work file may trigger a remote image request. */
export function assertLocalThumbnailImage(source: string): void {
  const dataImage = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/u.test(source);
  const blobImage = /^blob:(?:https?:\/\/[^\s]+|null\/[^\s]+)$/u.test(source);
  if (!dataImage && !blobImage) throw Error('불러온 주요 장면 이미지만 썸네일로 사용할 수 있습니다.');
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  assertLocalThumbnailImage(source);
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => fail(), 15000);
    const clear = () => { clearTimeout(timer); image.onload = null; image.onerror = null; };
    const fail = () => { clear(); image.src = ''; reject(Error('원본 이미지를 읽지 못했습니다. 주요 장면 이미지를 다시 불러와주세요.')); };
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) { fail(); return; }
      clear(); resolve(image);
    };
    image.onerror = fail;
    image.src = source;
  });
}

export async function renderThumbnail(
  imageSrc: string, settings: Pick<ThumbnailSettings, 'title' | 'showTitle' | 'position'>, aspectRatio: ThumbnailAspectRatio,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { width, height } = thumbnailDimensions(aspectRatio);
  if (typeof settings.showTitle !== 'boolean') throw Error('썸네일 제목 표시 설정을 확인해주세요.');
  if (settings.showTitle) validateThumbnailTitle(settings.title);
  const image = await loadImage(imageSrc);
  if (settings.showTitle) await loadFont();
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw Error('이 브라우저에서 썸네일을 만들 수 없습니다.');
  try {
    context.fillStyle = '#241d1a'; context.fillRect(0, 0, width, height);
    const fitted = containImageRect(image.naturalWidth, image.naturalHeight, width, height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.drawImage(image, fitted.x, fitted.y, fitted.width, fitted.height);
    if (settings.showTitle) {
      const layout = layoutThumbnailTitle(settings.title, width, height, settings.position, (text, size) => {
        context.font = `400 ${size}px "${FONT_FAMILY}"`;
        return context.measureText(text).width;
      });
      const gradient = context.createLinearGradient(0, layout.gradientStart, 0, layout.gradientEnd);
      gradient.addColorStop(0, 'rgba(27, 15, 10, 0)');
      gradient.addColorStop(.28, 'rgba(27, 15, 10, 0.32)');
      gradient.addColorStop(.72, 'rgba(27, 15, 10, 0.32)');
      gradient.addColorStop(1, 'rgba(27, 15, 10, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, layout.gradientStart, width, layout.gradientEnd - layout.gradientStart);
      context.font = `400 ${layout.fontSize}px "${FONT_FAMILY}"`;
      context.textAlign = 'center'; context.textBaseline = 'middle';
      context.fillStyle = '#fff6d9'; context.strokeStyle = '#3d241d';
      context.lineWidth = layout.strokeWidth; context.lineJoin = 'round'; context.miterLimit = 2;
      layout.lines.forEach((line, index) => {
        const y = layout.y + layout.lineHeight * (index + .5);
        const metrics = context.measureText(line);
        const left = layout.x - metrics.actualBoundingBoxLeft - layout.strokeWidth / 2;
        const right = layout.x + metrics.actualBoundingBoxRight + layout.strokeWidth / 2;
        const top = y - metrics.actualBoundingBoxAscent - layout.strokeWidth / 2;
        const bottom = y + metrics.actualBoundingBoxDescent + layout.strokeWidth / 2;
        if (![left, right, top, bottom].every(Number.isFinite) || left < width * .04 || right > width * .96 || top < 0 || bottom > height) {
          throw Error('제목이 안전한 영역을 벗어났습니다. 문구를 짧게 줄여주세요.');
        }
        context.strokeText(line, layout.x, y); context.fillText(line, layout.x, y);
      });
    }
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => {
      if (!value || value.type !== 'image/jpeg' || !value.size) reject(Error('썸네일 JPG를 만들지 못했습니다. 다시 시도해주세요.'));
      else resolve(value);
    }, 'image/jpeg', .94));
    return { blob, width, height };
  } finally { canvas.width = 0; canvas.height = 0; }
}
