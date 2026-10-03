// Sprite manifest — the contract between placeholder and final art (brief §8).
//
// Every character sheet is a single horizontal strip of FRAME_COUNT frames,
// each FRAME x FRAME pixels, in the FRAME_LAYOUT order below. To swap in final
// art: drop `public/sprites/<key>.png` in with the same frame size/count/order
// and set `file: '<key>.png'` on the entry. Nothing else changes.

export const FRAME = 16;
export const FRAME_COUNT = 13;

// index -> meaning. Final art must keep this order.
export const FRAME_LAYOUT = {
  idle: [0, 1],
  run: [2, 3, 4, 5],
  jump: [6],
  attack: [7],
  hurt: [8],
  down: [9], // collapsed
  eat: [10, 11],
  duck: [12], // crouched low (dodging swoops)
};

export const ANIMS = {
  idle: { rate: 3, repeat: -1 },
  run: { rate: 10, repeat: -1 },
  jump: { rate: 1, repeat: 0 },
  attack: { rate: 1, repeat: 0 },
  hurt: { rate: 1, repeat: 0 },
  down: { rate: 1, repeat: 0 },
  eat: { rate: 5, repeat: -1 },
  duck: { rate: 1, repeat: 0 },
};

// Placeholder specs: colour + silhouette hints only. Species are deliberately
// generic — final art comes from Bradley's own character references.
export const SPRITES = {
  rusty: { file: null, body: '#c8642d', belly: '#f0c08a', dark: '#6e3316', ear: 'pointy', tail: 'bushy', size: 'm', staff: true },
  grizz: { file: null, body: '#6b4a2f', belly: '#9c7650', dark: '#3a2616', ear: 'round', tail: 'short', size: 'l' },
  spines: { file: null, body: '#8a7b64', belly: '#d8c7a3', dark: '#4b4034', ear: 'round', tail: 'none', size: 'm', spines: true },
  chip: { file: null, body: '#b0552e', belly: '#ecd2a8', dark: '#5a2a14', ear: 'round', tail: 'stripe', size: 'm' },
  kit: { file: null, body: '#d9884a', belly: '#f7dcb6', dark: '#7a4320', ear: 'pointy', tail: 'bushy', size: 's' },
  chipper: { file: null, body: '#c07a44', belly: '#f2dab4', dark: '#6a3c1c', ear: 'round', tail: 'stripe', size: 's' },
  bandit: { file: null, body: '#7d7f86', belly: '#c9cbd0', dark: '#2d2e33', ear: 'round', tail: 'ringed', size: 'm', mask: true },
  mosswhisker: { file: null, body: '#8f9a78', belly: '#d4d9bf', dark: '#4b5238', ear: 'round', tail: 'long', size: 'm', whiskers: true },
  elder: { file: null, body: '#a78a6a', belly: '#e2d2b6', dark: '#5a4630', ear: 'pointy', tail: 'bushy', size: 'm' },
  friend: { file: null, body: '#9c6b4e', belly: '#e8c9a8', dark: '#553524', ear: 'round', tail: 'bushy', size: 'm' },
  rebel: { file: null, body: '#6f6a64', belly: '#aaa39a', dark: '#35322e', ear: 'pointy', tail: 'bushy', size: 'm' },
  survivor: { file: null, body: '#7c7466', belly: '#a69f92', dark: '#3e3a33', ear: 'pointy', tail: 'short', size: 'm', mangy: true },
  ashfang: { file: null, body: '#3b3836', belly: '#5b5652', dark: '#161413', ear: 'pointy', tail: 'bushy', size: 'l', eye: '#e8553d', mangy: true },
  enforcer: { file: null, kind: 'bird', body: '#4a4458', belly: '#8d86a0', dark: '#1f1b28', eye: '#f7c948' },
  crawler: { file: null, kind: 'crawler', body: '#555a4c', belly: '#7b8070', dark: '#262a21', eye: '#c8e060' },
};
