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
