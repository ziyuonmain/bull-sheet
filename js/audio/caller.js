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
    this.style = localStorage.getItem('bullsheet_voice_style') || 'russ_bray';
    // Backwards compatibility migration
    if (this.style === 'ally_pally' || !CALLER_PACKS[this.style]) {
      this.style = 'russ_bray';
    }

    this.currentAudio = null;
    this.audioCache = new Map();
    this.synth = window.speechSynthesis;
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
    this.synthVoice = voices.find(v => (v.lang.includes('en-GB') || v.lang.includes('en_GB'))) ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices[0];
  }

  preloadKeySounds() {
    const pack = CALLER_PACKS[this.style] || CALLER_PACKS.russ_bray;
    ['180', '140', '100', '26', '0', 'gameshot'].forEach(key => {
      const audio = new Audio(`${pack.localPath}${key}.mp3`);
      audio.preload = 'auto';
      this.audioCache.set(`${this.style}_${key}`, audio);
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
    localStorage.setItem('bullsheet_voice_style', this.style);
    this.preloadKeySounds();
  }

  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    return this.enabled;
  }

  toggleSarcasm(_enabled) {
    // Retained for interface compatibility
    return true;
  }

  speak(_text) {
    // Retained for interface compatibility
  }

  // Play real human audio file with remote streaming fallback and optional completion callback
  playHumanAudio(key, onEnded = null) {
    if (!this.enabled) {
      if (onEnded) onEnded();
      return;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
    }

    const pack = CALLER_PACKS[this.style] || CALLER_PACKS.russ_bray;
    const cacheKey = `${this.style}_${key}`;

    let audio = this.audioCache.get(cacheKey);
    if (!audio) {
      audio = new Audio(`${pack.localPath}${key}.mp3`);
      this.audioCache.set(cacheKey, audio);
    }

    audio.currentTime = 0;
    try { audio.volume = this.volume; } catch {}
    this.currentAudio = audio;

    if (onEnded) {
      audio.onended = () => {
        audio.onended = null;
        onEnded();
      };
    }

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((_err) => {
        // Stream from remote voice pack if local asset not bundled
        const remoteAudio = new Audio(`${pack.remoteUrl}${key}.mp3`);
        try { remoteAudio.volume = this.volume; } catch {}
        this.currentAudio = remoteAudio;
        if (onEnded) {
          remoteAudio.onended = () => {
            remoteAudio.onended = null;
            onEnded();
          };
        }
        remoteAudio.play().catch(_e => {
          console.warn('Audio call error for key:', key, _e);
          if (onEnded) onEnded();
        });
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

  callScore(score, _playerName = '') {
    if (!this.enabled) return;

    if (score === 180) {
      this.playHumanAudio('180');
      return;
    }

    if (score === 140) {
      this.playHumanAudio('140');
      return;
    }

    if (score === 100) {
      this.playHumanAudio('100');
      return;
    }

    if (score === 26) {
      this.playHumanAudio('26');
      return;
    }

    if (score === 0) {
      this.playHumanAudio('0');
      return;
    }

    // Direct score human call
    this.playHumanAudio(`${score}`);
  }

  callBust(_playerName = '') {
    if (!this.enabled) return;
    this.playHumanAudio('0');
  }

  callGameShot(_playerName = '', _isMatch = false) {
    if (!this.enabled) return;
    this.playHumanAudio('gameshot');
  }

  callTurn(_playerName) {
    // Pure human audio mode - no robotic speech between turns
  }
}

export const caller = new DartsCaller();
