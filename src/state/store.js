// Holds the live game state and persists it to the browser (brief §8).
import { SAVE_KEY } from '../config.js';
import { newGame, serialize, deserialize } from './ledger.js';

let state = null;

export function getState() {
  if (!state) state = newGame();
  return state;
}

export function startNew() {
  state = newGame();
  save();
  return state;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, serialize(getState()));
  } catch {
    // Private mode / storage disabled: play continues, just without a save.
  }
}

export function hasSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    deserialize(raw);
    return true;
  } catch {
    return false;
  }
}

export function load() {
  try {
    state = deserialize(localStorage.getItem(SAVE_KEY));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

// Snapshot taken on arrival at each landmark — "try again" after Rusty collapses.
const CHECKPOINT_KEY = SAVE_KEY + '-checkpoint';

export function checkpoint() {
  try {
    localStorage.setItem(CHECKPOINT_KEY, serialize(getState()));
  } catch {
    /* ignore */
  }
}

export function restoreCheckpoint() {
  try {
    state = deserialize(localStorage.getItem(CHECKPOINT_KEY));
    save();
    return true;
  } catch {
    return false;
  }
}
