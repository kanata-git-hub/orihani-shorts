import { open } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { pipeline } from 'node:stream/promises';

// A finished export can be larger than its input. Stream without Content-Length
// so Cloud Run's HTTP/1 non-streaming 32 MiB response limit does not truncate it.
// The caller retains its timeout/active slot/temp directory until this settles.
export async function downloadVideo(file: string, response: ServerResponse, signal?: AbortSignal) {
  signal?.throwIfAborted();
  // Open before changing response headers, so missing files can still return JSON.
  const handle = await open(file, 'r');
  try {
    if (!(await handle.stat()).isFile()) throw Error('완성 영상 파일을 읽지 못했습니다.');
    signal?.throwIfAborted();
    response.setHeader('Content-Type', 'video/mp4');
    response.setHeader('Content-Disposition', 'attachment; filename="orihani-edited.mp4"');
    response.setHeader('Cache-Control', 'no-store');
    response.removeHeader('Content-Length');
    // Node selects chunked transfer for HTTP/1; pipeline preserves backpressure
    // and rejects on a disconnect/abort before the caller cleans up the file.
    await pipeline(handle.createReadStream(), response, { signal });
  } finally {
    await handle.close();
  }
}
