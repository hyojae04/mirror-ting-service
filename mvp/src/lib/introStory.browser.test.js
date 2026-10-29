import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
import { startVite } from './serviceEntryRouteHarness.js';

test('scenario story keeps original three scenes and generated images with responsive layouts', { timeout: 60000 }, async t => {
  const { server, url } = await startVite();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  for (const config of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'interview', width: 1280, height: 900, service: 'interview' },
    { name: 'short', width: 1280, height: 500, static: true },
    { name: 'reduced', width: 390, height: 844, static: true, reducedMotion: 'reduce' },
  ]) {
    const page = await browser.newPage({ viewport: { width: config.width, height: config.height }, reducedMotion: config.reducedMotion || 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: new URL(route.request().url()).pathname.endsWith('/scenarios') ? '[]' : '{}' }));
    await page.goto(`${url}?service=${config.service || "workplace"}`);
    await page.locator('.intro-story').waitFor();
    assert.equal(await page.locator('.intro-story-lines, .intro-story .central-svg').count(), 0);
    assert.equal(await page.locator('.intro-story-photo').count(), 3);
    assert.equal(await page.locator('.intro-story-credits a').count(), 0);
    assert.equal(await page.locator('.intro-story-progress, .intro-story-scroll-hint, .intro-story figcaption').count(), 0);
    assert.equal(await page.locator('.intro-story-label').count(), 0);
    assert.equal(await page.locator('.intro-story-copy p').count(), 4);
    const imageWidths = [];
    assert.equal(await page.locator('.intro-story-montage, .intro-story-burst-photo').count(), 0);
    const go = async index => {
      await page.evaluate(index => {
        const track = document.querySelector('.intro-story-track');
        const stage = track.firstElementChild;
        const inset = parseFloat(getComputedStyle(stage).top) || 0;
        scrollTo({ top: track.getBoundingClientRect().top + scrollY - inset + (track.offsetHeight - stage.offsetHeight) * (index + .5) / 4, behavior: 'instant' });
      }, index);
      await page.waitForFunction(index => document.querySelector('.intro-story-stage').dataset.step === String(index), index);
      await page.waitForFunction(index => Number(getComputedStyle(document.querySelectorAll('.intro-story-panel')[index]).opacity) === 1, index);
      if (index < 3) await page.waitForFunction(index => { const img = innerWidth <= 900 ? document.querySelectorAll('.intro-story-panel')[index].querySelector('img') : document.querySelectorAll('.intro-story-photo img')[index]; return img.complete && img.naturalWidth > 0; }, index);
    };
    if (!config.static) {
      for (const index of [0, 1, 2, 3, 1, 0]) {
        await go(index);
        const panels = await page.locator('.intro-story-panel').evaluateAll(els => els.map(el => ({ inert: el.inert, visible: getComputedStyle(el).visibility })));
        panels.forEach((panel, i) => assert.equal(panel.inert, i !== index));
        assert.equal(panels[index].visible, 'visible');
        if (index < 3 && imageWidths.length < 3) imageWidths.push(await page.evaluate(index => { const img = innerWidth <= 900 ? document.querySelectorAll('.intro-story-panel')[index].querySelector('img') : document.querySelectorAll('.intro-story-photo img')[index]; return parseFloat(getComputedStyle(img).width); }, index));
        if (config.name === 'desktop' && index === 0) {
          const boxes = await page.evaluate(() => {
            const photo = document.querySelector('.intro-story-photo--0').getBoundingClientRect();
            const copy = document.querySelector('.intro-story-panel.is-active .intro-story-copy').getBoundingClientRect();
            return { photoRight: photo.right, copyLeft: copy.left };
          });
          assert.ok(boxes.photoRight < boxes.copyLeft, 'photo does not cover central text');
          await page.screenshot({ path: '/private/tmp/mirror-story-interview.png' });
        }
      }
      assert.ok(imageWidths[0] < imageWidths[1] && imageWidths[1] < imageWidths[2], `${config.name}: images grow in sequence ${imageWidths}`);
      await go(2);
      await page.screenshot({ path: `/private/tmp/mirror-story-${config.name}.png` });
      await go(3);
    } else {
      assert.equal(await page.locator('.intro-story-stage').evaluate(el => getComputedStyle(el).position), 'relative');
      assert.equal(await page.locator('.intro-story-panel[inert]').count(), 0);
      assert.equal(await page.locator('.intro-story-rapid-title').count(), 0);
      for (const panel of await page.locator('.intro-story-panel').all()) {
        assert.equal(await panel.evaluate(el => getComputedStyle(el).visibility), 'visible');
        await panel.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('.intro-story-inline-photo')].filter(img => { const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every(img => img.complete && img.naturalWidth > 0));
      }
      await page.getByRole('button', { name: '내 상황으로 연습하기' }).scrollIntoViewIfNeeded();
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${config.name} has no horizontal overflow`);
    if (config.name === 'desktop') await page.screenshot({ path: '/private/tmp/mirror-story-finale.png' });
    await page.getByRole('button', { name: '내 상황으로 연습하기' }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#home-scenario-prompt').evaluate(el => el === document.activeElement), true);

    assert.deepEqual(errors, []);
    await page.close();
  }
});
