/**
 * Decorative, non-clickable scenery: the starfield and the two belts.
 */
import * as THREE from "three";
import * as S from "../config/scale.ts";
import { rng } from "./textures.ts";

function dotTexture(): THREE.CanvasTexture {
  const s = 32;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.8)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createStarfield(count = 5000, radius = 40_000): THREE.Points {
  const r = rng(42);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const tints = [new THREE.Color("#ffffff"), new THREE.Color("#cfe0ff"), new THREE.Color("#fff1d6"), new THREE.Color("#ffd9c2")];
  for (let i = 0; i < count; i++) {
    // Uniform on a sphere.
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos.set([radius * s * Math.cos(th), radius * u, radius * s * Math.sin(th)], i * 3);
    const c = tints[Math.floor(r() * tints.length)].clone().multiplyScalar(0.35 + Math.pow(r(), 3) * 0.9);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: false,
    vertexColors: true,
    map: dotTexture(),
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  pts.renderOrder = -1;
  return pts;
}

export class Belt {
  readonly points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly au: Float32Array;
  private readonly angle: Float32Array;
  private readonly heightAu: Float32Array;
  private lastBlend = -1;
  private readonly periodSeconds: number;

  constructor(spec: { innerAu: number; outerAu: number; count: number; thicknessAu: number }, color: string, size: number, opacity: number, seed: number) {
    const r = rng(seed);
    const n = spec.count;
    this.au = new Float32Array(n);
    this.angle = new Float32Array(n);
    this.heightAu = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // Denser towards the middle of the belt.
      const t = (r() + r() + r()) / 3;
      this.au[i] = spec.innerAu + (spec.outerAu - spec.innerAu) * t;
      this.angle[i] = r() * Math.PI * 2;
      this.heightAu[i] = (r() - 0.5) * 2 * spec.thicknessAu * (0.3 + r());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const m = new THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: false,
      map: dotTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    const midAu = (spec.innerAu + spec.outerAu) / 2;
    this.periodSeconds = S.planetPeriodSeconds(365.25 * Math.pow(midAu, 1.5));
  }

  update(time: number, blend: number) {
    this.points.rotation.y = (time / this.periodSeconds) * Math.PI * 2;
    if (Math.abs(blend - this.lastBlend) < 1e-4) return;
    this.lastBlend = blend;
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.au.length; i++) {
      const au = this.au[i];
      const rad = S.logLerp(S.planetOrbitRadius(au), au * S.TRUE_SCALE_UNITS_PER_AU, blend);
      // Keep the same vertical-to-radial proportion in both scales.
      const h = (this.heightAu[i] / au) * rad;
      pos.setXYZ(i, rad * Math.cos(this.angle[i]), h, -rad * Math.sin(this.angle[i]));
    }
    pos.needsUpdate = true;
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.map?.dispose();
    this.points.material.dispose();
  }
}
