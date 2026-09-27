// Global display + balance configuration.
//
// BALANCE numbers are PROPOSED STARTING VALUES (brief §10: "propose starting
// numbers and expect them to be iterated"). Everything tunable lives here so a
// balancing pass never has to touch scene code.

// Low native resolution, integer-scaled with nearest-neighbour for a crisp 8-bit look.
export const PORTRAIT = { width: 216, height: 384 }; // trail / story / camp screens
export const LANDSCAPE = { width: 384, height: 216 }; // side-scroll encounters

export const FONT = '"Press Start 2P", monospace';

export const SAVE_KEY = 'woodland-rebellion-v1';

// Bump this whenever a change would break saves from an older build (renamed
// state fields, reordered landmark steps, ...). Older saves are then refused
// with a clear message on the title screen instead of loading into a broken run.
export const SAVE_VERSION = 1;

// Test builds show the chapter select. Turn off for a public launch.
export const TEST_BUILD = true;

// Where the in-game Feedback button sends testers. Set ONE of these:
//   url:   a form (e.g. a Google Form). The report is copied to the clipboard first.
//   email: an address. The report opens pre-filled in the tester's mail app.
// Left empty, testers get "Copy report" and their device's Share sheet.
export const FEEDBACK = { url: '', email: '' };

// Injected at build time by vite.config.js.
/* global __APP_VERSION__, __BUILD_SHA__, __BUILD_DATE__ */
export const BUILD = {
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
  sha: typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : 'local',
  date: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '',
};

// Open question in the book (brief §10): Kit vs. Chipper as "the vulnerable one".
// Everything that needs "the vulnerable one" reads this — nothing hard-codes Kit.
export const VULNERABLE_ID = 'kit';

export const BALANCE = {
  startFood: 24,

  // Upfront stamina cost of drawing a berry, drain per second while it is
  // active, and how long the effect lasts (seconds).
  berries: {
    fleet: { cost: 12, drain: 1.0, duration: 10 },
    nimble: { cost: 10, drain: 1.0, duration: 10 },
    stout: { cost: 14, drain: 0.8, duration: 12 },
    bark: { cost: 14, drain: 0.8, duration: 12 },
    glow: { cost: 8, drain: 0.5, duration: 14 },
    whisper: { cost: 8, drain: 0.5, duration: 10 },
    flare: { cost: 18, drain: 1.5, duration: 8 },
    shadow: { cost: 12, drain: 1.0, duration: 8 },
  },

  // Stacking two berries: the second draw costs more, and while both are active
  // every active berry drains this many times faster. Burst, then crash.
  stack: { secondCostMult: 1.5, drainMult: 3 },

  startPouch: { fleet: 6, nimble: 6, stout: 3, bark: 3, glow: 3, whisper: 2, flare: 3, shadow: 2 },

  // Berries only grow in healthy ground. Index = landmark (0..10).
  // Scales forage yields and road finds: plentiful at landmark 1, tight by 11.
  abundance: [1.0, 1.0, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],

  // Blight flavour starts intensifying from landmark 5 (index 4).
  blightFrom: 4,

  travel: {
    daysPerLeg: 2, // steady pace
    hardPaceDays: 1, // hard pace gets there faster...
    hardPaceStaminaPerDay: 10, // ...but costs every traveller stamina
    carryExtraDays: 1, // carrying a collapsed companion slows the party
    rationPerMember: 1, // food per travelling member per day
    carryExtraFood: 1, // extra food per carried companion per day
    starveStaminaLoss: 10, // per unfed member per day
  },

  rest: {
    staminaFed: 25, // per member per rest day with a full ration
    staminaHungry: 5, // per member who went unfed
    lowFoodFactor: 0.6, // recovery multiplier when food is running low
    lowFoodDays: 2, // "low" = fewer than this many days of rations left
  },

  meal: { food: 1, stamina: 12 }, // an extra meal: 1 food -> +12 stamina

  // The on-screen receipt after an honest fight: whoever drew on a berry eats.
  ravenous: { foodPerEater: 2, staminaPerFood: 10 },

  skirmish: {
    enemyHit: 8, // stamina lost when an enforcer lands a blow
    championHit: 14,
    nimbleHitFactor: 0.5,
    staffKnock: 160, // base knockback velocity
    fleetSpeedMult: 1.6,
    nimbleJumpMult: 1.3,
    stackPowerMult: 1.8, // stacked berries compound staff force
    // Rootvein is offered once, when Rusty's ledger is genuinely low.
    rootveinOfferAt: 0.25, // fraction of max stamina
    rootveinOfferAtNoBerries: 0.4, // ...or this, if Fleet and Nimble are gone
    climaxSpentCap: 0.6, // "already spent": Rusty enters the climax at <= this
  },

  // Rootvein never costs stamina or food. It silently drains Colour instead.
  // Colour is a hidden 0..1 value, never shown as a number/bar (brief §3/§9).
  rootveinColourDrain: 0.55,
  colourDriftAfterRootvein: 0.15, // further permanent fade over the aftermath
};
