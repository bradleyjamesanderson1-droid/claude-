// Aria's character rig: a layered 2.5D face drawn on canvas.
//
// Everything is procedural so it can be driven continuously:
// - Head pose (yaw/pitch/roll) with depth parallax: features at different
//   depths shift by different amounts, so turns read as 3D.
// - Hair locks simulated as spring chains; they lag and swing with the head.
// - Eyes with saccades, micro-saccades, pupil dilation, gaze-following lids,
//   per-eye blinks (winks), and a happy "closed smile" eye shape.
// - Visemes: speech text is turned into a mouth-shape timeline and kept in
//   sync with the voice's word-boundary events.
// - Expressions blend through critically damped springs; mood changes fire
//   small gestures (nod, head-back, wink, head shake) and idle behaviours
//   (glances, tilts, sighs) keep her alive between turns.
//
// Public API (unchanged from the SVG version, plus speech hooks):
//   setState("idle"|"listening"|"thinking"|"speaking"), setMood(name),
//   setMouth(0..1), speakStart(text, rate), speakSync(charIndex), speakEnd(),
//   mood (read-only name of the current mood).

const W = 400, H = 460;
const PIVOT_X = 200, PIVOT_Y = 318;
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

const MOODS = {
  neutral:   { browL: 0,   browR: 0,   tilt: 0,   furrow: 0,   smileL: 0.25, smileR: 0.25, droop: 0.12, squint: 0.06, blush: 0.25, pupil: 5.4, roll: 0,  pitch: 0,     open: 0,    wide: 0.1 },
  happy:     { browL: 2.5, browR: 2.5, tilt: 0,   furrow: 0,   smileL: 0.95, smileR: 0.95, droop: 0.14, squint: 0.6,  blush: 0.6,  pupil: 6.2, roll: 2,  pitch: -0.05, open: 0.12, wide: 0.5 },
  thinking:  { browL: 3.5, browR: 0.5, tilt: -1,  furrow: 0.45,smileL: 0.05, smileR: 0.25, droop: 0.22, squint: 0.1,  blush: 0.2,  pupil: 5.0, roll: -4, pitch: -0.08, open: 0,    wide: -0.1 },
  surprised: { browL: 7,   browR: 7,   tilt: 0,   furrow: 0,   smileL: 0.1,  smileR: 0.1,  droop: 0,    squint: 0,    blush: 0.35, pupil: 4.3, roll: 0,  pitch: -0.18, open: 0.35, wide: -0.5 },
  concerned: { browL: 2,   browR: 2,   tilt: 4,   furrow: 0.3, smileL: -0.3, smileR: -0.3, droop: 0.2,  squint: 0.05, blush: 0.15, pupil: 6.0, roll: 4,  pitch: 0.06,  open: 0,    wide: -0.1 },
  playful:   { browL: 4.5, browR: 0.5, tilt: -1,  furrow: 0,   smileL: 0.4,  smileR: 1.0,  droop: 0.15, squint: 0.35, blush: 0.6,  pupil: 6.2, roll: -6, pitch: 0,     open: 0.05, wide: 0.4 },
};

// Mouth shapes: o = open, w = wide(+)/round(-), p = lips pressed, b = lip bite.
const VISEMES = {
  rest: { o: 0, w: 0.1 }, A: { o: 0.8, w: 0.15 }, E: { o: 0.45, w: 0.55 }, I: { o: 0.3, w: 0.75 },
  O: { o: 0.6, w: -0.55 }, U: { o: 0.28, w: -0.9 }, M: { o: 0, w: 0, p: 1 }, F: { o: 0.1, w: 0.2, b: 1 },
  S: { o: 0.18, w: 0.45 }, L: { o: 0.35, w: 0.2 }, R: { o: 0.3, w: -0.3 },
};
const LETTER_VISEME = {
  a: "A", e: "E", i: "I", y: "I", o: "O", u: "U", w: "U", q: "U", m: "M", b: "M", p: "M", f: "F", v: "F",
  l: "L", r: "R", s: "S", z: "S", c: "S", x: "S", t: "S", d: "S", n: "S", k: "S", g: "S", j: "S", h: "S",
};

// Hair locks: root (x, y, depth), start angle (deg, 0 = straight down, + = toward screen right),
// curl (deg per segment), length, root width, front (drawn over the face) or back.
const LOCKS = [
  // long locks at the back edges
  { x: 104, y: 196, z: -0.5, a: -7, c: 1, len: 188, w: 24, layer: "back" },
  { x: 296, y: 196, z: -0.5, a: 7, c: -1, len: 188, w: 24, layer: "back" },
  { x: 118, y: 230, z: -0.45, a: -3, c: 0.5, len: 160, w: 18, layer: "back" },
  { x: 282, y: 230, z: -0.45, a: 3, c: -0.5, len: 160, w: 18, layer: "back" },
  // side locks framing the face
  { x: 121, y: 150, z: 0.02, a: -7, c: 1.4, len: 176, w: 17, layer: "front" },
  { x: 125, y: 174, z: 0.02, a: -3, c: 0.5, len: 138, w: 11, layer: "front" },
  { x: 279, y: 150, z: 0.02, a: 7, c: -1.4, len: 176, w: 17, layer: "front" },
  { x: 275, y: 174, z: 0.02, a: 3, c: -0.5, len: 138, w: 11, layer: "front" },
  // bangs: a swoop from the side part at x≈222 across the forehead
  { x: 223, y: 110, z: 0.45, a: -40, c: 6, len: 54, w: 17, layer: "front" },
  { x: 214, y: 112, z: 0.45, a: -72, c: 9, len: 96, w: 18, layer: "front" },
  { x: 198, y: 114, z: 0.45, a: -64, c: 8, len: 92, w: 18, layer: "front" },
  { x: 180, y: 118, z: 0.4, a: -52, c: 7, len: 84, w: 17, layer: "front" },
  { x: 160, y: 126, z: 0.32, a: -36, c: 5, len: 76, w: 16, layer: "front" },
  { x: 142, y: 138, z: 0.22, a: -18, c: 3, len: 70, w: 14, layer: "front" },
  { x: 232, y: 112, z: 0.45, a: 26, c: -2, len: 60, w: 15, layer: "front" },
  { x: 250, y: 118, z: 0.38, a: 18, c: -1.5, len: 60, w: 15, layer: "front" },
  { x: 266, y: 130, z: 0.28, a: 10, c: -1, len: 62, w: 13, layer: "front" },
];
const SEGMENTS = 6;

const FACE = [
  [200, 104, 0.25], [246, 112, 0.12], [274, 146, 0.02], [280, 196, 0], [275, 244, 0.05], [257, 284, 0.25],
  [229, 310, 0.45], [200, 319, 0.6], [171, 310, 0.45], [143, 284, 0.25], [125, 244, 0.05], [120, 196, 0],
  [126, 146, 0.02], [154, 112, 0.12],
];

const COLOR_VARS = ["skin", "skin-hi", "shade", "blush", "hair", "hair-hi", "hair-shine", "brow", "lash",
  "sclera", "iris", "iris-hi", "pupil", "lip", "mouth", "top", "top-hi", "aura", "muted"];

// Critically damped spring step.
function spring(cur, vel, target, freq, dt) {
  const w = 2 * Math.PI * freq;
  const x = cur - target;
  const e = Math.exp(-w * dt);
  return [target + (x + (vel + w * x) * dt) * e, (vel - w * (vel + w * x) * dt) * e];
}

// Smooth closed/open curve through points (Catmull-Rom as cubic Béziers).
function curve(ctx, pts, closed) {
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  ctx.moveTo(pts[0][0], pts[0][1]);
  const end = closed ? n : n - 1;
  for (let i = 0; i < end; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]
    );
  }
  if (closed) ctx.closePath();
}

function buildTimeline(text, rate = 1) {
  const tl = [];
  let t = 0, word = 0, inWord = false;
  const r = Math.max(0.5, rate);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toLowerCase();
    let vis = LETTER_VISEME[ch], dur;
    if (vis) dur = "aeiouy".includes(ch) ? 0.085 : 0.058;
    else if (/[0-9]/.test(ch)) { vis = "A"; dur = 0.12; }
    else if (/[,;:]/.test(ch)) { vis = "rest"; dur = 0.2; }
    else if (/[.!?]/.test(ch)) { vis = "rest"; dur = 0.32; }
    else { vis = "rest"; dur = 0.035; }
    const isLetter = vis !== "rest";
    const wordStart = isLetter && !inWord;
    inWord = isLetter;
    if (wordStart) word++;
    const prev = tl[tl.length - 1];
    dur /= r;
    if (prev && prev.vis === vis && !wordStart) prev.dur += dur;
    else tl.push({ ci: i, t, dur, vis, amp: rand(0.85, 1.1), word: wordStart ? word : 0, end: /[.!?]/.test(ch) });
    t += dur;
  }
  return { tl, total: t };
}

export class Avatar {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "avatar-canvas";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", "Animated assistant");
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.state = "idle";
    this.mood = "neutral";
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const m = MOODS.neutral;
    this.p = { yaw: 0, pitch: 0, roll: 0, lean: 0, gazeX: 0, gazeY: 0, ...m, open: 0, wide: 0.1, press: 0, bite: 0, aura: 0.35 };
    this.v = Object.fromEntries(Object.keys(this.p).map((k) => [k, 0]));
    this.tgt = { ...this.p };

    this.gaze = { x: 0, y: 0 };      // where she's looking (saccade target)
    this.nextSaccade = 0;
    this.pointer = null;
    this.blink = { L: 0, R: 0, start: 0, eyes: "both", next: performance.now() + 1500 };
    this.behaviour = null;
    this.nextBehaviour = performance.now() + 3000;
    this.nextNod = 0;
    this.browFlash = 0;
    this.surpriseUntil = 0;
    this.mouthManual = 0;
    this.utt = null;
    this.sparkles = [];
    this.shake = 0;
    this.last = performance.now();
    this.t0 = this.last;

    this.locks = LOCKS.map((l) => ({ ...l, pts: null, prev: null, phase: rand(0, 6) }));
    this.earrings = [-1, 1].map((s) => ({ s, ang: 0, vel: 0, anchor: null, anchorV: [0, 0] }));
    this.pendant = { ang: 0, vel: 0, anchor: null, anchorV: [0, 0] };
    this.backTail = [-1, 1].map(() => ({ x: 0, y: 0, vx: 0, vy: 0, init: false }));

    this.readColors();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => this.readColors());
    new MutationObserver(() => this.readColors()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });

    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);

    window.addEventListener("pointermove", (e) => {
      const r = this.canvas.getBoundingClientRect();
      const lx = (e.clientX - r.left - this.ox) / this.S;
      const ly = (e.clientY - r.top - this.oy) / this.S;
      this.pointer = { x: clamp((lx - 200) / 170, -1, 1), y: clamp((ly - 215) / 170, -1, 1), t: performance.now() };
    });

    requestAnimationFrame((t) => this.frame(t));
  }

  // ------------------------------------------------------------ public API
  setState(state) {
    if (state === this.state) return;
    this.state = state;
    this.canvas.dataset.state = state;
    if (state === "thinking") this.setMood("thinking");
    if (state === "listening") {
      if (this.mood === "thinking") this.setMood("neutral");
      this.v.pitch += 1.5;
    }
  }

  setMood(mood) {
    if (!MOODS[mood] || mood === this.mood) return;
    this.mood = mood;
    const now = performance.now();
    if (mood === "happy") { this.v.pitch += 2.2; this.sparkle(4); }
    if (mood === "surprised") { this.v.pitch -= 2.5; this.v.browL += 60; this.v.browR += 60; this.surpriseUntil = now + 1100; }
    if (mood === "playful") { this.wink("R"); this.v.roll -= 25; this.sparkle(3); }
    if (mood === "concerned") this.shake = now;
  }

  setMouth(v) { this.mouthManual = clamp(v, 0, 1); }

  speakStart(text, rate = 1) {
    this.utt = { ...buildTimeline(text, rate), start: performance.now(), lastWord: 0, lastEnd: -1 };
  }

  speakSync(charIndex) {
    const u = this.utt;
    if (!u) return;
    const seg = u.tl.find((s) => s.ci >= charIndex);
    if (seg) u.start = performance.now() - seg.t * 1000;
  }

  speakEnd() { this.utt = null; }

  // ------------------------------------------------------------ helpers
  readColors() {
    const cs = getComputedStyle(document.documentElement);
    this.c = {};
    for (const k of COLOR_VARS) this.c[k] = cs.getPropertyValue("--" + k).trim() || "#888";
  }

  resize() {
    const r = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.S = Math.min(r.width / W, r.height / H) || 1;
    this.ox = (r.width - W * this.S) / 2;
    this.oy = (r.height - H * this.S) / 2;
  }

  wink(eye) {
    this.blink.start = performance.now();
    this.blink.eyes = eye;
    this.blink.dur = 420;
  }

  sparkle(n) {
    if (this.reduced) return;
    for (let i = 0; i < n; i++) {
      this.sparkles.push({ x: rand(120, 290), y: rand(90, 200), vy: rand(-22, -12), life: 0, max: rand(0.9, 1.5), size: rand(3, 6) });
    }
  }

  // World position of a head-attached point at depth z.
  hp(x, y, z = 0) {
    const P = this.p;
    let X = 200 + (x - 200) * (1 - 0.06 * Math.abs(P.yaw)) + P.yaw * (26 * z + 4);
    let Y = y + P.pitch * (18 * z + 3);
    const r = P.roll * DEG, c = Math.cos(r), s = Math.sin(r);
    const dx = X - PIVOT_X, dy = Y - PIVOT_Y;
    X = PIVOT_X + dx * c - dy * s;
    Y = PIVOT_Y + dx * s + dy * c;
    return [X, Y + this.headY];
  }

  // Place the context at a feature's position, rotated with the head and foreshortened.
  place(x, y, z, sx = 1) {
    const [X, Y] = this.hp(x, y, z);
    this.ctx.save();
    this.ctx.translate(X, Y);
    this.ctx.rotate(this.p.roll * DEG);
    this.ctx.scale(sx * (1 - 0.18 * Math.abs(this.p.yaw)), 1);
  }

  // ------------------------------------------------------------ simulation
  frame(now) {
    const dt = clamp((now - this.last) / 1000, 0.001, 0.05);
    this.last = now;
    const t = (now - this.t0) / 1000;
    this.update(now, t, dt);
    this.draw(now, t);
    requestAnimationFrame((n) => this.frame(n));
  }

  update(now, t, dt) {
    const P = this.p, T = this.tgt, V = this.v;
    const mood = MOODS[this.mood];
    const calm = this.reduced ? 0.3 : 1;
    const st = this.state;

    // --- expression targets
    Object.assign(T, {
      browL: mood.browL, browR: mood.browR, tilt: mood.tilt, furrow: mood.furrow,
      smileL: mood.smileL, smileR: mood.smileR, droop: mood.droop, squint: mood.squint,
      blush: mood.blush, pupil: mood.pupil,
    });
    if (st === "listening") { T.browL += 1.5; T.browR += 1.5; T.pupil += 0.4; }
    this.browFlash *= Math.exp(-dt * 5);
    T.browL += this.browFlash; T.browR += this.browFlash;
    T.pupil += Math.sin(t * 0.9) * 0.15; // hippus

    // --- behaviours between turns
    if (!this.behaviour && now > this.nextBehaviour && (st === "idle" || st === "speaking")) {
      const kinds = st === "speaking" ? ["glance"] : ["glance", "glance", "tilt", "smile", "sigh"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      this.behaviour = { kind, until: now + rand(700, 2200), gx: rand(-0.9, 0.9), gy: rand(-0.5, 0.35), dir: Math.random() < 0.5 ? -1 : 1 };
      if (kind === "sigh") V.pitch -= 1;
      this.nextBehaviour = now + rand(st === "speaking" ? 3500 : 2500, st === "speaking" ? 7000 : 6500);
    }
    if (this.behaviour && now > this.behaviour.until) this.behaviour = null;
    const B = this.behaviour;

    // --- gaze: saccades toward a target, head follows more slowly
    let gx = 0, gy = 0;
    if (st === "thinking") { gx = -0.55; gy = -0.7; }
    else if (B?.kind === "glance") { gx = B.gx; gy = B.gy; }
    else if (this.pointer && now - this.pointer.t < 4000 && st !== "speaking") { gx = this.pointer.x; gy = this.pointer.y; }
    if (now > this.nextSaccade) {
      const jitter = st === "thinking" ? 0.25 : 0.05;
      const nx = gx + rand(-jitter, jitter), ny = gy + rand(-jitter, jitter) * 0.6;
      if (Math.hypot(nx - this.gaze.x, ny - this.gaze.y) > 0.5 && Math.random() < 0.4) this.startBlink(now);
      this.gaze.x = nx; this.gaze.y = ny;
      this.nextSaccade = now + (st === "thinking" ? rand(350, 900) : rand(400, 1100));
    }
    T.gazeX = this.gaze.x; T.gazeY = this.gaze.y;

    // --- head pose
    const drift = (a, b) => (Math.sin(t * a) + Math.sin(t * b * 1.7 + 1.3)) * 0.5;
    const lively = st === "speaking" ? 1.6 : 1;
    T.yaw = this.gaze.x * 0.38 + drift(0.31, 0.23) * 0.05 * calm * lively;
    T.pitch = this.gaze.y * 0.22 + mood.pitch + drift(0.27, 0.19) * 0.03 * calm * lively;
    T.roll = mood.roll + drift(0.21, 0.13) * 1.6 * calm + (st === "listening" ? 5 : 0) + (B?.kind === "tilt" ? 6 * B.dir : 0);
    if (this.shake && now - this.shake < 700) T.yaw += Math.sin((now - this.shake) / 70) * 0.12 * (1 - (now - this.shake) / 700);
    T.lean = st === "listening" ? 1 : 0;
    if (st === "listening" && now > this.nextNod) { V.pitch += 1.8; this.nextNod = now + rand(2200, 4200); }
    if (B?.kind === "smile") { T.smileL += 0.35; T.smileR += 0.35; T.squint += 0.2; }
    if (B?.kind === "sigh") { T.droop += 0.5; }

    // --- mouth: visemes while speaking, otherwise mood rest shape
    let open = mood.open, wide = mood.wide, press = 0, bite = 0;
    if (this.mood === "surprised" && now > this.surpriseUntil) { open = 0.08; wide = -0.2; }
    if (this.mood === "thinking") press = 0.35;
    const u = this.utt;
    if (u) {
      const el = (now - u.start) / 1000;
      const seg = u.tl.find((s) => el >= s.t && el < s.t + s.dur);
      if (seg) {
        const vz = VISEMES[seg.vis];
        open = vz.o * seg.amp; wide = vz.w + (P.smileL + P.smileR) * 0.15; press = vz.p || 0; bite = vz.b || 0;
        if (seg.word && seg.word !== u.lastWord) {
          u.lastWord = seg.word;
          if (Math.random() < 0.22) { this.browFlash = Math.max(this.browFlash, rand(1.5, 3)); V.pitch += rand(0.6, 1.4); }
        }
        if (seg.end && seg.ci !== u.lastEnd) { u.lastEnd = seg.ci; V.pitch += 0.9; if (Math.random() < 0.5) this.startBlink(now); }
      }
    } else if (this.mouthManual > 0.02) {
      open = this.mouthManual;
    }
    T.open = open; T.wide = wide; T.press = press; T.bite = bite;
    T.aura = { idle: 0.35, listening: 0.85, thinking: 0.55, speaking: 0.55 + P.open * 0.4 }[st] ?? 0.35;

    // --- springs
    const F = { yaw: 2.2, pitch: 2.4, roll: 1.6, lean: 1.2, gazeX: 14, gazeY: 14, open: 14, wide: 9, press: 12, bite: 12, pupil: 1.5, aura: 2 };
    for (const k of Object.keys(P)) {
      [P[k], V[k]] = spring(P[k], V[k], T[k], F[k] || 4.5, dt);
    }

    // --- blinks
    if (now > this.blink.next) this.startBlink(now);
    const b = this.blink, bd = b.dur || 230, e = (now - b.start) / bd;
    let bv = 0;
    if (e >= 0 && e < 1) bv = e < 0.38 ? e / 0.38 : 1 - (e - 0.38) / 0.62;
    bv = bv * bv * (3 - 2 * bv);
    this.blinkL = b.eyes === "R" ? 0 : bv;
    this.blinkR = b.eyes === "L" ? 0 : bv;

    // --- body
    this.breath = Math.sin(t * (2 * Math.PI / 4.4)) * calm;
    this.headY = this.breath * 1.1 + P.lean * 3;

    this.simHair(t, dt, calm);
    this.simPendulums(dt);

    for (const s of this.sparkles) { s.life += dt; s.y += s.vy * dt; }
    this.sparkles = this.sparkles.filter((s) => s.life < s.max);
  }

  startBlink(now) {
    this.blink.start = now;
    this.blink.eyes = "both";
    this.blink.dur = rand(200, 260);
    this.blink.next = now + (Math.random() < 0.12 ? 320 : rand(2200, 5600));
  }

  simHair(t, dt, calm) {
    const step = dt * 60;
    for (const L of this.locks) {
      const seg = L.len / SEGMENTS;
      const root = this.hp(L.x, L.y, L.z);
      // rest pose for this frame
      const rest = [root];
      for (let i = 1; i <= SEGMENTS; i++) {
        const a = (L.a + L.c * (i - 1)) * DEG + this.p.roll * DEG * 0.6;
        const p = rest[i - 1];
        rest.push([p[0] + Math.sin(a) * seg, p[1] + Math.cos(a) * seg]);
      }
      if (!L.pts) { L.pts = rest.map((p) => [...p]); L.prev = rest.map((p) => [...p]); continue; }
      L.pts[0] = root;
      for (let i = 1; i <= SEGMENTS; i++) {
        const p = L.pts[i], q = L.prev[i];
        const vx = (p[0] - q[0]) * 0.88, vy = (p[1] - q[1]) * 0.88;
        q[0] = p[0]; q[1] = p[1];
        const k = 0.16 * (1 - 0.72 * (i / SEGMENTS)) * step;
        const wind = Math.sin(t * 0.8 + L.phase + i * 0.5) * 0.035 * i * calm * step;
        p[0] += vx + (rest[i][0] - p[0]) * k + wind;
        p[1] += vy + (rest[i][1] - p[1]) * k + 0.08 * step;
      }
      for (let it = 0; it < 2; it++) {
        for (let i = 1; i <= SEGMENTS; i++) {
          const a = L.pts[i - 1], p = L.pts[i];
          const dx = p[0] - a[0], dy = p[1] - a[1], d = Math.hypot(dx, dy) || 1;
          const f = (d - seg) / d;
          if (i === 1) { p[0] -= dx * f; p[1] -= dy * f; }
          else { p[0] -= dx * f * 0.5; p[1] -= dy * f * 0.5; a[0] += dx * f * 0.5; a[1] += dy * f * 0.5; }
        }
      }
    }
    // lower corners of the back hair mass lag behind the head
    for (const [i, s] of [-1, 1].entries()) {
      const tail = this.backTail[i];
      const [tx, ty] = this.hp(200 + s * 104, 250, -0.5);
      const goalX = tx + s * 8, goalY = ty + 140;
      if (!tail.init) { Object.assign(tail, { x: goalX, y: goalY, init: true }); continue; }
      [tail.x, tail.vx] = spring(tail.x, tail.vx, goalX, 1.3, dt);
      [tail.y, tail.vy] = spring(tail.y, tail.vy, goalY, 1.3, dt);
    }
  }

  simPendulums(dt) {
    const swing = (pd, anchor, len) => {
      if (pd.anchor) {
        const vx = (anchor[0] - pd.anchor[0]) / dt;
        const ax = (vx - pd.anchorV[0]) / dt;
        pd.anchorV = [vx, 0];
        const acc = -(900 / len) * Math.sin(pd.ang) - (ax / len) * Math.cos(pd.ang) * 0.9 - pd.vel * 2.2;
        pd.vel += clamp(acc, -400, 400) * dt;
        pd.ang = clamp(pd.ang + pd.vel * dt, -1.2, 1.2);
      }
      pd.anchor = anchor;
    };
    for (const er of this.earrings) swing(er, this.hp(200 + er.s * 82, 244, -0.35), 14);
    swing(this.pendant, [200, 371 - this.breath * 1.8], 10);
  }

  // ------------------------------------------------------------ drawing
  draw(now, t) {
    const ctx = this.ctx, C = this.c, P = this.p;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const k = this.dpr * this.S;
    ctx.setTransform(k, 0, 0, k, this.dpr * this.ox, this.dpr * this.oy);

    this.drawAura(t);

    const hairGrad = ctx.createLinearGradient(0, 60, 0, 420);
    hairGrad.addColorStop(0, C["hair-hi"]);
    hairGrad.addColorStop(0.5, C.hair);
    hairGrad.addColorStop(1, C.hair);
    this.hairGrad = hairGrad;

    this.drawBackHair();
    for (const L of this.locks) if (L.layer === "back") this.drawLock(L);
    this.drawBody();
    this.drawEars();
    this.drawFace();
    this.drawEarrings();
    this.drawSkullcap();
    for (const L of this.locks) if (L.layer === "front") this.drawLock(L);
    this.drawHairShine();
    this.drawThinking(t);
    this.drawSparkles();
  }

  drawAura(t) {
    const ctx = this.ctx, C = this.c, P = this.p;
    const g = ctx.createRadialGradient(200, 215, 60, 200, 215, 200);
    ctx.globalAlpha = clamp(P.aura, 0, 1);
    g.addColorStop(0, C.aura + "55");
    g.addColorStop(0.6, C.aura + "22");
    g.addColorStop(1, C.aura + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    if (this.state === "listening" && !this.reduced) {
      for (let i = 0; i < 3; i++) {
        const ph = ((t * 0.6 + i / 3) % 1);
        ctx.beginPath();
        ctx.arc(200, 215, 150 + ph * 50, 0, Math.PI * 2);
        ctx.strokeStyle = C.aura;
        ctx.globalAlpha = (1 - ph) * 0.35;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  drawBackHair() {
    const ctx = this.ctx;
    const [l, r] = this.backTail;
    const pts = [
      this.hp(200, 62, -0.8), this.hp(262, 72, -0.7), this.hp(306, 122, -0.6), this.hp(318, 200, -0.5),
      this.hp(314, 262, -0.45), [r.x, r.y], [200, (l.y + r.y) / 2 + 14], [l.x, l.y],
      this.hp(86, 262, -0.45), this.hp(82, 200, -0.5), this.hp(94, 122, -0.6), this.hp(138, 72, -0.7),
    ];
    ctx.beginPath();
    curve(ctx, pts, true);
    ctx.fillStyle = this.hairGrad;
    ctx.fill();
    // inner shadow behind the head
    ctx.save();
    ctx.clip();
    const [cx, cy] = this.hp(200, 230, -0.6);
    const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
    g.addColorStop(0, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawLock(L) {
    if (!L.pts) return;
    const ctx = this.ctx, pts = L.pts, n = pts.length;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const d = Math.hypot(tx, ty) || 1;
      tx /= d; ty /= d;
      const w = (L.w / 2) * Math.pow(1 - i / (n - 1), 0.75) + 0.4;
      left.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
      right.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    ctx.beginPath();
    curve(ctx, left, false);
    const rr = right.reverse();
    ctx.lineTo(rr[0][0], rr[0][1]);
    for (let i = 1; i < rr.length; i++) {
      const p0 = rr[Math.max(0, i - 2)], p1 = rr[i - 1], p2 = rr[i], p3 = rr[Math.min(rr.length - 1, i + 1)];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
    ctx.fillStyle = this.hairGrad;
    ctx.fill();
    // a strand line down the middle for texture
    ctx.beginPath();
    curve(ctx, pts.slice(0, n - 1), false);
    ctx.strokeStyle = this.c["hair-shine"];
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawBody() {
    const ctx = this.ctx, C = this.c;
    const by = -this.breath * 1.8;
    // neck
    const [nlx, nly] = this.hp(178, 290, 0), [nrx, nry] = this.hp(222, 290, 0);
    ctx.beginPath();
    ctx.moveTo(nlx, nly);
    ctx.lineTo(nrx, nry);
    ctx.lineTo(224, 366 + by);
    ctx.quadraticCurveTo(200, 374 + by, 176, 366 + by);
    ctx.closePath();
    ctx.fillStyle = C.skin;
    ctx.fill();
    // chin shadow on the neck
    const [cx, cy] = this.hp(200, 318, 0.3);
    const g = ctx.createRadialGradient(cx, cy + 4, 4, cx, cy + 4, 34);
    g.addColorStop(0, "rgba(90,40,30,0.35)");
    g.addColorStop(1, "rgba(90,40,30,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 34, 18, this.p.roll * DEG, 0, Math.PI * 2);
    ctx.fill();

    // shoulders and top
    ctx.save();
    ctx.translate(200, 380 + by);
    ctx.scale(1 + this.breath * 0.006, 1);
    ctx.beginPath();
    ctx.moveTo(-132, 80);
    ctx.bezierCurveTo(-124, 12, -72, -16, -26, -14);
    ctx.quadraticCurveTo(0, 6, 26, -14);
    ctx.bezierCurveTo(72, -16, 124, 12, 132, 80);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, -20, 0, 80);
    tg.addColorStop(0, C["top-hi"]);
    tg.addColorStop(0.25, C.top);
    tg.addColorStop(1, C.top);
    ctx.fillStyle = tg;
    ctx.fill();
    // neckline trim
    ctx.beginPath();
    ctx.moveTo(-28, -13);
    ctx.quadraticCurveTo(0, 9, 28, -13);
    ctx.strokeStyle = C["top-hi"];
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    // fabric folds
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 58, 8);
      ctx.quadraticCurveTo(s * 66, 36, s * 60, 70);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // necklace with a swinging pendant
    ctx.beginPath();
    ctx.moveTo(181, 360 + by);
    ctx.quadraticCurveTo(200, 376 + by, 219, 360 + by);
    ctx.strokeStyle = C["iris-hi"];
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const pa = this.pendant.ang, [px, py] = this.pendant.anchor || [200, 370];
    const gx = px + Math.sin(pa) * 7, gy = py + Math.cos(pa) * 7;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 4);
    ctx.lineTo(gx + 3.6, gy + 1.5);
    ctx.lineTo(gx, gy + 6);
    ctx.lineTo(gx - 3.6, gy + 1.5);
    ctx.closePath();
    ctx.fillStyle = C["iris-hi"];
    ctx.fill();
  }

  drawEars() {
    const ctx = this.ctx, C = this.c;
    for (const s of [-1, 1]) {
      this.place(200 + s * 82, 222, -0.35, 1 - 0.4 * Math.max(0, this.p.yaw * s));
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 21, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.skin;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 2, -12);
      ctx.quadraticCurveTo(s * 7, 0, s * 2, 12);
      ctx.strokeStyle = C.shade;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  facePath() {
    const ctx = this.ctx;
    ctx.beginPath();
    curve(ctx, FACE.map(([x, y, z]) => this.hp(x, y, z)), true);
  }

  drawFace() {
    const ctx = this.ctx, C = this.c, P = this.p;
    this.facePath();
    ctx.fillStyle = C.skin;
    ctx.fill();

    ctx.save();
    this.facePath();
    ctx.clip();

    // cheeks
    for (const s of [-1, 1]) {
      const [x, y] = this.hp(200 + s * 50, 254 - (P.smileL + P.smileR) * 1.5, 0.35);
      const g = ctx.createRadialGradient(x, y, 2, x, y, 24);
      g.addColorStop(0, C.blush);
      g.addColorStop(1, C.blush + "00");
      ctx.globalAlpha = clamp(P.blush, 0, 1) * 0.9;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 26, 15, P.roll * DEG, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawNose();
    for (const s of [-1, 1]) this.drawEye(s);
    for (const s of [-1, 1]) this.drawBrow(s);
    this.drawMouth();

    // lighting pass over the whole face so features and skin share one light
    const [lx, ly] = this.hp(180 - P.yaw * 30, 180, 0.4);
    const light = ctx.createRadialGradient(lx, ly, 10, lx, ly, 150);
    light.addColorStop(0, "rgba(255,245,235,0.32)");
    light.addColorStop(1, "rgba(255,245,235,0)");
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "multiply";
    const side = P.yaw >= 0 ? -1 : 1; // the side turning away gets darker
    const [ex] = this.hp(200 + side * 80, 200, 0);
    const shadow = ctx.createLinearGradient(ex, 0, ex - side * 70, 0);
    shadow.addColorStop(0, `rgba(185,128,95,${0.25 + Math.abs(P.yaw) * 0.5})`);
    shadow.addColorStop(1, "rgba(185,128,95,0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, W, H);
    // hair casting shadow on the forehead
    const [fx, fy] = this.hp(200, 140, 0.3);
    const fs = ctx.createLinearGradient(0, fy - 20, 0, fy + 26);
    fs.addColorStop(0, "rgba(120,70,70,0.45)");
    fs.addColorStop(1, "rgba(120,70,70,0)");
    ctx.fillStyle = fs;
    ctx.fillRect(0, fy - 40, W, 70);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  drawNose() {
    const ctx = this.ctx, C = this.c;
    this.place(200, 244, 1.0);
    ctx.beginPath();
    ctx.moveTo(-1, -14);
    ctx.quadraticCurveTo(-4, 2, -3, 8);
    ctx.quadraticCurveTo(0, 12, 5, 9);
    ctx.strokeStyle = C.shade;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2.3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(1, 5, 3.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  eyeShape(s) {
    const ctx = this.ctx;
    const ix = -s * 21, ox = s * 23;
    ctx.beginPath();
    ctx.moveTo(ix, 1);
    ctx.bezierCurveTo(ix + s * 7, -15, ox - s * 10, -17, ox, -3);
    ctx.bezierCurveTo(ox - s * 6, 11, ix + s * 8, 13, ix, 1);
    ctx.closePath();
  }

  drawEye(s) {
    const ctx = this.ctx, C = this.c, P = this.p;
    const far = Math.max(0, P.yaw * s);
    this.place(200 + s * 42, 212, 0.55, 1 - 0.35 * far);
    const blink = s < 0 ? this.blinkL : this.blinkR;
    const squint = clamp(P.squint, 0, 1);
    const droop = clamp(P.droop + Math.max(0, P.gazeY) * 0.25 - Math.max(0, -P.gazeY) * 0.08, 0, 1);
    const c = clamp(droop + (1 - droop) * blink, 0, 1);

    ctx.save();
    this.eyeShape(s);
    ctx.clip();
    const sg = ctx.createLinearGradient(0, -14, 0, 12);
    sg.addColorStop(0, C.shade);
    sg.addColorStop(0.35, C.sclera);
    sg.addColorStop(1, C.sclera);
    ctx.fillStyle = sg;
    ctx.fillRect(-30, -20, 60, 40);

    const ix = P.gazeX * 7.5, iy = P.gazeY * 4.5 + 1;
    const ig = ctx.createRadialGradient(ix, iy - 2, 1, ix, iy, 13);
    ig.addColorStop(0, C["iris-hi"]);
    ig.addColorStop(0.7, C.iris);
    ig.addColorStop(1, C.pupil);
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(ix, iy, 12.5, 0, Math.PI * 2);
    ctx.fill();
    // iris fibres
    ctx.strokeStyle = C["iris-hi"];
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 0.8;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(a) * 6.5, iy + Math.sin(a) * 6.5);
      ctx.lineTo(ix + Math.cos(a) * 11, iy + Math.sin(a) * 11);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.arc(ix, iy, clamp(P.pupil, 3.5, 8), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.ellipse(ix - 4, iy - 4.5, 3.4, 2.8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(ix + 4.5, iy + 4, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // lids (skin shapes), upper follows closure, lower rises with a smile
    const edgeY = lerp(-15, 8, c);
    const corner = edgeY + 5 * (1 - c) + 1;
    const ctrl = edgeY - 9 * (1 - c) - squint * 7 * c;
    const lo = lerp(13, 4, squint * (1 - c * 0.5));
    ctx.fillStyle = C.skin;
    ctx.beginPath();
    ctx.moveTo(-30, -30); ctx.lineTo(30, -30); ctx.lineTo(30, corner);
    ctx.quadraticCurveTo(0, ctrl, -30, corner);
    ctx.closePath();
    ctx.fill();
    // soft shadow under the upper lid
    const ey = ctrl * 0.5 + corner * 0.5;
    const lg = ctx.createLinearGradient(0, ey - 1, 0, ey + 7);
    lg.addColorStop(0, "rgba(80,40,40,0)");
    lg.addColorStop(0.15, `rgba(80,40,40,${0.28 * (1 - c)})`);
    lg.addColorStop(1, "rgba(80,40,40,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(-30, -20, 60, 40);
    ctx.fillStyle = C.skin;
    ctx.beginPath();
    ctx.moveTo(-30, 30); ctx.lineTo(30, 30); ctx.lineTo(30, lo);
    ctx.quadraticCurveTo(0, lo + 6 * (1 - squint), -30, lo);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // lash line and outer flick
    const ly = (x) => { const u = (x + 30) / 60; return (1 - u) * (1 - u) * corner + 2 * u * (1 - u) * ctrl + u * u * corner; };
    ctx.beginPath();
    ctx.moveTo(-23, ly(-23));
    for (let x = -20; x <= 23; x += 3) ctx.lineTo(x, ly(x));
    ctx.strokeStyle = C.lash;
    ctx.lineWidth = lerp(3.4, 2.6, c);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    const ox = s * 22, oy = ly(ox);
    ctx.beginPath();
    ctx.moveTo(ox - s * 3, oy - 1);
    ctx.quadraticCurveTo(ox + s * 5, oy - 3, ox + s * 8, oy - 7 + c * 4);
    ctx.quadraticCurveTo(ox + s * 3, oy + 1, ox - s * 2, oy + 1.5);
    ctx.closePath();
    ctx.fillStyle = C.lash;
    ctx.fill();
    // lower lash hint
    ctx.beginPath();
    ctx.moveTo(-16, lo + 2);
    ctx.quadraticCurveTo(0, lo + 6 * (1 - squint) + 1, 16, lo + 2);
    ctx.strokeStyle = C.lash;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // crease
    if (c < 0.75) {
      ctx.beginPath();
      ctx.moveTo(-19, corner - 7);
      ctx.quadraticCurveTo(0, ctrl - 9, 19, corner - 8);
      ctx.strokeStyle = C.shade;
      ctx.globalAlpha = 0.3 * (1 - c);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawBrow(s) {
    const ctx = this.ctx, C = this.c, P = this.p;
    this.place(200 + s * 42, 184, 0.6, 1 - 0.3 * Math.max(0, P.yaw * s));
    const raise = s < 0 ? P.browL : P.browR;
    const inX = -s * (17 - P.furrow * 2), outX = s * 21;
    const inY = -raise - P.tilt + P.furrow * 3;
    const outY = -raise + 2 + P.tilt * 0.4;
    const midY = -raise - 6 + P.furrow;
    ctx.beginPath();
    ctx.moveTo(inX, inY - 2.8);
    ctx.quadraticCurveTo(s * 2, midY - 3, outX, outY - 0.8);
    ctx.quadraticCurveTo(outX + s * 1.5, outY, outX, outY + 0.8);
    ctx.quadraticCurveTo(s * 2, midY + 2.2, inX, inY + 2.8);
    ctx.quadraticCurveTo(inX - s * 1.5, inY, inX, inY - 2.8);
    ctx.fillStyle = C.brow;
    ctx.fill();
    ctx.restore();
  }

  drawMouth() {
    const ctx = this.ctx, C = this.c, P = this.p;
    this.place(200, 284, 0.7);
    const open = clamp(P.open, 0, 1), wide = clamp(P.wide, -1, 1);
    const press = clamp(P.press, 0, 1), bite = clamp(P.bite, 0, 1);
    const sL = P.smileL, sR = P.smileR;
    const w = 21 + wide * 7 + (sL + sR) * 1.5;
    const Lx = -w, Ly = -sL * 7, Rx = w, Ry = -sR * 7;
    const round = Math.max(0, -wide);
    const top = -2 - open * (4 + round * 5);
    const bot = open * (20 + round * 4) + (sL + sR) * 1.5;
    const lipT = 4.5 * (1 - press * 0.6) + round * 2;
    const lipB = 6 * (1 - press * 0.5 - bite * 0.6) + round * 2;

    if (open > 0.04) {
      // inner mouth
      ctx.beginPath();
      ctx.moveTo(Lx, Ly);
      ctx.bezierCurveTo(-w * 0.5, top - round * 2, w * 0.5, top - round * 2, Rx, Ry);
      ctx.bezierCurveTo(w * 0.6, bot + 2, -w * 0.6, bot + 2, Lx, Ly);
      ctx.closePath();
      ctx.fillStyle = C.mouth;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // teeth
      ctx.fillStyle = "#fbf7f2";
      ctx.beginPath();
      ctx.ellipse(0, top - 1, w * 0.62, clamp(open * 10, 2, 6.5), 0, 0, Math.PI * 2);
      ctx.fill();
      // tongue
      if (open > 0.3) {
        ctx.fillStyle = "#cf6f78";
        ctx.beginPath();
        ctx.ellipse(0, bot + 1, w * 0.5, open * 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // lips
    const lipGrad = ctx.createLinearGradient(0, top - lipT, 0, bot + lipB);
    lipGrad.addColorStop(0, C.lip);
    lipGrad.addColorStop(1, C.lip);
    ctx.fillStyle = lipGrad;
    const midClosed = 1 + (sL + sR) * 2.5;
    const topEdge = open > 0.04 ? top : midClosed;
    const botEdge = open > 0.04 ? bot : midClosed;
    // upper lip with cupid's bow
    ctx.beginPath();
    ctx.moveTo(Lx, Ly);
    ctx.bezierCurveTo(-w * 0.5, topEdge, w * 0.5, topEdge, Rx, Ry);
    ctx.bezierCurveTo(w * 0.6, topEdge - lipT - 1, w * 0.25, topEdge - lipT - 2, 0, topEdge - lipT + 0.8);
    ctx.bezierCurveTo(-w * 0.25, topEdge - lipT - 2, -w * 0.6, topEdge - lipT - 1, Lx, Ly);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    // lower lip
    ctx.beginPath();
    ctx.moveTo(Lx, Ly);
    ctx.bezierCurveTo(-w * 0.6, botEdge + 2, w * 0.6, botEdge + 2, Rx, Ry);
    ctx.bezierCurveTo(w * 0.6, botEdge + lipB + 3, -w * 0.6, botEdge + lipB + 3, Lx, Ly);
    ctx.closePath();
    ctx.globalAlpha = 0.7;
    ctx.fill();
    // lower-lip highlight
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(1, botEdge + lipB * 0.55 + 1.5, w * 0.28, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // parting line and corner dimples
    ctx.beginPath();
    ctx.moveTo(Lx, Ly);
    if (open > 0.04) ctx.bezierCurveTo(-w * 0.5, top, w * 0.5, top, Rx, Ry);
    else ctx.bezierCurveTo(-w * 0.5, midClosed + 1, w * 0.5, midClosed + 1, Rx, Ry);
    ctx.strokeStyle = C.mouth;
    ctx.lineWidth = open > 0.04 ? 1 : 1.8;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = C.shade;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.4;
    for (const [x, y, sm] of [[Lx, Ly, sL], [Rx, Ry, sR]]) {
      if (sm < 0.4) continue;
      const d = Math.sign(x);
      ctx.beginPath();
      ctx.moveTo(x + d * 1, y - 2);
      ctx.quadraticCurveTo(x + d * 4, y + 1, x + d * 2, y + 4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawEarrings() {
    const ctx = this.ctx, C = this.c;
    for (const er of this.earrings) {
      if (!er.anchor || this.p.yaw * er.s > 0.35) continue;
      const [ax, ay] = er.anchor;
      const x = ax + Math.sin(er.ang) * 12, y = ay + Math.cos(er.ang) * 12;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(x, y);
      ctx.strokeStyle = C["iris-hi"];
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 5, y + 4, x + 4, y + 10, x, y + 11);
      ctx.bezierCurveTo(x - 4, y + 10, x - 5, y + 4, x, y);
      ctx.fillStyle = C["iris-hi"];
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x - 1.2, y + 5, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  drawSkullcap() {
    const ctx = this.ctx;
    const pts = [
      [122, 205, 0.05], [117, 142, 0.15], [148, 86, 0.3], [200, 72, 0.4], [254, 84, 0.3], [284, 142, 0.15],
      [279, 205, 0.05], [272, 164, 0.2], [252, 128, 0.35], [224, 112, 0.45], [192, 120, 0.4], [152, 132, 0.3], [130, 166, 0.15],
    ].map(([x, y, z]) => this.hp(x, y, z));
    ctx.beginPath();
    curve(ctx, pts, true);
    ctx.fillStyle = this.hairGrad;
    ctx.fill();
  }

  drawHairShine() {
    const ctx = this.ctx;
    const pts = [this.hp(158, 99, 0.33), this.hp(186, 88, 0.4), this.hp(214, 87, 0.42), this.hp(240, 96, 0.35)];
    ctx.beginPath();
    curve(ctx, pts, false);
    ctx.strokeStyle = this.c["hair-shine"];
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawThinking(t) {
    if (this.state !== "thinking") return;
    const ctx = this.ctx;
    ctx.fillStyle = this.c.muted;
    for (let i = 0; i < 3; i++) {
      const bob = this.reduced ? 0 : Math.sin(t * 5 - i * 0.7) * 4;
      ctx.globalAlpha = 0.35 + 0.25 * ((Math.sin(t * 5 - i * 0.7) + 1) / 2);
      ctx.beginPath();
      ctx.arc(300 + i * 20, 92 - i * 14 + bob, 5 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSparkles() {
    const ctx = this.ctx;
    for (const s of this.sparkles) {
      const a = Math.sin((s.life / s.max) * Math.PI);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.life * 2);
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = this.c["iris-hi"];
      ctx.beginPath();
      const r = s.size;
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
