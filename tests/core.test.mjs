// Tests for the game rules in src/core/. Run them with:  node --test
//
// Each test sets up a small situation, does one thing, and checks the result.
// If you change the rules on purpose, a test may need updating too. If you
// didn't mean to change anything and a test fails, you found a bug!

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Maze } from '../src/core/maze.js';
import { travel } from '../src/core/movement.js';
import { Panther } from '../src/core/panther.js';
import { Ghost } from '../src/core/ghost.js';
import { BRAINS } from '../src/core/ghost-brains.js';
import { Game } from '../src/core/game.js';
import { MAZE_SOURCES } from '../src/mazes/index.js';
import { GHOSTS, SCORING, MODES, TIMING } from '../src/config.js';

const maze = (grid, name = 'test') => new Maze({ id: name, name, grid });
const errors = (m) => m.problems.filter((p) => p.level === 'error').map((p) => p.message);

// A small, valid maze used by many tests. The 4th row is a tunnel.
const SMALL = `
###########
#o.......o#
#.#-#.###.#
..#G#......
#.###..P..#
#.........#
###########
`;

// ----------------------------------------------------------------------------
// Mazes
// ----------------------------------------------------------------------------

test('every maze that ships with the game is valid', () => {
  for (const source of MAZE_SOURCES) {
    const m = new Maze(source);
    assert.deepEqual(errors(m), [], `${source.id} has errors`);
  }
});

test('the small test maze is valid', () => {
  assert.deepEqual(errors(maze(SMALL)), []);
});

test('a row of the wrong length is reported', () => {
  const m = maze(SMALL.replace('#.........#', '#........#'));
  assert.match(errors(m).join('\n'), /Row 6 is 10 characters/);
});

test('a tunnel with no partner on the other side is reported', () => {
  const m = maze(SMALL.replace('..#G#......', '..#G#.....#'));
  assert.match(errors(m).join('\n'), /Row 4 has a tunnel on only one side/);
});

test('candy walled off from the panther is reported', () => {
  const sealed = maze(`
###########
#.#o......#
###.#-#.###
....#G#....
#...###.P.#
#.........#
###########
`);
  assert.match(errors(sealed).join('\n'), /row 2, column 2 can't be reached/);
});

test('a ghost house with a hole in it is reported', () => {
  const m = maze(SMALL.replace('#.###..P..#', '#.#.#..P..#'));
  assert.match(errors(m).join('\n'), /panther can walk into the ghost house/);
});

test('a ghost outside the house is reported', () => {
  const m = maze(SMALL.replace('#.........#', '#....G....#'));
  assert.match(errors(m).join('\n'), /is outside the ghost house/);
});

test('dead ends are a warning, not an error', () => {
  const m = maze(`
#########
#.......#
#.#-#.#.#
#.#G#.#.#
#.#####.#
#...P...#
#########
`);
  assert.deepEqual(errors(m), []);
  assert.ok(m.problems.some((p) => p.level === 'warning' && /Dead end/.test(p.message)));
});

// ----------------------------------------------------------------------------
// Movement
// ----------------------------------------------------------------------------

test('walking left out of a tunnel comes back in on the right side', () => {
  const m = maze(SMALL);
  const actor = { x: 1, y: 3, dir: 'left' };
  travel(actor, 2.5, m, () => 'left'); // past the edge
  assert.equal(actor.y, 3);
  assert.ok(Math.abs(actor.x - (m.cols - 1.5)) < 1e-9, `x was ${actor.x}`);
});

test('moving into a wall stops at the tile center, not inside the wall', () => {
  const m = maze(SMALL);
  const actor = { x: 8, y: 4, dir: 'down' };
  travel(actor, 5, m, (a) => (m.isOpen(a.x, a.y + 1) ? 'down' : null));
  assert.deepEqual({ x: actor.x, y: actor.y }, { x: 8, y: 5 });
  assert.equal(actor.dir, null);
});

test('a big jump still stops at every tile center to ask for a direction', () => {
  const m = maze(SMALL);
  const actor = { x: 1, y: 5, dir: 'right' };
  const askedAt = [];
  travel(actor, 3, m, (a) => {
    askedAt.push(a.x);
    return 'right';
  });
  assert.deepEqual(askedAt, [1, 2, 3]);
  assert.equal(actor.x, 4);
});

// ----------------------------------------------------------------------------
// The panther and input buffering
// ----------------------------------------------------------------------------

test('a turn pressed a little early happens at the next corner it fits', () => {
  const m = maze(SMALL);
  const panther = new Panther(m, { turnMemorySeconds: 0.5 });
  panther.x = 3;
  panther.y = 5;
  panther.dir = 'right';
  panther.update(0.1, 6); // now at x = 3.6
  panther.want('up');
  // Passes column 4 (wall above, so it keeps going) and turns up at column 5.
  panther.update(0.25, 6);
  assert.equal(panther.x, 5);
  assert.equal(panther.dir, 'up');
  assert.ok(panther.y < 5, `y was ${panther.y}`);
});

test('a remembered turn is forgotten after turnMemorySeconds', () => {
  const m = maze(SMALL);
  const panther = new Panther(m, { turnMemorySeconds: 0.2 });
  panther.x = 1;
  panther.y = 5;
  panther.dir = 'right';
  panther.want('down'); // the bottom row is all wall, so this can never happen
  panther.update(0.05, 1);
  assert.equal(panther.wanted, 'down');
  panther.update(0.3, 1);
  assert.equal(panther.wanted, null);
});

test('turning around works in the middle of a tile', () => {
  const m = maze(SMALL);
  const panther = new Panther(m, { turnMemorySeconds: 0.5 });
  panther.x = 3;
  panther.y = 5;
  panther.dir = 'right';
  panther.update(0.05, 6); // x = 3.3
  panther.want('left');
  panther.update(0.05, 6);
  assert.equal(panther.dir, 'left');
  assert.ok(Math.abs(panther.x - 3) < 1e-9);
});

// ----------------------------------------------------------------------------
// Ghosts
// ----------------------------------------------------------------------------

const fakePanther = (col, row, facing = 'left') => ({ x: col, y: row, facing, tile: { col, row } });

test('the hunter targets the panther, the ambusher targets ahead of it', () => {
  const settings = { ambushTilesAhead: 4, shyDistance: 7 };
  const panther = fakePanther(10, 10, 'up');
  assert.deepEqual(BRAINS.hunter({}, { panther, settings }), { col: 10, row: 10 });
  assert.deepEqual(BRAINS.ambusher({}, { panther, settings }), { col: 10, row: 6 });
});

test('the shy ghost chases from far away and runs to its corner up close', () => {
  const settings = { ambushTilesAhead: 4, shyDistance: 7 };
  const panther = fakePanther(10, 10);
  const corner = { col: -1, row: 30 };
  assert.deepEqual(BRAINS.shy({ x: 0, y: 0, cornerTile: corner }, { panther, settings }), { col: 10, row: 10 });
  assert.deepEqual(BRAINS.shy({ x: 9, y: 9, cornerTile: corner }, { panther, settings }), corner);
});

test('a ghost never turns straight back at a crossing', () => {
  const m = maze(SMALL);
  const ghost = new Ghost(GHOSTS[0], 0, m);
  ghost.state = 'roaming';
  ghost.x = 5;
  ghost.y = 1;
  ghost.dir = 'right';
  // Target is behind it (to the left), but it may not reverse.
  assert.notEqual(ghost.bestDirectionToward({ col: 0, row: 1 }), 'left');
});

test('a waiting ghost leaves the house and comes out above the door', () => {
  const m = maze(SMALL);
  const ghost = new Ghost({ ...GHOSTS[0], leaveAfter: 0.5 }, 0, m);
  const world = { panther: fakePanther(7, 4), mood: 'chase', random: Math.random, settings: {}, speeds: { normal: 5, scared: 3, eyes: 12, inHouse: 3 } };
  for (let i = 0; i < 32; i++) ghost.update(1 / 60, world); // a hair over 0.5 s
  assert.equal(ghost.state, 'leaving', 'leaves after 0.5 seconds');
  for (let i = 0; i < 120 && ghost.state === 'leaving'; i++) ghost.update(1 / 60, world);
  assert.equal(ghost.state, 'roaming');
  assert.deepEqual({ col: ghost.x, row: ghost.y }, m.outsideDoor);
});

test('pounced ghost eyes find their way home and come back out', () => {
  const m = maze(SMALL);
  const ghost = new Ghost(GHOSTS[0], 0, m);
  ghost.state = 'roaming';
  ghost.x = 1;
  ghost.y = 5;
  ghost.dir = 'right';
  ghost.pounced();
  const world = { panther: fakePanther(7, 4), mood: 'chase', random: Math.random, settings: {}, speeds: { normal: 5, scared: 3, eyes: 12, inHouse: 3 } };
  const seen = new Set();
  for (let i = 0; i < 600 && ghost.state !== 'roaming'; i++) {
    ghost.update(1 / 60, world);
    seen.add(ghost.state);
  }
  assert.ok(seen.has('entering'), 'went back into the house');
  assert.equal(ghost.state, 'roaming');
});

// ----------------------------------------------------------------------------
// The game
// ----------------------------------------------------------------------------

/** Run the game for `seconds`, in frames of `fps`. */
function run(game, seconds, fps = 60) {
  const frames = Math.round(seconds * fps);
  for (let i = 0; i < frames; i++) game.update(1 / fps);
}

const haunted = () => new Maze(MAZE_SOURCES[0]);

test('eating candy scores points', () => {
  const game = new Game({ maze: haunted() });
  run(game, TIMING.readySeconds + 0.05);
  game.steer('left');
  run(game, 0.5);
  assert.ok(game.stats.candy >= 2, `ate ${game.stats.candy}`);
  assert.equal(game.score, game.stats.candy * SCORING.candy);
});

test('a golden paw scares the ghosts, and pounces chain 200, 400', () => {
  const game = new Game({ maze: haunted() });
  run(game, TIMING.readySeconds + 0.05);
  game.startPower();
  for (const ghost of game.ghosts) assert.equal(ghost.scared, true);

  // Put two roaming ghosts right on top of the panther.
  const [a, b] = game.ghosts;
  for (const ghost of [a, b]) {
    ghost.state = 'roaming';
    ghost.x = game.panther.x;
    ghost.y = game.panther.y;
  }
  const before = game.score;
  game.checkTouches();
  assert.equal(game.score - before, SCORING.pounceChain[0] + SCORING.pounceChain[1]);
  assert.equal(a.state, 'eyes');
  assert.equal(game.phase, 'pounce');
});

test('getting caught three times in Classic ends the game', () => {
  const game = new Game({ maze: haunted() });
  for (let life = 0; life < MODES.classic.lives; life++) {
    run(game, TIMING.readySeconds + 0.05);
    const ghost = game.ghosts[0];
    ghost.state = 'roaming';
    ghost.scared = false;
    ghost.x = game.panther.x;
    ghost.y = game.panther.y;
    game.checkTouches();
    assert.equal(game.phase, 'caught');
    run(game, TIMING.caughtSeconds + 0.05);
  }
  assert.equal(game.phase, 'over');
  assert.equal(game.lives, 0);
});

test('Challenge mode ends when the clock runs out, and the clock waits for "go"', () => {
  const game = new Game({ maze: haunted(), mode: 'challenge', roundSeconds: 10 });
  run(game, TIMING.readySeconds - 0.1);
  assert.equal(game.timeLeft, 10, 'clock should not run during the first countdown');
  run(game, 10.5);
  assert.equal(game.phase, 'over');
  assert.equal(game.timeLeft, 0);
  assert.equal(game.takeEvents().at(-1).reason, 'time');
});

test('the same seed and the same moves give exactly the same game', () => {
  const play = () => {
    const game = new Game({ maze: haunted(), mode: 'challenge', seed: 2026 });
    const moves = ['left', 'up', 'right', 'down', 'left', 'up'];
    for (let second = 0; second < 30; second++) {
      game.steer(moves[second % moves.length]);
      run(game, 1);
    }
    return game.ghosts.map((g) => [g.x, g.y, g.state]).concat([[game.score]]);
  };
  assert.deepEqual(play(), play());
});

test('the game runs at the same speed at 30, 60 and 144 frames per second', () => {
  const where = (fps) => {
    const game = new Game({ maze: haunted(), seed: 7 });
    run(game, TIMING.readySeconds + 0.01, fps);
    game.steer('left');
    run(game, 0.6, fps); // 4.2 tiles: well short of the wall
    return { x: game.panther.x, y: game.panther.y, hex: game.ghosts[0].x };
  };
  const slow = where(30);
  const normal = where(60);
  const fast = where(144);
  for (const other of [slow, fast]) {
    assert.ok(Math.abs(other.x - normal.x) < 0.3, `panther x ${other.x} vs ${normal.x}`);
    assert.ok(Math.abs(other.hex - normal.hex) < 0.3, `ghost x ${other.hex} vs ${normal.hex}`);
  }
});

test('eating every candy clears the hall and starts the next level', () => {
  const game = new Game({ maze: haunted() });
  run(game, TIMING.readySeconds + 0.05);
  game.pellets.fill(0);
  game.candyLeft = 1;
  const { col, row } = game.panther.tile;
  game.pellets[row * game.maze.cols + col] = 1;
  run(game, 1 / 60);
  assert.equal(game.phase, 'cleared');
  run(game, TIMING.clearedSeconds + 0.05);
  assert.equal(game.level, 2);
  assert.equal(game.candyLeft, game.maze.candy.length + game.maze.powers.length);
});
