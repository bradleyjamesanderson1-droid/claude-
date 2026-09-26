import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { addBackdrop } from '../ui/backdrop.js';
import { applyColour } from '../ui/colour.js';
import { sfx } from '../ui/sfx.js';
import { SCRIPTS, SPEAKERS, BG_NAMES, FRIEND_NAME } from '../data/script.js';
import { COMPANIONS } from '../data/companions.js';
import { resolveVulnerable } from '../data/vulnerable.js';
import { getState, save } from '../state/store.js';
import { join, spend, restore, addBerries } from '../state/ledger.js';
import { Director } from '../flow.js';
import { SPRITES } from '../art/manifest.js';

const STAGE_H = 216;
const COLD_BELOW = 0.7; // hidden Colour threshold where warm lines turn cold

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  init(data) {
    this.scriptId = data.script;
    this.auto = !!data.auto;
    this.onDone = data.onDone || 'step';
    // Scene instances are reused by Phaser: reset per-run flags.
    this.finished = false;
    this.choosing = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = getState();
    this.vulnId = resolveVulnerable(s);
    this.vulnName = this.vulnId ? SPEAKERS[this.vulnId] || COMPANIONS[this.vulnId]?.name : 'the little one';
    applyColour(this);
    this.cameras.main.fadeIn(250);

    this.stage = this.add.container(0, 0);
    this.actors = {};
    this.add.rectangle(0, STAGE_H, W, H - STAGE_H, 0x1a1410).setOrigin(0).setDepth(5);
    this.add.rectangle(4, STAGE_H + 6, W - 8, H - STAGE_H - 12, 0x241c18).setOrigin(0).setStrokeStyle(1, 0xe8d8b0).setDepth(5);
    this.nameText = txt(this, 12, STAGE_H + 14, '', { color: '#ffd060' }).setDepth(6);
    this.bodyText = txt(this, 12, STAGE_H + 30, '', { wrap: W - 24, lineSpacing: 5 }).setDepth(6);
    this.placeText = txt(this, 6, 6, '', { color: '#f4efe1', stroke: '#1a1410' }).setDepth(6);
    this.more = txt(this, W - 16, H - 18, '▼', { color: '#ffd060' }).setDepth(6).setVisible(false);
    this.tweens.add({ targets: this.more, y: H - 15, yoyo: true, repeat: -1, duration: 400 });

    if (this.auto) {
      const skip = txt(this, W - 6, 6, 'SKIP ▶', { origin: [1, 0], color: '#ffd060', stroke: '#1a1410' }).setDepth(7);
      skip.setInteractive({ useHandCursor: true }).on('pointerup', (p, x, y, e) => {
        e?.stopPropagation?.();
        this.finish();
      });
      this.input.keyboard.on('keydown-ESC', () => this.finish());
    }

    this.cmds = [...SCRIPTS[this.scriptId]];
    this.i = 0;
    this.waiting = false;
    this.typing = null;
    this.choosing = false;

    this.input.on('pointerup', () => this.advance());
    this.input.keyboard.on('keydown', (e) => {
      if (['Enter', ' ', 'z', 'Z', 'e', 'E'].includes(e.key)) this.advance();
    });

    this.next();
  }

  fmt(str) {
    return str.replaceAll('{V}', this.vulnName).replaceAll('{FRIEND}', FRIEND_NAME);
  }

  speakerId(id) {
    return id === '{VID}' ? this.vulnId : id;
  }

  setBg(key) {
    this.bg?.layers.forEach((l) => l.destroy());
    this.ground?.destroy();
    this.bg = addBackdrop(this, key, { y: 0, height: STAGE_H, scroll: false });
    this.ground = this.add.tileSprite(0, STAGE_H - 16, this.scale.width, 16, `ground-${key in BG_NAMES ? key : 'forest'}`).setOrigin(0).setDepth(-5);
    this.placeText.setText(BG_NAMES[key] || '');
  }

  show(ids) {
    for (const a of Object.values(this.actors)) a.destroy();
    this.actors = {};
    const list = ids.map((id) => this.speakerId(id)).filter((id) => id && SPRITES[id]);
    const W = this.scale.width;
    const gap = W / (list.length + 1);
    list.forEach((id, n) => {
      const x = Math.round(gap * (n + 1));
      const spr = this.add.sprite(x, STAGE_H - 32, id).setScale(2).setOrigin(0.5, 0);
      spr.play(`${id}-idle`);
      // Face the middle of the stage.
      if (x > W / 2) spr.setFlipX(true);
      if (id === 'ashfang') spr.setScale(3).setY(STAGE_H - 48);
      this.actors[id] = spr;
    });
  }

  highlight(speaker) {
    for (const [id, spr] of Object.entries(this.actors)) {
      spr.setAlpha(!speaker || id === speaker ? 1 : 0.55);
    }
    const a = this.actors[speaker];
    if (a) this.tweens.add({ targets: a, y: a.y - 3, yoyo: true, duration: 120 });
  }

  say(speaker, text) {
    const name = speaker ? SPEAKERS[speaker] || COMPANIONS[speaker]?.name || speaker : '';
    this.nameText.setText(name);
    this.highlight(speaker);
    const full = this.fmt(text);
    this.bodyText.setColor(speaker ? '#f4efe1' : '#d8cbb0');
    this.bodyText.setText('');
    let n = 0;
    this.waiting = true;
    this.more.setVisible(false);
    this.typing = this.time.addEvent({
      delay: 22,
      repeat: full.length - 1,
      callback: () => {
        n += 1;
        this.bodyText.setText(full.slice(0, n));
        if (n >= full.length) this.doneTyping();
      },
    });
    this.fullText = full;
  }

  doneTyping() {
    this.typing?.remove();
    this.typing = null;
    this.bodyText.setText(this.fullText);
    this.more.setVisible(!this.auto);
    if (this.auto) this.autoTimer = this.time.delayedCall(1600 + this.fullText.length * 25, () => this.advance(true));
  }

  advance(fromTimer = false) {
    if (this.choosing || this.finished) return;
    if (this.auto && !fromTimer) return; // cold open is non-interactive (skip button only)
    if (this.typing) return this.doneTyping();
    if (this.waiting) {
      this.waiting = false;
      this.next();
    }
  }

  applyEffects(fx = {}) {
    const s = getState();
    if (fx.food) s.food = Math.max(0, s.food + fx.food);
    if (fx.berries) addBerries(s, fx.berries);
    for (const [id, d] of Object.entries(fx.stamina || {})) {
      if (d < 0) spend(s, id, -d);
      else restore(s, id, d);
    }
    save();
  }

  choice(options) {
    this.choosing = true;
    this.nameText.setText('');
    this.bodyText.setText('');
    this.more.setVisible(false);
    const W = this.scale.width;
    const btns = options.map((opt, n) =>
      button(this, 14, STAGE_H + 26 + n * 40, W - 28, 32, opt.label, () => {
        btns.forEach((b) => b.destroy());
        menu.destroy();
        const s = getState();
        if (opt.flag) s.flags[opt.flag] = opt.value;
        this.applyEffects(opt.effects);
        this.cmds.splice(this.i, 0, ...(opt.then || []));
        // Let this click finish before the dialogue listens again.
        this.time.delayedCall(50, () => {
          this.choosing = false;
          this.next();
        });
      }).setDepth(8),
    );
    const menu = new Menu(this, btns);
  }

  next() {
    const s = getState();
    while (this.i < this.cmds.length) {
      const c = this.cmds[this.i++];
      if (c.bg) this.setBg(c.bg);
      if (c.show) this.show(c.show);
      if (c.join) {
        join(s, c.join);
        save();
      }
      if (c.effects) this.applyEffects(c.effects);
      if (c.fx === 'shake') this.cameras.main.shake(300, 0.01);
      if (c.fx === 'flash') this.cameras.main.flash(300);
      if (c.fx === 'fade') {
        this.cameras.main.fadeOut(1200);
        this.time.delayedCall(1300, () => this.finish());
        return;
      }
      if (c.eat) {
        for (const id of c.eat) {
          // The tell inverted: after Rootvein, Rusty no longer eats.
          if (id === 'rusty' && s.rootveinUsed) continue;
          this.actors[id]?.play(`${id}-eat`);
          sfx('eat');
        }
      }
      if (c.choice) return this.choice(c.choice);
      const text = c.t ?? (c.warm ? (s.colour < COLD_BELOW ? c.cold : c.warm) : null);
      if (text) return this.say(this.speakerId(c.s), text);
    }
    this.finish();
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.onDone === 'coldopen') return Director.coldOpenDone(this);
    if (this.onDone === 'ending') return Director.toEnding(this);
    Director.complete(this);
  }
}
