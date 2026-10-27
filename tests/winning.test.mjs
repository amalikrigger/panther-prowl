// Tests for the Boo Bash Challenge: prize tiers, verification codes, the
// leaderboard and initials. Run them with:  node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tierFor, verificationCode, newStationSecret } from '../src/core/prizes.js';
import { boardKey, topScores, qualifies, addEntry, cleanInitials, initialsAllowed, dayOf } from '../src/core/leaderboard.js';
import { Game } from '../src/core/game.js';
import { Maze } from '../src/core/maze.js';
import { MAZE_SOURCES } from '../src/mazes/index.js';
import { PRIZE_TIERS, LEADERBOARD, MODES, TIMING } from '../src/config.js';

// ----------------------------------------------------------------------------
// Prize tiers
// ----------------------------------------------------------------------------

test('a score gets the highest tier it reaches', () => {
  const [bronze, silver] = PRIZE_TIERS;
  assert.equal(tierFor(bronze.minScore - 1, PRIZE_TIERS), null);
  assert.equal(tierFor(bronze.minScore, PRIZE_TIERS).id, 'bronze');
  assert.equal(tierFor(silver.minScore + 1, PRIZE_TIERS).id, 'silver');
  assert.equal(tierFor(1e9, PRIZE_TIERS).id, 'legendary');
});

test('tiers work even if staff type them in out of order', () => {
  const shuffled = [
    { id: 'gold', minScore: 300 },
    { id: 'bronze', minScore: 100 },
    { id: 'silver', minScore: 200 },
  ];
  assert.equal(tierFor(250, shuffled).id, 'silver');
});

// ----------------------------------------------------------------------------
// Verification codes
// ----------------------------------------------------------------------------

const prize = { day: '2026-10-30', playNumber: 37, score: 2450, tierId: 'silver' };

test('a verification code is 4 easy-to-read characters, and the same every time', () => {
  const code = verificationCode('SECRET', prize);
  assert.match(code, /^[ACDEFGHJKMNPQRTUVWXY34679]{4}$/);
  assert.equal(verificationCode('SECRET', prize), code);
});

test('changing the score, play number or station changes the code', () => {
  const code = verificationCode('SECRET', prize);
  assert.notEqual(verificationCode('SECRET', { ...prize, score: 2460 }), code);
  assert.notEqual(verificationCode('SECRET', { ...prize, playNumber: 38 }), code);
  assert.notEqual(verificationCode('OTHER-STATION', prize), code);
});

test('station secrets are long and random', () => {
  const a = newStationSecret();
  assert.equal(a.length, 16);
  assert.notEqual(a, newStationSecret());
});

// ----------------------------------------------------------------------------
// Leaderboard
// ----------------------------------------------------------------------------

const board = boardKey({ mazeId: 'haunted-halls', roundSeconds: 90 });
const entry = (initials, score, day = '2026-10-30', otherBoard = board) => ({ initials, score, day, board: otherBoard });

function boardWith(...entries) {
  return entries.reduce((list, e) => addEntry(list, e), []);
}

test('the top list is sorted, and ties go to whoever scored first', () => {
  const list = boardWith(entry('AAA', 100), entry('BBB', 300), entry('CCC', 300), entry('DDD', 200));
  assert.deepEqual(topScores(list, { board }).map((e) => e.initials), ['BBB', 'CCC', 'DDD', 'AAA']);
});

test("tonight's list only has tonight's scores", () => {
  const list = boardWith(entry('OLD', 900, '2026-10-29'), entry('NEW', 100, '2026-10-30'));
  assert.deepEqual(topScores(list, { board, day: '2026-10-30' }).map((e) => e.initials), ['NEW']);
  assert.equal(topScores(list, { board }).length, 2);
});

test('games with a different round length are on a separate board', () => {
  const list = boardWith(entry('SIX', 5000, '2026-10-30', boardKey({ mazeId: 'haunted-halls', roundSeconds: 60 })), entry('NIN', 100));
  assert.deepEqual(topScores(list, { board }).map((e) => e.initials), ['NIN']);
});

test('a score qualifies if it beats the 10th place, all-time or tonight', () => {
  const tenOld = Array.from({ length: 10 }, (_, i) => entry('OLD', 1000 + i, '2026-10-29'));
  const list = boardWith(...tenOld);
  // All-time board is full of 1000+, but tonight's board is empty.
  assert.equal(qualifies(list, 50, { board, day: '2026-10-30' }), true);
  // On the old day, 50 doesn't beat 10th place.
  assert.equal(qualifies(list, 50, { board, day: '2026-10-29' }), false);
  assert.equal(qualifies(list, 0, { board, day: '2026-10-30' }), false, 'zero never qualifies');
});

test('the saved list never grows past 100, and never drops a top-10 score', () => {
  let list = [];
  for (let i = 0; i < 150; i++) list = addEntry(list, entry('AAA', i));
  // A low score on a different day is in that day's top 10, so it's kept.
  list = addEntry(list, entry('LOW', 1, '2026-10-31'));
  assert.ok(list.length <= 100);
  assert.ok(list.some((e) => e.initials === 'LOW'));
  assert.equal(topScores(list, { board })[0].score, 149);
});

// ----------------------------------------------------------------------------
// Initials
// ----------------------------------------------------------------------------

test('initials are cleaned up to 3 capital letters', () => {
  assert.equal(cleanInitials('a1m-k!z'), 'AMK');
  assert.equal(cleanInitials('jo'), 'JO');
});

test('blocked or short initials are not allowed', () => {
  assert.equal(initialsAllowed('AMK', LEADERBOARD.blockedInitials), true);
  assert.equal(initialsAllowed('AM', LEADERBOARD.blockedInitials), false);
  assert.equal(initialsAllowed(LEADERBOARD.blockedInitials[0], LEADERBOARD.blockedInitials), false);
});

test('dayOf gives the local date as YYYY-MM-DD', () => {
  assert.equal(dayOf(new Date(2026, 9, 30, 19, 45)), '2026-10-30');
});

// ----------------------------------------------------------------------------
// Challenge mode rules
// ----------------------------------------------------------------------------

test('in the Challenge, getting caught costs time but never ends the game', () => {
  const game = new Game({ maze: new Maze(MAZE_SOURCES[0]), mode: 'challenge', roundSeconds: 60, seed: MODES.challenge.seed });
  const step = (seconds) => { for (let i = 0; i < Math.round(seconds * 60); i++) game.update(1 / 60); };
  step(TIMING.readySeconds + 0.05);
  for (let i = 0; i < 5; i++) {
    const ghost = game.ghosts[0];
    ghost.state = 'roaming';
    ghost.scared = false;
    ghost.x = game.panther.x;
    ghost.y = game.panther.y;
    game.checkTouches();
    assert.equal(game.phase, 'caught');
    step(TIMING.caughtSeconds + MODES.challenge.respawnReadySeconds + 0.1);
    assert.equal(game.phase, 'playing');
  }
  assert.ok(game.timeLeft < 60 - 5 * TIMING.caughtSeconds, 'each catch used up clock time');
  assert.equal(game.stats.timesCaught, 5);
});
