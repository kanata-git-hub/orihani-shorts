import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { EditPlan } from '../../src/editor/model';
import { cleanPlanText, validatePlan } from '../../src/editor/model';
import { uploadedMediaInput } from './mediaInput';
import { runMediaProcess } from './mediaProcess';

const ffmpeg = () => process.env.FFMPEG_PATH || 'ffmpeg';
function run(args: string[], cwd: string, signal?: AbortSignal) {
  return runMediaProcess(ffmpeg(), args, cwd, signal, () => '화면 자막 처리에 실패했습니다. MP4 파일과 자막 시간을 확인해주세요.');
}
async function inspect(file: string, cwd: string, signal?: AbortSignal) {
  const log = await run(['-hide_banner', ...uploadedMediaInput(file, false), '-map', '0:v:0', '-t', '0.05', '-f', 'null', '-'], cwd, signal);
  const input = log.split(/Stream mapping:|Output #/)[0];
  const duration = input.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const video = input.split(/\r?\n/).find(line => /Stream #0:\d.*Video:/.test(line)) || '';
  const size = video.match(/, (\d{2,5})x(\d{2,5})(?:[\s,]|$)/);
  const audioCodec = input.match(/Stream #0:\d[^\r\n]*Audio: ([a-z0-9_]+)/)?.[1];
  if (!duration || !size) throw Error('원본 영상의 길이와 크기를 확인하지 못했습니다.');
  return { duration: +duration[1] * 3600 + +duration[2] * 60 + +duration[3], width: +size[1], height: +size[2], audioCodec };
}

// Manual screen captions never call speech generation, transcription or a model.
// The original duration, dimensions and audio are preserved. With no captions,
// the video stream itself is copied rather than encoded again.
export async function renderScreen(plan: EditPlan, videos: string[], voice: string | undefined, dir: string,
  subtitles: (plan: EditPlan) => string, signal?: AbortSignal) {
  const p = cleanPlanText(plan);
  validatePlan(p);
  if (p.captionStyle !== 'screen' || videos.length !== 1 || voice) throw Error('화면 자막에는 별도 음성 없이 완성 영상 한 개를 넣어주세요.');
  const source = await inspect(videos[0], dir, signal);
  if (source.duration < p.duration - 0.15 || source.duration > p.duration + 0.5) throw Error('원본 영상 길이가 선택한 길이와 다릅니다. 영상과 제작안을 확인해주세요.');
  const landscape = p.aspectRatio === '16:9';
  const maxWidth = landscape ? 1920 : 1080, maxHeight = landscape ? 1080 : 1920;
  if (source.width > maxWidth || source.height > maxHeight || source.width % 2 || source.height % 2 || Math.abs(source.width / source.height - maxWidth / maxHeight) > 0.002) {
    throw Error(`선택한 화면 비율에 맞는 ${maxWidth}×${maxHeight} 이하의 ${landscape ? '가로 16:9' : '세로 9:16'} MP4 영상을 넣어주세요. 원본 화면을 잘라 맞추지는 않습니다.`);
  }
  if (source.audioCodec && source.audioCodec !== 'aac') throw Error('원본 소리를 그대로 유지하려면 AAC 소리가 포함된 MP4 영상을 넣어주세요.');
  if (p.captions.some(c => c.start >= source.duration || (Math.abs(c.end - p.duration) > 0.000001 && c.end > source.duration + 0.02))) throw Error('자막 시간이 원본 영상 길이를 벗어납니다.');
  const output = path.join(dir, 'finished.mp4');
  const args = ['-hide_banner', '-y', '-nostdin', ...uploadedMediaInput(videos[0], false), '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '0'];
  if (p.captions.length) {
    const timed = { ...p, captions: p.captions.map(c => ({ ...c, end: Math.abs(c.end - p.duration) < 0.000001 ? source.duration : c.end })) };
    await writeFile(path.join(dir, 'captions.ass'), subtitles(timed));
    args.push('-vf', 'ass=captions.ass', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-fps_mode', 'passthrough', '-c:a', 'copy', '-threads', '2');
  } else args.push('-c', 'copy');
  args.push('-movflags', '+faststart+use_metadata_tags', output);
  await run(args, dir, signal);
  const finished = await inspect(output, dir, signal);
  if (Math.abs(finished.duration - source.duration) > 0.03 || finished.width !== source.width || finished.height !== source.height || finished.audioCodec !== source.audioCodec) throw Error('원본 길이·크기·소리 보존 검증에 실패했습니다.');
  return output;
}
