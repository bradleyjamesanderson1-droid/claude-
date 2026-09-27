import Phaser from 'phaser';
import { txt } from '../ui/text.js';
import { button, Menu } from '../ui/button.js';
import { BUILD, FEEDBACK } from '../config.js';
import { getState, saveStatus, load } from '../state/store.js';
import { LANDMARKS } from '../data/landmarks.js';
import { COMPANIONS } from '../data/companions.js';
import { goto } from '../ui/nav.js';

/**
 * Tester feedback. Builds a short report (build, where they are, device) and
 * sends it wherever FEEDBACK in config.js points. With nothing configured, it
 * falls back to copy / the device Share sheet.
 */
export function buildReport() {
  if (saveStatus() === 'ok') load();
  const s = getState();
  const lm = LANDMARKS[s.landmark];
  const party = Object.entries(s.party)
    .map(([id, m]) => `${COMPANIONS[id].name} ${Math.round(m.stamina)}${m.status === 'active' ? '' : ` (${m.status})`}`)
    .join(', ');
  const ending = s.phase === 'ending' ? (s.rootveinUsed ? 'Rootvein ending' : 'Refuse ending') : 'not reached';
  const touch = matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse/keyboard';
  return [
    'The Woodland Rebellion - test feedback',
    `Build: v${BUILD.version} (${BUILD.sha}) ${BUILD.date}`,
    `Where: Ch. ${lm.chapter} ${lm.name}, step ${s.step}, ${s.phase}, day ${s.day}${s.flags.chapterSelect ? ' [chapter select]' : ''}`,
    `Ending: ${ending}`,
    `Party: ${party}`,
    `Food ${s.food}`,
    `Device: ${touch}, ${screen.width}x${screen.height}, ${navigator.userAgent}`,
    '',
    'What happened:',
    '',
    'What did you expect / how did it feel:',
    '',
  ].join('\n');
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export default class FeedbackScene extends Phaser.Scene {
  constructor() {
    super('Feedback');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.fadeIn(200);
    const report = buildReport();
    const subject = `Woodland Rebellion feedback v${BUILD.version} (${BUILD.sha})`;
    txt(this, W / 2, 14, 'FEEDBACK', { origin: 0.5, color: '#ffe6a8' });
    txt(this, 10, 30, 'Tell us what broke, what confused you, what felt good. This report is attached:', {
      wrap: W - 20,
      color: '#d8cbb0',
    });
    const preview = report.split('\n').slice(1, 4).join('\n');
    txt(this, 10, 80, preview, { wrap: W - 20, color: '#8a8074', lineSpacing: 3 });
    const status = txt(this, W / 2, H - 150, '', { origin: 0.5, color: '#a8f0a0', wrap: W - 20, align: 'center' });

    const send = async () => {
      if (FEEDBACK.url) {
        await copy(report);
        status.setText('Report copied. Paste it into the form.');
        window.open(FEEDBACK.url, '_blank');
      } else if (FEEDBACK.email) {
        location.href = `mailto:${FEEDBACK.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
      } else if (navigator.share) {
        try {
          await navigator.share({ title: subject, text: report });
        } catch {
          /* cancelled */
        }
      } else {
        location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(report)}`;
      }
    };
    const b1 = button(this, 20, H - 128, W - 40, 26, 'Send feedback', send);
    const b2 = button(this, 20, H - 94, W - 40, 26, 'Copy report', async () => {
      status.setText((await copy(report)) ? 'Copied. Paste it wherever you send feedback.' : "Couldn't copy on this device.");
    });
    const b3 = button(this, 20, H - 60, W - 40, 26, 'Back', () => goto(this, 'Title'));
    new Menu(this, [b1, b2, b3]);
    txt(this, W / 2, H - 16, `v${BUILD.version} (${BUILD.sha})`, { origin: 0.5, color: '#5a5048' });
  }
}
