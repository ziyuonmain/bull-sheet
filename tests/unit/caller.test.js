import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser APIs for Node environment
if (!globalThis.localStorage) {
  const storeMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => storeMap.get(k) || null,
    setItem: (k, v) => storeMap.set(k, String(v)),
    removeItem: (k) => storeMap.delete(k),
    clear: () => storeMap.clear()
  };
}

class MockAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
    this.ended = false;
    this.onended = null;
    this.onerror = null;
  }
  play() {
    this.paused = false;
    this.ended = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

class MockUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'en-GB';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
  }
}

const mockSynth = {
  spokenUtterances: [],
  cancelledCount: 0,
  speak(utt) {
    this.spokenUtterances.push(utt);
  },
  cancel() {
    this.cancelledCount++;
  },
  getVoices() {
    return [{ name: 'Google UK English Male', lang: 'en-GB' }];
  }
};

globalThis.Audio = MockAudio;
globalThis.SpeechSynthesisUtterance = MockUtterance;
globalThis.speechSynthesis = mockSynth;
if (typeof window === 'undefined') {
  globalThis.window = { speechSynthesis: mockSynth };
} else {
  globalThis.window.speechSynthesis = mockSynth;
}

import { DartsCaller } from '../../js/audio/caller.js';

describe('DartsCaller Audio & Speech Synchronization', () => {
  let caller;

  beforeEach(() => {
    mockSynth.spokenUtterances = [];
    mockSynth.cancelledCount = 0;
    caller = new DartsCaller();
  });

  test('initializes with default voice style and volume', () => {
    assert.equal(caller.style, 'russ_bray');
    assert.equal(caller.volume, 0.8);
    assert.equal(caller.enabled, true);
    assert.equal(caller.isPlayingAudio, false);
    assert.equal(caller.pendingTurnPlayer, null);
  });

  test('playHumanAudio starts audio and tracks playing state', () => {
    caller.playHumanAudio('180');
    assert.equal(caller.isPlayingAudio, true);
    assert.ok(caller.currentAudio);
    assert.equal(caller.currentAudio.src.includes('180.mp3'), true);
  });

  test('callTurn queues announcement when referee audio is actively playing', () => {
    // 1. Start score audio
    caller.callScore(100);
    assert.equal(caller.isPlayingAudio, true);
    assert.equal(mockSynth.spokenUtterances.length, 0);

    // 2. Call turn while audio is playing
    caller.callTurn('Alice');
    // Turn call should be queued, NOT spoken immediately
    assert.equal(caller.pendingTurnPlayer, 'Alice');
    assert.equal(mockSynth.spokenUtterances.length, 0);
  });

  test('callTurn executes after referee audio finishes playing (onended)', async () => {
    caller.callScore(60);
    caller.callTurn('Bob');
    assert.equal(caller.pendingTurnPlayer, 'Bob');
    assert.equal(mockSynth.spokenUtterances.length, 0);

    // Trigger onended event on the mock audio
    caller.currentAudio.onended();
    assert.equal(caller.isPlayingAudio, false);
    assert.equal(caller.pendingTurnPlayer, null);

    // Wait for the natural 250ms cadence pause
    await new Promise(resolve => setTimeout(resolve, 300));

    assert.equal(mockSynth.spokenUtterances.length, 1);
    assert.equal(mockSynth.spokenUtterances[0].text, 'Bob, your throw.');
  });

  test('callTurn speaks immediately if no human audio is playing', () => {
    caller.callTurn('Charlie');
    assert.equal(caller.pendingTurnPlayer, null);
    assert.equal(mockSynth.spokenUtterances.length, 1);
    assert.equal(mockSynth.spokenUtterances[0].text, 'Charlie, your throw.');
  });

  test('stop() cancels playing audio, speech synthesis, and queued turn announcements', () => {
    caller.callScore(140);
    caller.callTurn('Dave');
    assert.equal(caller.isPlayingAudio, true);
    assert.equal(caller.pendingTurnPlayer, 'Dave');

    caller.stop();
    assert.equal(caller.isPlayingAudio, false);
    assert.equal(caller.pendingTurnPlayer, null);
    assert.equal(caller.pendingTurnTimeout, null);
    assert.ok(mockSynth.cancelledCount > 0);
  });

  test('toggle(false) disables caller and stops all audio', () => {
    caller.callScore(180);
    caller.toggle(false);
    assert.equal(caller.enabled, false);
    assert.equal(caller.isPlayingAudio, false);
    assert.equal(caller.pendingTurnPlayer, null);
  });
});
