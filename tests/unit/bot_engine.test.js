import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BotEngine, BOT_PROFILES } from '../../js/bot/bot_engine.js';
import { X01Game } from '../../js/games/x01.js';

describe('BotEngine AI Simulation', () => {
  test('all 5 bot profiles exist with properly scaled skill ratings', () => {
    const expectedProfiles = ['bullshitter', 'pub_regular', 'accountant', 'oche_master', 'machine180'];
    expectedProfiles.forEach(id => {
      assert.ok(BOT_PROFILES[id], `Profile ${id} should exist`);
    });

    // Accuracy scaling
    assert.ok(BOT_PROFILES.bullshitter.missChance > BOT_PROFILES.machine180.missChance);
    assert.ok(BOT_PROFILES.machine180.t20Chance > BOT_PROFILES.bullshitter.t20Chance);
    assert.ok(BOT_PROFILES.machine180.tacticalIQ > BOT_PROFILES.bullshitter.tacticalIQ);
  });

  test('throws valid dart objects for X01 games', () => {
    const bot = new BotEngine('oche_master');
    const x01 = new X01Game({ startScore: 501 });

    for (let i = 0; i < 20; i++) {
      const dart = bot.throwDart('x01', x01, x01.players[0], 0);
      assert.ok(dart, 'Dart should not be null');
      assert.ok(typeof dart.number === 'number', 'Dart number must be a number');
      assert.ok(typeof dart.mult === 'number', 'Dart mult must be a number');
      assert.ok(typeof dart.score === 'number', 'Dart score must be a number');
      assert.ok(dart.score >= 0 && dart.score <= 60, 'Dart score within standard board limits (0 to 60)');
    }
  });

  test('master bot aims for checkout when in range', () => {
    const bot = new BotEngine('machine180');
    // On 40 remaining score, master bot should aim for D20
    const dart = bot.throwDartX01(40, 3, 'double', true);
    assert.ok(dart.score === 40 || dart.number === 20 || dart.score === 0, 'Bot should aim at D20');
  });

  test('dispatcher routes to all game modes without error', () => {
    const bot = new BotEngine('pub_regular');
    const mockPlayer = {
      id: 'p1',
      score: 100,
      hasDoubledIn: true,
      currentTarget: 1,
      targetNumber: 20,
      marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 }
    };
    const mockGame = {
      outMode: 'double',
      mode: 'standard',
      players: [mockPlayer],
      currentTarget: { number: 1, mult: 2, label: 'D1' },
      getCurrentTarget: () => ({ number: 1, mult: 2, label: 'D1' })
    };

    const modes = ['x01', 'cricket', 'split_score', 'killer', 'elimination', 'shanghai', 'around_clock', 'shooter', 'bobs27', 'highscore'];
    modes.forEach(mode => {
      const dart = bot.throwDart(mode, mockGame, mockPlayer, 0);
      assert.ok(dart, `Mode ${mode} should produce a valid dart`);
    });
  });
});
