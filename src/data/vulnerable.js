// "The vulnerable one" — Kit vs. Chipper is still open in the book (brief §10).
// Resolve at runtime from config, falling back gracefully if that companion
// isn't travelling (e.g. was sent home), so nothing hard-codes Kit.
import { VULNERABLE_ID } from '../config.js';
import { COMPANIONS } from './companions.js';

export function resolveVulnerable(state) {
  const ok = (id) => state.party[id] && state.party[id].status !== 'home';
  if (ok(VULNERABLE_ID)) return VULNERABLE_ID;
  const young = Object.keys(COMPANIONS).find((id) => COMPANIONS[id].young && ok(id));
  if (young) return young;
  return Object.keys(state.party).find((id) => id !== 'rusty' && ok(id)) || null;
}
