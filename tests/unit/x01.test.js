import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { X01Game } from '../../js/games/x01.js';

describe('X01Game Engine', () => {
  test('initializes with default 501 double-out and players', () => {
    const game = new X01Game({
      startScore: 501,
      players: [{ name: 'Alice' }, { name: 'Bob' }]
    });

    assert.equal(game.players.length, 2);
    assert.equal(game.players[0].name, 'Alice');
    assert.equal(game.players[0].score, 501);
    assert.equal(game.players[1].score, 501);
    assert.equal(game.activePlayerIdx, 0);
    assert.equal(game.isMatchOver, false);
  });

  test('scores single, double, and treble darts correctly in straight-in mode', () => {
    const game = new X01Game({
      startScore: 501,
      inMode: 'straight',
      outMode: 'double',
      players: [{ name: 'Alice' }]
    });

    // Throw T20 (60 points)
    const d1 = game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].score, 441);
    assert.equal(game.turnDarts.length, 1);
    assert.equal(d1.type, 'dart_recorded');

    // Throw T20 (60 points)
    const d2 = game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].score, 381);
    assert.equal(game.turnDarts.length, 2);
    assert.equal(d2.type, 'dart_recorded');

    // Throw T20 (60 points) -> 180!
    const d3 = game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].score, 321);
    assert.equal(game.turnDarts.length, 3);
    assert.equal(d3.type, 'visit_complete');
    assert.equal(d3.turnScore, 180);
  });

  test('handles Double In mode: ignores score until double is hit', () => {
    const game = new X01Game({
      startScore: 301,
      inMode: 'double',
      outMode: 'double',
      players: [{ name: 'Alice' }]
    });

    assert.equal(game.isEntryLocked(), true);

    // Single 20 without double-in -> score stays 301, lockedMiss is true
    const d1 = game.recordDart({ number: 20, mult: 1, score: 20, label: '20' });
    assert.equal(game.players[0].score, 301);
    assert.equal(game.players[0].hasDoubledIn, false);
    assert.equal(d1.lockedMiss, true);
    assert.equal(d1.justOpened, false);
    assert.equal(game.isEntryLocked(), true);

    // Hit Double 16 -> Doubles in, scores 32 points!
    const d2 = game.recordDart({ number: 16, mult: 2, score: 32, label: 'D16' });
    assert.equal(game.players[0].hasDoubledIn, true);
    assert.equal(game.players[0].score, 269);
    assert.equal(d2.justOpened, true);
    assert.equal(d2.lockedMiss, false);
    assert.equal(game.isEntryLocked(), false);

    // Undo should restore locked state
    game.undo();
    assert.equal(game.players[0].hasDoubledIn, false);
    assert.equal(game.players[0].score, 301);
    assert.equal(game.isEntryLocked(), true);
  });

  test('handles Master In mode: allows doubles and trebles to qualify', () => {
    const game = new X01Game({
      startScore: 501,
      inMode: 'master',
      outMode: 'double',
      players: [{ name: 'Alice' }]
    });

    assert.equal(game.isEntryLocked(), true);

    // Single 20 -> ignored
    const d1 = game.recordDart({ number: 20, mult: 1, score: 20, label: '20' });
    assert.equal(game.players[0].score, 501);
    assert.equal(d1.lockedMiss, true);

    // Treble 20 -> qualifies in Master In!
    const d2 = game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].hasDoubledIn, true);
    assert.equal(game.players[0].score, 441);
    assert.equal(d2.justOpened, true);
    assert.equal(game.isEntryLocked(), false);
  });

  test('bust logic: reverts score and detects bust on leaving 1 or going negative', () => {
    const game = new X01Game({
      startScore: 40,
      inMode: 'straight',
      outMode: 'double',
      players: [{ name: 'Alice' }]
    });

    // Throw 20 first (score becomes 20)
    game.recordDart({ number: 20, mult: 1, score: 20, label: '20' });
    assert.equal(game.players[0].score, 20);

    // Throw 19 (leaves 1 point -> bust in double out)
    const bust1 = game.recordDart({ number: 19, mult: 1, score: 19, label: '19' });
    assert.equal(bust1.type, 'bust');
    assert.equal(game.players[0].score, 40); // Score reverts to start of turn

    game.finishTurn();

    // Next turn: throw 60 (exceeds 40 -> bust)
    const bust2 = game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(bust2.type, 'bust');
    assert.equal(game.players[0].score, 40);
  });

  test('winning checkout: finishes leg on double and advances set/match', () => {
    const game = new X01Game({
      startScore: 32,
      inMode: 'straight',
      outMode: 'double',
      legsToWin: 1,
      setsToWin: 1,
      players: [{ name: 'Alice' }]
    });

    // Hit D16 to win
    const win = game.recordDart({ number: 16, mult: 2, score: 32, label: 'D16' });
    assert.equal(win.type, 'match_win');
    assert.equal(game.isMatchOver, true);
    assert.equal(game.winner.name, 'Alice');
  });

  test('full undo stack restores state accurately', () => {
    const game = new X01Game({
      startScore: 501,
      players: [{ name: 'Alice' }, { name: 'Bob' }]
    });

    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].score, 441);
    assert.equal(game.turnDarts.length, 1);

    const undone = game.undo();
    assert.ok(undone);
    assert.equal(game.players[0].score, 501);
    assert.equal(game.turnDarts.length, 0);
  });
});
