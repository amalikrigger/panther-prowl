// Panther Prowl: where everything gets connected.
//
// This file doesn't contain game rules (those are in src/core/) or drawing
// code (src/render/). It sets things up, runs the loop, switches screens, and
// turns game events ("candy", "pounce", "caught"...) into sounds and effects.

import { MAZES, CONTROLS, THEME, GHOSTS } from './config.js';
import { Maze } from './core/maze.js';
import { Game } from './core/game.js';
import { autopilotDirection } from './core/autopilot.js';
import { MAZE_SOURCES } from './mazes/index.js';
import { computeLayout } from './render/layout.js';
import { Renderer } from './render/renderer.js';
import { Effects } from './render/effects.js';
import { Controls } from './input/controls.js';
import { startLoop } from './engine/loop.js';
import { unlock, setMuted, isMuted, sounds } from './audio/sound.js';
import { load, save } from './storage/store.js';
import { showScreen, showBanner, hideBanner, showResults, showMazeProblems } from './ui/screens.js';
import { Hud } from './ui/hud.js';
import { setupFullscreen } from './ui/fullscreen.js';

const $ = (id) => document.getElementById(id);

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
let isTouch = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;

// -----------------------------------------------------------------------------
// Mazes: load and check them. A broken maze shows its problems on screen.
// -----------------------------------------------------------------------------

const mazes = Object.fromEntries(MAZE_SOURCES.map((source) => [source.id, new Maze(source)]));
const classicMaze = mazes[MAZES.classic];

// -----------------------------------------------------------------------------
// The pieces
// -----------------------------------------------------------------------------

const canvas = $('game');
const renderer = new Renderer(canvas, { reducedMotion });
const effects = new Effects({ reducedMotion });
const hud = new Hud();

let screen = 'loading';
let game = null;        // the game being played
let attract = null;     // the demo game behind the title screen
let gameOverAt = null;  // when the current game ended (results appear shortly after)
let layout = null;

const controls = new Controls({
  swipeSurface: canvas,
  dpad: $('dpad'),
  handlers: {
    direction: (direction) => game?.steer(direction),
    pause: () => (screen === 'playing' ? pause() : screen === 'pause' ? resume() : null),
    mute: toggleMute,
    anyInput: unlock, // phones only allow sound after the first touch
  },
});

// -----------------------------------------------------------------------------
// Screen size
// -----------------------------------------------------------------------------

function relayout() {
  const style = getComputedStyle(document.documentElement);
  const safe = (name) => parseFloat(style.getPropertyValue(name)) || 0;
  const screenSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // more than 2× costs a lot and looks the same
    safeTop: safe('--safe-top'),
    safeBottom: safe('--safe-bottom'),
  };
  const maze = (game ?? attract)?.maze ?? classicMaze;
  layout = computeLayout(screenSize, maze, { dpadSetting: CONTROLS.dpad, isTouch });
  renderer.resize(layout, maze);

  const root = document.documentElement.style;
  root.setProperty('--maze-x', `${layout.maze.x}px`);
  root.setProperty('--maze-y', `${layout.maze.y}px`);
  root.setProperty('--maze-w', `${layout.maze.width}px`);
  root.setProperty('--maze-h', `${layout.maze.height}px`);
  document.body.dataset.layout = layout.mode;

  const pad = $('dpad');
  pad.hidden = !layout.dpad;
  if (layout.dpad) {
    Object.assign(pad.style, {
      left: `${layout.dpad.x}px`,
      top: `${layout.dpad.y}px`,
      width: `${layout.dpad.size}px`,
      height: `${layout.dpad.size}px`,
    });
  }
}

window.addEventListener('resize', relayout);
window.addEventListener('orientationchange', relayout);
window.visualViewport?.addEventListener('resize', relayout);
// A laptop with a touch screen: show the arrow pad once someone touches it.
window.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' && !isTouch) {
    isTouch = true;
    relayout();
  }
});

// -----------------------------------------------------------------------------
// Starting, pausing and ending games
// -----------------------------------------------------------------------------

function startGame(mode) {
  unlock();
  game = new Game({ maze: classicMaze, mode, seed: Date.now() % 100000 });
  gameOverAt = null;
  effects.clear();
  hud.reset();
  controls.enabled = true;
  relayout();
  screen = 'playing';
  showScreen('playing');
  handleEvents(game.takeEvents());
}

function pause() {
  if (screen !== 'playing' || !game || game.phase === 'over') return;
  screen = 'pause';
  showScreen('pause');
}

function resume() {
  if (screen !== 'pause') return;
  screen = 'playing';
  showScreen('playing');
}

function goToTitle() {
  game = null;
  controls.enabled = false;
  hideBanner();
  effects.clear();
  startAttract();
  updateBestLine();
  screen = 'title';
  showScreen('title');
}

function finishGame() {
  const key = `best.${game.mode}`;
  const best = load(key, 0);
  const isNewBest = game.score > best;
  if (isNewBest) save(key, game.score);
  controls.enabled = false;
  screen = 'results';
  showResults({
    title: game.mode === 'challenge' ? "Time's up!" : 'Caught!',
    score: game.score,
    isNewBest,
    stats: [
      ['Candy', game.stats.candy],
      ['Pounces', game.stats.pounces],
      ['Level', game.level],
    ],
  });
}

function updateBestLine() {
  const best = load('best.classic', 0);
  $('best-line').innerHTML = best > 0 ? `Best on this device: <span class="gold">${best.toLocaleString()}</span>` : '';
}

function toggleMute() {
  setMuted(!isMuted());
  save('muted', isMuted());
  $('mute-button').setAttribute('aria-pressed', String(isMuted()));
}

// -----------------------------------------------------------------------------
// The title screen's demo game, played by the computer.
// -----------------------------------------------------------------------------

function startAttract() {
  attract = new Game({ maze: classicMaze, mode: 'challenge', seed: 1031, roundSeconds: Infinity });
  attract.takeEvents();
}

function updateAttract(dt) {
  if (attract.phase === 'playing') attract.steer(autopilotDirection(attract));
  attract.update(dt);
  attract.takeEvents(); // the demo is silent
}

// -----------------------------------------------------------------------------
// Game events → sounds, sparks and banners
// -----------------------------------------------------------------------------

const ghostColor = Object.fromEntries(GHOSTS.map((ghost) => [ghost.id, ghost.color]));

function handleEvents(events) {
  for (const event of events) {
    const { panther } = game;
    switch (event.type) {
      case 'candy':
        sounds.candy();
        if (!reducedMotion) effects.burst(event.col, event.row, { colors: THEME.candy, count: 3, speed: 2, life: 0.25, size: 0.1 });
        break;
      case 'power':
        sounds.power();
        effects.flash(THEME.gold, 0.3);
        effects.burst(event.col, event.row, { colors: [THEME.gold, '#fff6d6'], count: 18, speed: 5 });
        effects.popup(panther.x, panther.y - 0.8, 'PANTHER POWER!', { color: THEME.gold, size: 0.8, life: 1.2 });
        break;
      case 'powerEnd':
        sounds.powerEnd();
        break;
      case 'pounce':
        sounds.pounce(event.chain);
        effects.burst(event.x, event.y, { colors: [ghostColor[event.ghost], '#ffffff', THEME.gold], count: 22, speed: 6 });
        effects.popup(event.x, event.y, event.points.toLocaleString(), { color: THEME.gold, size: 1 });
        if (event.chain >= 2) effects.popup(event.x, event.y + 0.9, `COMBO ×${event.chain}`, { color: THEME.pumpkin, size: 0.7 });
        effects.shake(0.15, 0.2);
        break;
      case 'caught':
        sounds.caught();
        effects.shake(0.35, 0.4);
        effects.flash(THEME.maroon, 0.4);
        navigator.vibrate?.(200);
        break;
      case 'ready':
        showBanner('Ready?', { seconds: 0 });
        sounds.ready();
        break;
      case 'go':
        showBanner('GO!', { seconds: 0.6, gold: true });
        sounds.go();
        break;
      case 'cleared':
        showBanner('Hall cleared!', { seconds: 1.8, gold: true });
        sounds.cleared();
        effects.flash('#ffffff', 0.3);
        break;
      case 'level':
        effects.popup(panther.x, panther.y - 1, `Level ${event.level}`, { color: '#fff6d6', size: 0.9, life: 1.4 });
        break;
      case 'extraLife':
        sounds.extraLife();
        effects.popup(panther.x, panther.y - 1, '+1 LIFE', { color: '#7CFF6B', size: 0.9 });
        break;
      case 'over':
        hideBanner();
        sounds.gameOver();
        gameOverAt = performance.now();
        break;
    }
  }
}

// -----------------------------------------------------------------------------
// The loop
// -----------------------------------------------------------------------------

function frame(dt, time) {
  if (screen === 'playing' && game) {
    const held = controls.heldDirection;
    if (held) game.steer(held);
    game.update(dt);
    handleEvents(game.takeEvents());
    // Give the caught animation a moment before the results slide in.
    if (gameOverAt && performance.now() - gameOverAt > 900) finishGame();
  } else if (screen === 'title' && attract) {
    updateAttract(dt);
  }

  if (screen !== 'pause') effects.update(dt);
  const shown = game ?? attract;
  if (shown) {
    renderer.draw(shown, effects, time, screen === 'pause' ? 0 : dt);
    if (game) hud.update(game);
  }
}

// -----------------------------------------------------------------------------
// Buttons
// -----------------------------------------------------------------------------

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  unlock();
  sounds.tap();
  switch (button.dataset.action) {
    case 'play-classic': startGame('classic'); break;
    case 'play-again': startGame(game?.mode ?? 'classic'); break;
    case 'resume': resume(); break;
    case 'quit':
    case 'menu': goToTitle(); break;
  }
});

$('pause-button').addEventListener('click', () => pause());
$('mute-button').addEventListener('click', toggleMute);

// -----------------------------------------------------------------------------
// Go!
// -----------------------------------------------------------------------------

async function boot() {
  setMuted(load('muted', false));
  $('mute-button').setAttribute('aria-pressed', String(isMuted()));
  setupFullscreen({ button: $('fullscreen-button'), iosHint: $('ios-hint') });
  $('how-to').innerHTML = isTouch
    ? 'Swipe or use the arrow pad. Eat all the <span class="gold">candy corn</span>. Grab a <span class="gold">golden paw</span> to pounce on the ghosts!'
    : 'Arrow keys or WASD to move. Eat all the <span class="gold">candy corn</span>. Grab a <span class="gold">golden paw</span> to pounce on the ghosts!';

  // Show maze mistakes to whoever is editing them.
  for (const maze of Object.values(mazes)) {
    for (const problem of maze.problems) console[problem.level === 'error' ? 'error' : 'warn'](problem.message);
  }
  if (!classicMaze || classicMaze.hasErrors) {
    showMazeProblems(classicMaze?.problems ?? [{ message: `No maze called "${MAZES.classic}" in src/mazes/index.js.` }]);
    screen = 'maze-error';
    return;
  }

  // Wait (briefly) for the fonts so the title doesn't flash in a fallback font.
  await Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);

  startAttract();
  relayout();
  startLoop(frame, { onHide: pause });
  goToTitle();

  if (new URLSearchParams(location.search).has('debug')) {
    window.pantherProwl = { get game() { return game; }, get attract() { return attract; }, mazes, get layout() { return layout; } };
  }
}

boot();
