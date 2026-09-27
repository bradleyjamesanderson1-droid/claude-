// Chiptune music: a tiny look-ahead step sequencer on WebAudio. There are no audio
// files. Every track is a few lines of note text below, so it's easy to rewrite.
//
// Pattern syntax: whitespace-separated eighth-note steps. `C#4` plays a note,
// `.` is a rest, `-` holds the previous note, `|` is ignored (bar marker).
// Drums: k = kick, s = snare, h = hat, `.` = rest.
//
// Mood rules (brief §7): the Rootvein ending and game over are silent, and
// nothing triumphant ever plays after Rootvein. The music stops the moment it's used.

import { audio, isMuted, onMuteChange } from './sfx.js';

const TRACKS = {
  trail: {
    bpm: 100,
    voices: [
      { wave: 'square', gain: 0.5, notes: 'E5 . G5 . A5 - G5 . E5 . D5 . C5 - - . | D5 . E5 . G5 - E5 . D5 . C5 . A4 - - .' },
      { wave: 'triangle', gain: 1, notes: 'C3 . . . G2 . . . A2 . . . F2 . . . | C3 . . . G2 . . . F2 . . . G2 . . .' },
    ],
    drums: 'k . h . s . h . k . h . s . h h',
  },
  // From landmark 5 the blight spreads, and the trail theme goes minor.
  trailDark: {
    bpm: 88,
    voices: [
      { wave: 'square', gain: 0.4, notes: 'A4 . C5 . E5 - D5 . C5 . B4 . A4 - - . | G4 . A4 . C5 - B4 . A4 . E4 . A4 - - .' },
      { wave: 'triangle', gain: 1, notes: 'A2 . . . F2 . . . G2 . . . E2 . . . | A2 . . . F2 . . . E2 . . . A2 . . .' },
    ],
    drums: 'k . . . h . . . k . . . h . . .',
  },
  story: {
    bpm: 80,
    voices: [
      { wave: 'triangle', gain: 0.8, notes: 'C4 E4 G4 C5 G4 E4 | A3 C4 E4 A4 E4 C4 | F3 A3 C4 F4 C4 A3 | G3 B3 D4 G4 D4 B3' },
      { wave: 'triangle', gain: 0.7, notes: 'C3 - - - - - A2 - - - - - F2 - - - - - G2 - - - - -' },
    ],
  },
  dark: {
    bpm: 66,
    voices: [
      { wave: 'triangle', gain: 0.8, notes: 'A3 C4 E4 C4 | F3 A3 C4 A3 | D3 F3 A3 F3 | E3 G#3 B3 G#3' },
      { wave: 'triangle', gain: 0.7, notes: 'A2 - - - F2 - - - D2 - - - E2 - - -' },
    ],
  },
  hollow: {
    bpm: 92,
    voices: [
      { wave: 'square', gain: 0.4, notes: 'G4 . B4 . D5 . B4 . C5 - A4 . B4 - G4 . | A4 . B4 . G4 . E4 . D4 - - . G4 - - .' },
      { wave: 'triangle', gain: 1, notes: 'G2 . D3 . G2 . D3 . C3 . G2 . G2 . D3 . | D3 . A2 . E3 . B2 . D3 . A2 . G2 . . .' },
    ],
    drums: 'k . . . h . . . k . h . h . . .',
  },
  forage: {
    bpm: 120,
    voices: [
      { wave: 'square', gain: 0.45, notes: 'F5 . A5 . C6 . A5 . G5 . E5 . C5 . . . | D5 . F5 . A5 . G5 . F5 . E5 . F5 . . .' },
      { wave: 'triangle', gain: 1, notes: 'F2 . C3 . F2 . C3 . C3 . G2 . C3 . G2 . | Bb2 . F3 . Bb2 . F3 . C3 . G2 . F2 . C3 .' },
    ],
    drums: 'k . h . s . h . k . h . s . h .',
  },
  chase: {
    bpm: 156,
    voices: [
      { wave: 'square', gain: 0.45, notes: 'E5 E5 . E5 G5 . E5 . D5 D5 . D5 B4 . D5 . | C5 C5 . C5 E5 . C5 . B4 . D5 . E5 - - .' },
      { wave: 'triangle', gain: 1, notes: 'E2 E3 E2 E3 E2 E3 E2 E3 D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 B1 B2 B1 B2 B1 B2 B1 B2' },
    ],
    drums: 'k h s h k k s h',
  },
  skirmish: {
    bpm: 132,
    voices: [
      { wave: 'square', gain: 0.45, notes: 'D5 . . F5 . . E5 . D5 . C5 . A4 - - . | Bb4 . . D5 . . C5 . A4 . G4 . A4 - - .' },
      { wave: 'triangle', gain: 1, notes: 'D2 . D2 . D3 . D2 . Bb1 . Bb1 . Bb2 . Bb1 . | C2 . C2 . C3 . C2 . A1 . A1 . A2 . A1 .' },
    ],
    drums: 'k . h . s . h k k . h . s . h h',
  },
  climax: {
    bpm: 112,
    voices: [
      { wave: 'square', gain: 0.45, notes: 'C5 - - . Eb5 - D5 . C5 - - . G4 - - . | Ab4 - - . C5 - Bb4 . G4 - - . . . . .' },
      { wave: 'triangle', gain: 1, notes: 'C2 . C2 C2 . C2 . . Ab1 . Ab1 Ab1 . Ab1 . . | F1 . F1 F1 . F1 . . G1 . G1 G1 . G1 G1 G1' },
    ],
    drums: 'k . . k s . . . k . k . s . h h',
  },
  // The refuse ending: quiet, warm, whole.
  regroup: {
    bpm: 72,
    voices: [
      { wave: 'triangle', gain: 0.9, notes: 'F4 . A4 . C5 - - . | Bb4 . A4 . G4 - - . | A4 . G4 . F4 - - . | E4 . G4 . F4 - - -' },
      { wave: 'triangle', gain: 0.6, notes: 'F2 - - - - - - - Bb2 - - - - - - - F2 - - - - - - - C3 - - - C3 - - -' },
    ],
  },
};

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(tok) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok);
  if (!m) return null;
  const midi = 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

export function parse(pattern) {
  return pattern.split(/\s+/).filter((t) => t && t !== '|');
}

const MASTER = 0.05;
let master = null;
let noise = null;
let current = null; // { name, track, step, next }
let timer = null;

function setup(ctx) {
  if (master) return;
  master = ctx.createGain();
  master.gain.value = isMuted() ? 0 : MASTER;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function tone(ctx, wave, freq, t, dur, gain) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = wave;
  o.frequency.value = freq;
  const peak = gain * (wave === 'square' ? 0.35 : 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.01);
  g.gain.setValueAtTime(peak, t + Math.max(0.02, dur - 0.04));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function drum(ctx, kind, t) {
  if (kind === 'k') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.15);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = kind === 'h' ? 'highpass' : 'bandpass';
  f.frequency.value = kind === 'h' ? 7000 : 1800;
  const g = ctx.createGain();
  const len = kind === 'h' ? 0.03 : 0.09;
  g.gain.setValueAtTime(kind === 'h' ? 0.25 : 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + len + 0.01);
}

function compile(track) {
  return {
    stepDur: 60 / track.bpm / 2,
    voices: track.voices.map((v) => ({ ...v, tokens: parse(v.notes) })),
    drums: track.drums ? parse(track.drums) : null,
  };
}

function scheduleStep(ctx, c, t) {
  const { stepDur, voices, drums } = c.track;
  for (const v of voices) {
    const toks = v.tokens;
    const i = c.step % toks.length;
    const f = noteFreq(toks[i]);
    if (!f) continue;
    let len = 1;
    while (toks[(i + len) % toks.length] === '-' && len < toks.length) len += 1;
    tone(ctx, v.wave, f, t, len * stepDur * 0.92, v.gain);
  }
  if (drums) {
    const d = drums[c.step % drums.length];
    if (d !== '.') drum(ctx, d, t);
  }
}

function pump() {
  const ctx = audio();
  if (!ctx || !current || ctx.state !== 'running' || document.hidden) return;
  if (current.next < ctx.currentTime) current.next = ctx.currentTime + 0.05;
  while (current.next < ctx.currentTime + 0.15) {
    scheduleStep(ctx, current, current.next);
    current.next += current.track.stepDur;
    current.step += 1;
  }
}

/** Switch to a track by name, or `null` for silence. Same track = keep playing. */
export function playMusic(name) {
  if (current?.name === name || (!current && !name)) return;
  current = null;
  if (!name) return;
  const ctx = audio();
  if (!ctx) return;
  setup(ctx);
  current = { name, track: compile(TRACKS[name]), step: 0, next: ctx.currentTime + 0.1 };
  if (!timer) timer = setInterval(pump, 30);
}

export const stopMusic = () => playMusic(null);

onMuteChange((m) => {
  if (master) master.gain.value = m ? 0 : MASTER;
});

export const TRACK_NAMES = Object.keys(TRACKS);
export { TRACKS };

export const currentTrack = () => current?.name ?? null;
