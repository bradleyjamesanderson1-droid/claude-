import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { addBackdrop } from '../ui/backdrop.js';
import { hasSave, load, startNew } from '../state/store.js';
import { toggleMute, isMuted } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { Director } from '../flow.js';
import { PORTRAIT } from '../config.js';
import { wantOrientation } from '../ui/orientation.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    if (this.scale.width !== PORTRAIT.width) this.scale.setGameSize(PORTRAIT.width, PORTRAIT.height);
    wantOrientation('portrait');
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.fadeIn(300);
    playMusic('trail');
    addBackdrop(this, 'grove', { y: 0, height: 216 });
    this.add.rectangle(0, 216, W, H - 216, 0x1a1410).setOrigin(0);
    this.add.tileSprite(0, 200, W, 16, 'ground-grove').setOrigin(0);
    const rusty = this.add.sprite(W / 2, 184, 'rusty').setScale(2).play('rusty-idle');
    rusty.setOrigin(0.5, 0.5);

    txt(this, W / 2, 40, 'THE WOODLAND', { origin: 0.5, size: 16, stroke: '#1a1410', color: '#ffe6a8' });
    txt(this, W / 2, 62, 'REBELLION', { origin: 0.5, size: 16, stroke: '#1a1410', color: '#ffe6a8' });
    txt(this, W / 2, 84, 'Acts I–II · V1', { origin: 0.5, stroke: '#1a1410' });

    const buttons = [];
    let y = 236;
    if (hasSave()) {
      buttons.push(
        button(this, 38, y, 140, 24, 'Continue', () => {
          load();
          Director.resume(this);
        }),
      );
      y += 32;
    }
    let confirm = false;
    const newBtn = button(this, 38, y, 140, 24, 'New journey', () => {
      if (hasSave() && !confirm) {
        confirm = true;
        newBtn.setLabel('Overwrite save?');
        return;
      }
      startNew();
      Director.resume(this);
    });
    buttons.push(newBtn);
    y += 32;
    const muteBtn = button(this, 38, y, 140, 24, isMuted() ? 'Sound: off' : 'Sound: on', () => {
      muteBtn.setLabel(toggleMute() ? 'Sound: off' : 'Sound: on');
    });
    buttons.push(muteBtn);
    new Menu(this, buttons);

    txt(this, W / 2, H - 20, 'placeholder art · draft text', { origin: 0.5, color: '#7a7064' });
  }
}
