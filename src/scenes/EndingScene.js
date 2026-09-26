import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { applyColour, tweenColour } from '../ui/colour.js';
import { addBackdrop } from '../ui/backdrop.js';
import { getState, save } from '../state/store.js';
import { driftColour } from '../state/ledger.js';
import { BALANCE } from '../config.js';
import { goto } from '../ui/nav.js';
import { resolveVulnerable } from '../data/vulnerable.js';

/**
 * The two V1 endings (brief §7).
 *  - rootvein: desaturated, heavy, silent. No triumph.
 *  - refuse:   quieter; the party regroups, shaken but whole. A real ending,
 *              not a punishment.
 */
export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  init(data) {
    this.path = data.path;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const s = getState();
    applyColour(this);
    this.cameras.main.fadeIn(1500);
    const rv = this.path === 'rootvein';

    addBackdrop(this, rv ? 'blight-deep' : 'campfire', { y: 40, height: 180, scroll: false });
    this.add.rectangle(0, 0, W, 40, 0x000000).setOrigin(0);
    this.add.rectangle(0, 220, W, H - 220, 0x000000).setOrigin(0);
    this.add.tileSprite(0, 204, W, 16, rv ? 'ground-blight-deep' : 'ground-campfire').setOrigin(0);

    if (rv) {
      // The palette keeps draining after the fight: permanent within this run.
      const from = s.colour;
      if (!s.flags.endingDrift) {
        s.flags.endingDrift = true;
        driftColour(s, BALANCE.colourDriftAfterRootvein);
        save();
      }
      tweenColour(this, from, s.colour, 6000);
      this.add.sprite(W / 2, 188, 'rusty').setScale(2).play('rusty-idle');
      const v = resolveVulnerable(s);
      if (v) this.add.sprite(W / 2 - 60, 188, v).setScale(2).setFlipX(false).setAlpha(0.8).play(`${v}-idle`);
      this.slow([
        [W / 2, 260, 'Rusty won.'],
        [W / 2, 280, 'He does not feel it.'],
        [W / 2, 330, 'To be continued.'],
      ]);
    } else {
      const ids = Object.keys(s.party).filter((id) => s.party[id].status !== 'home');
      ids.forEach((id, n) => {
        const x = W / 2 + (n - (ids.length - 1) / 2) * 24;
        this.add.sprite(x, 188, id).setScale(2).setFlipX(x > W / 2).play(id === 'rusty' ? 'rusty-eat' : `${id}-idle`);
      });
      this.slow([
        [W / 2, 250, 'The ground is lost.'],
        [W / 2, 270, 'Nobody is.'],
        [W / 2, 300, 'Shaken, hungry, whole.'],
        [W / 2, 340, 'To be continued.'],
      ]);
    }
  }

  slow(lines) {
    const W = this.scale.width;
    lines.forEach(([x, y, str], n) => {
      const t = txt(this, x, y, str, { origin: 0.5, align: 'center', wrap: W - 20, color: '#e8e0d0' }).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, delay: 1200 + n * 1800, duration: 1400 });
    });
    this.time.delayedCall(1200 + lines.length * 1800 + 800, () => {
      const b = button(this, W / 2 - 60, this.scale.height - 30, 120, 22, 'Title', () => goto(this, 'Title'));
      new Menu(this, [b]);
    });
  }
}
