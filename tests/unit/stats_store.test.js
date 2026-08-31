import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage if not in browser
if (!globalThis.localStorage) {
  const storeMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => storeMap.get(k) || null,
    setItem: (k, v) => storeMap.set(k, String(v)),
    removeItem: (k) => storeMap.delete(k),
    clear: () => storeMap.clear()
  };
}

import { store } from '../../js/storage/stats_store.js';

describe('StatsStore Persistence', () => {
  beforeEach(() => {
    store.clearHistory();
  });

  test('saves and loads settings correctly', () => {
    store.saveSettings({ volume: 0.5, theme: 'dark' });
    const settings = store.loadSettings();
    assert.equal(settings.volume, 0.5);
    assert.equal(settings.theme, 'dark');
  });

  test('saves roster and manages custom player profiles', () => {
    const players = [
      { id: 'p_1', name: 'Ziyu' },
      { id: 'p_2', name: 'Opponent' }
    ];
    store.saveRoster(players);
    const loaded = store.loadSavedPlayers();
    assert.equal(loaded.length, 2);
    assert.equal(loaded[0].name, 'Ziyu');
  });

  test('records match and tracks lifetime statistics', () => {
    const matchRecord = {
      id: 'match_1',
      date: new Date().toISOString(),
      gameType: 'x01',
      players: [{ name: 'Ziyu', won: true, totalDartsThrown: 15, totalScoreScored: 501, count180: 1 }]
    };

    store.saveMatch(matchRecord);
    const history = store.loadHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].id, 'match_1');

    const stats = store.getAggregatedStats('Ziyu', 'x01');
    assert.equal(stats.totalMatches, 1);
    assert.equal(stats.wins, 1);
  });

  test('isolates X01 metrics and computes mode-specific stats for non-X01 games', () => {
    // 1 X01 match (15 darts, 501 score -> 100.2 avg)
    store.saveMatch({
      id: 'x01_m1',
      date: new Date().toISOString(),
      gameType: 'x01',
      players: [{ name: 'Alice', won: true, stats: { totalDarts: 15, totalScore: 501, count180: 1, highTurn: 180 } }]
    });

    // 1 Bob's 27 match (63 darts, 150 score, 8 doubles hit)
    store.saveMatch({
      id: 'bobs_m1',
      date: new Date().toISOString(),
      gameType: 'bobs27',
      players: [{ name: 'Alice', won: true, score: 150, stats: { totalDarts: 63, totalDoublesHit: 8, isEliminated: false } }]
    });

    // 1 Cricket match (24 darts, 18 marks)
    store.saveMatch({
      id: 'cricket_m1',
      date: new Date().toISOString(),
      gameType: 'cricket',
      players: [{ name: 'Alice', won: true, stats: { totalDarts: 24, totalMarks: 18 } }]
    });

    // Overview / All Matches: x01Avg is computed strictly from X01 match (100.2), not polluted by Bob's 27 or Cricket
    const allStats = store.getAggregatedStats('Alice', 'all');
    assert.equal(allStats.totalMatches, 3);
    assert.equal(allStats.x01Avg, '100.2');
    assert.equal(allStats.count180, 1);
    assert.equal(allStats.totalDarts, 15 + 63 + 24);

    // Cricket filter
    const cricketStats = store.getAggregatedStats('Alice', 'cricket');
    assert.equal(cricketStats.totalMatches, 1);
    assert.equal(cricketStats.cricketMPR, '2.25'); // (18 marks / 24 darts) * 3
    assert.equal(cricketStats.totalMarks, 18);

    // Bob's 27 filter
    const bobsStats = store.getAggregatedStats('Alice', 'bobs27');
    assert.equal(bobsStats.totalMatches, 1);
    assert.equal(bobsStats.highScore, 150);
    assert.equal(bobsStats.totalDoublesHit, 8);
    assert.equal(bobsStats.survivedCount, 1);
  });

  test('exports and imports match history accurately', () => {
    const records = [
      { id: 'match_export_1', gameType: 'cricket' },
      { id: 'match_export_2', gameType: 'x01' }
    ];

    const importRes = store.importHistory(records);
    assert.equal(importRes.success, true);
    assert.equal(importRes.count, 2);
  });
});
