// Web Speech API Voice Caller for BullSheet
class DartsCaller {
  constructor() {
    this.enabled = true;
    this.voice = null;
    this.sarcasm = true;
    this.synth = window.speechSynthesis;

    this.sarcastic26 = [
      "Classic twenty-six. Pure bull-sheet.",
      "Twenty-six. Fish and chips is served.",
      "Twenty-six. The board sends its condolences.",
      "A stunning twenty-six. True pub quality.",
      "Twenty-six. Have you tried aiming at the top?"
    ];

    this.sarcasticBusts = [
      "Bust! Overcooked it mate.",
      "Busted. That went according to plan.",
      "Bust! More bull-sheet.",
      "Busted. The math is hard, isn't it?",
      "Bust! Time to consult the excuse generator."
    ];

    if (this.synth) {
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
      this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en_GB')) ||
                 voices.find(v => v.lang.includes('en-US')) ||
                 voices.find(v => v.lang.startsWith('en')) ||
                 voices[0];
  }

  toggle(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    return this.enabled;
  }

  toggleSarcasm(enabled) {
    this.sarcasm = enabled !== undefined ? enabled : !this.sarcasm;
    return this.sarcasm;
  }

  speak(text, { pitch = 1.0, rate = 1.0, volume = 1.0 } = {}) {
    if (!this.enabled || !this.synth) return;
    try {
      this.synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (this.voice) utter.voice = this.voice;
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = volume;
      this.synth.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  callScore(score, playerName = '') {
    if (!this.enabled) return;

    if (score === 180) {
      this.speak("ONE HUNDRED AND EIGHTY!", { pitch: 1.15, rate: 1.05 });
      return;
    }

    if (score === 26 && this.sarcasm) {
      const phrase = this.sarcastic26[Math.floor(Math.random() * this.sarcastic26.length)];
      this.speak(phrase);
      return;
    }

    if (score === 0) {
      this.speak("No score. Zero points.");
      return;
    }

    this.speak(`${score}`);
  }

  callBust(playerName = '') {
    if (!this.enabled) return;
    if (this.sarcasm && Math.random() > 0.3) {
      const phrase = this.sarcasticBusts[Math.floor(Math.random() * this.sarcasticBusts.length)];
      this.speak(phrase);
    } else {
      this.speak("Bust! Score remains.");
    }
  }

  callCheckoutReq(score) {
    if (!this.enabled || score > 170 || score <= 1) return;
    this.speak(`You require ${score}`, { rate: 1.0 });
  }

  callGameShot(playerName = '', isMatch = false) {
    if (!this.enabled) return;
    if (isMatch) {
      this.speak(`Game shot and the match! Congratulations ${playerName || 'Player'}!`, { pitch: 1.1, rate: 1.05 });
    } else {
      this.speak(`Game shot! Leg to ${playerName || 'Player'}!`, { pitch: 1.05 });
    }
  }

  callTurn(playerName) {
    if (!this.enabled) return;
    this.speak(`${playerName}, your throw.`, { rate: 1.05 });
  }
}

export const caller = new DartsCaller();
