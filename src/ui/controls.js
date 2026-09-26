// Unified input for side-scroll encounters: keyboard on desktop plus on-screen
// touch buttons (move, jump, staff, berry) on mobile (brief §8).
import Phaser from 'phaser';
import { txt } from './text.js';

const KEYMAP = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  jump: ['UP', 'W', 'SPACE'],
  staff: ['J', 'Z'],
  b1: ['K', 'X'],
  b2: ['L', 'C'],
  act: ['E', 'DOWN', 'S'],
};

export function isTouchDevice(scene) {
  return scene.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch');
}

export class Controls {
  /** `buttons` picks which touch buttons exist, e.g. { b1: 'FLEET', b2: 'NIMBL', act: 'ACT' }. */
  constructor(scene, buttons = {}) {
    this.scene = scene;
    this.keys = {};
    for (const [action, codes] of Object.entries(KEYMAP)) {
      this.keys[action] = codes.map((c) => scene.input.keyboard.addKey(c, true, false));
    }
    this.touch = {};
    this.prevTouch = {};
    this.justTouched = {};
    this.buttons = {};
    if (isTouchDevice(scene)) this.buildTouch(buttons);
  }

  buildTouch(extra) {
    const s = this.scene;
    s.input.addPointer(3);
    const W = s.scale.width;
    const H = s.scale.height;
    const mk = (action, x, y, w, h, label) => {
      const r = s.add.rectangle(x, y, w, h, 0x000000, 0.28).setScrollFactor(0).setDepth(2000).setStrokeStyle(1, 0xffffff, 0.5);
      const t = txt(s, x, y + 1, label, { origin: 0.5, color: '#ffffffcc' }).setScrollFactor(0).setDepth(2001);
      r.setInteractive();
      const down = () => {
        this.touch[action] = true;
        r.setFillStyle(0xffffff, 0.3);
      };
      const up = () => {
        this.touch[action] = false;
        r.setFillStyle(0x000000, 0.28);
      };
      r.on('pointerdown', down);
      r.on('pointerup', up);
      r.on('pointerout', up);
      this.buttons[action] = { r, t };
    };
    const B = 30;
    mk('left', 22, H - 22, B, B, '<');
    mk('right', 58, H - 22, B, B, '>');
    mk('jump', W - 22, H - 22, B, B, 'JMP');
    mk('staff', W - 58, H - 22, B, B, 'STF');
    if (extra.b1) mk('b1', W - 94, H - 22, B, B, extra.b1);
    if (extra.b2) mk('b2', W - 94, H - 56, B, B, extra.b2);
    if (extra.act) mk('act', W - 58, H - 56, B, B, extra.act);
  }

  setVisible(on) {
    for (const b of Object.values(this.buttons)) {
      b.r.setVisible(on);
      b.t.setVisible(on);
    }
  }

  /** Call once per frame before reading justDown. */
  update() {
    for (const a of Object.keys(KEYMAP)) {
      const touched = !!this.touch[a] && !this.prevTouch[a];
      this.prevTouch[a] = !!this.touch[a];
      // JustDown consumes each key's flag, so evaluate every key every frame.
      const keyed = this.keys[a].map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean);
      this.justTouched[a] = touched || keyed;
    }
  }

  isDown(action) {
    return !!this.touch[action] || this.keys[action].some((k) => k.isDown);
  }

  justDown(action) {
    return !!this.justTouched[action];
  }
}
