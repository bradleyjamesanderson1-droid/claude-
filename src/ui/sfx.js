// Tiny WebAudio blips. Music lives in music.js and shares this AudioContext.
let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem('wr-muted') === '1';
} catch {
  /* ignore */
}

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const SOUNDS = {
  click: [[660, 0.04, 'square']],
  jump: [[330, 0.06, 'square'], [520, 0.06, 'square']],
  staff: [[200, 0.05, 'sawtooth']],
  hit: [[140, 0.1, 'square'], [90, 0.1, 'square']],
  knock: [[420, 0.05, 'triangle'], [260, 0.06, 'triangle']],
  pickup: [[880, 0.05, 'square'], [1320, 0.07, 'square']],
  draw: [[520, 0.06, 'triangle'], [700, 0.06, 'triangle'], [900, 0.08, 'triangle']],
  eat: [[240, 0.05, 'square'], [0, 0.04], [240, 0.05, 'square'], [0, 0.04], [260, 0.06, 'square']],
  collapse: [[300, 0.12, 'triangle'], [200, 0.14, 'triangle'], [120, 0.2, 'triangle']],
  warn: [[980, 0.05, 'square'], [0, 0.05], [980, 0.05, 'square']],
  rootvein: [[70, 0.9, 'sine']],
};

export function sfx(name) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  let t = a.currentTime;
  for (const [freq, dur, type] of SOUNDS[name] || []) {
    if (freq > 0) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t);
      o.stop(t + dur);
    }
    t += dur;
  }
}

const muteListeners = [];
export const onMuteChange = (fn) => muteListeners.push(fn);

export function toggleMute() {
  muted = !muted;
  muteListeners.forEach((fn) => fn(muted));
  try {
    localStorage.setItem('wr-muted', muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  return muted;
}

export const isMuted = () => muted;
