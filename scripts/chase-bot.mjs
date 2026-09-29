// Proves the chase is dodgeable: a simple reactive bot (sees only what a player
// sees: roots ahead, "!" sweeps, dive shadows) plays the whole chase and we
// count how many times Rusty gets hit. Usage: node scripts/chase-bot.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';

const server = await createServer({ server: { port: 5195 }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 768, height: 432 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.text().startsWith('HIT') && console.log(m.text()));
await page.goto('http://localhost:5195/');
await page.waitForFunction(() => window.__wr?.game.scene.isActive('Title'));
await page.evaluate(() => {
  const { game, store, goto } = window.__wr;
  store.startNew();
  store.getState().phase = 'landmark';
  goto(game.scene.getScene('Title'), 'Chase', { duration: 60 });
});
await page.waitForFunction(() => window.__wr.game.scene.isActive('Chase'));
await page.evaluate(() => {
  const sc = window.__wr.game.scene.getScene('Chase');
  window.__hits = 0;
  const orig = sc.hurtRusty.bind(sc);
  sc.hurtRusty = (a, o = {}) => {
    if (!o.cost && sc.invuln <= 0) {
      window.__hits += 1;
      const p = sc.player;
      const ow = sc.owls.find((w) => w.s === o.from);
      const near = sc.obstacles.getChildren().map((ob) => Math.round(ob.body.x - p.x)).filter((d) => d > -60 && d < 80);
      console.log(`HIT ${ow ? ow.kind : 'stumble'} t=${sc.elapsed.toFixed(1)} x=${Math.round(p.x - sc.camX)} duck=${sc.ducking} bodyY=${Math.round(p.body.y)} ground=${p.body.blocked.down} owlY=${ow && Math.round(ow.s.body.y)} roots=${near}`);
    }
    return orig(a, o);
  };
  let jumpPulse = 0;
  sc.events.on('preupdate', () => {
    const t = sc.controls.touch;
    const p = sc.player;
    const b = p.body;
    const onGround = b.blocked.down || b.touching.down;
    // A sweep is coming if the "!" is showing, or an owl is closing in.
    const warning = sc.children.list.some((c) => c.texture?.key === 'warn' && c.scrollFactorX === 0 && c.active);
    const sweepOnScreen = sc.owls.some((o) => o.kind === 'sweep' && o.s.active && o.s.x - p.x > -30);
    const sweepNear = sc.owls.some((o) => o.kind === 'sweep' && o.s.active && o.s.x - p.x < 150 && o.s.x - p.x > -30);
    const shadows = sc.children.list.filter((c) => c.type === 'Ellipse' && c.active);
    const shadowAhead = shadows.some((s) => s.x - p.x > -30 && s.x - p.x < 70);
    const obstacleAhead = sc.obstacles.getChildren().some((o) => {
      const gap = o.body.x - (b.x + b.width);
      return gap > -4 && gap < 16;
    });
    // Sweep incoming: stop and duck where you are (don't hop onto a root).
    // Keep running during a warning, but don't hop up onto a root until it has
    // passed; when the owl is close, duck where you stand.
    t.duck = sweepNear && onGround;
    t.right = !shadowAhead && !sweepNear && p.x < sc.camX + 260;
    if (obstacleAhead && onGround && !warning && !sweepOnScreen && !shadowAhead && jumpPulse <= 0) {
      t.jump = true;
      jumpPulse = 20;
    } else if (jumpPulse-- < 18) t.jump = false;
  });
});
await page.waitForFunction(() => !window.__wr.game.scene.isActive('Chase') || window.__wr.game.scene.getScene('Chase').ended, null, { timeout: 90000 });
const res = await page.evaluate(() => ({ hits: window.__hits, stamina: Math.round(window.__wr.store.getState().party.rusty.stamina), owls: window.__wr.game.scene.getScene('Chase').attackN }));
console.log(JSON.stringify(res), errors.length ? errors : 'no errors');
await browser.close();
await server.close();
