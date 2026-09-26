// Protect (game-original encounter type, brief §6): shield the vulnerable
// companion while threats close in. Who "the vulnerable one" is comes from
// config (Kit vs. Chipper is still open in the book) — never hard-coded.

import Phaser from 'phaser';
import EncounterBase, { GROUND_Y } from './EncounterBase.js';
import { Crawler, Enforcer } from './actors.js';
import { COMPANIONS } from '../data/companions.js';
import { resolveVulnerable } from '../data/vulnerable.js';
import { spend, STATUS } from '../state/ledger.js';
import { floatText } from '../ui/text.js';
import { sfx } from '../ui/sfx.js';
import { Director } from '../flow.js';

const SCARE = 8; // stamina the protected companion loses per threat that reaches them

export default class ProtectScene extends EncounterBase {
  constructor() {
    super('Protect');
  }

  create() {
    this.setupWorld({ width: 384, bg: this.cfg.bg || 'blight' });
    this.cameras.main.stopFollow();
    this.protectId = resolveVulnerable(this.state);
    if (!this.protectId) {
      // Nobody left to protect (everyone sent home): skip the encounter honestly.
      this.ended = true;
      this.time.delayedCall(10, () => Director.complete(this));
      return;
    }
    const name = COMPANIONS[this.protectId].name;
    this.ward = this.physics.add.sprite(192, GROUND_Y - 20, this.protectId).setScale(2).setDepth(8).play(`${this.protectId}-idle`);
    this.ward.body.setSize(10, 14).setOffset(3, 2);
    this.physics.add.collider(this.ward, this.ground);
    this.player.x = 160;
    this.threats = [];
    this.spawnT = 2;
    this.spinesOn = this.state.party.spines?.status === STATUS.ACTIVE;
    this.banner(this.cfg.title || 'Keep them safe', `Grizz and Chip hold the far flanks. ${name} is yours to guard.`);
    this.objective(`Keep the threats off ${name}.`);
  }

  spawn() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const go = () => {
      if (this.ended) return;
      const x = side < 0 ? -10 : this.worldW + 10;
      const t =
        Math.random() < 0.3 && this.elapsed > 15
          ? new Enforcer(this, x, 110, { resolve: 1, target: this.ward })
          : new Crawler(this, x, { target: this.ward });
      this.threats.push(t);
    };
    if (this.spinesOn) {
      const w = this.add.image(side < 0 ? 12 : this.scale.width - 12, 120, 'warn').setScale(2).setDepth(1400);
      sfx('warn');
      this.tweens.add({ targets: w, alpha: 0.2, yoyo: true, repeat: 3, duration: 150, onComplete: () => w.destroy() });
      this.time.delayedCall(1100, go);
    } else go();
  }

  onStaff(zone, dir, power) {
    for (const t of this.threats) {
      if (t.alive && Phaser.Geom.Rectangle.Overlaps(zone, t.s.getBounds())) {
        if (t.knock(dir, power, this.stacked() ? 2 : 1)) floatText(this, t.x, t.s.y - 20, 'flees', '#ffe6a8');
      }
    }
  }

  tick(dt) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.elapsed < this.cfg.duration - 4) {
      this.spawnT = Math.max(1.5, 3.2 - this.elapsed / 30);
      this.spawn();
    }
    for (const t of this.threats) {
      t.update(dt, this.ward);
      if (!t.alive) continue;
      // Enforcer lunges can still clip Rusty if he stands in the way.
      if (t.dangerous && Phaser.Geom.Rectangle.Overlaps(t.s.getBounds(), this.player.getBounds())) this.hurtRusty(t.hit, { from: t.s });
      if (Math.abs(t.x - this.ward.x) < 14 && Math.abs(t.s.y - this.ward.y) < 30) {
        // A threat reached them: frightened and shaken, never hurt for good.
        const name = COMPANIONS[this.protectId].name;
        spend(this.state, this.protectId, SCARE);
        floatText(this, this.ward.x, this.ward.y - 26, `-${SCARE}`, '#ff9a70');
        this.ward.play(`${this.protectId}-hurt`);
        this.time.delayedCall(400, () => this.ward.active && this.ward.play(`${this.protectId}-idle`));
        sfx('hit');
        t.flee(Math.sign(t.x - this.ward.x) || 1);
        if (this.state.party[this.protectId].stamina <= 0) {
          this.ward.play(`${this.protectId}-down`);
          this.objective(`${name} can't go on.`);
          this.finish({ outcome: 'overwhelmed' });
          return;
        }
      }
    }
    this.threats = this.threats.filter((t) => t.state !== 'gone');
    if (this.elapsed >= this.cfg.duration) {
      this.objective('They pull back.');
      this.finish({ outcome: 'protected' });
    }
  }
}
