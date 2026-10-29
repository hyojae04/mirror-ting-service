import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { startVite } from './serviceEntryRouteHarness.js';
import { currentScreenDestination } from './serviceEntryRoute.js';

test('disabled web auth routes return home', () => {
  for (const route of ['login', 'signup']) assert.equal(currentScreenDestination(route, false), 'home');
  assert.equal(currentScreenDestination('simulation-chat', false), 'simulation-chat');
});

test('guests and previously logged-in users enter chat directly; Enter respects multiline and Korean IME', { timeout: 60000 }, async t => {
  const { server, url } = await startVite();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  t.after(async () => { await browser.close(); await server.close(); });
  const draft = { job_role: '개발자', situation: '일정 조율', context: '개발 일정 지연을 공유함', goal: '새 일정 합의', turns: 5, target: '팀장', difficulty: 'basic', personality: '차분함', persona: '팀장 역할의 가상 인물', additional_notes_confirmed: true };
  for (const [mode, savedAccount, width] of [['workplace', false, 1280], ['interview', true, 390]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['camera', 'microphone'] });
    t.after(() => context.close());
    await context.addInitScript(saved => {
      sessionStorage.clear();
      if (saved) sessionStorage.setItem('mirror-ting-web-account', JSON.stringify({ demo: true, name: '이전 시연 사용자', email: 'test@example.com' }));
    }, savedAccount);
    const calls = { prepare: 0, reply: 0, auth: 0 };
    const submitted = [];
    await context.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes('/auth/')) calls.auth++;
      let result = path.endsWith('/scenarios') ? [] : {};
      if (path.endsWith('/prepare')) {
        calls.prepare++;
        result = calls.prepare === 1
          ? { message: '상대의 성격은요?', draft: { ...draft, personality: '' }, question: { field: 'personality', title: '어떤 성격인가요?', choices: ['차분함', '단호함'] } }
          : { message: '설정을 확인해주세요.', draft, question: null, ready: true };
      }
      if (path.endsWith('/reply')) {
        calls.reply++;
        const body = route.request().postDataJSON();
        assert.equal(body.service_mode, mode);
        const answers = body.messages.filter(message => message.role === 'user');
        submitted.push(...answers.slice(-1));
        result = { message: answers.length ? '새 일정은 언제까지 가능할까요?' : '현재 일정을 설명해주세요.', answered_turns: answers.length, done: false };
      }
      if (path === '/api/tts') return route.fulfill({ status: 503, body: '{}' });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(result) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}?service=${mode}`);
    await page.locator('.home-page').waitFor();
    assert.equal(await page.locator('.lovable-dashboard, .workspace-navigation, .account-page').count(), 0);
    const prompt = page.getByLabel('연습하고 싶은 상황', { exact: true }).first();
    await prompt.fill('일정을 조율하는 연습을 하고 싶어요.');
    for (const name of ['로그인', '회원가입']) {
      const trigger = page.getByRole('button', { name, exact: true });
      await trigger.click();
      const dialog = page.getByRole('status').filter({ hasText: '아직 구현되지 않았어요' });
      await dialog.waitFor();
      assert.match(await dialog.innerText(), new RegExp(`${name} 기능은 준비 중`));
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'notice must not steal focus');
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(calls.auth, 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (name === '로그인') await page.keyboard.press('Escape');
      else {
        await page.screenshot({ path: `/private/tmp/mirror-auth-notice-${width}.png` });
        await dialog.getByRole('button', { name: '확인' }).click();
      }
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      assert.equal(await prompt.inputValue(), '일정을 조율하는 연습을 하고 싶어요.');
    }
    if (savedAccount) await prompt.press('Enter');
    else await page.getByRole('button', { name: '입력한 상황으로 연습 준비하기', exact: true }).first().click();
    await page.getByLabel('질문에 직접 답변하기', { exact: true }).waitFor();
    assert.equal(calls.auth, 0);
    const prepInput = page.getByLabel('준비 도우미에게 답하기', { exact: true });
    await prepInput.fill('차분');
    await prepInput.press('Shift+Enter');
    assert.equal(await prepInput.inputValue(), '차분\n');
    assert.equal(calls.prepare, 1);
    for (const event of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) {
      await prepInput.dispatchEvent('keydown', { key: 'Enter', ...event });
      assert.equal(calls.prepare, 1, 'composition and held keys must not submit');
    }
    await page.getByLabel('질문에 직접 답변하기', { exact: true }).press('Enter');
    await page.getByRole('button', { name: '설정 확정하고 시작하기' }).waitFor();
    assert.equal(calls.prepare, 2);
    const deviceModal = page.getByRole('dialog', { name: '대화를 시작할 준비가 됐나요?' });
    await deviceModal.waitFor();
    assert.equal(calls.reply, 0);
    await deviceModal.getByRole('button', { name: '카메라·마이크 허용하기', exact: true }).click();
    await deviceModal.getByLabel('내 모습이 잘 보여요').check();
    await deviceModal.getByLabel('마이크 입력을 확인했어요').check();
    await deviceModal.getByRole('button', { name: '시뮬레이션 시작', exact: true }).click();
    const input = page.getByLabel('AI 상대에게 답하기', { exact: true });
    await input.waitFor();
    await input.fill('오늘까지');
    await input.press('Shift+Enter');
    assert.equal(await input.inputValue(), '오늘까지\n');
    await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
    await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 });
    assert.equal(calls.reply, 1);
    await input.fill('오늘까지 개발하고 내일 검증하겠습니다.');
    await input.press('Enter');
    await page.getByRole('log', { name: '시뮬레이션 대화' }).getByText('새 일정은 언제까지 가능할까요?', { exact: true }).waitFor();
    assert.equal(calls.reply, 2);
    assert.equal(await input.inputValue(), '');
    assert.equal(submitted.at(-1).content, '오늘까지 개발하고 내일 검증하겠습니다.');
    await input.fill('ㅈ까');
    await input.press('Enter');
    assert.match(await page.getByRole('alert').innerText(), /비속어/);
    assert.equal(calls.reply, 2);
    if (savedAccount) await page.getByRole('button', { name: '설정 닫기', exact: true }).isVisible().then(async visible => { if (visible) await page.getByRole('button', { name: '설정 닫기', exact: true }).click(); });
    await page.screenshot({ path: `/private/tmp/mirror-guest-${mode}.png` });
    await page.getByRole('button', { name: '연습 공간으로 돌아가기', exact: true }).click();
    await page.evaluate(() => { history.pushState({ mirrorTingView: 'login' }, ''); dispatchEvent(new PopStateEvent('popstate', { state: { mirrorTingView: 'login' } })); });
    await page.locator('.home-page').waitFor();
    assert.equal(await page.locator('.account-page, .lovable-dashboard').count(), 0);
    assert.deepEqual(errors, []);
  }
});
