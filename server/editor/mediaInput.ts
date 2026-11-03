// Cap decoded frames before probing or decoding; compressed upload size alone does not bound memory.
// 4096 x 2304 admits 4K input as well as the normal vertical 1080p clips.
export function uploadedMediaInput(file: string, allowAudioFile = true): string[] {
  return [
    '-protocol_whitelist', 'file', '-format_whitelist', allowAudioFile ? 'mov,matroska,webm,wav' : 'mov,matroska,webm',
    '-max_pixels:v', String(4096 * 2304), '-threads:v', '2', '-i', file,
  ];
}
