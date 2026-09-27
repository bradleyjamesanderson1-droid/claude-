import { FONT } from '../config.js';

/** Pixel-font text. Sizes should stay multiples of 8 for crisp glyphs. */
export function txt(scene, x, y, str, opts = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${opts.size || 8}px`,
    color: opts.color || '#f4efe1',
    align: opts.align || 'left',
    lineSpacing: opts.lineSpacing ?? 3,
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    stroke: opts.stroke,
    strokeThickness: opts.stroke ? 2 : 0,
  });
  if (opts.origin !== undefined) t.setOrigin(...[].concat(opts.origin));
  return t;
}

/** A floating "-12" style cost marker: the ledger made visible. */
export function floatText(scene, x, y, str, color = '#ff8a7a') {
  const t = txt(scene, x, y, str, { color, stroke: '#1a1410', origin: 0.5 });
  t.setDepth(1000);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  return t;
}
