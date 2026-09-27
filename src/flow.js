// The Director: walks the V1 route. Each landmark is a list of steps (story,
// encounter, tutorial, branch) defined in data/landmarks.js. State is saved
// after every step so a reload resumes where the player left off.

import { LANDMARKS } from './data/landmarks.js';
import { getState, save, checkpoint } from './state/store.js';
import { goto } from './ui/nav.js';

// Wrap a transition so it can fire only once per scene run.
const once = (fn) => function (scene, ...args) {
  if (scene.__leaving) return;
  return fn.call(this, scene, ...args);
};

export const Director = {
  /** Resume from whatever the saved state says. */
  resume(scene) {
    const s = getState();
    if (s.phase === 'coldopen') return goto(scene, 'Story', { script: 'ch1', auto: true, onDone: 'coldopen' });
    if (s.phase === 'camp') return goto(scene, 'Trail');
    if (s.phase === 'ending') return goto(scene, 'Ending', { path: s.rootveinUsed ? 'rootvein' : 'refuse' });
    return this.runStep(scene);
  },

  runStep(scene) {
    const s = getState();
    const lm = LANDMARKS[s.landmark];
    if (!s.flags[`card${s.landmark}`]) return goto(scene, 'Card');
    const step = lm.steps[s.step];
    if (!step) {
      s.phase = 'camp';
      save();
      return goto(scene, 'Trail');
    }
    switch (step.type) {
      case 'story':
        return goto(scene, 'Story', { script: step.id });
      case 'tutorial':
        return goto(scene, step.scene);
      case 'encounter':
        return goto(scene, step.scene, { ...step.config });
      case 'branch':
        return goto(scene, 'Story', { script: s.rootveinUsed ? 'ch12_rootvein' : 'ch12_refuse', onDone: 'ending' });
      default:
        throw new Error(`Unknown step type ${step.type}`);
    }
  },

  /** A scene finished its step. */
  complete: once(function (scene) {
    const s = getState();
    s.step += 1;
    save();
    this.runStep(scene);
  }),

  cardSeen: once(function (scene) {
    const s = getState();
    s.flags[`card${s.landmark}`] = true;
    save();
    this.runStep(scene);
  }),

  coldOpenDone: once(function (scene) {
    const s = getState();
    s.phase = 'landmark';
    s.landmark = 0;
    s.step = 0;
    save();
    checkpoint();
    this.runStep(scene);
  }),

  /** Arrive at the next landmark after travel. */
  arrive: once(function (scene) {
    const s = getState();
    s.landmark += 1;
    s.step = 0;
    s.phase = 'landmark';
    save();
    checkpoint();
    this.runStep(scene);
  }),

  toEnding: once(function (scene) {
    const s = getState();
    s.phase = 'ending';
    save();
    goto(scene, 'Ending', { path: s.rootveinUsed ? 'rootvein' : 'refuse' });
  }),

  /** An encounter ended: show the ledger receipt, then continue. */
  encounterDone: once(function (scene, result) {
    if (result.rustyDown && !result.climax) return goto(scene, 'GameOver');
    if (result.climax) return this.complete(scene);
    goto(scene, 'Receipt', { result });
  }),
};
