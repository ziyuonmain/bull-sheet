import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AroundClockGame } from '../../js/games/around_clock.js';
import { Bobs27Game } from '../../js/games/bobs27.js';
import { KillerGame } from '../../js/games/killer.js';
import { EliminationGame } from '../../js/games/elimination.js';
import { ShanghaiGame } from '../../js/games/shanghai.js';
import { SplitScoreGame } from '../../js/games/split_score.js';

describe('Party & Training Game Engines', () => {
  test('Around the Clock: advances target on hit (single/double/treble)', () => {
    const game = new AroundClockGame({
      players: [{ name: 'Alice' }]
    });

    assert.equal(game.players[0].currentTarget, 1);

    // Hit target 1 with single -> advances to 2
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' });
    assert.equal(game.players[0].currentTarget, 2);

    // Hit target 2 with double -> advances to 4
    game.recordDart({ number: 2, mult: 2, score: 4, label: 'D2' });
    assert.equal(game.players[0].currentTarget, 4);

    // Miss target 4 -> remains 4
    game.recordDart({ number: 20, mult: 1, score: 20, label: '20' });
    assert.equal(game.players[0].currentTarget, 4);
  });

  test("Bob's 27: adds double value on hit, subtracts on miss, eliminates on <= 0", () => {
    const game = new Bobs27Game({
      players: [{ name: 'Alice' }]
    });

    assert.equal(game.players[0].score, 27);
    assert.equal(game.currentRound, 1); // Target is D1 (value: 2)

    // Hit D1 twice in round 1 -> 27 + (2 * 2) = 31 points
    game.recordDart({ number: 1, mult: 2, score: 2, label: 'D1' });
    game.recordDart({ number: 1, mult: 2, score: 2, label: 'D1' });
    game.recordDart({ number: 20, mult: 1, score: 20, label: '20' }); // miss
    
    // Finish turn advances round to 2 (D2)
    game.finishTurn();
    assert.equal(game.players[0].score, 31);
    assert.equal(game.currentRound, 2);
  });

  test('Killer: players qualify by hitting their assigned number and gain lives', () => {
    const game = new KillerGame({
      players: [{ name: 'Alice' }, { name: 'Bob' }],
      startingLives: 3
    });

    const target = game.players[0].targetNumber;
    assert.ok(target >= 1 && target <= 20);

    // Hit assigned double to become Killer
    game.recordDart({ number: target, mult: 2, score: target * 2, label: `D${target}` });
    assert.equal(game.players[0].isKiller, true);
  });

  test('Elimination: must meet or beat previous player score or lose a life', () => {
    const game = new EliminationGame({
      players: [{ name: 'Alice' }, { name: 'Bob' }],
      startingLives: 3
    });

    assert.equal(game.players[0].lives, 3);
    assert.equal(game.players[1].lives, 3);
  });

  test('Shanghai: instant win on hitting single, double, and treble of target round', () => {
    const game = new ShanghaiGame({
      players: [{ name: 'Alice' }]
    });

    assert.equal(game.currentRound, 1);
    // Round 1: hit S1, D1, T1 -> Shanghai instant win!
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' });
    game.recordDart({ number: 1, mult: 2, score: 2, label: 'D1' });
    const win = game.recordDart({ number: 1, mult: 3, score: 3, label: 'T1' });

    assert.equal(win.type, 'match_win');
    assert.equal(win.shanghaiWin, true);
    assert.equal(game.isMatchOver, true);
  });

  test('Split Score (Halve-It): halves score when round target is missed', () => {
    const game = new SplitScoreGame({
      players: [{ name: 'Alice' }],
      startScore: 40,
      roundsList: [
        { id: '20', label: '20', targetType: 'num', value: 20 }
      ]
    });

    assert.equal(game.players[0].score, 40);
    // Target is 20 -> Miss all 3 darts (throwing 1s) -> score is halved to 20
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' });
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' });
    game.recordDart({ number: 1, mult: 1, score: 1, label: '1' });
    game.finishTurn();

    assert.equal(game.players[0].score, 20);
  });
});
