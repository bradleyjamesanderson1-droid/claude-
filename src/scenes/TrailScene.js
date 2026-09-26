import Phaser from 'phaser';
import { txt, floatText } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { addBackdrop } from '../ui/backdrop.js';
import { applyColour } from '../ui/colour.js';
import { PartyPanel } from '../ui/partyPanel.js';
import { resolveCollapses } from '../ui/collapse.js';
import { sfx } from '../ui/sfx.js';
import { getState, save } from '../state/store.js';
import { LANDMARKS } from '../data/landmarks.js';
import { COMPANIONS, ROSTER_ORDER } from '../data/companions.js';
import { rollRoadEvent } from '../data/roadEvents.js';
import { travelDay, rest, eatMeal, legDays, rustyDown, maxStamina, STATUS, travellers } from '../state/ledger.js';
import { BALANCE } from '../config.js';
import { Director } from '../flow.js';
import { goto } from '../ui/nav.js';

const STRIP_H = 96;

/** Camp / travel screen between landmarks (portrait). */
export default class TrailScene extends Phaser.Scene {
  constructor() {
    super('Trail');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = getState();
    applyColour(this);
    this.cameras.main.fadeIn(250);
    this.add.rectangle(0, 0, W, H, 0x1a1410).setOrigin(0).setDepth(-20);

    const lm = LANDMARKS[s.landmark];
    this.bgKey = s.landmark >= BALANCE.blightFrom + 3 ? 'blight' : lm.bg;
    this.bg = addBackdrop(this, this.bgKey, { y: 0, height: STRIP_H, scroll: false });
    this.ground = this.add.tileSprite(0, STRIP_H - 16, W, 16, `ground-${this.bgKey}`).setOrigin(0).setDepth(-5);
    this.walkers = [];
    this.drawWalkers();

    txt(this, 6, 6, `Day ${s.day}`, { stroke: '#1a1410' });
    txt(this, 6, 18, lm.name, { stroke: '#1a1410', color: '#ffe6a8' });

    // Route: eleven landmarks.
    const ry = STRIP_H + 10;
    const rx0 = 14;
    const rw = W - 28;
    this.add.rectangle(rx0, ry, rw, 1, 0x6a5a4a).setOrigin(0, 0.5);
    LANDMARKS.forEach((_, n) => {
      const x = rx0 + (rw * n) / (LANDMARKS.length - 1);
      const done = n <= s.landmark;
      this.add.rectangle(x, ry, 5, 5, done ? 0xffd060 : 0x4a3c30).setStrokeStyle(1, 0xe8d8b0);
    });
    this.marker = this.add.sprite(rx0 + (rw * s.landmark) / (LANDMARKS.length - 1), ry - 9, 'rusty', 0).setScale(0.75);

    const nextLm = LANDMARKS[s.landmark + 1];
    this.nextText = txt(this, 8, ry + 10, '', { color: '#d8cbb0', wrap: W - 16 });

    this.panel = new PartyPanel(this, 8, ry + 30, W - 16);
    this.logLines = [];
    this.logText = txt(this, 8, 0, '', { wrap: W - 16, color: '#a8d8a0', lineSpacing: 3 });

    const bw = (W - 24) / 2;
    const by = H - 64;
    this.travelBtn = button(this, 8, by, bw, 24, nextLm ? 'Travel on' : '—', () => this.travel());
    this.restBtn = button(this, 16 + bw, by, bw, 24, 'Rest a day', () => this.doRest());
    this.mealBtn = button(this, 8, by + 30, bw, 24, 'Meal', () => this.doMeal(), { size: 8 });
    this.paceBtn = button(this, 16 + bw, by + 30, bw, 24, '', () => this.togglePace());
    this.buttons = [this.travelBtn, this.restBtn, this.mealBtn, this.paceBtn];
    this.menu = new Menu(this, this.buttons, { columns: 2 });

    const title = txt(this, W - 6, 6, 'Menu', { origin: [1, 0], color: '#a89a84', stroke: '#1a1410' });
    title.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      save();
      goto(this, 'Title');
    });
    this.input.keyboard.on('keydown-ESC', () => {
      save();
      goto(this, 'Title');
    });

    this.log(nextLm ? `Camp at ${lm.name}. Rest, eat, then travel on.` : '');
    this.refresh();
    // A collapse may be pending (e.g. from a story choice).
    this.busy = true;
    resolveCollapses(this, () => {
      this.busy = false;
      this.refresh();
    });
  }

  drawWalkers() {
    this.walkers.forEach((w) => w.destroy());
    this.walkers = [];
    const s = getState();
    const ids = ROSTER_ORDER.filter((id) => s.party[id] && s.party[id].status !== STATUS.HOME);
    const W = this.scale.width;
    ids.forEach((id, n) => {
      const x = W / 2 + 40 - n * 18;
      const st = s.party[id].status;
      const spr = this.add.sprite(x, STRIP_H - 16, id).setOrigin(0.5, 1).setScale(2);
      if (st === STATUS.CARRIED || st === STATUS.COLLAPSED) {
        spr.play(`${id}-down`).setY(STRIP_H - 22).setScale(1.5);
      } else spr.play(`${id}-idle`);
      spr.memberId = id;
      this.walkers.push(spr);
    });
  }

  walk(on) {
    this.walking = on;
    const s = getState();
    for (const w of this.walkers) {
      const st = s.party[w.memberId]?.status;
      if (st === STATUS.CARRIED || st === STATUS.COLLAPSED) continue;
      w.play(`${w.memberId}-${on ? 'run' : 'idle'}`);
    }
  }

  log(line) {
    if (!line) return;
    this.logLines.push(line);
    this.logLines = this.logLines.slice(-3);
    this.logText.setText(this.logLines.join('\n'));
  }

  mealTarget() {
    const s = getState();
    const cands = travellers(s).filter((id) => s.party[id].stamina < maxStamina(id));
    cands.sort((a, b) => s.party[a].stamina / maxStamina(a) - s.party[b].stamina / maxStamina(b));
    return cands[0];
  }

  refresh() {
    const s = getState();
    const bottom = this.panel.draw(s);
    this.logText.setY(bottom + 4);
    const nextLm = LANDMARKS[s.landmark + 1];
    this.nextText.setText(nextLm ? `Next: ${nextLm.name} (${legDays(s)} day${legDays(s) > 1 ? 's' : ''})` : 'The end of the road.');
    const t = this.mealTarget();
    this.mealBtn.setLabel(t ? `Meal: ${COMPANIONS[t].name}` : 'Meal');
    this.mealBtn.setEnabled(!this.busy && !!t && s.food >= BALANCE.meal.food);
    this.paceBtn.setLabel(s.pace === 'hard' ? 'Pace: HARD' : 'Pace: steady');
    this.travelBtn.setEnabled(!this.busy && !!nextLm);
    this.restBtn.setEnabled(!this.busy);
    this.paceBtn.setEnabled(!this.busy);
    this.menu.refresh();
  }

  memberY(id) {
    return (this.panel.rowY[id] ?? 150) + 3;
  }

  togglePace() {
    const s = getState();
    s.pace = s.pace === 'hard' ? 'steady' : 'hard';
    save();
    this.log(
      s.pace === 'hard'
        ? `Hard pace: fewer days, but -${BALANCE.travel.hardPaceStaminaPerDay} stamina each per day.`
        : 'Steady pace: slower, no stamina cost.',
    );
    this.refresh();
  }

  doMeal() {
    const s = getState();
    const id = this.mealTarget();
    if (!id) return;
    const gained = eatMeal(s, id);
    save();
    sfx('eat');
    floatText(this, this.scale.width - 40, this.memberY(id), `+${gained}`, '#a8f0a0');
    this.log(`${COMPANIONS[id].name} eats. -${BALANCE.meal.food} food, +${gained} stamina.`);
    this.refresh();
  }

  doRest() {
    const s = getState();
    const r = rest(s);
    save();
    for (const [id, g] of Object.entries(r.gained)) if (g > 0) floatText(this, this.scale.width - 40, this.memberY(id), `+${g}`, '#a8f0a0');
    this.log(
      r.unfed.length
        ? `A hungry day of rest. ${r.unfed.map((id) => COMPANIONS[id].name).join(', ')} went without.`
        : r.low
          ? 'A day of rest on short rations. Recovery is slow.'
          : 'A full day of rest and food. Everyone recovers.',
    );
    this.drawWalkers();
    this.refresh();
  }

  travel() {
    const s = getState();
    if (this.busy) return;
    this.busy = true;
    this.refresh();
    const days = legDays(s);
    let d = 0;
    this.walk(true);
    const dayStep = () => {
      if (d >= days) return this.arriveOrCollapse();
      d += 1;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1100,
        onUpdate: (tw) => this.bg.scrollTo((d - 1 + tw.getValue()) * 160),
        onComplete: () => {
          const rep = travelDay(s);
          const foodUsed = rep.foodBefore - rep.foodAfter;
          let line = `Day ${rep.day}: -${foodUsed} food.`;
          if (rep.unfed.length) line += ` ${rep.unfed.length} went hungry (-${BALANCE.travel.starveStaminaLoss} each).`;
          for (const [id, c] of Object.entries(rep.paceCost)) floatText(this, this.scale.width - 40, this.memberY(id), `-${c}`);
          this.log(line);
          if (Math.random() < 0.6) this.log(rollRoadEvent(s).text);
          save();
          this.refresh();
          if (rustyDown(s)) return this.arriveOrCollapse();
          dayStep();
        },
      });
    };
    dayStep();
  }

  update() {
    if (this.busy && this.walking) this.ground.tilePositionX += 1.2;
  }

  arriveOrCollapse() {
    const s = getState();
    this.walk(false);
    if (rustyDown(s)) {
      save();
      return goto(this, 'GameOver');
    }
    resolveCollapses(this, () => {
      save();
      this.drawWalkers();
      this.time.delayedCall(500, () => Director.arrive(this));
    });
  }
}
