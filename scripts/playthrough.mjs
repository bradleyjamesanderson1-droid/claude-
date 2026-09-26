// Drives a full V1 run through the real Director flow, from the cold open to an
// ending, and fails on console errors or a stuck scene. Encounters are
// short-circuited (the smoke test covers their play); everything else is real.
// Usage: node scripts/playthrough.mjs rootvein|refuse
import { chromium } from 'playwright';
import { createServer } from 'vite';

const path = process.argv[2] || 'rootvein';
const server = await createServer({ server: { port: 5198 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 432, height: 768 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e.stack || e)));
await page.goto('http://localhost:5198/');
await page.waitForFunction(() => window.__wr?.game.scene.isActive('Title'), null, { timeout: 20000 });
await page.evaluate(() => {
  const { game, store, Director } = window.__wr;
  store.startNew();
  Director.resume(game.scene.getScene('Title'));
});

const info = () =>
  page.evaluate(() => {
    const { game, store } = window.__wr;
    const sc = game.scene.getScenes(true)[0];
    const s = store.getState();
    return { key: sc?.scene.key, lm: s.landmark, step: s.step, phase: s.phase, food: s.food, rusty: Math.round(s.party.rusty.stamina), modal: !!sc?.modal, busy: !!sc?.busy, ended: !!sc?.ended };
  });

let last = '';
const trail = [];
for (let i = 0; i < 3000; i++) {
  const st = await info();
  const sig = `${st.key}:${st.lm}:${st.step}`;
  if (sig !== last) {
    trail.push(`${sig} (food ${st.food}, rusty ${st.rusty})`);
    last = sig;
  }
  if (st.key === 'Ending') break;
  if (st.key === 'GameOver') throw new Error('GameOver reached: ' + trail.join('\n'));
  if (['Story', 'Card', 'Receipt', 'Hollow'].includes(st.key)) await page.keyboard.press('Enter');
  else if (st.key === 'Trail') {
    if (!st.busy) {
      await page.evaluate(() => window.__wr.game.scene.getScene('Trail').travelBtn.press());
    } else await page.keyboard.press('Enter'); // collapse modal, if any
  } else if (['Forage', 'Chase', 'Protect'].includes(st.key) || (st.key === 'Skirmish' && st.lm !== 10)) {
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const sc = window.__wr.game.scene.getScenes(true)[0];
      sc.eaters?.add('rusty');
      if (!sc.ended) sc.finish({ outcome: 'test' });
    });
    await page.waitForTimeout(1500);
  } else if (st.key === 'Skirmish') {
    if (st.modal) {
      if (path === 'rootvein') await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.evaluate((p) => {
        const sc = window.__wr.game.scene.getScene('Skirmish');
        if (p === 'rootvein') sc.finish({ outcome: 'rootvein', climax: true });
        else sc.hurtRusty(999, { cost: true });
      }, path);
      await page.waitForTimeout(1500);
    } else if (!st.ended) {
      // Let the enforcers wear Rusty down until the ledger triggers the offer.
      await page.evaluate(() => {
        const sc = window.__wr.game.scene.getScene('Skirmish');
        if (sc.elapsed > 5) sc.hurtRusty(3, { cost: true });
      });
    }
  }
  await page.waitForTimeout(120);
}
const final = await page.evaluate(() => {
  const s = window.__wr.store.getState();
  return { rootveinUsed: s.rootveinUsed, colourBelowOne: s.colour < 1, day: s.day, party: Object.fromEntries(Object.entries(s.party).map(([k, v]) => [k, v.status])) };
});
console.log(trail.join('\n'));
console.log('FINAL', JSON.stringify(final));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No console errors.');
await browser.close();
await server.close();
const ok = !errors.length && (path === 'rootvein' ? final.rootveinUsed && final.colourBelowOne : !final.rootveinUsed && !final.colourBelowOne);
process.exit(ok ? 0 : 1);
