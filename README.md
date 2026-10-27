# Panther Prowl 🐾👻

A Halloween maze-chase game made for the **Good Hope Country Day School Boo
Bash** (#BooBash #PantherPride #SpookySeason). You're a panther prowling the
haunted halls of a school at night. Gobble every candy corn while the ghosts
chase you. Grab a golden paw for **Panther Power** and pounce on them!

It runs in any modern web browser on laptops, tablets and phones, and needs no
internet once it's loaded.

## Run it on your computer

The game is a folder of plain files with no build step. You do need a small
local web server, because browsers won't load JavaScript modules from a file
you just double-click.

```bash
cd panther-prowl
python3 -m http.server 8000
```

Then open <http://localhost:8000> in Chrome, Edge, Firefox or Safari.
(If port 8000 is busy, use another number, like 8123.)

No Python? In VS Code, install the "Live Server" extension and click
**Go Live**.

## How to play

- **Move:** arrow keys or WASD on a keyboard. On a phone or tablet, swipe
  anywhere or use the round arrow pad. You can press a turn a moment *before*
  the corner and the panther will still take it.
- **Eat all the candy corn** to clear the hall and go to the next level.
- **Golden paws** give you Panther Power: the ghosts turn blue and run. Pounce
  on them for 200, then 400, 800 and 1600 in a row. When they start flashing,
  the power is almost over!
- **Tunnels:** run off one side of the maze to come back on the other.
- **P** or **Esc** pauses. **M** mutes.

### Two ways to play

- **Boo Bash Challenge:** 90 seconds to score as much as you can. Getting
  caught doesn't end the round, it just costs you time. Every Challenge starts
  exactly the same way, so it's fair. Score enough for a **Bronze, Silver,
  Gold or Legendary Panther** prize, and make the top 10 to put your initials
  on the high-score board (just 3 letters, never your name).
- **Classic:** 3 lives. Clear the hall to reach the next level, where the
  ghosts get faster.

Running the booth at the event? See [`docs/booth-guide.md`](docs/booth-guide.md).

### Meet the ghosts

Each ghost has its own brain (see `src/core/ghost-brains.js`):

| Ghost | Look | Brain |
|---|---|---|
| **Hex** | green, witch hat | **Hunter:** heads straight for you |
| **Jack** | orange pumpkin, carved mouth | **Ambusher:** aims 4 tiles in front of you to cut you off |
| **Mist** | blue, striped scarf | **Shy:** chases from far away, flees when close |
| **Bones** | white skull face | **Wanderer:** turns at random |

Every so often all the ghosts "scatter" to their own corners for a few
seconds. That's your chance to breathe.

## What's in the folder

```
index.html            the page: the game canvas, the score bar and the menus
src/
  config.js           ⭐ all the numbers and colors you can tweak
  main.js             connects everything; screen changes, sounds, effects
  mazes/              ⭐ the mazes, drawn as text
    haunted-halls.js  the first maze
    index.js          the list of mazes the game knows about
  core/               the game rules (no drawing, so they can be tested)
    game.js           eating, power, pouncing, lives, levels, the timer
    prizes.js         prize tiers and prize codes
    leaderboard.js    high-score rules and initials
    ghost-brains.js   ⭐ how each ghost decides where to go
    ghost.js          ghost states: waiting, leaving, roaming, eyes...
    panther.js        the player, including the turn buffer
    movement.js       moving tile to tile, tunnels
    maze.js           reads a maze file and checks it works
    autopilot.js      a computer player (title screen demo, score testing)
    random.js         seeded random numbers (fair, repeatable games)
  render/             drawing
    art.js            ⭐ the panther, ghosts, candy and paws, drawn with code
    scene.js          the sky, moon, floor and lockers
    renderer.js       draws each frame
    effects.js        sparks, floating scores, shake, flashes
    layout.js         fits the maze to any screen
  input/controls.js   keyboard, swipes and the arrow pad
  audio/sound.js      sound effects made with code
  storage/            saves things on this device
    store.js          safe localStorage helpers
    booth.js          staff settings, high scores, prize log
  ui/                 menus, score bar, prize screen, initials, high
                      scores, staff mode, fullscreen button
  styles.css          how the menus look
assets/               fonts (and credits for everything)
tests/                tests for the game rules
docs/                 the project plan, booth guide and student tasks
```

## Change the game

Open **`src/config.js`**. Every setting has a comment. Try changing the
panther's `speed`, how long Panther Power lasts, the ghost speeds, or the
points for candy. Save the file and reload the browser.

Tip: add `?debug` to the address (`http://localhost:8000/?debug`), open the
browser console (F12), and type `pantherProwl.game` while playing to look
inside the game.

## Design a new maze

1. Copy `src/mazes/haunted-halls.js` to a new file, like
   `src/mazes/spooky-gym.js`.
2. Change the `id` (lowercase with dashes, same as the file name) and `name`.
3. Draw your maze in the `grid`. One character is one tile:

   | Character | Meaning |
   |---|---|
   | `#` | wall (lockers) |
   | `.` | candy corn |
   | `o` | golden paw (Panther Power) |
   | `_` | empty hallway |
   | `P` | where the panther starts (exactly one) |
   | `G` | where a ghost starts (inside the ghost house) |
   | `-` | the ghost-house door (exactly one, in the house's top wall) |

4. Add it to `src/mazes/index.js`:
   ```js
   import spookyGym from './spooky-gym.js';
   export const MAZE_SOURCES = [hauntedHalls, spookyGym];
   ```
5. To play it, set `classic: 'spooky-gym'` in `MAZES` in `src/config.js`.
6. Reload. **The game checks your maze.** If something's wrong (a row that's
   too short, candy you can't reach, a ghost house with a hole), it shows a
   list of the problems instead of the game. Dead ends show up as warnings in
   the console (F12): they're allowed, but ghosts can trap you there.

Rules of thumb: keep it symmetrical, give every hallway two ways out, and
put the golden paws far apart. Around 20 columns × 22 rows fits phones well.

## Add a new ghost (or give one a new personality)

1. Open `src/core/ghost-brains.js` and read how the four brains work. Each
   one just picks a **target tile**.
2. Write your own brain function. For example, a "copycat" that aims for the
   tile mirrored across the maze from the panther. Add it to `BRAINS` at the
   bottom of the file.
3. In `src/config.js`, add a ghost to `GHOSTS` (or change one) with your
   brain's name, a color, a `look` and a corner.
4. Run the tests (below), then play and watch how it behaves.

New looks (accessories) are drawn in `drawGhost` in `src/render/art.js`.
Students' own PNG drawings for characters are planned; see
`docs/student-tasks.md`.

## Run the tests

The game rules have automatic tests. If you have Node.js installed:

```bash
node --test
```

Run them after you change anything in `src/core/` or a maze. They also check
that every maze in `src/mazes/` is valid.

## Student git workflow

1. **Pull first**, every time you sit down: `git pull`
2. Make **one small change** and test it in the browser.
3. **Commit** with your name in the message:
   `git commit -am "Add spooky gym maze (Jada)"`
4. **Push:** `git push`
5. If `git pull` reports a conflict, stop and ask your teacher before going on.

Ideas for what to work on are in [`docs/student-tasks.md`](docs/student-tasks.md).

## Credits

Everything in the game is listed with its source and license in
[`assets/CREDITS.md`](assets/CREDITS.md). Panther Prowl is part of the Panther
Arcade with [Panther Slash](https://github.com/amalikrigger/panther-slash) and
[Panther Pounce](https://github.com/amalikrigger/panther-pounce).
