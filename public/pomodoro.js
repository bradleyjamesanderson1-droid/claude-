// Pomodoro timer: focus and break phases with a compact control bar.
// It reports every transition through onEvent so the page can have Aria
// announce it ("Start!" / "Stop!"), and keeps its state in localStorage so a
// reload doesn't lose a running session.

const PHASES = {
  focus: { label: "Focus" },
  short: { label: "Short break" },
  long: { label: "Long break" },
};
const DEFAULTS = { focus: 25, short: 5, long: 15, rounds: 4, autoStart: true };
const KEY = "aria-pomodoro";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

export class Pomodoro {
  constructor(container, { onEvent } = {}) {
    this.onEvent = onEvent || (() => {});
    this.settings = { ...DEFAULTS };
    this.phase = "focus";
    this.round = 1;          // which focus session of the set we're on
    this.running = false;
    this.endsAt = 0;
    this.remaining = this.duration("focus");
    this.warned = false;
    this.load();
    this.build(container);
    this.render();
    setInterval(() => this.tick(), 250);
    document.addEventListener("visibilitychange", () => this.tick());
  }

  // ------------------------------------------------------------ state
  duration(phase) { return this.settings[phase] * 60 * 1000; }
  left() { return this.running ? this.endsAt - Date.now() : this.remaining; }

  status() {
    return {
      phase: this.phase,
      phaseLabel: PHASES[this.phase].label,
      running: this.running,
      remaining: fmt(this.left()),
      round: this.round,
      rounds: this.settings.rounds,
      settings: { ...this.settings },
    };
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        settings: this.settings, phase: this.phase, round: this.round,
        running: this.running, endsAt: this.endsAt, remaining: this.remaining,
      }));
    } catch {}
  }

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s) return;
      this.settings = { ...DEFAULTS, ...s.settings };
      if (PHASES[s.phase]) this.phase = s.phase;
      this.round = Number(s.round) || 1;
      this.remaining = Number(s.remaining) || this.duration(this.phase);
      if (s.running && s.endsAt > Date.now()) {
        this.running = true;
        this.endsAt = s.endsAt;
      } else if (s.running) {
        // It finished while the page was closed: park at the start of the next phase.
        this.running = false;
        this.advance();
      }
    } catch {}
  }

  // ------------------------------------------------------------ controls
  start() {
    if (this.running) return this.status();
    const fresh = this.remaining >= this.duration(this.phase) - 500;
    this.running = true;
    this.endsAt = Date.now() + this.remaining;
    this.warned = this.remaining <= 60000;
    this.save();
    this.render();
    this.emit(fresh ? "start" : "resume");
    return this.status();
  }

  pause() {
    if (!this.running) return this.status();
    this.remaining = Math.max(0, this.endsAt - Date.now());
    this.running = false;
    this.save();
    this.render();
    this.emit("pause");
    return this.status();
  }

  toggle() { return this.running ? this.pause() : this.start(); }

  skip() {
    const wasRunning = this.running;
    this.running = false;
    this.advance();
    this.save();
    this.render();
    if (wasRunning || this.settings.autoStart) this.start();
    else this.emit("skip");
    return this.status();
  }

  reset() {
    this.running = false;
    this.phase = "focus";
    this.round = 1;
    this.remaining = this.duration("focus");
    this.save();
    this.render();
    this.emit("reset");
    return this.status();
  }

  configure(patch = {}) {
    const n = (v, lo, hi) => (v == null || v === "" || isNaN(Number(v)) ? undefined : Math.min(hi, Math.max(lo, Math.round(Number(v)))));
    const next = {
      focus: n(patch.focus, 1, 180), short: n(patch.short, 1, 60),
      long: n(patch.long, 1, 120), rounds: n(patch.rounds, 1, 12),
    };
    for (const [k, v] of Object.entries(next)) if (v !== undefined) this.settings[k] = v;
    if (typeof patch.autoStart === "boolean") this.settings.autoStart = patch.autoStart;
    if (!this.running) this.remaining = this.duration(this.phase);
    this.save();
    this.render();
    return this.status();
  }

  // Move to the phase after the current one (without starting it).
  advance() {
    const prev = this.phase;
    if (prev === "focus") {
      this.phase = this.round >= this.settings.rounds ? "long" : "short";
    } else {
      this.phase = "focus";
      this.round = prev === "long" ? 1 : this.round + 1;
    }
    this.remaining = this.duration(this.phase);
    this.warned = false;
    return prev;
  }

  tick() {
    if (!this.running) return;
    const left = this.endsAt - Date.now();
    if (!this.warned && left <= 60000 && this.duration(this.phase) > 120000) {
      this.warned = true;
      this.emit("warn");
    }
    if (left <= 0) {
      this.running = false;
      const ended = this.advance();
      if (this.settings.autoStart) {
        this.running = true;
        this.endsAt = Date.now() + this.remaining;
      }
      this.save();
      this.render();
      this.emit("stop", { ended });
    }
    this.render();
  }

  emit(type, extra = {}) {
    this.onEvent({ type, ...this.status(), minutes: this.settings[this.phase], ...extra });
  }

  // ------------------------------------------------------------ UI
  build(container) {
    const el = document.createElement("div");
    el.className = "pomo";
    el.innerHTML = `
      <div class="pomo-ring" aria-hidden="true">
        <svg viewBox="0 0 44 44"><circle class="pomo-track" cx="22" cy="22" r="19"/><circle class="pomo-arc" cx="22" cy="22" r="19"/></svg>
      </div>
      <div class="pomo-main">
        <div class="pomo-time" role="timer" aria-live="off"></div>
        <div class="pomo-meta"><span class="pomo-phase"></span><span class="pomo-dots"></span></div>
      </div>
      <div class="pomo-controls">
        <button type="button" class="pomo-btn pomo-play" aria-label="Start timer"></button>
        <button type="button" class="pomo-btn pomo-skip" aria-label="Skip to next phase" title="Skip to next phase">
          <svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7z"/><path d="M18 5v14"/></svg>
        </button>
        <button type="button" class="pomo-btn pomo-reset" aria-label="Reset timer" title="Reset">
          <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>
        </button>
        <button type="button" class="pomo-btn pomo-gear" aria-label="Timer settings" title="Timer settings" aria-expanded="false">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>
        </button>
      </div>
      <form class="pomo-settings" hidden>
        <label>Focus <input id="pomo-focus" type="number" min="1" max="180" inputmode="numeric"> min</label>
        <label>Short break <input id="pomo-short" type="number" min="1" max="60" inputmode="numeric"> min</label>
        <label>Long break <input id="pomo-long" type="number" min="1" max="120" inputmode="numeric"> min</label>
        <label>Long break after <input id="pomo-rounds" type="number" min="1" max="12" inputmode="numeric"> focus sessions</label>
        <label class="pomo-check"><input id="pomo-auto" type="checkbox"> Start the next phase automatically</label>
        <button type="submit" class="pomo-save">Save</button>
      </form>`;
    container.appendChild(el);
    this.el = el;
    const q = (s) => el.querySelector(s);
    this.ui = {
      time: q(".pomo-time"), phase: q(".pomo-phase"), dots: q(".pomo-dots"), arc: q(".pomo-arc"),
      play: q(".pomo-play"), gear: q(".pomo-gear"), form: q(".pomo-settings"),
    };
    this.ui.play.onclick = () => this.toggle();
    q(".pomo-skip").onclick = () => this.skip();
    q(".pomo-reset").onclick = () => this.reset();
    this.ui.gear.onclick = () => {
      const open = this.ui.form.hidden;
      this.ui.form.hidden = !open;
      this.ui.gear.setAttribute("aria-expanded", String(open));
      if (open) this.fillForm();
    };
    this.ui.form.onsubmit = (e) => {
      e.preventDefault();
      const v = (id) => q("#" + id).value;
      this.configure({ focus: v("pomo-focus"), short: v("pomo-short"), long: v("pomo-long"), rounds: v("pomo-rounds"), autoStart: q("#pomo-auto").checked });
      this.ui.form.hidden = true;
      this.ui.gear.setAttribute("aria-expanded", "false");
    };
  }

  fillForm() {
    const q = (s) => this.el.querySelector(s);
    q("#pomo-focus").value = this.settings.focus;
    q("#pomo-short").value = this.settings.short;
    q("#pomo-long").value = this.settings.long;
    q("#pomo-rounds").value = this.settings.rounds;
    q("#pomo-auto").checked = this.settings.autoStart;
  }

  render() {
    if (!this.ui) return;
    const left = this.left();
    const frac = Math.min(1, Math.max(0, 1 - left / this.duration(this.phase)));
    const C = 2 * Math.PI * 19;
    this.ui.time.textContent = fmt(left);
    this.ui.phase.textContent = PHASES[this.phase].label;
    this.ui.arc.style.strokeDasharray = `${C}`;
    this.ui.arc.style.strokeDashoffset = `${C * (1 - frac)}`;
    this.el.dataset.phase = this.phase;
    this.el.dataset.running = String(this.running);
    const done = this.phase === "focus" ? this.round - 1 : this.round;
    this.ui.dots.textContent = "";
    for (let i = 1; i <= this.settings.rounds; i++) {
      const d = document.createElement("i");
      if (i <= done) d.className = "on";
      else if (i === this.round && this.phase === "focus") d.className = "now";
      this.ui.dots.appendChild(d);
    }
    this.ui.dots.setAttribute("aria-label", `Session ${this.round} of ${this.settings.rounds}`);
    this.ui.play.innerHTML = this.running
      ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg>';
    this.ui.play.setAttribute("aria-label", this.running ? "Pause timer" : "Start timer");
    this.ui.play.title = this.running ? "Pause" : "Start";
  }
}

// What Aria says for each timer event. Kept here so both front ends match.
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const words = (n) => {
  const w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
    "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  if (n <= 20) return w[n];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + w[n % 10] : "");
  return String(n);
};

export function pomodoroLine(e) {
  const m = `${words(e.minutes)} minute${e.minutes === 1 ? "" : "s"}`;
  const M = m[0].toUpperCase() + m.slice(1);
  if (e.type === "start" || (e.type === "stop" && e.running && e.phase === "focus")) {
    if (e.phase === "focus") {
      return {
        mood: "happy",
        text: e.type === "stop"
          ? pick([`[happy] Break's over. Start! ${M} of focus.`, `[happy] Start! Back to it, ${m} on the clock.`])
          : pick([`[happy] Start! ${M} of focus. You've got this.`, `[happy] Start! ${M}, one thing at a time.`, `[happy] Start! Focus for ${m}. I'll tell you when to stop.`]),
      };
    }
    return { mood: "playful", text: `[playful] Start your break. ${M}.` };
  }
  if (e.type === "stop") {
    if (e.ended === "focus") {
      return e.phase === "long"
        ? { mood: "happy", text: `[happy] Stop! That's ${words(e.rounds)} sessions done. Take a proper ${m} break.` }
        : { mood: "playful", text: pick([`[playful] Stop! Take ${m}. Stand up and stretch.`, `[playful] Stop! Break time, ${m}. Get some water.`, `[playful] Stop! Nice work. ${M} off.`]) };
    }
    return { mood: "neutral", text: `[neutral] Stop. Your break is over. Press start when you're ready.` };
  }
  if (e.type === "resume") return { mood: "happy", text: "[happy] Start! Picking up where we left off." };
  if (e.type === "pause") {
    const [mm, ss] = e.remaining.split(":").map(Number);
    const parts = [mm && `${words(mm)} minute${mm === 1 ? "" : "s"}`, ss && `${words(ss)} second${ss === 1 ? "" : "s"}`].filter(Boolean);
    return { mood: "neutral", text: `[neutral] Paused with ${parts.join(" and ") || "no time"} left.` };
  }
  if (e.type === "warn") return { mood: "neutral", text: e.phase === "focus" ? "[neutral] One minute left. Start wrapping up." : "[neutral] One minute of break left." };
  return null;
}
