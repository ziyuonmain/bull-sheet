// LocalStorage state & stats store for BullSheet
const STORAGE_KEY_STATS = 'bullsheet_stats_v1';
const STORAGE_KEY_SETTINGS = 'bullsheet_settings_v1';
const STORAGE_KEY_PLAYERS = 'bullsheet_players_v1';

class StatsStore {
  constructor() {
    this.settings = this.loadSettings();
    this.players = this.loadPlayers();
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
        inputMode: 'keypad', // 'keypad' or 'dartboard'
        vibration: true
      };
    } catch (e) {
      return {
        theme: 'bullsheet',
        sound: true,
        voice: true,
        sarcasm: true,
        volume: 0.8,
        inputMode: 'keypad',
        vibration: true
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

  loadPlayers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : [
        { id: 'p1', name: 'Player 1', default: true },
        { id: 'p2', name: 'Player 2', default: true }
      ];
    } catch (e) {
      return [
        { id: 'p1', name: 'Player 1', default: true },
        { id: 'p2', name: 'Player 2', default: true }
      ];
    }
  }

  savePlayers(players) {
    this.players = players;
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(this.players));
    } catch (e) {
      console.warn('Could not save players:', e);
    }
  }

  addPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const player = {
      id: 'p_' + Date.now(),
      name: trimmed,
      created: Date.now()
    };
    this.players.push(player);
    this.savePlayers(this.players);
    return player;
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
        id: 'm_' + Date.now(),
        date: new Date().toISOString(),
        gameType: matchData.gameType,
        players: matchData.players.map(p => ({
          name: p.name,
          isBot: !!p.isBot,
          won: !!p.won,
          stats: p.stats || {}
        })),
        legsWon: matchData.legsWon || {},
        setsWon: matchData.setsWon || {},
        details: matchData.details || {}
      };
      this.history.unshift(record);
      if (this.history.length > 100) this.history.pop();
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.history));
      return record;
    } catch (e) {
      console.warn('Could not save match record:', e);
      return null;
    }
  }

  clearHistory() {
    this.history = [];
    try {
      localStorage.removeItem(STORAGE_KEY_STATS);
    } catch (e) {}
  }

  getPlayerStats(playerName) {
    let matches = 0;
    let wins = 0;
    let totalDarts = 0;
    let totalScore = 0;
    let highTurn = 0;
    let count180 = 0;
    let count140 = 0;
    let count100 = 0;

    this.history.forEach(m => {
      const p = m.players.find(x => x.name.toLowerCase() === playerName.toLowerCase());
      if (p) {
        matches++;
        if (p.won) wins++;
        if (p.stats) {
          totalDarts += p.stats.totalDarts || 0;
          totalScore += p.stats.totalScore || 0;
          if ((p.stats.highTurn || 0) > highTurn) highTurn = p.stats.highTurn;
          count180 += p.stats.count180 || 0;
          count140 += p.stats.count140 || 0;
          count100 += p.stats.count100 || 0;
        }
      }
    });

    const avg = totalDarts > 0 ? ((totalScore / totalDarts) * 3).toFixed(2) : '0.00';
    const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) + '%' : '0%';

    return {
      matches,
      wins,
      winRate,
      avg,
      highTurn,
      count180,
      count140,
      count100
    };
  }
}

export const store = new StatsStore();
