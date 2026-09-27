import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, join, spend, drawCost, drainRate, travelDay, rest, eatMeal, ravenousEat,
  useRootvein, legDays, dailyRation, isFoodLow, carry, sendHome, pendingCollapses, STATUS,
  serialize, deserialize,
} from '../src/state/ledger.js';
import { BALANCE } from '../src/config.js';
import { rollRoadEvent } from '../src/data/roadEvents.js';
import { resolveVulnerable } from '../src/data/vulnerable.js';
import { LANDMARKS } from '../src/data/landmarks.js';
import { SCRIPTS } from '../src/data/script.js';

test('new game: Rusty alone, full stamina, full Colour', () => {
  const s = newGame();
  assert.deepEqual(Object.keys(s.party), ['rusty']);
  assert.equal(s.party.rusty.stamina, 100);
  assert.equal(s.colour, 1);
});

test('stacking costs more and drains faster', () => {
  assert.ok(drawCost('fleet', true) > drawCost('fleet', false));
  assert.equal(drainRate('fleet', 2), drainRate('fleet', 1) * BALANCE.stack.drainMult);
});

test('stamina never regenerates on its own: steady travel costs food, not stamina', () => {
  const s = newGame();
  spend(s, 'rusty', 40);
  travelDay(s);
  assert.equal(s.party.rusty.stamina, 60);
  assert.equal(s.food, BALANCE.startFood - 1);
});

test('hard pace costs stamina and saves days', () => {
  const s = newGame();
  const steady = legDays(s);
  s.pace = 'hard';
  assert.ok(legDays(s) < steady);
  travelDay(s);
  assert.equal(s.party.rusty.stamina, 100 - BALANCE.travel.hardPaceStaminaPerDay);
});

test('rest restores; low food slows recovery', () => {
  const s = newGame();
  spend(s, 'rusty', 60);
  rest(s);
  assert.equal(s.party.rusty.stamina, 40 + BALANCE.rest.staminaFed);
  const t = newGame();
  spend(t, 'rusty', 60);
  t.food = 1;
  assert.ok(isFoodLow(t));
  rest(t);
  assert.ok(t.party.rusty.stamina - 40 < BALANCE.rest.staminaFed);
});

test('starving costs stamina', () => {
  const s = newGame();
  s.food = 0;
  travelDay(s);
  assert.equal(s.party.rusty.stamina, 100 - BALANCE.travel.starveStaminaLoss);
});

test('collapse -> carry slows the party and eats more; send home removes them', () => {
  const s = newGame();
  join(s, ['grizz', 'kit']);
  const ration = dailyRation(s);
  spend(s, 'grizz', 999);
  assert.deepEqual(pendingCollapses(s), ['grizz']);
  carry(s, 'grizz');
  assert.equal(s.party.grizz.status, STATUS.CARRIED);
  assert.ok(dailyRation(s) > ration);
  assert.equal(legDays(s), BALANCE.travel.daysPerLeg + BALANCE.travel.carryExtraDays);
  sendHome(s, 'kit');
  assert.equal(s.party.kit.status, STATUS.HOME);
});

test('meal: food in, stamina back', () => {
  const s = newGame();
  spend(s, 'rusty', 50);
  const g = eatMeal(s, 'rusty');
  assert.equal(g, BALANCE.meal.stamina);
  assert.equal(s.food, BALANCE.startFood - BALANCE.meal.food);
});

test('ravenous eating after honest fights; Rootvein inverts the tell', () => {
  const s = newGame();
  spend(s, 'rusty', 50);
  const r = ravenousEat(s, ['rusty']);
  assert.ok(r[0].ate > 0 && r[0].gained > 0);
  const food = s.food;
  useRootvein(s);
  spend(s, 'rusty', 30);
  const r2 = ravenousEat(s, ['rusty']);
  assert.equal(r2[0].notHungry, true);
  assert.equal(s.food, food);
});

test('Rootvein costs no stamina and no food; only Colour drains', () => {
  const s = newGame();
  spend(s, 'rusty', 70);
  const before = { stamina: s.party.rusty.stamina, food: s.food };
  useRootvein(s);
  assert.equal(s.party.rusty.stamina, before.stamina);
  assert.equal(s.food, before.food);
  assert.ok(s.colour < 1);
});

test('save round-trips', () => {
  const s = newGame();
  s.flags.x = 1;
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('road events always return text and never throw, across the route', () => {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let lm = 0; lm < 11; lm++) {
    const s = newGame();
    join(s, ['grizz', 'kit']);
    s.landmark = lm;
    for (let i = 0; i < 30; i++) assert.equal(typeof rollRoadEvent(s, rng).text, 'string');
  }
});

test('vulnerable companion is configurable and falls back', () => {
  const s = newGame();
  assert.equal(resolveVulnerable(s), null);
  join(s, ['kit', 'chipper']);
  assert.equal(resolveVulnerable(s), 'kit');
  sendHome(s, 'kit');
  assert.equal(resolveVulnerable(s), 'chipper');
});

test('route: 11 landmarks, Ch. 2-12 in order, every story step has a script', () => {
  assert.equal(LANDMARKS.length, 11);
  LANDMARKS.forEach((l, i) => assert.equal(l.chapter, i + 2));
  for (const l of LANDMARKS) for (const st of l.steps) if (st.type === 'story') assert.ok(SCRIPTS[st.id], st.id);
});

test('Colour never appears in any UI text', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk('src')) {
    const src = fs.readFileSync(f, 'utf8');
    // No text call may render the colour value.
    assert.ok(!/txt\([^)]*colour/i.test(src), `${f} renders colour`);
    assert.ok(!/setText\([^)]*colour/i.test(src), `${f} renders colour`);
  }
});

test('every music track parses into valid notes and drums', async () => {
  const { TRACKS, parse, noteFreq } = await import('../src/ui/music.js');
  for (const [name, t] of Object.entries(TRACKS)) {
    assert.ok(t.bpm > 0, name);
    for (const v of t.voices) {
      const toks = parse(v.notes);
      assert.ok(toks.length > 0, name);
      for (const tok of toks) assert.ok(tok === '.' || tok === '-' || noteFreq(tok) > 20, `${name}: bad note ${tok}`);
    }
    if (t.drums) for (const d of parse(t.drums)) assert.ok('.ksh'.includes(d), `${name}: bad drum ${d}`);
  }
  assert.equal(Math.round(noteFreq('A4')), 440);
});
