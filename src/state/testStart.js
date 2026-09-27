// Chapter select (test builds only): build a plausible state for arriving at
// landmark `n` fresh, so testers can jump straight to a chapter. It mirrors what
// a normal run would have by then: who has joined, whether Berrycraft is
// learned, and roughly how much food and how many berries are left.

import { BALANCE } from '../config.js';
import { COMPANIONS, BERRY_TYPES } from '../data/companions.js';
import { newGame, join } from './ledger.js';

export function stateAtLandmark(n) {
  const s = newGame();
  s.phase = 'landmark';
  s.landmark = n;
  s.step = 0;
  s.day = 1 + n * 2;
  // Companions join during a landmark's story, so a fresh arrival only has
  // those who joined at an EARLIER landmark.
  join(
    s,
    Object.keys(COMPANIONS).filter((id) => COMPANIONS[id].joinsAt < n),
  );
  if (n > 3) s.flags.berrycraft = true; // taught at Mosswhisker's Hollow
  // Food: a middling run. The early grove is well fed; later, supplies are thin.
  s.food = n < 4 ? BALANCE.startFood - n * 2 : n < 9 ? 20 : 14;
  // Berries thin with the blight.
  const ab = BALANCE.abundance[n];
  for (const t of BERRY_TYPES) s.pouch[t] = Math.max(1, Math.round(BALANCE.startPouch[t] * ab));
  s.flags.chapterSelect = true; // marks the run as a test jump in feedback reports
  return s;
}
