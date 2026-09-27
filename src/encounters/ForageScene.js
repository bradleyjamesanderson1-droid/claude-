// Forage run (brief §6): grab berries and food, dodge thorns and blight. No
// combat. Yields scale with how healthy the ground still is (brief §3).

import Phaser from 'phaser';
import EncounterBase, { GROUND_Y } from './EncounterBase.js';
import { BERRY_TYPES } from '../data/companions.js';
import { abundance } from '../state/ledger.js';
import { floatText } from '../ui/text.js';
import { sfx } from '../ui/sfx.js';

export default class ForageScene extends EncounterBase {
  constructor() {
    super('Forage');
  }

  create() {
    const light = !!this.cfg.light;
    const width = light ? 1300 : 1700;
    this.setupWorld({ width, bg: this.cfg.bg || 'grove', staff: false, music: 'forage' });
    this.controls.buttons.staff && (this.controls.buttons.staff.r.setVisible(false), this.controls.buttons.staff.t.setVisible(false));

    const rng = new Phaser.Math.RandomDataGenerator([String(this.state.landmark), 'forage']);
    const ab = abundance(this.state);
    this.platforms = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.hazards = this.physics.add.staticGroup();

    // Logs / broken stones to climb for the better finds.
    for (let x = 220; x < width - 150; x += 170 + rng.between(0, 80)) {
      const y = GROUND_Y - rng.between(34, 56);
      const plat = this.platforms.create(x, y, light ? 'log' : 'log').setScale(2).refreshBody();
      plat.body.checkCollision.down = false;
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      if (rng.frac() < 0.8 * ab + 0.1) this.addPickup(x, y - 24, rng);
    }
    this.physics.add.collider(this.player, this.platforms);

    // Ground finds: fewer the sicker the ground.
    const count = Math.round((light ? 14 : 18) * ab) + 3;
    for (let n = 0; n < count; n++) this.addPickup(rng.between(120, width - 80), GROUND_Y - 12, rng);

    // Hazards.
    const hazardCount = light ? 4 : 10;
    for (let n = 0; n < hazardCount; n++) {
      const x = rng.between(260, width - 120);
      const blight = !light && rng.frac() < 0.5;
      const h = this.hazards.create(x, blight ? GROUND_Y - 2 : GROUND_Y - 12, blight ? 'blight' : 'thorn').setScale(2).refreshBody();
      h.kind = blight ? 'blight' : 'thorn';
      h.body.setSize(h.displayWidth - 8, h.displayHeight - 6);
    }

    this.physics.add.overlap(this.player, this.pickups, (_, p) => this.collect(p));
    this.physics.add.overlap(this.player, this.hazards, (_, h) => this.touchHazard(h));

    // The exit.
    this.exitX = width - 40;
    this.add.image(this.exitX, GROUND_Y - 30, 'warn').setScale(2).setTint(0xa8f0a0);

    this.banner(this.cfg.title || 'Forage', light ? 'Collect what you can. Mind the thorns.' : 'Take what the ruins still give.');
    this.objective('Gather, then head right before time runs out.');
  }

  addPickup(x, y, rng) {
    const isFood = rng.frac() < 0.45;
    let key = 'food';
    let type = null;
    if (!isFood) {
      // Rusty's berries turn up most; the rest are rarer.
      type = rng.frac() < 0.55 ? rng.pick(['fleet', 'nimble']) : rng.pick(BERRY_TYPES);
      key = `berry-${type}`;
    }
    const p = this.pickups.create(x, y, key).setScale(2);
    p.berryType = type;
    this.tweens.add({ targets: p, y: y - 3, yoyo: true, repeat: -1, duration: 600 + rng.between(0, 300) });
  }

  collect(p) {
    if (!p.active) return;
    sfx('pickup');
    if (p.berryType) {
      this.found.berries[p.berryType] = (this.found.berries[p.berryType] || 0) + 1;
      floatText(this, p.x, p.y - 10, `+1 ${p.berryType}`, '#a8f0a0');
    } else {
      this.found.food += 1;
      floatText(this, p.x, p.y - 10, '+1 food', '#a8f0a0');
    }
    p.destroy();
  }

  touchHazard(h) {
    if (this.invuln > 0) return;
    if (h.kind === 'blight') {
      this.hurtRusty(4, { from: h });
      floatText(this, h.x, h.y - 20, 'blight', '#b0b0a0');
    } else this.hurtRusty(5, { from: h });
  }

  tick() {
    if (this.player.x >= this.exitX || this.elapsed >= this.cfg.duration) {
      this.objective(this.player.x >= this.exitX ? 'Done.' : "Time's up.");
      this.finish({ outcome: 'foraged' });
    }
  }
}
