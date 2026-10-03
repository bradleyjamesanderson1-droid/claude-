// Flight from the grove (landmark 3 / Ch. 4). A chase, NOT a fight: Rusty has
// no training yet, so there's no staff and no berries (brief §6). What he has
// is his feet, and every threat is telegraphed and dodgeable:
//   - roots and logs: JUMP them (or they block you and the pursuit catches up)
//   - sweep: an owl flies in at head height from the right. "!" warns at the
//     edge of the screen first. DUCK under it (or jump it, if you time it).
//   - dive: a shadow marks the ground, then an owl drops onto it. Don't be there.

import Phaser from 'phaser';
import EncounterBase, { GROUND_Y } from './EncounterBase.js';
import { Enforcer } from './actors.js';
import { floatText } from '../ui/text.js';
import { sfx } from '../ui/sfx.js';

const SCROLL = 58; // px/s the pursuit pushes the screen along (Rusty runs at 100)
const WARN = 1.1; // seconds of warning before any owl attack lands
const HIT = 6; // stamina per owl that connects
const SWEEP_Y = GROUND_Y - 34; // centre of a sweep: hits a standing Rusty, clears a ducking one

export default class ChaseScene extends EncounterBase {
  constructor() {
    super('Chase');
  }

  create() {
    const dur = this.cfg.duration || 60;
    const width = Math.round(SCROLL * dur + 500);
    this.setupWorld({ width, bg: 'grove-night', berries: false, staff: false, music: 'chase' });
    this.cameras.main.stopFollow();
    this.camX = 0;
    this.player.x = 120;

    const rng = new Phaser.Math.RandomDataGenerator(['chase']);
    this.obstacles = this.physics.add.staticGroup();
    for (let x = 420; x < width - 300; x += rng.between(170, 260)) {
      const big = rng.frac() < 0.35;
      const o = this.obstacles.create(x, GROUND_Y - (big ? 12 : 8), big ? 'log' : 'root').setScale(2).refreshBody();
      o.body.setSize(o.displayWidth - 8, o.displayHeight - 4);
    }
    this.physics.add.collider(this.player, this.obstacles);
    this.attackT = 4;
    this.attackN = 0;
    this.owls = [];
    this.banner('RUN!', 'Jump the roots. Duck the swoops [↓]. Stay out of the shadows.');
    this.objective('Get clear of the grove.');
    this.goalX = width - 100;
  }

  /** Head height for whatever Rusty is standing on (ground or a root). */
  sweepHeight() {
    const pb = this.player.body;
    const footing = pb.blocked.down || pb.touching.down ? pb.bottom : GROUND_Y;
    return SWEEP_Y - (GROUND_Y - footing);
  }

  /**
   * Head-height sweep from the right. The "!" tracks Rusty's footing during the
   * warning and the height locks when the owl launches, so ducking always works
   * wherever he's standing when it arrives.
   */
  sweep() {
    const W = this.scale.width;
    const warn = this.add.image(W - 14, this.sweepHeight(), 'warn').setScrollFactor(0).setScale(3).setDepth(1400).setTint(0xffe060);
    const arrow = this.add.text(W - 44, warn.y - 6, '<<<', { fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#ffe060' }).setScrollFactor(0).setDepth(1400);
    this.tweens.add({ targets: [warn, arrow], alpha: 0.35, yoyo: true, repeat: 4, duration: 110 });
    const follow = () => {
      warn.y = this.sweepHeight();
      arrow.y = warn.y - 6;
    };
    this.events.on('update', follow);
    sfx('warn');
    this.time.delayedCall(WARN * 1000, () => {
      this.events.off('update', follow);
      const y = warn.y;
      warn.destroy();
      arrow.destroy();
      if (this.ended) return;
      const o = new Enforcer(this, this.camX + W + 20, y, { resolve: 99 });
      o.kind = 'sweep';
      o.state = 'lunge';
      o.t = 99;
      o.s.play('enforcer-attack').setFlipX(true);
      o.s.setVelocity(-(SCROLL + 190), 0);
      this.owls.push(o);
    });
  }

  /** Dive onto a marked spot ahead of Rusty. */
  dive() {
    const x = this.player.x + 50 + Math.random() * 60;
    // Dark pool with a red rim so it reads on the night ground too.
    const shadow = this.add.ellipse(x, GROUND_Y - 1, 34, 8, 0x000000, 0.6).setDepth(1).setStrokeStyle(1, 0xff5040, 0.9);
    this.tweens.add({ targets: shadow, scaleX: 1.3, alpha: 0.75, duration: WARN * 1000 });
    sfx('warn');
    this.time.delayedCall(WARN * 1000, () => {
      if (this.ended) return shadow.destroy();
      const o = new Enforcer(this, x, GROUND_Y - 150, { resolve: 99 });
      o.kind = 'dive';
      o.state = 'lunge';
      o.t = 99;
      o.shadow = shadow;
      o.s.play('enforcer-attack');
      o.s.setVelocity(0, 520);
      this.owls.push(o);
    });
  }

  tick(dt) {
    // Pursuit scrolls the view; fall behind and you stumble.
    const maxCam = this.worldW - this.scale.width;
    this.camX = Math.min(maxCam, this.camX + SCROLL * dt);
    this.cameras.main.scrollX = this.camX;
    const left = this.camX + 10;
    const right = this.camX + this.scale.width - 16;
    if (this.player.x > right) this.player.x = right;
    if (this.player.x < left) {
      this.hurtRusty(HIT, { noKnock: true });
      floatText(this, this.camX + 110, this.player.y - 30, 'caught up! stumble', '#ff9a70');
      this.player.x = left + 60;
      this.player.setVelocity(120, -160);
    }

    // Alternate sweeps and dives, a little faster as the chase goes on.
    this.attackT -= dt;
    if (this.attackT <= 0 && this.elapsed < this.cfg.duration - 3) {
      this.attackT = Math.max(3.0, 4.0 - this.elapsed / 40); // always leaves a gap to jump a root
      this.attackN += 1;
      if (this.attackN % 3 === 0) this.dive();
      else this.sweep();
    }

    const me = this.playerRect();
    for (const o of this.owls) {
      if (!o.s.active) continue;
      const b = o.s.body;
      if (!o.connected && !o.pulled && Phaser.Geom.Rectangle.Overlaps(new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height), me)) {
        o.connected = true; // one hit per owl, however long the overlap
        this.hurtRusty(HIT, { from: o.s });
      }
      if (o.kind === 'dive' && !o.pulled && o.s.y >= GROUND_Y - 16) {
        o.pulled = true;
        o.shadow?.destroy();
        o.s.setVelocity(-60, -260);
      }
      if (o.kind === 'sweep' && o.s.x < this.camX - 40) o.s.destroy();
      if (o.s.y < -60) o.s.destroy();
    }
    this.owls = this.owls.filter((o) => o.s.active);

    if (this.elapsed >= this.cfg.duration || this.player.x >= this.goalX) {
      this.objective('The wings fall behind.');
      this.finish({ outcome: 'escaped' });
    }
  }
}
