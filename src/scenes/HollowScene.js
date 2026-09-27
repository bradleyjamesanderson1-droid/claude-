import Phaser from 'phaser';
import { txt, floatText } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { addBackdrop } from '../ui/backdrop.js';
import { applyColour } from '../ui/colour.js';
import { staminaColor } from '../ui/partyPanel.js';
import { sfx } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { getState, save } from '../state/store.js';
import { drawCost, drainRate, takeBerry, spend, eatMeal, rest, maxStamina } from '../state/ledger.js';
import { BALANCE } from '../config.js';
import { Director } from '../flow.js';

/**
 * Mosswhisker's ledger tutorial (brief §4, landmark 4). Uses the REAL ledger:
 * every cost here is actually paid, so the player learns the prices for good.
 */
export default class HollowScene extends Phaser.Scene {
  constructor() {
    super('Hollow');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    applyColour(this);
    this.cameras.main.fadeIn(250);
    playMusic('hollow');
    addBackdrop(this, 'hollow', { y: 0, height: 150, scroll: false });
    this.add.tileSprite(0, 134, W, 16, 'ground-hollow').setOrigin(0);
    this.add.rectangle(0, 150, W, H - 150, 0x1a1410).setOrigin(0);
    this.moss = this.add.sprite(W / 2 + 40, 118, 'mosswhisker').setScale(2).setFlipX(true).play('mosswhisker-idle');
    this.rusty = this.add.sprite(W / 2 - 40, 118, 'rusty').setScale(2).play('rusty-idle');
    txt(this, 6, 6, 'BERRYCRAFT', { stroke: '#1a1410', color: '#ffe6a8' });

    // Rusty's ledger, big and plain.
    txt(this, 12, 160, 'Rusty', { color: '#ffd060' });
    this.barBg = this.add.rectangle(12, 174, W - 24, 10, 0x3a302a).setOrigin(0);
    this.bar = this.add.rectangle(12, 174, W - 24, 10, 0x7bd36a).setOrigin(0);
    this.stamText = txt(this, W - 12, 160, '', { origin: [1, 0] });
    this.infoText = txt(this, 12, 190, '', { color: '#a89a84' });
    this.active = []; // active berry types
    this.left = {}; // seconds remaining per active berry
    this.say = txt(this, 12, 212, '', { wrap: W - 24, lineSpacing: 5 });
    this.btn = button(this, 20, H - 44, W - 40, 28, '', () => this.onPress());
    this.menu = new Menu(this, [this.btn]);
    this.steps = this.buildSteps();
    this.stepIndex = -1;
    this.nextStep();
  }

  update(_, dt) {
    const s = getState();
    // Active berries drain continuously — shown ticking down live.
    // Berries expire after their duration. Mosswhisker won't let a lesson
    // floor him, so the drain stops short of collapse here.
    // (Durations only start ticking once the stack lesson is done, so a slow
    // reader doesn't lose the Fleet berry before stacking it.)
    if (this.stepIndex >= 3) for (const t of this.active) this.left[t] -= dt / 1000;
    this.active = this.active.filter((t) => this.left[t] > 0);
    if (this.active.length && s.party.rusty.stamina > 15) {
      let d = 0;
      for (const t of this.active) d += drainRate(t, this.active.length) * (dt / 1000);
      spend(s, 'rusty', d);
    }
    const m = s.party.rusty;
    const frac = m.stamina / maxStamina('rusty');
    this.bar.width = Math.max(0, (this.scale.width - 24) * frac);
    this.bar.setFillStyle(staminaColor(frac));
    this.stamText.setText(`${Math.round(m.stamina)}/${maxStamina('rusty')}`);
    const act = this.active.map((t) => t[0].toUpperCase() + t.slice(1)).join('+');
    this.infoText.setText(`Food ${s.food} Fleet ${s.pouch.fleet} Nimble ${s.pouch.nimble}${act ? '\nActive: ' + act : ''}`);
  }

  buildSteps() {
    const s = getState();
    const fleetCost = drawCost('fleet');
    const nimbleStack = drawCost('nimble', true);
    return [
      {
        say: `Mosswhisker: "Draw a Fleet berry. Watch the bar, not me."`,
        btn: `Draw Fleet (-${fleetCost})`,
        press: () => {
          takeBerry(s, 'fleet');
          spend(s, 'rusty', fleetCost);
          this.active = ['fleet'];
          this.left.fleet = BALANCE.berries.fleet.duration;
          sfx('draw');
          floatText(this, this.rusty.x, this.rusty.y - 20, `-${fleetCost}`);
          this.rusty.play('rusty-run');
        },
      },
      {
        say: `"Feel that? You're quick now. And it keeps drawing on you while it works — about ${BALANCE.berries.fleet.drain} a second. That's the loan, being paid."`,
        btn: 'I see it',
        wait: 3500,
      },
      {
        say: `"Two at once is stacking. Twice the effect. The second costs more, and both drain ${BALANCE.stack.drainMult}x as fast. Try it — once."`,
        btn: `Stack Nimble (-${nimbleStack})`,
        press: () => {
          takeBerry(s, 'nimble');
          spend(s, 'rusty', nimbleStack);
          this.active = [...this.active, 'nimble'];
          this.left.nimble = BALANCE.berries.nimble.duration;
          sfx('draw');
          floatText(this, this.rusty.x, this.rusty.y - 20, `-${nimbleStack}`);
          this.cameras.main.shake(200, 0.004);
        },
      },
      {
        say: '"See how fast it goes? Burst, then the bill. In a fight you only stack when you must. Let it go now."',
        btn: 'Let the berries go',
        wait: 2500,
        press: () => {
          this.active = [];
          this.rusty.play('rusty-idle');
        },
      },
      {
        say: `"Now you're hungry. That hunger is the receipt. Eat."`,
        btn: `Eat (-${BALANCE.meal.food} food, +${BALANCE.meal.stamina})`,
        press: () => {
          const g = eatMeal(s, 'rusty');
          sfx('eat');
          this.rusty.play('rusty-eat');
          floatText(this, this.rusty.x, this.rusty.y - 20, `+${g}`, '#a8f0a0');
        },
      },
      {
        say: '"Food and rest. Those are the only ways back. Nothing refills on its own — not ever. Rest a day."',
        btn: 'Rest a day',
        press: () => {
          const r = rest(s);
          this.rusty.play('rusty-idle');
          floatText(this, this.rusty.x, this.rusty.y - 20, `+${r.gained.rusty || 0}`, '#a8f0a0');
          this.cameras.main.flash(300, 20, 10, 0);
        },
      },
      {
        say: '"Run the bar to nothing and you drop where you stand. If a friend drops, you carry them — slow and hungry — or you send them home."',
        btn: 'Go on',
      },
      {
        say: '"When food runs low, rest does less. Travel hard and you arrive sooner, but it costs you. That\'s the whole ledger. Keep it short."',
        btn: 'Understood',
        press: () => {
          s.flags.berrycraft = true;
          save();
        },
        end: true,
      },
    ];
  }

  nextStep() {
    this.stepIndex += 1;
    const st = this.steps[this.stepIndex];
    if (!st) return Director.complete(this);
    this.say.setText(st.say);
    this.btn.setLabel(st.btn);
    if (st.wait) {
      this.btn.setEnabled(false);
      this.time.delayedCall(st.wait, () => {
        this.btn.setEnabled(true);
        this.menu.refresh();
      });
    } else this.btn.setEnabled(true);
    this.menu.refresh();
  }

  onPress() {
    const st = this.steps[this.stepIndex];
    st.press?.();
    save();
    if (st.end) return Director.complete(this);
    this.nextStep();
  }
}
