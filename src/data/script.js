// ============================================================================
// DIALOGUE — ALL LINES HERE ARE DRAFTS FOR REVIEW (brief §10).
// Nothing in this file is final copy. Tone-sensitive beats are marked REVIEW.
// See docs/DIALOGUE_REVIEW.md for the lines that most need Bradley's eye.
//
// Hard constraints honoured while drafting (brief §2):
//  - No chosen one: nobody calls Rusty special, destined, or selected.
//  - No power-of-friendship: costs are stamina and food, never feelings.
//  - Rusty is a competent novice — he survives, he doesn't dominate.
//  - Nobody acts foolish to move the plot.
//
// Command format (interpreted by StoryScene):
//   { bg: 'key' }                     change backdrop
//   { show: ['rusty', 'chip'] }       who stands on stage
//   { s: 'speaker', t: 'text' }       a line (no `s` = narration)
//   { s, warm: '...', cold: '...' }   line that shifts as hidden Colour drains
//   { choice: [{ label, flag, value, effects, then: [...] }] }
//   { join: ['id', ...] }             companions join the travelling party
//   { effects: { food: -2, stamina: { rusty: -5 }, berries: { fleet: 1 } } }
//   { fx: 'shake' | 'flash' | 'fade' }
//   { eat: ['id'] }                   show someone eating on stage
// Tokens: {V} = the vulnerable companion's name, {FRIEND} = the taken friend.
// ============================================================================

// PLACEHOLDER: this brief doesn't name the friend taken in Ch. 4. Replace.
export const FRIEND_NAME = 'Burr';

export const SPEAKERS = {
  rusty: 'Rusty',
  mosswhisker: 'Mosswhisker',
  chip: 'Chip',
  grizz: 'Grizz',
  spines: 'Spines',
  kit: 'Kit',
  chipper: 'Chipper',
  bandit: 'Bandit',
  rebel: 'Wounded rebel',
  elder: 'Grove elder',
  survivor: 'Survivor',
  enforcer: 'Enforcer',
  ashfang: 'Ashfang',
  friend: FRIEND_NAME,
};

export const SCRIPTS = {
  // --- Ch. 1: cold open. Ashfang's POV, non-interactive (brief §1). ---------
  // PLACEHOLDER: atmosphere only. Replace with the book's actual Ch. 1 beats.
  ch1: [
    { bg: 'ash' },
    { show: ['ashfang'] },
    { t: 'Far from the groves, where nothing grows any more...' },
    { t: 'Something walks the ash.' },
    { s: 'ashfang', t: 'Another root gone grey.' },
    { s: 'ashfang', t: 'Good.' },
    { fx: 'fade' },
  ],

  // --- Landmark 1 / Ch. 2 ----------------------------------------------------
  ch2_founding: [
    { bg: 'grove' },
    { show: ['rusty', 'elder'] },
    { t: 'The Outer Grove. Founding Day.' },
    { t: 'Lanterns in the branches. Everyone busy.' },
    { s: 'elder', t: "Rusty! The feast table's short. Fetch what you can before the sun's high." },
    { s: 'rusty', t: "On it. Berries, nuts, anything that isn't moving." },
    { t: 'Arrow keys / A-D to move. Up, W or Space to jump. On a phone, use the buttons.' },
  ],
  ch2_feast: [
    { bg: 'grove' },
    { show: ['rusty', 'elder'] },
    { t: 'The feast. The whole grove at one long table. Singing somewhere under the talk.' },
    { s: 'elder', t: 'Tenth slice, Rusty. Your job this year.' },
    { t: 'Rusty carries the slice to the old roots and drops it in, the way it has always been done.' },
    { s: 'rusty', t: 'There. Now can I eat mine?' },
    { s: 'elder', t: 'Go on.' },
    { eat: ['rusty'] },
  ],

  // --- Landmark 2 / Ch. 3 ----------------------------------------------------
  ch3: [
    { bg: 'grove-dusk' },
    { show: ['rusty'] },
    { t: 'Dusk. The smell of smoke from somewhere that should not be burning.' },
    { show: ['rusty', 'rebel'] },
    { t: 'A stranger staggers out of the undergrowth, grey with ash.' },
    { s: 'rusty', t: 'Hey — hey, sit down. You need water.' },
    { s: 'rebel', t: "No time. Take it. Take it and keep it hidden." },
    { t: 'Something small and warm is pressed into his paws. A seed.' },
    { s: 'rebel', t: "Don't let them have it. Please." },
    { t: 'The rebel does not get up again.' },
    { show: ['rusty'] },
    { s: 'rusty', t: "...I don't even know your name." },
    { t: 'Rusty keeps the seed. There is nobody else to give it to.' },
  ],

  // --- Landmark 3 / Ch. 4 ----------------------------------------------------
  ch4_arrive: [
    { bg: 'grove-night' },
    { show: ['rusty', 'friend'] },
    { t: 'Night. Wings over the grove — too many, too quiet.' },
    { s: 'friend', t: 'Rusty. Owls. Enforcers. They are asking about a seed.' },
    { show: ['rusty', 'friend', 'enforcer'] },
    { s: 'enforcer', t: 'The seed. Bring it out, and nobody else has to come with us.' },
    { s: 'friend', t: "Go! You're faster than me. GO!" },
    { fx: 'shake' },
    { t: `They take ${FRIEND_NAME}. Rusty runs.` },
    { t: 'Jump the roots. Duck the swoops. You cannot fight them — just get clear.' },
  ],
  ch4_after: [
    { bg: 'forest' },
    { show: ['rusty'] },
    { t: 'The wings fall behind. The grove is gone from sight for the first time in his life.' },
    { s: 'rusty', t: `${FRIEND_NAME}...` },
    { s: 'rusty', t: "I need someone who knows what this seed is. Someone who knows what to DO." },
    { t: 'There is one name the grove only ever says quietly. Mosswhisker, out in the hollow.' },
  ],

  // --- Landmark 4 / Ch. 5 ----------------------------------------------------
  ch5_intro: [
    { bg: 'hollow' },
    { show: ['rusty', 'mosswhisker'] },
    { t: "Mosswhisker's Hollow. Rows of bushes, tended like crops." },
    { s: 'mosswhisker', t: "You ran here on an empty belly. I can hear it from here. Sit." },
    { s: 'rusty', t: "They took my friend. I need to fight them." },
    { s: 'mosswhisker', t: "You need to eat. Then you need to learn what fighting costs." },
    { s: 'mosswhisker', t: 'Berrycraft is farming. My mother taught me, hers taught her. No magic words.' },
    { s: 'mosswhisker', t: 'A berry lends you something. You pay it back out of yourself. Every time.' },
  ],
  ch5_outro: [
    { bg: 'hollow' },
    { show: ['rusty', 'mosswhisker'] },
    { s: 'mosswhisker', t: 'Take. Pay. Eat. Rest. That is the whole of it.' },
    { s: 'mosswhisker', t: 'Anyone who offers you the first without the second is selling you something.' },
    { s: 'rusty', t: "You're not coming?" },
    { s: 'mosswhisker', t: 'Somebody has to tend these rows. Come back hungry. Come back at all.' },
    { effects: { berries: { fleet: 2, nimble: 2 }, food: 4 } },
    { t: 'Mosswhisker presses a pouch of berries and a bundle of food on him. +2 Fleet, +2 Nimble, +4 food.' },
  ],

  // --- Landmark 5 / Ch. 6 ----------------------------------------------------
  // Game-original grouping (brief §2): the book confirms only Chip here.
  ch6: [
    { bg: 'canopy' },
    { show: ['rusty', 'chip'] },
    { t: 'High in the canopy, voices. A rebellion, it turns out, is mostly whispering.' },
    { s: 'chip', t: "You're the one from the Outer Grove. The Owl's lot took one of yours too." },
    { s: 'rusty', t: `${FRIEND_NAME}. Do you know where?` },
    { s: 'chip', t: 'The thorn pens. We go at first light. Can you hold a staff?' },
    { s: 'rusty', t: "Mosswhisker's been teaching me. Barely." },
    { s: 'chip', t: "Barely's more than most. You'll do what you're told and you'll eat when I say." },
    { show: ['rusty', 'grizz', 'spines', 'chip'] },
    { s: 'grizz', t: "Grizz. I stand in front. You stand behind me." },
    { s: 'spines', t: "Spines. If something's coming, I'll see it before you do." },
    { show: ['rusty', 'chip', 'kit', 'chipper'] },
    { s: 'kit', t: "And we're coming too." },
    { s: 'chip', t: "You're coming as far as the ridge and no further." },
    { s: 'chipper', t: "That's what she said last time." },
    { join: ['grizz', 'spines', 'chip', 'kit', 'chipper'] },
    { t: 'Grizz, Spines, Chip, Kit and Chipper join the party. More mouths to feed, more hands to carry.' },
    { effects: { food: 18 } },
    { t: 'They bring what the canopy stores can spare. +18 food.' },
  ],

  // --- Landmark 6 / Ch. 7 ----------------------------------------------------
  ch7_pre: [
    { bg: 'thorns' },
    { show: ['rusty', 'chip', 'grizz'] },
    { s: 'chip', t: "Listen. We don't kill. We knock them back and we get our people out." },
    { s: 'grizz', t: 'One berry at a time. You draw, you pay. Watch your wind.' },
    { s: 'chip', t: `Get to the pen, get ${FRIEND_NAME} out, get back to us. Don't be a hero about it.` },
  ],
  ch7_post: [
    { bg: 'thorns' },
    { show: ['rusty', 'friend', 'chip'] },
    { s: 'friend', t: 'You came back.' },
    { s: 'rusty', t: "Took some help. Hold still, you're cut." },
    { t: `Rusty tends ${FRIEND_NAME}'s cuts, then turns ${FRIEND_NAME} toward home with an escort.` },
    { s: 'chip', t: 'Now eat. All of it. That was your first real bill.' },
  ],

  // --- Landmark 7 / Ch. 8 — the goal is stated. Do not compress. -----------
  ch8: [
    { bg: 'campfire' },
    { show: ['rusty', 'chip', 'grizz', 'spines'] },
    { t: 'A fire, low and hidden. Everyone too tired to talk. Then Grizz does.' },
    { s: 'grizz', t: 'She runs this, you know. The rebellion. Chip.' },
    { s: 'chip', t: "Somebody had to. Nobody else put their paw up." },
    { s: 'rusty', t: 'Then you should see this.' },
    { t: 'He opens his paw. The seed from the dying rebel.' },
    { s: 'spines', t: '...That glow. Chip, that is not a normal seed.' },
    { s: 'chip', t: "It's a Heartseed. A pure one. There were supposed to be none left." },
    { s: 'chip', t: 'Plant it at the Heartroot, and the Heartroot can heal. The blight can be pushed back.' },
    { s: 'rusty', t: 'Then that is where we are going.' },
    { s: 'chip', t: "It's the last one, Rusty. Every enforcer the Owl has will want it." },
    { s: 'rusty', t: "I know. I'm still carrying it." },
    { t: 'The goal: bring the last pure Heartseed to the Heartroot.' },
  ],

  // --- Landmark 8 / Ch. 9 ----------------------------------------------------
  ch9_arrive: [
    { bg: 'ruins' },
    { show: ['rusty', 'spines'] },
    { t: 'Canopy Keep. What is left of it.' },
    { s: 'spines', t: 'The old Council sat here. Berries still grow in the cracks. Some, anyway.' },
    { s: 'rusty', t: "We're low. I'll look." },
  ],
  ch9_vision: [
    { bg: 'council' },
    { show: ['rusty'] },
    { t: 'In the Council chamber, the light shifts. For a moment the room is full again.' },
    { t: 'Voices, careful and wise, weighing the forest. Then weighing themselves. Then only themselves.' },
    { t: 'The vision thins. The rot shows through it like roots through soil.' },
    { t: 'Ten places around the table. Nine chairs.' },
    { s: 'rusty', t: '...' },
    { t: 'He does not know why he counted.' },
  ],

  // --- Landmark 9 / Ch. 10 ---------------------------------------------------
  ch10: [
    { bg: 'blight' },
    { show: ['rusty', 'survivor', 'chip'] },
    { t: 'The ground here is grey in lines, like something spread along the roots.' },
    { s: 'survivor', t: "You don't want to be out here. Ashfang's been through." },
    { t: 'The name moves through the camp in whispers.' },
    { t: 'A family, thin and mangy, grey at the edges of their fur. Their fire is small.' },
    { s: 'survivor', t: "It's not much. But you've walked a long way. Sit. Eat with us." },
    { s: 'chip', t: '(quietly) Your call, Rusty.' },
    {
      choice: [
        {
          label: 'Sit and eat with them',
          flag: 'acceptedMeal',
          value: true,
          effects: { food: -3, stamina: { rusty: -6 } },
          then: [
            { t: 'Rusty sits. He leaves food behind when he goes, more than he ate. -3 food.' },
            { t: 'The meal is thin and tastes of ash. He eats all of it anyway. -6 stamina.' },
            { s: 'survivor', t: 'Thank you for sitting.' },
          ],
        },
        {
          label: 'Thank them and move on',
          flag: 'acceptedMeal',
          value: false,
          effects: {},
          then: [
            { s: 'rusty', t: "We can't stay. Keep it for yourselves." },
            { s: 'survivor', t: '...Suit yourself.' },
            { t: 'They watch the party go. Nobody says anything for a long while.' },
          ],
        },
      ],
    },
    { fx: 'shake' },
    { s: 'spines', t: 'Wings. Coming in low. They followed us here.' },
    { s: 'chip', t: '{V}, stay behind Rusty. Rusty, keep them off {V}.' },
  ],
  ch10_after: [
    { bg: 'blight' },
    { show: ['rusty', 'kit', 'chipper'] },
    { s: 'kit', t: "They were looking for the seed. Weren't they." },
    { s: 'rusty', t: 'Yes.' },
    { s: 'chipper', t: 'Then they will keep coming.' },
    { s: 'rusty', t: 'Yes.' },
  ],

  // --- Landmark 10 / Ch. 11 --------------------------------------------------
  // Bandit continuing with the party is GAME-ORIGINAL (brief §2).
  ch11: [
    { bg: 'camp' },
    { show: ['rusty', 'bandit'] },
    { t: 'The resistance camp. More of them than Rusty expected. Fewer than they need.' },
    { s: 'bandit', t: 'Bandit. I keep the stores. Want to see what we are really arguing about?' },
    { bg: 'cache' },
    { t: 'Under a tarp: dark, fibrous bundles, faintly warm. They smell of nothing at all.' },
    { s: 'bandit', t: 'Rootvein. Pulled up fresh. It works every time, they say. No cost you can feel.' },
    { show: ['rusty', 'bandit', 'chip'] },
    { s: 'chip', t: "Half this camp wants it handed out tonight. I'm starting to think they're right." },
    { s: 'rusty', t: 'Mosswhisker would say anything offering the take without the pay is selling you something.' },
    { s: 'chip', t: "Mosswhisker isn't here. Mosswhisker isn't losing people." },
    { s: 'rusty', t: "...I'm not touching it." },
    { s: 'bandit', t: "Nobody's making you. Not today." },
    { join: ['bandit'] },
    { s: 'bandit', t: "I'm coming with you, though. Someone should watch that seed who can't be seen doing it." },
    { t: 'Bandit joins the party.' },
    { effects: { food: 10, berries: { fleet: 2, nimble: 2 } } },
    { s: 'bandit', t: 'And these are from the honest stores. Eat them before you need them.' },
    { t: '+10 food, +2 Fleet, +2 Nimble.' },
  ],

  // --- Landmark 11 / Ch. 12 --------------------------------------------------
  ch12_pre: [
    { bg: 'blight-deep' },
    { show: ['rusty', 'chip', 'bandit'] },
    { t: 'Deep blight. Grey ground, grey air. The berries here are few and hard.' },
    { s: 'spines', t: 'Ambush. Both sides. A big one leading them.' },
    { s: 'bandit', t: 'I brought something. Just in case. You say the word.' },
    { t: 'Bandit has a bundle of Rootvein from the cache.' },
    { s: 'chip', t: 'Nobody says any word. Hold the line!' },
  ],
  // Canon path (the book's Ch. 12 is non-branching: Rusty uses it).
  ch12_rootvein: [
    { bg: 'blight-deep' },
    { show: ['rusty', 'chip', 'grizz'] },
    { t: 'It is over. It was easy. That is the worst part, and he does not feel it.' },
    { s: 'grizz', t: 'Rusty... what did you do?' },
    { s: 'chip', warm: 'Hey. Hey. Eat something, you look done in.', cold: '...Eat something.' },
    { t: 'The others eat, ravenous, shaking. Rusty does not.' },
    { s: 'rusty', t: "I'm not hungry." },
    { show: ['rusty', '{VID}'] },
    { s: '{VID}', t: "You're bleeding. Let me —" },
    // REVIEW: the cold / cruel Ch. 12 aftermath line (brief §7, §10).
    { s: 'rusty', t: "Leave it, {V}. You'd have been more use back there staying out of the way." },
    { t: '{V} steps back. Nobody says anything.' },
    { show: ['rusty'] },
    { s: 'rusty', t: '...' },
  ],
  // Game-original path (brief §7). Honest defeat — not a punishment.
  ch12_refuse: [
    { bg: 'blight-deep' },
    { show: ['grizz', 'chip'] },
    { t: 'Rusty goes down with nothing left. Grizz is already there, lifting him.' },
    { s: 'chip', t: 'Fall back! Everyone, to me! We are leaving!' },
    { fx: 'shake' },
    { bg: 'forest' },
    { show: ['rusty', 'chip', 'grizz', '{VID}'] },
    { t: 'Hours later, far from the grey ground. Everyone is here. Everyone is hurt.' },
    { s: 'chip', t: 'We lost the ground. We did not lose anyone.' },
    { s: '{VID}', t: 'Here. Eat. You have to eat.' },
    { eat: ['rusty'] },
    { t: 'Rusty eats like he has never eaten before. It is the best thing he has ever tasted.' },
    { s: 'rusty', t: 'I had nothing left. And it still would have been easy.' },
    { s: 'chip', t: "It would. And you'd be paying for it still. We'll find another way through." },
  ],
};

// Background labels shown on the title card of each story beat.
export const BG_NAMES = {
  grove: 'Outer Grove',
  'grove-dusk': 'Outer Grove, dusk',
  'grove-night': 'Outer Grove, night',
  forest: 'The deep wood',
  hollow: "Mosswhisker's Hollow",
  canopy: 'The canopy',
  thorns: 'The thorn pens',
  campfire: 'A hidden fire',
  ruins: 'Canopy Keep',
  council: 'The Council chamber',
  blight: 'Blighted roots',
  'blight-deep': 'Deep blight',
  camp: 'Resistance camp',
  cache: 'The cache',
  ash: 'The ashlands',
};
