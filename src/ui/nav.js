// Scene switching that also swaps the canvas between portrait (trail/story)
// and landscape (side-scroll encounters) native resolutions.
import { PORTRAIT, LANDSCAPE } from '../config.js';
import { wantOrientation } from './orientation.js';

export const LANDSCAPE_SCENES = new Set(['Forage', 'Chase', 'Skirmish', 'Protect']);

/**
 * A scene may leave exactly once. Returns false if it is already leaving
 * (e.g. the player mashed Enter on the last line). Cleared on shutdown, since
 * Phaser reuses scene instances.
 */
export function claimExit(scene) {
  if (scene.__leaving) return false;
  scene.__leaving = true;
  scene.events.once('shutdown', () => (scene.__leaving = false));
  return true;
}

export function goto(scene, key, data) {
  if (!claimExit(scene)) return;
  const land = LANDSCAPE_SCENES.has(key);
  const size = land ? LANDSCAPE : PORTRAIT;
  wantOrientation(land ? 'landscape' : 'portrait');
  const go = () => {
    if (scene.scale.width !== size.width || scene.scale.height !== size.height) {
      scene.scale.setGameSize(size.width, size.height);
    }
    scene.scene.start(key, data);
  };
  const cam = scene.cameras.main;
  if (!cam) return go();
  cam.fadeOut(180, 0, 0, 0);
  cam.once('camerafadeoutcomplete', go);
}
