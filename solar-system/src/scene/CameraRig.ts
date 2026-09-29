/**
 * OrbitControls plus animated "fly to" transitions and body following.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as S from "../config/scale.ts";
import type { BodyNode, SolarSystem } from "./SolarSystem.ts";

interface Flight {
  elapsed: number;
  duration: number;
  fromTarget: THREE.Vector3;
  fromDist: number;
  fromDir: THREE.Vector3;
  toDir: THREE.Vector3;
  /** null = the whole-system view (target at the Sun). */
  node: BodyNode | null;
}

export class CameraRig {
  readonly controls: OrbitControls;
  /** The body the camera is following (null = free / system view). */
  follow: BodyNode | null = null;
  private flight: Flight | null = null;
  private readonly lastFollowPos = new THREE.Vector3();
  private lastFocusDist = 0;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    dom: HTMLElement,
    private readonly system: SolarSystem,
  ) {
    const c = new OrbitControls(camera, dom);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.rotateSpeed = 0.6;
    c.zoomSpeed = 1.1;
    c.panSpeed = 0.8;
    c.screenSpacePanning = true;
    c.maxDistance = 4000;
    c.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    c.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" };
    // The user grabbing the controls cancels any flight in progress.
    c.addEventListener("start", () => {
      if (this.flight) this.finishFlight(false);
    });
    this.controls = c;
    this.snapToSystem();
  }

  get flying(): boolean {
    return this.flight !== null;
  }

  private systemViewDistance(): number {
    const r = this.system.outerRadius() * 1.08;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    // Fit the orbit disc (seen at an angle) in whichever dimension is tighter.
    return r / Math.tan(Math.min(vFov, hFov) / 2) * 0.82;
  }

  private systemDir(): THREE.Vector3 {
    const el = THREE.MathUtils.degToRad(S.SYSTEM_VIEW_ELEVATION_DEG);
    return new THREE.Vector3(0.35 * Math.cos(el), Math.sin(el), Math.cos(el)).normalize();
  }

  snapToSystem() {
    this.flight = null;
    this.follow = null;
    this.controls.target.set(0, 0, 0);
    this.camera.position.copy(this.systemDir().multiplyScalar(this.systemViewDistance()));
    this.controls.update();
  }

  flyTo(node: BodyNode | null) {
    const target = this.controls.target.clone();
    const offset = this.camera.position.clone().sub(target);
    const fromDist = offset.length();
    const fromDir = offset.normalize();
    let toDir: THREE.Vector3;
    if (node === null) {
      toDir = this.systemDir();
    } else {
      // Keep the current viewing direction but make sure we're looking a bit down on the orbit plane.
      toDir = fromDir.clone();
      if (toDir.y < 0.3) {
        toDir.y = 0.3;
        toDir.normalize();
      }
    }
    const duration = this.reducedMotion.matches ? S.FOCUS_FLIGHT_SECONDS_REDUCED : S.FOCUS_FLIGHT_SECONDS;
    this.follow = null;
    this.flight = { elapsed: 0, duration, fromTarget: target, fromDist, fromDir, toDir, node };
    if (duration <= 0) this.step(0);
  }

  private flightGoal(node: BodyNode | null): { target: THREE.Vector3; dist: number } {
    if (!node) return { target: new THREE.Vector3(), dist: this.systemViewDistance() };
    return { target: node.worldPos.clone(), dist: this.focusDistance(node) };
  }

  private finishFlight(arrived: boolean) {
    const f = this.flight;
    this.flight = null;
    if (!f) return;
    // Even when interrupted, keep following the body we were heading to.
    this.follow = f.node;
    if (f.node) {
      this.lastFollowPos.copy(f.node.worldPos);
      this.lastFocusDist = this.focusDistance(f.node);
      if (!arrived) {
        // Interrupted mid-flight: re-centre on the body, keeping the current camera distance.
        const off = this.camera.position.clone().sub(this.controls.target);
        this.controls.target.copy(f.node.worldPos);
        this.camera.position.copy(f.node.worldPos).add(off);
      }
    }
  }

  /** Call once per frame after the solar system has been updated. */
  step(dt: number) {
    const f = this.flight;
    if (f) {
      f.elapsed += dt;
      const t = f.duration <= 0 ? 1 : Math.min(1, f.elapsed / f.duration);
      const e = S.easeInOutCubic(t);
      const goal = this.flightGoal(f.node);
      const target = f.fromTarget.clone().lerp(goal.target, e);
      const dist = S.logLerp(f.fromDist, goal.dist, e);
      const q = new THREE.Quaternion().setFromUnitVectors(f.fromDir, f.toDir);
      const dir = f.fromDir.clone().applyQuaternion(new THREE.Quaternion().slerp(q, e));
      this.controls.target.copy(target);
      this.camera.position.copy(target).addScaledVector(dir, dist);
      this.camera.lookAt(target);
      this.updateLimits();
      if (t >= 1) this.finishFlight(true);
      this.controls.update();
      return;
    }

    if (this.follow) {
      // Ride along with the body; and if its size changes (true-scale morph), keep the framing.
      const n = this.follow;
      const delta = n.worldPos.clone().sub(this.lastFollowPos);
      this.camera.position.add(delta);
      this.controls.target.add(delta);
      this.lastFollowPos.copy(n.worldPos);
      const fd = this.focusDistance(n);
      if (this.lastFocusDist > 0 && Math.abs(fd / this.lastFocusDist - 1) > 1e-6) {
        const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(fd / this.lastFocusDist);
        this.camera.position.copy(this.controls.target).add(off);
      }
      this.lastFocusDist = fd;
    }
    this.updateLimits();
    this.controls.update();
  }

  /** Framing distance, backed off on portrait screens so the body fits the narrow width. */
  private focusDistance(n: BodyNode): number {
    const vHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const hHalf = vHalf * this.camera.aspect;
    return this.system.focusDistance(n) * Math.max(1, (vHalf / hHalf) * 0.8);
  }

  private updateLimits() {
    const n = this.follow ?? this.flight?.node ?? null;
    const ref = n ?? this.system.sun;
    this.controls.minDistance = Math.max(1e-6, ref.renderRadius * 1.35);
    this.controls.maxDistance = Math.max(4000, this.systemViewDistance() * 2.5);
  }
}
