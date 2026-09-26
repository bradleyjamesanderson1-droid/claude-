import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { getState } from '../state/store.js';
import { LANDMARKS } from '../data/landmarks.js';
import { Director } from '../flow.js';
import { applyColour } from '../ui/colour.js';

/** Chapter title card shown on arrival at each landmark. */
export default class CardScene extends Phaser.Scene {
  constructor() {
    super('Card');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = getState();
    const lm = LANDMARKS[s.landmark];
    applyColour(this);
    this.cameras.main.fadeIn(400);
    txt(this, W / 2, H / 2 - 50, `Landmark ${s.landmark + 1} of ${LANDMARKS.length}`, { origin: 0.5, color: '#a89a84' });
    txt(this, W / 2, H / 2 - 30, `Chapter ${lm.chapter}`, { origin: 0.5, color: '#a89a84' });
    txt(this, W / 2, H / 2, lm.name, { origin: 0.5, size: 8, wrap: W - 20, align: 'center', color: '#ffe6a8' });
    if (lm.subtitle) txt(this, W / 2, H / 2 + 22, lm.subtitle, { origin: 0.5, color: '#d8cbb0' });
    txt(this, W / 2, H / 2 + 26 + 40, `Day ${s.day}`, { origin: 0.5, color: '#7a7064' });
    const hint = txt(this, W / 2, H - 40, 'tap / press Enter', { origin: 0.5, color: '#7a7064' });
    this.tweens.add({ targets: hint, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      Director.cardSeen(this);
    };
    this.time.delayedCall(400, () => {
      this.input.once('pointerup', go);
      this.input.keyboard.once('keydown', go);
    });
  }
}
