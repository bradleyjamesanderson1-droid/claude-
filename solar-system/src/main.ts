import "./styles.css";
import * as THREE from "three";
import * as S from "./config/scale.ts";
import { getBody } from "./data/bodies.ts";
import { SolarSystem, type BodyNode } from "./scene/SolarSystem.ts";
import { CameraRig } from "./scene/CameraRig.ts";
import { Belt, createStarfield } from "./scene/backdrop.ts";
import { Overlay } from "./ui/Overlay.ts";
import { InfoPanel } from "./ui/InfoPanel.ts";
import { BodyList } from "./ui/BodyList.ts";
import { ChatStore } from "./chat/store.ts";
import { fetchHealth } from "./chat/api.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------------------------------------------------------------------------
// Renderer, scene, camera
// ---------------------------------------------------------------------------

const canvas = $<HTMLCanvasElement>("scene");
let renderer: THREE.WebGLRenderer;
try {
  // Log depth lets one camera cope with both Phobos close up and the whole system.
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
} catch {
  $("hint").textContent = "Sorry, this explorer needs WebGL, which isn't available in this browser.";
  throw new Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020308);
const camera = new THREE.PerspectiveCamera(S.CAMERA_FOV, 1, 1e-6, 2e5);

const system = new SolarSystem();
scene.add(system.root);
scene.add(createStarfield());
const sunLight = new THREE.PointLight(0xffffff, 3.2, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x6070a0, 0.22));

const asteroids = new Belt(S.ASTEROID_BELT, "#9c8f7e", 1.6, 0.55, 3);
const kuiper = new Belt(S.KUIPER_BELT, "#8aa0c8", 1.4, 0.3, 5);
scene.add(asteroids.points, kuiper.points);

const rig = new CameraRig(camera, canvas, system);
const overlay = new Overlay(system.nodes, camera, (id) => select(id));

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let simTime = 0;
let speed: number = S.TIME_SPEEDS.find((s) => s.id === "normal")!.value;
let blend = 0; // 0 compressed, 1 true scale
let blendTarget = 0;
let blendProgress = 0;
let selected: BodyNode | null = null;
let hovered: BodyNode | null = null;
let viewW = 1;
let viewH = 1;

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const chat = new ChatStore();
const panel = new InfoPanel(chat, (id) => select(id), () => backToSystem());
const list = new BodyList((id) => select(id, true));
fetchHealth().then((h) => panel.setHealth(h));

function select(id: string, fromKeyboard = false) {
  const node = system.byId.get(id);
  const body = getBody(id);
  if (!node || !body) return;
  selected = node;
  rig.flyTo(node);
  panel.open(body);
  list.setCurrent(id);
  if (fromKeyboard) panel.focus();
}

function backToSystem() {
  selected = null;
  panel.close();
  list.setCurrent(null);
  rig.flyTo(null);
}

$("back-btn").addEventListener("click", backToSystem);

// Time controls.
const timeGroup = $("time-controls");
for (const s of S.TIME_SPEEDS) {
  const b = document.createElement("button");
  b.className = "btn toggle";
  b.textContent = s.label;
  b.setAttribute("aria-pressed", String(s.value === speed));
  b.addEventListener("click", () => {
    speed = s.value;
    for (const other of timeGroup.children) other.setAttribute("aria-pressed", String(other === b));
  });
  timeGroup.append(b);
}

function toggle(id: string, onChange: (on: boolean) => void) {
  const b = $<HTMLButtonElement>(id);
  b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    onChange(on);
  });
}
toggle("orbits-btn", (on) => system.setOrbitsVisible(on));
toggle("labels-btn", (on) => (overlay.labelsEnabled = on));
toggle("scale-btn", (on) => {
  blendTarget = on ? 1 : 0;
  $("scale-banner").hidden = !on;
});

window.addEventListener("keydown", (e) => {
  const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  if (e.key === "Escape") {
    if (list.isOpen) list.close(true);
    else if (typing && (e.target as HTMLInputElement).value) (e.target as HTMLElement).blur();
    else backToSystem();
  } else if (e.key === "/" && !typing) {
    e.preventDefault();
    list.open();
  }
});

// ---------------------------------------------------------------------------
// Pointer: hover + click-to-select (ignoring drags)
// ---------------------------------------------------------------------------

let pointer: { x: number; y: number } | null = null;
let down: { x: number; y: number; t: number } | null = null;

canvas.addEventListener("pointermove", (e) => {
  pointer = e.pointerType === "mouse" ? { x: e.offsetX, y: e.offsetY } : null;
});
canvas.addEventListener("pointerleave", () => (pointer = null));
canvas.addEventListener("pointerdown", (e) => {
  down = { x: e.offsetX, y: e.offsetY, t: performance.now() };
  $("hint").classList.add("gone");
});
canvas.addEventListener("pointerup", (e) => {
  if (!down || e.button !== 0) return;
  const moved = Math.hypot(e.offsetX - down.x, e.offsetY - down.y);
  const quick = performance.now() - down.t < 600;
  down = null;
  if (moved > 6 || !quick) return;
  const hit = overlay.pick(e.offsetX, e.offsetY);
  if (hit) select(hit.body.id);
});
canvas.addEventListener("wheel", () => $("hint").classList.add("gone"), { passive: true });

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

function resize() {
  viewW = canvas.clientWidth || window.innerWidth;
  viewH = canvas.clientHeight || window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(viewW, viewH, false);
  camera.aspect = viewW / viewH;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
rig.snapToSystem();

// ---------------------------------------------------------------------------
// Frame loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();
const panelEl = $("panel");
const shift = { x: 0, y: 0 };

/**
 * Keep the focused body centred in the part of the screen the info panel
 * doesn't cover, by sliding the camera's view window (not the camera itself).
 */
function updateViewShift(dt: number) {
  let tx = 0;
  let ty = 0;
  if (!panelEl.hidden) {
    const r = panelEl.getBoundingClientRect();
    if (r.width >= viewW * 0.9) ty = Math.max(0, (viewH - r.top) / 2 - 24); // bottom sheet
    else tx = Math.max(0, (viewW - r.left) / 2); // side panel
  }
  const k = Math.min(1, dt * 5);
  shift.x += (tx - shift.x) * k;
  shift.y += (ty - shift.y) * k;
  if (Math.abs(shift.x) < 0.5 && Math.abs(shift.y) < 0.5 && tx === 0 && ty === 0) {
    if (camera.view?.enabled) camera.clearViewOffset();
  } else {
    camera.setViewOffset(viewW, viewH, shift.x, shift.y, viewW, viewH);
  }
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  simTime += dt * speed;

  if (blend !== blendTarget || blendProgress !== blendTarget) {
    const step = dt / S.TRUE_SCALE_TRANSITION_SECONDS;
    blendProgress = blendTarget > blendProgress ? Math.min(1, blendProgress + step) : Math.max(0, blendProgress - step);
    blend = S.easeInOutCubic(blendProgress);
  }

  updateViewShift(dt);
  system.update(simTime, blend, (p) => overlay.pxPerUnitAt(p, viewH), camera.position);
  asteroids.update(simTime, blend);
  kuiper.update(simTime, blend);
  rig.step(dt);
  // Re-run once with the camera's new position so fades and inflation match this frame's view.
  system.update(simTime, blend, (p) => overlay.pxPerUnitAt(p, viewH), camera.position);

  overlay.project(system.nodes, viewW, viewH);
  hovered = pointer && !rig.flying ? overlay.pick(pointer.x, pointer.y) : null;
  canvas.classList.toggle("hovering", hovered !== null);
  overlay.render(hovered, selected);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Handy for debugging and automated checks.
Object.assign(window, { __explorer: { system, rig, select, backToSystem, camera } });
