import { txt } from './text.js';
import { sfx } from './sfx.js';

const COLORS = { bg: 0x2b2420, border: 0xe8d8b0, hover: 0x4a3c30, disabled: 0x1c1816, text: '#f4efe1', dim: '#7a7064' };

/**
 * A chunky pixel button. Works with mouse, touch and (via Menu) keyboard.
 * Returns a container with .setEnabled(bool), .setLabel(str), .select(bool).
 */
export function button(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, COLORS.bg).setOrigin(0).setStrokeStyle(1, COLORS.border);
  const t = txt(scene, w / 2, h / 2 + 1, label, { origin: 0.5, align: 'center', wrap: w - 6, size: opts.size || 8 });
  c.add([bg, t]);
  c.setSize(w, h);
  c.enabled = true;
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => c.enabled && bg.setFillStyle(COLORS.hover));
  bg.on('pointerout', () => !c.selected && bg.setFillStyle(c.enabled ? COLORS.bg : COLORS.disabled));
  bg.on('pointerup', () => c.press());
  c.press = () => {
    if (!c.enabled || !c.visible) return;
    sfx('click');
    onClick && onClick();
  };
  c.setEnabled = (on) => {
    c.enabled = on;
    bg.setFillStyle(on ? COLORS.bg : COLORS.disabled);
    t.setColor(on ? COLORS.text : COLORS.dim);
    return c;
  };
  c.setLabel = (s) => {
    t.setText(s);
    return c;
  };
  c.select = (on) => {
    c.selected = on;
    bg.setStrokeStyle(on ? 2 : 1, on ? 0xffd060 : COLORS.border);
    if (c.enabled) bg.setFillStyle(on ? COLORS.hover : COLORS.bg);
  };
  c.label = t;
  c.bg = bg;
  return c;
}

/** Keyboard navigation over a list of buttons (arrows/WASD + Enter/Space). */
export class Menu {
  constructor(scene, buttons, { columns = 1 } = {}) {
    this.scene = scene;
    this.buttons = buttons;
    this.columns = columns;
    this.index = 0;
    this.active = true;
    // Raw DOM events, not Phaser's keyboard plugin: the plugin drops a keydown
    // for a key it believes is still held (e.g. a direction key held in a fight
    // when a modal menu pops up).
    this.handler = (ev) => {
      if (ev.repeat || !this.active || !this.buttons.some((b) => b.visible)) return;
      const key = ev.key;
      if (['ArrowDown', 's', 'S'].includes(key)) this.move(this.columns);
      else if (['ArrowUp', 'w', 'W'].includes(key)) this.move(-this.columns);
      else if (['ArrowRight', 'd', 'D'].includes(key) && this.columns > 1) this.move(1);
      else if (['ArrowLeft', 'a', 'A'].includes(key) && this.columns > 1) this.move(-1);
      else if (key === 'Enter' || key === ' ') this.buttons[this.index]?.press();
    };
    window.addEventListener('keydown', this.handler);
    scene.events.once('shutdown', () => this.destroy());
    this.refresh();
  }
  move(d) {
    const n = this.buttons.length;
    for (let i = 1; i <= n; i++) {
      const j = (((this.index + d * i) % n) + n) % n;
      if (this.buttons[j].enabled && this.buttons[j].visible) {
        this.index = j;
        break;
      }
    }
    this.refresh();
  }
  refresh() {
    if (!this.buttons[this.index]?.enabled) {
      const j = this.buttons.findIndex((b) => b.enabled && b.visible);
      if (j >= 0) this.index = j;
    }
    this.buttons.forEach((b, i) => b.select(i === this.index));
  }
  destroy() {
    this.active = false;
    window.removeEventListener('keydown', this.handler);
  }
}
