import { Avatar } from "./avatar.js";
import { Pomodoro, pomodoroLine } from "./pomodoro.js";

const $ = (s) => document.querySelector(s);
const MOOD_TAG = /\[(neutral|happy|thinking|surprised|concerned|playful)\]\s*/gi;

const avatar = new Avatar($("#stage"));
window.companion = { avatar }; // handy for poking at expressions from the console
const log = $("#log");
const form = $("#composer");
const input = $("#input");
const micBtn = $("#mic");
const talkBtn = $("#talk-mode");
const muteBtn = $("#mute");
const statusEl = $("#status");
const toolChip = $("#tool");

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let sessionId = sessionStorage.getItem("companion-session") || crypto.randomUUID();
sessionStorage.setItem("companion-session", sessionId);

let config = { name: "Aria", needsToken: false, connectors: [] };
let token = store.get("companion-token") || "";
let muted = store.get("companion-muted") === "1";
let talkMode = false;
let busy = false;

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
function setStatus(text) { statusEl.textContent = text; }

function setState(state) {
  avatar.setState(state);
  document.body.dataset.state = state;
  const labels = { idle: talkMode ? "Say something…" : "Ready", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking" };
  setStatus(labels[state] || "");
}

function addBubble(role, text = "") {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function showTool(label) {
  toolChip.textContent = label;
  toolChip.hidden = false;
  clearTimeout(showTool.t);
  showTool.t = setTimeout(() => (toolChip.hidden = true), 4000);
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// Speech output: speak sentence-by-sentence as text streams in, and animate
// the mouth while the voice is talking.
// ---------------------------------------------------------------------------
const tts = {
  queue: [],
  speaking: false,
  voice: null,

  pickVoice() {
    const voices = speechSynthesis.getVoices();
    const saved = store.get("companion-voice");
    this.voice =
      voices.find((v) => v.name === saved) ||
      voices.find((v) => /natural|neural|premium|enhanced/i.test(v.name) && /^en/i.test(v.lang) && /female|aria|jenny|samantha|sonia|libby|ava|emma/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang) && /female|samantha|victoria|karen|zira|susan|google uk english female/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0] || null;
    const select = $("#voice");
    select.hidden = !voices.length;
    select.innerHTML = "";
    for (const v of voices.filter((v) => /^en/i.test(v.lang))) {
      const o = new Option(`${v.name} (${v.lang})`, v.name, false, v === this.voice);
      select.add(o);
    }
  },

  announce(text) {
    this.stop();
    this.push(text);
  },
  push(text) {
    const clean = text
      .replace(/https?:\/\/\S+/g, "the link")
      .replace(/[*_#`>|~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean || muted || !("speechSynthesis" in window)) return;
    this.queue.push(clean);
    if (!this.speaking) this.next();
  },

  next() {
    const text = this.queue.shift();
    if (!text) {
      this.speaking = false;
      avatar.setMouth(0);
      if (!busy) afterReply();
      return;
    }
    this.speaking = true;
    setState("speaking");
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.rate = 1.03;
    u.pitch = 1.08;
    u.onstart = () => avatar.speakStart(text, u.rate);
    u.onboundary = (e) => avatar.speakSync(e.charIndex);
    u.onend = u.onerror = () => { avatar.speakEnd(); this.next(); };
    speechSynthesis.speak(u);
  },

  stop() {
    this.queue = [];
    this.speaking = false;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    avatar.speakEnd();
  },
};

if ("speechSynthesis" in window) {
  tts.pickVoice();
  speechSynthesis.onvoiceschanged = () => tts.pickVoice();
}

// Mouth driver: a syllable-rate oscillation, kicked by word-boundary events.

// ---------------------------------------------------------------- pomodoro
let audioCtx = null;
function chime(kind) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const notes = { start: [523.25, 783.99], stop: [783.99, 659.25, 523.25], warn: [659.25] }[kind];
    if (!notes) return;
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const t0 = audioCtx.currentTime + i * 0.18;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + 0.65);
    });
  } catch {}
}

const pomo = new Pomodoro($("#pomo-slot"), {
  onEvent(e) {
    const line = pomodoroLine(e);
    if (!line) return;
    const kind = e.type === "stop" ? (e.running && e.phase === "focus" ? "start" : "stop") : e.type === "resume" ? "start" : e.type;
    chime(kind);
    avatar.setMood(line.mood);
    addBubble("note", line.text.replace(MOOD_TAG, ""));
    tts.announce(line.text.replace(MOOD_TAG, ""));
  },
});

// ---------------------------------------------------------------------------
// Speech input
// ---------------------------------------------------------------------------
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let listening = false;

function startListening() {
  if (!Recognition || listening || busy) return;
  tts.stop();
  recognizer = new Recognition();
  recognizer.lang = navigator.language || "en-US";
  recognizer.interimResults = true;
  recognizer.continuous = false;
  let finalText = "";
  recognizer.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    input.value = (finalText + interim).trim();
  };
  recognizer.onerror = (e) => {
    if (e.error === "not-allowed") {
      talkMode = false;
      talkBtn.setAttribute("aria-pressed", "false");
      setStatus("Microphone access was blocked");
    }
  };
  recognizer.onend = () => {
    listening = false;
    micBtn.setAttribute("aria-pressed", "false");
    const text = finalText.trim();
    if (text) send(text);
    else if (!busy) {
      setState("idle");
      if (talkMode) setTimeout(startListening, 400);
    }
  };
  listening = true;
  micBtn.setAttribute("aria-pressed", "true");
  setState("listening");
  recognizer.start();
}

function stopListening() {
  if (recognizer && listening) recognizer.stop();
}

function afterReply() {
  setState("idle");
  if (avatar.mood === "thinking") avatar.setMood("neutral");
  if (talkMode) setTimeout(startListening, 350);
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
async function send(text) {
  if (busy || !text.trim()) return;
  busy = true;
  tts.stop();
  input.value = "";
  addBubble("user", text);
  setState("thinking");

  const bubble = addBubble("assistant");
  let pending = "";   // raw text not yet scanned for mood tags
  let spoken = "";    // clean text not yet handed to TTS
  let shown = "";

  const flush = (final) => {
    // Hold back a possibly-incomplete "[tag" at the end of the buffer.
    let upto = pending.length;
    const open = pending.lastIndexOf("[");
    if (!final && open !== -1 && pending.indexOf("]", open) === -1 && pending.length - open < 14) upto = open;
    let chunk = pending.slice(0, upto);
    pending = pending.slice(upto);
    chunk = chunk.replace(MOOD_TAG, (_, m) => {
      avatar.setMood(m.toLowerCase());
      return "";
    });
    if (!chunk) return;
    shown += chunk;
    bubble.textContent = shown.trimStart();
    log.scrollTop = log.scrollHeight;

    spoken += chunk;
    // Speak each complete sentence as soon as it's there.
    const re = /[^.!?\n]+[.!?]+["')\]]*(\s+|$)|[^\n]+\n/g;
    let m, last = 0;
    while ((m = re.exec(spoken)) && (final || m.index + m[0].length < spoken.length || /\s$/.test(m[0]))) {
      tts.push(m[0]);
      last = m.index + m[0].length;
    }
    spoken = spoken.slice(last);
    if (final) { tts.push(spoken); spoken = ""; }
  };

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ sessionId, text }),
    });
    if (res.status === 401) {
      askForToken();
      throw new Error("Enter your access token, then try again.");
    }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const event = /^event: (.*)$/m.exec(raw)?.[1];
        const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] || "{}");
        if (event === "text") {
          pending += data.text;
          flush(false);
        } else if (event === "tool") {
          showTool(`Using ${data.server}: ${data.tool.replace(/_/g, " ")}`);
          if (!tts.speaking) setState("thinking");
        } else if (event === "error") {
          throw new Error(data.message);
        }
      }
    }
    flush(true);
    if (!shown.trim()) bubble.textContent = "…";
  } catch (err) {
    avatar.setMood("concerned");
    bubble.classList.add("error");
    bubble.textContent = err.message;
    tts.push(err.message);
  } finally {
    busy = false;
    if (!tts.speaking) afterReply();
  }
}

function askForToken() {
  const t = prompt("Access token for this companion:");
  if (t) {
    token = t.trim();
    store.set("companion-token", token);
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  stopListening();
  send(input.value);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

micBtn.addEventListener("click", () => (listening ? stopListening() : startListening()));

talkBtn.addEventListener("click", () => {
  talkMode = !talkMode;
  talkBtn.setAttribute("aria-pressed", String(talkMode));
  if (talkMode && !busy && !tts.speaking) startListening();
  if (!talkMode) stopListening();
  if (!listening && !busy) setState("idle");
});

muteBtn.addEventListener("click", () => {
  muted = !muted;
  store.set("companion-muted", muted ? "1" : "0");
  muteBtn.setAttribute("aria-pressed", String(muted));
  if (muted) tts.stop();
});
muteBtn.setAttribute("aria-pressed", String(muted));

$("#voice").addEventListener("change", (e) => {
  store.set("companion-voice", e.target.value);
  tts.pickVoice();
  tts.push("How do I sound?");
});

$("#reset").addEventListener("click", async () => {
  tts.stop();
  await fetch("/api/reset", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ sessionId }) }).catch(() => {});
  sessionId = crypto.randomUUID();
  sessionStorage.setItem("companion-session", sessionId);
  log.innerHTML = "";
  avatar.setMood("neutral");
  greet();
});

// Tap the character to interrupt her.
$("#stage").addEventListener("click", () => {
  if (tts.speaking) {
    tts.stop();
    if (!busy) afterReply();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { tts.stop(); stopListening(); if (!busy) setState("idle"); }
});

if (!Recognition) {
  micBtn.disabled = talkBtn.disabled = true;
  micBtn.title = talkBtn.title = "Voice input needs Chrome, Edge or Safari";
}

function greet() {
  const tools = config.connectors.length ? ` I'm hooked up to ${config.connectors.join(", ")}.` : "";
  addBubble("assistant", `Hi, I'm ${config.name}.${tools} Type, or tap the mic and talk to me.`);
  avatar.setMood("happy");
}

(async () => {
  try {
    config = await (await fetch("/api/config")).json();
  } catch {}
  document.title = config.name;
  $("#name").textContent = config.name;
  $("#connectors").textContent = config.connectors.length ? config.connectors.join(" · ") : "No tools connected yet";
  if (config.needsToken && !token) askForToken();
  setState("idle");
  greet();
})();
