import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { startVite } from './serviceEntryRouteHarness.js';

test('auth banner fades in and out, restarts its timer, and supports reduced motion', { timeout: 45000 }, async t => {
  const { server, url } = await startVite();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: reducedMotion === 'reduce' ? 390 : 1280, height: 900 }, reducedMotion });
    await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: new URL(route.request().url()).pathname.endsWith('/scenarios') ? '[]' : '{}' }));
    await page.goto(`${url}?service=workplace`);
    const login = page.getByRole('button', { name: '로그인', exact: true });
    await login.waitFor();
    await login.focus();
    await login.evaluate(el => el.click());
    const banner = page.locator('.auth-notice-banner');
    await banner.waitFor();
    await page.waitForTimeout(50);
    const entering = await banner.evaluate(el => Number(getComputedStyle(el).opacity));
    if (reducedMotion === 'no-preference') assert.ok(entering > 0 && entering < 1, `fade-in opacity: ${entering}`);
    await page.waitForTimeout(200);
    assert.equal(await banner.evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.equal(await login.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `/private/tmp/mirror-auth-banner-${reducedMotion}.png` });
    await page.waitForTimeout(3200);
    await page.getByRole('button', { name: '회원가입', exact: true }).click();
    assert.equal(await banner.count(), 1);
    assert.match(await banner.innerText(), /회원가입 기능은 준비 중/);
    await page.waitForTimeout(1000);
    assert.equal(await banner.count(), 1, 'repeated clicks reset the auto-dismiss timer');
    await page.waitForFunction(() => { const el = document.querySelector('.auth-notice-banner'); return !el || Number(getComputedStyle(el).opacity) < 1; }, null, { timeout: 4000, polling: 'raf' });
    if (reducedMotion === 'no-preference') {
      const leaving = await banner.evaluate(el => Number(getComputedStyle(el).opacity));
      assert.ok(leaving >= 0 && leaving < 1, `fade-out opacity: ${leaving}`);
    }
    await page.waitForTimeout(300);
    assert.equal(await banner.count(), 0);
    await login.click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: '안내 닫기', exact: true }).click();
    await page.waitForTimeout(300);
    assert.equal(await banner.count(), 0);
    await page.close();
  }
});
