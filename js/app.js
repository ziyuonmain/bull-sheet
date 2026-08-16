// Main BullSheet Application Controller
import { sound } from './audio/sound_effects.js';
import { caller } from './audio/caller.js';
import { store } from './storage/stats_store.js';
import { Dartboard } from './components/dartboard.js';
import { Keypad } from './components/keypad.js';
import { Scoreboard } from './components/scoreboard.js';
import { BotEngine, BOT_PROFILES } from './bot/bot_engine.js';

import { X01Game } from './games/x01.js';
import { CricketGame } from './games/cricket.js';
import { SplitScoreGame } from './games/split_score.js';
import { ShanghaiGame } from './games/shanghai.js';
import { KillerGame } from './games/killer.js';
import { EliminationGame } from './games/elimination.js';
import { AroundClockGame } from './games/around_clock.js';

class BullSheetApp {
  constructor() {
    this.currentGame = null;
    this.bot = new BotEngine();
    this.inputMode = store.settings.inputMode || 'keypad';
    this.selectedGameType = 'x01';
    
    // Players staging in setup
    this.matchPlayers = [
      { id: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', name: 'Player 2', isBot: false }
    ];

    this.excuses = [
      "There was a violent draft from the kitchen window.",
      "The board is hung 2.5 millimeters too high.",
      "A rogue fly crossed my line of sight at the release point.",
      "My dart flight had micro-aerodynamic turbulence.",
      "The oche line was slippery.",
      "I was aiming for Treble 20, but Treble 1 jumped in the way.",
      "My pint was too heavy, threw off my wrist calibration.",
      "The lighting in here is at an unplayable 4700 Kelvin.",
      "Someone breathed heavily three tables over.",
      "My darts need to be re-weighted by an expert.",
      "I was practicing my defensive darts strategy.",
      "The gravity in this room is inconsistent.",
      "Classic pub chalk dust got into my throwing eye."
    ];

    this.init();
  }

  init() {
    this.applyTheme(store.settings.theme || 'bullsheet');
    sound.toggle(store.settings.sound);
    sound.setVolume(store.settings.volume || 0.8);
    caller.toggle(store.settings.voice);
    caller.toggleSarcasm(store.settings.sarcasm);

    this.scoreboard = new Scoreboard(document.getElementById('scoreboard-container'));
    this.initDartboard();
    this.initKeypad();
    this.attachNavEvents();
    this.attachSetupEvents();
    this.attachGameControlEvents();
    this.attachModalEvents();
    this.renderPlayerRosterSetup();
    this.renderStatsView();

    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration:', err);
      });
    }
  }

  applyTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    store.saveSettings({ theme: themeName });
    const select = document.getElementById('setting-theme');
    if (select) select.value = themeName;
  }

  vibrate(ms = 15) {
    if (store.settings.vibration && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  initDartboard() {
    const container = document.getElementById('dartboard-container');
    this.dartboard = new Dartboard(container, (hit) => {
      this.handleDartHit(hit);
    });
  }

  initKeypad() {
    const container = document.getElementById('keypad-container');
    this.keypad = new Keypad(
      container,
      (score) => this.handleTurnScoreSubmit(score),
      () => this.handleUndo()
    );
  }

  // Route Switcher
  showView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-view');
    window.scrollTo(0, 0);
  }

  // --- Setup & Match Staging ---
  renderPlayerRosterSetup() {
    const rosterEl = document.getElementById('setup-player-list');
    if (!rosterEl) return;

    rosterEl.innerHTML = this.matchPlayers.map((p, idx) => `
      <div class="roster-item ${p.isBot ? 'is-bot-item' : ''}" data-idx="${idx}">
        <span class="player-num">#${idx + 1}</span>
        <input type="text" class="player-name-input" value="${p.name}" data-idx="${idx}" placeholder="Player Name" />
        <div class="roster-actions">
          <button class="btn-toggle-bot ${p.isBot ? 'active' : ''}" data-idx="${idx}" title="Toggle Bot/Human">
            ${p.isBot ? '🤖 BOT' : '👤 HUMAN'}
          </button>
          ${p.isBot ? `
            <select class="bot-profile-select" data-idx="${idx}">
              ${Object.values(BOT_PROFILES).map(prof => `
                <option value="${prof.id}" ${p.botProfile === prof.id ? 'selected' : ''}>${prof.name} (${prof.targetAvg} avg)</option>
              `).join('')}
            </select>
          ` : ''}
          ${this.matchPlayers.length > 1 ? `
            <button class="btn-remove-player" data-idx="${idx}" title="Remove Player">✕</button>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Attach listeners
    rosterEl.querySelectorAll('.player-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.matchPlayers[idx].name = e.target.value;
      });
    });

    rosterEl.querySelectorAll('.btn-toggle-bot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sound.playClick();
        const idx = parseInt(btn.dataset.idx, 10);
        this.matchPlayers[idx].isBot = !this.matchPlayers[idx].isBot;
        if (this.matchPlayers[idx].isBot && !this.matchPlayers[idx].botProfile) {
          this.matchPlayers[idx].botProfile = 'pub_regular';
        }
        this.renderPlayerRosterSetup();
      });
    });

    rosterEl.querySelectorAll('.bot-profile-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.dataset.idx, 10);
        this.matchPlayers[idx].botProfile = e.target.value;
      });
    });

    rosterEl.querySelectorAll('.btn-remove-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        sound.playClick();
        const idx = parseInt(btn.dataset.idx, 10);
        this.matchPlayers.splice(idx, 1);
        this.renderPlayerRosterSetup();
      });
    });
  }

  attachSetupEvents() {
    // Mode Card Selection
    document.querySelectorAll('.game-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.game-mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedGameType = card.dataset.mode;

        // Show/hide relevant options
        const x01Opts = document.getElementById('setup-x01-options');
        const cricketOpts = document.getElementById('setup-cricket-options');
        const partyOpts = document.getElementById('setup-party-options');

        if (x01Opts) x01Opts.style.display = this.selectedGameType === 'x01' ? 'block' : 'none';
        if (cricketOpts) cricketOpts.style.display = this.selectedGameType === 'cricket' ? 'block' : 'none';
        if (partyOpts) partyOpts.style.display = ['killer', 'elimination', 'shanghai', 'split_score'].includes(this.selectedGameType) ? 'block' : 'none';
      });
    });

    // Add Player Button
    const addPlayerBtn = document.getElementById('btn-add-player');
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', () => {
        sound.playClick();
        if (this.matchPlayers.length < 8) {
          this.matchPlayers.push({
            id: 'p_' + Date.now(),
            name: `Player ${this.matchPlayers.length + 1}`,
            isBot: false
          });
          this.renderPlayerRosterSetup();
        }
      });
    }

    // Start Game Button
    const startBtn = document.getElementById('btn-start-match');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        sound.playClick();
        this.startMatch();
      });
    }
  }

  startMatch() {
    const playersCopy = this.matchPlayers.map(p => ({ ...p, name: p.name.trim() || 'Player' }));

    switch (this.selectedGameType) {
      case 'x01': {
        const startScore = parseInt(document.getElementById('opt-x01-score')?.value || '501', 10);
        const outMode = document.getElementById('opt-x01-out')?.value || 'double';
        const inMode = document.getElementById('opt-x01-in')?.value || 'straight';
        const legsToWin = parseInt(document.getElementById('opt-x01-legs')?.value || '3', 10);
        this.currentGame = new X01Game({
          startScore,
          outMode,
          inMode,
          legsToWin,
          players: playersCopy
        });
        break;
      }
      case 'cricket': {
        const mode = document.getElementById('opt-cricket-mode')?.value || 'standard';
        this.currentGame = new CricketGame({
          mode,
          players: playersCopy
        });
        break;
      }
      case 'split_score': {
        this.currentGame = new SplitScoreGame({
          players: playersCopy
        });
        break;
      }
      case 'shanghai': {
        const rounds = parseInt(document.getElementById('opt-party-shanghai-rounds')?.value || '7', 10);
        this.currentGame = new ShanghaiGame({
          rounds,
          players: playersCopy
        });
        break;
      }
      case 'killer': {
        const lives = parseInt(document.getElementById('opt-party-killer-lives')?.value || '5', 10);
        this.currentGame = new KillerGame({
          startingLives: lives,
          players: playersCopy
        });
        break;
      }
      case 'elimination': {
        const lives = parseInt(document.getElementById('opt-party-killer-lives')?.value || '3', 10);
        this.currentGame = new EliminationGame({
          startingLives: lives,
          players: playersCopy
        });
        break;
      }
      case 'around_clock': {
        this.currentGame = new AroundClockGame({
          players: playersCopy
        });
        break;
      }
      default:
        return;
    }

    this.setInputMode(this.inputMode);
    this.showView('view-game');
    this.updateScoreboard();

    const active = this.currentGame.getActivePlayer();
    caller.callTurn(active.name);

    if (active.isBot) {
      this.triggerBotTurn();
    }
  }

  setInputMode(mode) {
    this.inputMode = mode;
    store.saveSettings({ inputMode: mode });

    const kpContainer = document.getElementById('keypad-container');
    const dbContainer = document.getElementById('dartboard-container');
    const toggleBtn = document.getElementById('btn-toggle-input-mode');

    if (mode === 'keypad') {
      if (kpContainer) kpContainer.style.display = 'block';
      if (dbContainer) dbContainer.style.display = 'none';
      if (toggleBtn) toggleBtn.textContent = '🎯 Switch to Dartboard';
    } else {
      if (kpContainer) kpContainer.style.display = 'none';
      if (dbContainer) dbContainer.style.display = 'flex';
      if (toggleBtn) toggleBtn.textContent = '🔢 Switch to Keypad';
    }
  }

  // --- In-Game Logic ---
  handleDartHit(dart) {
    if (!this.currentGame || this.currentGame.isMatchOver) return;
    this.vibrate(20);

    if (dart.mult === 3 || dart.score === 50) {
      sound.playTrebleHit();
    } else if (dart.score === 25) {
      sound.playBullseye();
    } else {
      sound.playDartHit();
    }

    const res = this.currentGame.recordDart(dart);
    this.processGameEvent(res);
  }

  handleTurnScoreSubmit(score) {
    if (!this.currentGame || this.currentGame.isMatchOver) return;
    this.vibrate(25);

    if (score === 180) {
      sound.play180Fanfare();
      this.trigger180Confetti();
    } else {
      sound.playDartHit();
    }

    let res = null;
    if (this.currentGame.recordTurnScore) {
      res = this.currentGame.recordTurnScore(score);
    } else {
      // For games without recordTurnScore, throw 3 single darts equivalent
      res = this.currentGame.recordDart({ number: score, mult: 1, score: score, label: `${score}` });
    }

    this.processGameEvent(res);
  }

  handleUndo() {
    if (!this.currentGame) return;
    sound.playClick();
    this.vibrate(10);
    this.currentGame.undo();
    if (this.dartboard) this.dartboard.clearHits();
    this.updateScoreboard();
  }

  processGameEvent(res) {
    if (!res) return;
    this.updateScoreboard();

    if (res.type === 'match_win') {
      sound.playWin();
      caller.callGameShot(res.winner.name, true);
      store.saveMatch({
        gameType: this.selectedGameType,
        players: this.currentGame.players.map(p => ({
          name: p.name,
          isBot: p.isBot,
          won: p.id === res.winner.id,
          stats: {
            totalDarts: p.totalDarts,
            totalScore: p.totalScoreScored || p.score,
            highTurn: p.highTurn || 0,
            count180: p.count180 || 0,
            count140: p.count140 || 0,
            count100: p.count100 || 0
          }
        }))
      });
      this.renderSummary(res.winner);
      this.showView('view-summary');
      return;
    }

    if (res.type === 'leg_win') {
      sound.playWin();
      caller.callGameShot(res.winner.name, false);
      if (this.dartboard) this.dartboard.clearHits();
      return;
    }

    if (res.type === 'bust') {
      sound.playBust();
      caller.callBust(res.player.name);
      if (this.dartboard) this.dartboard.clearHits();
    }

    if (res.type === 'turn_end') {
      if (this.dartboard) this.dartboard.clearHits();
      const nextPlayer = this.currentGame.getActivePlayer();
      caller.callScore(res.turnScore || 0, res.player?.name);

      setTimeout(() => {
        if (!this.currentGame.isMatchOver) {
          caller.callTurn(nextPlayer.name);
          if (nextPlayer.isBot) {
            this.triggerBotTurn();
          }
        }
      }, 900);
    }
  }

  updateScoreboard() {
    if (!this.currentGame) return;

    switch (this.selectedGameType) {
      case 'x01':
        this.scoreboard.renderX01(this.currentGame);
        break;
      case 'cricket':
        this.scoreboard.renderCricket(this.currentGame);
        break;
      case 'split_score':
        this.scoreboard.renderSplitScore(this.currentGame);
        break;
      case 'shanghai':
        this.scoreboard.renderShanghai(this.currentGame);
        break;
      case 'killer':
        this.scoreboard.renderKiller(this.currentGame);
        break;
      case 'elimination':
        this.scoreboard.renderElimination(this.currentGame);
        break;
      case 'around_clock':
        this.scoreboard.renderAroundClock(this.currentGame);
        break;
    }
  }

  triggerBotTurn() {
    const player = this.currentGame.getActivePlayer();
    if (!player || !player.isBot || this.currentGame.isMatchOver) return;

    this.bot.setProfile(player.botProfile || 'pub_regular');

    let dartIndex = 0;
    const throwInterval = setInterval(() => {
      if (this.currentGame.isMatchOver || dartIndex >= 3) {
        clearInterval(throwInterval);
        return;
      }

      let dart;
      if (this.selectedGameType === 'x01') {
        dart = this.bot.throwDartX01(player.score, 3 - dartIndex, this.currentGame.outMode);
      } else if (this.selectedGameType === 'cricket') {
        dart = this.bot.throwDartCricket();
      } else {
        dart = this.bot.simulateAimAt('T20', 0.35);
      }

      this.handleDartHit(dart);
      dartIndex++;

      if (dartIndex >= 3 || this.currentGame.isMatchOver) {
        clearInterval(throwInterval);
      }
    }, 750);
  }

  trigger180Confetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + '%';
      el.style.animationDelay = Math.random() * 0.5 + 's';
      el.style.backgroundColor = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'][Math.floor(Math.random() * 5)];
      container.appendChild(el);
    }
    setTimeout(() => { container.innerHTML = ''; }, 3500);
  }

  // --- Modals & Global Controls ---
  attachGameControlEvents() {
    // Switch input mode (Keypad vs Dartboard)
    const toggleModeBtn = document.getElementById('btn-toggle-input-mode');
    if (toggleModeBtn) {
      toggleModeBtn.addEventListener('click', () => {
        sound.playClick();
        this.setInputMode(this.inputMode === 'keypad' ? 'dartboard' : 'keypad');
      });
    }

    // Excuse Generator Button
    const excuseBtn = document.getElementById('btn-excuse-generator');
    if (excuseBtn) {
      excuseBtn.addEventListener('click', () => {
        sound.playClick();
        this.showExcuseModal();
      });
    }

    // Sound toggle
    const soundBtn = document.getElementById('btn-quick-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = sound.toggle();
        store.saveSettings({ sound: enabled });
        soundBtn.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }

    // Voice toggle
    const voiceBtn = document.getElementById('btn-quick-voice');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        const enabled = caller.toggle();
        store.saveSettings({ voice: enabled });
        voiceBtn.textContent = enabled ? '🗣️ Caller: ON' : '🤫 Caller: OFF';
      });
    }

    // End Game
    const endBtn = document.getElementById('btn-end-game');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to end this match?')) {
          this.showView('view-setup');
        }
      });
    }
  }

  showExcuseModal() {
    const modal = document.getElementById('modal-excuse');
    const textEl = document.getElementById('excuse-text');
    if (!modal || !textEl) return;

    const randomExcuse = this.excuses[Math.floor(Math.random() * this.excuses.length)];
    textEl.textContent = `"${randomExcuse}"`;
    modal.classList.add('active');
  }

  attachModalEvents() {
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.modal-window').forEach(m => m.classList.remove('active'));
      });
    });

    const nextExcuseBtn = document.getElementById('btn-next-excuse');
    if (nextExcuseBtn) {
      nextExcuseBtn.addEventListener('click', () => {
        sound.playClick();
        const textEl = document.getElementById('excuse-text');
        const randomExcuse = this.excuses[Math.floor(Math.random() * this.excuses.length)];
        if (textEl) textEl.textContent = `"${randomExcuse}"`;
      });
    }
  }

  attachNavEvents() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetView = btn.dataset.target;
        this.showView(targetView);
        if (targetView === 'view-stats') {
          this.renderStatsView();
        }
      });
    });

    // Theme selector
    const themeSel = document.getElementById('setting-theme');
    if (themeSel) {
      themeSel.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    // Rematch button
    const rematchBtn = document.getElementById('btn-rematch');
    if (rematchBtn) {
      rematchBtn.addEventListener('click', () => {
        sound.playClick();
        this.startMatch();
      });
    }

    // New Match button
    const newMatchBtn = document.getElementById('btn-new-match');
    if (newMatchBtn) {
      newMatchBtn.addEventListener('click', () => {
        sound.playClick();
        this.showView('view-setup');
      });
    }
  }

  renderSummary(winner) {
    const winNameEl = document.getElementById('summary-winner-name');
    const tableBody = document.getElementById('summary-stats-tbody');
    if (winNameEl) winNameEl.textContent = `🏆 ${winner.name} WINS!`;

    if (tableBody && this.currentGame) {
      tableBody.innerHTML = this.currentGame.players.map(p => `
        <tr>
          <td><strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}</td>
          <td>${p.score}</td>
          <td>${p.legsWon || 0}</td>
          <td>${this.currentGame.getPlayerAvg ? this.currentGame.getPlayerAvg(p) : '—'}</td>
          <td>${p.highTurn || 0}</td>
          <td>${p.count180 || 0}</td>
        </tr>
      `).join('');
    }
  }

  renderStatsView() {
    const listEl = document.getElementById('stats-match-history');
    if (!listEl) return;

    const history = store.history;
    if (history.length === 0) {
      listEl.innerHTML = '<p class="empty-hint">No matches recorded yet. Play a game to see your stats!</p>';
      return;
    }

    listEl.innerHTML = history.slice(0, 15).map(m => `
      <div class="history-item-card">
        <div class="history-header">
          <span class="hist-mode">${m.gameType.toUpperCase()}</span>
          <span class="hist-date">${new Date(m.date).toLocaleDateString()}</span>
        </div>
        <div class="hist-players">
          ${m.players.map(p => `
            <div class="hist-player-row ${p.won ? 'is-winner' : ''}">
              <span>${p.won ? '👑 ' : ''}${p.name}</span>
              <span>Avg: ${p.stats?.totalDarts ? ((p.stats.totalScore / p.stats.totalDarts) * 3).toFixed(1) : '—'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BullSheetApp();
});
