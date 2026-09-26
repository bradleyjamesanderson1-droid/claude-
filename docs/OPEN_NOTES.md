# Open notes: flagged back for decision

These are the brief's §10 items, plus things I had to decide to make V1 playable.
None of them is locked.

## 1. Balance (proposed starting numbers)

All numbers live in `src/config.js` → `BALANCE`. Here are the starting values:

| Thing | Value |
|---|---|
| Max stamina | Rusty 100 · Grizz 140 · Chip 110 · Spines 90 · Bandit 90 · Kit 60 · Chipper 60 |
| Berry draw cost / drain per sec / duration | Fleet 12 / 1.0 / 10s · Nimble 10 / 1.0 / 10s · Stout 14 / 0.8 / 12s · Bark 14 / 0.8 / 12s · Glow 8 / 0.5 / 14s · Whisper 8 / 0.5 / 10s · Flare 18 / 1.5 / 8s · Shadow 12 / 1.0 / 8s |
| Stacking | 2nd draw ×1.5 cost; while two are active, **both** drain ×3 |
| Food | start 24; 1 per walker per day; carried companions eat 2 |
| Travel | steady = 2 days/leg, no stamina; hard = 1 day/leg, −10 stamina each per day; carrying anyone adds +1 day/leg |
| Rest (1 day) | +25 stamina fed, +5 unfed; ×0.6 when food is **low** (< 2 days of rations) |
| Extra meal | 1 food → +12 stamina |
| After an honest fight | each berry-user eats up to 2 food at +10 stamina per food |
| Starving | −10 stamina per unfed member per day |
| Hits | enforcer 8 · champion 14 · Nimble halves hits |
| Berry abundance by landmark | 1.0, 1.0, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2 |
| Rootvein offer | Rusty ≤ 25% stamina, or ≤ 40% with no Fleet/Nimble left (only after 5s of fighting) |
| Climax entry | Rusty is capped at 60% going in ("already spent"), and this is shown on-screen |

**Design additions to check.** Two stamina costs aren't spelled out in the brief:

- Getting hit costs stamina (8 / 14).
- Companions pay a small stamina cost per action.

I think both fit the ledger, since the fight wears you down in substance. Flag them if you'd rather keep stamina strictly to berries and pace.

## 2. Encounter-to-landmark assignment (proposal)

- **Landmark 9 (Ashfang's Mark)** gets the single **Protect** encounter, after the meal
  choice: enforcers sweep the survivors' camp. It's the "implied threat". It could equally
  stay a pure story/choice beat. It's one line to remove in `src/data/landmarks.js`.
- Forage runs are at landmarks 1 and 8, per §6.
- **Berries unlock at the Hollow (landmark 4).** Before Mosswhisker teaches Berrycraft,
  the forage run and the chase have no berry buttons. Rusty has no training yet.
- Rusty collapsing *outside* the climax ends the run, with "Try again" from the start of
  that landmark. In the climax, collapsing is the refuse-Rootvein ending.

## 3. Dialogue

All dialogue is **draft** (`src/data/script.js`). See `DIALOGUE_REVIEW.md` for the
tone-sensitive lines, especially the Ch. 12 cold line.

## 4. Kit vs. Chipper (the vulnerable one)

Set by `VULNERABLE_ID` in `src/config.js` (currently `'kit'`, per the lean). The Protect
encounter, the Ch. 10 line and the Ch. 12 aftermath all resolve it at runtime through
`src/data/vulnerable.js`. If that companion was sent home, it falls back to the other
young one. Nothing hard-codes Kit.

## 5. Placeholders that need book facts

- **The friend taken in Ch. 4** isn't named in the brief. The placeholder name is `Burr`
  (`FRIEND_NAME` in `src/data/script.js`). I also assumed that the Ch. 7 rescue frees this friend.
- **The Ch. 1 cold open** is atmosphere only (Ashfang walking the ash). It needs the
  actual prologue beats.
- **The Grove elder** (Founding Day) and **the survivor** (Ch. 10) are unnamed stand-ins.
- **Enemy species.** The Owl's enforcers are drawn as owls. The Protect encounter adds
  small ground "crawlers" (blight-sick creatures), which are game-original. Swap them if they're wrong.
- **Placeholder species** for the cast are generic silhouettes, pending your character references.

## 6. Game-original content (don't carry back into the novel)

- Grizz/Spines/Chip/Kit/Chipper joining together at Ch. 6.
- Bandit travelling with the party after Ch. 11.
- The Ch. 12 refuse-Rootvein branch and its honest retreat ending.
- The Protect encounter type and the crawlers.
- Bandit carrying a Rootvein bundle into Ch. 12, which is how the offer reaches Rusty mid-fight.

## 7. Not in V1 (by design)

- No music. The Rootvein ending is deliberately silent, and there are only small WebAudio
  blips elsewhere.
- Whisper berries exist in the pouch and turn up in forage, but no V1 companion uses them.
- Nothing from Ch. 13–27. No third "Chip sacrifices herself" branch.
