// Headless smoke test: boots the built game in Chromium, jumps to every scene,
// fails on any console error, and saves screenshots to ./shots.
// Usage: npm run build && node scripts/smoke.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';

const server = await createServer({ server: { port: 5199 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 432, height: 768 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e.stack || e)));
fs.mkdirSync('shots', { recursive: true });

await page.goto('http://localhost:5199/');
await page.waitForFunction(() => window.__wr && window.__wr.game.scene.isActive('Title'), null, { timeout: 20000 });
const shot = async (name, wait = 900) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/${name}.png` });
};
await shot('01-title');

const jump = async (key, data = {}, setup = '') => {
  await page.evaluate(
    ([key, data, setup]) => {
      const { game, store, goto } = window.__wr;
      if (setup) new Function('store', setup)(store);
      const active = game.scene.getScenes(true)[0];
      goto(active, key, data);
    },
    [key, data, setup],
  );
};

const scenario = process.argv[2] || 'all';
const setupMid = `store.startNew(); const s = store.getState(); s.flags.berrycraft = true; s.landmark = 5; s.phase='landmark'; for (const id of ['grizz','spines','chip','kit','chipper']) s.party[id] = { stamina: 90, status: 'active' };`;

await jump('Story', { script: 'ch1', auto: true, onDone: 'coldopen' }, 'store.startNew();');
await shot('02-coldopen', 2500);
await jump('Story', { script: 'ch6' }, setupMid);
await shot('03-story');
await jump('Trail', {}, setupMid);
await shot('04-trail');
await jump('Hollow', {}, 'store.startNew();');
await shot('05-hollow');
await jump('Forage', { light: false, bg: 'ruins', duration: 60, title: 'Forage' }, setupMid);
await shot('06-forage', 1500);
await jump('Chase', { duration: 60 }, 'store.startNew();');
await shot('07-chase', 3000);
await jump('Skirmish', { mode: 'rescue', tutorial: true, bg: 'thorns', title: 'Rescue' }, setupMid);
await shot('08-rescue', 1500);
// hold "draw berry" and fight a bit
await page.keyboard.press('k');
await page.keyboard.down('d');
await page.waitForTimeout(3000);
await page.keyboard.up('d');
for (let i = 0; i < 6; i++) { await page.keyboard.press('j'); await page.waitForTimeout(250); }
await shot('09-rescue-fight', 200);
await jump('Protect', { bg: 'blight', duration: 60, protectId: 'kit', title: 'Keep them safe' }, setupMid);
await shot('10-protect', 4000);
const climaxSetup = setupMid + ` s.landmark = 10; s.party.bandit = { stamina: 90, status: 'active' }; s.party.rusty.stamina = 30; s.step = 1; s.flags.card10 = true;`;
await jump('Skirmish', { mode: 'climax', bg: 'blight-deep', title: 'Price of the Shortcut' }, climaxSetup);
await page.waitForTimeout(3000);
await page.waitForFunction(() => window.__wr.game.scene.getScene('Skirmish').modal, null, { timeout: 30000 });
await shot('11-rootvein-offer', 300);
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('Enter');
await shot('12-rootvein-used', 2500);
// Walk into the champion and swing.
for (let i = 0; i < 40; i++) {
  const dir = await page.evaluate(() => {
    const sc = window.__wr.game.scene.getScene('Skirmish');
    const c = sc.champion;
    if (!c || !c.alive) return 0;
    return Math.sign(c.x - sc.player.x);
  });
  if (!dir) break;
  const key = dir > 0 ? 'd' : 'a';
  await page.keyboard.down(key);
  await page.waitForTimeout(200);
  await page.keyboard.up(key);
  await page.keyboard.press('j');
  await page.waitForTimeout(150);
}
console.log(await page.evaluate(() => { const sc = window.__wr.game.scene.getScene('Skirmish'); return JSON.stringify({ ended: sc.ended, winning: sc.winning, champ: sc.champion && { alive: sc.champion.alive, state: sc.champion.state, resolve: sc.champion.resolve, x: sc.champion.x }, live: sc.enemies.map(e => e.state), px: sc.player.x, active: window.__wr.game.scene.getScenes(true).map(s=>s.scene.key) }); }));
await page.waitForFunction(() => window.__wr.game.scene.isActive('Story'), null, { timeout: 60000 });
await shot('13-aftermath', 1500);
await jump('Ending', { path: 'rootvein' });
await shot('14-ending-rootvein', 9000);
await jump('Ending', { path: 'refuse' }, setupMid);
await shot('15-ending-refuse', 9000);
await jump('Receipt', { result: { title: 'After', spent: { rusty: 30, grizz: 20 }, drawn: { fleet: 1 }, eaters: ['rusty', 'grizz'], found: { food: 2, berries: {} } } }, setupMid);
await shot('16-receipt', 1500);

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No console errors.');
await browser.close();
await server.close();
process.exit(errors.length ? 1 : 0);
