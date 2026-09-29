// Procedural placeholder pixel art. Everything is drawn pixel-by-pixel onto
// small canvases, so it scales up crisply and matches the final-art contract in
// manifest.js (same frame size, count and order).

import { FRAME, FRAME_COUNT, FRAME_LAYOUT, ANIMS, SPRITES } from './manifest.js';
import { BERRY_INFO } from '../data/companions.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

function painter(ctx, ox = 0, oy = 0, flipW = 0) {
  const px = (x, y, c) => {
    if (!c) return;
    ctx.fillStyle = c;
    const fx = flipW ? flipW - 1 - x : x;
    ctx.fillRect(ox + fx, oy + y, 1, 1);
  };
  const rect = (x, y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c);
  };
  const ellipse = (cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) px(cx + x, cy + y, c);
  };
  return { px, rect, ellipse };
}

// ---- Creatures ---------------------------------------------------------------

function drawMammal(p, spec, f) {
  const { px, rect, ellipse } = p;
  const sz = spec.size === 's' ? -1 : spec.size === 'l' ? 1 : 0;
  const isRun = FRAME_LAYOUT.run.includes(f);
  const bob = f === 1 || f === 3 || f === 5 ? 1 : 0;
  const eyeC = spec.eye || '#101010';

  if (f === FRAME_LAYOUT.down[0]) {
    // collapsed: lying flat, eyes shut
    ellipse(7, 13, 5 + sz, 2, spec.body);
    rect(4, 14, 7, 1, spec.belly);
    ellipse(12 + sz, 12, 2 + (sz > 0 ? 1 : 0), 2, spec.body);
    px(13 + sz, 11, spec.dark);
    px(12 + sz, 11, spec.dark);
    if (spec.tail !== 'none') ellipse(2, 13, 1, 1, spec.dark);
    return;
  }

  const eating = FRAME_LAYOUT.eat.includes(f);
  const jumping = f === FRAME_LAYOUT.jump[0];
  const ducking = f === FRAME_LAYOUT.duck?.[0];
  const crouch = ducking ? 3 : 0;
  const by = 10 + bob + crouch - (jumping ? 1 : 0) + (sz < 0 ? 1 : 0);
  const hx = 11 + sz + (f === FRAME_LAYOUT.attack[0] ? 1 : 0);
  const hy = (eating ? 7 : 6) + bob + crouch * 2 + (sz < 0 ? 2 : 0) - (sz > 0 ? 1 : 0);

  // tail (behind body)
  const tc = spec.body;
  if (spec.tail === 'bushy') {
    ellipse(3, by - 3, 2, 3, tc);
    px(2, by - 6, spec.belly);
    px(3, by - 6, spec.belly);
  } else if (spec.tail === 'stripe') {
    ellipse(3, by - 4, 1, 4, tc);
    rect(3, by - 7, 1, 6, spec.dark);
  } else if (spec.tail === 'ringed') {
    for (let i = 0; i < 5; i++) px(2 + (i % 2), by - i, i % 2 ? spec.dark : spec.belly), px(3, by - i, i % 2 ? spec.body : spec.dark);
  } else if (spec.tail === 'short') {
    px(2, by - 1, tc);
    px(3, by - 1, tc);
  } else if (spec.tail === 'long') {
    for (let i = 0; i < 5; i++) px(1 + i, by + 1 - Math.floor(i / 2), spec.dark);
  }

  // legs
  const legY = by + 2 + (sz > 0 ? 1 : 0);
  let legA = 5,
    legB = 9;
  if (isRun) {
    const phase = FRAME_LAYOUT.run.indexOf(f);
    legA = [4, 5, 6, 5][phase];
    legB = [10, 9, 8, 9][phase];
  }
  if (!jumping) {
    for (let y = legY; y <= 15; y++) {
      px(legA, y, spec.dark);
      px(legB, y, spec.dark);
    }
  } else {
    px(legA - 1, legY + 1, spec.dark);
    px(legB + 1, legY + 1, spec.dark);
  }

  // body + belly
  ellipse(7, by, 4 + sz, 3 + (sz > 0 ? 1 : 0), spec.body);
  rect(5, by + 1, 5 + sz, 1, spec.belly);
  if (spec.spines) {
    for (let x = 3; x <= 10; x += 2) px(x, by - 3 - ((x / 2) % 2), spec.dark), px(x + 1, by - 4, spec.belly);
  }
  if (spec.mangy) {
    px(5, by - 1, spec.belly);
    px(8, by, spec.dark);
    px(6, by + 1, spec.dark);
  }

  // head
  ellipse(hx, hy, 3 + (sz > 0 ? 1 : 0), 2 + (sz > 0 ? 1 : 0), spec.body);
  px(hx + 3 + sz, hy + 1, spec.dark); // nose
  px(hx + 1, hy - 1, eyeC); // eye
  if (spec.mask) rect(hx - 1, hy - 1, 4, 1, spec.dark), px(hx + 1, hy - 1, '#f0f0f0');
  if (spec.whiskers) px(hx + 4, hy + 1, spec.belly), px(hx + 4, hy, spec.belly);
  px(hx + 1, hy + 1, spec.belly);
  px(hx + 2, hy + 1, spec.belly);

  // ears
  const ey = hy - 3 - (sz > 0 ? 1 : 0);
  if (spec.ear === 'pointy') {
    px(hx - 1, ey, spec.dark);
    px(hx - 1, ey + 1, spec.body);
    px(hx + 1, ey, spec.dark);
    px(hx + 1, ey + 1, spec.body);
  } else if (spec.ear === 'round') {
    px(hx - 1, ey + 1, spec.dark);
    px(hx + 1, ey + 1, spec.dark);
  }

  // mouth / food while eating
  if (eating) {
    px(hx + 3, hy + 2, '#8a5a2b');
    px(hx + 2, hy + 2 + (f === 11 ? 1 : 0), '#b07a3a');
  }

  // staff
  if (spec.staff) {
    const wood = '#8b6b3e';
    if (f === FRAME_LAYOUT.attack[0]) {
      for (let i = 0; i < 6; i++) px(10 + i, by - 1, wood);
    } else if (f === FRAME_LAYOUT.hurt[0]) {
      for (let i = 0; i < 6; i++) px(1 + i, 14 - Math.floor(i / 2), wood);
    } else {
      for (let y = by - 8; y <= 15; y++) px(12 - (y > by ? 0 : 0), y, wood);
    }
  }

  if (f === FRAME_LAYOUT.hurt[0]) px(hx + 1, hy - 1, '#ffffff');
}

function drawBird(p, spec, f) {
  const { px, rect, ellipse } = p;
  const flap = f % 2;
  const isDown = f === FRAME_LAYOUT.down[0];
  if (isDown) {
    ellipse(8, 13, 5, 2, spec.body);
    px(10, 12, spec.dark);
    return;
  }
  const dive = f === FRAME_LAYOUT.attack[0];
  ellipse(8, 9, 4, 5, spec.body);
  ellipse(8, 11, 2, 3, spec.belly);
  // wings
  if (flap || dive) {
    rect(1, 5, 4, 2, spec.dark);
    rect(12, 5, 4, 2, spec.dark);
  } else {
    rect(2, 8, 2, 5, spec.dark);
    rect(13, 8, 2, 5, spec.dark);
  }
  // eyes + beak
  ellipse(6, 6, 1, 1, spec.eye);
  ellipse(10, 6, 1, 1, spec.eye);
  px(6, 6, '#101010');
  px(10, 6, '#101010');
  px(8, 8, '#d8a030');
  px(8, 9, '#b08020');
  // ear tufts
  px(4, 2, spec.dark);
  px(12, 2, spec.dark);
  // talons
  px(6, 14, '#d8a030');
  px(10, 14, '#d8a030');
  if (f === FRAME_LAYOUT.hurt[0]) px(6, 6, '#ffffff'), px(10, 6, '#ffffff');
}

function drawCrawler(p, spec, f) {
  const { px, ellipse } = p;
  const phase = f % 2;
  if (f === FRAME_LAYOUT.down[0]) {
    ellipse(8, 14, 5, 1, spec.body);
    return;
  }
  ellipse(8, 11, 6, 3, spec.body);
  ellipse(8, 12, 4, 1, spec.belly);
  for (let i = 0; i < 4; i++) px(3 + i * 3 + phase, 15, spec.dark), px(3 + i * 3 + phase, 14, spec.dark);
  px(13, 10, spec.eye);
  px(11, 10, spec.eye);
}

function makeCreatureSheet(scene, key, spec) {
  const tex = scene.textures.createCanvas(key, FRAME * FRAME_COUNT, FRAME);
  const ctx = tex.getContext();
  for (let f = 0; f < FRAME_COUNT; f++) {
    const p = painter(ctx, f * FRAME, 0);
    if (spec.kind === 'bird') drawBird(p, spec, f);
    else if (spec.kind === 'crawler') drawCrawler(p, spec, f);
    else drawMammal(p, spec, f);
    tex.add(f, 0, f * FRAME, 0, FRAME, FRAME);
  }
  tex.refresh();
}

export function registerAnims(scene, key) {
  for (const [name, frames] of Object.entries(FRAME_LAYOUT)) {
    const animKey = `${key}-${name}`;
    if (scene.anims.exists(animKey)) continue;
    scene.anims.create({
      key: animKey,
      frames: frames.map((frame) => ({ key, frame })),
      frameRate: ANIMS[name].rate,
      repeat: ANIMS[name].repeat,
    });
  }
}

// ---- Props -------------------------------------------------------------------

function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(painter(tex.getContext()), tex.getContext());
  tex.refresh();
}

function shade(color, amt) {
  const r = Math.max(0, Math.min(255, ((color >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (color & 255) + amt));
  return (r << 16) | (g << 8) | b;
}

function makeProps(scene) {
  canvasTex(scene, 'px', 1, 1, ({ px }) => px(0, 0, '#ffffff'));

  for (const [type, info] of Object.entries(BERRY_INFO)) {
    canvasTex(scene, `berry-${type}`, 7, 8, ({ px, ellipse }) => {
      px(3, 0, '#3f6b2a');
      px(4, 0, '#5a8c3a');
      ellipse(3, 4, 3, 3, hex(shade(info.color, -40)));
      ellipse(3, 4, 2, 2, hex(info.color));
      px(2, 3, '#ffffff');
    });
  }

  canvasTex(scene, 'food', 8, 8, ({ px, ellipse, rect }) => {
    rect(1, 1, 6, 2, '#6b4a2a');
    px(3, 0, '#4a3018');
    ellipse(4, 5, 3, 2, '#c08a4a');
    px(3, 4, '#e0b070');
  });

  canvasTex(scene, 'thorn', 16, 12, ({ px }) => {
    const c = '#4a2e3a';
    for (let x = 0; x < 16; x++) px(x, 11, '#3a2430');
    for (const [x, h] of [[2, 6], [6, 9], [10, 7], [13, 10]]) {
      for (let y = 0; y < h; y++) px(x + (y % 3 === 0 ? 1 : 0), 11 - y, c);
      px(x - 1, 11 - h + 2, '#8a5060');
      px(x + 2, 11 - h + 3, '#8a5060');
    }
  });

  canvasTex(scene, 'blight', 24, 6, ({ px, ellipse }) => {
    ellipse(12, 3, 11, 2, '#4a4a44');
    ellipse(12, 3, 8, 1, '#2e2e2a');
    px(5, 1, '#6a6a60');
    px(17, 1, '#6a6a60');
  });

  canvasTex(scene, 'root', 20, 10, ({ px, ellipse }) => {
    ellipse(10, 7, 9, 3, '#5a3a22');
    ellipse(10, 6, 7, 2, '#7a5232');
    px(4, 4, '#7a5232');
    px(15, 3, '#7a5232');
  });

  canvasTex(scene, 'log', 24, 12, ({ ellipse, px }) => {
    ellipse(12, 7, 11, 4, '#6a4a2a');
    ellipse(22, 7, 2, 4, '#c8a070');
    px(22, 7, '#8a6a40');
  });

  canvasTex(scene, 'cage', 24, 24, ({ rect }) => {
    rect(0, 0, 24, 2, '#4a3420');
    rect(0, 22, 24, 2, '#4a3420');
    for (let x = 0; x < 24; x += 4) rect(x, 0, 2, 24, '#6a4a2a');
  });

  canvasTex(scene, 'seed', 8, 8, ({ ellipse, px }) => {
    ellipse(4, 4, 3, 3, '#a8d860');
    ellipse(4, 4, 2, 2, '#e8ffb0');
    px(3, 3, '#ffffff');
  });

  canvasTex(scene, 'rootvein', 12, 10, ({ px }) => {
    const pts = [[1, 8], [2, 7], [3, 6], [4, 6], [5, 5], [6, 4], [7, 4], [8, 3], [9, 2], [10, 1], [5, 7], [6, 8], [7, 8], [3, 3], [4, 4]];
    for (const [x, y] of pts) px(x, y, '#3a2a34');
    px(6, 4, '#5a3a4a');
  });

  canvasTex(scene, 'swoosh', 14, 12, ({ px }) => {
    for (let a = -1.2; a <= 1.2; a += 0.08) {
      const x = Math.round(4 + Math.cos(a) * 8);
      const y = Math.round(6 + Math.sin(a) * 5);
      px(x, y, '#ffffff');
    }
  });

  canvasTex(scene, 'warn', 8, 8, ({ px, rect }) => {
    rect(3, 0, 2, 5, '#f7e26b');
    rect(3, 6, 2, 2, '#f7e26b');
    px(2, 1, '#f7e26b');
  });
}

// ---- Backdrops ---------------------------------------------------------------

export const BACKDROPS = {
  grove: { sky: ['#8fd3f4', '#dff4e0'], far: '#5f9a5a', near: '#3e7040', ground: '#4f8a3a', dirt: '#6b4a2a', lanterns: true },
  'grove-dusk': { sky: ['#f4a261', '#6d597a'], far: '#4a5a44', near: '#2f3d2c', ground: '#3f5a2f', dirt: '#4a3420', smoke: true },
  'grove-night': { sky: ['#1b1f3b', '#39406b'], far: '#26344a', near: '#16202e', ground: '#233822', dirt: '#2a2018', stars: true },
  forest: { sky: ['#9bc4b0', '#d8e6c8'], far: '#4e7a58', near: '#2f5238', ground: '#3f6a34', dirt: '#5a3e24' },
  hollow: { sky: ['#f6d7a7', '#e9efc7'], far: '#7aa05c', near: '#557d3e', ground: '#5d8f3c', dirt: '#6b4a2a', rows: true },
  canopy: { sky: ['#b4e0c8', '#e8f6d8'], far: '#3f7a4a', near: '#2a5a34', ground: '#6a4a2a', dirt: '#4a3018', branch: true },
  thorns: { sky: ['#b9a4c7', '#e3d6c9'], far: '#5a4a5a', near: '#3a2a3a', ground: '#4a4a34', dirt: '#3a2a20', thorns: true },
  campfire: { sky: ['#101628', '#2a2a48'], far: '#1e2a38', near: '#121a24', ground: '#1f2a1c', dirt: '#2a2018', fire: true, stars: true },
  ruins: { sky: ['#a8b8c8', '#dcd8cc'], far: '#6a7466', near: '#4a5248', ground: '#6a6a5a', dirt: '#4a4a3a', pillars: true },
  council: { sky: ['#3a3040', '#6a5a5a'], far: '#4a3a3a', near: '#2a2020', ground: '#4a4040', dirt: '#2a2020', pillars: true },
  blight: { sky: ['#a8a898', '#cfcab8'], far: '#6a6a5c', near: '#4a4a40', ground: '#5a5a48', dirt: '#3a3a30', grey: true },
  'blight-deep': { sky: ['#6a6a64', '#9a968a'], far: '#4a4a44', near: '#303030', ground: '#48483e', dirt: '#2a2a24', grey: true },
  camp: { sky: ['#c8b890', '#e8dcc0'], far: '#5a6a44', near: '#3a4a2c', ground: '#5a5a38', dirt: '#4a3a24', tents: true },
  cache: { sky: ['#302830', '#50443c'], far: '#3a3028', near: '#221c18', ground: '#3a3228', dirt: '#2a221c' },
  ash: { sky: ['#4a4040', '#8a7a70'], far: '#3a3434', near: '#241f1f', ground: '#3c3636', dirt: '#2a2424', smoke: true, grey: true },
};

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function makeBackdrop(scene, key, spec) {
  const W = 192;
  const H = 216;
  // Sky layer (tileable horizontally)
  canvasTex(scene, `bg-${key}-sky`, W, H, ({ px }, ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, spec.sky[0]);
    g.addColorStop(1, spec.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // posterise the gradient into bands for an 8-bit feel
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) for (let c = 0; c < 3; c++) img.data[i + c] = Math.round(img.data[i + c] / 24) * 24;
    ctx.putImageData(img, 0, 0);
    const r = rng(key.length * 97 + 11);
    if (spec.stars) for (let i = 0; i < 40; i++) px(Math.floor(r() * W), Math.floor(r() * H * 0.6), '#e8e8ff');
    if (spec.smoke) for (let i = 0; i < 30; i++) px(Math.floor(r() * W), Math.floor(r() * H * 0.5), '#9a8a88');
  });
  // Far trees
  canvasTex(scene, `bg-${key}-far`, W, H, ({ px, rect, ellipse }) => {
    const r = rng(key.length * 31 + 7);
    const base = H - 60;
    for (let x = -10; x < W + 10; x += 14 + Math.floor(r() * 10)) {
      const h = 50 + Math.floor(r() * 50);
      if (spec.pillars && r() > 0.5) {
        rect(x, base - h, 8, h + 60, spec.far);
        rect(x - 2, base - h, 12, 3, spec.far);
        continue;
      }
      rect(x + 3, base - h + 20, 3, h, spec.far);
      ellipse(x + 4, base - h + 16, 8 + Math.floor(r() * 4), 14 + Math.floor(r() * 6), spec.far);
    }
    rect(0, base, W, 60, spec.far);
    if (spec.tents) for (let x = 20; x < W; x += 60) for (let y = 0; y < 14; y++) rect(x - y, base - 14 + y, y * 2 + 1, 1, '#8a7a5a');
  });
  // Near trees / foreground dressing
  canvasTex(scene, `bg-${key}-near`, W, H, ({ px, rect, ellipse }) => {
    const r = rng(key.length * 53 + 3);
    const base = H - 40;
    for (let x = 0; x < W; x += 40 + Math.floor(r() * 30)) {
      const h = 90 + Math.floor(r() * 50);
      rect(x, base - h, 7, h + 40, spec.near);
      ellipse(x + 3, base - h, 16, 12, spec.near);
      if (spec.lanterns) px(x + 12, base - h + 16, '#ffd060'), px(x - 6, base - h + 22, '#ff9050');
      if (spec.branch) rect(0, base - h + 30, W, 3, spec.near);
    }
    if (spec.grey) for (let i = 0; i < 20; i++) px(Math.floor(r() * W), base + Math.floor(r() * 30), '#8a8a80');
    if (spec.thorns)
      for (let x = 0; x < W; x += 6) for (let y = 0; y < 10; y++) if (r() > 0.6) px(x + Math.floor(r() * 4), base - 12 + y, '#5a3a4a');
    if (spec.rows) for (let x = 6; x < W; x += 16) ellipse(x, base + 2, 5, 4, '#3e6a2e'), px(x, base, '#d04040'), px(x + 2, base + 2, '#5060d0');
    if (spec.fire) {
      ellipse(W / 2, base + 16, 8, 3, '#4a3020');
      ellipse(W / 2, base + 10, 4, 6, '#e8553d');
      ellipse(W / 2, base + 12, 2, 3, '#f7e26b');
    }
  });
  // Ground tile
  canvasTex(scene, `ground-${key}`, 16, 16, ({ px, rect }) => {
    rect(0, 0, 16, 16, spec.dirt);
    rect(0, 0, 16, 3, spec.ground);
    const r = rng(key.length * 7 + 1);
    for (let i = 0; i < 8; i++) px(Math.floor(r() * 16), 3 + Math.floor(r() * 13), spec.grey ? '#5a5a50' : '#7a5a3a');
    for (let x = 0; x < 16; x += 3) px(x, 3, spec.ground);
  });
}

export function generateAll(scene) {
  for (const [key, spec] of Object.entries(SPRITES)) {
    if (!scene.textures.exists(key)) makeCreatureSheet(scene, key, spec);
    registerAnims(scene, key);
  }
  makeProps(scene);
  for (const [key, spec] of Object.entries(BACKDROPS)) makeBackdrop(scene, key, spec);
}
