/**
 * Everything drawn in screen space on top of the canvas: labels (with overlap
 * culling), hover/selection reticles, and screen-space picking with generous
 * hit areas for small bodies.
 */
import * as THREE from "three";
import * as S from "../config/scale.ts";
import type { BodyNode } from "../scene/SolarSystem.ts";

export interface Projected {
  node: BodyNode;
  x: number;
  y: number;
  /** Distance from the camera. */
  depth: number;
  /** On-screen radius, CSS px. */
  r: number;
  onScreen: boolean;
}

const TYPE_PRIORITY = { star: 0, planet: 1, "dwarf-planet": 2, moon: 3 } as const;

export class Overlay {
  readonly projected = new Map<string, Projected>();
  private readonly labels = new Map<string, { el: HTMLButtonElement; w: number; h: number }>();
  private readonly labelLayer = document.getElementById("labels")!;
  private readonly hoverRing = document.querySelector<HTMLElement>(".reticle-hover")!;
  private readonly selectRing = document.querySelector<HTMLElement>(".reticle-selected")!;
  private readonly v = new THREE.Vector3();
  private order: BodyNode[];
  labelsEnabled = true;

  constructor(
    nodes: BodyNode[],
    private readonly camera: THREE.PerspectiveCamera,
    onClick: (id: string) => void,
  ) {
    for (const n of nodes) {
      const el = document.createElement("button");
      el.className = `label ${n.body.type} off`;
      el.textContent = n.body.name;
      el.tabIndex = -1; // The body list is the keyboard route; labels are a pointer shortcut.
      el.addEventListener("click", () => onClick(n.body.id));
      this.labelLayer.append(el);
      this.labels.set(n.body.id, { el, w: 0, h: 0 });
    }
    // Place bigger, more important bodies first so they win overlaps.
    this.order = [...nodes].sort(
      (a, b) => TYPE_PRIORITY[a.body.type] - TYPE_PRIORITY[b.body.type] || b.body.diameterKm - a.body.diameterKm,
    );
  }

  /** Pixels per scene unit at a world point, for the current camera and canvas height. */
  pxPerUnitAt(p: THREE.Vector3, viewportH: number): number {
    const d = Math.max(1e-9, this.camera.position.distanceTo(p));
    return viewportH / 2 / (d * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
  }

  project(nodes: BodyNode[], w: number, h: number) {
    for (const n of nodes) {
      this.v.copy(n.worldPos).project(this.camera);
      const depth = this.camera.position.distanceTo(n.worldPos);
      const r = n.renderRadius * this.pxPerUnitAt(n.worldPos, h);
      const x = (this.v.x * 0.5 + 0.5) * w;
      const y = (-this.v.y * 0.5 + 0.5) * h;
      const inFront = this.v.z < 1 && this.v.z > -1;
      this.projected.set(n.body.id, {
        node: n,
        x,
        y,
        depth,
        r,
        onScreen: inFront && n.opacity > 0.05 && x > -r - 50 && x < w + r + 50 && y > -r - 50 && y < h + r + 50,
      });
    }
  }

  /** Best body under a screen point, or null. Prefers bodies in front and those actually under the cursor. */
  pick(x: number, y: number): BodyNode | null {
    const hits: { p: Projected; d: number; hitR: number }[] = [];
    for (const p of this.projected.values()) {
      if (!p.onScreen || p.node.opacity < 0.3) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      const hitR = Math.max(p.r + S.PICK_PADDING_PX, S.PICK_MIN_RADIUS_PX);
      if (d <= hitR) hits.push({ p, d, hitR });
    }
    if (!hits.length) return null;
    // A body is hidden if the cursor is on the actual disc of something nearer the camera.
    const visible = hits.filter(
      (h) => !hits.some((o) => o !== h && o.d <= o.p.r && o.p.depth + o.p.node.renderRadius < h.p.depth - h.p.node.renderRadius),
    );
    const pool = visible.length ? visible : hits;
    // Small bodies whose hit area contains the cursor beat a big disc behind them.
    pool.sort((a, b) => a.d / a.hitR - b.d / b.hitR || a.p.depth - b.p.depth);
    return pool[0].p.node;
  }

  render(hovered: BodyNode | null, selected: BodyNode | null) {
    this.placeRing(this.hoverRing, hovered && hovered !== selected ? hovered : null, 6);
    this.placeRing(this.selectRing, selected, 8);

    const placed: [number, number, number, number][] = [];
    for (const n of this.order) {
      const lab = this.labels.get(n.body.id)!;
      const p = this.projected.get(n.body.id)!;
      const important = n === hovered || n === selected;
      let show = p.onScreen && (this.labelsEnabled || important);
      if (show && n.body.type === "moon" && n.parent && !important) {
        // Hide moon labels until the moon is visibly separated from its planet.
        const pp = this.projected.get(n.parent.body.id)!;
        show = Math.hypot(p.x - pp.x, p.y - pp.y) > pp.r + S.MOON_LABEL_MIN_SEPARATION_PX;
      }
      if (show) {
        if (!lab.w) {
          lab.el.classList.remove("off");
          lab.w = lab.el.offsetWidth || lab.el.textContent!.length * 7 + 10;
          lab.h = lab.el.offsetHeight || 18;
        }
        const off = Math.max(3, p.r * 0.72);
        const lx = p.x + off + 2;
        const ly = p.y - off - lab.h + 4;
        const rect: [number, number, number, number] = [lx, ly, lx + lab.w, ly + lab.h];
        if (!important && placed.some((q) => rect[0] < q[2] && rect[2] > q[0] && rect[1] < q[3] && rect[3] > q[1])) {
          show = false;
        } else {
          placed.push(rect);
          lab.el.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
          lab.el.style.opacity = String(Math.min(1, n.opacity * 1.3));
        }
      }
      lab.el.classList.toggle("off", !show);
      lab.el.classList.toggle("active", n === selected);
    }
  }

  private placeRing(el: HTMLElement, n: BodyNode | null, pad: number) {
    const p = n ? this.projected.get(n.body.id) : undefined;
    if (!p || !p.onScreen) {
      el.hidden = true;
      return;
    }
    const size = Math.max(p.r * 2 + pad * 2, 18);
    if (size > 2000) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.style.width = el.style.height = `${size}px`;
    el.style.transform = `translate3d(${(p.x - size / 2).toFixed(1)}px, ${(p.y - size / 2).toFixed(1)}px, 0)`;
  }
}
