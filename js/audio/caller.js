// Human Audio Caller System for BullSheet
// Uses authentic studio recordings for Russ Bray (Ally Pally), George Noble (PDC Referee), and British Studio Referee.

const CALLER_PACKS = {
  russ_bray: {
    id: 'russ_bray',
    name: '🎙️ Russ Bray ("The Voice" - Ally Pally Legend)',
    localPath: './audio/russ_bray/',
    remoteUrl: 'https://autodarts.x10.mx/russ_bray/'
  },
  george_noble: {
    id: 'george_noble',
    name: '🎙️ George Noble (Official PDC Tournament Referee)',
    localPath: './audio/george_noble/',
    remoteUrl: 'https://autodarts.x10.mx/georgeno/'
  },
  british_ref: {
    id: 'british_ref',
    name: '🎩 British Studio Referee (Clean Announcer)',
    localPath: './audio/british_ref/',
    remoteUrl: 'https://autodarts.x10.mx/1_male_eng/'
  }
};

export class DartsCaller {
  constructor() {
    this.enabled = true;
    this.volume = 0.8;
    this.style = typeof localStorage !== 'undefined' ? (localStorage.getItem('bullsheet_voice_style') || 'russ_bray') : 'russ_bray';
    // Backwards compatibility migration
    if (this.style === 'ally_pally' || !CALLER_PACKS[this.style]) {
      this.style = 'russ_bray';
    }

    this.currentAudio = null;
    this.audioCache = new Map();
    this.isPlayingAudio = false;
    this.pendingTurnPlayer = null;
    this.pendingTurnTimeout = null;
    this.audioSafetyTimeout = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.synthVoice = null;

    if (this.synth) {
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadSynthVoice();
      }
      this.loadSynthVoice();
    }

    // Preload signature clips for instant playback
    this.preloadKeySounds();
  }

  loadSynthVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    const preferredNames = [
      'Google UK English Male',
      'Daniel',
      'Arthur',
      'Oliver',
      'George',
      'Google UK English Female',
      'Hazel',
      'Samantha',
      'Natural',
      'Neural',
      'en-GB',
      'en_GB'
    ];
    for (const name of preferredNames) {
      const match = voices.find(v => v.name.includes(name) || v.lang.includes(name));
      if (match) {
        this.synthVoice = match;
        return;
      }
    }

    this.synthVoice = voices.find(v => (v.lang.includes('en-GB') || v.lang.includes('en_GB'))) ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices[0];
  }

  preloadKeySounds() {
    if (typeof Audio === 'undefined') return;
    const pack = CALLER_PACKS[this.style] || CALLER_PACKS.russ_bray;
    ['180', '140', '100', '26', '0', 'gameshot'].forEach(key => {
      try {
        const audio = new Audio(`${pack.localPath}${key}.mp3`);
        audio.preload = 'auto';
        this.audioCache.set(`${this.style}_${key}`, audio);
      } catch {}
    });
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.currentAudio) {
      try { this.currentAudio.volume = this.volume; } catch {}
    }
  }

  setStyle(styleId) {
    this.style = CALLER_PACKS[styleId] ? styleId : 'russ_bray';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bullsheet_voice_style', this.style);
    }
    this.preloadKeySounds();
  }

  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }

  toggleSarcasm(_enabled) {
    // Retained for interface compatibility
    return true;
  }

  speak(_text) {
    // Retained for interface compatibility
  }

  stop() {
    clearTimeout(this.pendingTurnTimeout);
    clearTimeout(this.audioSafetyTimeout);
    this.pendingTurnTimeout = null;
    this.pendingTurnPlayer = null;
    this.isPlayingAudio = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }

  isAudioPlaying() {
    if (this.isPlayingAudio) return true;
    if (this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended) {
      return true;
    }
    return false;
  }

  flushPendingTurn() {
    if (!this.pendingTurnPlayer) return;
    const name = this.pendingTurnPlayer;
    this.pendingTurnPlayer = null;

    clearTimeout(this.pendingTurnTimeout);
    // Natural 250ms cadence pause between referee score announcement and next player announcement
    this.pendingTurnTimeout = setTimeout(() => {
      this.pendingTurnTimeout = null;
      this._speakTurnUtterance(name);
    }, 250);
  }

  // Play real human audio file with remote streaming fallback and optional completion callback
  playHumanAudio(key, onEnded = null) {
    if (!this.enabled) {
      this.isPlayingAudio = false;
      if (onEnded) onEnded();
      return;
    }

    // Cancel any active SpeechSynthesis utterance and clear pending turn calls
    if (this.synth) {
      try { this.synth.cancel(); } catch {}
    }
    clearTimeout(this.pendingTurnTimeout);
    this.pendingTurnTimeout = null;
    clearTimeout(this.audioSafetyTimeout);

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
    }

    if (typeof Audio === 'undefined') {
      this.isPlayingAudio = false;
      if (onEnded) onEnded();
      this.flushPendingTurn();
      return;
    }

    const pack = CALLER_PACKS[this.style] || CALLER_PACKS.russ_bray;
    const cacheKey = `${this.style}_${key}`;

    let audio = this.audioCache.get(cacheKey);
    if (!audio) {
      try {
        audio = new Audio(`${pack.localPath}${key}.mp3`);
        this.audioCache.set(cacheKey, audio);
      } catch {
        this.isPlayingAudio = false;
        if (onEnded) onEnded();
        this.flushPendingTurn();
        return;
      }
    }

    audio.currentTime = 0;
    try { audio.volume = this.volume; } catch {}
    this.currentAudio = audio;
    this.isPlayingAudio = true;

    const handleAudioEnd = () => {
      clearTimeout(this.audioSafetyTimeout);
      this.isPlayingAudio = false;
      if (this.currentAudio === audio) {
        try {
          audio.onended = null;
          audio.onerror = null;
        } catch {}
      }
      if (onEnded) {
        try { onEnded(); } catch (err) { console.warn('Audio onEnded callback error:', err); }
      }
      this.flushPendingTurn();
    };

    audio.onended = handleAudioEnd;
    audio.onerror = handleAudioEnd;

    // Safety timeout in case browser audio event fails to fire
    this.audioSafetyTimeout = setTimeout(() => {
      if (this.isPlayingAudio && this.currentAudio === audio) {
        handleAudioEnd();
      }
    }, 4000);

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((_err) => {
        // Stream from remote voice pack if local asset not bundled
        try {
          const remoteAudio = new Audio(`${pack.remoteUrl}${key}.mp3`);
          try { remoteAudio.volume = this.volume; } catch {}
          this.currentAudio = remoteAudio;

          const handleRemoteEnd = () => {
            clearTimeout(this.audioSafetyTimeout);
            this.isPlayingAudio = false;
            if (this.currentAudio === remoteAudio) {
              try {
                remoteAudio.onended = null;
                remoteAudio.onerror = null;
              } catch {}
            }
            if (onEnded) {
              try { onEnded(); } catch (err) { console.warn('Audio onEnded callback error:', err); }
            }
            this.flushPendingTurn();
          };

          remoteAudio.onended = handleRemoteEnd;
          remoteAudio.onerror = handleRemoteEnd;

          clearTimeout(this.audioSafetyTimeout);
          this.audioSafetyTimeout = setTimeout(() => {
            if (this.isPlayingAudio && this.currentAudio === remoteAudio) {
              handleRemoteEnd();
            }
          }, 5000);

          const remotePromise = remoteAudio.play();
          if (remotePromise !== undefined) {
            remotePromise.catch(_e => {
              console.warn('Audio call error for key:', key, _e);
              handleRemoteEnd();
            });
          }
        } catch {
          handleAudioEnd();
        }
      });
    }
  }

  // Announce single dart throw (Dart 1, 2, and 3)
  callSingleDart(score, dart = null, onEnded = null) {
    if (!this.enabled) {
      if (onEnded) onEnded();
      return;
    }

    if (score === 0) {
      this.playHumanAudio('0', onEnded);
      return;
    }

    if (score === 50 || (dart && dart.number === 25 && dart.mult === 2)) {
      this.playHumanAudio('50', onEnded);
      return;
    }

    if (score === 25 || (dart && dart.number === 25 && dart.mult === 1)) {
      this.playHumanAudio('25', onEnded);
      return;
    }

    // Direct score human recording (1 to 60)
    this.playHumanAudio(`${score}`, onEnded);
  }

  // --- Public Announcer Calls ---

  callScore(score, _playerName = '', onEnded = null) {
    if (!this.enabled) {
      if (onEnded) onEnded();
      return;
    }

    if (score === 180) {
      this.playHumanAudio('180', onEnded);
      return;
    }

    if (score === 140) {
      this.playHumanAudio('140', onEnded);
      return;
    }

    if (score === 100) {
      this.playHumanAudio('100', onEnded);
      return;
    }

    if (score === 26) {
      this.playHumanAudio('26', onEnded);
      return;
    }

    if (score === 0) {
      this.playHumanAudio('0', onEnded);
      return;
    }

    // Direct score human call
    this.playHumanAudio(`${score}`, onEnded);
  }

  callBust(_playerName = '', onEnded = null) {
    if (!this.enabled) {
      if (onEnded) onEnded();
      return;
    }
    this.playHumanAudio('0', onEnded);
  }

  callGameShot(_playerName = '', _isMatch = false, onEnded = null) {
    if (!this.enabled) {
      if (onEnded) onEnded();
      return;
    }
    this.playHumanAudio('gameshot', onEnded);
  }

  callTurn(playerName) {
    if (!this.enabled || !playerName) return;

    // Clear any previous queued turn call
    clearTimeout(this.pendingTurnTimeout);
    this.pendingTurnTimeout = null;

    if (this.isAudioPlaying()) {
      // Queue turn call so it speaks only after active referee audio finishes
      this.pendingTurnPlayer = playerName;
      return;
    }

    this.pendingTurnPlayer = null;
    this._speakTurnUtterance(playerName);
  }

  _speakTurnUtterance(playerName) {
    if (!this.enabled || !playerName) return;
    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') return;

    try {
      this.synth.cancel();
      if (!this.synthVoice) {
        this.loadSynthVoice();
      }

      const cleanName = playerName.trim();
      // Comma provides natural referee cadence and clear player separation
      const utterance = new SpeechSynthesisUtterance(`${cleanName}, your throw.`);
      if (this.synthVoice) {
        utterance.voice = this.synthVoice;
      }
      utterance.lang = this.synthVoice?.lang || 'en-GB';
      utterance.rate = 0.85; // Clear, articulate cadence (not rushed)
      utterance.pitch = 0.95; // Authoritative referee pitch
      utterance.volume = this.volume;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis turn call error:', e);
    }
  }
}

export const caller = new DartsCaller();
