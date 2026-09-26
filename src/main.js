import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin-400.css';
import { PORTRAIT } from './config.js';
import { initOrientation } from './ui/orientation.js';
import * as store from './state/store.js';
import { Director } from './flow.js';
import { goto } from './ui/nav.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import CardScene from './scenes/CardScene.js';
import StoryScene from './scenes/StoryScene.js';
import TrailScene from './scenes/TrailScene.js';
import HollowScene from './scenes/HollowScene.js';
import ReceiptScene from './scenes/ReceiptScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import EndingScene from './scenes/EndingScene.js';
import ForageScene from './encounters/ForageScene.js';
import ChaseScene from './encounters/ChaseScene.js';
import SkirmishScene from './encounters/SkirmishScene.js';
import ProtectScene from './encounters/ProtectScene.js';

async function start() {
  // Pixel font must be ready before any Text object is created.
  try {
    await document.fonts.load('8px "Press Start 2P"');
  } catch {
    /* fall back to monospace */
  }
  initOrientation();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#120e0c',
    width: PORTRAIT.width,
    height: PORTRAIT.height,
    pixelArt: true, // nearest-neighbour everywhere, no smoothing
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 640 }, debug: false } },
    input: { activePointers: 4 },
    scene: [
      BootScene,
      TitleScene,
      CardScene,
      StoryScene,
      TrailScene,
      HollowScene,
      ReceiptScene,
      GameOverScene,
      EndingScene,
      ForageScene,
      ChaseScene,
      SkirmishScene,
      ProtectScene,
    ],
  });
  // Handy for debugging and the automated smoke test (scripts/smoke.mjs).
  window.__wr = { game, store, Director, goto };
}

start();
