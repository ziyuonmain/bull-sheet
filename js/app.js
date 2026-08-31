// Main BullSheet Application Controller
import { sound } from './audio/sound_effects.js';
import { caller } from './audio/caller.js';
import { store } from './storage/stats_store.js';
import { Dartboard } from './components/dartboard.js';
import { DartKeypad } from './components/dart_keypad.js';
import { DartNumpad } from './components/dart_numpad.js';
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
import { MatchCardGenerator } from './components/match_card.js';

class BullSheetApp {
  constructor() {
    this.currentGame = null;
    this.bot = new BotEngine();
    this.inputMode = store.settings.inputMode || 'dartboard';
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
      "Classic pub chalk dust got into my throwing eye.",
      "The wire on that treble was visibly thicker than regulation.",
      "I was factoring in the Coriolis effect, but forgot our latitude.",
      "My grip slipped due to aggressive condensation on my glass.",
      "The jukebox changed tempo right in the middle of my backswing.",
      "I'm strategically warming up my Shanghai route for next leg.",
      "My tungsten alloy is reacting poorly to the room's humidity.",
      "That was a tactical lay-up. You wouldn't understand."
    ];

    this.init();
  }

  init() {
    this.applyTheme(store.settings.theme || 'bullsheet');
    sound.toggle(store.settings.sound);
    sound.setVolume(store.settings.volume !== undefined ? store.settings.volume : 0.8);
    caller.setVolume(store.settings.volume !== undefined ? store.settings.volume : 0.8);
    caller.toggle(store.settings.voice);
    caller.toggleSarcasm(store.settings.sarcasm);

    this.scoreboard = new Scoreboard(document.getElementById('scoreboard-container'));
    this.initDartboard();
    this.initDartKeypad();
    this.initDartNumpad();
    this.attachNavEvents();
    // Delegated click for Scoreboard Next Player banner & Leg Win Next Leg button
    document.getElementById('scoreboard-container')?.addEventListener('click', (e) => {
      if (e.target.closest('#btn-scoreboard-next-player')) {
        this.advanceTurn();
      }
      if (e.target.closest('#btn-start-next-leg')) {
        this.startNextLeg();
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

    // History player drilldown dropdown
    document.getElementById('history-player-filter')?.addEventListener('change', (e) => {
      this.historyPlayerFilter = e.target.value;
      this.renderStatsView();
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
    this.syncGameVoiceSelect();

    window.addEventListener('resize', () => {
      this.syncGameVoiceSelectLabels();
      this.updateGameModeDisplay();
    });
    window.addEventListener('orientationchange', () => {
      this.syncGameVoiceSelectLabels();
      this.updateGameModeDisplay();
    });

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
    const isGame = document.body.classList.contains('in-game-view');
    document.body.className = `theme-${themeName}${isGame ? ' in-game-view' : ''}`;
    store.saveSettings({ theme: themeName });
    const select = document.getElementById('setting-theme');
    if (select) select.value = themeName;
    const modalSelect = document.getElementById('modal-setting-theme');
    if (modalSelect) modalSelect.value = themeName;
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

  getInGameAudioValue() {
    if (!store.settings.sound && !store.settings.voice) return 'muted';
    if (store.settings.sound && !store.settings.voice) return 'sound_only';
    return caller.style || 'russ_bray';
  }

  syncGameVoiceSelectLabels() {
    const select = document.getElementById('game-voice-select');
    if (!select) return;
    const isPortrait = window.matchMedia('(max-width: 768px), (orientation: portrait)').matches;
    const labels = isPortrait ? {
      muted: '🔇 Mute',
      sound_only: '🔊 SFX Only',
      russ_bray: '🎙️ R. Bray',
      george_noble: '🎙️ G. Noble',
      british_ref: '🎩 Brit Ref'
    } : {
      muted: '🔇 Mute',
      sound_only: '🔊 SFX Only',
      russ_bray: '🎙️ Russ Bray',
      george_noble: '🎙️ George Noble',
      british_ref: '🎩 British Referee'
    };

    for (const opt of select.options) {
      if (labels[opt.value]) {
        opt.textContent = labels[opt.value];
      }
    }
  }

  syncGameVoiceSelect() {
    const gameSel = document.getElementById('game-voice-select');
    if (gameSel) {
      gameSel.value = this.getInGameAudioValue();
    }
    this.syncGameVoiceSelectLabels();
  }

  getGameModeDisplayName(isPortrait = false) {
    switch (this.selectedGameType) {
      case 'x01': {
        const startScore = this.currentGame?.startScore || 501;
        const out = this.currentGame?.outMode === 'double' ? 'DO' : (this.currentGame?.outMode === 'master' ? 'MO' : 'SO');
        return isPortrait ? `🎯 X01 • ${startScore}` : `🎯 X01 (${startScore} ${out})`;
      }
      case 'cricket':
        return isPortrait ? '🏏 Cricket' : '🏏 Cricket';
      case 'split_score':
        return isPortrait ? '⚡ Split Score' : '⚡ Split Score (Halve-It)';
      case 'killer':
        return isPortrait ? '⚔️ Killer' : '⚔️ Killer Party';
      case 'elimination':
        return isPortrait ? '💥 Elimination' : '💥 Elimination';
      case 'shanghai':
        return isPortrait ? '🏮 Shanghai' : `🏮 Shanghai (${this.currentGame?.maxRounds || 7}R)`;
      case 'around_clock':
        return isPortrait ? '⏰ Clock' : '⏰ Around the Clock';
      case 'bobs27':
        return isPortrait ? "🛡️ Bob's 27" : "🛡️ Bob's 27";
      case 'highscore':
        return isPortrait ? '🏆 Highscore' : `🏆 Highscore (${this.currentGame?.maxRounds || 7}R)`;
      case 'shooter':
        return isPortrait ? '🏹 Shooter' : '🏹 Shooter';
      default:
        return 'Match';
    }
  }

  updateGameModeDisplay() {
    const el = document.getElementById('game-mode-display');
    if (!el) return;
    const isPortrait = window.matchMedia('(max-width: 640px), (orientation: portrait)').matches;
    el.textContent = this.getGameModeDisplayName(isPortrait);
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

    this.syncGameVoiceSelect();
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

    // In-game Settings Modal audio controls sync
    const modalAudioModeSel = document.getElementById('modal-setting-audio-mode');
    const modalVolumeGroup = document.getElementById('modal-volume-group');
    const modalRefVoiceGroup = document.getElementById('modal-ref-voice-group');

    if (modalAudioModeSel) modalAudioModeSel.value = mode;
    if (modalVolumeGroup) modalVolumeGroup.style.display = (mode === 'muted') ? 'none' : '';
    if (modalRefVoiceGroup) modalRefVoiceGroup.style.display = (mode === 'ref_voice') ? '' : 'none';

    const voiceStyleSel = document.getElementById('setting-voice-style');
    if (voiceStyleSel && mode === 'ref_voice') {
      voiceStyleSel.value = caller.style || 'russ_bray';
    }

    const modalVoiceStyleSel = document.getElementById('modal-setting-voice-style');
    if (modalVoiceStyleSel && mode === 'ref_voice') {
      modalVoiceStyleSel.value = caller.style || 'russ_bray';
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

  initDartNumpad() {
    const container = document.getElementById('dart-numpad-container');
    if (!container) return;
    this.dartNumpad = new DartNumpad(
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
      if (viewId === 'view-settings') {
        this.openSettingsModal();
        return;
      }
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

    document.body.classList.toggle('in-game-view', viewId === 'view-game');

    if (viewId === 'view-game') {
      this.updateGameModeDisplay();
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
        <span style="font-weight:700; color:var(--text-primary);">${p.avatar || '👤'} ${p.name}</span>
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
          <button id="btn-banner-resume" class="btn-resume-now" type="button">Resume Game ➔</button>
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
        <div class="roster-item ${p.isBot ? 'is-bot-item' : ''}" data-idx="${idx}" draggable="true">
          <div class="roster-top-row">
            ${this.matchPlayers.length > 1 ? `
              <div class="roster-drag-handle" title="Drag to reorder throw order" aria-label="Drag handle">
                <span>⠿</span>
              </div>
            ` : ''}
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

    // HTML5 & Touch Drag and Drop Reordering
    let draggedIdx = null;

    rosterEl.querySelectorAll('.roster-item').forEach(item => {
      const handle = item.querySelector('.roster-drag-handle');

      // HTML5 Drag
      item.addEventListener('dragstart', (e) => {
        draggedIdx = parseInt(item.dataset.idx, 10);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedIdx));
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        rosterEl.querySelectorAll('.roster-item').forEach(el => {
          el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        const targetCard = e.target.closest('.roster-item');
        if (!targetCard) return;
        const rect = targetCard.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          targetCard.classList.add('drag-over-top');
          targetCard.classList.remove('drag-over-bottom');
        } else {
          targetCard.classList.add('drag-over-bottom');
          targetCard.classList.remove('drag-over-top');
        }
      });

      item.addEventListener('dragleave', (e) => {
        const targetCard = e.target.closest('.roster-item');
        if (targetCard) targetCard.classList.remove('drag-over-top', 'drag-over-bottom');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetCard = e.target.closest('.roster-item');
        if (!targetCard) return;
        const targetIdx = parseInt(targetCard.dataset.idx, 10);
        const dtIdx = e.dataTransfer ? parseInt(e.dataTransfer.getData('text/plain'), 10) : null;
        const fromIdx = draggedIdx !== null ? draggedIdx : dtIdx;
        if (fromIdx !== null && !isNaN(fromIdx) && !isNaN(targetIdx) && fromIdx !== targetIdx) {
          const moved = this.matchPlayers.splice(fromIdx, 1)[0];
          this.matchPlayers.splice(targetIdx, 0, moved);
          sound.playClick();
          this.renderPlayerRosterSetup();
          this.renderSavedRosterChips();
        }
        draggedIdx = null;
      });

      // Mobile Touch Drag Support
      if (handle) {
        let activeTouchIdx = null;

        handle.addEventListener('touchstart', () => {
          activeTouchIdx = parseInt(item.dataset.idx, 10);
          item.classList.add('dragging');
        }, { passive: true });

        handle.addEventListener('touchmove', (e) => {
          if (activeTouchIdx === null) return;
          const touchY = e.touches[0].clientY;
          const elements = document.elementsFromPoint(e.touches[0].clientX, touchY);
          const overItem = elements.find(el => el.classList && el.classList.contains('roster-item') && el !== item);
          rosterEl.querySelectorAll('.roster-item').forEach(el => {
            if (el !== overItem) el.classList.remove('drag-over-top', 'drag-over-bottom');
          });
          if (overItem) {
            const rect = overItem.getBoundingClientRect();
            if (touchY < rect.top + rect.height / 2) {
              overItem.classList.add('drag-over-top');
              overItem.classList.remove('drag-over-bottom');
            } else {
              overItem.classList.add('drag-over-bottom');
              overItem.classList.remove('drag-over-top');
            }
          }
        }, { passive: true });

        handle.addEventListener('touchend', (e) => {
          if (activeTouchIdx === null) return;
          item.classList.remove('dragging');
          const lastTouch = e.changedTouches[0];
          const elements = document.elementsFromPoint(lastTouch.clientX, lastTouch.clientY);
          const targetItem = elements.find(el => el.classList && el.classList.contains('roster-item'));
          if (targetItem && targetItem !== item) {
            const targetIdx = parseInt(targetItem.dataset.idx, 10);
            const moved = this.matchPlayers.splice(activeTouchIdx, 1)[0];
            this.matchPlayers.splice(targetIdx, 0, moved);
            sound.playClick();
            this.renderPlayerRosterSetup();
            this.renderSavedRosterChips();
          }
          rosterEl.querySelectorAll('.roster-item').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
          });
          activeTouchIdx = null;
        });
      }
    });

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

  updateSetupSpecVisibility() {
    const specPanel = document.getElementById('setup-spec-panel');
    const x01Opts = document.getElementById('setup-x01-options');
    const splitOpts = document.getElementById('setup-split-options');
    const cricketOpts = document.getElementById('setup-cricket-options');
    const partyOpts = document.getElementById('setup-party-options');
    const highscoreOpts = document.getElementById('setup-highscore-options');

    const hasExtraSpecs = ['x01', 'split_score', 'cricket', 'highscore', 'shooter', 'killer', 'elimination', 'shanghai'].includes(this.selectedGameType);

    if (specPanel) specPanel.style.display = hasExtraSpecs ? '' : 'none';
    if (x01Opts) x01Opts.style.display = this.selectedGameType === 'x01' ? '' : 'none';
    if (splitOpts) splitOpts.style.display = this.selectedGameType === 'split_score' ? '' : 'none';
    if (cricketOpts) cricketOpts.style.display = this.selectedGameType === 'cricket' ? '' : 'none';
    if (highscoreOpts) highscoreOpts.style.display = ['highscore', 'shooter'].includes(this.selectedGameType) ? '' : 'none';
    if (partyOpts) partyOpts.style.display = ['killer', 'elimination', 'shanghai'].includes(this.selectedGameType) ? '' : 'none';
  }

  attachSetupEvents() {
    document.querySelectorAll('.game-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.game-mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedGameType = card.dataset.mode;
        this.updateSetupSpecVisibility();
      });
    });

    this.updateSetupSpecVisibility();

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
    this.syncGameVoiceSelect();
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
    const dnpContainer = document.getElementById('dart-numpad-container');
    const dbContainer = document.getElementById('dartboard-container');
    const selectEl = document.getElementById('select-input-mode');

    if (dkpContainer) dkpContainer.style.display = 'none';
    if (dnpContainer) dnpContainer.style.display = 'none';
    if (dbContainer) dbContainer.style.display = 'none';

    if (mode === 'dartboard' || mode === 'board') {
      if (dbContainer) dbContainer.style.display = 'flex';
      if (selectEl) selectEl.value = 'board';
    } else if (mode === 'numpad') {
      if (dnpContainer) dnpContainer.style.display = 'block';
      if (selectEl) selectEl.value = 'numpad';
    } else {
      if (dkpContainer) dkpContainer.style.display = 'block';
      if (selectEl) selectEl.value = 'keypad';
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
    if (!this.currentGame || this.currentGame.isMatchOver || this.isPausedForNextLeg) return;
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
    if (this.isPausedForNextLeg) {
      this.isPausedForNextLeg = false;
      document.getElementById('leg-win-celebration-banner')?.remove();
    }
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
            count180: p.count180 || 0,
            totalMarks: p.totalMarks || 0,
            mpr: this.currentGame?.getPlayerMPR ? this.currentGame.getPlayerMPR(p) : undefined,
            totalDoublesHit: p.totalDoublesHit || 0,
            kills: p.kills || 0,
            roundsSurvived: p.roundsSurvived || 0
          }
        }))
      };

      store.saveMatch(matchRecord);
      this.lastMatchData = matchRecord;
      store.clearActiveMatch();

      this.renderSummary(res.winner);
      this.showView('view-summary', true);
      return;
    }

    if (res.type === 'leg_win') {
      sound.playWin();
      caller.callGameShot(res.winner.name, false);
      if (this.dartboard) this.dartboard.clearHits();
      this.showLegWinCelebration(res.winner);
      return;
    }

    if (res.type === 'bust') {
      sound.playBust();
      caller.callBust(res.player.name);
      if (this.dartboard) this.dartboard.clearHits();
      this.showBanterToast("💥 Bust! Pub math strikes again!");
      return;
    }

    if (res.justOpened) {
      sound.playBullseye();
      this.showBanterToast(`🔓 OPENED! ${res.player?.name || 'Player'} is in the game with ${res.dart?.label || 'a Double'}!`);
    } else if (res.lockedMiss) {
      this.showBanterToast(`🔒 0 pts — Must hit ${this.currentGame?.inMode === 'master' ? 'Double or Treble' : 'a Double'} to start scoring!`);
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

      // Announce final dart of the visit cleanly
      caller.callSingleDart(lastDartScore, lastDart);
    }

  }

  updateScoreboard() {
    if (!this.currentGame) return;

    this.updateGameModeDisplay();

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

    // Update target & avoid route highlighting on SVG dartboard, Keypad, and Numpad
    if (this.dartKeypad) this.dartKeypad.updateState(this.currentGame);
    if (this.dartNumpad) this.dartNumpad.updateState(this.currentGame);
    if (this.dartboard) this.dartboard.updateState(this.currentGame);

    const boardHighlights = { targets: [], secondaryTargets: [], avoids: [] };
    const keypadHighlights = { targets: [], avoids: [] };

    if (this.currentGame && !this.currentGame.isMatchOver) {
      const active = this.currentGame.getActivePlayer();

      if (this.selectedGameType === 'x01' && active) {
        const dartsLeft = 3 - this.currentGame.turnDarts.length;
        const checkout = this.currentGame.getCheckout ? this.currentGame.getCheckout(active.score, dartsLeft) : null;
        const route = Array.isArray(checkout) ? checkout.filter(s => !s.includes(' ')) : (checkout?.route || []);
        if (route.length > 0) {
          boardHighlights.targets = [route[0]];
          if (route.length > 1) {
            boardHighlights.secondaryTargets = route.slice(1);
          }
          keypadHighlights.targets = [route[0]];
        } else if (this.currentGame.doubleIn && active.score === this.currentGame.startingScore) {
          boardHighlights.targets = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'Bull'];
          keypadHighlights.targets = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'Bull'];
        }
      } else if (this.selectedGameType === 'cricket' && active) {
        const targets = [15, 16, 17, 18, 19, 20, 25];
        const needed = targets.filter(num => {
          const marks = active.marks ? (active.marks[num] || 0) : 0;
          return marks < 3;
        });
        boardHighlights.targets = needed.map(n => n === 25 ? 'Bull' : n);
        keypadHighlights.targets = needed;
      } else if (this.selectedGameType === 'bobs27') {
        const roundNum = this.currentGame.currentRound || 1;
        const targetLabel = roundNum === 21 ? 'Bull' : `D${roundNum}`;
        boardHighlights.targets = [targetLabel];
        keypadHighlights.targets = [targetLabel];
      } else if (this.selectedGameType === 'killer' && active) {
        if (!active.isKiller) {
          // Unqualified: Target is ONLY player's own assigned double (e.g. D10)
          boardHighlights.targets = [`D${active.targetNumber}`];
          keypadHighlights.targets = [`D${active.targetNumber}`];
        } else {
          // Killer: Targets are all alive opponents' numbers (any multiplier); Avoid is own number!
          const livingOpponents = this.currentGame.players.filter(p => !p.isEliminated && p.id !== active.id);
          boardHighlights.targets = livingOpponents.map(p => p.targetNumber);
          boardHighlights.avoids = [active.targetNumber];
          keypadHighlights.targets = livingOpponents.map(p => p.targetNumber);
          keypadHighlights.avoids = [active.targetNumber];
        }
      } else if (this.selectedGameType === 'around_clock' && active) {
        const t = active.currentTarget || 1;
        boardHighlights.targets = [t === 25 ? 'Bull' : t];
        keypadHighlights.targets = [t];
      } else if (this.selectedGameType === 'shanghai') {
        const round = this.currentGame.currentRound || 1;
        boardHighlights.targets = [`S${round}`, `D${round}`, `T${round}`];
        keypadHighlights.targets = [round];
      } else if (this.selectedGameType === 'split_score') {
        const round = this.currentGame.getCurrentRound ? this.currentGame.getCurrentRound() : null;
        if (round) {
          if (round.targetType === 'double') {
            boardHighlights.targets = round.value === 25 ? ['Bull'] : [`D${round.value}`];
          } else if (round.targetType === 'treble') {
            boardHighlights.targets = [`T${round.value}`];
          } else if (round.targetType === 'bull') {
            boardHighlights.targets = ['Bull'];
          } else if (round.targetType === 'num') {
            boardHighlights.targets = [round.value];
          }
          keypadHighlights.targets = [round.value || 25];
        }
      } else if (this.selectedGameType === 'shooter') {
        const t = this.currentGame.getCurrentTarget ? this.currentGame.getCurrentTarget() : null;
        if (t) {
          boardHighlights.targets = [t === 25 ? 'Bull' : t];
          keypadHighlights.targets = [t];
        }
      }
    }

    if (this.dartboard) {
      this.dartboard.setBoardHighlights(boardHighlights);
    }
    if (this.dartKeypad) {
      this.dartKeypad.setHighlights(keypadHighlights);
    }
    if (this.dartNumpad) {
      this.dartNumpad.setHighlights(keypadHighlights);
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

  showLegWinCelebration(winner) {
    if (!winner || !this.currentGame) return;

    this.isPausedForNextLeg = true;

    // Confetti burst
    this.trigger180Confetti();

    // Summary text for toast and banner
    const legsSummary = this.currentGame.players
      .map(p => `${p.name}: ${p.legsWon}`)
      .join(' • ');

    this.showBanterToast(`🎯 GAME SHOT! ${winner.name} wins the leg! (${legsSummary})`);

    // Dynamic celebration banner injected into scoreboard container
    const container = document.getElementById('scoreboard-container');
    const existingBanner = document.getElementById('leg-win-celebration-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'leg-win-celebration-banner';
    banner.className = 'leg-win-celebration-banner';
    banner.innerHTML = `
      <div class="leg-win-badge">🎯 GAME SHOT &amp; THE LEG!</div>
      <div class="leg-win-msg"><strong>${winner.name}</strong> checks out and takes the leg!</div>
      <div class="leg-win-scores">
        ${this.currentGame.players.map(p => `
          <span class="leg-score-pill ${p.id === winner.id ? 'winner' : ''}">
            ${p.name}: <strong>${p.legsWon} ${p.legsWon === 1 ? 'Leg' : 'Legs'}</strong>
          </span>
        `).join('')}
      </div>
      <div style="margin-top: 14px;">
        <button id="btn-start-next-leg" class="btn-primary-start active-pulse" type="button" style="width: 100%; max-width: 320px; margin: 0 auto; padding: 14px 22px; font-size: 1.1rem; font-weight: 900; background: #10b981; border: 2px solid #059669; box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);">
          <span>🎯 START NEXT LEG ➔</span>
        </button>
      </div>
    `;

    if (container) {
      container.prepend(banner);
    }
  }

  startNextLeg() {
    sound.playClick();
    this.isPausedForNextLeg = false;
    const banner = document.getElementById('leg-win-celebration-banner');
    if (banner) banner.remove();

    this.updateScoreboard();

    const active = this.currentGame?.getActivePlayer();
    if (active) {
      caller.callTurn(active.name);
      if (active.isBot) {
        this.triggerBotTurn();
      }
    }
  }

  // --- Modals & Global Controls ---
  attachGameControlEvents() {
    document.getElementById('btn-game-undo')?.addEventListener('click', () => {
      this.handleUndo();
    });

    // Clicking Game Mode Badge opens Rules
    document.getElementById('game-mode-display')?.addEventListener('click', () => {
      sound.playClick();
      this.showRulesModal(this.selectedGameType);
    });

    document.getElementById('btn-rules-game')?.addEventListener('click', () => {
      sound.playClick();
      this.showRulesModal(this.selectedGameType);
    });

    const selectInputMode = document.getElementById('select-input-mode');
    if (selectInputMode) {
      selectInputMode.addEventListener('change', (e) => {
        sound.playClick();
        this.setInputMode(e.target.value);
      });
    }

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

    const gameSettingsBtn = document.getElementById('btn-game-settings');
    if (gameSettingsBtn) {
      gameSettingsBtn.addEventListener('click', () => {
        sound.playClick();
        this.openSettingsModal();
      });
    }

    const gameVoiceSelect = document.getElementById('game-voice-select');
    if (gameVoiceSelect) {
      this.syncGameVoiceSelect();
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

  openSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (!modal) return;

    // Sync modal controls with current settings
    const themeSel = document.getElementById('modal-setting-theme');
    if (themeSel) themeSel.value = document.documentElement.dataset.theme || store.settings.theme || 'bullsheet';

    const audioModeSel = document.getElementById('modal-setting-audio-mode');
    if (audioModeSel) audioModeSel.value = this.getAudioMode();

    const volSlider = document.getElementById('modal-setting-volume');
    const volLabel = document.getElementById('modal-setting-volume-label');
    const currentVol = Math.round((store.settings.volume !== undefined ? store.settings.volume : 0.8) * 100);
    if (volSlider) volSlider.value = currentVol;
    if (volLabel) volLabel.textContent = `${currentVol}%`;

    const voiceStyleSel = document.getElementById('modal-setting-voice-style');
    if (voiceStyleSel) voiceStyleSel.value = caller.style || 'russ_bray';

    const announceTotalCheck = document.getElementById('modal-setting-announce-total');
    if (announceTotalCheck) announceTotalCheck.checked = !!store.settings.announceTurnTotal;

    const vibrationCheck = document.getElementById('modal-setting-vibration');
    if (vibrationCheck) vibrationCheck.checked = store.settings.vibration !== false;

    this.updateSettingsAudioVisibility();

    modal.classList.add('active');
  }

  showExcuseModal() {
    const modal = document.getElementById('modal-excuse');
    const textEl = document.getElementById('excuse-text');
    if (!modal || !textEl) return;

    const randomExcuse = this.excuses[Math.floor(Math.random() * this.excuses.length)];
    textEl.textContent = randomExcuse;
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
        if (textEl) textEl.textContent = randomExcuse;
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
        this.syncGameVoiceSelect();
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

    // Modal Settings Controls (for In-Game settings adjustment)
    const modalThemeSel = document.getElementById('modal-setting-theme');
    if (modalThemeSel) {
      modalThemeSel.addEventListener('change', (e) => {
        this.applyTheme(e.target.value);
      });
    }

    const modalAudioModeSel = document.getElementById('modal-setting-audio-mode');
    if (modalAudioModeSel) {
      modalAudioModeSel.addEventListener('change', (e) => {
        this.setAudioMode(e.target.value);
      });
    }

    const modalVolSlider = document.getElementById('modal-setting-volume');
    const modalVolLabel = document.getElementById('modal-setting-volume-label');
    if (modalVolSlider) {
      modalVolSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (modalVolLabel) modalVolLabel.textContent = `${val}%`;
        if (volLabel) volLabel.textContent = `${val}%`;
        if (volSlider) volSlider.value = val;
        sound.setVolume(val / 100);
        caller.setVolume(val / 100);
        store.saveSettings({ volume: val / 100 });
      });
    }

    const modalVoiceStyleSel = document.getElementById('modal-setting-voice-style');
    if (modalVoiceStyleSel) {
      modalVoiceStyleSel.addEventListener('change', (e) => {
        caller.setStyle(e.target.value);
        if (voiceStyleSel) voiceStyleSel.value = e.target.value;
      });
    }

    const modalAnnounceTotalCheck = document.getElementById('modal-setting-announce-total');
    if (modalAnnounceTotalCheck) {
      modalAnnounceTotalCheck.addEventListener('change', (e) => {
        store.saveSettings({ announceTurnTotal: e.target.checked });
        if (announceTotalCheck) announceTotalCheck.checked = e.target.checked;
      });
    }

    const modalVibrationCheck = document.getElementById('modal-setting-vibration');
    if (modalVibrationCheck) {
      modalVibrationCheck.addEventListener('change', (e) => {
        store.saveSettings({ vibration: e.target.checked });
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
    const tableWrapper = document.getElementById('summary-table-dynamic-wrapper');
    if (winNameEl) {
      if (this.selectedGameType === 'bobs27' && this.currentGame && this.currentGame.players.length === 1 && this.currentGame.players[0].isEliminated) {
        winNameEl.textContent = `💥 BUSTED OUT! (Round ${this.currentGame.currentRound} / 21)`;
      } else {
        winNameEl.textContent = `🏆 ${winner ? winner.name : 'Player'} WINS!`;
      }
    }

    if (!tableWrapper || !this.currentGame) return;

    let headers;
    let rows;

    switch (this.selectedGameType) {
      case 'x01': {
        const hasSets = this.currentGame.setsToWin > 1;
        const hasMultipleLegs = this.currentGame.legsToWin > 1 || this.currentGame.legsPerSet > 1;
        if (hasSets) {
          headers = ['Player', 'Status', 'Sets', 'Legs', '3-Dart Avg', 'Best Turn', '180s'];
          rows = this.currentGame.players.map(p => [
            `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
            p.id === winner?.id ? '🏆 Winner' : (p.score > 0 ? `${p.score} rem` : 'Runner-up'),
            `${p.setsWon}`,
            `${p.legsWon}`,
            `${this.currentGame.getPlayerAvg(p)}`,
            `${p.highTurn || 0}`,
            `${p.count180 || 0}`
          ]);
        } else if (hasMultipleLegs) {
          headers = ['Player', 'Status', 'Legs Won', '3-Dart Avg', 'Best Turn', '180s'];
          rows = this.currentGame.players.map(p => [
            `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
            p.id === winner?.id ? '🏆 Winner' : (p.score > 0 ? `${p.score} rem` : 'Runner-up'),
            `${p.legsWon}`,
            `${this.currentGame.getPlayerAvg(p)}`,
            `${p.highTurn || 0}`,
            `${p.count180 || 0}`
          ]);
        } else {
          headers = ['Player', 'Status', '3-Dart Avg', 'First 9 Avg', 'Best Turn', '180s', 'Darts'];
          rows = this.currentGame.players.map(p => [
            `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
            p.id === winner?.id ? '🏆 Winner' : (p.score > 0 ? `${p.score} rem` : 'Runner-up'),
            `${this.currentGame.getPlayerAvg(p)}`,
            `${this.currentGame.getFirst9Avg(p)}`,
            `${p.highTurn || 0}`,
            `${p.count180 || 0}`,
            `${p.totalDarts || 0}`
          ]);
        }
        break;
      }

      case 'cricket':
        headers = ['Player', 'Status', 'Points', 'MPR', 'Marks', 'Closed Targets'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '🏆 Winner' : 'Runner-up',
          `${p.score} pts`,
          `${this.currentGame.getPlayerMPR(p)}`,
          `${p.totalMarks || 0}`,
          `${Object.values(p.marks || {}).filter(m => m >= 3).length} / 7`
        ]);
        break;

      case 'bobs27':
        headers = ['Player', 'Status', 'Final Score', 'Doubles Hit', 'Accuracy'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.isEliminated ? `☠️ Knockout (R${p.eliminatedRound || this.currentGame.currentRound})` : '✅ Survived (21/21)',
          `${p.score} pts`,
          `${p.totalDoublesHit || 0} / 63`,
          `${p.totalDarts > 0 ? ((p.totalDoublesHit / p.totalDarts) * 100).toFixed(1) + '%' : '0.0%'}`
        ]);
        break;

      case 'killer':
        headers = ['Player', 'Status', 'Kills', 'Lives Left', 'Target Double'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '👑 Winner' : (p.isEliminated ? '☠️ Eliminated' : '🛡️ Survived'),
          `${p.kills || 0}`,
          `${p.lives} / ${this.currentGame.startingLives || 5}`,
          `D${p.targetNumber}`
        ]);
        break;

      case 'elimination':
        headers = ['Player', 'Status', 'Lives Left', 'Rounds Survived', 'Best Visit'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '👑 Winner' : '☠️ Knocked Out',
          `${p.lives} / ${this.currentGame.startingLives || 5}`,
          `${p.roundsSurvived || 0}`,
          `${p.highTurn || (p.turns?.length ? Math.max(0, ...p.turns) : 0)} pts`
        ]);
        break;

      case 'split_score':
        headers = ['Player', 'Status', 'Final Score', 'Hits Landed', 'Halved Rounds', 'Best Round'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '🏆 Winner' : 'Runner-up',
          `${p.score} pts`,
          `${p.turns?.reduce((a, b) => a + (b > 0 ? 1 : 0), 0) || 0} / ${this.currentGame.rounds?.length || 9}`,
          `${p.scoreHistory ? p.scoreHistory.filter(s => s.halved).length : 0}`,
          `${p.turns?.length ? Math.max(0, ...p.turns) : 0} pts`
        ]);
        break;

      case 'shanghai':
        headers = ['Player', 'Status', 'Final Score', 'Shanghai Win', 'Best Round', 'Total Darts'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? (p.shanghaiWin ? '🔥 Shanghai Winner' : '🏆 Winner') : 'Runner-up',
          `${p.score} pts`,
          `${p.shanghaiWin ? '🔥 Instant Win' : 'No'}`,
          `${p.roundScores && p.roundScores.length ? Math.max(0, ...p.roundScores) : p.score} pts`,
          `${p.totalDarts || 0}`
        ]);
        break;

      case 'around_clock':
        headers = ['Player', 'Status', 'Finished On', 'Total Darts', 'Visits'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '🏆 Winner' : 'Runner-up',
          `${p.currentTarget === 25 ? '🎯 Bullseye' : 'Number ' + p.currentTarget}`,
          `${p.totalDarts || 0}`,
          `${p.turns?.length || Math.ceil((p.totalDarts || 0) / 3)}`
        ]);
        break;

      case 'highscore':
        headers = ['Player', 'Status', 'Final Score', '3-Dart Avg', 'Best Turn', '180s'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '🏆 Winner' : 'Runner-up',
          `${p.score} pts`,
          `${(p.score / (p.turns?.length || 1)).toFixed(1)}`,
          `${p.highTurn || (p.turns?.length ? Math.max(0, ...p.turns) : 0)} pts`,
          `${p.count180 || 0}`
        ]);
        break;

      case 'shooter':
      default:
        headers = ['Player', 'Status', 'Target Points', 'Hits', 'Best Round'];
        rows = this.currentGame.players.map(p => [
          `<strong>${p.name}</strong> ${p.isBot ? '<small>(BOT)</small>' : ''}`,
          p.id === winner?.id ? '🏆 Winner' : 'Runner-up',
          `${p.score} pts`,
          `${p.targetHits || p.score}`,
          `${p.roundScores && p.roundScores.length ? Math.max(0, ...p.roundScores) : p.score} pts`
        ]);
        break;
    }

    tableWrapper.innerHTML = `
      <table class="cricket-table" id="summary-stats-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${r.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Advance turn to next player manually or upon next throw
  advanceTurn() {
    if (!this.currentGame || this.currentGame.isMatchOver) return;
    sound.playClick();

    const finishingPlayer = this.currentGame.getActivePlayer();
    let turnTotal = 0;
    if (this.currentGame.turnDarts && this.currentGame.turnDarts.length > 0) {
      turnTotal = this.currentGame.turnDarts.reduce((acc, d) => {
        if (d.score !== undefined) return acc + d.score;
        if (d.pointsScored !== undefined) return acc + d.pointsScored;
        return acc + ((d.number || 0) * (d.mult || 1));
      }, 0);
    }

    if (store.settings.announceTurnTotal && turnTotal > 0 && store.settings.voice) {
      caller.callScore(turnTotal, finishingPlayer?.name);
    }

    const finishRes = this.currentGame.finishTurn();
    if (finishRes && finishRes.type === 'match_win') {
      this.processGameEvent(finishRes);
      return;
    }

    if (this.dartboard) this.dartboard.clearHits();
    this.saveCurrentMatchState();
    this.updateScoreboard();

    const nextPlayer = this.currentGame.getActivePlayer();
    if (nextPlayer) {
      caller.callTurn(nextPlayer.name);

      if (nextPlayer.isBot) {
        this.triggerBotTurn();
      }
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
            <option value="${p}" ${currentVal === p ? 'selected' : ''}>👤 ${p}</option>
          `).join('')}
        `;
      }
    }

    // 2. Compute Aggregated Metrics for selected Player & Game Mode
    const stats = store.getAggregatedStats(playerName, mode);

    if (lifetimeGrid) {
      const subMatchText = stats.isSinglePlayer ? `(${stats.winRate}% W)` : `(${stats.uniquePlayersCount} players)`;

      if (mode === 'cricket') {
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">${subMatchText}</small></span>
              <span class="stat-card-lbl">Cricket Matches ${stats.isSinglePlayer ? '/ Win %' : 'Recorded'}</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">📊</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.cricketMPR}</span>
              <span class="stat-card-lbl">Marks Per Round (MPR)</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMarks}</span>
              <span class="stat-card-lbl">Total Marks Scored</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏹</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalDarts}</span>
              <span class="stat-card-lbl">Total Darts Thrown</span>
            </div>
          </div>
        `;
      } else if (mode === 'bobs27') {
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎲</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">(${stats.survivalRate}% Survived)</small></span>
              <span class="stat-card-lbl">Bob's 27 Drills</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.highScore}</span>
              <span class="stat-card-lbl">Top Score Achieved</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalDoublesHit}</span>
              <span class="stat-card-lbl">Total Doubles Hit</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🛡️</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.survivedCount}</span>
              <span class="stat-card-lbl">21-Round Clears</span>
            </div>
          </div>
        `;
      } else if (mode === 'split_score') {
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">${subMatchText}</small></span>
              <span class="stat-card-lbl">Split Score Matches ${stats.isSinglePlayer ? '/ Win %' : 'Recorded'}</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🔥</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.highScore}</span>
              <span class="stat-card-lbl">Top Score Achieved</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">📊</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches > 0 ? Math.round(stats.totalScore / stats.totalMatches) : 0}</span>
              <span class="stat-card-lbl">Average Score</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalDarts}</span>
              <span class="stat-card-lbl">Total Darts Thrown</span>
            </div>
          </div>
        `;
      } else if (mode === 'party') {
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">${subMatchText}</small></span>
              <span class="stat-card-lbl">Party Games ${stats.isSinglePlayer ? '/ Win %' : 'Played'}</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalDarts}</span>
              <span class="stat-card-lbl">Total Darts Thrown</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎮</span>
            <div class="stat-card-info">
              <span class="stat-card-val" style="font-size:1.05rem;">${stats.mostPlayedPartyGame}</span>
              <span class="stat-card-lbl">Top Party Game</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">${stats.isSinglePlayer ? '👑' : '👥'}</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.isSinglePlayer ? stats.wins : stats.uniquePlayersCount}</span>
              <span class="stat-card-lbl">${stats.isSinglePlayer ? 'Party Games Won' : 'Players Participated'}</span>
            </div>
          </div>
        `;
      } else if (mode === 'x01') {
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">${subMatchText}</small></span>
              <span class="stat-card-lbl">X01 Matches ${stats.isSinglePlayer ? '/ Win %' : 'Recorded'}</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">📊</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.x01Avg}</span>
              <span class="stat-card-lbl">3-Dart Average</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">💯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.tonsCount} <small style="font-size:0.8rem; color:var(--text-secondary);">(${stats.count140}x 140+)</small></span>
              <span class="stat-card-lbl">Tons (100+ Visits)</span>
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
      } else {
        // Mode 'all': Overall overview (100% universal across all game modes)
        lifetimeGrid.innerHTML = `
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🏆</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalMatches} <small style="font-size:0.8rem; color:var(--text-secondary);">${subMatchText}</small></span>
              <span class="stat-card-lbl">Total Matches ${stats.isSinglePlayer ? '/ Win %' : 'Recorded'}</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎯</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.totalDarts}</span>
              <span class="stat-card-lbl">Total Darts Thrown</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">🎮</span>
            <div class="stat-card-info">
              <span class="stat-card-val" style="font-size:1.05rem;">${stats.mostPlayedMode}</span>
              <span class="stat-card-lbl">Favorite Game Mode</span>
            </div>
          </div>
          <div class="lifetime-stat-card">
            <span class="stat-card-icon">${stats.isSinglePlayer ? '👑' : '👥'}</span>
            <div class="stat-card-info">
              <span class="stat-card-val">${stats.isSinglePlayer ? stats.wins : store.savedPlayers.length}</span>
              <span class="stat-card-lbl">${stats.isSinglePlayer ? 'Total Matches Won' : 'Saved Players'}</span>
            </div>
          </div>
        `;
      }
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

    // 4. Render Filtered Match Cards List
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-history-box" style="text-align:center; padding:30px; background:var(--bg-secondary); border-radius:var(--border-radius-md); border:1px dashed var(--border-color); margin-top:16px;">
          <div style="font-size:2.5rem; margin-bottom:8px;">📊</div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">No matches found for this filter.</div>
          <div style="color:var(--text-secondary); font-size:0.9rem;">Try selecting a different player or game mode above.</div>
        </div>
      `;
      return;
    }

    const modeIcons = {
      x01: '🎯',
      cricket: '🏏',
      split_score: '➗',
      bobs27: '🎲',
      killer: '⚔️',
      elimination: '💀',
      shanghai: '🏮',
      around_clock: '⏰',
      highscore: '🏆',
      shooter: '🏹'
    };

    listEl.innerHTML = filtered.map(m => {
      const modeKey = m.gameType || 'x01';
      const modeIcons = { x01: '🎯', cricket: '🏏', split_score: '⚡', highscore: '🏆', shooter: '🏹', killer: '🔪', elimination: '💥', shanghai: '🏮', around_clock: '⏰', bobs27: '🛡️' };
      const modeIcon = modeIcons[modeKey] || '🎯';
      const badgeCls = ['x01', 'cricket', 'split_score', 'bobs27'].includes(modeKey) ? `mode-${modeKey}` : 'mode-party';
      const winner = m.winner || m.players?.find(p => p.won) || m.players?.[0] || { name: 'Player' };
      const dateStr = new Date(m.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const modeIcon = modeIcons[modeKey] || '🎮';
      const sample = m.players && m.players[0] ? MatchCardGenerator.extractPlayerStats(m.players[0], modeKey) : null;

      return `
        <div class="rich-history-card" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:16px; margin-bottom:14px;">
          <div class="rich-history-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span class="hist-game-badge ${badgeCls}" style="font-weight:700; color:var(--accent-gold);">${modeIcon} ${modeKey.toUpperCase()}</span>
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
                <th style="padding:6px 0;">${sample?.col1Label || 'Score'}</th>
                <th style="padding:6px 0;">${sample?.col2Label || 'Avg / Result'}</th>
                <th style="padding:6px 0;">${sample?.col3Label || 'Stats'}</th>
              </tr>
            </thead>
            <tbody>
              ${(m.players || []).map(rawP => {
                const p = MatchCardGenerator.extractPlayerStats(rawP, modeKey);
                const isWinner = rawP.won || rawP.name === winner.name;
                const isSelected = playerName !== 'all' && rawP.name.toLowerCase() === playerName.toLowerCase();

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.05); ${isSelected ? 'background:rgba(234,179,8,0.1);' : ''}">
                    <td style="padding:8px 0;"><strong>${p.name}</strong> ${rawP.isBot ? '<small style="color:var(--text-muted);">(BOT)</small>' : ''}</td>
                    <td style="padding:8px 0; color:${isWinner ? 'var(--accent-gold)' : 'var(--text-primary)'}; font-weight:${isWinner ? '700' : '400'};">${p.col1Val}</td>
                    <td style="padding:8px 0;">${p.col2Val}</td>
                    <td style="padding:8px 0;">${p.col3Val}</td>
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
