import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EditPlan } from '../../src/editor/model';
import { cleanPlanText, validatePlan } from '../../src/editor/model';
import { uploadedMediaInput } from './mediaInput';
import { runMediaProcess } from './mediaProcess';

type Layout = { koreanTitlePreset?: 'balanced' | 'wide'; headlineInkWidths?: number[] | null; titleY: [number, number]; headlineFontSizes: number[]; captionFontSizes: number[]; titleTopInkY: number; maximumCaptionBottomInkY: number; balancedOuterMarginPx: number; horizontalCenter: number };
type Overlay = { path: string; start: number; end?: number; kind: 'headline' | 'caption' };
const ffmpeg = () => process.env.FFMPEG_PATH || 'ffmpeg';
function run(binary: string, args: string[], cwd: string, signal?: AbortSignal) {
  return runMediaProcess(binary, args, cwd, signal, log =>
    log.match(/KOREAN_CAPTION_ERROR:([^\r\n]+)/)?.[1] || '한국판 자막 처리에 실패했습니다. 파일과 서버 설정을 확인해주세요.');
}
function requireKorean(plan: EditPlan) {
  validatePlan(plan);
  if (plan.captionStyle !== 'korean') throw Error('한국판 자막을 선택해주세요.');
}

// Match the approved ASS/libass output, including measured visible-ink margins.
// Preview and export share the exact font, sizing and geometry; no paid services.
export async function generateKoreanCaptions(plan: EditPlan, dir: string, preview = false, signal?: AbortSignal, duration = plan.duration as number): Promise<{ ass: string; layout: Layout; overlays: Overlay[] }> {
  const p = cleanPlanText(plan);
  requireKorean(p);
  await mkdir(path.join(dir, 'fonts'), { recursive: true });
  await copyFile(path.resolve('public/fonts/Cafe24Ssurround.ttf'), path.join(dir, 'fonts/Cafe24Ssurround.ttf'));
  await writeFile(path.join(dir, 'korean-request.json'), JSON.stringify({
    headline: p.headline, duration, koreanTitlePreset: p.koreanTitlePreset,
    captions: p.captions.map(c => ({...c, end: Math.abs(c.end - p.duration) < 0.000001 ? duration : c.end})),
  }));
  const script = path.resolve('scripts/render-korean-captions.py');
  const python = process.env.EDITOR_PYTHON_PATH || 'python3';
  await run(python, [script, 'prepare', dir], dir, signal);
  let layout: Layout | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    await run(ffmpeg(), ['-hide_banner', '-loglevel', 'error', '-y', '-nostdin', '-f', 'lavfi', '-i', 'color=black:s=1080x1920:r=24',
      '-vf', 'ass=korean-geometry.ass:fontsdir=fonts', '-frames:v', '1', '-threads', '1', 'korean-geometry.png'], dir, signal);
    const measured = JSON.parse((await run(python, [script, 'finish', dir], dir, signal)).trim());
    if (!measured.needsCalibration) { layout = measured; break; }
  }
  if (!layout) throw Error('제목 크기를 맞추지 못했습니다. 문구를 짧게 다듬어주세요.');
  if (!Array.isArray(layout.titleY) || layout.titleY.length !== 2 || layout.titleY.some(y => !Number.isFinite(y)) || layout.horizontalCenter !== 540) throw Error('한국판 자막 배치를 확인하지 못했습니다.');
  const overlays: Overlay[] = [];
  if (preview) {
    // One transparent static layer plus one transparent frame per timed caption.
    await run(ffmpeg(), ['-hide_banner', '-loglevel', 'error', '-y', '-nostdin', '-f', 'lavfi', '-i', 'color=black@0:s=1080x1920:r=1,format=rgba',
      '-vf', 'ass=korean-preview.ass:fontsdir=fonts:alpha=1', '-frames:v', String(p.captions.length + 1), '-threads', '1', 'korean-preview-%02d.png'], dir, signal);
    overlays.push({ path: path.join(dir, 'korean-preview-01.png'), start: 0, kind: 'headline' });
    p.captions.forEach((c, i) => overlays.push({ path: path.join(dir, `korean-preview-${String(i + 2).padStart(2, '0')}.png`), start: c.start, end: c.end, kind: 'caption' }));
  }
  return { ass: path.join(dir, 'korean-captions.ass'), layout, overlays };
}

type Media = { duration: number; width: number; height: number; audioCodec?: string };
async function inspect(file: string, cwd: string, signal?: AbortSignal): Promise<Media> {
  const log = await run(ffmpeg(), ['-hide_banner', ...uploadedMediaInput(file, false), '-map', '0:v:0', '-t', '0.05', '-f', 'null', '-'], cwd, signal);
  const input = log.split(/Stream mapping:|Output #/)[0];
  const duration = input.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const video = input.split(/\r?\n/).find(line => /Stream #0:\d.*Video:/.test(line)) || '';
  const size = video.match(/, (\d{2,5})x(\d{2,5})(?:[\s,]|$)/);
  if (!duration || !size) throw Error('원본 영상의 길이와 크기를 확인하지 못했습니다.');
  return { duration: Number(duration[1])*3600 + Number(duration[2])*60 + Number(duration[3]), width: Number(size[1]), height: Number(size[2]),
    audioCodec: input.match(/Stream #0:\d[^\r\n]*Audio: ([a-z0-9_]+)/)?.[1] };
}

export async function renderKorean(plan: EditPlan, videos: string[], voice: string | undefined, dir: string, signal?: AbortSignal) {
  const p = cleanPlanText(plan);
  requireKorean(p);
  if (videos.length !== 1 || voice) throw Error('한국판 자막에는 별도 음성 없이 완성 영상 한 개를 넣어주세요.');
  const media = await inspect(videos[0], dir, signal);
  if (media.duration < 14.85 || media.duration > 15.5) throw Error('한국판에는 15초 원본 영상을 넣어주세요.');
  if (media.width !== 1080 || media.height !== 1920) throw Error('한국판에는 1080×1920 세로 9:16 원본을 넣어주세요. 화면을 임의로 자르거나 줄이지 않습니다.');
  if (media.audioCodec && media.audioCodec !== 'aac') throw Error('원본 소리를 그대로 유지하려면 AAC 소리가 포함된 MP4 영상을 넣어주세요.');
  if (p.captions.some(c => c.start >= media.duration || (c.end !== p.duration && c.end > media.duration + 0.02))) throw Error('자막 시간이 원본 영상 길이를 벗어납니다.');
  await generateKoreanCaptions(p, dir, false, signal, media.duration);
  const output = path.join(dir, 'finished.mp4');
  await run(ffmpeg(), ['-hide_banner', '-y', '-nostdin', ...uploadedMediaInput(videos[0], false),
    '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '0', '-vf', 'ass=korean-captions.ass:fontsdir=fonts',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-fps_mode', 'passthrough', '-c:a', 'copy', '-threads', '2',
    '-movflags', '+faststart+use_metadata_tags', output], dir, signal);
  const finished = await inspect(output, dir, signal);
  if (Math.abs(finished.duration - media.duration) > 0.03 || finished.width !== media.width || finished.height !== media.height || finished.audioCodec !== media.audioCodec) throw Error('원본 길이·크기·소리 보존 검증에 실패했습니다.');
  return output;
}
