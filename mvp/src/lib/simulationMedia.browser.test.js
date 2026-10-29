import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { startVite } from './serviceEntryRouteHarness.js';

const draft = { job_role: '개발자', situation: '조퇴 요청', context: '몸이 아파 팀장에게 조퇴를 요청함', goal: '조퇴 일정 합의', turns: 5, target: '직속 팀장', difficulty: 'basic', personality: '차분함', persona: '직속 팀장 역할의 가상 상대', additional_notes: '', additional_notes_confirmed: true };

test('web practice blocks profanity before requests and restores video, voice and device cleanup', { timeout: 60000 }, async t => {
  const { server, url } = await startVite();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  t.after(async () => { await browser.close(); await server.close(); });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['camera', 'microphone'] });
  await context.addInitScript(() => {
    sessionStorage.clear();
    window.captureRequests = 0;
    const capture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => { window.captureRequests++; return capture(constraints); };
    window.SpeechRecognition = class {
      start() { queueMicrotask(() => { this.onresult?.({ results: [[{ transcript: window.testTranscript || '오늘 몸이 아파서 조퇴하고 싶어요' }]] }); this.onend?.(); }); }
      abort() { this.onend?.(); }
      stop() { this.onend?.(); }
    };
  });
  let replies = 0, prepares = 0, speechRequests = 0;
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let result = {};
    if (path === '/api/scenarios') result = [];
    if (path.endsWith('/prepare')) { prepares++; result = { message: '설정을 확인해주세요.', draft, ready: true, question: null }; }
    if (path.endsWith('/reply')) {
      replies++;
      const body = route.request().postDataJSON();
      const answered = body.messages.filter(message => message.role === 'user').length;
      result = { message: answered ? '알겠습니다. 인수인계할 내용이 있나요?' : '오늘 몸 상태는 어떤가요?', done: false, answered_turns: answered };
    }
    if (path === '/api/tts') { speechRequests++; return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }); }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}?service=workplace`);
  await page.getByLabel('연습하고 싶은 상황', { exact: true }).first().fill('팀장에게 조퇴를 요청하는 대화를 연습하고 싶어요.');
  await page.getByRole('button', { name: '입력한 상황으로 연습 준비하기', exact: true }).first().click();
  const deviceModal = page.getByRole('dialog', { name: '대화를 시작할 준비가 됐나요?' });
  await deviceModal.waitFor();
  assert.equal(replies, 0, 'design completion must not start AI simulation');
  assert.equal(await page.evaluate(() => window.captureRequests), 0);
  await page.screenshot({ path: '/private/tmp/mirror-device-modal-before.png' });
  await page.keyboard.press('Escape');
  await deviceModal.waitFor({ state: 'hidden' });
  await page.getByLabel('준비 도우미에게 답하기', { exact: true }).fill('ㅅㅂ');
  await page.getByRole('button', { name: '준비 답변 보내기', exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /욕설이나 비속어/);
  assert.equal(prepares, 1);
  await page.getByLabel('준비 도우미에게 답하기', { exact: true }).fill('');
  await page.getByRole('button', { name: '설정 확정하고 시작하기' }).click();
  await deviceModal.waitFor();
  await deviceModal.getByRole('button', { name: '카메라·마이크 허용하기', exact: true }).click();
  await deviceModal.getByLabel('내 모습이 잘 보여요').waitFor();
  const start = deviceModal.getByRole('button', { name: '시뮬레이션 시작', exact: true });
  assert.equal(await start.isDisabled(), true);
  await deviceModal.getByLabel('내 모습이 잘 보여요').check();
  assert.equal(await start.isDisabled(), true);
  await deviceModal.getByLabel('마이크 입력을 확인했어요').check();
  await page.evaluate(() => { window.preflightStream = document.querySelector('video[aria-label="장치 확인 카메라 미리보기"]').srcObject; });
  await page.screenshot({ path: '/private/tmp/mirror-device-modal-ready.png' });
  await start.click();
  await page.locator('.simulation-media').waitFor();
  await page.waitForFunction(() => document.querySelector('.simulation-avatar video')?.readyState >= 2);
  assert.equal(replies, 1);
  await page.waitForFunction(() => document.querySelector('.simulation-avatar')?.dataset.speaking === 'false');
  assert.ok(speechRequests > 0, 'uses the existing server TTS path');
  const input = page.getByLabel('AI 상대에게 답하기', { exact: true });
  for (const text of ['ㅈ까', '시.발', '병\u200b신']) {
    await input.fill(text);
    await page.getByRole('button', { name: '시뮬레이션 답변 보내기' }).click();
    assert.match(await page.getByRole('alert').innerText(), /욕설이나 비속어/);
    assert.equal(await input.inputValue(), text);
    assert.equal(replies, 1, 'blocked answer does not consume a turn or request AI');
  }
  const color = await page.getByRole('alert').evaluate(el => getComputedStyle(el).color);
  assert.equal(color, 'rgb(160, 24, 32)');
  await page.screenshot({ path: '/private/tmp/mirror-simulation-profanity.png' });
  await input.fill('');
  assert.equal(await page.evaluate(() => window.captureRequests), 1, 'the checked stream is reused');
  await page.waitForFunction(() => document.querySelector('video[aria-label="내 카메라 영상"]')?.srcObject?.getTracks().length === 2);
  assert.equal(await page.evaluate(() => document.querySelector('video[aria-label="내 카메라 영상"]').srcObject === window.preflightStream), true);
  await page.evaluate(() => { window.capturedTracks = document.querySelector('video[aria-label="내 카메라 영상"]').srcObject.getTracks(); });
  await page.getByRole('button', { name: '카메라 끄기', exact: true }).click();
  assert.equal(await page.evaluate(() => window.capturedTracks.find(track => track.kind === 'video').enabled), false);
  await page.getByRole('button', { name: '카메라 켜기', exact: true }).click();
  await page.getByRole('button', { name: '마이크 끄기', exact: true }).click();
  assert.equal(await page.evaluate(() => window.capturedTracks.find(track => track.kind === 'audio').enabled), false);
  assert.equal(await page.getByRole('button', { name: '음성으로 답변 입력', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: '마이크 켜기', exact: true }).click();
  await page.getByRole('button', { name: '음성으로 답변 입력', exact: true }).click();
  assert.equal(await input.inputValue(), '오늘 몸이 아파서 조퇴하고 싶어요');
  assert.equal(replies, 1, 'dictation waits for review instead of submitting automatically');
  await page.evaluate(() => { window.testTranscript = 'ㅈ까'; });
  await input.fill('');
  await page.getByRole('button', { name: '음성으로 답변 입력', exact: true }).click();
  await page.getByRole('button', { name: '시뮬레이션 답변 보내기' }).click();
  assert.equal(replies, 1, 'spoken profanity is also blocked');
  await input.fill('네, 인수인계하고 조퇴하겠습니다.');
  await page.getByRole('button', { name: '시뮬레이션 답변 보내기' }).click();
  await page.getByRole('log', { name: '시뮬레이션 대화' }).getByText('알겠습니다. 인수인계할 내용이 있나요?', { exact: true }).waitFor();
  assert.equal(replies, 2);
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px does not overflow`);
    assert.equal(await input.isVisible(), true);
    const bounds = await page.getByRole('button', { name: '시뮬레이션 답변 보내기' }).boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 901, `${width}px keeps the send button in view`);
    if (width === 390) await page.screenshot({ path: '/private/tmp/mirror-simulation-media-mobile.png' });
  }
  await page.screenshot({ path: '/private/tmp/mirror-simulation-media-after.png', fullPage: true });
  await page.getByRole('button', { name: '연습 공간으로 돌아가기', exact: true }).click();
  assert.equal(await page.evaluate(() => window.capturedTracks.every(track => track.readyState === 'ended')), true);
  assert.deepEqual(errors, []);
});
