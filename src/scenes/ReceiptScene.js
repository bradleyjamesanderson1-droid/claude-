import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { applyColour } from '../ui/colour.js';
import { resolveCollapses } from '../ui/collapse.js';
import { sfx } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { getState, save } from '../state/store.js';
import { ravenousEat, addBerries } from '../state/ledger.js';
import { COMPANIONS, BERRY_INFO } from '../data/companions.js';
import { Director } from '../flow.js';

/**
 * The on-screen receipt after an encounter. Whoever drew on a berry now eats,
 * visibly and ravenously (brief §3: "the Luffy tell").
 */
export default class ReceiptScene extends Phaser.Scene {
  constructor() {
    super('Receipt');
  }

  init(data) {
    this.result = data.result;
    this.leaving = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = getState();
    const r = this.result;
    applyColour(this);
    this.cameras.main.fadeIn(250);
    playMusic(s.rootveinUsed ? null : 'story');

    txt(this, W / 2, 14, r.title || 'After', { origin: 0.5, color: '#ffe6a8' });
    txt(this, W / 2, 28, 'THE LEDGER', { origin: 0.5, color: '#a89a84' });

    // Found items come in first.
    if (r.found) {
      if (r.found.food) s.food += r.found.food;
      addBerries(s, r.found.berries || {});
    }

    const lines = [];
    for (const [id, amt] of Object.entries(r.spent || {})) {
      if (amt > 0) lines.push(`${COMPANIONS[id].name}: -${Math.round(amt)} stamina`);
    }
    for (const [type, n] of Object.entries(r.drawn || {})) {
      if (n > 0) lines.push(`${BERRY_INFO[type].name} drawn: ${n}`);
    }
    if (r.found?.food) lines.push(`Food found: +${r.found.food}`);
    for (const [type, n] of Object.entries(r.found?.berries || {})) if (n > 0) lines.push(`${BERRY_INFO[type].name} found: +${n}`);
    if (!lines.length) lines.push('Nothing spent. Nothing gained.');
    txt(this, 12, 44, lines.join('\n'), { wrap: W - 24, lineSpacing: 4 });

    // The receipt: eaters eat.
    const eaters = [...new Set(r.eaters || [])];
    const receipt = ravenousEat(s, eaters);
    save();
    const y0 = 60 + lines.length * 12 + 10;
    receipt.forEach((e, n) => {
      const y = y0 + n * 40;
      const spr = this.add.sprite(28, y + 14, e.id).setScale(2);
      const name = COMPANIONS[e.id].name;
      let msg;
      if (e.notHungry) {
        spr.play(`${e.id}-idle`);
        msg = `${name} isn't hungry.`;
      } else if (e.ate === 0) {
        spr.play(`${e.id}-idle`);
        msg = `${name} is starving, but there's nothing left to eat.`;
      } else {
        this.time.delayedCall(300 + n * 500, () => {
          spr.play(`${e.id}-eat`);
          sfx('eat');
        });
        msg = `${name} eats ravenously. -${e.ate} food, +${e.gained} stamina.`;
      }
      txt(this, 52, y + 4, msg, { wrap: W - 60, color: e.notHungry ? '#b0b0b0' : '#a8f0a0' });
    });

    txt(this, 12, H - 60, `Food left: ${s.food}`, { color: '#d8cbb0' });
    const btn = button(this, W / 2 - 60, H - 40, 120, 24, 'Continue', () => {
      if (this.leaving) return;
      this.leaving = true;
      menu.destroy();
      resolveCollapses(this, () => Director.complete(this));
    });
    const menu = new Menu(this, [btn]);
  }
}
