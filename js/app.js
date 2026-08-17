import { loadAndRenderChangelog } from './components/changelog_loader.js';
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
import { Bobs27Game } from './games/bobs27.js';
import { DartsHeatmap } from './components/heatmap.js';
import { MatchCardGenerator } from './components/match_card.js';

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
    sound.setVolume(store.settings.volume !== undefined ? store.settings.volume : 0.8);
    caller.setVolume(store.settings.volume !== undefined ? store.settings.volume : 0.8);
    this.heatmap = new DartsHeatmap(document.getElementById('summary-heatmap-container'));
    this.historyHeatmap = new DartsHeatmap(document.getElementById('history-heatmap-container'));
    caller.toggle(store.settings.voice);
    caller.toggleSarcasm(store.settings.sarcasm);

    this.scoreboard = new Scoreboard(document.getElementById('scoreboard-container'));
    this.initDartboard();
    this.initDartKeypad();
    this.attachNavEvents();
    loadAndRenderChangelog(document.getElementById('changelog-page-list'));
    // Delegated click for Scoreboard Next Player banner
    document.getElementById('scoreboard-container')?.addEventListener('click', (e) => {
      if (e.target.closest('#btn-scoreboard-next-player')) {
        this.advanceTurn();
      }
    });

    // History filter buttons
    document.querySelectorAll('.hist-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.hist-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderStatsView(btn.dataset.filter);
      });
    });

    // Export match history with save dialog prompt
    document.getElementById('btn-export-history')?.addEventListener('click', () => {
      this.exportHistoryWithSaveDialog();
    });

    // Import match history from JSON file
    const importBtn = document.getElementById('btn-import-history');
    const importInput = document.getElementById('input-import-history');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        sound.playClick();
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const res = store.importHistory(event.target.result);
            if (res.success) {
              this.showBanterToast(`📥 Imported ${res.count} match(es)! Total: ${res.total}`);
              this.renderStatsView('all');
            } else {
              this.showBanterToast(`❌ Import error: ${res.error || 'Invalid file format'}`);
            }
          } catch (err) {
            this.showBanterToast(`❌ Import error: ${err.message}`);
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Clear match history
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      sound.playClick();
      if (confirm("Are you sure you want to clear all match history? This cannot be undone.")) {
        store.clearHistory();
        this.renderStatsView('all');
        this.showBanterToast("🗑️ Match History Cleared.");
      }
    });
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

  showBanterToast(msg) {
    let toast = document.getElementById('bullsheet-banter-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bullsheet-banter-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = 'rgba(18, 21, 27, 0.95)';
      toast.style.border = '1px solid var(--accent-gold)';
      toast.style.color = '#fff';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '24px';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '9999';
      toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';
    clearTimeout(this._banterTimeout);
    this._banterTimeout = setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.pointerEvents = 'none';
      }
    }, 2800);
  }

  async exportHistoryWithSaveDialog() {
    sound.playClick();
    const historyData = JSON.stringify(store.history || [], null, 2);
    const fileName = `bullsheet_history_${new Date().toISOString().slice(0, 10)}.json`;

    // 1. File System Access API: Prompt user for save directory & filename
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON Match History',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(historyData);
        await writable.close();
        this.showBanterToast("📥 Match History Saved Successfully!");
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled prompt
        console.warn('showSaveFilePicker failed, falling back to download link:', err);
      }
    }

    // 2. Fallback download anchor
    const blob = new Blob([historyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showBanterToast("📥 Match History Downloaded!");
  }

  setAudioMode(mode) {
    if (mode === 'muted') {
      sound.toggle(false);
      caller.toggle(false);
      store.saveSettings({ sound: false, voice: false });
    } else if (mode === 'sound_only') {
      sound.toggle(true);
      caller.toggle(false);
      store.saveSettings({ sound: true, voice: false });
    } else {
      // ref_voice or a specific voice pack ID
      const voiceId = (mode === 'ref_voice') ? (caller.style || 'russ_bray') : mode;
      sound.toggle(true);
      caller.toggle(true);
      caller.setStyle(voiceId);
      store.saveSettings({ sound: true, voice: true });
    }

    const gameSel = document.getElementById('game-voice-select');
    if (gameSel) gameSel.value = (mode === 'ref_voice') ? (caller.style || 'russ_bray') : mode;

    this.updateSettingsAudioVisibility();
  }

  getAudioMode() {
    if (!store.settings.sound && !store.settings.voice) return 'muted';
    if (store.settings.sound && !store.settings.voice) return 'sound_only';
    return 'ref_voice';
  }

  updateSettingsAudioVisibility() {
    const mode = this.getAudioMode();
    const audioModeSel = document.getElementById('setting-audio-mode');
    const volumeGroup = document.getElementById('settings-volume-group');
    const refVoiceGroup = document.getElementById('settings-ref-voice-group');

    if (audioModeSel) audioModeSel.value = mode;

    if (volumeGroup) volumeGroup.style.display = (mode === 'muted') ? 'none' : '';
    if (refVoiceGroup) refVoiceGroup.style.display = (mode === 'ref_voice') ? '' : 'none';

    const voiceStyleSel = document.getElementById('setting-voice-style');
    if (voiceStyleSel && mode === 'ref_voice') {
      voiceStyleSel.value = caller.style || 'russ_bray';
    }
  }

  vibrate(ms = 15) {
    if (store.settings.vibration && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch {}
    }
  }

  initDartboard() {
    const container = document.getElementById('dartboard-container');
    this.dartboard = new Dartboard(
      container,
      (hit) => this.handleDartHit(hit),
      () => this.handleUndo(),
      () => this.advanceTurn()
    );
  }

  initDartKeypad() {
    const container = document.getElementById('dart-keypad-container');
    this.dartKeypad = new DartKeypad(
      container,
      (dart) => this.handleDartHit(dart),
      () => this.handleUndo(),
      () => this.advanceTurn()
    );
  }

  // Brand Logo Click
  handleBrandClick() {
    sound.playClick();
    this.closeBurgerDrawer();
    if (this.isMatchInProgress()) {
      this.pendingNavTarget = 'view-setup';
      document.getElementById('modal-confirm-exit')?.classList.add('active');
    } else {
      this.showView('view-setup');
    }
  }

  navigateTo(viewId, force = false) {
    return this.showView(viewId, force);
  }

  // Route Switcher with Tab Sync and Progress Loss Guard
  showView(viewId, force = false) {
    // Always dismiss the mobile sandwich drawer on navigation attempt
    this.closeBurgerDrawer();

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

    // Sync top and drawer nav tabs
    document.querySelectorAll('.nav-tab-btn, .drawer-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === viewId);
    });

    if (viewId === 'view-changelog') {
      loadAndRenderChangelog(document.getElementById('changelog-page-list'));
    }

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
      case 'bobs27':
        this.currentGame = new Bobs27Game(saved);
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
          <div class="roster-top-row">
            <span class="player-num">#${idx + 1}</span>
            <input type="text" class="player-name-input" value="${p.name}" data-idx="${idx}" placeholder="Player Name" />
            ${this.matchPlayers.length > 1 ? `
              <button class="btn-remove-player" type="button" data-idx="${idx}" title="Remove Player">✕</button>
            ` : ''}
          </div>
          <div class="roster-actions-row">
            <div class="roster-actions-left">
              <button class="btn-toggle-bot ${p.isBot ? 'active' : ''}" type="button" data-idx="${idx}" title="Toggle Bot/Human">
                ${p.isBot ? '🤖 BOT' : '👤 HUMAN'}
              </button>
              ${p.isBot ? `
                <select class="bot-profile-select" data-idx="${idx}">
                  ${Object.values(BOT_PROFILES).map(prof => `
                    <option value="${prof.id}" ${p.botProfile === prof.id ? 'selected' : ''}>${prof.name}</option>
                  `).join('')}
                </select>
              ` : ''}
            </div>
            <div class="roster-actions-right">
              ${!isSaved && !p.isBot && p.name.trim() ? `
                <button class="btn-save-to-roster" type="button" data-idx="${idx}" title="Save to permanent roster">💾 Save</button>
              ` : ''}
            </div>
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
      btn.addEventListener('click', () => {
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
      btn.addEventListener('click', () => {
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

        if (x01Opts) x01Opts.style.display = this.selectedGameType === 'x01' ? '' : 'none';
        if (splitOpts) splitOpts.style.display = this.selectedGameType === 'split_score' ? '' : 'none';
        if (cricketOpts) cricketOpts.style.display = this.selectedGameType === 'cricket' ? '' : 'none';
        if (highscoreOpts) highscoreOpts.style.display = ['highscore', 'shooter'].includes(this.selectedGameType) ? '' : 'none';
        if (partyOpts) partyOpts.style.display = ['killer', 'elimination', 'shanghai'].includes(this.selectedGameType) ? '' : 'none';
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
        if (playersCopy.length === 1) {
          playersCopy.push({ id: 'bot_rival', name: 'Bot Rival', isBot: true, botProfile: 'pub_regular' });
        }
        const lives = parseInt(document.getElementById('opt-party-killer-lives')?.value || '5', 10);
        this.currentGame = new KillerGame({
          startingLives: lives,
          players: playersCopy
        });
        break;
      }
      case 'elimination': {
        if (playersCopy.length === 1) {
          playersCopy.push({ id: 'bot_rival', name: 'Bot Rival', isBot: true, botProfile: 'pub_regular' });
        }
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
      case 'bobs27': {
        this.currentGame = new Bobs27Game({
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
      if (toggleBtn) {
        toggleBtn.innerHTML = '🔢<span class="ctrl-text"> Keypad</span>';
        toggleBtn.title = 'Switch to Keypad Input';
      }
    } else {
      if (dkpContainer) dkpContainer.style.display = 'block';
      if (toggleBtn) {
        toggleBtn.innerHTML = '🎯<span class="ctrl-text"> Board</span>';
        toggleBtn.title = 'Switch to Interactive Dartboard';
      }
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
      
      const matchRecord = {
        id: Date.now().toString(36),
        date: new Date().toISOString(),
        gameType: this.selectedGameType,
        winner: res.winner,
        players: this.currentGame.players.map(p => ({
          name: p.name,
          isBot: p.isBot,
          won: p.id === res.winner.id,
          score: p.score,
          stats: {
            totalDarts: p.totalDartsThrown || p.totalDarts || 0,
            totalScore: p.totalScoreScored || p.score || 0,
            highTurn: p.highTurn || (p.turns && p.turns.length ? Math.max(0, ...p.turns) : 0),
            count180: p.count180 || 0
          }
        }))
      };

      store.saveMatch(matchRecord);
      this.lastMatchData = matchRecord;
      store.clearActiveMatch();

      if (this.heatmap) {
        this.heatmap.render(this.currentGame);
      }

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
      this.showBanterToast("💥 Bust! Pub math strikes again!");
      return;
    }

    if (res.type === 'dart_recorded') {
      // Dart 1 or Dart 2: Announce single dart throw
      const dartScore = res.dart?.score !== undefined ? res.dart.score : ((res.dart?.number || 0) * (res.dart?.mult || 1));
      caller.callSingleDart(dartScore, res.dart);
      return;
    }

    if (res.type === 'visit_complete' || res.type === 'turn_end') {
      if (this.dartboard) this.dartboard.clearHits();
      
      const lastDart = res.dart || res.lastDart || (this.currentGame?.turnDarts && this.currentGame.turnDarts[this.currentGame.turnDarts.length - 1]);
      const lastDartScore = lastDart?.score !== undefined ? lastDart.score : ((lastDart?.number || 0) * (lastDart?.mult || 1));

      // Quality sarcastic pub banter toasts on iconic scores
      const turnTotal = res.turnScore !== undefined ? res.turnScore : (res.player?.turnScore || 0);
      if (turnTotal === 26) {
        this.showBanterToast("🍳 The Classic Pub Breakfast: 26 and a deep sigh.");
      } else if (turnTotal === 3) {
        this.showBanterToast("🎯 Three ones. Deadly precision on the wrong target.");
      } else if (turnTotal === 7) {
        this.showBanterToast("🍺 Seven points. At least all three hit the board.");
      } else if (turnTotal === 180) {
        this.showBanterToast("🔥 MAXIMUM 180! Ally Pally roof blown off!");
      }

      if (store.settings.announceTurnTotal) {
        caller.callSingleDart(lastDartScore, lastDart, () => {
          setTimeout(() => {
            if (this.currentGame && !this.currentGame.isMatchOver) {
              const turnScoreToCall = res.turnScore !== undefined ? res.turnScore : (res.player?.turnScore || 0);
              caller.callScore(turnScoreToCall, res.player?.name);
            }
          }, 350);
        });
      } else {
        caller.callSingleDart(lastDartScore, lastDart);
      }
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
      case 'bobs27':
        this.scoreboard.renderBobs27(this.currentGame);
        break;
    }

    // Update target & checkout route highlighting on SVG dartboard
    if (this.dartKeypad) this.dartKeypad.updateState(this.currentGame);
    if (this.dartboard) this.dartboard.updateState(this.currentGame);

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
      } else if (this.selectedGameType === 'bobs27' && this.currentGame.getCurrentTarget) {
        const t = this.currentGame.getCurrentTarget();
        this.dartboard.highlightTarget({ type: t.number === 25 ? 'bull' : 'double', value: t.number });
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

    const gameVoiceSelect = document.getElementById('game-voice-select');
    if (gameVoiceSelect) {
      gameVoiceSelect.value = this.getAudioMode();
      gameVoiceSelect.addEventListener('change', (e) => {
        this.setAudioMode(e.target.value);
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

  openBurgerDrawer() {
    sound.playClick();
    document.getElementById('drawer-burger-menu')?.classList.add('open');
    document.getElementById('drawer-burger-backdrop')?.classList.add('open');
  }

  closeBurgerDrawer() {
    document.getElementById('drawer-burger-menu')?.classList.remove('open');
    document.getElementById('drawer-burger-backdrop')?.classList.remove('open');
  }

  attachNavEvents() {
    document.querySelectorAll('.nav-tab-btn, .drawer-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const targetView = btn.dataset.target;
        this.showView(targetView);
        if (targetView === 'view-stats') {
          this.renderStatsView();
        }
      });
    });

    // Sandwich / Burger Menu Handlers
    document.getElementById('btn-burger-menu')?.addEventListener('click', () => {
      this.openBurgerDrawer();
    });

    document.getElementById('btn-close-burger')?.addEventListener('click', () => {
      sound.playClick();
      this.closeBurgerDrawer();
    });

    document.getElementById('drawer-burger-backdrop')?.addEventListener('click', () => {
      this.closeBurgerDrawer();
    });

    document.getElementById('btn-header-version')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      sound.playClick();
      this.showView('view-changelog');
    });

    document.getElementById('btn-open-changelog-settings')?.addEventListener('click', () => {
      sound.playClick();
      this.showView('view-changelog');
    });

    document.getElementById('btn-changelog-back')?.addEventListener('click', () => {
      sound.playClick();
      this.showView('view-setup');
    });

    const themeSel = document.getElementById('setting-theme');
    if (themeSel) {
      themeSel.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    // Audio Mode selector in Settings (Mute / SFX Only / Ref Voice)
    const audioModeSel = document.getElementById('setting-audio-mode');
    if (audioModeSel) {
      audioModeSel.value = this.getAudioMode();
      audioModeSel.addEventListener('change', (e) => {
        this.setAudioMode(e.target.value);
      });
    }

    // Referee Voice picker in Settings
    const voiceStyleSel = document.getElementById('setting-voice-style');
    if (voiceStyleSel) {
      voiceStyleSel.value = caller.style || 'russ_bray';
      voiceStyleSel.addEventListener('change', (e) => {
        caller.setStyle(e.target.value);
        const gameSel = document.getElementById('game-voice-select');
        if (gameSel) gameSel.value = e.target.value;
      });
    }

    // Set initial visibility of audio sub-controls
    this.updateSettingsAudioVisibility();

    const announceTotalCheck = document.getElementById('setting-announce-total');
    if (announceTotalCheck) {
      announceTotalCheck.checked = !!store.settings.announceTurnTotal;
      announceTotalCheck.addEventListener('change', (e) => {
        store.saveSettings({ announceTurnTotal: e.target.checked });
      });
    }

    document.getElementById('btn-test-voice')?.addEventListener('click', () => {
      caller.callScore(180);
    });

    // Master Volume Slider
    const volSlider = document.getElementById('setting-volume');
    const volLabel = document.getElementById('setting-volume-label');
    if (volSlider) {
      const initialVol = Math.round((store.settings.volume !== undefined ? store.settings.volume : 0.8) * 100);
      volSlider.value = initialVol;
      if (volLabel) volLabel.textContent = `${initialVol}%`;

      volSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (volLabel) volLabel.textContent = `${val}%`;
        sound.setVolume(val / 100);
        caller.setVolume(val / 100);
        store.saveSettings({ volume: val / 100 });
      });
    }

    // Shareable Match Card Actions
    document.getElementById('btn-copy-match-card')?.addEventListener('click', () => {
      if (!this.lastMatchData) return;
      const text = MatchCardGenerator.formatTextSummary(this.lastMatchData);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.showBanterToast("📋 Match Summary Copied to Clipboard!");
        });
      } else {
        this.showBanterToast("📋 Match Summary Ready to Share!");
      }
    });

    document.getElementById('btn-download-image-card')?.addEventListener('click', () => {
      if (!this.lastMatchData) return;
      const dataUrl = MatchCardGenerator.generateCanvasImage(this.lastMatchData);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `BullSheet_Match_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showBanterToast("📸 Match Card PNG Downloaded!");
    });

    document.getElementById('btn-test-26')?.addEventListener('click', () => {
      caller.callScore(26);
    });

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
    if (winNameEl) {
      if (this.selectedGameType === 'bobs27' && this.currentGame && this.currentGame.players.length === 1 && this.currentGame.players[0].isEliminated) {
        winNameEl.textContent = `💥 BUSTED OUT! (Round ${this.currentGame.currentRound} / 21)`;
      } else {
        winNameEl.textContent = `🏆 ${winner ? winner.name : 'Player'} WINS!`;
      }
    }

    if (tableBody && this.currentGame) {
      tableBody.innerHTML = this.currentGame.players.map(p => `
        <tr>
          <td><strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}</td>
          <td>${p.score}</td>
          <td>${p.legsWon !== undefined ? p.legsWon : (p.totalDoublesHit || 0)}</td>
          <td>${this.currentGame.getPlayerAvg ? this.currentGame.getPlayerAvg(p) : (p.totalDartsThrown ? ((p.score / p.totalDartsThrown) * 3).toFixed(1) : '—')}</td>
          <td>${p.highTurn || (p.turns && p.turns.length ? Math.max(0, ...p.turns) : 0)}</td>
          <td>${p.count180 || 0}</td>
        </tr>
      `).join('');
    }
  }

  // Advance turn to next player manually or upon next throw
  advanceTurn() {
    if (!this.currentGame || this.currentGame.isMatchOver) return;
    sound.playClick();

    const finishRes = this.currentGame.finishTurn();
    if (finishRes && finishRes.type === 'match_win') {
      this.processGameEvent(finishRes);
      return;
    }

    if (this.dartboard) this.dartboard.clearHits();
    this.saveCurrentMatchState();
    this.updateScoreboard();

    const nextPlayer = this.currentGame.getActivePlayer();
    caller.callTurn(nextPlayer.name);

    if (nextPlayer.isBot) {
      this.triggerBotTurn();
    }
  }

  renderStatsView(filterMode = null) {
    if (filterMode) this.historyFilterMode = filterMode;
    const mode = this.historyFilterMode || 'all';
    const playerName = this.historyPlayerFilter || 'all';

    const listEl = document.getElementById('stats-match-history');
    const lifetimeGrid = document.getElementById('lifetime-stats-grid');
    const playerSelect = document.getElementById('history-player-filter');
    if (!listEl) return;

    const history = store.history || [];

    // 1. Populate Player Filter Select Dropdown (Saved Players Only)
    if (playerSelect) {
      const savedPlayers = store.getTrackedPlayers();
      const currentVal = this.historyPlayerFilter || 'all';
      
      if (savedPlayers.length === 0) {
        playerSelect.innerHTML = `<option value="all" selected>👤 All Matches (No Saved Players Yet)</option>`;
      } else {
        playerSelect.innerHTML = `
          <option value="all" ${currentVal === 'all' ? 'selected' : ''}>👤 All Saved Players</option>
          ${savedPlayers.map(p => `
            <option value="${p}" ${currentVal === p ? 'selected' : ''}>🎯 ${p}</option>
          `).join('')}
        `;
      }
    }

    // 2. Compute Aggregated Metrics for selected Player & Game Mode
    const stats = store.getAggregatedStats(playerName, mode);

    if (lifetimeGrid) {
      lifetimeGrid.innerHTML = `
        <div class="lifetime-stat-card">
          <span class="stat-card-icon">🏆</span>
          <div class="stat-card-info">
            <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">(${stats.winRate}% W)</small></span>
            <span class="stat-card-lbl">Matches / Win Rate</span>
          </div>
        </div>
        <div class="lifetime-stat-card">
          <span class="stat-card-icon">📊</span>
          <div class="stat-card-info">
            <span class="stat-card-val">${stats.avg}</span>
            <span class="stat-card-lbl">3-Dart Average</span>
          </div>
        </div>
        <div class="lifetime-stat-card">
          <span class="stat-card-icon">👑</span>
          <div class="stat-card-info">
            <span class="stat-card-val">${stats.count180}</span>
            <span class="stat-card-lbl">180s Hit (${stats.count140}x 140+)</span>
          </div>
        </div>
        <div class="lifetime-stat-card">
          <span class="stat-card-icon">🔥</span>
          <div class="stat-card-info">
            <span class="stat-card-val">${stats.highestTurn}</span>
            <span class="stat-card-lbl">Highest Turn Score</span>
          </div>
        </div>
      `;
    }

    // 3. Filter Match Records
    let filtered = history;

    // Mode filter
    if (mode === 'x01') filtered = filtered.filter(m => m.gameType === 'x01');
    else if (mode === 'cricket') filtered = filtered.filter(m => m.gameType === 'cricket');
    else if (mode === 'split_score') filtered = filtered.filter(m => m.gameType === 'split_score');
    else if (mode === 'bobs27') filtered = filtered.filter(m => m.gameType === 'bobs27');
    else if (mode === 'party') filtered = filtered.filter(m => ['killer', 'elimination', 'shanghai', 'shooter', 'highscore', 'around_clock'].includes(m.gameType));

    // Player filter
    if (playerName !== 'all') {
      filtered = filtered.filter(m => m.players && m.players.some(p => p.name.toLowerCase() === playerName.toLowerCase()));
    }

    // 4. Render Board Hit Heatmap
    const histHeatContainer = document.getElementById('history-heatmap-container');
    if (this.historyHeatmap && histHeatContainer) {
      if (filtered.length > 0) {
        histHeatContainer.style.display = 'block';
        const heatTitle = playerName === 'all' ? `🎯 Board Distribution (${mode.toUpperCase()})` : `🎯 ${playerName}'s Hit Heatmap (${mode.toUpperCase()})`;
        this.historyHeatmap.render(filtered, heatTitle, playerName !== 'all' ? playerName : null);
      } else {
        histHeatContainer.style.display = 'none';
      }
    }

    // 5. Render Filtered Match Cards List
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-history-box" style="text-align:center; padding:30px; background:var(--bg-secondary); border-radius:var(--border-radius-md); border:1px dashed var(--border-color); margin-top:16px;">
          <div style="font-size:2.5rem; margin-bottom:8px;">🎯📜</div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">No matches found for this filter.</div>
          <div style="color:var(--text-secondary); font-size:0.9rem;">Try selecting a different player or game mode above.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(m => {
      const modeKey = m.gameType || 'x01';
      const badgeCls = ['x01', 'cricket', 'split_score', 'bobs27'].includes(modeKey) ? `mode-${modeKey}` : 'mode-party';
      const winner = m.winner || m.players?.find(p => p.won) || m.players?.[0] || { name: 'Player' };
      const dateStr = new Date(m.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="rich-history-card" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:16px; margin-bottom:14px;">
          <div class="rich-history-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span class="hist-game-badge ${badgeCls}" style="font-weight:700; color:var(--accent-gold);">🎯 ${modeKey.toUpperCase()}</span>
            <span class="hist-time-stamp" style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</span>
          </div>
          
          <div class="hist-winner-banner" style="display:flex; align-items:center; gap:6px; font-size:1.05rem; font-weight:700; color:var(--text-primary); margin-bottom:12px;">
            <span>🏆</span>
            <span><strong>${winner.name}</strong> Won</span>
          </div>

          <table class="hist-stats-table" style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color); color:var(--text-secondary); text-align:left;">
                <th style="padding:6px 0;">Player</th>
                <th style="padding:6px 0;">Result</th>
                <th style="padding:6px 0;">Avg / MPR</th>
                <th style="padding:6px 0;">High Turn</th>
                <th style="padding:6px 0;">180s</th>
              </tr>
            </thead>
            <tbody>
              ${(m.players || []).map(rawP => {
                const p = MatchCardGenerator.extractPlayerStats(rawP);
                const isWinner = rawP.won || rawP.name === winner.name;
                const isSelected = playerName !== 'all' && rawP.name.toLowerCase() === playerName.toLowerCase();

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05); ${isSelected ? 'background:rgba(234,179,8,0.1);' : ''}">
                    <td style="padding:8px 0;"><strong>${p.name}</strong> ${rawP.isBot ? '<small style="color:var(--text-muted);">(BOT)</small>' : ''}</td>
                    <td style="padding:8px 0; color:${isWinner ? 'var(--accent-gold)' : 'var(--text-secondary)'}; font-weight:${isWinner ? '700' : '400'};">${isWinner ? '👑 Winner' : 'Runner-up'}</td>
                    <td style="padding:8px 0;">${p.avg}</td>
                    <td style="padding:8px 0;">${p.high}</td>
                    <td style="padding:8px 0;">${p.maxes}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="hist-card-actions" style="display:flex; gap:8px; margin-top:12px; justify-content:flex-end;">
            <button class="ctrl-btn btn-copy-hist-match" data-idx="${history.indexOf(m)}" type="button" style="padding:6px 12px; font-size:0.85rem;">📋 Copy Card</button>
            <button class="ctrl-btn btn-download-hist-match" data-idx="${history.indexOf(m)}" type="button" style="padding:6px 12px; font-size:0.85rem;">📸 Save Image</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind action listeners for history cards
    listEl.querySelectorAll('.btn-copy-hist-match').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const match = history[idx];
        if (!match) return;
        const text = MatchCardGenerator.formatTextSummary(match);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            this.showBanterToast("📋 Match Card Copied to Clipboard!");
          });
        } else {
          this.showBanterToast("📋 Match Card Ready!");
        }
      });
    });

    listEl.querySelectorAll('.btn-download-hist-match').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const match = history[idx];
        if (!match) return;
        const dataUrl = MatchCardGenerator.generateCanvasImage(match);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `BullSheet_Match_${match.id || Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showBanterToast("📸 Match Card PNG Downloaded!");
      });
    });
  }
}

// Instantiate immediately or on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new BullSheetApp();
  });
} else {
  window.app = new BullSheetApp();
}
