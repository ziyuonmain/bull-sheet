// Main BullSheet Application Controller
import { sound } from './audio/sound_effects.js';
import { caller } from './audio/caller.js';
import { store } from './storage/stats_store.js';
import { Dartboard } from './components/dartboard.js';
import { DartKeypad } from './components/dart_keypad.js';
import { Scoreboard } from './components/scoreboard.js';
import { GAME_RULES } from './components/rules_modal.js';
import { BotEngine, BOT_PROFILES } from './bot/bot_engine.js';

import { X01Game } from './games/x01.js';
import { CricketGame } from './games/cricket.js';
import { HighscoreGame } from './games/highscore.js';
import { ShooterGame } from './games/shooter.js';
import { SplitScoreGame } from './games/split_score.js';
import { ShanghaiGame } from './games/shanghai.js';
import { KillerGame } from './games/killer.js';
import { EliminationGame } from './games/elimination.js';
import { AroundClockGame } from './games/around_clock.js';

class BullSheetApp {
  constructor() {
    this.currentGame = null;
    this.bot = new BotEngine();
    this.inputMode = store.settings.inputMode === 'dartboard' ? 'dartboard' : 'dart_keypad';
    this.selectedGameType = 'x01';
    this.pendingNavTarget = null;
    
    // Players staging in setup
    this.matchPlayers = [
      { id: 'p1', name: store.savedPlayers[0]?.name || 'Player 1', isBot: false },
      { id: 'p2', name: store.savedPlayers[1]?.name || 'Player 2', isBot: false }
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
    this.initDartKeypad();
    this.attachNavEvents();
    this.attachSetupEvents();
    this.attachGameControlEvents();
    this.attachModalEvents();
    this.attachRosterManagerEvents();
    this.renderSavedRosterChips();
    this.renderPlayerRosterSetup();
    this.renderStatsView();
    this.checkSavedActiveMatch();

    // Prevent accidental page reload/unload during live game
    window.addEventListener('beforeunload', (e) => {
      if (this.isMatchInProgress()) {
        e.preventDefault();
        e.returnValue = ''; // Required standard for browser warning
        return '';
      }
    });

    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration:', err);
      });
    }
  }

  isMatchInProgress() {
    return this.currentGame && !this.currentGame.isMatchOver;
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

  initDartKeypad() {
    const container = document.getElementById('dart-keypad-container');
    this.dartKeypad = new DartKeypad(
      container,
      (dart) => this.handleDartHit(dart),
      () => this.handleUndo()
    );
  }

  // Brand Logo Click
  handleBrandClick() {
    sound.playClick();
    if (this.isMatchInProgress()) {
      this.pendingNavTarget = 'view-setup';
      document.getElementById('modal-confirm-exit')?.classList.add('active');
    } else {
      this.showView('view-setup');
    }
  }

  // Route Switcher with Tab Sync and Progress Loss Guard
  showView(viewId, force = false) {
    if (!force && this.isMatchInProgress() && viewId !== 'view-game' && viewId !== 'view-summary') {
      this.pendingNavTarget = viewId;
      const confirmModal = document.getElementById('modal-confirm-exit');
      if (confirmModal) {
        confirmModal.classList.add('active');
        return;
      }
    }

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-view');

    // Sync top nav tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === viewId);
    });

    window.scrollTo(0, 0);
  }

  // --- Saved Roster Management ---
  renderSavedRosterChips() {
    const chipsContainer = document.getElementById('saved-roster-chips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = store.savedPlayers.map(p => {
      const isAlreadyInMatch = this.matchPlayers.some(mp => mp.name.toLowerCase() === p.name.toLowerCase());
      return `
        <button class="roster-chip-btn ${isAlreadyInMatch ? 'in-lineup' : ''}" type="button" data-name="${p.name}">
          ${isAlreadyInMatch ? '✓' : '+'} ${p.name}
        </button>
      `;
    }).join('');

    chipsContainer.querySelectorAll('.roster-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const name = btn.dataset.name;
        this.addPlayerToLineup(name);
      });
    });
  }

  addPlayerToLineup(name) {
    if (this.matchPlayers.length >= 8) return;
    const exists = this.matchPlayers.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    this.matchPlayers.push({
      id: 'p_' + Date.now(),
      name,
      isBot: false
    });
    this.renderPlayerRosterSetup();
    this.renderSavedRosterChips();
  }

  renderRosterManagerModal() {
    const listEl = document.getElementById('roster-manager-list');
    if (!listEl) return;

    listEl.innerHTML = store.savedPlayers.map(p => `
      <div class="roster-manager-item" style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-primary); border-radius:6px; margin-bottom:6px;">
        <span style="font-weight:700; color:var(--text-primary);">🎯 ${p.name}</span>
        <button class="btn-delete-saved-player" type="button" data-id="${p.id}" style="background:none; border:none; color:#ef4444; font-size:1.1rem; cursor:pointer;" title="Delete Profile">🗑️</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-delete-saved-player').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const id = btn.dataset.id;
        store.deleteSavedPlayer(id);
        this.renderRosterManagerModal();
        this.renderSavedRosterChips();
      });
    });
  }

  attachRosterManagerEvents() {
    document.getElementById('btn-open-roster-manager')?.addEventListener('click', () => {
      sound.playClick();
      this.renderRosterManagerModal();
      document.getElementById('modal-roster-manager')?.classList.add('active');
    });

    document.getElementById('btn-save-new-profile')?.addEventListener('click', () => {
      sound.playClick();
      const inp = document.getElementById('inp-new-roster-name');
      if (inp && inp.value.trim()) {
        store.addSavedPlayer(inp.value.trim());
        inp.value = '';
        this.renderRosterManagerModal();
        this.renderSavedRosterChips();
      }
    });

    document.getElementById('btn-confirm-stay')?.addEventListener('click', () => {
      sound.playClick();
      document.getElementById('modal-confirm-exit')?.classList.remove('active');
      this.pendingNavTarget = null;
    });

    document.getElementById('btn-confirm-leave')?.addEventListener('click', () => {
      sound.playClick();
      document.getElementById('modal-confirm-exit')?.classList.remove('active');
      this.currentGame = null;
      store.clearActiveMatch();
      this.removeResumeBanner();
      if (this.pendingNavTarget) {
        this.showView(this.pendingNavTarget, true);
        this.pendingNavTarget = null;
      } else {
        this.showView('view-setup', true);
      }
    });
  }

  // --- Match Recovery State ---
  saveCurrentMatchState() {
    if (!this.currentGame || this.currentGame.isMatchOver) {
      store.clearActiveMatch();
      return;
    }
    store.saveActiveMatchState({
      gameType: this.selectedGameType,
      players: this.currentGame.players,
      activePlayerIdx: this.currentGame.activePlayerIdx,
      currentRoundIdx: this.currentGame.currentRoundIdx,
      currentRound: this.currentGame.currentRound,
      rounds: this.currentGame.rounds,
      targets: this.currentGame.targets,
      turnDarts: this.currentGame.turnDarts,
      history: this.currentGame.history,
      targetScoreToBeat: this.currentGame.targetScoreToBeat,
      targetSetByPlayer: this.currentGame.targetSetByPlayer,
      outMode: this.currentGame.outMode,
      inMode: this.currentGame.inMode,
      legsToWin: this.currentGame.legsToWin,
      startScore: this.currentGame.startScore
    });
  }

  checkSavedActiveMatch() {
    const saved = store.loadActiveMatchState();
    if (!saved || !saved.players || saved.players.length === 0) {
      this.removeResumeBanner();
      return;
    }

    const container = document.getElementById('resume-banner-container');
    if (!container) return;

    container.innerHTML = `
      <div class="resume-match-banner">
        <div class="resume-match-text">
          <span class="resume-match-title">🔄 In-Progress Match Available</span>
          <span class="resume-match-sub">${saved.gameType.toUpperCase()} — ${saved.players.map(p => p.name).join(' vs ')}</span>
        </div>
        <div class="resume-match-actions">
          <button id="btn-banner-resume" class="btn-resume-now" type="button">Resume Game 🎯</button>
          <button id="btn-banner-discard" class="btn-discard-match" type="button">Discard</button>
        </div>
      </div>
    `;

    document.getElementById('btn-banner-resume')?.addEventListener('click', () => {
      sound.playClick();
      this.restoreActiveMatch(saved);
    });

    document.getElementById('btn-banner-discard')?.addEventListener('click', () => {
      sound.playClick();
      store.clearActiveMatch();
      this.removeResumeBanner();
    });
  }

  removeResumeBanner() {
    const container = document.getElementById('resume-banner-container');
    if (container) container.innerHTML = '';
  }

  restoreActiveMatch(saved) {
    this.selectedGameType = saved.gameType;

    switch (saved.gameType) {
      case 'x01':
        this.currentGame = new X01Game({ startScore: saved.startScore, outMode: saved.outMode, inMode: saved.inMode, legsToWin: saved.legsToWin, players: saved.players });
        break;
      case 'cricket':
        this.currentGame = new CricketGame({ players: saved.players });
        break;
      case 'split_score':
        this.currentGame = new SplitScoreGame({ startScore: saved.startScore, roundsList: saved.rounds, players: saved.players });
        break;
      case 'highscore':
        this.currentGame = new HighscoreGame({ players: saved.players });
        break;
      case 'shooter':
        this.currentGame = new ShooterGame({ players: saved.players });
        break;
      case 'shanghai':
        this.currentGame = new ShanghaiGame({ players: saved.players });
        break;
      case 'killer':
        this.currentGame = new KillerGame({ players: saved.players });
        break;
      case 'elimination':
        this.currentGame = new EliminationGame({ players: saved.players });
        break;
      case 'around_clock':
        this.currentGame = new AroundClockGame({ players: saved.players });
        break;
      default:
        return;
    }

    Object.assign(this.currentGame, saved);

    this.removeResumeBanner();
    this.setInputMode(this.inputMode);
    this.showView('view-game', true);
    this.updateScoreboard();
  }

  // --- Rules Modal ---
  showRulesModal(gameTypeKey = null) {
    const key = gameTypeKey || this.selectedGameType || 'x01';
    const ruleData = GAME_RULES[key] || GAME_RULES.x01;
    const modal = document.getElementById('modal-rules');
    if (!modal) return;

    document.getElementById('rules-modal-title').innerHTML = `${ruleData.icon} ${ruleData.title}`;
    document.getElementById('rules-modal-objective').textContent = ruleData.objective;
    
    const listEl = document.getElementById('rules-modal-list');
    listEl.innerHTML = ruleData.rules.map(r => `<li>${r}</li>`).join('');

    const proTipEl = document.getElementById('rules-modal-protip');
    if (proTipEl) {
      proTipEl.innerHTML = `<strong>💡 Pro Tip:</strong> ${ruleData.proTip}`;
    }

    modal.classList.add('active');
  }

  // --- Setup & Match Staging ---
  renderPlayerRosterSetup() {
    const rosterEl = document.getElementById('setup-player-list');
    if (!rosterEl) return;

    rosterEl.innerHTML = this.matchPlayers.map((p, idx) => {
      const isSaved = store.savedPlayers.some(sp => sp.name.toLowerCase() === p.name.toLowerCase());
      return `
        <div class="roster-item ${p.isBot ? 'is-bot-item' : ''}" data-idx="${idx}">
          <span class="player-num">#${idx + 1}</span>
          <input type="text" class="player-name-input" value="${p.name}" data-idx="${idx}" placeholder="Player Name" />
          <div class="roster-actions">
            ${!isSaved && !p.isBot && p.name.trim() ? `
              <button class="btn-save-to-roster" type="button" data-idx="${idx}" title="Save to permanent roster">💾 Save</button>
            ` : ''}
            <button class="btn-toggle-bot ${p.isBot ? 'active' : ''}" type="button" data-idx="${idx}" title="Toggle Bot/Human">
              ${p.isBot ? '🤖 BOT' : '👤 HUMAN'}
            </button>
            ${p.isBot ? `
              <select class="bot-profile-select" data-idx="${idx}">
                ${Object.values(BOT_PROFILES).map(prof => `
                  <option value="${prof.id}" ${p.botProfile === prof.id ? 'selected' : ''}>${prof.name} • ${prof.skillRating}</option>
                `).join('')}
              </select>
            ` : ''}
            ${this.matchPlayers.length > 1 ? `
              <button class="btn-remove-player" type="button" data-idx="${idx}" title="Remove Player">✕</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    rosterEl.querySelectorAll('.player-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.matchPlayers[idx].name = e.target.value;
        this.renderSavedRosterChips();
      });
    });

    rosterEl.querySelectorAll('.btn-save-to-roster').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const idx = parseInt(btn.dataset.idx, 10);
        const name = this.matchPlayers[idx].name.trim();
        if (name) {
          store.addSavedPlayer(name);
          this.renderPlayerRosterSetup();
          this.renderSavedRosterChips();
        }
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
        this.renderSavedRosterChips();
      });
    });
  }

  attachSetupEvents() {
    document.querySelectorAll('.game-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.game-mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedGameType = card.dataset.mode;

        const x01Opts = document.getElementById('setup-x01-options');
        const splitOpts = document.getElementById('setup-split-options');
        const cricketOpts = document.getElementById('setup-cricket-options');
        const partyOpts = document.getElementById('setup-party-options');
        const highscoreOpts = document.getElementById('setup-highscore-options');

        if (x01Opts) x01Opts.style.display = this.selectedGameType === 'x01' ? 'flex' : 'none';
        if (splitOpts) splitOpts.style.display = this.selectedGameType === 'split_score' ? 'flex' : 'none';
        if (cricketOpts) cricketOpts.style.display = this.selectedGameType === 'cricket' ? 'flex' : 'none';
        if (highscoreOpts) highscoreOpts.style.display = ['highscore', 'shooter'].includes(this.selectedGameType) ? 'flex' : 'none';
        if (partyOpts) partyOpts.style.display = ['killer', 'elimination', 'shanghai'].includes(this.selectedGameType) ? 'flex' : 'none';
      });
    });

    const splitOrderSel = document.getElementById('opt-split-order');
    if (splitOrderSel) {
      splitOrderSel.addEventListener('change', (e) => {
        const customGroup = document.getElementById('opt-split-custom-group');
        if (customGroup) customGroup.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      });
    }

    document.getElementById('btn-rules-setup')?.addEventListener('click', () => {
      sound.playClick();
      this.showRulesModal(this.selectedGameType);
    });

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
          this.renderSavedRosterChips();
        }
      });
    }

    const startBtn = document.getElementById('btn-start-match');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        sound.playClick();
        this.startMatch();
      });
    }
  }

  parseCustomSplitSequence(str) {
    const raw = (str || '').split(',').map(s => s.trim()).filter(Boolean);
    if (raw.length === 0) return null;

    return raw.map((item, idx) => {
      const upper = item.toUpperCase();
      if (upper === 'D' || upper === 'DOUBLE' || upper === 'DOUBLES') {
        return { id: `cust_${idx}`, label: 'ANY DOUBLE', targetType: 'double' };
      }
      if (upper === 'T' || upper === 'TREBLE' || upper === 'TREBLES') {
        return { id: `cust_${idx}`, label: 'ANY TREBLE', targetType: 'treble' };
      }
      if (upper === 'BULL' || upper === 'BULLSEYE' || upper === '25' || upper === '50') {
        return { id: `cust_${idx}`, label: 'BULLSEYE', targetType: 'bull', value: 25 };
      }
      const num = parseInt(item.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num >= 1 && num <= 20) {
        return { id: `cust_${idx}`, label: `${num}`, targetType: 'num', value: num };
      }
      return { id: `cust_${idx}`, label: '20', targetType: 'num', value: 20 };
    });
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
        const orderType = document.getElementById('opt-split-order')?.value || 'random';
        const startScore = parseInt(document.getElementById('opt-split-start-score')?.value || '40', 10);
        let customRounds = null;

        if (orderType === 'custom') {
          const rawCustom = document.getElementById('opt-split-custom-input')?.value;
          customRounds = this.parseCustomSplitSequence(rawCustom);
        }

        this.currentGame = new SplitScoreGame({
          startScore,
          orderType,
          roundsList: customRounds,
          players: playersCopy
        });
        break;
      }
      case 'highscore': {
        const rounds = parseInt(document.getElementById('opt-highscore-rounds')?.value || '7', 10);
        this.currentGame = new HighscoreGame({
          rounds,
          players: playersCopy
        });
        break;
      }
      case 'shooter': {
        const rounds = parseInt(document.getElementById('opt-highscore-rounds')?.value || '8', 10);
        this.currentGame = new ShooterGame({
          rounds,
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

    this.saveCurrentMatchState();
    this.setInputMode(this.inputMode);
    this.showView('view-game', true);
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

    const dkpContainer = document.getElementById('dart-keypad-container');
    const dbContainer = document.getElementById('dartboard-container');
    const toggleBtn = document.getElementById('btn-toggle-input-mode');

    if (dkpContainer) dkpContainer.style.display = 'none';
    if (dbContainer) dbContainer.style.display = 'none';

    if (mode === 'dartboard') {
      if (dbContainer) dbContainer.style.display = 'flex';
      if (toggleBtn) toggleBtn.textContent = '🎯 Keypad View';
    } else {
      if (dkpContainer) dkpContainer.style.display = 'block';
      if (toggleBtn) toggleBtn.textContent = '🎨 Dartboard View';
    }
  }

  cycleInputMode() {
    if (this.inputMode === 'dart_keypad') {
      this.setInputMode('dartboard');
    } else {
      this.setInputMode('dart_keypad');
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
    this.saveCurrentMatchState();
    this.processGameEvent(res);
  }

  // Universal Undo across all game modes
  handleUndo() {
    if (!this.currentGame) return;
    sound.playClick();
    this.vibrate(10);
    this.currentGame.undo();
    if (this.dartboard) this.dartboard.clearHits();
    this.saveCurrentMatchState();
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
      store.clearActiveMatch();
      this.renderSummary(res.winner);
      this.showView('view-summary', true);
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
      case 'highscore':
        this.scoreboard.renderHighscore(this.currentGame);
        break;
      case 'shooter':
        this.scoreboard.renderShooter(this.currentGame);
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

    // Update target & checkout route highlighting on SVG dartboard
    if (this.dartboard) {
      if (this.selectedGameType === 'x01') {
        const active = this.currentGame.getActivePlayer();
        const dartsLeft = 3 - this.currentGame.turnDarts.length;
        const checkout = this.currentGame.getCheckout(active.score, dartsLeft);
        if (checkout && checkout.route && checkout.route.length > 0) {
          this.dartboard.highlightCheckout(checkout.route, 0);
        } else {
          this.dartboard.clearHighlights();
        }
      } else if (this.selectedGameType === 'split_score' && this.currentGame.getCurrentRound) {
        const round = this.currentGame.getCurrentRound();
        this.dartboard.highlightTarget({ type: round.targetType, value: round.value });
      } else if (this.selectedGameType === 'shanghai') {
        this.dartboard.highlightTarget({ type: 'num', value: this.currentGame.currentRound });
      } else if (this.selectedGameType === 'shooter' && this.currentGame.getCurrentTarget) {
        const t = this.currentGame.getCurrentTarget();
        this.dartboard.highlightTarget({ type: t === 25 ? 'bull' : 'num', value: t });
      } else if (this.selectedGameType === 'around_clock') {
        const active = this.currentGame.getActivePlayer();
        if (active) {
          this.dartboard.highlightTarget({ type: active.currentTarget === 25 ? 'bull' : 'num', value: active.currentTarget });
        }
      } else if (this.selectedGameType === 'killer') {
        const active = this.currentGame.getActivePlayer();
        if (active) {
          if (!active.isKiller) {
            this.dartboard.highlightTarget({ type: 'num', value: active.targetNumber });
          } else {
            const opp = this.currentGame.players.find(p => !p.isEliminated && p.id !== active.id);
            if (opp) this.dartboard.highlightTarget({ type: 'num', value: opp.targetNumber });
          }
        }
      } else {
        this.dartboard.clearHighlights();
      }
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

      // Intelligent Game-Mode-Aware AI Throw
      const dart = this.bot.throwDart(this.selectedGameType, this.currentGame, player, dartIndex);
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
    document.getElementById('btn-game-undo')?.addEventListener('click', () => {
      this.handleUndo();
    });

    document.getElementById('btn-rules-game')?.addEventListener('click', () => {
      sound.playClick();
      this.showRulesModal(this.selectedGameType);
    });

    const toggleModeBtn = document.getElementById('btn-toggle-input-mode');
    if (toggleModeBtn) {
      toggleModeBtn.addEventListener('click', () => {
        sound.playClick();
        this.cycleInputMode();
      });
    }

    const excuseBtn = document.getElementById('btn-excuse-generator');
    if (excuseBtn) {
      excuseBtn.addEventListener('click', () => {
        sound.playClick();
        this.showExcuseModal();
      });
    }

    const soundBtn = document.getElementById('btn-quick-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const enabled = sound.toggle();
        store.saveSettings({ sound: enabled });
        soundBtn.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }

    const voiceBtn = document.getElementById('btn-quick-voice');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        const enabled = caller.toggle();
        store.saveSettings({ voice: enabled });
        voiceBtn.textContent = enabled ? '🗣️ Caller: ON' : '🤫 Caller: OFF';
      });
    }

    const endBtn = document.getElementById('btn-end-game');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        document.getElementById('modal-confirm-exit')?.classList.add('active');
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
        const targetView = btn.dataset.target;
        this.showView(targetView);
        if (targetView === 'view-stats') {
          this.renderStatsView();
        }
      });
    });

    const themeSel = document.getElementById('setting-theme');
    if (themeSel) {
      themeSel.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    const rematchBtn = document.getElementById('btn-rematch');
    if (rematchBtn) {
      rematchBtn.addEventListener('click', () => {
        sound.playClick();
        this.startMatch();
      });
    }

    const newMatchBtn = document.getElementById('btn-new-match');
    if (newMatchBtn) {
      newMatchBtn.addEventListener('click', () => {
        sound.playClick();
        this.showView('view-setup', true);
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
