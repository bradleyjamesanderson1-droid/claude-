// V1 route: eleven landmarks, one per chapter, Ch. 2–12 in book order (brief §4).
// Each landmark is a list of steps the Director plays in order.
//
// Encounter-to-landmark assignment beyond the brief's §6 is a PROPOSAL (brief
// §10). Specifically proposed here, not locked:
//   - Landmark 9 (Ashfang's Mark) carries the one Protect encounter, as the
//     "implied threat" — enforcers sweeping the survivors' camp after the meal
//     choice. It could equally stay a pure story/choice beat.

import { VULNERABLE_ID } from '../config.js';

export const LANDMARKS = [
  {
    id: 'outer-grove',
    chapter: 2,
    name: 'Outer Grove',
    subtitle: 'Founding Day',
    bg: 'grove',
    steps: [
      { type: 'story', id: 'ch2_founding' },
      { type: 'encounter', scene: 'Forage', config: { light: true, bg: 'grove', duration: 45, title: 'Gather for the feast' } },
      { type: 'story', id: 'ch2_feast' },
    ],
  },
  {
    id: 'ash-in-the-wind',
    chapter: 3,
    name: 'Ash in the Wind',
    subtitle: 'The Heartseed',
    bg: 'grove-dusk',
    steps: [{ type: 'story', id: 'ch3' }],
  },
  {
    id: 'owls-circle',
    chapter: 4,
    name: 'When the Owls Circle',
    subtitle: 'Flight',
    bg: 'grove-night',
    steps: [
      { type: 'story', id: 'ch4_arrive' },
      { type: 'encounter', scene: 'Chase', config: { duration: 60, title: 'Run!' } },
      { type: 'story', id: 'ch4_after' },
    ],
  },
  {
    id: 'mosswhisker-hollow',
    chapter: 5,
    name: "Mosswhisker's Hollow",
    subtitle: 'Berrycraft',
    bg: 'hollow',
    steps: [
      { type: 'story', id: 'ch5_intro' },
      { type: 'tutorial', scene: 'Hollow' },
      { type: 'story', id: 'ch5_outro' },
    ],
  },
  {
    id: 'echoes-canopy',
    chapter: 6,
    name: 'Echoes of the Canopy',
    subtitle: 'The rescue party',
    bg: 'canopy',
    steps: [{ type: 'story', id: 'ch6' }],
  },
  {
    id: 'rescue-thorns',
    chapter: 7,
    name: 'Rescue in the Thorns',
    subtitle: 'First fight',
    bg: 'thorns',
    steps: [
      { type: 'story', id: 'ch7_pre' },
      {
        type: 'encounter',
        scene: 'Skirmish',
        config: { mode: 'rescue', tutorial: true, bg: 'thorns', title: 'Rescue in the Thorns' },
      },
      { type: 'story', id: 'ch7_post' },
    ],
  },
  {
    id: 'names-fire',
    chapter: 8,
    name: 'Names in the Fire',
    subtitle: 'The last pure Heartseed',
    bg: 'campfire',
    steps: [{ type: 'story', id: 'ch8' }],
  },
  {
    id: 'council-was',
    chapter: 9,
    name: 'The Council That Was',
    subtitle: 'Canopy Keep',
    bg: 'ruins',
    steps: [
      { type: 'story', id: 'ch9_arrive' },
      { type: 'encounter', scene: 'Forage', config: { light: false, bg: 'ruins', duration: 60, title: 'Forage the ruins' } },
      { type: 'story', id: 'ch9_vision' },
    ],
  },
  {
    id: 'ashfang-mark',
    chapter: 10,
    name: "Ashfang's Mark",
    subtitle: 'A scant meal',
    bg: 'blight',
    steps: [
      { type: 'story', id: 'ch10' },
      { type: 'encounter', scene: 'Protect', config: { bg: 'blight', duration: 60, protectId: VULNERABLE_ID, title: 'Keep them safe' } },
      { type: 'story', id: 'ch10_after' },
    ],
  },
  {
    id: 'the-cache',
    chapter: 11,
    name: 'The Cache',
    subtitle: 'Resistance camp',
    bg: 'camp',
    steps: [{ type: 'story', id: 'ch11' }],
  },
  {
    id: 'price-shortcut',
    chapter: 12,
    name: 'Price of the Shortcut',
    subtitle: '',
    bg: 'blight-deep',
    steps: [
      { type: 'story', id: 'ch12_pre' },
      { type: 'encounter', scene: 'Skirmish', config: { mode: 'climax', bg: 'blight-deep', title: 'Price of the Shortcut' } },
      { type: 'branch' }, // plays ch12_rootvein or ch12_refuse, then the ending
    ],
  },
];
