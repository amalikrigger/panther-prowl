// The game rules: eating candy, Panther Power, pouncing, getting caught,
// lives, levels and the Challenge timer.
//
// This file never draws anything or plays sounds. Instead it adds EVENTS to a
// list ("candy", "pounce", "caught"...) and main.js turns those into pictures
// and noises. Keeping the rules separate means we can test them without a
// browser (see tests/), and swap the art without breaking the game.
//
// A game moves through these phases:
//
//   ready ──► playing ──► pounce (a short freeze) ──► playing
//                │
//                ├──► caught ──► ready (next life)  or  over
//                └──► cleared (all candy eaten) ──► ready (next level)
//
// In Boo Bash Challenge mode the clock can also end the game at any time.

import { GHOSTS, GHOST_SPEED, GHOST_MOODS, BRAINS, PANTHER, POWER, SCORING, MODES, TIMING } from '../config.js';
import { Panther } from './panther.js';
import { Ghost } from './ghost.js';
import { distanceBetween } from './movement.js';
import { createRandom } from './random.js';

const NOTHING = 0;
const CANDY = 1;
const POWER_PAW = 2;

export class Game {
  /**
   * @param maze  a Maze (src/core/maze.js) with no errors
   * @param mode  'classic' or 'challenge'
   * @param seed  starts the random numbers; the same seed gives the same ghost choices
   * @param roundSeconds  Challenge length (staff can override the config value)
   */
  constructor({ maze, mode = 'classic', seed = 1, roundSeconds = MODES.challenge.roundSeconds }) {
    this.maze = maze;
    this.mode = mode;
    this.random = createRandom(seed);
    this.panther = new Panther(maze, PANTHER);
    this.ghosts = GHOSTS.map((spec, index) => new Ghost(spec, index, maze));
    this.events = [];

    this.score = 0;
    this.level = 1;
    this.lives = mode === 'classic' ? MODES.classic.lives : Infinity;
    this.roundSeconds = roundSeconds;
    this.timeLeft = mode === 'challenge' ? roundSeconds : Infinity;
    this.clockRunning = false; // the Challenge clock starts on the first "go"
    this.extraLifeGiven = false;
    this.stats = { candy: 0, pounces: 0, bestChain: 0, timesCaught: 0 };

    this.fillCandy();
    this.startLife();
  }

  // ---------------------------------------------------------------------------
  // Setting up
  // ---------------------------------------------------------------------------

  fillCandy() {
    const { cols, rows } = this.maze;
    this.pellets = new Uint8Array(cols * rows); // one slot per tile
    for (const { col, row } of this.maze.candy) this.pellets[row * cols + col] = CANDY;
    for (const { col, row } of this.maze.powers) this.pellets[row * cols + col] = POWER_PAW;
    this.candyLeft = this.maze.candy.length + this.maze.powers.length;
  }

  /** Put everyone back at their start and count down. */
  startLife(readySeconds = TIMING.readySeconds) {
    this.panther.reset();
    for (const ghost of this.ghosts) ghost.reset();
    this.powerLeft = 0;
    this.pounceChain = 0;
    this.moodIndex = 0;
    this.moodLeft = GHOST_MOODS[0]?.seconds ?? Infinity;
    this.setPhase('ready', readySeconds);
    this.emit('ready');
  }

  // ---------------------------------------------------------------------------
  // Player input
  // ---------------------------------------------------------------------------

  /** The player wants to go this way: 'up', 'down', 'left' or 'right'. */
  steer(direction) {
    if (this.phase !== 'over') this.panther.want(direction);
  }

  // ---------------------------------------------------------------------------
  // One step of the game. dt = seconds since the last frame.
  // ---------------------------------------------------------------------------

  update(dt) {
    if (this.phase === 'over') return;

    if (this.clockRunning) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft === 0) {
        this.endGame('time');
        return;
      }
    }

    this.phaseLeft -= dt;
    switch (this.phase) {
      case 'ready':
        if (this.phaseLeft <= 0) {
          this.setPhase('playing');
          if (this.mode === 'challenge') this.clockRunning = true;
          this.emit('go');
        }
        break;
      case 'playing':
        this.play(dt);
        break;
      case 'pounce':
        if (this.phaseLeft <= 0) this.setPhase('playing');
        break;
      case 'caught':
        if (this.phaseLeft <= 0) this.afterCaught();
        break;
      case 'cleared':
        if (this.phaseLeft <= 0) {
          this.level += 1;
          this.fillCandy();
          this.startLife();
          this.emit('level', { level: this.level });
        }
        break;
    }
  }

  play(dt) {
    this.updatePower(dt);
    this.updateMood(dt);

    const pantherSpeed = this.powerLeft > 0 ? PANTHER.powerSpeed : PANTHER.speed;
    this.panther.update(dt, pantherSpeed);
    this.eatWhatsHere();

    const world = {
      panther: this.panther,
      mood: GHOST_MOODS[this.moodIndex]?.mood ?? 'chase',
      random: this.random,
      settings: BRAINS,
      speeds: {
        normal: this.ghostSpeed,
        scared: GHOST_SPEED.scared,
        eyes: GHOST_SPEED.eyes,
        inHouse: GHOST_SPEED.inHouse,
      },
    };
    for (const ghost of this.ghosts) ghost.update(dt, world);

    this.checkTouches();

    if (this.candyLeft === 0 && this.phase === 'playing') {
      this.setPhase('cleared', TIMING.clearedSeconds);
      this.emit('cleared', { level: this.level });
    }
  }

  // ---------------------------------------------------------------------------
  // The rules
  // ---------------------------------------------------------------------------

  eatWhatsHere() {
    const { col, row } = this.panther.tile;
    const slot = row * this.maze.cols + col;
    const pellet = this.pellets[slot];
    if (pellet === NOTHING) return;

    this.pellets[slot] = NOTHING;
    this.candyLeft -= 1;
    if (pellet === CANDY) {
      this.stats.candy += 1;
      this.addScore(SCORING.candy);
      this.emit('candy', { col, row });
    } else {
      this.addScore(SCORING.powerPaw);
      this.startPower();
      this.emit('power', { col, row, seconds: this.powerLeft });
    }
  }

  startPower() {
    this.powerLeft = this.powerSeconds;
    this.pounceChain = 0;
    for (const ghost of this.ghosts) ghost.frighten();
  }

  updatePower(dt) {
    if (this.powerLeft <= 0) return;
    this.powerLeft -= dt;
    if (this.powerLeft <= 0) {
      this.powerLeft = 0;
      for (const ghost of this.ghosts) ghost.calmDown();
      this.emit('powerEnd');
    }
  }

  // Ghosts switch between scatter and chase on a timer. The timer pauses
  // during Panther Power, like it did in the classic arcade games.
  updateMood(dt) {
    if (this.powerLeft > 0 || this.moodIndex >= GHOST_MOODS.length) return;
    this.moodLeft -= dt;
    if (this.moodLeft <= 0) {
      this.moodIndex += 1;
      this.moodLeft = GHOST_MOODS[this.moodIndex]?.seconds ?? Infinity;
      for (const ghost of this.ghosts) ghost.reverse(); // the "something changed" signal
    }
  }

  checkTouches() {
    for (const ghost of this.ghosts) {
      if (distanceBetween(ghost, this.panther, this.maze) > TIMING.touchDistance) continue;

      if (ghost.isPounceable) {
        const points = SCORING.pounceChain[Math.min(this.pounceChain, SCORING.pounceChain.length - 1)];
        this.pounceChain += 1;
        this.stats.pounces += 1;
        this.stats.bestChain = Math.max(this.stats.bestChain, this.pounceChain);
        ghost.pounced();
        this.addScore(points);
        this.setPhase('pounce', TIMING.pounceSeconds);
        this.emit('pounce', { ghost: ghost.id, points, chain: this.pounceChain, x: ghost.x, y: ghost.y });
      } else if (ghost.isDangerous) {
        this.stats.timesCaught += 1;
        this.setPhase('caught', TIMING.caughtSeconds);
        this.emit('caught', { ghost: ghost.id });
        return;
      }
    }
  }

  afterCaught() {
    if (this.mode === 'challenge') {
      // No lives in the Challenge: back to the start, with a short countdown.
      // The clock keeps running, so getting caught costs time.
      this.startLife(MODES.challenge.respawnReadySeconds);
      return;
    }
    this.lives -= 1;
    if (this.lives <= 0) {
      this.endGame('caught');
    } else {
      this.emit('lifeLost', { lives: this.lives });
      this.startLife();
    }
  }

  addScore(points) {
    this.score += points;
    if (this.mode === 'classic' && !this.extraLifeGiven && this.score >= SCORING.extraLifeAt) {
      this.extraLifeGiven = true;
      this.lives += 1;
      this.emit('extraLife', { lives: this.lives });
    }
  }

  endGame(reason) {
    this.setPhase('over');
    this.clockRunning = false;
    this.emit('over', { reason, score: this.score });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Ghosts get faster each level, up to a limit. */
  get ghostSpeed() {
    return Math.min(GHOST_SPEED.max, GHOST_SPEED.base + GHOST_SPEED.perLevel * (this.level - 1));
  }

  /** Panther Power gets shorter each level, down to a limit. */
  get powerSeconds() {
    return Math.max(POWER.minSeconds, POWER.seconds + POWER.perLevel * (this.level - 1));
  }

  /** Are the ghosts about to stop being scared? (They flash.) */
  get powerEnding() {
    return this.powerLeft > 0 && this.powerLeft < POWER.warnSeconds;
  }

  pelletAt(col, row) {
    return this.pellets[row * this.maze.cols + col];
  }

  setPhase(phase, seconds = 0) {
    this.phase = phase;
    this.phaseLeft = seconds;
    this.phaseLength = seconds;
  }

  emit(type, details = {}) {
    this.events.push({ type, ...details });
  }

  /** Hand over the events since last time, and clear the list. */
  takeEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}

export const PELLET = { NOTHING, CANDY, POWER_PAW };
