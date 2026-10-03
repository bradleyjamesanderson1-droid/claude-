/**
 * Procedural surface textures painted on a canvas, so the app needs no image
 * files. Each is an equirectangular map sampled from 3D noise on the sphere,
 * which means no seam at the date line and no pinching at the poles.
 */
import * as THREE from "three";
import type { Body } from "../data/bodies.ts";

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const fade = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  let acc = 0;
  for (let dz = 0; dz < 2; dz++)
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const w = (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
        acc += w * hash3(xi + dx, yi + dy, zi + dz, seed);
      }
  return acc;
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 4): number {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, z * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

function seedFrom(id: string): number {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

type RGB = [number, number, number];

function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function ramp(colors: RGB[], t: number): RGB {
  const k = Math.min(0.9999, Math.max(0, t)) * (colors.length - 1);
  const i = Math.floor(k);
  return mix(colors[i], colors[i + 1] ?? colors[i], k - i);
}

// ---------------------------------------------------------------------------
// Painters
// ---------------------------------------------------------------------------

type Painter = (nx: number, ny: number, nz: number, lat: number, lon: number) => RGB;

function painterFor(body: Body, seed: number): Painter {
  const p = body.palette.map(hex);
  switch (body.surface) {
    case "star":
      return (x, y, z) => {
        const n = fbm(x * 8, y * 8, z * 8, seed, 4);
        return ramp([p[2], p[1], p[0]], 0.35 + n * 0.8);
      };

    case "earth":
      return (x, y, z, lat) => {
        const land = fbm(x * 2.2, y * 2.2, z * 2.2, seed, 5);
        const detail = fbm(x * 9, y * 9, z * 9, seed + 99, 3);
        const polar = Math.abs(lat) > 1.2 + (detail - 0.5) * 0.25;
        let c: RGB = land > 0.53 ? mix(p[1], p[2], (land - 0.53) * 5 + (detail - 0.5)) : mix(p[0], [20, 60, 120], (0.53 - land) * 3);
        if (polar) c = p[3];
        const cloud = fbm(x * 4, y * 6, z * 4, seed + 7, 4);
        if (cloud > 0.58) c = mix(c, [255, 255, 255], (cloud - 0.58) * 3);
        return c;
      };

    case "banded": {
      const bands = p.length;
      const isJupiter = body.id === "jupiter";
      return (x, y, z, lat, lon) => {
        const warp = (fbm(x * 3, y * 3, z * 3, seed, 4) - 0.5) * 0.35;
        const t = Math.sin(lat * (isJupiter ? 14 : 11) + warp * 6) * 0.5 + 0.5;
        const idx = (lat * 3 + warp + 10) % 1;
        let c = mix(p[Math.floor(idx * bands) % bands], p[(Math.floor(idx * bands) + 1) % bands], t);
        const fine = fbm(x * 12, y * 30, z * 12, seed + 3, 2);
        c = mix(c, [255, 255, 255], (fine - 0.5) * 0.18);
        if (isJupiter) {
          // The Great Red Spot, ~22° south.
          const dLat = (lat + 0.38) / 0.07;
          const dLon = (((lon - 1.2 + Math.PI) % (2 * Math.PI)) - Math.PI) / 0.16;
          const d = dLat * dLat + dLon * dLon;
          if (d < 1) c = mix(c, [190, 90, 60], (1 - d) * 1.4);
        }
        return c;
      };
    }

    case "hazy":
      return (x, y, z, lat) => {
        const n = fbm(x * 2, y * 5, z * 2, seed, 3);
        const band = Math.sin(lat * 7 + n * 2) * 0.5 + 0.5;
        let c = mix(p[0], p[1], band * 0.55 + (n - 0.5) * 0.4);
        if (p[2]) c = mix(c, p[2], Math.max(0, n - 0.62) * 2);
        if (p[3] && n > 0.7) c = mix(c, p[3], (n - 0.7) * 3); // Neptune's bright clouds
        return c;
      };

    case "icy":
      return (x, y, z, _lat, lon) => {
        if (body.id === "iapetus") {
          // Dark leading hemisphere, bright trailing one, with a soft boundary.
          const n = fbm(x * 4, y * 4, z * 4, seed, 3);
          const side = Math.cos(lon) + (n - 0.5) * 0.8;
          return mix(p[0], p[1], side * 2 + 0.5);
        }
        const n = fbm(x * 3, y * 3, z * 3, seed, 4);
        let c = mix(p[0], p[1], n);
        // Lineae: thin wandering cracks.
        const crack = Math.abs(fbm(x * 5, y * 5, z * 5, seed + 11, 3) - 0.5);
        if (p[2] && crack < 0.018) c = mix(c, p[2], 1 - crack / 0.018);
        if (p[3] && n > 0.62) c = mix(c, p[3], (n - 0.62) * 3);
        return c;
      };

    case "rocky":
    default:
      return (x, y, z, lat) => {
        const n = fbm(x * 3, y * 3, z * 3, seed, 5);
        const m = fbm(x * 1.4, y * 1.4, z * 1.4, seed + 5, 3);
        let c = mix(p[0], p[1], n * 1.2 - 0.1);
        if (p[2]) c = mix(c, p[2], Math.max(0, m - 0.55) * 3); // maria / dark regions
        if (body.id === "mars" && p[3] && Math.abs(lat) > 1.3) c = p[3]; // polar caps
        if (body.id === "io" && p[3]) {
          const v = fbm(x * 8, y * 8, z * 8, seed + 21, 2);
          if (v > 0.68) c = mix(c, p[3], (v - 0.68) * 5); // volcanic spots
        }
        return c;
      };
  }
}

function addCraters(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, count: number) {
  const r = rng(seed ^ 0x9e3779b9);
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = h * (0.1 + r() * 0.8);
    const rad = (0.004 + Math.pow(r(), 3) * 0.03) * w;
    const g = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad);
    g.addColorStop(0, "rgba(0,0,0,0.18)");
    g.addColorStop(0.8, "rgba(0,0,0,0.08)");
    g.addColorStop(0.92, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    // Stretch horizontally with latitude so craters look round on the sphere.
    const lat = (y / h - 0.5) * Math.PI;
    ctx.ellipse(x, y, rad / Math.max(0.3, Math.cos(lat)), rad, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function makeSurfaceTexture(body: Body): THREE.CanvasTexture {
  const big = body.type !== "moon";
  const w = big ? 512 : 256;
  const h = w / 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const seed = seedFrom(body.id);
  const paint = painterFor(body, seed);

  for (let j = 0; j < h; j++) {
    const lat = (0.5 - (j + 0.5) / h) * Math.PI;
    const cl = Math.cos(lat), sl = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = ((i + 0.5) / w) * Math.PI * 2;
      const c = paint(cl * Math.cos(lon), sl, cl * Math.sin(lon), lat, lon);
      const k = (j * w + i) * 4;
      img.data[k] = c[0];
      img.data[k + 1] = c[1];
      img.data[k + 2] = c[2];
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (body.surface === "rocky") addCraters(ctx, w, h, seed, big ? 90 : 60);
  else if (body.surface === "icy" && body.id !== "europa" && body.id !== "enceladus") addCraters(ctx, w, h, seed, 40);
  if (body.id === "mimas") {
    // Herschel crater.
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 0.5, w * 0.06, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Radial ring texture: u runs from the inner edge (0) to the outer edge (1). */
export function makeRingTexture(kind: "saturn" | "uranus"): THREE.CanvasTexture {
  const w = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 4;
  const ctx = canvas.getContext("2d")!;
  const r = rng(kind === "saturn" ? 7 : 11);
  for (let i = 0; i < w; i++) {
    const t = i / w;
    let alpha: number;
    let shade: number;
    if (kind === "saturn") {
      // C ring (faint) -> B ring (bright, dense) -> Cassini Division (gap) -> A ring (with Encke gap).
      const cRing = t < 0.24;
      const bRing = t >= 0.24 && t < 0.62;
      const cassini = t >= 0.62 && t < 0.68;
      const encke = t > 0.93 && t < 0.945;
      alpha = cRing ? 0.25 : bRing ? 0.85 : cassini ? 0.06 : encke ? 0.05 : 0.6;
      shade = cRing ? 0.55 : bRing ? 0.95 : 0.8;
      alpha *= 0.8 + r() * 0.35;
    } else {
      // A few narrow faint ringlets; the outermost (epsilon) is brightest.
      const ringlets = [0.08, 0.2, 0.33, 0.45, 0.58, 0.7, 0.96];
      const near = ringlets.some((x) => Math.abs(t - x) < 0.008);
      alpha = near ? (t > 0.9 ? 0.55 : 0.28) : 0;
      shade = 0.7;
    }
    const base = kind === "saturn" ? [226, 208, 170] : [180, 190, 200];
    ctx.fillStyle = `rgba(${base.map((c) => Math.round(c * shade)).join(",")},${Math.min(1, alpha).toFixed(3)})`;
    ctx.fillRect(i, 0, 1, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow for the Sun (and hover sprites). */
export function makeGlowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner);
  g.addColorStop(0.45, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
