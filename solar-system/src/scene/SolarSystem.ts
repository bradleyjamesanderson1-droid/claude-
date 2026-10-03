/**
 * Builds the scene graph for every body and updates positions, sizes and
 * visibility each frame. All scale maths comes from config/scale.ts.
 *
 * Graph per body:
 *   orbitPlane (at the parent's centre, oriented to the orbit's plane)
 *     ├─ orbitLine (unit circle, scaled to the orbit radius)
 *     └─ anchor (moves round the orbit; world position of the body)
 *          ├─ tilt (axial tilt; scaled to the rendered radius)
 *          │    ├─ mesh (unit sphere, spins)
 *          │    └─ rings
 *          └─ ...child moons' orbitPlanes
 */
import * as THREE from "three";
import { BODIES, type Body } from "../data/bodies.ts";
import * as S from "../config/scale.ts";
import { makeGlowTexture, makeRingTexture, makeSurfaceTexture, rng } from "./textures.ts";

export interface BodyNode {
  body: Body;
  parent?: BodyNode;
  moons: BodyNode[];
  orbitPlane: THREE.Group;
  anchor: THREE.Group;
  tilt: THREE.Group;
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>;
  rings?: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  orbitLine?: THREE.LineLoop<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  compressed: { radius: number; orbit: number };
  real: { radius: number; orbit: number };
  periodSeconds: number;
  spinSeconds: number;
  phase: number;
  /** Current values (after true-scale blending). */
  radius: number;
  orbitRadius: number;
  /** Radius actually drawn, including far-away inflation. */
  renderRadius: number;
  /** 0..1, moons fade with camera distance. Always 1 for non-moons. */
  opacity: number;
  /** Outermost moon orbit, 0 if no moons. */
  systemRadius: number;
  worldPos: THREE.Vector3;
}

const SPHERE_SEGMENTS = { star: 48, big: 48, small: 24 };
const ORBIT_SEGMENTS = { planet: 360, moon: 128 };

export class SolarSystem {
  readonly root = new THREE.Group();
  readonly nodes: BodyNode[] = [];
  readonly byId = new Map<string, BodyNode>();
  readonly sun: BodyNode;
  private readonly disposables: { dispose(): void }[] = [];
  private orbitsVisible = true;
  private readonly tmpV = new THREE.Vector3();

  constructor() {
    const unitCircle = (segments: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      this.disposables.push(g);
      return g;
    };
    const planetCircle = unitCircle(ORBIT_SEGMENTS.planet);
    const moonCircle = unitCircle(ORBIT_SEGMENTS.moon);
    const sphere = (segs: number) => {
      const g = new THREE.SphereGeometry(1, segs, Math.round(segs * 0.75));
      this.disposables.push(g);
      return g;
    };
    const spheres = {
      star: sphere(SPHERE_SEGMENTS.star),
      big: sphere(SPHERE_SEGMENTS.big),
      small: sphere(SPHERE_SEGMENTS.small),
    };

    // Parents first, so moons can find them.
    const ordered = [...BODIES].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId));
    for (const body of ordered) {
      const parent = body.parentId ? this.byId.get(body.parentId) : undefined;
      const node = this.createNode(body, parent, body.type === "star" ? spheres.star : body.type === "moon" ? spheres.small : spheres.big);
      if (body.type !== "star") {
        const isMoon = body.type === "moon";
        const line = new THREE.LineLoop(
          isMoon ? moonCircle : planetCircle,
          new THREE.LineBasicMaterial({
            color: isMoon ? 0x8fb3ff : body.type === "dwarf-planet" ? 0x9a8cff : 0x6f93d6,
            transparent: true,
            opacity: isMoon ? 0.35 : 0.3,
            depthWrite: false,
          }),
        );
        this.disposables.push(line.material);
        node.orbitLine = line;
        node.orbitPlane.add(line);
      }
      this.nodes.push(node);
      this.byId.set(body.id, node);
      if (parent) parent.moons.push(node);
    }
    this.sun = this.byId.get("sun")!;

    for (const n of this.nodes) {
      n.moons.sort((a, b) => a.body.orbitRadiusReal - b.body.orbitRadiusReal);
    }
    this.update(0, 0, () => 1);
  }

  private createNode(body: Body, parent: BodyNode | undefined, geometry: THREE.SphereGeometry): BodyNode {
    const r = rng(body.id.length * 7919 + body.id.charCodeAt(0));
    const isStar = body.type === "star";
    const isMoon = body.type === "moon";

    // --- sizes and distances, compressed and real ---
    const compressedRadius = isStar ? Math.min(S.SUN_RADIUS_MAX, S.bodyRadius(body.diameterKm)) : S.bodyRadius(body.diameterKm);
    const realRadius = S.trueScaleKm(body.diameterKm / 2);
    let compressedOrbit = 0;
    let realOrbit = 0;
    if (isMoon && parent) {
      compressedOrbit = S.moonOrbitRadius(body.orbitRadiusReal, parent.body.diameterKm, parent.compressed.radius);
      realOrbit = S.trueScaleKm(body.orbitRadiusReal);
    } else if (!isStar) {
      compressedOrbit = S.planetOrbitRadius(body.orbitRadiusReal);
      realOrbit = body.orbitRadiusReal * S.TRUE_SCALE_UNITS_PER_AU;
    }

    // --- graph ---
    const orbitPlane = new THREE.Group();
    orbitPlane.name = `${body.id}:orbitPlane`;
    const inc = THREE.MathUtils.degToRad(body.inclinationDeg ?? 0);
    const node = r() * Math.PI * 2;
    const incQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(inc, node, 0, "YXZ"));
    if (isMoon && parent && !body.eclipticOrbit) {
      // Moons orbit in their parent's equatorial plane.
      orbitPlane.quaternion.copy(parent.tilt.quaternion).multiply(incQ);
    } else {
      orbitPlane.quaternion.copy(incQ);
    }
    (parent ? parent.anchor : this.root).add(orbitPlane);

    const anchor = new THREE.Group();
    anchor.name = body.id;
    orbitPlane.add(anchor);

    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(body.axialTiltDeg ?? 0);
    anchor.add(tilt);

    const map = makeSurfaceTexture(body);
    this.disposables.push(map);
    const material = isStar
      ? new THREE.MeshBasicMaterial({ map, color: 0xffffff })
      : new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
    this.disposables.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${body.id}:mesh`;
    tilt.add(mesh);

    let rings: BodyNode["rings"];
    if (body.hasRings) {
      const spec = body.id === "saturn" ? S.SATURN_RING : S.URANUS_RING;
      const g = new THREE.RingGeometry(spec.inner, spec.outer, 128, 1);
      // Remap UVs radially so the 1D ring texture runs from inner to outer edge.
      const pos = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const len = Math.hypot(pos.getX(i), pos.getY(i));
        uv.setXY(i, (len - spec.inner) / (spec.outer - spec.inner), 0.5);
      }
      g.rotateX(-Math.PI / 2);
      const tex = makeRingTexture(body.id === "saturn" ? "saturn" : "uranus");
      // Unlit: real rings scatter sunlight through themselves, so they shouldn't go black from the far side.
      const m = new THREE.MeshBasicMaterial({
        map: tex,
        color: 0xd8d8d8,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.disposables.push(g, tex, m);
      rings = new THREE.Mesh(g, m);
      rings.renderOrder = 1;
      tilt.add(rings);
    }

    if (isStar) {
      const glowTex = makeGlowTexture("rgba(255,236,170,0.9)", "rgba(255,150,40,0.18)");
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      });
      this.disposables.push(glowTex, glowMat);
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(6);
      tilt.add(glow);
    }

    const rotationHours = body.rotationPeriodHours;
    // A tilt over 90° already flips the spin direction, so use |period| there.
    const signedHours =
      rotationHours === undefined ? 0 : (body.axialTiltDeg ?? 0) > 90 ? Math.abs(rotationHours) : rotationHours;

    return {
      body,
      parent,
      moons: [],
      orbitPlane,
      anchor,
      tilt,
      mesh,
      rings,
      compressed: { radius: compressedRadius, orbit: compressedOrbit },
      real: { radius: realRadius, orbit: realOrbit },
      periodSeconds: isStar ? 0 : isMoon ? S.moonPeriodSeconds(body.orbitalPeriodDays) : S.planetPeriodSeconds(body.orbitalPeriodDays),
      spinSeconds: signedHours ? S.spinPeriodSeconds(signedHours) : 0,
      phase: r() * Math.PI * 2,
      radius: compressedRadius,
      orbitRadius: compressedOrbit,
      renderRadius: compressedRadius,
      opacity: 1,
      systemRadius: 0,
      worldPos: new THREE.Vector3(),
    };
  }

  setOrbitsVisible(v: boolean) {
    this.orbitsVisible = v;
  }

  /**
   * @param time    simulation time in "normal speed" seconds
   * @param blend   0 = compressed scale, 1 = true scale
   * @param pxPerUnitAt  on-screen pixels per scene unit at a given world point
   */
  update(time: number, blend: number, pxPerUnitAt: (p: THREE.Vector3) => number, camPos?: THREE.Vector3) {
    // 1. radii and orbits for the current blend; place bodies on their orbits.
    for (const n of this.nodes) {
      n.radius = S.logLerp(n.compressed.radius, n.real.radius, blend);
      n.orbitRadius = n.body.type === "star" ? 0 : S.logLerp(n.compressed.orbit, n.real.orbit, blend);
      if (n.periodSeconds > 0) {
        const dir = n.body.retrograde ? -1 : 1;
        const a = n.phase + dir * (time / n.periodSeconds) * Math.PI * 2;
        n.anchor.position.set(n.orbitRadius * Math.cos(a), 0, -n.orbitRadius * Math.sin(a));
        if (n.body.type === "moon") {
          // Tidally locked: the same face always points at the parent.
          n.mesh.rotation.y = a;
        }
      }
      if (n.spinSeconds !== 0) n.mesh.rotation.y = (time / n.spinSeconds) * Math.PI * 2;
      n.orbitLine?.scale.setScalar(n.orbitRadius);
    }
    for (const n of this.nodes) {
      n.systemRadius = n.moons.length ? n.moons[n.moons.length - 1].orbitRadius : 0;
    }

    this.root.updateMatrixWorld(true);
    for (const n of this.nodes) n.anchor.getWorldPosition(n.worldPos);

    // 2. inflation (so far-away bodies stay visible) and moon fading.
    const earthRadiusNow = S.logLerp(1, S.trueScaleKm(S.EARTH_DIAMETER_KM / 2), blend);
    for (const n of this.nodes) {
      const ppu = pxPerUnitAt(n.worldPos);
      // Compressed: inflate everyone by the same factor an Earth-sized body would need,
      // so relative sizes survive. True scale: each body just needs to be a findable dot.
      const fCompressed = Math.max(1, S.MIN_EARTH_PIXEL_RADIUS / (earthRadiusNow * ppu));
      const fTrue = Math.max(1, S.TRUE_SCALE_MIN_PIXEL_RADIUS / (n.radius * ppu));
      const f = S.logLerp(fCompressed, fTrue, blend);
      n.renderRadius = n.radius * f;
      n.tilt.scale.setScalar(n.renderRadius);

      if (n.body.type === "moon" && n.parent && camPos) {
        const sys = Math.max(n.parent.systemRadius, n.parent.renderRadius * 3);
        const d = camPos.distanceTo(n.parent.worldPos);
        n.opacity = 1 - S.smoothstep(sys * S.MOON_FADE_NEAR, sys * S.MOON_FADE_FAR, d);
      } else {
        n.opacity = 1;
      }
    }

    // 3. apply visibility.
    for (const n of this.nodes) {
      const visible = n.opacity > 0.01;
      n.anchor.visible = visible;
      const mat = n.mesh.material;
      const fading = n.opacity < 0.999;
      if (mat.transparent !== fading) {
        mat.transparent = fading;
        mat.needsUpdate = true;
      }
      mat.opacity = n.opacity;
      if (n.orbitLine) {
        const base = n.body.type === "moon" ? 0.35 : 0.3;
        n.orbitLine.visible = this.orbitsVisible && visible;
        n.orbitLine.material.opacity = base * n.opacity;
      }
    }
  }

  /** Distance from which a body is nicely framed (planet + moons, or the body alone). */
  focusDistance(n: BodyNode): number {
    if (n.body.type === "star") return n.radius * 9;
    if (n.systemRadius > 0 && n.body.type !== "moon") return n.systemRadius * S.FOCUS_DISTANCE_MOON_SYSTEM;
    const ringFactor = n.rings ? 2.4 : 1;
    return n.radius * ringFactor * S.FOCUS_DISTANCE_RADII;
  }

  /** Radius of everything out to the outermost orbit (for the "whole system" view). */
  outerRadius(): number {
    let max = 0;
    for (const n of this.nodes) if (!n.parent && n.orbitRadius > max) max = n.orbitRadius;
    return max;
  }

  worldPosition(n: BodyNode, out = this.tmpV): THREE.Vector3 {
    return out.copy(n.worldPos);
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}
