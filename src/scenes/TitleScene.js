import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { addBackdrop } from '../ui/backdrop.js';
import { saveStatus, load, startNew } from '../state/store.js';
import { toggleMute, isMuted } from '../ui/sfx.js';
import { playMusic } from '../ui/music.js';
import { Director } from '../flow.js';
import { PORTRAIT, BUILD, TEST_BUILD } from '../config.js';
import { wantOrientation } from '../ui/orientation.js';
import { goto } from '../ui/nav.js';

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
    this.add.sprite(W / 2, 184, 'rusty').setScale(2).play('rusty-idle');

    txt(this, W / 2, 40, 'THE WOODLAND', { origin: 0.5, size: 16, stroke: '#1a1410', color: '#ffe6a8' });
    txt(this, W / 2, 62, 'REBELLION', { origin: 0.5, size: 16, stroke: '#1a1410', color: '#ffe6a8' });
    txt(this, W / 2, 84, 'Acts I–II · V1', { origin: 0.5, stroke: '#1a1410' });

    // Sound toggle (also M).
    const soundLabel = () => (isMuted() ? 'SOUND OFF' : 'SOUND ON');
    const sound = txt(this, W - 4, 4, soundLabel(), { origin: [1, 0], stroke: '#1a1410' });
    const flip = () => {
      toggleMute();
      sound.setText(soundLabel());
    };
    sound.setInteractive({ useHandCursor: true }).on('pointerup', flip);
    this.input.keyboard.on('keydown-M', flip);

    const status = saveStatus();
    const buttons = [];
    const add = (label, fn) => {
      const b = button(this, 38, 226 + buttons.length * 25, 140, 20, label, fn);
      buttons.push(b);
      return b;
    };
    if (status === 'ok') {
      add('Continue', () => {
        load();
        Director.resume(this);
      });
    }
    let confirm = false;
    const newBtn = add('New journey', () => {
      if (status === 'ok' && !confirm) {
        confirm = true;
        newBtn.setLabel('Overwrite save?');
        return;
      }
      startNew();
      Director.resume(this);
    });
    if (TEST_BUILD) add('Chapter select', () => goto(this, 'ChapterSelect'));
    add('Tester notes', () => window.open('testers.html', '_blank'));
    add('Feedback', () => goto(this, 'Feedback'));
    new Menu(this, buttons);

    if (status === 'stale') {
      txt(this, W / 2, 104, "Your save is from an older build and can't be loaded. Start a new journey or use chapter select.", {
        origin: [0.5, 0],
        align: 'center',
        wrap: W - 24,
        color: '#ffb090',
        stroke: '#1a1410',
      });
    }
    txt(this, W / 2, H - 10, `v${BUILD.version} (${BUILD.sha})${TEST_BUILD ? ' · TEST' : ''}`, { origin: 0.5, color: '#7a7064' });
  }
}
