// Colour is a hidden stat (brief §3). It is expressed ONLY through presentation:
// the whole screen desaturates as it drains. There is deliberately no bar, no
// number, and no text anywhere that reports it.
import Phaser from 'phaser';
import { getState } from '../state/store.js';

export function applyColour(scene) {
  const cam = scene.cameras.main;
  if (scene.renderer.type !== Phaser.WEBGL || !cam.postFX) return null;
  const fx = cam.postFX.addColorMatrix();
  const set = (colour) => {
    fx.reset();
    fx.saturate(-(1 - colour));
    if (colour < 0.9) fx.brightness(0.85 + 0.15 * colour, true);
  };
  set(getState().colour);
  scene.colourFx = { fx, set };
  return scene.colourFx;
}

/** Smoothly re-apply after Colour changes (e.g. the moment Rootvein is used). */
export function tweenColour(scene, from, to, duration = 1500) {
  if (!scene.colourFx) return;
  const o = { v: from };
  scene.tweens.add({ targets: o, v: to, duration, onUpdate: () => scene.colourFx.set(o.v) });
}
