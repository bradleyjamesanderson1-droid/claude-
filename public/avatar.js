// Procedural SVG character. Everything is drawn in code so the face can be
// driven continuously: blinking, gaze, breathing, eyebrow/mouth mood shapes,
// and a mouth that opens with the voice.

const SVG_NS = "http://www.w3.org/2000/svg";

// Per-mood targets. brow: lift (+ up), tilt (+ inner ends up = worried);
// smile: mouth-corner curve; lids: how far the upper lids droop (0..1).
const MOODS = {
  neutral:   { brow: 0,   tilt: 0,    smile: 0.35, lids: 0.12, blush: 0.25 },
  happy:     { brow: 2,   tilt: 0,    smile: 1,    lids: 0.2,  blush: 0.55 },
  thinking:  { brow: 3,   tilt: -2.5, smile: 0.1,  lids: 0.25, blush: 0.2 },
  surprised: { brow: 6,   tilt: 0,    smile: 0.2,  lids: 0,    blush: 0.3 },
  concerned: { brow: 1,   tilt: 3.5,  smile: -0.35,lids: 0.18, blush: 0.15 },
  playful:   { brow: 2.5, tilt: -1.5, smile: 0.85, lids: 0.3,  blush: 0.6 },
};

const lerp = (a, b, t) => a + (b - a) * t;

function el(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

export class Avatar {
  constructor(container) {
    this.state = "idle";
    this.mood = "neutral";
    this.current = { ...MOODS.neutral, mouth: 0, gazeX: 0, gazeY: 0, blink: 0, lean: 0 };
    this.target = { ...MOODS.neutral, gazeX: 0, gazeY: 0 };
    this.mouthTarget = 0;
    this.nextBlink = performance.now() + 2000;
    this.blinkStart = 0;
    this.pointer = null;
    this.idleGazeAt = 0;
    this.build(container);
    window.addEventListener("pointermove", (e) => {
      const r = this.svg.getBoundingClientRect();
      this.pointer = {
        x: (e.clientX - (r.left + r.width / 2)) / r.width,
        y: (e.clientY - (r.top + r.height * 0.42)) / r.height,
        t: performance.now(),
      };
    });
    requestAnimationFrame((t) => this.frame(t));
  }

  build(container) {
    const svg = el("svg", { viewBox: "0 0 400 440", class: "avatar-svg", role: "img", "aria-label": "Animated assistant" });
    const defs = el("defs", {}, svg);

    const skin = el("radialGradient", { id: "skin", cx: "50%", cy: "40%", r: "65%" }, defs);
    el("stop", { offset: "0%", "stop-color": "var(--skin-hi)" }, skin);
    el("stop", { offset: "100%", "stop-color": "var(--skin)" }, skin);

    const hair = el("linearGradient", { id: "hair", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
    el("stop", { offset: "0%", "stop-color": "var(--hair-hi)" }, hair);
    el("stop", { offset: "100%", "stop-color": "var(--hair)" }, hair);

    const iris = el("radialGradient", { id: "iris", cx: "50%", cy: "45%", r: "55%" }, defs);
    el("stop", { offset: "0%", "stop-color": "var(--iris-hi)" }, iris);
    el("stop", { offset: "100%", "stop-color": "var(--iris)" }, iris);

    const glow = el("radialGradient", { id: "aura" }, defs);
    el("stop", { offset: "55%", "stop-color": "var(--aura)", "stop-opacity": "0.35" }, glow);
    el("stop", { offset: "100%", "stop-color": "var(--aura)", "stop-opacity": "0" }, glow);

    // Eye clip paths so lids and pupils stay inside the eye shape.
    for (const side of ["L", "R"]) {
      const cp = el("clipPath", { id: `eyeClip${side}` }, defs);
      el("path", { d: this.eyeShape(side === "L" ? 158 : 242, 212) }, cp);
    }

    this.aura = el("circle", { cx: 200, cy: 215, r: 190, fill: "url(#aura)", class: "aura" }, svg);

    const body = el("g", { class: "body" }, svg);
    this.body = body;

    // Back hair
    el("path", {
      d: "M92 210 C80 110 140 60 200 60 C262 60 322 108 310 210 C318 290 330 360 300 400 L100 400 C70 360 84 290 92 210Z",
      fill: "url(#hair)",
    }, body);

    // Shoulders and top
    el("path", { d: "M70 440 C78 372 130 346 200 346 C270 346 322 372 330 440Z", fill: "var(--top)" }, body);
    el("path", { d: "M168 346 C176 372 224 372 232 346", fill: "none", stroke: "var(--top-hi)", "stroke-width": 4, "stroke-linecap": "round" }, body);

    // Neck
    el("path", { d: "M176 300 L176 352 C188 362 212 362 224 352 L224 300Z", fill: "var(--skin)" }, body);
    el("path", { d: "M176 322 C190 332 210 332 224 322", fill: "none", stroke: "var(--shade)", "stroke-width": 3, opacity: 0.35 }, body);

    const head = el("g", { class: "head" }, body);
    this.head = head;

    // Ears
    el("ellipse", { cx: 116, cy: 222, rx: 13, ry: 22, fill: "var(--skin)" }, head);
    el("ellipse", { cx: 284, cy: 222, rx: 13, ry: 22, fill: "var(--skin)" }, head);
    this.earrings = [
      el("circle", { cx: 116, cy: 250, r: 5, class: "earring" }, head),
      el("circle", { cx: 284, cy: 250, r: 5, class: "earring" }, head),
    ];

    // Face
    el("path", {
      d: "M122 200 C122 130 160 104 200 104 C240 104 278 130 278 200 C278 262 244 318 200 318 C156 318 122 262 122 200Z",
      fill: "url(#skin)",
    }, head);

    // Cheeks
    this.cheeks = [
      el("ellipse", { cx: 150, cy: 252, rx: 18, ry: 10, fill: "var(--blush)" }, head),
      el("ellipse", { cx: 250, cy: 252, rx: 18, ry: 10, fill: "var(--blush)" }, head),
    ];

    // Eyes
    this.eyes = ["L", "R"].map((side) => {
      const cx = side === "L" ? 158 : 242;
      const g = el("g", {}, head);
      el("path", { d: this.eyeShape(cx, 212), fill: "var(--sclera)" }, g);
      const inner = el("g", { "clip-path": `url(#eyeClip${side})` }, g);
      const pupil = el("g", {}, inner);
      el("circle", { cx, cy: 213, r: 12.5, fill: "url(#iris)" }, pupil);
      el("circle", { cx, cy: 213, r: 6, fill: "var(--pupil)" }, pupil);
      el("circle", { cx: cx + 4, cy: 208, r: 3.2, fill: "#fff", opacity: 0.9 }, pupil);
      el("circle", { cx: cx - 4, cy: 218, r: 1.5, fill: "#fff", opacity: 0.6 }, pupil);
      const upper = el("path", { fill: "var(--skin)" }, inner);
      const lower = el("path", { fill: "var(--skin)" }, inner);
      const line = el("path", { fill: "none", stroke: "var(--lash)", "stroke-width": 3.2, "stroke-linecap": "round" }, g);
      return { cx, pupil, upper, lower, line };
    });

    // Brows
    this.brows = [158, 242].map((cx) =>
      el("path", { fill: "none", stroke: "var(--brow)", "stroke-width": 5, "stroke-linecap": "round", "data-cx": cx }, head)
    );

    // Nose
    el("path", { d: "M198 232 C196 246 194 254 200 257 C204 258 207 256 208 254", fill: "none", stroke: "var(--shade)", "stroke-width": 2.6, "stroke-linecap": "round", opacity: 0.55 }, head);

    // Mouth
    this.mouthInner = el("path", { fill: "var(--mouth)" }, head);
    this.teeth = el("path", { fill: "#fff", opacity: 0.9 }, head);
    this.mouthLine = el("path", { fill: "none", stroke: "var(--lip)", "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round" }, head);

    // Front hair (fringe) drawn over the forehead
    el("path", {
      d: "M118 196 C112 120 156 86 204 88 C252 90 292 124 284 196 C270 150 250 132 222 124 C214 146 186 160 150 164 C136 172 124 184 118 196Z",
      fill: "url(#hair)",
    }, head);
    el("path", { d: "M170 104 C186 98 214 96 236 104", fill: "none", stroke: "var(--hair-shine)", "stroke-width": 4, "stroke-linecap": "round", opacity: 0.5 }, head);

    // Thinking dots, shown while waiting on Claude or a tool.
    this.dots = el("g", { class: "think-dots" }, svg);
    [0, 1, 2].forEach((i) => el("circle", { cx: 300 + i * 20, cy: 90 - i * 14, r: 6 + i * 2 }, this.dots));

    container.appendChild(svg);
    this.svg = svg;
  }

  eyeShape(cx, cy) {
    return `M${cx - 22} ${cy} C${cx - 16} ${cy - 16} ${cx + 16} ${cy - 16} ${cx + 22} ${cy - 2} C${cx + 16} ${cy + 12} ${cx - 16} ${cy + 13} ${cx - 22} ${cy}Z`;
  }

  setState(state) {
    this.state = state;
    this.svg.dataset.state = state;
    if (state === "thinking") this.setMood("thinking");
    if (state === "listening" && this.mood === "thinking") this.setMood("neutral");
  }

  setMood(mood) {
    if (!MOODS[mood]) return;
    this.mood = mood;
    Object.assign(this.target, MOODS[mood]);
  }

  // 0..1 mouth openness, driven by the speech engine.
  setMouth(v) {
    this.mouthTarget = Math.max(0, Math.min(1, v));
  }

  frame(now) {
    const c = this.current;
    const t = this.target;
    const k = 0.12;

    // Gaze: follow the pointer if it moved recently, otherwise wander a little.
    if (this.state === "thinking") {
      t.gazeX = 0.55; t.gazeY = -0.7;
    } else if (this.pointer && now - this.pointer.t < 4000) {
      t.gazeX = Math.max(-1, Math.min(1, this.pointer.x * 2.2));
      t.gazeY = Math.max(-1, Math.min(1, this.pointer.y * 2.2));
    } else if (now > this.idleGazeAt) {
      const listening = this.state === "listening" || this.state === "speaking";
      t.gazeX = listening ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 1.2;
      t.gazeY = listening ? 0 : (Math.random() - 0.5) * 0.6;
      this.idleGazeAt = now + 1500 + Math.random() * 2500;
    }

    for (const key of ["brow", "tilt", "smile", "lids", "blush", "gazeX", "gazeY"]) c[key] = lerp(c[key], t[key], k);
    c.mouth = lerp(c.mouth, this.mouthTarget, 0.35);
    c.lean = lerp(c.lean, this.state === "listening" ? 1 : 0, 0.08);

    // Blink
    if (now > this.nextBlink) {
      this.blinkStart = now;
      this.nextBlink = now + 2200 + Math.random() * 3800;
      if (Math.random() < 0.15) this.nextBlink = now + 260; // occasional double blink
    }
    const bt = (now - this.blinkStart) / 150;
    c.blink = bt < 1 ? Math.sin(bt * Math.PI) : 0;

    // Breathing / idle sway
    const breathe = Math.sin(now / 1100) * 2.2;
    const sway = Math.sin(now / 2300) * 1.4 + c.gazeX * 2;
    const nod = this.state === "speaking" ? Math.sin(now / 180) * c.mouth * 1.5 : 0;
    this.body.setAttribute("transform", `translate(0 ${breathe * 0.5})`);
    this.head.setAttribute(
      "transform",
      `rotate(${sway + c.lean * -4} 200 300) translate(${c.gazeX * 3} ${breathe * 0.4 + nod + c.gazeY * 2})`
    );

    this.drawEyes(c);
    this.drawBrows(c);
    this.drawMouth(c);
    for (const ch of this.cheeks) ch.setAttribute("opacity", c.blush.toFixed(3));

    requestAnimationFrame((n) => this.frame(n));
  }

  drawEyes(c) {
    const cy = 212;
    const close = Math.min(1, c.lids + c.blink * (1 - c.lids));
    const squint = Math.max(0, c.smile - 0.6) * 0.5; // happy eyes push up from below
    for (const e of this.eyes) {
      const { cx } = e;
      e.pupil.setAttribute("transform", `translate(${c.gazeX * 7} ${c.gazeY * 4})`);
      // Upper lid: a skin shape whose lower edge descends as the eye closes.
      const edge = lerp(cy - 16, cy + 8, close);
      e.upper.setAttribute("d", `M${cx - 26} ${cy - 30} L${cx + 26} ${cy - 30} L${cx + 26} ${edge} C${cx + 10} ${edge + 4 * (1 - close)} ${cx - 10} ${edge + 4 * (1 - close)} ${cx - 26} ${edge}Z`);
      const lowEdge = lerp(cy + 14, cy + 2, squint);
      e.lower.setAttribute("d", `M${cx - 26} ${cy + 30} L${cx + 26} ${cy + 30} L${cx + 26} ${lowEdge} C${cx + 10} ${lowEdge - 6} ${cx - 10} ${lowEdge - 6} ${cx - 26} ${lowEdge}Z`);
      // Lash line tracks the upper lid.
      const lashY = Math.min(edge, cy + 6);
      e.line.setAttribute("d", `M${cx - 23} ${cy + 1} C${cx - 16} ${lashY - 3 + close * 10} ${cx + 12} ${lashY - 3 + close * 10} ${cx + 24} ${lashY + 4}`);
    }
  }

  drawBrows(c) {
    for (const b of this.brows) {
      const cx = Number(b.dataset.cx);
      const dir = cx < 200 ? 1 : -1; // inner end points toward the nose
      const base = 180 - c.brow;
      const inner = base - c.tilt;
      const outer = base + c.tilt * 0.4 + 2;
      b.setAttribute("d", `M${cx - 20 * dir} ${outer} Q${cx} ${base - 6} ${cx + 20 * dir} ${inner}`);
    }
  }

  drawMouth(c) {
    const cx = 200, cy = 280;
    const open = c.mouth;
    const w = 22 + c.smile * 5 - open * 4;
    const corner = cy - c.smile * 7;
    const upper = cy - 2 - open * 3;
    const lower = cy + 3 + open * 18 + c.smile * 3;
    this.mouthLine.setAttribute(
      "d",
      open > 0.04
        ? `M${cx - w} ${corner} Q${cx} ${upper - 3} ${cx + w} ${corner} Q${cx} ${lower + 4} ${cx - w} ${corner}Z`
        : `M${cx - w} ${corner} Q${cx} ${cy + c.smile * 8} ${cx + w} ${corner}`
    );
    if (open > 0.04) {
      this.mouthInner.setAttribute("d", `M${cx - w} ${corner} Q${cx} ${upper - 3} ${cx + w} ${corner} Q${cx} ${lower + 4} ${cx - w} ${corner}Z`);
      this.teeth.setAttribute("d", `M${cx - w * 0.6} ${corner - 1} Q${cx} ${upper - 2} ${cx + w * 0.6} ${corner - 1} L${cx + w * 0.55} ${corner + 3} Q${cx} ${upper + 3} ${cx - w * 0.55} ${corner + 3}Z`);
    } else {
      this.mouthInner.setAttribute("d", "");
      this.teeth.setAttribute("d", "");
    }
  }
}
