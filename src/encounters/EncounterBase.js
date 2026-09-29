// Shared machinery for the 60–90s side-scroll encounters (brief §6):
// Rusty's movement, staff, berry draw / stack / drain, damage, HUD and the
// hand-off of an honest ledger to the Receipt screen.

import Phaser from 'phaser';
import { BALANCE } from '../config.js';
import { txt, floatText } from '../ui/text.js';
import { Controls } from '../ui/controls.js';
import { addBackdrop } from '../ui/backdrop.js';
import { applyColour } from '../ui/colour.js';
import { staminaColor } from '../ui/partyPanel.js';
import { sfx } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { getState, save } from '../state/store.js';
import { drawCost, drainRate, takeBerry, spend, maxStamina, STATUS } from '../state/ledger.js';
import { Director } from '../flow.js';

export const GROUND_Y = 196;

export default class EncounterBase extends Phaser.Scene {
  init(config) {
    this.cfg = config || {};
    this.state = getState();
    this.ended = false;
    this.elapsed = 0;
    this.activeBerries = {}; // type -> seconds remaining
    this.drawn = {};
    this.eaters = new Set();
    this.found = { food: 0, berries: {} };
    this.invuln = 0;
    this.staffCd = 0;
    this.paused = false;
    // Scene instances are reused by Phaser: reset every per-run flag.
    this.modal = false;
    this.rootveinActive = false;
    this.winning = false;
    this.knocks = 0;
    this.engaged = false;
    this.hurtAnim = 0;
    this.ducking = false;
    this.attackAnim = 0;
    this.startStamina = {};
    for (const [id, m] of Object.entries(this.state.party)) this.startStamina[id] = m.stamina;
  }

  // ---- setup -------------------------------------------------------------------

  /** Subclasses call this first in create(). */
  setupWorld({ width, bg, berries = true, staff = true, act = false, music = 'skirmish' }) {
    playMusic(music);
    const H = this.scale.height;
    this.worldW = width;
    this.canBerry = berries && !!this.state.flags.berrycraft;
    this.canStaff = staff;
    applyColour(this);
    this.cameras.main.fadeIn(250);
    this.physics.world.setBounds(0, 0, width, H + 100);
    this.cameras.main.setBounds(0, 0, width, H);

    this.backdrop = addBackdrop(this, bg, { height: H });
    this.add.tileSprite(0, GROUND_Y, width, H - GROUND_Y, `ground-${bg}`).setOrigin(0).setDepth(-2);
    this.ground = this.add.rectangle(width / 2, GROUND_Y + 10, width, 20);
    this.physics.add.existing(this.ground, true);

    this.player = this.physics.add.sprite(60, GROUND_Y - 20, 'rusty').setScale(2).setDepth(10);
    this.player.body.setSize(10, 14).setOffset(3, 2);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.ground);
    this.player.play('rusty-idle');
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15, 0, 20);

    const buttons = {};
    if (this.canBerry) {
      buttons.b1 = 'FLT';
      buttons.b2 = 'NMB';
    }
    if (act) buttons.act = 'ACT';
    this.controls = new Controls(this, buttons);
    if (!this.canStaff) this.controls.buttons.staff?.r.setVisible(false), this.controls.buttons.staff?.t.setVisible(false);

    this.buildHud();
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
  }

  buildHud() {
    const W = this.scale.width;
    const fix = (o) => o.setScrollFactor(0).setDepth(1500);
    fix(this.add.rectangle(0, 0, W, 30, 0x000000, 0.35).setOrigin(0));
    fix(txt(this, 6, 5, 'Rusty', { color: '#ffd060' }));
    this.hudBarBg = fix(this.add.rectangle(52, 5, 100, 8, 0x3a302a).setOrigin(0));
    this.hudBar = fix(this.add.rectangle(52, 5, 100, 8, 0x7bd36a).setOrigin(0));
    this.hudStam = fix(txt(this, 156, 5, ''));
    this.hudBerries = fix(txt(this, 6, 18, '', { color: '#d8cbb0' }));
    this.hudTimer = fix(txt(this, W - 6, 5, '', { origin: [1, 0] }));
    this.hudObjective = fix(txt(this, W / 2, 36, '', { origin: [0.5, 0], align: 'center', wrap: W - 40, stroke: '#1a1410', color: '#ffe6a8' }));
    this.pausedText = fix(txt(this, W / 2, 100, 'PAUSED\n\nP / Esc to resume', { origin: 0.5, align: 'center', stroke: '#1a1410' })).setVisible(false);
  }

  banner(title, sub) {
    const W = this.scale.width;
    const t1 = txt(this, W / 2, 80, title, { origin: 0.5, size: 8, stroke: '#1a1410', color: '#ffe6a8' }).setScrollFactor(0).setDepth(1600);
    const t2 = sub ? txt(this, W / 2, 96, sub, { origin: 0.5, align: 'center', wrap: W - 40, stroke: '#1a1410' }).setScrollFactor(0).setDepth(1600) : null;
    this.tweens.add({ targets: [t1, t2].filter(Boolean), alpha: 0, delay: 2600, duration: 600, onComplete: () => (t1.destroy(), t2?.destroy()) });
  }

  objective(str) {
    this.hudObjective.setText(str || '');
  }

  togglePause() {
    if (this.ended || this.modal) return;
    this.paused = !this.paused;
    this.pausedText.setVisible(this.paused);
    if (this.paused) this.physics.pause();
    else this.physics.resume();
  }

  // ---- berries -----------------------------------------------------------------

  activeCount() {
    return Object.keys(this.activeBerries).length;
  }

  has(type) {
    return !!this.activeBerries[type];
  }

  stacked() {
    return this.activeCount() >= 2;
  }

  drawBerry(type) {
    if (!this.canBerry || this.has(type) || this.rootveinActive) return;
    if ((this.state.pouch[type] || 0) <= 0) {
      floatText(this, this.player.x, this.player.y - 26, `No ${type}!`, '#d8cbb0');
      return;
    }
    const cost = drawCost(type, this.activeCount() >= 1);
    takeBerry(this.state, type);
    this.activeBerries[type] = BALANCE.berries[type].duration;
    this.drawn[type] = (this.drawn[type] || 0) + 1;
    this.eaters.add('rusty');
    sfx('draw');
    floatText(this, this.player.x, this.player.y - 26, `-${cost}`);
    if (this.activeCount() >= 2) {
      this.cameras.main.shake(150, 0.004);
      floatText(this, this.player.x, this.player.y - 40, 'STACKED', '#ffd060');
    }
    this.hurtRusty(cost, { noKnock: true, cost: true });
    this.onBerryDrawn?.(type);
  }

  tickBerries(dt) {
    const n = this.activeCount();
    let drain = 0;
    for (const type of Object.keys(this.activeBerries)) {
      drain += drainRate(type, n) * dt;
      this.activeBerries[type] -= dt;
      if (this.activeBerries[type] <= 0) delete this.activeBerries[type];
    }
    if (drain > 0) this.hurtRusty(drain, { noKnock: true, cost: true });
    // Tint shows berry state: fleet blue-ish, nimble green-ish, stacked gold.
    if (this.rootveinActive) return;
    if (this.stacked()) this.player.setTint(0xffe08a);
    else if (this.has('fleet')) this.player.setTint(0xbfe8ff);
    else if (this.has('nimble')) this.player.setTint(0xd8ffc0);
    else this.player.clearTint();
  }

  // ---- Rusty -------------------------------------------------------------------

  /** All stamina loss funnels through here so the ledger stays honest. */
  hurtRusty(amount, { noKnock = false, from = null, cost = false } = {}) {
    if (this.ended) return;
    if (!cost) {
      if (this.invuln > 0 || this.rootveinActive) return;
      if (this.has('nimble')) amount *= BALANCE.skirmish.nimbleHitFactor;
      this.invuln = 0.9;
      sfx('hit');
      floatText(this, this.player.x, this.player.y - 26, `-${Math.round(amount)}`);
      this.player.play('rusty-hurt');
      this.hurtAnim = 0.3;
      if (!noKnock) {
        const dir = from ? Math.sign(this.player.x - from.x) || 1 : -1;
        this.player.setVelocity(dir * 140, -140);
      }
      this.cameras.main.shake(100, 0.006);
    }
    spend(this.state, 'rusty', amount);
    if (this.state.party.rusty.stamina <= 0) this.onRustyDown();
  }

  onRustyDown() {
    if (this.ended) return;
    sfx('collapse');
    this.player.play('rusty-down');
    this.finish({ rustyDown: true });
  }

  staffPower() {
    let p = BALANCE.skirmish.staffKnock;
    if (this.has('fleet')) p *= 1.15;
    if (this.stacked()) p *= BALANCE.skirmish.stackPowerMult;
    if (this.rootveinActive) p *= 3;
    return p;
  }

  /** Staff swing: deflect and knock back — never kill (brief §2, §6). */
  swingStaff() {
    if (!this.canStaff || this.staffCd > 0) return;
    this.staffCd = 0.32;
    this.attackAnim = 0.18;
    this.player.play('rusty-attack');
    sfx('staff');
    const dir = this.player.flipX ? -1 : 1;
    const hx = this.player.x + dir * 20;
    const sw = this.add.image(hx, this.player.y, 'swoosh').setScale(2).setDepth(11).setFlipX(dir < 0).setAlpha(0.9);
    if (this.rootveinActive) sw.setTint(0x6a4a5a);
    this.tweens.add({ targets: sw, alpha: 0, duration: 180, onComplete: () => sw.destroy() });
    const zone = new Phaser.Geom.Rectangle(hx - 16, this.player.y - 20, 32, 40);
    this.onStaff?.(zone, dir, this.staffPower());
  }

  /** Rusty's physics body as a rectangle: hits are judged on this, not the sprite. */
  playerRect() {
    const b = this.player.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  updatePlayer(dt) {
    const c = this.controls;
    const p = this.player;
    const onGround = p.body.blocked.down || p.body.touching.down;
    let speed = 100;
    if (this.has('fleet')) speed *= BALANCE.skirmish.fleetSpeedMult;
    if (this.stacked()) speed *= 1.25;
    if (this.rootveinActive) speed *= 1.4;
    const hurtLock = this.hurtAnim > 0 && this.invuln > 0.6;
    if (!hurtLock) {
      if (c.isDown('left')) {
        p.setVelocityX(-speed);
        p.setFlipX(true);
      } else if (c.isDown('right')) {
        p.setVelocityX(speed);
        p.setFlipX(false);
      } else p.setVelocityX(p.body.velocity.x * 0.7);
    }
    // Duck: crouch low under swoops. Shrinks the body so a head-height attack
    // passes over. Can't duck in the air, and moving while crouched is slower.
    const wantDuck = c.isDown('duck') && onGround && !this.ended;
    if (wantDuck !== !!this.ducking) {
      this.ducking = wantDuck;
      if (wantDuck) p.body.setSize(10, 7).setOffset(3, 9);
      else p.body.setSize(10, 14).setOffset(3, 2);
    }
    if (this.ducking) p.setVelocityX(p.body.velocity.x * 0.5);
    if (c.justDown('jump') && onGround && !this.ducking) {
      let jv = -300;
      if (this.has('nimble')) jv *= BALANCE.skirmish.nimbleJumpMult;
      p.setVelocityY(jv);
      sfx('jump');
    }
    if (c.justDown('staff')) this.swingStaff();
    if (c.justDown('b1')) this.drawBerry('fleet');
    if (c.justDown('b2')) this.drawBerry('nimble');

    this.staffCd -= dt;
    this.invuln -= dt;
    this.hurtAnim = (this.hurtAnim || 0) - dt;
    this.attackAnim = (this.attackAnim || 0) - dt;
    if (this.invuln > 0) p.setAlpha(Math.floor(this.invuln * 12) % 2 ? 0.4 : 1);
    else p.setAlpha(1);

    if (this.hurtAnim <= 0 && this.attackAnim <= 0 && !this.ended) {
      const anim = this.ducking ? 'rusty-duck' : !onGround ? 'rusty-jump' : Math.abs(p.body.velocity.x) > 10 ? 'rusty-run' : 'rusty-idle';
      if (p.anims.currentAnim?.key !== anim) p.play(anim);
    }
  }

  updateHud() {
    const s = this.state.party.rusty;
    const frac = s.stamina / maxStamina('rusty');
    this.hudBar.width = Math.max(0, 100 * frac);
    this.hudBar.setFillStyle(staminaColor(frac));
    this.hudStam.setText(`${Math.ceil(s.stamina)}`);
    if (this.canBerry) {
      const act = Object.entries(this.activeBerries)
        .map(([t, left]) => `${t === 'fleet' ? 'FLT' : 'NMB'}${Math.ceil(left)}s`)
        .join(' ');
      this.hudBerries.setText(`Fleet ${this.state.pouch.fleet}  Nimble ${this.state.pouch.nimble}  ${act}${this.stacked() ? ' STACK' : ''}`);
    }
    if (this.cfg.duration) this.hudTimer.setText(`${Math.max(0, Math.ceil(this.cfg.duration - this.elapsed))}s`);
  }

  // ---- loop --------------------------------------------------------------------

  update(_, deltaMs) {
    this.controls.update();
    if (this.paused || this.modal) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    if (!this.ended) {
      this.elapsed += dt;
      this.updatePlayer(dt);
      this.tickBerries(dt);
      this.tick?.(dt);
    }
    this.backdrop.scrollTo(this.cameras.main.scrollX);
    this.updateHud();
  }

  // ---- end ---------------------------------------------------------------------

  /** Build the honest ledger for the Receipt screen and hand off. */
  finish(extra = {}) {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    const spent = {};
    for (const [id, m] of Object.entries(this.state.party)) {
      const d = (this.startStamina[id] ?? m.stamina) - m.stamina;
      if (d > 0.5) spent[id] = d;
    }
    const result = {
      title: this.cfg.title,
      spent,
      drawn: this.drawn,
      eaters: [...this.eaters],
      found: this.found,
      ...extra,
    };
    save();
    this.onFinish?.(result);
    this.time.delayedCall(extra.rustyDown ? 1400 : 900, () => Director.encounterDone(this, result));
  }

  // helpers for subclasses
  travellingAllies(ids) {
    return ids.filter((id) => this.state.party[id] && this.state.party[id].status === STATUS.ACTIVE);
  }
}
