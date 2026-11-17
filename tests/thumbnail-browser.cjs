/* Browser regression: all fixtures are synthetic and no provider/API traffic is allowed.
 * CI installs Playwright separately; it is not a production dependency.
 * Run: node tests/thumbnail-browser.cjs
 * Syntax/import smoke check without Chromium: node tests/thumbnail-browser.cjs --check-harness
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'thumbnail-preview');
const storageKey = 'thumbnail-browser-synthetic';
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const dataBytes = data => Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
const asDataURL = file => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;
const harness = String.raw`
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Kling4Workspace } from '/src/workflow/Kling4Workspace';
import { validateKling4Plan } from '/src/kling4';
import '/src/index.css';
import '/src/compact-mobile.css';
import '/src/workflow/workflow.css';

const fixture = {
  workflow: 'kling4', duration: 5, aspectRatio: '9:16', title: '1화 딱 한 입만',
  location: 'Synthetic CI scene', scenario: 'Two unchanged synthetic keyframes.',
  instagramCaption: 'Synthetic fixture', hashtags: ['one','two','three','four','five'],
  continuity: 'Retain both synthetic reference images unchanged.',
  videoPrompt: 'Synthetic fixture only. Preserve this exact video prompt.',
  keyframes: [0, 5].map((time, index) => ({ time, title: index ? '마지막 장면' : '첫 장면',
    imageTitle: 'frame' + index, imagePrompt: 'Synthetic still ' + index,
    referencePlan: { background: null, props: [] }, backgroundAsset: 'none' })),
};
validateKling4Plan(fixture);
function fixtureImage(second: boolean) {
  const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = second ? '#49736a' : '#596784'; ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = '#e4c78b'; ctx.fillRect(0, 790, 900, 410);
  for (const [x, y, radius, color] of [[260,650,170,'#ffd45c'],[630,630,145,'#eee6cc'],[480,930,85,'#c36d45']] as const) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  // Corner markers make crop/contain regressions measurable in the clean JPEG.
  for (const [x,y,color] of [[0,0,'#ed2851'],[800,0,'#1bdab5'],[0,1100,'#5065ee'],[800,1100,'#f4b12c']] as const) {
    ctx.fillStyle = color; ctx.fillRect(x, y, 100, 100);
  }
  return canvas.toDataURL('image/png');
}
const images = { frame0: fixtureImage(false), frame1: fixtureImage(true) };
(window as any).qaForbidden = [];
function forbidden(action: string): never {
  (window as any).qaForbidden.push(action); throw Error('Unexpected action: ' + action);
}
function App() {
  const [raw, setRaw] = useState(() => localStorage.getItem('thumbnail-browser-synthetic') || JSON.stringify(fixture));
  const plan = JSON.parse(raw); validateKling4Plan(plan);
  (window as any).qaState = { plan, images };
  return <main className="ori-app" style={{ maxWidth: 860, margin: '24px auto', padding: 16 }}>
    <Kling4Workspace result={raw} episodeTitle="[에피소드 1] 1화 딱 한 입만" episodeThumbnail="딱 한 입만"
      images={images} onApply={async () => forbidden('modify original image')}
      onGenerate={() => forbidden('paid image generation')}
      onUpdate={value => {
        if ((window as any).failSave) throw Error('저장 공간이 부족합니다.');
        validateKling4Plan(JSON.parse(value)); localStorage.setItem('thumbnail-browser-synthetic', value); setRaw(value);
      }} />
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
`;

async function main() {
  const { createServer } = await import('vite');
  fs.mkdirSync(output, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(root, 'thumbnail-browser-fixture-'));
  const relative = path.basename(temporary);
  const errors = [], blockedRequests = [], checks = [];
  let server, browser, page;
  const report = { passed: false, checks, browserErrors: errors, blockedRequests };
  try {
    fs.writeFileSync(path.join(temporary, 'entry.tsx'), harness);
    fs.writeFileSync(path.join(temporary, 'index.html'), '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thumbnail browser regression</title></head><body><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>');
    server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false } });
    await server.listen();
    const address = server.httpServer.address();
    assert.ok(address && typeof address === 'object');
    const origin = `http://127.0.0.1:${address.port}`;
    const url = `${origin}/${relative}/index.html`;
    if (process.argv.includes('--check-harness')) {
      const transformed = await server.transformRequest(`/${relative}/entry.tsx`);
      assert.ok(transformed?.code.includes('Kling4Workspace'));
      for (const source of ['/src/thumbnail/ThumbnailEditor.tsx', '/src/workflow/Kling4Workspace.tsx', '/src/thumbnail/render.ts']) {
        assert.ok((await server.transformRequest(source))?.code, source);
      }
      console.log('Synthetic thumbnail harness/import smoke check passed; Chromium was not run.');
      return;
    }

    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
    await context.route('**/*', route => {
      const request = route.request(), requestURL = new URL(request.url());
      if (requestURL.origin === origin && request.method() === 'GET' && !requestURL.pathname.startsWith('/api/')) return route.continue();
      blockedRequests.push({ url: request.url(), method: request.method() });
      return route.abort('blockedbyclient');
    });
    const observe = target => { target.setDefaultTimeout(15000); target.on('pageerror', error => errors.push(error.message)); };
    page = await context.newPage(); observe(page);
    await page.goto(url);
    await page.waitForFunction(() => Boolean(window.qaState));
    const initial = await page.evaluate(() => window.qaState);
    const zipDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: '키프레임 전체 다운로드 (ZIP)', exact: true }).click();
    const zip = await zipDownload;
    assert.equal(zip.suggestedFilename(), '1화 딱 한 입만 키프레임 전체.zip');
    const zipPath = path.join(output, 'keyframes.zip');
    await zip.saveAs(zipPath);
    assert.equal(fs.readFileSync(zipPath).readUInt32LE(0), 0x04034b50);
    assert.deepEqual(await page.evaluate(() => window.qaState), initial);
    checks.push('All keyframes download as one ZIP without altering the plan or originals.');
    await page.getByRole('button', { name: /^2\. 끝/ }).click();
    await page.getByRole('button', { name: '이 장면으로 썸네일 만들기', exact: true }).click();

    const titled = page.getByRole('button', { name: '제목 포함 JPG 다운로드', exact: true });
    const clean = page.getByRole('button', { name: '글자 없는 JPG 다운로드', exact: true });
    const input = page.getByLabel('짧은 제목', { exact: true });
    const save = page.getByRole('button', { name: '썸네일 설정 저장', exact: true });
    const ready = async (target, label) => target.waitForFunction(name => [...document.querySelectorAll('button')].some(button => button.textContent === name && !button.disabled), label);
    const readyTitle = () => ready(page, '제목 포함 JPG 다운로드');
    const readyClean = target => ready(target, '글자 없는 JPG 다운로드');
    async function download(target, button, name) {
      const event = target.waitForEvent('download'); await button.click();
      const file = await event, destination = path.join(output, name);
      await file.saveAs(destination); assert.equal(await file.failure(), null);
      return { path: destination, filename: file.suggestedFilename(), hash: sha256(fs.readFileSync(destination)) };
    }
    async function previewHash(target) {
      const bytes = await target.locator('.ori-thumbnail-frame img').evaluate(async image => {
        const buffer = await fetch(image.src).then(response => response.arrayBuffer()); return Array.from(new Uint8Array(buffer));
      });
      return sha256(Buffer.from(bytes));
    }
    async function assertFitsViewport(target) {
      assert.equal(await target.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'editor must not overflow the viewport');
    }

    await readyTitle(); await readyClean(page);
    assert.equal(await input.inputValue(), '딱 한 입만');
    const top = await download(page, titled, 'thumbnail-top.jpg');
    assert.equal(top.hash, await previewHash(page), 'preview must show the exact downloaded JPEG');
    const cleanFile = await download(page, clean, 'thumbnail-clean.jpg');
    await page.getByRole('button', { name: '글자 없이', exact: true }).click();
    assert.equal(cleanFile.hash, await previewHash(page), 'clean preview must show the exact clean download');
    await page.getByRole('button', { name: '제목 포함', exact: true }).click();
    await assertFitsViewport(page);
    await page.locator('.ori-thumbnail-editor').screenshot({ path: path.join(output, 'mobile-editor.png') });
    const original = await download(page, page.getByRole('button', { name: '키프레임 원본 다운로드', exact: true }), 'original-frame1.png');
    assert.equal(original.hash, sha256(dataBytes(initial.images.frame1)), 'source download must preserve the exact original bytes');
    assert.notEqual(top.filename, original.filename); assert.notEqual(cleanFile.filename, original.filename);
    assert.deepEqual(await page.evaluate(() => window.qaState), initial, 'editing/exporting must not mutate images or plan');
    checks.push('mobile layout; exact preview/download bytes; separate filenames; original byte preservation');

    // fill() dispatches synchronously; the 150 ms render debounce must invalidate the old JPEG immediately.
    await input.fill('딱 한 입만!');
    assert.equal(await titled.isDisabled(), true, 'stale title export must be disabled immediately');
    await input.fill('딱 한 입만');
    await page.getByRole('button', { name: '아래쪽', exact: true }).click();
    await readyTitle();
    const bottom = await download(page, titled, 'thumbnail-bottom.jpg');
    assert.equal(bottom.hash, await previewHash(page));
    const pixels = await page.evaluate(async sources => {
      async function decode(source) {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data };
      }
      const clean = await decode(sources.clean), top = await decode(sources.top), bottom = await decode(sources.bottom);
      function difference(image, from, to) {
        let sum = 0, count = 0;
        for (let y = Math.floor(clean.height * from); y < clean.height * to; y += 3) for (let x = 0; x < clean.width; x += 3) {
          const offset = (y * clean.width + x) * 4;
          for (let channel = 0; channel < 3; channel++) { sum += Math.abs(image.data[offset + channel] - clean.data[offset + channel]); count++; }
        }
        return sum / count;
      }
      const sample = (x,y) => [...clean.data.slice((y * clean.width + x) * 4, (y * clean.width + x) * 4 + 3)];
      return { width: clean.width, height: clean.height,
        top: [difference(top,0,.3),difference(top,.7,1)], bottom: [difference(bottom,0,.3),difference(bottom,.7,1)],
        center: [difference(top,.4,.6),difference(bottom,.4,.6)],
        corners: [sample(60,300),sample(1020,300),sample(60,1620),sample(1020,1620)] };
    }, { clean: asDataURL(cleanFile.path), top: asDataURL(top.path), bottom: asDataURL(bottom.path) });
    assert.deepEqual([pixels.width, pixels.height], [1080, 1920]);
    assert.ok(pixels.top[0] > 1 && pixels.top[1] < .5, 'top title only changes the top area');
    assert.ok(pixels.bottom[1] > 1 && pixels.bottom[0] < .5, 'bottom title only changes the bottom area');
    assert.ok(pixels.center.every(value => value < .5), 'title treatment must leave the middle image untouched');
    const cornerColors = [[237,40,81],[27,218,181],[80,101,238],[244,177,44]];
    pixels.corners.forEach((color,index) => color.forEach((channel,i) => assert.ok(Math.abs(channel-cornerColors[index][i]) < 12, 'all four source corners must survive contain scaling')));
    checks.push('1080×1920 portrait; measured top/bottom title pixels; untouched middle; all four source corners retained');

    await save.click(); await page.getByText('썸네일 설정을 저장했습니다.', { exact: true }).waitFor();
    const saved = await page.evaluate(() => window.qaState.plan.thumbnailDesign);
    assert.deepEqual(saved, { imageTitle: 'frame1', title: '딱 한 입만', showTitle: true, position: 'bottom' });
    await input.fill('저장하지 않은 수정');
    assert.equal(await page.getByText('썸네일 설정을 저장했습니다.', { exact: true }).count(), 0);
    await page.getByRole('button', { name: '저장한 썸네일 열기·다운로드', exact: true }).click();
    assert.equal(await input.inputValue(), saved.title, 'reopen must discard the unsaved draft');
    await page.reload();
    await page.getByRole('button', { name: '저장한 썸네일 열기·다운로드', exact: true }).click();
    assert.equal(await input.inputValue(), saved.title, 'saved settings must survive reload');
    await input.fill('가'.repeat(80));
    await page.getByText('제목을 읽기 좋은 두 줄로 담기 어렵습니다.', { exact: false }).waitFor();
    assert.equal(await titled.isDisabled(), true); await readyClean(page);
    assert.equal(await save.isDisabled(), true, 'unrenderable title must not report a saved titled design');
    await page.getByRole('button', { name: '글자 없이', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '미리보기 다시 만들기', exact: true }).count(), 0);
    await input.fill('저장 실패 확인');
    await page.evaluate(() => { window.failSave = true; });
    await save.click(); await page.getByText('저장 공간이 부족합니다.', { exact: true }).waitFor();
    assert.equal(await page.getByText('썸네일 설정을 저장했습니다.', { exact: true }).count(), 0);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).thumbnailDesign, storageKey), saved);
    checks.push('save/reopen/reload; unsaved edits reset; overflow disables title only; failed save preserves prior settings without success message');

    await page.evaluate(key => {
      const plan = JSON.parse(localStorage.getItem(key)); plan.aspectRatio = '16:9'; localStorage.setItem(key, JSON.stringify(plan));
    }, storageKey);
    await page.setViewportSize({ width: 1280, height: 950 }); await page.reload();
    await page.getByRole('button', { name: '저장한 썸네일 열기·다운로드', exact: true }).click();
    await readyTitle(); await readyClean(page); await assertFitsViewport(page);
    await page.locator('.ori-thumbnail-editor').screenshot({ path: path.join(output, 'desktop-editor.png') });
    const landscape = await download(page, titled, 'thumbnail-landscape.jpg');
    assert.equal(landscape.hash, await previewHash(page));
    const landscapeSize = await page.locator('.ori-thumbnail-frame img').evaluate(image => [image.naturalWidth,image.naturalHeight]);
    assert.deepEqual(landscapeSize, [1920,1080]);
    const final = await page.evaluate(() => window.qaState);
    assert.deepEqual(final.images, initial.images); assert.deepEqual(final.plan.keyframes, initial.plan.keyframes);
    assert.equal(final.plan.videoPrompt, initial.plan.videoPrompt);
    checks.push('desktop layout; 1920×1080 landscape; keyframe/image/video prompt preservation');

    const fontFailure = await context.newPage(); observe(fontFailure);
    await fontFailure.route('**/fonts/Cafe24Ssurround.ttf', route => route.abort('failed'));
    await fontFailure.goto(url);
    await fontFailure.getByRole('button', { name: '이 장면으로 썸네일 만들기', exact: true }).click();
    await readyClean(fontFailure);
    await fontFailure.getByRole('button', { name: '미리보기 다시 만들기', exact: true }).waitFor();
    assert.equal(await fontFailure.getByRole('button', { name: '제목 포함 JPG 다운로드', exact: true }).isDisabled(), true);
    await fontFailure.getByRole('button', { name: '글자 없이', exact: true }).click();
    const fontClean = await download(fontFailure, fontFailure.getByRole('button', { name: '글자 없는 JPG 다운로드', exact: true }), 'thumbnail-font-failure-clean.jpg');
    assert.equal(fontClean.hash, await previewHash(fontFailure));
    await fontFailure.locator('.ori-thumbnail-editor').screenshot({ path: path.join(output, 'font-failure-clean.png') });
    assert.deepEqual(await page.evaluate(() => window.qaForbidden), []);
    assert.deepEqual(await fontFailure.evaluate(() => window.qaForbidden), []);
    assert.deepEqual(blockedRequests, []); assert.deepEqual(errors, []);
    checks.push('missing font fails closed for title while clean download works; zero paid/API/remote requests');
    Object.assign(report, { passed: true, browser: browser.version(), saved, pixels,
      files: { titled: top.filename, clean: cleanFile.filename, original: original.filename }, originalSha256: original.hash });
    console.log('Thumbnail browser regression passed; evidence: thumbnail-preview/');
  } catch (error) {
    report.error = error.stack || String(error);
    if (page) await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    if (!process.argv.includes('--check-harness')) fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    if (browser) await browser.close();
    if (server) await server.close();
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
