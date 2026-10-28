import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EditPlan } from '../../src/editor/model';
import { cleanPlanText, validatePlan } from '../../src/editor/model';

type ClinicPlan = EditPlan & { captionStyle?: 'clinic' | 'legacy'; clinicBrandStart?: number };
export type ClinicOverlays = {
  captions: { path: string; start: number; end: number; fontSize: number }[];
  brand?: { path: string; start: number };
};

const ffmpeg = () => process.env.FFMPEG_PATH || 'ffmpeg';
const appPath = (relative: string) => path.resolve(process.cwd(), relative);

// The CLI receives only fixed local file paths; caption text is carried in JSON.
// Nothing in this path calls a model, transcription or speech service.
async function run(binary: string, args: string[], cwd: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, windowsHide: true, signal, env: { ...process.env, PYTHONUTF8: '1' } });
    let log = '';
    const collect = (chunk: Buffer) => { log = (log + chunk.toString('utf8')).slice(-24000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => child.kill('SIGKILL'), 240000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) { resolve(log); return; }
      const detail = log.match(/CLINIC_CAPTION_ERROR:([^\r\n]+)/)?.[1];
      reject(Error(detail || '한의원 자막 처리에 실패했습니다. 파일 형식과 서버 설정을 확인해주세요.', { cause: log }));
    });
  });
}

function requireClinic(p: ClinicPlan) {
  validatePlan(p);
  if (p.captionStyle !== 'clinic' || p.videoLayout !== 'single') throw Error('한의원 자막은 전체 영상 한 개에 적용해주세요.');
  if (p.narration.trim()) throw Error('한의원 자막은 원본 소리를 유지합니다. 별도 해설은 기존 자막 모드에서 사용해주세요.');
  if (p.originalVolume !== 1) throw Error('한의원 자막은 원본 음량 100%로 적용해주세요.');
  if (p.clinicBrandStart !== undefined && (!Number.isFinite(p.clinicBrandStart) || p.clinicBrandStart < 0 || p.clinicBrandStart >= p.duration + 0.5)) {
    throw Error('오리한의원 표시 시작 시간을 확인해주세요.');
  }
}

export async function generateClinicOverlays(plan: EditPlan, dir: string, signal?: AbortSignal): Promise<ClinicOverlays> {
  const p: ClinicPlan = cleanPlanText(plan);
  requireClinic(p);
  const request = path.join(dir, 'clinic-captions.json');
  await writeFile(request, JSON.stringify({ captions: p.captions.map(c => c.text), brand: p.clinicBrandStart !== undefined }), 'utf8');
  const output = await run(process.env.EDITOR_PYTHON_PATH || 'python3', [appPath('scripts/render-clinic-captions.py'), request, dir], dir, signal);
  const payload = JSON.parse(output.trim());
  if (!Array.isArray(payload.captions) || payload.captions.length !== p.captions.length) throw Error('자막 이미지 생성 결과를 확인하지 못했습니다.');
  return {
    captions: p.captions.map((caption, index) => ({
      path: path.join(dir, 'clinic-caption-' + index + '.png'),
      start: caption.start, end: caption.end, fontSize: payload.captions[index].fontSize,
    })),
    ...(p.clinicBrandStart !== undefined ? { brand: { path: path.join(dir, 'clinic-brand.png'), start: p.clinicBrandStart } } : {}),
  };
}

type Media = { duration: number; width: number; height: number; audio: boolean; audioCodec?: string };
async function inspectClinic(file: string, cwd: string, signal?: AbortSignal): Promise<Media> {
  const log = await run(ffmpeg(), [
    '-hide_banner', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm',
    '-i', file, '-map', '0:v:0', '-t', '0.05', '-f', 'null', '-',
  ], cwd, signal);
  // Read input streams only; FFmpeg's null output may have different descriptors.
  const input = log.split(/Stream mapping:|Output #/)[0];
  const duration = input.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const video = input.split(/\r?\n/).find(line => /Stream #0:\d.*Video:/.test(line)) || '';
  const size = video.match(/, (\d{2,5})x(\d{2,5})(?:[\s,]|$)/);
  const audioCodec = input.match(/Stream #0:\d[^\r\n]*Audio: ([a-z0-9_]+)/)?.[1];
  if (!duration || !size) throw Error('원본 영상의 길이와 크기를 확인하지 못했습니다.');
  return {
    duration: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]),
    width: Number(size[1]), height: Number(size[2]), audio: !!audioCodec, audioCodec,
  };
}

export async function renderClinic(plan: EditPlan, videos: string[], voice: string | undefined, dir: string, signal?: AbortSignal) {
  const p: ClinicPlan = cleanPlanText(plan);
  requireClinic(p);
  if (videos.length !== 1) throw Error('한의원 자막에는 완성된 영상 한 개를 넣어주세요.');
  if (voice) throw Error('한의원 자막은 추가 음성 없이 원본 소리를 유지합니다.');
  const media = await inspectClinic(videos[0], dir, signal);
  if (media.duration < p.duration - 0.15 || media.duration > p.duration + 0.5) throw Error('원본 영상 길이가 선택한 길이와 다릅니다. 영상과 제작안을 확인해주세요.');
  if (media.width > 1080 || media.height > 1920 || media.width % 2 || media.height % 2 || Math.abs(media.width / media.height - 9 / 16) > 0.002) {
    throw Error('한의원 자막에는 1080×1920 이하의 세로 9:16 MP4 영상을 넣어주세요.');
  }
  if (media.audio && media.audioCodec !== 'aac') throw Error('원본 소리를 그대로 유지하려면 AAC 소리가 포함된 MP4 영상을 넣어주세요.');
  if (p.captions.some(c => c.start >= media.duration || (Math.abs(c.end - p.duration) > 0.000001 && c.end > media.duration + 0.02)) ||
      (p.clinicBrandStart !== undefined && p.clinicBrandStart >= media.duration)) {
    throw Error('자막 또는 오리한의원 표시 시간이 원본 영상 길이를 벗어납니다.');
  }
  const overlays = await generateClinicOverlays(p, dir, signal);
  const layers = [
    ...overlays.captions.map(c => ({ ...c, end: Math.abs(c.end - p.duration) < 0.000001 ? undefined : c.end })),
    ...(overlays.brand ? [{ ...overlays.brand, end: undefined }] : []),
  ];
  const output = path.join(dir, 'finished.mp4');
  const args = ['-hide_banner', '-y', '-nostdin', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm', '-i', videos[0]];
  if (!layers.length) {
    await run(ffmpeg(), [...args, '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '0', '-c', 'copy', '-movflags', '+faststart+use_metadata_tags', output], dir, signal);
  } else {
    for (const layer of layers) args.push('-i', layer.path);
    const filters: string[] = [];
    layers.forEach((layer, i) => {
      const label = 'caption' + i;
      filters.push('[' + (i + 1) + ':v]scale=' + media.width + ':' + media.height + ':flags=lanczos,format=rgba[' + label + ']');
      const begin = Math.max(0, layer.start - 0.000001);
      const condition = 'gte(t,' + begin + ')' + (layer.end === undefined ? '' : '*lt(t,' + Math.max(0, layer.end - 0.000001) + ')');
      filters.push('[' + (i === 0 ? '0:v' : 'v' + i) + '][' + label + ']overlay=0:0:eof_action=repeat:enable=\'' + condition + '\'[v' + (i + 1) + ']');
    });
    await run(ffmpeg(), [...args,
      '-filter_complex_threads', '1', '-filter_complex', filters.join(';'),
      '-map', '[v' + layers.length + ']', '-map', '0:a?', '-map_metadata', '0',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-fps_mode', 'passthrough', '-c:a', 'copy', '-threads', '2',
      '-movflags', '+faststart+use_metadata_tags', output,
    ], dir, signal);
  }
  const finished = await inspectClinic(output, dir, signal);
  if (Math.abs(finished.duration - media.duration) > 0.03 || finished.width !== media.width || finished.height !== media.height || finished.audio !== media.audio) {
    throw Error('원본 길이·크기·소리 보존 검증에 실패했습니다.');
  }
  return output;
}
