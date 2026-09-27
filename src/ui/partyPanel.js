// Visible ledger: every traveller's stamina, the food store and the berry pouch.
// (Colour is intentionally absent — it has no UI representation, ever.)
import { txt } from './text.js';
import { COMPANIONS, ROSTER_ORDER, BERRY_TYPES, BERRY_INFO } from '../data/companions.js';
import { maxStamina, dailyRation, isFoodLow, STATUS } from '../state/ledger.js';

const STATUS_TAG = { active: '', collapsed: 'DOWN', carried: 'CARRIED', home: 'HOME' };

export function staminaColor(frac) {
  return frac > 0.5 ? 0x7bd36a : frac > 0.25 ? 0xf2c14e : 0xe8553d;
}

export class PartyPanel {
  constructor(scene, x, y, w) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = w;
    this.objs = [];
    this.rowY = {};
  }

  clear() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
  }

  draw(state) {
    this.clear();
    const s = this.scene;
    const add = (o) => (this.objs.push(o), o);
    let y = this.y;
    const barX = this.x + 60;
    const barW = this.w - 60 - 50;
    for (const id of ROSTER_ORDER) {
      const m = state.party[id];
      if (!m) continue;
      const home = m.status === STATUS.HOME;
      add(txt(s, this.x, y, COMPANIONS[id].name, { color: home ? '#6a6058' : '#f4efe1' }));
      if (!home) {
        const frac = Math.min(1, m.stamina / maxStamina(id));
        add(s.add.rectangle(barX, y, barW, 7, 0x3a302a).setOrigin(0));
        add(s.add.rectangle(barX, y, Math.max(0, Math.round(barW * frac)), 7, staminaColor(frac)).setOrigin(0));
        add(txt(s, barX + barW + 4, y, `${Math.round(m.stamina)}`, { color: '#d8cbb0' }));
      }
      const tag = STATUS_TAG[m.status];
      if (tag) add(txt(s, home ? barX : barX + 2, y, tag, { color: home ? '#6a6058' : '#ffd0b0', stroke: '#1a1410' }));
      this.rowY[id] = y;
      y += 12;
    }
    y += 4;
    const low = isFoodLow(state);
    add(txt(s, this.x, y, `Food ${state.food}`, { color: low ? '#ff9a70' : '#f4efe1' }));
    add(txt(s, this.x + 80, y, `-${dailyRation(state)}/day`, { color: '#a89a84' }));
    if (low) add(txt(s, this.x + this.w, y, 'LOW', { origin: [1, 0], color: '#ff9a70' }));
    y += 14;
    BERRY_TYPES.forEach((type, n) => {
      const cx = this.x + (n % 4) * (this.w / 4);
      const cy = y + Math.floor(n / 4) * 14;
      add(s.add.image(cx + 3, cy + 3, `berry-${type}`).setOrigin(0.5));
      const cnt = state.pouch[type] || 0;
      add(txt(s, cx + 10, cy, `${BERRY_INFO[type].name.slice(0, 3)}${cnt}`, { color: cnt ? '#f4efe1' : '#6a6058' }));
    });
    this.bottom = y + 28;
    if (low) {
      add(txt(s, this.x, this.bottom, 'Food is low: rest recovers less.', { color: '#ff9a70' }));
      this.bottom += 12;
    }
    return this.bottom;
  }
}
