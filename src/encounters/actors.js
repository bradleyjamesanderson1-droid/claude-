// Enemies and AI companions for encounters. Nobody dies: enemies whose resolve
// breaks turn and flee; companions at zero stamina collapse.

import Phaser from 'phaser';
import { BALANCE } from '../config.js';
import { GROUND_Y } from './EncounterBase.js';
import { COMPANIONS } from '../data/companions.js';
import { drawCost, drainRate, takeBerry, spend } from '../state/ledger.js';
import { floatText } from '../ui/text.js';
import { sfx } from '../ui/sfx.js';

// ---- Enemies -----------------------------------------------------------------

export class Enforcer {
  /**
   * An Owl enforcer. Hovers in, winds up, lunges. Knockback stuns and chips
   * resolve; at zero resolve it flees.
   */
  constructor(scene, x, y, { resolve = 3, champion = false, target = null, hit } = {}) {
    this.scene = scene;
    this.kind = 'enforcer';
    this.champion = champion;
    this.resolve = resolve;
    this.hit = hit ?? (champion ? BALANCE.skirmish.championHit : BALANCE.skirmish.enemyHit);
    this.state = 'approach';
    this.t = 0;
    this.target = target;
    this.s = scene.physics.add.sprite(x, y, 'enforcer').setScale(champion ? 3 : 2).setDepth(9);
    this.s.body.setAllowGravity(false);
    this.s.body.setSize(12, 12).setOffset(2, 3);
    this.s.play('enforcer-idle');
    this.s.actor = this;
    this.speed = champion ? 45 : 55 + Math.random() * 15;
    this.hover = Math.random() * Math.PI * 2;
  }

  get x() {
    return this.s.x;
  }

  get alive() {
    return this.state !== 'flee' && this.state !== 'gone';
  }

  update(dt, defaultTarget) {
    const s = this.s;
    const tgt = this.target || defaultTarget;
    this.t -= dt;
    this.hover += dt * 4;
    if (this.state === 'gone') return;
    if (this.state === 'flee') {
      s.setVelocity(this.fleeDir * 140, -90);
      if (s.y < -40 || s.x < -60 || s.x > this.scene.worldW + 60) {
        this.state = 'gone';
        s.destroy();
      }
      return;
    }
    if (this.state === 'hold') {
      s.setVelocity(0, Math.sin(this.hover) * 10);
      return;
    }
    if (this.state === 'stunned') {
      s.body.velocity.scale(0.9);
      if (this.t <= 0) this.state = 'approach';
      return;
    }
    const dx = tgt.x - s.x;
    const dy = tgt.y - (this.champion ? 14 : 4) - s.y;
    s.setFlipX(dx < 0);
    if (this.state === 'approach') {
      const dist = Math.hypot(dx, dy);
      if (dist < (this.champion ? 60 : 44) && this.t <= 0) {
        this.state = 'windup';
        this.t = this.champion ? 0.6 : 0.45;
        s.setTint(0xff8080);
        s.setVelocity(-Math.sign(dx) * 20, 0);
        return;
      }
      s.setVelocity((dx / (dist || 1)) * this.speed, (dy / (dist || 1)) * this.speed + Math.sin(this.hover) * 12);
    } else if (this.state === 'windup') {
      if (this.t <= 0) {
        this.state = 'lunge';
        this.t = 0.35;
        s.clearTint();
        s.play('enforcer-attack');
        const d = Math.hypot(dx, dy) || 1;
        s.setVelocity((dx / d) * 230, (dy / d) * 230);
      }
    } else if (this.state === 'lunge') {
      if (this.t <= 0) {
        this.state = 'approach';
        this.t = 0.8; // recover before the next windup
        s.play('enforcer-idle');
      }
    }
    if (s.y > GROUND_Y - 12) s.y = GROUND_Y - 12;
  }

  get dangerous() {
    return this.state === 'lunge';
  }

  /** Staff / ally knockback. Returns true if this broke its resolve. */
  knock(dir, power, dmg = 1) {
    if (!this.alive) return false;
    const s = this.s;
    s.clearTint();
    s.play('enforcer-hurt');
    s.setVelocity(dir * power * (this.champion ? 0.45 : 1), -60);
    this.state = 'stunned';
    this.t = this.champion ? 0.35 : 0.6;
    this.resolve -= dmg;
    sfx('knock');
    this.scene.time.delayedCall(250, () => s.active && this.alive && s.play('enforcer-idle'));
    if (this.resolve <= 0) {
      this.flee(dir);
      return true;
    }
    return false;
  }

  stun(seconds) {
    if (!this.alive) return;
    this.state = 'stunned';
    this.t = seconds;
    this.s.setTint(0x8080a0);
    this.scene.time.delayedCall(seconds * 1000, () => this.s.active && this.s.clearTint());
  }

  flee(dir) {
    this.state = 'flee';
    this.fleeDir = dir || (Math.random() < 0.5 ? -1 : 1);
    this.s.clearTint();
    this.s.play('enforcer-run');
    this.s.setCollideWorldBounds(false);
  }
}

export class Crawler {
  /** Ground-walking blight-sick creature for Protect encounters: scares, doesn't wound. */
  constructor(scene, x, { target, resolve = 1 } = {}) {
    this.scene = scene;
    this.kind = 'crawler';
    this.resolve = resolve;
    this.target = target;
    this.state = 'approach';
    this.t = 0;
    this.s = scene.physics.add.sprite(x, GROUND_Y - 10, 'crawler').setScale(2).setDepth(9);
    this.s.body.setSize(12, 6).setOffset(2, 9);
    this.s.play('crawler-run');
    scene.physics.add.collider(this.s, scene.ground);
    this.s.actor = this;
    this.speed = 32 + Math.random() * 16;
  }

  get x() {
    return this.s.x;
  }

  get alive() {
    return this.state !== 'flee' && this.state !== 'gone';
  }

  get dangerous() {
    return false;
  }

  update(dt) {
    const s = this.s;
    this.t -= dt;
    if (this.state === 'gone') return;
    if (this.state === 'flee') {
      s.setVelocityX(this.fleeDir * 120);
      if (s.x < -40 || s.x > this.scene.worldW + 40) {
        this.state = 'gone';
        s.destroy();
      }
      return;
    }
    if (this.state === 'stunned') {
      if (this.t <= 0) this.state = 'approach';
      return;
    }
    const dx = this.target.x - s.x;
    s.setFlipX(dx < 0);
    s.setVelocityX(Math.sign(dx) * this.speed);
  }

  knock(dir, power, dmg = 1) {
    if (!this.alive) return false;
    this.s.setVelocity(dir * power, -120);
    this.resolve -= dmg;
    sfx('knock');
    if (this.resolve <= 0) {
      this.flee(dir);
      return true;
    }
    this.state = 'stunned';
    this.t = 0.6;
    return false;
  }

  stun(seconds) {
    this.state = 'stunned';
    this.t = seconds;
  }

  flee(dir) {
    this.state = 'flee';
    this.fleeDir = dir || (this.s.x < this.target.x ? -1 : 1);
    this.s.setFlipX(this.fleeDir < 0);
  }
}

// ---- Companions --------------------------------------------------------------

const ROLE = {
  grizz: { kind: 'tank', range: 26, cd: 1.3, power: 150, cost: 2, berry: 'stout' },
  chip: { kind: 'striker', range: 24, cd: 1.0, power: 210, cost: 3, berry: 'flare' },
  spines: { kind: 'sentinel', range: 22, cd: 1.8, power: 110, cost: 1.5, berry: 'glow' },
  bandit: { kind: 'scout', range: 22, cd: 5.5, power: 120, cost: 3, berry: 'shadow' },
};

/**
 * A fighting companion. They pay out of their own stamina for every action and
 * every berry they draw, exactly like Rusty — the pouch is shared.
 */
export class Ally {
  constructor(scene, id, x) {
    this.scene = scene;
    this.id = id;
    this.role = ROLE[id];
    this.homeX = x;
    this.cd = 1 + Math.random();
    this.berryLeft = 0;
    this.down = false;
    this.s = scene.physics.add.sprite(x, GROUND_Y - 20, id).setScale(2).setDepth(8);
    this.s.body.setSize(10, 14).setOffset(3, 2);
    scene.physics.add.collider(this.s, scene.ground);
    this.s.play(`${id}-idle`);
    this.invuln = 0;
  }

  get stamina() {
    return this.scene.state.party[this.id].stamina;
  }

  pay(amount) {
    const collapsed = spend(this.scene.state, this.id, amount);
    if (collapsed || this.stamina <= 0) this.collapse();
  }

  collapse() {
    if (this.down) return;
    this.down = true;
    sfx('collapse');
    this.s.setVelocity(0, 0);
    this.s.play(`${this.id}-down`);
    floatText(this.scene, this.s.x, this.s.y - 24, `${COMPANIONS[this.id].name} is down`, '#ff9a70');
    this.scene.onAllyDown?.(this);
  }

  maybeDrawBerry() {
    const type = this.role.berry;
    if (this.berryLeft > 0 || this.stamina < 30) return;
    if (!takeBerry(this.scene.state, type)) return;
    const cost = drawCost(type);
    this.berryLeft = BALANCE.berries[type].duration;
    this.scene.eaters.add(this.id);
    this.scene.drawn[type] = (this.scene.drawn[type] || 0) + 1;
    floatText(this.scene, this.s.x, this.s.y - 24, `-${cost}`);
    this.pay(cost);
  }

  hurt(amount, from) {
    if (this.down || this.invuln > 0) return;
    this.invuln = 1;
    if (this.id === 'grizz' && this.berryLeft > 0) amount *= 0.5; // Bark/Stout soak
    floatText(this.scene, this.s.x, this.s.y - 24, `-${Math.round(amount)}`);
    this.s.play(`${this.id}-hurt`);
    this.s.setVelocityX(Math.sign(this.s.x - from.x || 1) * 80);
    this.pay(amount);
  }

  update(dt, enemies, player) {
    if (this.down) return;
    this.cd -= dt;
    this.invuln -= dt;
    if (this.berryLeft > 0) {
      this.berryLeft -= dt;
      this.pay(drainRate(this.role.berry, 1) * dt);
      if (this.down) return;
    }
    const live = enemies.filter((e) => e.alive);
    let near = null;
    let nd = Infinity;
    for (const e of live) {
      const d = Math.abs(e.x - this.s.x);
      if (d < nd) (nd = d), (near = e);
    }
    if (near && near.state !== 'hold') this.maybeDrawBerry();
    const boosted = this.berryLeft > 0;

    // Movement: tank holds its line near Rusty, striker hunts, others hang back.
    let goal = this.homeX;
    if (this.role.kind === 'tank') goal = player.x + (this.homeX < player.x ? -26 : 26);
    if (this.role.kind === 'striker' && near) goal = near.x - Math.sign(near.x - this.s.x) * 18;
    if (this.role.kind === 'sentinel') goal = player.x - 50;
    if (this.role.kind === 'scout' && near) goal = near.x - Math.sign(near.x - this.s.x) * 30;
    goal = Phaser.Math.Clamp(goal, 20, this.scene.worldW - 20);
    const dx = goal - this.s.x;
    const speed = this.role.kind === 'striker' && boosted ? 110 : 70;
    if (Math.abs(dx) > 6) {
      this.s.setVelocityX(Math.sign(dx) * speed);
      this.s.setFlipX(dx < 0);
      if (this.s.anims.currentAnim?.key !== `${this.id}-run`) this.s.play(`${this.id}-run`);
    } else {
      this.s.setVelocityX(0);
      if (near) this.s.setFlipX(near.x < this.s.x);
      if (!['idle', 'attack', 'hurt'].some((a) => this.s.anims.currentAnim?.key === `${this.id}-${a}`)) this.s.play(`${this.id}-idle`);
    }

    if (!near || this.cd > 0 || near.state === 'hold') return;
    if (this.role.kind === 'scout') {
      // Shadow: an enforcer loses track of everyone for a moment.
      if (nd < 80) {
        near.stun(boosted ? 2.5 : 1.5);
        floatText(this.scene, near.x, near.s.y - 20, '?', '#c9b6f2');
        this.cd = this.role.cd;
        this.pay(this.role.cost);
      }
      return;
    }
    if (nd < this.role.range + (near.champion ? 16 : 0)) {
      const dir = Math.sign(near.x - this.s.x) || 1;
      const power = this.role.power * (boosted ? 1.4 : 1);
      this.s.play(`${this.id}-attack`);
      near.knock(dir, power, boosted && this.role.kind === 'striker' ? 2 : 1);
      this.cd = this.role.cd * (boosted ? 0.8 : 1);
      this.pay(this.role.cost * (this.role.kind === 'striker' && boosted ? 1.5 : 1)); // Chip burns hot
    }
  }
}
