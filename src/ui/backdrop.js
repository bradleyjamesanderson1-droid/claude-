import { BACKDROPS } from '../art/placeholders.js';

/**
 * Three-layer parallax backdrop (sky / far trees / near trees) in a band of the
 * screen. Returns the layers so encounters can scroll them.
 */
export function addBackdrop(scene, key, { x = 0, y = 0, width, height = 216, scroll = true } = {}) {
  const k = BACKDROPS[key] ? key : 'forest';
  const w = width ?? scene.scale.width;
  const layers = ['sky', 'far', 'near'].map((l, i) => {
    const ts = scene.add.tileSprite(x, y, w, height, `bg-${k}-${l}`).setOrigin(0).setDepth(-10 + i);
    ts.tilePositionY = 216 - height; // keep the ground line at the bottom of the band
    if (scroll) ts.setScrollFactor(0);
    ts.parallax = [0.1, 0.35, 0.7][i];
    return ts;
  });
  return {
    layers,
    scrollTo(camX) {
      for (const l of layers) l.tilePositionX = camX * l.parallax;
    },
  };
}
