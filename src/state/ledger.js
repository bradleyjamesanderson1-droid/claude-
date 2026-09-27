// The ledger: pure game-state logic, no Phaser. Every honest cost is computed
// here and reported back so scenes can show it on screen (brief §2: "the ledger
// stays short and on-screen"). The single exception is Colour, which is only
// ever changed here and read by presentation code — never displayed.

import { BALANCE, SAVE_VERSION } from '../config.js';
import { COMPANIONS, BERRY_TYPES } from '../data/companions.js';

export const STATUS = {
  ACTIVE: 'active',
  COLLAPSED: 'collapsed', // at zero; waiting on the carry / send-home choice
  CARRIED: 'carried',
  HOME: 'home',
};

export function newGame() {
  const state = {
    version: SAVE_VERSION,
    phase: 'coldopen',
    landmark: 0,
    step: 0,
    day: 1,
    food: BALANCE.startFood,
    pouch: { ...BALANCE.startPouch },
    party: {},
    pace: 'steady',
    colour: 1, // hidden stat
    rootveinUsed: false,
    flags: {},
  };
  join(state, ['rusty']);
  return state;
}

export function maxStamina(id) {
  return COMPANIONS[id].maxStamina;
}

export function join(state, ids) {
  for (const id of ids) {
    if (!state.party[id]) state.party[id] = { stamina: maxStamina(id), status: STATUS.ACTIVE };
  }
}

export function memberIds(state, ...statuses) {
  return Object.keys(state.party).filter((id) => statuses.includes(state.party[id].status));
}

export const active = (state) => memberIds(state, STATUS.ACTIVE);
export const travellers = (state) => memberIds(state, STATUS.ACTIVE, STATUS.CARRIED, STATUS.COLLAPSED);

/** Spend stamina. Returns true if this spend made the member collapse. */
export function spend(state, id, amount) {
  const m = state.party[id];
  if (!m || m.status === STATUS.HOME) return false;
  const before = m.stamina;
  m.stamina = Math.max(0, m.stamina - amount);
  if (before > 0 && m.stamina === 0 && m.status === STATUS.ACTIVE) {
    m.status = STATUS.COLLAPSED;
    return true;
  }
  return false;
}

export function restore(state, id, amount) {
  const m = state.party[id];
  if (!m || m.status === STATUS.HOME) return 0;
  const before = m.stamina;
  m.stamina = Math.min(maxStamina(id), m.stamina + amount);
  // A carried companion who has recovered enough walks again.
  if (m.status === STATUS.CARRIED && m.stamina >= maxStamina(id) * 0.3) m.status = STATUS.ACTIVE;
  return m.stamina - before;
}

export function pendingCollapses(state) {
  return memberIds(state, STATUS.COLLAPSED).filter((id) => id !== 'rusty');
}

export function rustyDown(state) {
  return state.party.rusty.stamina <= 0;
}

export function carry(state, id) {
  state.party[id].status = STATUS.CARRIED;
}

export function sendHome(state, id) {
  state.party[id].status = STATUS.HOME;
}

// ---- Berries ---------------------------------------------------------------

/** Upfront stamina cost of a draw. `stacking` = another berry is already active. */
export function drawCost(type, stacking = false) {
  const base = BALANCE.berries[type].cost;
  return Math.round(stacking ? base * BALANCE.stack.secondCostMult : base);
}

/** Per-second drain for one active berry, given how many are active at once. */
export function drainRate(type, activeCount) {
  const d = BALANCE.berries[type].drain;
  return activeCount >= 2 ? d * BALANCE.stack.drainMult : d;
}

export function takeBerry(state, type) {
  if ((state.pouch[type] || 0) <= 0) return false;
  state.pouch[type] -= 1;
  return true;
}

export function addBerries(state, found) {
  for (const [type, n] of Object.entries(found)) {
    if (BERRY_TYPES.includes(type)) state.pouch[type] = (state.pouch[type] || 0) + n;
  }
}

export function abundance(state) {
  return BALANCE.abundance[Math.min(state.landmark, BALANCE.abundance.length - 1)];
}

// ---- Food, travel, rest ------------------------------------------------------

export function dailyRation(state) {
  const t = BALANCE.travel;
  const walking = active(state).length;
  const carried = memberIds(state, STATUS.CARRIED, STATUS.COLLAPSED).length;
  return walking * t.rationPerMember + carried * (t.rationPerMember + t.carryExtraFood);
}

export function isFoodLow(state) {
  return state.food < dailyRation(state) * BALANCE.rest.lowFoodDays;
}

export function legDays(state) {
  const t = BALANCE.travel;
  let days = state.pace === 'hard' ? t.hardPaceDays : t.daysPerLeg;
  if (memberIds(state, STATUS.CARRIED).length > 0) days += t.carryExtraDays;
  return days;
}

/** Feed everyone travelling for one day. Returns ids that went unfed. */
function feedDay(state) {
  const unfed = [];
  const t = BALANCE.travel;
  // Carried companions are fed first — they can't forage for themselves.
  const order = [...memberIds(state, STATUS.CARRIED, STATUS.COLLAPSED), ...active(state)];
  for (const id of order) {
    const need = state.party[id].status === STATUS.ACTIVE ? t.rationPerMember : t.rationPerMember + t.carryExtraFood;
    if (state.food >= need) state.food -= need;
    else unfed.push(id);
  }
  return unfed;
}

/** One day on the trail. Returns a report of every cost paid. */
export function travelDay(state) {
  const t = BALANCE.travel;
  const report = { day: state.day, foodBefore: state.food, unfed: [], paceCost: {}, collapsed: [] };
  report.unfed = feedDay(state);
  for (const id of report.unfed) {
    if (spend(state, id, t.starveStaminaLoss)) report.collapsed.push(id);
  }
  if (state.pace === 'hard') {
    for (const id of active(state)) {
      report.paceCost[id] = t.hardPaceStaminaPerDay;
      if (spend(state, id, t.hardPaceStaminaPerDay)) report.collapsed.push(id);
    }
  }
  report.foodAfter = state.food;
  state.day += 1;
  return report;
}

/** Spend a day resting. Recovery is slowed when food is low (brief §3). */
export function rest(state) {
  const r = BALANCE.rest;
  const low = isFoodLow(state);
  const unfed = feedDay(state);
  const gained = {};
  for (const id of travellers(state)) {
    let amt = unfed.includes(id) ? r.staminaHungry : r.staminaFed;
    if (low) amt = Math.round(amt * r.lowFoodFactor);
    if (state.party[id].status === STATUS.COLLAPSED) state.party[id].status = STATUS.CARRIED;
    gained[id] = restore(state, id, amt);
  }
  state.day += 1;
  return { low, unfed, gained };
}

/** An extra meal for one member: food in, stamina back. */
export function eatMeal(state, id) {
  const m = BALANCE.meal;
  if (state.food < m.food) return 0;
  const mem = state.party[id];
  if (!mem || mem.status === STATUS.HOME || mem.stamina >= maxStamina(id)) return 0;
  state.food -= m.food;
  if (mem.status === STATUS.COLLAPSED) mem.status = STATUS.CARRIED;
  return restore(state, id, m.stamina);
}

/**
 * After an honest fight, everyone who drew on a berry eats, visibly and
 * ravenously — the on-screen receipt. Rusty skips it if he has used Rootvein
 * (the tell inverted: his missing hunger IS the tell).
 */
export function ravenousEat(state, eaters) {
  const rv = BALANCE.ravenous;
  const receipt = [];
  for (const id of eaters) {
    if (!state.party[id] || state.party[id].status === STATUS.HOME) continue;
    if (id === 'rusty' && state.rootveinUsed) {
      receipt.push({ id, ate: 0, gained: 0, notHungry: true });
      continue;
    }
    // Eat what the bill calls for (at least a mouthful — the tell is always shown).
    const missing = maxStamina(id) - state.party[id].stamina;
    const want = Math.max(1, Math.min(rv.foodPerEater, Math.ceil(missing / rv.staminaPerFood)));
    const ate = Math.min(want, state.food);
    state.food -= ate;
    if (state.party[id].status === STATUS.COLLAPSED && ate > 0) state.party[id].status = STATUS.CARRIED;
    const gained = restore(state, id, ate * rv.staminaPerFood);
    receipt.push({ id, ate, gained, notHungry: false });
  }
  return receipt;
}

// ---- Rootvein ---------------------------------------------------------------

/** Always works. No stamina, no food. Colour drains silently. */
export function useRootvein(state) {
  state.rootveinUsed = true;
  state.colour = Math.max(0, state.colour - BALANCE.rootveinColourDrain);
}

export function driftColour(state, amount) {
  state.colour = Math.max(0, state.colour - amount);
}

// ---- Persistence -------------------------------------------------------------

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(json) {
  const s = JSON.parse(json);
  if (!s || s.version !== SAVE_VERSION || !s.party || !s.party.rusty) throw new Error('Unrecognised save');
  return s;
}
