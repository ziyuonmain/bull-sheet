import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CricketGame } from '../../js/games/cricket.js';

describe('CricketGame Engine', () => {
  test('initializes standard cricket with targets 15-20 and Bull', () => {
    const game = new CricketGame({
      players: [{ name: 'Alice' }, { name: 'Bob' }]
    });

    assert.deepEqual(game.targets, [20, 19, 18, 17, 16, 15, 25]);
    assert.equal(game.players[0].marks[20], 0);
    assert.equal(game.players[0].score, 0);
    assert.equal(game.isMatchOver, false);
  });

  test('3 marks to close a target and score additional points', () => {
    const game = new CricketGame({
      mode: 'standard',
      players: [{ name: 'Alice' }, { name: 'Bob' }]
    });

    // Dart 1: Treble 20 (3 marks -> closes 20)
    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].marks[20], 3);
    assert.equal(game.players[0].score, 0); // closed, no extra yet

    // Dart 2: Single 20 (1 extra hit -> scores 20 points)
    game.recordDart({ number: 20, mult: 1, score: 20, label: '20' });
    assert.equal(game.players[0].marks[20], 3);
    assert.equal(game.players[0].score, 20);
  });

  test('cutthroat mode adds points to open opponents instead of scorer', () => {
    const game = new CricketGame({
      mode: 'cutthroat',
      players: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
    });

    // Alice hits T20 (closes 20)
    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].marks[20], 3);

    // Alice hits another T20 (3 extra hits = 60 points) -> awarded to Bob & Charlie
    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].score, 0); // Alice has lowest (best) score in Cutthroat
    assert.equal(game.players[1].score, 60); // Bob gets penalty points
    assert.equal(game.players[2].score, 60); // Charlie gets penalty points
  });

  test('MPR calculation is accurate', () => {
    const game = new CricketGame({
      players: [{ name: 'Alice' }]
    });

    // Throw 3 marks in 3 darts (1 round)
    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' }); // non-target
    game.recordDart({ number: 2, mult: 1, score: 2, label: '2' }); // non-target
    // 3 darts thrown, 3 marks scored
    const mpr = game.getPlayerMPR(game.players[0]);
    assert.equal(mpr, '3.00');
  });

  test('undo restores marks, scores, and turn darts', () => {
    const game = new CricketGame({
      players: [{ name: 'Alice' }, { name: 'Bob' }]
    });

    game.recordDart({ number: 20, mult: 3, score: 60, label: 'T20' });
    assert.equal(game.players[0].marks[20], 3);

    const undone = game.undo();
    assert.ok(undone);
    assert.equal(game.players[0].marks[20], 0);
    assert.equal(game.turnDarts.length, 0);
  });
});
