// Pro Speed Dart Numpad Component for BullSheet (ATM Digit Typing & Right Modifier Rail)

export class DartNumpad {
  constructor(containerEl, onDartSubmitCallback, onUndoCallback, onNextPlayerCallback) {
    this.container = containerEl;
    this.onDartSubmit = onDartSubmitCallback;
    this.onUndo = onUndoCallback;
    this.onNextPlayer = onNextPlayerCallback;
    this.currentMultiplier = 1; // 1 = Single (default), 2 = Double, 3 = Treble
    this.buffer = '';
    this.currentHighlights = { targets: [], avoids: [] };
    this.isVisitComplete = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  updateState(game) {
    if (!game) return;
    this.isVisitComplete = game.turnDarts && game.turnDarts.length >= 3 && !game.isMatchOver;

    const nextBtn = this.container.querySelector('#btn-numpad-next');
    if (nextBtn) {
      if (this.isVisitComplete) {
        nextBtn.classList.remove('hidden-action');
        nextBtn.classList.add('active-pulse');
        nextBtn.innerHTML = `<span>End Turn ➔</span>`;
      } else {
        nextBtn.classList.add('hidden-action');
        nextBtn.classList.remove('active-pulse');
      }
    }
  }

  render() {
    // 1-Tap Speed Shortcuts
    const quickDarts = [
      { label: '20', num: 20, mult: 1, score: 20, badge: 'S20', cls: 'btn-quick-s20' },
      { label: '1', num: 1, mult: 1, score: 1, badge: 'S1', cls: 'btn-quick-s1' },
      { label: '5', num: 5, mult: 1, score: 5, badge: 'S5', cls: 'btn-quick-s5' },
      { label: 'T20', num: 20, mult: 3, score: 60, badge: '60', cls: 'btn-quick-t20' },
      { label: '🔴 Bull', num: 25, mult: 2, score: 50, badge: '50', cls: 'btn-quick-bull' },
      { label: '🟢 25', num: 25, mult: 1, score: 25, badge: '25', cls: 'btn-quick-outer' }
    ];

    let html = `
      <div class="pro-dart-numpad">
        
        <!-- 1. Live Dart Input Display Bar -->
        <div class="numpad-display-bar">
          <div class="numpad-display-info">
            <span class="numpad-display-label">CURRENT DART:</span>
            <span class="numpad-display-val" id="numpad-display-val">—</span>
          </div>
          <div class="numpad-display-pts" id="numpad-display-pts">0 pts</div>
        </div>

        <!-- 2. 1-Tap Quick Common Darts -->
        <div class="speed-darts-grid numpad-speed-grid">
          ${quickDarts.map(d => `
            <button class="speed-dart-btn ${d.cls}" type="button" data-num="${d.num}" data-mult="${d.mult}" data-score="${d.score}" data-label="${d.label}">
              <span class="speed-lbl">${d.label}</span>
              <span class="speed-pts">${d.badge} pts</span>
            </button>
          `).join('')}
        </div>

        <!-- 3. Main Numpad Body: 3x4 Digits + Right Modifier Rail -->
        <div class="numpad-main-layout">
          
          <!-- Left: 3x4 Digit Grid -->
          <div class="numpad-digits-grid">
            <button class="numpad-digit-btn" type="button" data-digit="7">7</button>
            <button class="numpad-digit-btn" type="button" data-digit="8">8</button>
            <button class="numpad-digit-btn" type="button" data-digit="9">9</button>

            <button class="numpad-digit-btn" type="button" data-digit="4">4</button>
            <button class="numpad-digit-btn" type="button" data-digit="5">5</button>
            <button class="numpad-digit-btn" type="button" data-digit="6">6</button>

            <button class="numpad-digit-btn" type="button" data-digit="1">1</button>
            <button class="numpad-digit-btn" type="button" data-digit="2">2</button>
            <button class="numpad-digit-btn" type="button" data-digit="3">3</button>

            <button class="numpad-digit-btn" type="button" data-digit="0">0</button>
            <button class="numpad-btn-backspace" type="button" id="btn-numpad-backspace" title="Delete Last Digit">⌫</button>
          </div>

          <!-- Right: Modifiers & Tall Enter Key -->
          <div class="numpad-right-rail">
            <button class="numpad-mod-btn ${this.currentMultiplier === 3 ? 'active' : ''}" type="button" data-mult="3" id="btn-numpad-treble">
              <span>Treble</span>
              <small>(3x)</small>
            </button>
            <button class="numpad-mod-btn ${this.currentMultiplier === 2 ? 'active' : ''}" type="button" data-mult="2" id="btn-numpad-double">
              <span>Double</span>
              <small>(2x)</small>
            </button>
            <button class="numpad-btn-enter" type="button" id="btn-numpad-enter" title="Submit Dart">
              <span>↲</span>
              <strong>ENTER</strong>
            </button>
          </div>

        </div>

        <!-- 4. Primary Action Bar (UNDO • MISS • END TURN) at BOTTOM -->
        <div class="right-actions-bottom-bar" style="margin-top: 10px;">
          <button class="btn-panel-action btn-action-undo" type="button" id="btn-numpad-undo" title="Undo Last Dart">
            <span>↶ UNDO</span>
          </button>
          <button class="btn-panel-action btn-action-miss" type="button" data-num="0" data-mult="0" data-score="0" data-label="Miss" title="Record Miss (0 pts)">
            <span>❌ MISS</span>
          </button>
          <button class="btn-panel-action btn-action-next hidden-action" type="button" id="btn-numpad-next" title="End Turn">
            <span>End Turn ➔</span>
          </button>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
    this.updateDisplay();
  }

  attachEvents() {
    // Action Buttons: Undo & Next Player
    this.container.querySelector('#btn-numpad-undo')?.addEventListener('click', () => {
      if (this.onUndo) this.onUndo();
    });

    this.container.querySelector('#btn-numpad-next')?.addEventListener('click', () => {
      if (this.onNextPlayer) this.onNextPlayer();
    });

    // 1-Tap Speed Darts & Miss Button
    this.container.querySelectorAll('.speed-dart-btn, .btn-action-miss').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = Number(btn.dataset.num);
        const mult = Number(btn.dataset.mult);
        const score = Number(btn.dataset.score);
        let label = btn.dataset.label;
        if (label.includes('Bull')) label = 'Bull';
        if (label.includes('25')) label = '25';

        if (this.onDartSubmit) {
          this.onDartSubmit({ number: num, mult, score, label });
        }
        this.resetInput();
      });
    });

    // Digit buttons (0-9)
    this.container.querySelectorAll('.numpad-digit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = btn.dataset.digit;
        this.handleDigit(digit);
      });
    });

    // Backspace button
    this.container.querySelector('#btn-numpad-backspace')?.addEventListener('click', () => {
      this.handleBackspace();
    });

    // Multiplier toggles (Double / Treble)
    this.container.querySelectorAll('.numpad-mod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mult = Number(btn.dataset.mult);
        this.toggleMultiplier(mult);
      });
    });

    // Enter submit button
    this.container.querySelector('#btn-numpad-enter')?.addEventListener('click', () => {
      this.handleEnter();
    });
  }

  handleDigit(digit) {
    let nextVal = this.buffer + digit;
    const num = parseInt(nextVal, 10);

    // Limit to valid numbers 1-20 or 25
    if (num > 25 || (num > 20 && num !== 25)) {
      // If user typed e.g. 3 then 5, replace
      if (parseInt(digit, 10) <= 20) {
        nextVal = digit;
      } else {
        return;
      }
    }

    this.buffer = nextVal;
    this.updateDisplay();
    this.applyHighlights();
  }

  handleBackspace() {
    if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1);
      this.updateDisplay();
      this.applyHighlights();
    }
  }

  toggleMultiplier(mult) {
    if (this.currentMultiplier === mult) {
      this.currentMultiplier = 1; // Toggle off back to Single
    } else {
      this.currentMultiplier = mult;
    }

    this.container.querySelectorAll('.numpad-mod-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.mult) === this.currentMultiplier);
    });

    this.updateDisplay();
    this.applyHighlights();
  }

  handleEnter() {
    const num = parseInt(this.buffer, 10);
    if (isNaN(num) || num < 0 || (num > 20 && num !== 25)) {
      return;
    }

    const mult = this.currentMultiplier;
    const score = num * mult;
    let label;

    if (num === 25) {
      label = mult === 2 ? 'Bull' : '25';
    } else {
      const prefix = mult === 3 ? 'T' : (mult === 2 ? 'D' : 'S');
      label = `${prefix}${num}`;
    }

    if (this.onDartSubmit) {
      this.onDartSubmit({ number: num, mult, score, label });
    }

    this.resetInput();
  }

  resetInput() {
    this.buffer = '';
    this.currentMultiplier = 1;
    this.container.querySelectorAll('.numpad-mod-btn').forEach(btn => btn.classList.remove('active'));
    this.updateDisplay();
    this.applyHighlights();
  }

  updateDisplay() {
    const displayVal = this.container.querySelector('#numpad-display-val');
    const displayPts = this.container.querySelector('#numpad-display-pts');
    if (!displayVal || !displayPts) return;

    if (!this.buffer) {
      const multPrefix = this.currentMultiplier === 3 ? 'Treble ' : (this.currentMultiplier === 2 ? 'Double ' : '');
      displayVal.textContent = multPrefix ? `${multPrefix}—` : '—';
      displayPts.textContent = '0 pts';
      return;
    }

    const num = parseInt(this.buffer, 10);
    const mult = this.currentMultiplier;
    const score = num * mult;
    const prefix = mult === 3 ? 'T' : (mult === 2 ? 'D' : 'S');
    const label = num === 25 ? (mult === 2 ? 'Bull (50)' : 'Outer 25') : `${prefix}${num}`;

    displayVal.textContent = label;
    displayPts.textContent = `${score} pts`;
  }

  setHighlights({ targets = [], avoids = [] } = {}) {
    this.currentHighlights = { targets, avoids };
    this.applyHighlights();
  }

  applyHighlights() {
    this.clearHighlights();
    if (!this.currentHighlights) return;

    const { targets = [], avoids = [] } = this.currentHighlights;

    targets.forEach(t => {
      let num = null;
      let reqMult = null;

      if (typeof t === 'number') {
        num = t;
      } else if (typeof t === 'string') {
        const clean = t.trim().toUpperCase();
        if (clean.startsWith('D')) {
          reqMult = 2;
          num = parseInt(clean.slice(1), 10);
        } else if (clean.startsWith('T')) {
          reqMult = 3;
          num = parseInt(clean.slice(1), 10);
        } else if (clean.startsWith('S')) {
          reqMult = 1;
          num = parseInt(clean.slice(1), 10);
        } else if (clean === 'BULL' || clean === '50') {
          num = 25;
          reqMult = 2;
        } else if (clean === '25' || clean === 'OUTER') {
          num = 25;
          reqMult = 1;
        } else {
          num = parseInt(clean, 10);
        }
      }

      // If a double/treble modifier is required, highlight the modifier on the right rail!
      if (reqMult === 2 && this.currentMultiplier !== 2) {
        this.container.querySelector('#btn-numpad-double')?.classList.add('keypad-target-active');
      }
      if (reqMult === 3 && this.currentMultiplier !== 3) {
        this.container.querySelector('#btn-numpad-treble')?.classList.add('keypad-target-active');
      }

      // If the current buffer matches the target, highlight Enter!
      if (!isNaN(num) && num !== null) {
        const bufferedNum = parseInt(this.buffer, 10);
        if (bufferedNum === num && (reqMult === null || reqMult === this.currentMultiplier)) {
          this.container.querySelector('#btn-numpad-enter')?.classList.add('keypad-target-active');
        }
      }

      // 1-Tap speed shortcuts check
      if (t === 'Bull' || num === 25) {
        if (reqMult === 2 || reqMult === null) {
          this.container.querySelector('.btn-quick-bull')?.classList.add('keypad-target-active');
        }
        if (reqMult === 1 || reqMult === null) {
          this.container.querySelector('.btn-quick-outer')?.classList.add('keypad-target-active');
        }
      }
      if (num === 20 && (reqMult === 3 || reqMult === null)) {
        this.container.querySelector('.btn-quick-t20')?.classList.add('keypad-target-active');
      }
    });

    avoids.forEach(a => {
      let num = null;
      if (typeof a === 'number') {
        num = a;
      } else if (typeof a === 'string') {
        num = parseInt(a.replace(/^[STD]/i, ''), 10);
      }

      if (!isNaN(num) && num !== null) {
        const bufferedNum = parseInt(this.buffer, 10);
        if (bufferedNum === num) {
          this.container.querySelector('#btn-numpad-enter')?.classList.add('keypad-target-avoid');
        }
      }
    });
  }

  clearHighlights() {
    this.container.querySelectorAll('.keypad-target-active, .keypad-target-avoid').forEach(el => {
      el.classList.remove('keypad-target-active', 'keypad-target-avoid');
    });
  }
}
