const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function compile(rel) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('.')
    ? compile(path.join(path.dirname(rel), name) + '.ts') : require(name), module, module.exports);
  return module.exports;
}
const { keyframeArchive } = compile('src/workflow/keyframeArchive.ts');
const { sceneImageName } = compile('src/workflow/share.ts');
const uri = (mime, bytes) => `data:${mime};base64,${bytes.toString('base64')}`;

test('a standard ZIP reader verifies Korean filenames, scene order, CRC and unchanged mixed image bytes', async () => {
  const originals = [
    Buffer.from('89504e470d0a1a0a00010203ff', 'hex'),
    Buffer.from('ffd8ffe00001020304ffd9', 'hex'),
    Buffer.from('524946460c000000574542505650382000010203', 'hex'),
  ];
  const images = {
    last: uri('image/webp', originals[2]),
    thumbnail: uri('image/png', Buffer.from('must not be exported')),
    first: uri('image/png', originals[0]),
    oldScene: uri('image/jpeg', Buffer.from('must not be exported either')),
    middle: uri('image/jpeg', originals[1]),
  };
  const before = JSON.stringify(images);
  const file = await keyframeArchive('내부 제목', ['first', 'middle', 'last'].map(imageTitle => ({ imageTitle })), images,
    '[에피소드 2] 2화 원장님의 피규어(하찮은 오리 일상)');
  assert.equal(file.name, '2화 원장님의 피규어 키프레임 전체.zip');
  assert.equal(file.type, 'application/zip');
  assert.equal(JSON.stringify(images), before);
  const checked = spawnSync('python3', ['-c', [
    'import base64, io, json, sys, zipfile',
    'with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as archive:',
    ' assert archive.testzip() is None',
    ' print(json.dumps([{"name": entry.filename, "method": entry.compress_type, "utf8": bool(entry.flag_bits & 0x800), "bytes": base64.b64encode(archive.read(entry)).decode()} for entry in archive.infolist()]))',
  ].join('\n')], { input: Buffer.from(await file.arrayBuffer()), maxBuffer: 1024 * 1024 });
  assert.equal(checked.status, 0, checked.stderr.toString());
  const entries = JSON.parse(checked.stdout.toString());
  assert.deepEqual(entries.map(entry => entry.name), [
    '2화 원장님의 피규어 01.png', '2화 원장님의 피규어 02.jpg', '2화 원장님의 피규어 03.webp',
  ]);
  entries.forEach((entry, index) => {
    assert.equal(entry.method, 0);
    assert.equal(entry.utf8, true);
    assert.deepEqual(Buffer.from(entry.bytes, 'base64'), originals[index]);
  });
});

test('an incomplete or malformed set never produces a partial archive', async () => {
  const good = uri('image/png', Buffer.from([137, 80, 78, 71]));
  const frames = [{ imageTitle: 'first' }, { imageTitle: 'second' }];
  await assert.rejects(keyframeArchive('시험', frames, { first: good }), /모든 키프레임/);
  for (const bad of ['https://example.com/file.png', 'data:image/png;base64,%%%', 'data:image/svg+xml;base64,AAAA', 'data:image/png;base64, ']) {
    await assert.rejects(keyframeArchive('시험', frames, { first: good, second: bad }), /2번 키프레임/);
  }
  await assert.rejects(keyframeArchive('시험', [], {}), /다운로드할 키프레임/);
  await assert.rejects(keyframeArchive('시험', Array(11).fill({ imageTitle: 'first' }), { first: good }), /다운로드할 키프레임/);
  await assert.rejects(keyframeArchive('시험', [{ imageTitle: 'inherited' }], Object.create({ inherited: good })), /모든 키프레임/);
});

test('existing single-frame filenames keep their episode numbering and path sanitization', () => {
  assert.equal(sceneImageName('내부 제목', 2, '[에피소드 2] 2화 제목(하찮은 오리 일상)'), '2화 제목 02');
  assert.equal(sceneImageName('번외 3화 시험', 10), '번외 03 시험 10');
  assert.equal(sceneImageName('../a/b\\c:*?"<>|', 1), '.. a b c 01');
  assert.equal(sceneImageName('', 1), '오리쇼츠 01');
});
