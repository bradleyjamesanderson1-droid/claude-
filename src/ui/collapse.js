// The carry / send-home choice when a companion hits zero stamina (brief §3, §5).
// No deaths. No permanent failure state.
import { txt } from './text.js';
import { button, Menu } from './button.js';
import { COMPANIONS } from '../data/companions.js';
import { carry, sendHome, pendingCollapses } from '../state/ledger.js';
import { getState, save } from '../state/store.js';
import { sfx } from './sfx.js';

export function resolveCollapses(scene, onDone) {
  const queue = pendingCollapses(getState());
  const nextOne = () => {
    const id = queue.shift();
    if (!id) return onDone();
    askOne(scene, id, nextOne);
  };
  nextOne();
}

function askOne(scene, id, done) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const name = COMPANIONS[id].name;
  sfx('collapse');
  const parts = [];
  const add = (o) => (parts.push(o.setScrollFactor?.(0) ?? o), o.setDepth?.(3000), o);
  add(scene.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive());
  const pw = Math.min(W - 16, 200);
  const px = (W - pw) / 2;
  const py = H / 2 - 90;
  add(scene.add.rectangle(px, py, pw, 180, 0x241c18).setOrigin(0).setStrokeStyle(1, 0xe8d8b0));
  add(scene.add.sprite(W / 2, py + 22, id).setScale(2).play(`${id}-down`));
  add(txt(scene, W / 2, py + 44, `${name} has collapsed.`, { origin: 0.5, color: '#ffd060' }));
  add(
    txt(scene, px + 8, py + 58, 'Carry: slower travel (+1 day a leg) and more food each day. They walk again once rested.\n\nSend home: they leave the party for the rest of this journey. Safe.', {
      wrap: pw - 16,
      lineSpacing: 3,
      color: '#d8cbb0',
    }),
  );
  const finish = (fn) => {
    fn(getState(), id);
    save();
    menu.destroy();
    parts.forEach((p) => p.destroy());
    scene.time.delayedCall(30, done);
  };
  const b1 = add(button(scene, px + 8, py + 148, pw / 2 - 12, 24, 'Carry', () => finish(carry)));
  const b2 = add(button(scene, px + pw / 2 + 4, py + 148, pw / 2 - 12, 24, 'Send home', () => finish(sendHome)));
  const menu = new Menu(scene, [b1, b2], { columns: 2 });
}
