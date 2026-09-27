// Travelling roster. Berry roles per the cast document (brief §5).
// Mosswhisker is deliberately absent: he stays at the hollow and is never part
// of the stamina economy.
//
// `joinsAt` is the landmark index (0-based) where they join the travelling party.
// Grizz/Spines/Chip/Kit/Chipper at landmark 5 and Bandit at landmark 10 are
// GAME-ORIGINAL groupings (brief §2), not book canon.

export const COMPANIONS = {
  rusty: {
    name: 'Rusty',
    berries: ['fleet', 'nimble'],
    role: 'Mobile mender',
    maxStamina: 100,
    joinsAt: 0,
  },
  grizz: {
    name: 'Grizz',
    berries: ['stout', 'bark'],
    role: 'Tank',
    maxStamina: 140,
    joinsAt: 4,
  },
  spines: {
    name: 'Spines',
    berries: ['glow'],
    role: 'Sentinel',
    maxStamina: 90,
    joinsAt: 4,
  },
  chip: {
    name: 'Chip',
    berries: ['flare', 'fleet'],
    role: 'Striker',
    maxStamina: 110,
    joinsAt: 4,
  },
  kit: {
    name: 'Kit',
    berries: ['fleet'], // tentative per cast doc
    role: 'Too young to fight',
    maxStamina: 60,
    joinsAt: 4,
    young: true,
  },
  chipper: {
    name: 'Chipper',
    berries: ['fleet'], // tentative per cast doc
    role: 'Too young to fight',
    maxStamina: 60,
    joinsAt: 4,
    young: true,
  },
  bandit: {
    name: 'Bandit',
    berries: ['shadow'],
    role: 'Scout',
    maxStamina: 90,
    joinsAt: 9,
  },
};

export const ROSTER_ORDER = ['rusty', 'grizz', 'spines', 'chip', 'bandit', 'kit', 'chipper'];

export const BERRY_TYPES = ['fleet', 'nimble', 'stout', 'bark', 'glow', 'whisper', 'flare', 'shadow'];

export const BERRY_INFO = {
  fleet: { name: 'Fleet', color: 0x5fc3e4, effect: 'Speed' },
  nimble: { name: 'Nimble', color: 0x9be36b, effect: 'Agility — higher jumps, glancing blows' },
  stout: { name: 'Stout', color: 0xd9a05b, effect: 'Strength' },
  bark: { name: 'Bark', color: 0x8a6a45, effect: 'Toughness' },
  glow: { name: 'Glow', color: 0xf7e26b, effect: 'Perception' },
  whisper: { name: 'Whisper', color: 0xc9b6f2, effect: 'Quiet — calms and soothes' },
  flare: { name: 'Flare', color: 0xe8553d, effect: 'Burst of heat and force' },
  shadow: { name: 'Shadow', color: 0x5b4e7a, effect: 'Stealth' },
};
