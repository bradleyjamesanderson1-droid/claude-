import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { restoreCheckpoint } from '../state/store.js';
import { Director } from '../flow.js';
import { goto } from '../ui/nav.js';

/** Rusty at zero stamina outside the climax: the run ends. Retry from the landmark. */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.fadeIn(400);
    this.add.sprite(W / 2, H / 2 - 60, 'rusty').setScale(3).play('rusty-down');
    txt(this, W / 2, H / 2 - 20, 'Rusty collapses.', { origin: 0.5, color: '#ffd060' });
    txt(this, W / 2, H / 2 + 6, 'He spent more than he had. The ledger always comes due.', {
      origin: 0.5,
      align: 'center',
      wrap: W - 30,
      color: '#d8cbb0',
    });
    const b1 = button(this, W / 2 - 70, H / 2 + 50, 140, 24, 'Try again', () => {
      if (restoreCheckpoint()) Director.resume(this);
      else goto(this, 'Title');
    });
    const b2 = button(this, W / 2 - 70, H / 2 + 82, 140, 24, 'Title', () => goto(this, 'Title'));
    new Menu(this, [b1, b2]);
    txt(this, W / 2, H - 30, 'Try again restarts this landmark.', { origin: 0.5, color: '#7a7064' });
  }
}
