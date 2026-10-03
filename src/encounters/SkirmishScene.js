// Skirmishes (brief §6).
//   mode 'rescue' — landmark 6 / Ch. 7, the mandatory combat tutorial:
//                   draw one berry, watch stamina drop, disengage before empty,
//                   eat afterward. The template for every later fight.
//   mode 'climax' — landmark 11 / Ch. 12. Rootvein is offered ONCE, mid-fight,
//                   only when Rusty's actual ledger is low (brief §6, §7).

import Phaser from 'phaser';
import EncounterBase, { GROUND_Y } from './EncounterBase.js';
import { Enforcer, Ally } from './actors.js';
import { BALANCE } from '../config.js';
import { txt, floatText } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { tweenColour } from '../ui/colour.js';
import { sfx } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { FRIEND_NAME } from '../data/script.js';
import { maxStamina, useRootvein, STATUS } from '../state/ledger.js';

const FIGHTERS = ['grizz', 'chip', 'spines', 'bandit'];

export default class SkirmishScene extends EncounterBase {
  constructor() {
    super('Skirmish');
  }

  create() {
    const climax = this.cfg.mode === 'climax';
    this.climax = climax;
    this.setupWorld({ width: climax ? 384 : 720, bg: this.cfg.bg || 'thorns', act: !climax, music: climax ? 'climax' : 'skirmish' });
    this.enemies = [];
    this.allies = [];
    this.spawned = 0;
    this.spawnT = 3;

    const allyIds = this.travellingAllies(FIGHTERS);
    allyIds.forEach((id, n) => this.allies.push(new Ally(this, id, 30 + n * 16)));
    this.player.x = climax ? 150 : 70;
    this.spinesOn = allyIds.includes('spines');

    if (climax) this.setupClimax();
    else this.setupRescue();
  }

  // ---- shared ------------------------------------------------------------------

  spawnEnforcer(side, opts = {}) {
    const x = side < 0 ? this.cameras.main.scrollX - 20 : this.cameras.main.scrollX + this.scale.width + 20;
    const e = new Enforcer(this, x, 120 + Math.random() * 40, opts);
    this.enemies.push(e);
    this.spawned += 1;
    return e;
  }

  /** Spines (Glow) sees the ambush coming — a warning a beat ahead of spawns. */
  warnThenSpawn(side, opts) {
    const delay = this.spinesOn && this.allies.find((a) => a.id === 'spines' && !a.down) ? 1200 : 0;
    if (delay) {
      const W = this.scale.width;
      const w = this.add.image(side < 0 ? 12 : W - 12, 110, 'warn').setScrollFactor(0).setScale(2).setDepth(1400);
      sfx('warn');
      this.tweens.add({ targets: w, alpha: 0.2, yoyo: true, repeat: 3, duration: 150, onComplete: () => w.destroy() });
    }
    this.time.delayedCall(delay, () => !this.ended && this.spawnEnforcer(side, opts));
  }

  onStaff(zone, dir, power) {
    for (const e of this.enemies) {
      if (!e.alive || !Phaser.Geom.Rectangle.Overlaps(zone, e.s.getBounds())) continue;
      const broke = e.knock(dir, power, this.rootveinActive ? 3 : this.stacked() ? 2 : 1);
      this.knocks = (this.knocks || 0) + 1;
      if (broke) floatText(this, e.x, e.s.y - 20, e.champion ? 'IT BREAKS' : 'flees', '#ffe6a8');
      else if (e.champion && !this.rootveinActive) floatText(this, e.x, e.s.y - 30, 'barely moves', '#d8cbb0');
    }
  }

  tick(dt) {
    for (const e of this.enemies) e.update(dt, this.player);
    this.enemies = this.enemies.filter((e) => e.state !== 'gone');
    for (const a of this.allies) a.update(dt, this.enemies, this.player);
    // Lunges land on whoever they reach.
    for (const e of this.enemies) {
      if (!e.dangerous) continue;
      const b = e.s.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(b, this.player.getBounds())) this.hurtRusty(e.hit, { from: e.s });
      for (const a of this.allies) if (!a.down && Phaser.Geom.Rectangle.Overlaps(b, a.s.getBounds())) a.hurt(e.hit * 0.75, e.s);
    }
    if (this.climax) this.tickClimax(dt);
    else this.tickRescue(dt);
  }

  // ---- rescue (tutorial) -----------------------------------------------------

  setupRescue() {
    this.cage = this.add.image(650, GROUND_Y - 24, 'cage').setScale(2).setDepth(7);
    this.captive = this.physics.add.sprite(650, GROUND_Y - 20, 'friend').setScale(2).setDepth(6).play('friend-idle');
    this.captive.body.setAllowGravity(false);
    this.captive.body.setImmovable(true);
    this.freeProgress = 0;
    this.freed = false;
    // Guards hold position until Rusty commits.
    for (const x of [470, 560, 610]) {
      const e = new Enforcer(this, x, 140, { resolve: 2 });
      e.state = 'hold';
      this.enemies.push(e);
    }
    this.progressBar = this.add.rectangle(650, GROUND_Y - 60, 0, 4, 0xffd060).setDepth(12).setOrigin(0, 0.5);
    this.banner('Rescue in the Thorns', 'Get to the pen. Free them. Get out.');
    this.tut = 0;
    this.tutSteps = [
      { text: 'Draw ONE berry before you go in.\n[K] or FLT = Fleet   [L] or NMB = Nimble', done: () => this.activeCount() > 0 },
      { text: 'Watch the bar: the draw cost you, and it keeps\ndraining while the berry works.', done: () => this.tutTimer > 3.5 },
      { text: 'Staff: [J] or STF knocks them back. No killing.\nRed flash = about to lunge: hit it first, or jump.', done: () => (this.knocks || 0) >= 2 },
      { text: `Reach the pen. Hold [E] or ACT to free ${FRIEND_NAME}.`, done: () => this.freed },
      { text: 'Disengage! Get back to the left edge before\nyou are empty. Winning is getting out.', done: () => false },
    ];
    this.tutTimer = 0;
    this.objective(this.tutSteps[0].text);
    this.stackHintShown = false;
  }

  onBerryDrawn() {
    if (!this.climax && this.stacked() && !this.stackHintShown) {
      this.stackHintShown = true;
      floatText(this, this.player.x, this.player.y - 54, 'Stacking: big burst, fast drain', '#ffd060');
    }
  }

  tickRescue(dt) {
    this.tutTimer += dt;
    const step = this.tutSteps[this.tut];
    if (step && step.done()) {
      this.tut += 1;
      this.tutTimer = 0;
      if (this.tutSteps[this.tut]) this.objective(this.tutSteps[this.tut].text);
    }
    // Guards engage once Rusty commits (drew a berry) or walks in close.
    if (this.activeCount() > 0 || this.player.x > 300 || this.knocks) {
      for (const e of this.enemies) if (e.state === 'hold') e.state = 'approach';
      this.engaged = true;
    }
    // Reinforcements trickle in from the right while he's at the pen.
    if (this.engaged && this.spawned < 3) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = 9;
        this.warnThenSpawn(1, { resolve: 2 });
      }
    }
    // Freeing the captive: hold ACT at the pen.
    const atCage = Math.abs(this.player.x - this.cage.x) < 34;
    if (!this.freed) {
      if (atCage && this.controls.isDown('act')) {
        this.freeProgress += dt / 2;
        if (Math.random() < 0.1) sfx('click');
      } else this.freeProgress = Math.max(0, this.freeProgress - dt * 0.5);
      this.progressBar.width = 40 * this.freeProgress;
      this.progressBar.x = this.cage.x - 20;
      if (this.freeProgress >= 1) {
        this.freed = true;
        this.progressBar.destroy();
        this.tweens.add({ targets: this.cage, alpha: 0, y: this.cage.y - 20, duration: 400 });
        sfx('pickup');
        floatText(this, this.cage.x, this.cage.y - 40, 'Free!', '#a8f0a0');
        this.captive.body.setAllowGravity(true);
        this.physics.add.collider(this.captive, this.ground);
        this.captive.play('friend-run');
      }
    } else {
      // The freed friend follows Rusty out.
      const dx = this.player.x + 24 - this.captive.x;
      this.captive.setVelocityX(Math.abs(dx) > 10 ? Math.sign(dx) * 100 : 0);
      this.captive.setFlipX(dx < 0);
      if (this.player.x < 50) {
        floatText(this, this.player.x, this.player.y - 30, 'Out!', '#a8f0a0');
        this.finish({ outcome: 'rescued' });
      }
    }
  }

  // ---- climax (Ch. 12) -----------------------------------------------------------

  setupClimax() {
    const rusty = this.state.party.rusty;
    // "Rusty is already spent" — the road here took it out of him (shown, not hidden).
    const cap = maxStamina('rusty') * BALANCE.skirmish.climaxSpentCap;
    if (rusty.stamina > cap) {
      const lost = Math.round(rusty.stamina - cap);
      rusty.stamina = cap;
      this.startStamina.rusty = cap;
      this.time.delayedCall(600, () => floatText(this, this.player.x, this.player.y - 30, `The road spent you: -${lost}`, '#ff9a70'));
    }
    this.cameras.main.stopFollow();
    this.banner('Price of the Shortcut', 'Hold the line.');
    this.objective('Hold the line.');
    this.offered = false;
    this.spawnInterval = 3.2;
    this.spawnT = 1.5;
    this.champion = null;
    this.time.delayedCall(4000, () => {
      if (this.ended) return;
      this.champion = this.spawnEnforcer(1, { champion: true, resolve: Infinity });
      floatText(this, this.scale.width - 60, 80, 'Something big is coming', '#ff9a70');
    });
  }

  tickClimax(dt) {
    // Honest pressure rises until something gives.
    if (!this.rootveinActive) {
      this.spawnT -= dt;
      const live = this.enemies.filter((e) => e.alive).length;
      if (this.spawnT <= 0 && live < 6) {
        this.spawnT = this.spawnInterval;
        this.spawnInterval = Math.max(1.4, this.spawnInterval - 0.12);
        this.warnThenSpawn(Math.random() < 0.5 ? -1 : 1, { resolve: 2 });
      }
      // The Rootvein offer responds to the ledger, not a script timer.
      const rusty = this.state.party.rusty;
      const frac = rusty.stamina / maxStamina('rusty');
      const noBerries = !this.state.pouch.fleet && !this.state.pouch.nimble;
      const low =
        frac <= BALANCE.skirmish.rootveinOfferAt || (noBerries && frac <= BALANCE.skirmish.rootveinOfferAtNoBerries);
      if (!this.offered && low && this.elapsed > 5 && rusty.stamina > 0) this.offerRootvein();
    } else {
      // Rootvein: everything scatters. The ease of it is the point.
      const live = this.enemies.filter((e) => e.alive);
      if (this.champion && !this.champion.alive && live.length === 0 && !this.winning) {
        this.winning = true;
        this.time.delayedCall(800, () => this.finish({ outcome: 'rootvein', climax: true }));
      }
    }
    for (const e of this.enemies) e.s.x = Phaser.Math.Clamp(e.s.x, -80, this.worldW + 80);
  }

  offerRootvein() {
    this.offered = true;
    this.modal = true;
    this.physics.pause();
    this.anims.pauseAll();
    const W = this.scale.width;
    const H = this.scale.height;
    const parts = [];
    const add = (o) => (parts.push(o), o.setScrollFactor?.(0), o.setDepth?.(3000), o);
    add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0));
    add(this.add.rectangle(W / 2 - 150, 40, 300, 150, 0x1a1410).setOrigin(0).setStrokeStyle(1, 0x6a5a6a));
    const bandit = this.state.party.bandit && this.state.party.bandit.status !== STATUS.HOME;
    add(this.add.sprite(W / 2 - 120, 76, bandit ? 'bandit' : 'rusty', 0).setScale(2));
    add(this.add.image(W / 2 - 96, 80, 'rootvein').setScale(2));
    add(
      txt(this, W / 2 - 76, 50, bandit ? 'Bandit: "Say the word."' : 'The Rootvein bundle is right there.', {
        wrap: 220,
        color: '#ffd060',
      }),
    );
    // The offer tells the truth about what you can see: no stamina, no food.
    // It says nothing about Colour, because Rootvein never does.
    add(
      txt(this, W / 2 - 76, 70, "Rootvein. It always works.\nIt costs no stamina.\nIt costs no food.\n\nYou have almost nothing left.", {
        wrap: 220,
        color: '#d8cbb0',
        lineSpacing: 4,
      }),
    );
    const close = (fn) => {
      menu.destroy();
      parts.forEach((p) => p.destroy());
      this.anims.resumeAll();
      this.physics.resume();
      this.modal = false;
      fn();
    };
    const b1 = add(button(this, W / 2 - 140, 156, 130, 24, 'Use Rootvein', () => close(() => this.takeRootvein())));
    const b2 = add(button(this, W / 2 + 10, 156, 130, 24, 'Keep fighting', () => close(() => this.refuseRootvein())));
    const menu = new Menu(this, [b1, b2], { columns: 2 });
    menu.index = 1; // no nudge toward the shortcut
    menu.refresh();
  }

  takeRootvein() {
    const from = this.state.colour;
    useRootvein(this.state);
    this.rootveinActive = true;
    this.activeBerries = {}; // it doesn't need them
    // The music cuts out. What's left is the hush and the ease of it.
    playMusic(null);
    sfx('rootvein');
    tweenColour(this, from, this.state.colour, 2200);
    this.player.setTint(0x7a6a78);
    this.cameras.main.flash(400, 40, 30, 40);
    this.objective('');
    if (this.champion?.alive) this.champion.resolve = 4;
    // The rank and file feel it and scatter. The big one is left for Rusty.
    this.time.delayedCall(700, () => {
      for (const e of this.enemies) if (!e.champion && e.alive) e.flee(Math.sign(e.x - this.player.x) || 1);
    });
  }

  refuseRootvein() {
    this.state.flags.refusedRootvein = true;
    this.objective('Hold the line. Honestly.');
  }

  onRustyDown() {
    if (!this.climax) return super.onRustyDown();
    if (this.ended) return;
    // The honest end of the ledger: Rusty goes down, the party retreats.
    sfx('collapse');
    this.player.play('rusty-down');
    this.player.setVelocity(0, 0);
    this.objective('Rusty has nothing left.');
    this.finish({ outcome: 'refused', climax: true });
  }

  onFinish(result) {
    if (!this.climax) return;
    // Whoever fell is carried out together — no one is left behind in V1.
    for (const m of Object.values(this.state.party)) if (m.status === STATUS.COLLAPSED) m.status = STATUS.CARRIED;
    result.climax = true;
  }
}
