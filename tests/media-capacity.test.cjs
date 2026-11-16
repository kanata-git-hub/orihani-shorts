const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { once } = require('node:events');
const ts = require('typescript');
const root = path.resolve(__dirname, '..'), cache = new Map();
function compile(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText;
  new Function('require', 'module', 'exports', code)(
    n => n.startsWith('.') ? compile(path.join(path.dirname(rel), n) + '.ts') : require(n), m, m.exports);
  cache.set(rel, m.exports);
  return m.exports;
}
const { validateMediaSizes, clipLengths } = compile('src/editor/media.ts');
const { MAX_MEDIA_FILE_BYTES, MAX_MEDIA_REQUEST_BYTES, MAX_MEDIA_PAYLOAD_BYTES } = compile('src/editor/mediaLimits.ts');
const { downloadVideo } = compile('server/editor/download.ts');
const { defaultPlan, validatePlan, isKoreanDuration, KOREAN_VIDEO_DURATIONS } = compile('src/editor/model.ts');
const MiB = 1024 * 1024;

test('30-second inputs accept the reported 31,751,578-byte MP4 and the inclusive payload limit', () => {
  assert.equal(MAX_MEDIA_FILE_BYTES, MAX_MEDIA_PAYLOAD_BYTES);
  assert.equal(MAX_MEDIA_PAYLOAD_BYTES, 33_423_360);
  assert.equal(MAX_MEDIA_REQUEST_BYTES + 64 * 1024, 32 * MiB);
  assert.equal(MAX_MEDIA_PAYLOAD_BYTES + 64 * 1024, MAX_MEDIA_REQUEST_BYTES);
  assert.ok(MAX_MEDIA_REQUEST_BYTES < 32 * MiB, 'leave headroom below the hosting HTTP/1 request ceiling');
  for (const size of [10_000_000, 15_000_000, 30_000_000, 31_751_578, MAX_MEDIA_FILE_BYTES]) {
    assert.doesNotThrow(() => validateMediaSizes([{ size }], 30, 0, 'single'));
  }
  assert.throws(() => validateMediaSizes([{ size: MAX_MEDIA_FILE_BYTES + 1 }], 30, 0, 'single'), /33\.4MB/);
  assert.throws(() => validateMediaSizes([{ size: 0 }], 30, 0, 'single'));
  const sourceSize = 31_751_578, voiceSize = MAX_MEDIA_PAYLOAD_BYTES - sourceSize;
  assert.doesNotThrow(() => validateMediaSizes([{ size: sourceSize }], 30, voiceSize, 'single'));
  assert.throws(() => validateMediaSizes([{ size: sourceSize }], 30, voiceSize + 1, 'single'), /합계/);
  assert.throws(() => validateMediaSizes([{ size: MAX_MEDIA_FILE_BYTES }], 30, 1, 'single'), /합계/);
  assert.deepEqual(clipLengths(15), [4, 4, 3, 4]);
  assert.deepEqual(clipLengths(15, 'single'), [15]);
  assert.deepEqual(clipLengths(30, 'single'), [30]);
  assert.doesNotThrow(() => validateMediaSizes(Array.from({ length: 4 }, () => ({ size: 7 * MiB })), 15));
});

test('Korean preset accepts 12, 15 and 30 seconds with a caption reaching the last frame', () => {
  assert.deepEqual(KOREAN_VIDEO_DURATIONS, [12, 15, 30]);
  assert.equal(isKoreanDuration(30), true);
  assert.equal(isKoreanDuration('30'), false);
  assert.equal(isKoreanDuration(5), false);
  for (const duration of KOREAN_VIDEO_DURATIONS) {
    const plan = {
      ...defaultPlan(), duration, videoLayout: 'single', captionStyle: 'korean',
      headline: ['눈은 치웠는데', '길이 사라졌다'], aspectRatio: '9:16', originalVolume: 1,
      captions: [{ start: duration - 2, end: duration, text: '와, 편하다.', source: 'screen' }]
    };
    assert.doesNotThrow(() => validatePlan(plan));
    assert.throws(() => validatePlan({ ...plan, captions: [{ ...plan.captions[0], end: duration + .1 }] }));
    assert.throws(() => validatePlan({ ...plan, originalVolume: .2 }));
  }
});

// Use an actual HTTP socket so backpressure, chunked headers and disconnects are
// exercised. This is the same awaited helper/finally ordering as the render route.
async function fixture(t, { missing = false, directory = false } = {}) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'ori-download-test-'));
  const file = path.join(dir, 'result.mp4');
  const expectedHash = createHash('sha256');
  const chunk = Buffer.alloc(MiB, 0x63);
  if (directory) await fsp.mkdir(file);
  else if (!missing) {
    const handle = await fsp.open(file, 'w');
    try {
      for (let i = 0; i < 40; i++) {
        await handle.writeFile(chunk);
        expectedHash.update(chunk);
      }
    } finally { await handle.close(); }
  }
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  const state = { active: 0, settled: false, error: undefined, abort: undefined };
  const server = http.createServer(async (req, res) => {
    state.active++;
    const abort = state.abort = new AbortController();
    const cancel = () => { if (!res.writableFinished) abort.abort(); };
    res.on('close', cancel);
    try {
      await downloadVideo(file, res, abort.signal);
    } catch (error) {
      state.error = error;
      if (!res.headersSent && !res.destroyed && !res.writableEnded) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    } finally {
      res.off('close', cancel);
      state.active--;
      await fsp.rm(dir, { recursive: true, force: true });
      state.settled = true;
      finish();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fsp.rm(dir, { recursive: true, force: true });
  });
  return { url: 'http://127.0.0.1:' + server.address().port, file, dir, state, done, hash: expectedHash.digest('hex') };
}
function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { agent: false }, response => resolve(response)).on('error', reject);
  });
}
function pausedAfterFirstChunk(response) {
  response.on('error', () => {});
  return new Promise((resolve, reject) => {
    response.once('error', reject);
    response.once('data', () => { response.pause(); resolve(); });
  });
}

test('40 MiB export is complete, hashed and sent with chunked transfer instead of Content-Length', { timeout: 15000 }, async t => {
  const f = await fixture(t);
  const response = await request(f.url);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'video/mp4');
  assert.equal(response.headers['content-disposition'], 'attachment; filename="orihani-edited.mp4"');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['content-length'], undefined);
  assert.equal(response.headers['transfer-encoding'], 'chunked');
  let bytes = 0;
  const hash = createHash('sha256');
  for await (const chunk of response) { bytes += chunk.length; hash.update(chunk); }
  await f.done;
  assert.equal(bytes, 40 * MiB);
  assert.equal(hash.digest('hex'), f.hash);
  assert.equal(f.state.error, undefined);
  assert.equal(f.state.active, 0);
  assert.equal(fs.existsSync(f.dir), false);
});

test('a paused receiver keeps the export and slot alive; disconnect closes the stream before cleanup', { timeout: 15000 }, async t => {
  const f = await fixture(t);
  const response = await request(f.url);
  await pausedAfterFirstChunk(response);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(f.state.settled, false);
  assert.equal(f.state.active, 1);
  assert.equal(fs.existsSync(f.file), true);
  response.destroy();
  await f.done;
  assert.ok(f.state.error, 'pipeline rejects a premature receiver disconnect');
  assert.equal(f.state.active, 0);
  assert.equal(fs.existsSync(f.dir), false);
});

test('deadline cancellation aborts an active download and releases its temporary export', { timeout: 15000 }, async t => {
  const f = await fixture(t);
  const response = await request(f.url);
  await pausedAfterFirstChunk(response);
  assert.equal(f.state.settled, false);
  f.state.abort.abort();
  await f.done;
  response.destroy();
  assert.equal(f.state.error?.name, 'AbortError');
  assert.equal(f.state.active, 0);
  assert.equal(fs.existsSync(f.dir), false);
});

test('missing or non-file output fails before download headers, leaving a readable JSON error', { timeout: 15000 }, async t => {
  for (const options of [{ missing: true }, { directory: true }]) {
    const f = await fixture(t, options);
    const response = await request(f.url);
    assert.equal(response.statusCode, 500);
    assert.equal(response.headers['content-type'], 'application/json');
    assert.equal(response.headers['content-disposition'], undefined);
    let body = '';
    for await (const chunk of response) body += chunk;
    assert.equal(typeof JSON.parse(body).error, 'string');
    await f.done;
    assert.ok(f.state.error);
    assert.equal(f.state.active, 0);
    assert.equal(fs.existsSync(f.dir), false);
  }
});
