// Travel flavour between landmarks. The blight is NOT a landmark (brief §4):
// it shows up here, as darkening ground and thinning berries, intensifying from
// landmark 5 onward. Every effect is visible — events only ever report costs.
//
// `when(state)` gates an event; `run(state, rng)` applies it and returns text.

import { BALANCE } from '../config.js';
import { addBerries, abundance, active, spend } from '../state/ledger.js';
import { BERRY_TYPES, BERRY_INFO, COMPANIONS } from './companions.js';

const blighted = (s) => s.landmark >= BALANCE.blightFrom;
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

export const ROAD_EVENTS = [
  {
    id: 'bush',
    weight: (s) => 3 * abundance(s),
    run(s, rng) {
      const type = pick(BERRY_TYPES, rng);
      const n = Math.max(1, Math.round(3 * abundance(s)));
      addBerries(s, { [type]: n });
      return `A healthy bush by the path. +${n} ${BERRY_INFO[type].name}.`;
    },
  },
  {
    id: 'nuts',
    weight: (s) => 2 * abundance(s),
    run(s) {
      const n = Math.max(1, Math.round(4 * abundance(s)));
      s.food += n;
      return `A stash of fallen nuts. +${n} food.`;
    },
  },
  {
    id: 'quiet',
    weight: () => 2,
    run(s) {
      return blighted(s) ? 'Grey dust on the path. Nobody talks much.' : 'Birdsong. An easy stretch of trail.';
    },
  },
  {
    id: 'grey-lines',
    weight: (s) => (blighted(s) ? 3 : 0),
    run() {
      return 'The ground is grey in long lines here, following the roots underneath.';
    },
  },
  {
    id: 'dead-bush',
    weight: (s) => (blighted(s) ? 2 : 0),
    run() {
      return 'A berry bush, shrivelled black. Nothing worth taking.';
    },
  },
  {
    id: 'spoiled',
    weight: (s) => (blighted(s) && s.food > 4 ? 1.5 : 0),
    run(s) {
      s.food -= 2;
      return 'Blight-damp got into the food bundle. -2 food.';
    },
  },
  {
    id: 'bramble',
    weight: (s) => (blighted(s) ? 1.5 : 0.5),
    run(s, rng) {
      const who = pick(active(s), rng);
      if (!who) return 'Thick bramble. Slow going.';
      spend(s, who, 6);
      return `Thick bramble. ${COMPANIONS[who].name} forces the path open. -6 stamina.`;
    },
  },
];

export function rollRoadEvent(state, rng = Math.random) {
  const pool = ROAD_EVENTS.map((e) => ({ e, w: e.weight(state) })).filter((x) => x.w > 0);
  const total = pool.reduce((a, x) => a + x.w, 0);
  let r = rng() * total;
  for (const x of pool) {
    r -= x.w;
    if (r <= 0) return { id: x.e.id, text: x.e.run(state, rng) };
  }
  const last = pool[pool.length - 1].e;
  return { id: last.id, text: last.run(state, rng) };
}
