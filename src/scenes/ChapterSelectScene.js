import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { LANDMARKS } from '../data/landmarks.js';
import { saveStatus, replaceState } from '../state/store.js';
import { stateAtLandmark } from '../state/testStart.js';
import { Director } from '../flow.js';
import { goto } from '../ui/nav.js';

/** Test builds only: jump straight to any landmark's arrival. */
export default class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelect');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.fadeIn(200);
    txt(this, W / 2, 12, 'CHAPTER SELECT', { origin: 0.5, color: '#ffe6a8' });
    txt(this, W / 2, 26, 'test builds only', { origin: 0.5, color: '#7a7064' });
    const hasRun = saveStatus() === 'ok';
    let armed = -1;
    const buttons = LANDMARKS.map((lm, n) => {
      const label = `${lm.chapter} ${lm.name}`;
      const b = button(this, 8, 38 + n * 27, W - 16, 23, label, () => {
        // Jumping replaces the current save, so ask once.
        if (hasRun && armed !== n) {
          if (armed >= 0) buttons[armed].setLabel(`${LANDMARKS[armed].chapter} ${LANDMARKS[armed].name}`);
          armed = n;
          b.setLabel('Replaces your save. Again?');
          return;
        }
        replaceState(stateAtLandmark(n));
        Director.resume(this);
      });
      b.label.setWordWrapWidth(null);
      b.label.setX(8).setOrigin(0, 0.5);
      return b;
    });
    const back = button(this, W / 2 - 50, H - 36, 100, 24, 'Back', () => goto(this, 'Title'));
    new Menu(this, [...buttons, back]);
  }
}
