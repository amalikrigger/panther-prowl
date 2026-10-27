# Student tasks

Good first projects, from easiest to hardest. Pick one, tell your teacher, and
follow the git workflow in the README. Each one is small enough for one class.

## Tweak (no new code)

- **Tune the game.** In `src/config.js`, change the panther speed, the ghost
  speeds or the Panther Power time. Play 3 rounds each way. Which feels best?
  Write down why.
- **New colors.** Change a ghost's `color` or the maze colors in `THEME`. Check
  that everything is still easy to see on a dark screen.
- **Ghost moods.** Change `GHOST_MOODS` so the ghosts scatter more or less
  often. How does it change the game?

## Design

- **Design a maze.** Follow "Design a new maze" in the README. Draw it on graph
  paper first! The game checks it for you when it loads.
- **Design a prize badge** for Bronze, Silver, Gold and Legendary Panther
  (on paper or in a drawing app). It will go on the prize screen.
- **Draw a character.** Sketch a new look for the panther or a ghost. Then try
  drawing it with code in `src/render/art.js` (start by copying `drawWitchHat`).
  Drawing with code is just shapes: circles (`arc`, `ellipse`), lines
  (`lineTo`) and curves (`quadraticCurveTo`).
- **Draw a bonus treat** (a candy apple, a full-size candy bar) for a future
  "bonus treat" feature.

## Code

- **Give a ghost a new personality.** Write a new brain in
  `src/core/ghost-brains.js` (ideas: a copycat that mirrors the panther, a
  guard that patrols near the golden paws, a ghost that targets the other
  ghosts' blind spot). Give it to a ghost in `config.js`.
- **Write a test.** Add a test to `tests/core.test.mjs` for your new brain or
  maze. Run `node --test`.
- **New sound effect.** In `src/audio/sound.js`, change how a sound is built
  (pitch, length, wave type). Or record a panther growl or a "BOO!" with your
  voice. Ask your teacher, because recorded sounds need a credits entry and
  your permission to use them.

## Coming soon (ask first)

- Student PNG art for characters (the game will load your drawing instead of
  the code-drawn one).
- A second maze for the Boo Bash Challenge.
