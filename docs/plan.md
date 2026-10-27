# Panther Prowl: rebuild plan

This is the plan of record for the Boo Bash 2026 rebuild. It holds the current
state only. When something changes, edit it here instead of adding a new section.

**Target:** event-ready by the evening of Thu Oct 29, 2026.
**Open question:** the brief says "Thursday, October 30", but Oct 30, 2026 is a
**Friday**. If the event is really Thu Oct 29, event-ready moves to Wed Oct 28
night. The schedule below aims for Wed night so that both dates work.

## Orientation (Phase 0, done Oct 27)

**How the old engine worked.** `pacman.js` is one minified line. Formatted, it
is about 1,060 lines, roughly 700 of them logic. A `setInterval` runs at 30 FPS.
Each tile is split into 10 sub-units, and everything moves a fixed number of
sub-units per tick, so speed depends on the timer, not on real time. The maze
is a numeric array, plus a separate, hand-traced list of wall outlines. Drawing
redraws only the rectangles that changed, on a single 342 × 426 canvas. State
lives in globals, and the code adds a `clone` method to `Object.prototype`.

**Problems confirmed by running it in headless Chrome:**
- **It never starts on a real domain.** Audio and the game loop only start when
  the host name contains a digit (`/\d/.test(location.host)`, a localhost
  hack). On `thinkinbits.site`, START GAME throws `Cannot read properties of
  undefined (reading 'load')` and nothing runs.
- **Ghosts have no AI.** At every tile each ghost picks left or right at random.
  There are no personalities and no chase or scatter phases.
- **No high score.** `storage = []` is an in-memory array holding only a sound
  flag. `localStorage` is never used.
- **Mobile.** The screen says "SWIPE TO MOVE", but the control is an invisible
  nipplejs joystick, and it logs every move to the console.
- **Layout.** The page is locked to 342 px: half a phone screen, and a postage
  stamp on a laptop.
- **Other bugs.** Pause and mute act on an unused audio object. The
  level-complete count is hard-coded to 182. There is a string-eval
  `setTimeout`, and `i`, `j` and `len` leak as globals.
- **IP.** The name, the yellow chomper, the four ghost colors, the maze shape,
  the MP3s (they sound like the arcade originals) and `Cartoon.ttf`, whose
  license is unknown.

**Decision: rewrite rather than refactor.** Frame-rate-independent movement, a
responsive canvas, mazes as data and real ghost AI each replace the sub-unit
tick grid, the traced wall outlines, the dirty-rect drawing and the globals, so
almost nothing would survive a refactor. We keep the ideas:
- the state flow: countdown → play → pounce pause → caught → next life
- turning at tile centers
- the "wanted direction" the old code already stored, which grows into a
  proper input buffer

The structure matches Panther Slash (`config.js`, a DOM-free `core/`, plus
render, input, audio, storage and ui shells, Creepster + Fredoka, and Web Audio
sound effects), so students learn one layout across the arcade.

**Risks.**
1. ES modules don't load from `file://`. Each booth device needs a local static
   server, or the hosted site plus a service worker (Phase 3) for offline play.
2. Prize thresholds can't be calibrated without real kids, so staff mode lets
   you change them at the booth.
3. There is little time for testing on real devices. Plan a 30-minute booth
   rehearsal on the actual hardware.

## Architecture

- `index.html`: one full-viewport canvas, with an HTML overlay for the screens
  and the HUD.
- `src/config.js`: every value a student might tweak.
- `src/mazes/*.js`: each maze is a text grid in its own file, with a legend.
  `src/core/maze.js` parses it and validates it on load: candy is reachable, the
  ghost house is enclosed, and tunnels are paired.
- `src/core/`: the rules, with no DOM: movement, the panther, ghosts (the chase
  AI lives in `ghost-brains.js`, the teaching file), and the game (score, power,
  lives, levels, timer). The randomness is seeded, so every Challenge play
  starts out the same.
- `src/render/`, `src/input/`, `src/audio/`, `src/storage/` and `src/ui/` are
  the shells around the core.
- **Layout:** the tile size is a whole number of device pixels, chosen to fit
  the screen. The HUD sits on top in portrait and on the sides on short
  landscape screens. On touch screens, a d-pad fills the spare space under the
  maze.

## Phases

| Phase | Scope | Estimate | Target |
|---|---|---|---|
| 1. Event-ready core | ES modules, maze as data with validation, ghost AI, responsive + fullscreen, keyboard/swipe/d-pad with turn buffering, saved best, full rebrand, title/game-over screens, original maze, theme, synthesized sound | ~7 h | Tue Oct 27 night |
| 2. Winning | Challenge mode (90 s, seeded), prize tiers + prize screen + verification code, local leaderboard + today's best, initials, staff PIN, kiosk | ~5 h | Wed Oct 28 |
| 3. Polish | bonus treats, juice, second maze, ghost difficulty ramp, reduced motion, low-end performance, service worker for offline | ~4 h | Wed night–Thu morning |
| Rehearsal | play on the real booth devices, fix what breaks | ~1–2 h | Thu Oct 29 afternoon |

Post-event, approval needed: a shared online leaderboard, deploying to
thinkinbits.site, a shared arcade shell, and the school logo once permission
is confirmed.

## Open questions for Amali

1. The event date: Thu Oct 29 or Fri Oct 30?
2. The booth devices: laptops, iPads, or Chromebooks? How many? Will there be a
   keyboard?
3. What are the actual prizes, so the tiers can be set to match?
4. Do we have permission to use the school logo? (Until then, it isn't used.)

## Status

- [x] Phase 0: orientation and plan (Oct 27)
- [x] Phase 1: built and verified Oct 27. Headless Chrome at 1280×800,
  1024×768 touch, 390×844 touch, 844×390 touch, and a no-digit host under a
  `/panther-prowl/` subpath. Checked:
  - keyboard, swipe and d-pad input; rotating mid-game; pause when the tab is
    hidden; reduced motion
  - holds 60 fps under a 4× CPU throttle
  - `node --test` 26/26, and a 40-seed soak run with no stuck ghosts
  **Waiting on Amali:** checkpoint review, commit approval, and approval to
  delete the legacy Pac-Man files.
- [ ] Phase 2: next (Challenge mode, prize screen + verification code,
  leaderboard + initials, staff PIN, kiosk)
- Score calibration so far (90 s round): steering at random scores about
  1,250, and the autopilot scores a median of about 6,000. Placeholder tiers
  are set at 1,500 / 2,500 / 4,000 / 6,000.
