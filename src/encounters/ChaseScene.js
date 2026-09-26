// Flight from the grove (landmark 3 / Ch. 4). A chase, NOT a fight: Rusty has
// no training yet, so there's no staff and no berries (brief §6).

import Phaser from 'phaser';
import EncounterBase, { GROUND_Y } from './EncounterBase.js';
import { Enforcer } from './actors.js';
import { floatText } from '../ui/text.js';
import { sfx } from '../ui/sfx.js';

const SCROLL = 72; // px per second the pursuit pushes the screen along

export default class ChaseScene extends EncounterBase {
  constructor() {
    super('Chase');
  }

  create() {
    const dur = this.cfg.duration || 60;
    const width = Math.round(SCROLL * dur + 500);
    this.setupWorld({ width, bg: 'grove-night', berries: false, staff: false });
    this.controls.buttons.staff && (this.controls.buttons.staff.r.setVisible(false), this.controls.buttons.staff.t.setVisible(false));
    this.cameras.main.stopFollow();
    this.camX = 0;
    this.player.x = 120;

    const rng = new Phaser.Math.RandomDataGenerator(['chase']);
    this.obstacles = this.physics.add.staticGroup();
    for (let x = 400; x < width - 300; x += rng.between(150, 260)) {
      const big = rng.frac() < 0.35;
      const o = this.obstacles.create(x, GROUND_Y - (big ? 12 : 8), big ? 'log' : 'root').setScale(2).refreshBody();
      o.body.setSize(o.displayWidth - 6, o.displayHeight - 4);
    }
    this.physics.add.collider(this.player, this.obstacles);
    this.swoopT = 4;
    this.owls = [];
    this.banner('RUN!', 'Jump the roots. Dodge the swoops. Keep up!');
    this.objective('Get clear of the grove.');
    this.goalX = width - 100;
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
      this.hurtRusty(6, { noKnock: true });
      floatText(this, this.player.x + 30, this.player.y - 30, 'caught up! stumble', '#ff9a70');
      this.player.x = left + 50;
      this.player.setVelocity(120, -160);
    }

    // Owl swoops from above/right, with a shadow warning where they'll land.
    this.swoopT -= dt;
    if (this.swoopT <= 0 && this.elapsed < this.cfg.duration - 3) {
      this.swoopT = Math.max(1.8, 3.6 - this.elapsed / 30);
      const aimX = this.player.x + 40 + Math.random() * 40;
      const shadow = this.add.ellipse(aimX, GROUND_Y - 2, 30, 6, 0x000000, 0.4).setDepth(1);
      sfx('warn');
      this.time.delayedCall(800, () => {
        shadow.destroy();
        if (this.ended) return;
        const o = new Enforcer(this, aimX + 110, 40, { resolve: 99 });
        o.state = 'lunge';
        o.t = 99;
        o.s.play('enforcer-attack');
        o.s.setVelocity(-160, 230);
        o.s.setFlipX(true);
        this.owls.push(o);
      });
    }
    for (const o of this.owls) {
      if (!o.s.active) continue;
      if (o.s.y > GROUND_Y - 30 && !o.pulled) {
        o.pulled = true;
        o.s.setVelocity(-120, -180);
      }
      if (!o.pulled && Phaser.Geom.Rectangle.Overlaps(o.s.getBounds(), this.player.getBounds())) {
        this.hurtRusty(6, { from: o.s });
      }
      if (o.s.y < -40) o.s.destroy();
    }
    this.owls = this.owls.filter((o) => o.s.active);

    if (this.elapsed >= this.cfg.duration || this.player.x >= this.goalX) {
      this.objective('The wings fall behind.');
      this.finish({ outcome: 'escaped' });
    }
  }
}
