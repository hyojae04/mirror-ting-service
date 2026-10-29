import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { startVite } from './serviceEntryRouteHarness.js';

test('device modal handles denied, partial, interrupted and late permissions without leaving devices running', { timeout: 60000 }, async t => {
  const { server, url } = await startVite();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  t.after(async () => { await browser.close(); await server.close(); });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera', 'microphone'] });
  await context.addInitScript(() => {
    window.captureCount = 0;
    window.realCapture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async () => { window.captureCount++; throw new DOMException('Test denial', 'NotAllowedError'); };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}src/previews/device-check/index.html`);
  const modal = page.getByRole('dialog', { name: '대화를 시작할 준비가 됐나요?' });
  await modal.waitFor();
  assert.equal(await modal.getByRole('button', { name: '카메라·마이크 허용하기', exact: true }).evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => window.captureCount), 0);
  await modal.getByRole('button', { name: '카메라·마이크 허용하기', exact: true }).click();
  assert.match(await modal.getByRole('alert').innerText(), /권한이 차단/);
  assert.equal(await modal.getByRole('button', { name: '시뮬레이션 시작', exact: true }).count(), 0);
  await page.screenshot({ path: '/private/tmp/mirror-device-modal-denied-mobile.png' });

  // A successful permission request must still provide both required tracks.
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const stream = await window.realCapture({ video: true, audio: false });
      window.partialStream = stream;
      return stream;
    };
  });
  await modal.getByRole('button', { name: '다시 연결하기' }).click();
  await modal.getByRole('alert').filter({ hasText: '모두 연결' }).waitFor();
  assert.equal(await page.evaluate(() => window.partialStream.getTracks().every(track => track.readyState === 'ended')), true);

  // Cancelling while the browser prompt is open invalidates its late response.
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = constraints => new Promise(resolve => {
      window.finishPermission = async () => { window.lateStream = await window.realCapture(constraints); resolve(window.lateStream); };
    });
  });
  await modal.getByRole('button', { name: '다시 연결하기' }).click();
  await page.waitForFunction(() => Boolean(window.finishPermission));
  await page.keyboard.press('Escape');
  await modal.waitFor({ state: 'hidden' });
  await page.evaluate(() => window.finishPermission());
  await page.waitForFunction(() => window.lateStream?.getTracks().every(track => track.readyState === 'ended'));

  await page.getByRole('button', { name: '장치 확인 모달 열기' }).click();
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.realCapture; });
  await modal.getByRole('button', { name: '카메라·마이크 허용하기', exact: true }).click();
  await modal.getByLabel('내 모습이 잘 보여요').waitFor();
  await page.evaluate(() => { window.liveStream = document.querySelector('video[aria-label="장치 확인 카메라 미리보기"]').srcObject; });
  await modal.getByLabel('내 모습이 잘 보여요').check();
  await modal.getByLabel('마이크 입력을 확인했어요').check();
  await page.screenshot({ path: '/private/tmp/mirror-device-modal-ready-mobile.png' });
  await page.evaluate(() => window.liveStream.getVideoTracks()[0].dispatchEvent(new Event('ended')));
  await modal.getByRole('alert').filter({ hasText: '연결이 끊겼어요' }).waitFor();
  assert.equal(await page.evaluate(() => window.liveStream.getTracks().every(track => track.readyState === 'ended')), true);
  assert.equal(await modal.getByRole('button', { name: '시뮬레이션 시작', exact: true }).count(), 0);

  await modal.getByRole('button', { name: '다시 연결하기' }).click();
  await modal.getByLabel('내 모습이 잘 보여요').check();
  await modal.getByLabel('마이크 입력을 확인했어요').check();
  await page.evaluate(() => { window.confirmedStream = document.querySelector('video[aria-label="장치 확인 카메라 미리보기"]').srcObject; });
  await modal.getByRole('button', { name: '시뮬레이션 시작', exact: true }).click();
  await modal.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => window.confirmedStream.getTracks().every(track => track.readyState === 'ended')), true);
  assert.match(await page.getByRole('status').innerText(), /장치 확인을 마쳤어요/);
  assert.deepEqual(errors, []);
});
