# The Woodland Rebellion — V1

A browser game adaptation of *The Woodland Rebellion*: an Oregon Trail-style journey
with short 8-bit side-scroller encounters. V1 covers Acts I–II, **Ch. 2 (Founding Day)
through Ch. 12 (Price of the Shortcut)**, opening on a short, non-interactive Ch. 1 cold open.

Built with **Phaser 3** + Vite, with procedural chiptune music (no audio files). It's a single responsive web build for desktop and mobile
browsers, and progress saves in the browser (localStorage).

```bash
npm install
npm run dev        # local dev server
npm run build      # static build in dist/ (relocatable: base './')
npm test           # ledger / data unit tests (node:test)
node scripts/smoke.mjs                 # headless: every scene, screenshots to ./shots
node scripts/playthrough.mjs rootvein  # headless: full run through the Director, canon ending
node scripts/playthrough.mjs refuse    # ...and the refuse-Rootvein ending
```

## Test builds and deployment

- **Hosting:** `.github/workflows/deploy.yml` runs the tests, builds, and publishes to GitHub Pages on
  every push to `main`. You can also run it by hand from the Actions tab. One-time setup: repo **Settings →
  Pages → Source: GitHub Actions**. A private repo needs a paid GitHub plan for Pages; otherwise make the repo public.
- **Version:** the title screen shows `v<package.json version> (<commit>)`. Bump `version` in
  `package.json` for each round of testing.
- **Chapter select:** on while `TEST_BUILD = true` in `src/config.js`. Set it to `false` for a public launch.
- **Feedback:** the button on the title, game-over and ending screens builds a report (build, chapter,
  party, device). Point it somewhere with `FEEDBACK` in `src/config.js`: a form `url` or an `email`.
  Left empty, testers get Copy and their device's Share sheet.
- **Saves:** bump `SAVE_VERSION` in `src/config.js` when a change would break older saves. Testers then
  see a clear "older build" message instead of a broken run.
- **Tester notes:** `public/testers.html`, served at `<site>/testers.html` and linked from the title screen.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → / A D | `<` `>` |
| Jump | ↑ / W / Space | `JMP` |
| Staff (knock back, never kill) | J / Z | `STF` |
| Draw Fleet berry | K / X | `FLT` |
| Draw Nimble berry (draw both = **stack**) | L / C | `NMB` |
| Act (free the captive) | E / ↓ | `ACT` |
| Pause | P / Esc | — |
| Menus / dialogue | arrows + Enter / Space | tap |

Trail, story and camp screens are portrait (216×384 native). Encounters are landscape
(384×216 native). On a phone held the wrong way, a dismissable "turn your phone" prompt appears.
Everything is drawn at native pixel resolution and integer-looking nearest-neighbour scaled
(`pixelArt: true`), with no smoothing.

## How the systems map to the brief

| Brief | Where |
|---|---|
| Stamina per companion, no passive regen | `src/state/ledger.js` (`spend`, `restore`, `rest`, `eatMeal`) |
| Food, low food slows recovery | `ledger.rest()` uses `BALANCE.rest.lowFoodFactor`; party panel shows **LOW** |
| Berry pouch, thinning with blight | `BALANCE.abundance` scales forage yields and road finds, landmark 1 → 11 |
| Stacking (burst, then fast drain) | `drawCost(type, stacking)`, `drainRate(type, activeCount)` |
| Ravenous eating after honest fights | `ledger.ravenousEat()` → `ReceiptScene` (the on-screen receipt) |
| **Colour**: hidden, presentation only | `ui/colour.js`: a camera colour-matrix desaturation. There is no bar, number or text anywhere. A unit test fails if any text call renders it. |
| Rootvein: always works, no stamina/food, drains Colour | `ledger.useRootvein()`; offered **once**, in `SkirmishScene.offerRootvein()`, triggered by Rusty's actual stamina (≤25%, or ≤40% with no Fleet/Nimble left) |
| Rusty stops eating after Rootvein | `ravenousEat` returns `notHungry`, and story `eat` beats skip him |
| Warm → cold companion lines | script lines with `warm`/`cold` variants, chosen by hidden Colour |
| Collapse → carry or send home, no deaths | `ui/collapse.js`; carrying adds a day per leg and food per day; carried companions walk again once rested |
| Staff never kills | enemies have *resolve*; when it breaks they flee |
| Ch. 12 branch, both endings | `data/landmarks.js` `branch` step → `ch12_rootvein` / `ch12_refuse` → `EndingScene` |

## Route (11 landmarks)

| # | Ch. | Landmark | Play |
|---|---|---|---|
| 1 | 2 | Outer Grove, Founding Day | story · **forage (light, tutorial)** · feast |
| 2 | 3 | Ash in the Wind | story (the Heartseed) |
| 3 | 4 | When the Owls Circle | story · **chase** (no staff, no berries) |
| 4 | 5 | Mosswhisker's Hollow | **ledger tutorial** using the real ledger (draw, drain, stack, eat, rest) |
| 5 | 6 | Echoes of the Canopy | Grizz, Spines, Chip, Kit, Chipper join *(game-original)* |
| 6 | 7 | Rescue in the Thorns | **skirmish: combat tutorial** (one berry, watch stamina, disengage, eat) |
| 7 | 8 | Names in the Fire | story: the goal is stated |
| 8 | 9 | The Council That Was | story · **forage (ruins)** · vision (ten places, nine chairs) |
| 9 | 10 | Ashfang's Mark | story + **meal choice** · **protect** *(proposal)* |
| 10 | 11 | The Cache | Rootvein shown, *not* usable; Bandit joins *(game-original)* |
| 11 | 12 | Price of the Shortcut | **climax skirmish** → Rootvein offer → branch → ending |

Travel between landmarks happens on the Trail screen. You choose pace (steady, or hard:
faster but it costs stamina), rest, and share meals. Road events show the blight spreading
from landmark 5 onward: grey root-lines, dead bushes, spoiled food, thinner finds.

## Art pipeline (placeholder → final)

All sprites are procedurally drawn placeholders (`src/art/placeholders.js`). The contract
is in `src/art/manifest.js`:

- one horizontal strip per character, **12 frames of 16×16**
- frame order: `idle 0-1 · run 2-5 · jump 6 · attack 7 · hurt 8 · down 9 · eat 10-11`

To swap in final art, drop `public/sprites/<key>.png` in the same layout and set
`file: '<key>.png'` on its manifest entry. No other code changes are needed.
Placeholder species are deliberately generic.

## Project layout

```
src/config.js           display sizes + ALL balance numbers (proposed starting values)
src/state/ledger.js     pure game-state logic (no Phaser), unit-tested
src/state/store.js      live state + localStorage save / landmark checkpoint
src/flow.js             Director: walks landmark steps, saves after each
src/data/               companions, landmarks/route, script (DRAFT dialogue), road events
src/scenes/             Title, Card, Story, Trail, Hollow, Receipt, GameOver, Ending
src/encounters/         EncounterBase + Forage, Chase, Skirmish (rescue/climax), Protect
src/ui/                 text, buttons+keyboard menus, touch controls, colour FX, panels
docs/                   open notes and the dialogue lines awaiting review
```

See **[docs/OPEN_NOTES.md](docs/OPEN_NOTES.md)** for everything that needs a decision
and **[docs/DIALOGUE_REVIEW.md](docs/DIALOGUE_REVIEW.md)** for tone-sensitive lines.
