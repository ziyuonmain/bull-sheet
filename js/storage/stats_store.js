// LocalStorage state & stats store for BullSheet
const STORAGE_KEY_STATS = 'bullsheet_stats_v1';
const STORAGE_KEY_SETTINGS = 'bullsheet_settings_v1';
const STORAGE_KEY_PLAYERS = 'bullsheet_saved_roster_v2';
const STORAGE_KEY_ACTIVE_MATCH = 'bullsheet_active_match_v1';

class StatsStore {
  constructor() {
    this.settings = this.loadSettings();
    this.savedPlayers = this.loadSavedPlayers();
    this.history = this.loadHistory();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : {
        theme: 'bullsheet',
        sound: true,
        voice: true,
        sarcasm: true,
        volume: 0.8,
        inputMode: 'keypad',
        vibration: true,
        announceTurnTotal: false
      };
    } catch (e) {
      return {
        theme: 'bullsheet',
        sound: true,
        voice: true,
        sarcasm: true,
        volume: 0.8,
        inputMode: 'keypad',
        vibration: true,
        announceTurnTotal: false
      };
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  }

  loadSavedPlayers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(p => p.id !== 'p_default_1' && p.id !== 'p_default_2' && p.name !== 'Player 1' && p.name !== 'Player 2') : [];
    } catch (e) {
      return [];
    }
  }

  saveRoster(players) {
    this.savedPlayers = players;
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(this.savedPlayers));
    } catch (e) {
      console.warn('Could not save players roster:', e);
    }
  }

  addSavedPlayer(name, avatar = '🎯', color = '#f59e0b') {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;

    // Avoid duplicates
    const exists = this.savedPlayers.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return exists;

    const newP = {
      id: 'p_' + Date.now(),
      name: trimmed,
      avatar,
      color,
      created: Date.now()
    };
    this.savedPlayers.push(newP);
    this.saveRoster(this.savedPlayers);
    return newP;
  }

  deleteSavedPlayer(playerId) {
    this.savedPlayers = this.savedPlayers.filter(p => p.id !== playerId);
    this.saveRoster(this.savedPlayers);
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveMatch(matchData) {
    try {
      const record = {
        id: matchData.id || ('m_' + Date.now()),
        date: matchData.date || new Date().toISOString(),
        gameType: matchData.gameType || 'x01',
        players: (matchData.players || []).map(p => {
          const totalDarts = p.stats?.totalDarts || p.totalDartsThrown || 0;
          const totalScore = p.stats?.totalScore || p.totalScoreScored || p.score || 0;
          const highTurn = p.stats?.highTurn || p.highTurn || (p.turns && p.turns.length ? Math.max(0, ...p.turns) : 0);
          const count180 = p.stats?.count180 || p.count180 || 0;
          const count140 = p.stats?.count140 || p.count140 || 0;
          const count100 = p.stats?.count100 || p.count100 || 0;
          const avg = totalDarts > 0 ? Number(((totalScore / totalDarts) * 3).toFixed(1)) : 0;

          return {
            name: p.name,
            isBot: !!p.isBot,
            won: !!p.won,
            score: p.score !== undefined ? p.score : totalScore,
            stats: {
              totalDarts,
              totalScore,
              highTurn,
              count180,
              count140,
              count100,
              threeDartAvg: avg,
              mpr: p.stats?.mpr || p.mpr || 0
            }
          };
        }),
        legsWon: matchData.legsWon || {},
        setsWon: matchData.setsWon || {},
        details: matchData.details || {}
      };
      this.history.unshift(record);
      if (this.history.length > 200) this.history.pop();
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.history));
      this.clearActiveMatch();
      return record;
    } catch (e) {
      console.warn('Could not save match record:', e);
      return null;
    }
  }

  // Aggregate statistics per player with optional game mode filter
  getAggregatedStats(playerName = 'all', modeFilter = 'all') {
    let matches = this.history || [];

    // Filter by Game Mode
    if (modeFilter && modeFilter !== 'all') {
      if (modeFilter === 'party') {
        matches = matches.filter(m => ['killer', 'elimination', 'shanghai', 'shooter', 'highscore', 'around_clock'].includes(m.gameType));
      } else {
        matches = matches.filter(m => m.gameType === modeFilter);
      }
    }

    // Filter by Player Name
    if (playerName && playerName !== 'all') {
      matches = matches.filter(m => m.players && m.players.some(p => p.name.toLowerCase() === playerName.toLowerCase()));
    }

    let totalMatches = matches.length;
    let wins = 0;
    let totalDarts = 0;
    let totalScore = 0;
    let highestTurn = 0;
    let count180 = 0;
    let count140 = 0;
    let count100 = 0;

    matches.forEach(m => {
      if (!m.players) return;
      m.players.forEach(p => {
        const isTarget = playerName === 'all' || p.name.toLowerCase() === playerName.toLowerCase();
        if (!isTarget) return;

        if (p.won) wins++;
        const st = p.stats || {};
        totalDarts += st.totalDarts || 0;
        totalScore += st.totalScore || 0;
        if ((st.highTurn || 0) > highestTurn) highestTurn = st.highTurn;
        count180 += st.count180 || 0;
        count140 += st.count140 || 0;
        count100 += st.count100 || 0;
      });
    });

    const avg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(1) : '—';
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return {
      totalMatches,
      wins,
      winRate,
      avg,
      highestTurn,
      count180,
      count140,
      count100,
      totalDarts,
      totalScore
    };
  }

  // Get list of saved players for stats tracking and drilldown
  getTrackedPlayers() {
    const savedNames = (this.savedPlayers || []).map(p => p.name.trim()).filter(n => n.length > 0);
    return savedNames;
  }

  saveActiveMatchState(state) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_MATCH, JSON.stringify(state));
    } catch (e) {}
  }

  loadActiveMatchState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_MATCH);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  importHistory(jsonData) {
    try {
      const records = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!Array.isArray(records)) {
        throw new Error('Import file must contain a JSON array of matches');
      }

      const validRecords = records.filter(m => m && typeof m === 'object' && (m.gameType || m.mode));
      if (validRecords.length === 0) {
        throw new Error('No valid match records found in file');
      }

      const existingIds = new Set(this.history.map(m => m.id || m.date));
      let importedCount = 0;

      validRecords.forEach(m => {
        const id = m.id || m.date || (Date.now().toString(36) + Math.random().toString(36).substring(2, 6));
        if (!existingIds.has(id)) {
          this.history.unshift(m);
          existingIds.add(id);
          importedCount++;
        }
      });

      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.history));
      return { success: true, count: importedCount, total: this.history.length };
    } catch (e) {
      console.error('Failed to import match history:', e);
      return { success: false, error: e.message };
    }
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem(STORAGE_KEY_STATS);
  }

  clearActiveMatch() {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_MATCH);
    } catch (e) {}
  }
}

export const store = new StatsStore();
