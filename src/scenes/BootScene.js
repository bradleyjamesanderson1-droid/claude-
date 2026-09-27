import Phaser from 'phaser';
import { SPRITES, FRAME } from '../art/manifest.js';
import { generateAll } from '../art/placeholders.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Final art drop-in: any manifest entry with `file` set loads from public/sprites.
    for (const [key, spec] of Object.entries(SPRITES)) {
      if (spec.file) this.load.spritesheet(key, `sprites/${spec.file}`, { frameWidth: FRAME, frameHeight: FRAME });
    }
  }

  create() {
    generateAll(this);
    this.scene.start('Title');
  }
}
