# Solar System Explorer

An interactive 3D model of the Solar System that runs in the browser. You can fly
around it and zoom from the whole system down to a single moon. Click any world to
read a few facts about it, then ask a guide (powered by Claude) follow-up questions
about that world.

It's a teaching and exploration toy, not an astronomy simulator. Sizes, distances
and speeds are compressed so that everything fits on one screen. A **True scale**
toggle shows the real proportions.

Built with **Vite + TypeScript + Three.js**. A small **Express** server holds the
Anthropic API key and streams chat answers, so the key never reaches the browser.

## Quick start

Needs Node.js 20.12 or newer (22 recommended).

```bash
cd solar-system
npm install
cp .env.example .env     # then paste your key into ANTHROPIC_API_KEY (optional)
npm run dev              # http://localhost:5173
```

The app works without a key. Everything runs except the chat box, which
explains that chat isn't set up.

| Command | What it does |
|---|---|
| `npm run dev` | Server + Vite dev middleware with hot reload, on one port |
| `npm run build` | Static client build into `dist/` |
| `npm start` | Production: serves `dist/` and the chat API (`npm run build` first) |
| `npm test` | Unit tests: scale sanity checks, body data, chat validation, SSE parsing |
| `npm run typecheck` | TypeScript strict-mode check |

## Environment

Set these in `.env`. The file is git-ignored; `.env.example` documents them.

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | (none) | Enables chat. Read on the server only. |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Model for chat answers. Change it without touching code. |
| `ANTHROPIC_EFFORT` | `low` | Reasoning effort (`low`…`max`, or `none` to omit it, e.g. for Haiku). |
| `ANTHROPIC_FALLBACKS` | on | Server-side refusal fallback (`fallbacks: "default"`) on models that support it. Set `off` to disable. |
| `PORT` | `5173` | Server port. |
| `TRUST_PROXY` | (off) | Set to `1` behind a reverse proxy so rate limits see real client IPs. |

## Using it

- **Mouse:** drag to rotate, scroll to zoom, right-drag (or shift-drag) to pan.
  **Touch:** one finger rotates, pinch zooms, two fingers pan.
- **Click or tap a world** to fly to it and open its info panel. Small bodies
  have generous invisible hit areas, and labels are clickable too.
- **Bodies** (or press `/`) opens a searchable list of everything, with moons nested
  under their planets. The list is keyboard-friendly (arrow keys, Enter).
- **⟲ System** or `Esc` flies back to the whole-system view.
- **Time:** Pause / Slow / Normal / Fast. **Orbits** and **Labels** toggle the overlays.
- **True scale** morphs to real sizes and distances. The worlds become dots, which
  is the point.

## How the scale works

Everything is tuned in **`src/config/scale.ts`**, with a comment on each constant.
Nothing else hard-codes a size, distance or speed.

- **Body size:** `radius = (diameter / Earth's diameter)^0.4`. Jupiter is about 2.6×
  Earth, Mercury about 0.68×, Phobos about 0.08×. The Sun is capped at 5 units
  (still about twice Jupiter).
- **Planet distance:** `70 × AU^0.5`. The inner planets are tightly packed and the
  outer ones spread out.
- **Moon distance:** measured in the parent's **rendered** radii,
  `parentRadius × (1 + 1.2 × √(distance / parentRealRadius))`. Moons always clear
  the planet (and Saturn's rings) and keep their real order and rough spread.
- **Speeds:** planet periods are `60 s × years^0.6` and moon periods are `4 s × days^0.5`,
  so closer bodies always go round faster.
- **Staying visible:** from far away, every body is scaled up by the *same* factor
  (the factor an Earth-sized body needs to be about 2.6 px). The system view stays
  readable and Jupiter still looks 2.6× Earth. Up close the factor is 1.
- **Level of detail:** moons and their orbit lines fade in as you approach their
  planet (between 10× and 5× the moon system's radius). Labels are placed by
  priority and hidden when they would overlap.

`tests/scale.test.ts` pins down the proportions the design depends on: Jupiter is
the largest planet and Mercury the smallest, Earth and Venus are near-twins,
Ganymede is larger than the Moon, Phobos is tiny, moons orbit outside their planet
and rings in real order, and neighbouring moon systems never overlap.

## Data

All bodies live in **`src/data/bodies.ts`**: the Sun, 8 planets, Pluto and Ceres,
and 24 moons (including Tethys and Dione). Numbers are mean diameters,
semi-major axes and sidereal periods from NASA's planetary and satellite fact
sheets, rounded. The key-stats strip is derived from those numbers, so no figure is
typed twice. Facts, blurbs and suggested questions were written for a general
audience. Claims that are estimates, contested, or likely to change (moon counts,
Phobos's remaining lifetime, the height of Verona Rupes, and so on) are marked
`UNCERTAIN:` in comments.

## The chat guide

- `POST /api/chat` takes `{ bodyId, messages }`. The server builds the system
  prompt itself from `bodies.ts`: name, type, parent, key stats, blurb and the facts
  already on screen, plus guidance to be friendly, brief and honest about
  uncertainty. The client can't inject a prompt.
- Answers stream back as server-sent events and appear word by word.
- History is kept per body for the session, so switching away and back keeps
  the thread.
- **Abuse protection:** 24 KB request limit, 1,000-character questions, at most
  21 messages per conversation, 12 requests per minute per IP, and a 4,096-token
  answer cap.
- **Errors** (missing key, bad key, rate limits, network failures, the server
  unreachable on a static host) become friendly messages in the chat, never stack
  traces.

## Project layout

```
solar-system/
├─ index.html            UI skeleton (top bar, drawer, panel)
├─ server/
│  ├─ index.ts           Express: /api/health, /api/chat (streaming), static/Vite
│  └─ chat.ts            validation, system prompt, rate limiter, model config
├─ src/
│  ├─ config/scale.ts    every scale function and constant
│  ├─ data/bodies.ts     all body data and content
│  ├─ scene/             SolarSystem (graph + per-frame update), CameraRig,
│  │                     procedural textures, starfield and belts
│  ├─ ui/                InfoPanel, BodyList, Overlay (labels, reticles, picking)
│  ├─ chat/              streaming client + per-body conversation store
│  └─ main.ts            wiring and the frame loop
└─ tests/                vitest unit tests
```

## Notes

- **Textures:** all surfaces are painted procedurally at start-up (noise, bands,
  craters, Saturn's ring divisions), so the app ships no image files. To use
  real imagery, replace `makeSurfaceTexture` for a body with a texture loader.
  NASA imagery is public domain; record the licence here for any other source.
- **Performance:** modest sphere segment counts, shared geometries, point-sprite
  belts, one light, and screen-space picking with no raycasting against meshes.
  Device pixel ratio is capped at 2.
- **Accessibility:** keyboard-accessible body list and panel, visible focus rings,
  an `aria-live` chat log, and `prefers-reduced-motion` (camera flights become instant
  jumps and CSS animations are disabled).
- **Out of scope:** real ephemeris positions (starting angles are arbitrary),
  eccentric orbits, spacecraft, comets.
