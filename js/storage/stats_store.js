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

  loadSavedPlayers() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : [
        { id: 'p_default_1', name: 'Player 1', avatar: '🎯', color: '#f59e0b' },
        { id: 'p_default_2', name: 'Player 2', avatar: '🍺', color: '#3b82f6' }
      ];
    } catch (e) {
      return [
        { id: 'p_default_1', name: 'Player 1', avatar: '🎯', color: '#f59e0b' },
        { id: 'p_default_2', name: 'Player 2', avatar: '🍺', color: '#3b82f6' }
      ];
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
      this.clearActiveMatch();
      return record;
    } catch (e) {
      console.warn('Could not save match record:', e);
      return null;
    }
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

  clearActiveMatch() {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_MATCH);
    } catch (e) {}
  }
}

export const store = new StatsStore();
