# Panther Prowl: project instructions

A browser maze-chase game for the **GHCDS Boo Bash** Halloween event (Good Hope
Country Day School, Kingshill, St. Croix, USVI; the Panthers). Amali teaches at
GHCDS, and students clone and extend this repo, so it is also a **teaching
codebase**.

- Full brief: `docs/kickoff-prompt.md`. Plan, status and open questions:
  `docs/plan.md` (the plan of record; update it there, don't fork it).
- How to run and play, how to design mazes and ghosts, and the student
  workflow: `README.md`. Student task list: `docs/student-tasks.md`.
- Event-night setup and volunteer steps: `docs/booth-guide.md`. The shared
  prize, leaderboard, staff and kiosk conventions for all three games are in
  `docs/plan.md` ("Panther Arcade shared flows").

## Panther Arcade

Panther Prowl is one of three sibling games: Panther Slash
(`~/Developer/panther-slash`) and Panther Pounce (`~/Developer/panther-pounce`).
Keep these consistent across them:
- color tokens and fonts
- prize-tier names (Bronze / Silver / Gold / Legendary Panther)
- the leaderboard and initials flow
- staff mode

You may **read** the siblings. **Never edit them** from this repo. There is no
shared code dependency.

## Hard constraints

- **Static and offline.** Vanilla JS ES modules, Canvas 2D, HTML and CSS. No
  bundler, no npm build, no CDN loading. Vendor any approved library with an
  exact pinned version.
- **Relative URLs only, never a leading `/`.** The game must run from any
  static host subpath (e.g. `thinkinbits.site/panther-prowl/`).
- **No new dependencies, frameworks or services** without Amali's approval.
  The online shared leaderboard and deployment both need approval.
- **Privacy:** players are mostly minors. Never collect names, emails or other
  personal data. Leaderboards store 3-letter initials, score and date only.
- **IP:** the repo is public. Nothing derived from Pac-Man may be used: no
  names, character designs, maze layouts or sounds. Every asset needs a known
  source and license, recorded in `assets/CREDITS.md`. Prefer art drawn in
  code, then CC0/OFL, then student-made. **No school logo or marks** until
  permission is confirmed.
- **Approvals:** ask before any commit, push, deploy, new service or account,
  or deleting/moving files. Propose commits with their messages.

## Architecture

- `src/config.js` holds every value a student might tweak. Keep it that way.
- `src/mazes/*.js`: a maze is a text grid with a legend. `src/core/maze.js`
  validates it on load (row lengths, one P and door, an enclosed ghost house,
  reachable candy, paired tunnels; dead ends are warnings). A broken maze
  shows its problems on screen.
- `src/core/`: the rules, DOM-free and deterministic for a given seed.
  - Positions are in tiles, with tile centers at integer coordinates.
  - Movement is dt-based and turns only at tile centers (`movement.js`).
  - The panther has a turn buffer.
  - Ghost targeting lives in `ghost-brains.js`, the teaching file; ghost
    states live in `ghost.js`.
  - `game.js` emits events, and `src/main.js` maps them to sound and effects.
  - Tests: `node --test` (Node's built-in runner, no install).
- Rendering: one full-viewport canvas.
  - `render/layout.js` picks an integer-device-pixel tile size and a 'top' or
    'side' HUD layout, and places the d-pad on touch screens.
  - Static walls are pre-rendered in `render/scene.js`.
  - Everything is drawn in code in `render/art.js`.
- Menus and the HUD are an HTML overlay. `#ui` has `pointer-events: none`, so
  swipes reach the canvas.
- Offline: `sw.js` is network-first with a cache fallback. Every shipped file
  must be in its `FILES` list; `tests/offline.test.mjs` enforces this.

## Verifying changes

1. Serve with `python3 -m http.server <free port>`. Sibling games may be using
   common ports.
2. Check desktop, tablet, and phone in portrait and landscape.
3. Check keyboard, swipe and d-pad input.
4. Make sure the console is clean.

Add `?debug` to expose `window.pantherProwl` for scripted checks.
