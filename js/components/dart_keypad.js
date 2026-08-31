// Pro Speed Dart Keypad Component for BullSheet (Beginner-Friendly & Tournament-Fast)

export class DartKeypad {
  constructor(containerEl, onDartSubmitCallback, onUndoCallback, onNextPlayerCallback) {
    this.container = containerEl;
    this.onDartSubmit = onDartSubmitCallback;
    this.onUndo = onUndoCallback;
    this.onNextPlayer = onNextPlayerCallback;
    this.currentMultiplier = 1; // 1 = Single, 2 = Double, 3 = Treble
    this.isVisitComplete = false;
    this.nextPlayerName = '';
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  updateState(game) {
    if (!game) return;
    this.isVisitComplete = game.turnDarts && game.turnDarts.length >= 3 && !game.isMatchOver;
    const nextP = game.getNextPlayer ? game.getNextPlayer() : null;
    this.nextPlayerName = nextP ? nextP.name : '';

    const nextBtn = this.container.querySelector('#btn-keypad-next');
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

  setMultiplier(mult) {
    this.currentMultiplier = mult;
    
    // Update Multiplier button styles
    this.container.querySelectorAll('.mult-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.mult) === mult);
    });

    // Dynamically update the main number grid buttons with live math preview
    this.updateNumberGridLabels();

    // Re-apply target highlighting according to active multiplier
    this.applyHighlights();
  }

  updateNumberGridLabels() {
    const mult = this.currentMultiplier;
    const prefix = mult === 3 ? 'T' : (mult === 2 ? 'D' : '');

    this.container.querySelectorAll('.dart-num-btn').forEach(btn => {
      const num = Number(btn.dataset.num);

      if (mult === 1) {
        btn.innerHTML = `
          <span class="num-main">${num}</span>
        `;
        btn.className = `dart-num-btn ${num >= 18 ? 'top-target' : ''}`;
      } else {
        btn.innerHTML = `
          <span class="num-main">${prefix}${num}</span>
        `;
        btn.className = `dart-num-btn ${num >= 18 ? 'top-target' : ''} mult-active-${mult}`;
      }
    });
  }

  render() {
    // 1-Tap Speed Bar (Frequent Pub Neighbors & Power Shots)
    const quickDarts = [
      { label: '20', num: 20, mult: 1, score: 20, badge: 'S20', cls: 'btn-quick-s20' },
      { label: '1', num: 1, mult: 1, score: 1, badge: 'S1', cls: 'btn-quick-s1' },
      { label: '5', num: 5, mult: 1, score: 5, badge: 'S5', cls: 'btn-quick-s5' },
      { label: 'T20', num: 20, mult: 3, score: 60, badge: '60', cls: 'btn-quick-t20' },
      { label: '🔴 Bull', num: 25, mult: 2, score: 50, badge: '50', cls: 'btn-quick-bull' },
      { label: '🟢 25', num: 25, mult: 1, score: 25, badge: '25', cls: 'btn-quick-outer' }
    ];

    const numbers = [
      20, 19, 18, 17, 16,
      15, 14, 13, 12, 11,
      10, 9, 8, 7, 6,
      5, 4, 3, 2, 1
    ];

    let html = `
      <div class="pro-dart-keypad">
        
        <!-- 1. 1-Tap Quick Common Darts & Bulls -->
        <div class="speed-darts-grid">
          ${quickDarts.map(d => `
            <button class="speed-dart-btn ${d.cls}" type="button" data-num="${d.num}" data-mult="${d.mult}" data-score="${d.score}" data-label="${d.label}">
              <span class="speed-lbl">${d.label}</span>
              <span class="speed-pts">${d.badge} pts</span>
            </button>
          `).join('')}
        </div>

        <!-- 2. Multiplier Modifier Bar -->
        <div class="dart-multiplier-bar">
          <button class="mult-btn ${this.currentMultiplier === 1 ? 'active' : ''}" type="button" data-mult="1">Single (1x)</button>
          <button class="mult-btn ${this.currentMultiplier === 2 ? 'active' : ''}" type="button" data-mult="2">Double (2x)</button>
          <button class="mult-btn ${this.currentMultiplier === 3 ? 'active' : ''}" type="button" data-mult="3">Treble (3x)</button>
        </div>

        <!-- 3. Main Number Grid (1 to 20) with Live Point Preview -->
        <div class="dart-numbers-grid">
          ${numbers.map(n => `
            <button class="dart-num-btn ${n >= 18 ? 'top-target' : ''}" type="button" data-num="${n}">
              <span class="num-main">${n}</span>
            </button>
          `).join('')}
        </div>

        <!-- 4. Primary Action Bar (UNDO • MISS • END TURN) at BOTTOM -->
        <div class="right-actions-bottom-bar" style="margin-top: 12px;">
          <button class="btn-panel-action btn-action-undo" type="button" id="btn-keypad-undo" title="Undo Last Dart">
            <span>↶ UNDO</span>
          </button>
          <button class="btn-panel-action btn-action-miss" type="button" data-num="0" data-mult="0" data-score="0" data-label="Miss" title="Record Miss (0 pts)">
            <span>❌ MISS</span>
          </button>
          <button class="btn-panel-action btn-action-next hidden-action" type="button" id="btn-keypad-next" title="End Turn">
            <span>End Turn ➔</span>
          </button>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
  }

  attachEvents() {
    // Action Buttons: Undo & Next Player
    this.container.querySelector('#btn-keypad-undo')?.addEventListener('click', () => {
      if (this.onUndo) this.onUndo();
    });

    this.container.querySelector('#btn-keypad-next')?.addEventListener('click', () => {
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
      });
    });

    // Multiplier Toggle Selection
    this.container.querySelectorAll('.mult-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mult = Number(btn.dataset.mult);
        this.setMultiplier(mult);
      });
    });

    // Number Grid (1–20)
    this.container.querySelectorAll('.dart-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = Number(btn.dataset.num);
        const mult = this.currentMultiplier;
        const score = num * mult;
        const prefix = mult === 3 ? 'T' : (mult === 2 ? 'D' : 'S');
        const label = `${prefix}${num}`;

        if (this.onDartSubmit) {
          this.onDartSubmit({ number: num, mult, score, label });
        }

        // Auto-reset multiplier back to Single (1x) after throw
        if (this.currentMultiplier !== 1) {
          this.setMultiplier(1);
        }
      });
    });
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
      } else if (t && typeof t === 'object') {
        num = t.num !== undefined ? t.num : t.value;
        reqMult = t.mult !== undefined ? t.mult : null;
      }

      if (!isNaN(num) && num !== null) {
        if (reqMult === null || reqMult === this.currentMultiplier) {
          this.container.querySelectorAll(`.dart-num-btn[data-num="${num}"]`).forEach(btn => {
            btn.classList.add('keypad-target-active');
          });
        }
      }

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
      } else if (a && typeof a === 'object') {
        num = a.num !== undefined ? a.num : a.value;
      }

      if (!isNaN(num) && num !== null) {
        this.container.querySelectorAll(`.dart-num-btn[data-num="${num}"]`).forEach(btn => {
          btn.classList.add('keypad-target-avoid');
        });
      }
    });
  }

  clearHighlights() {
    this.container.querySelectorAll('.keypad-target-active, .keypad-target-avoid').forEach(el => {
      el.classList.remove('keypad-target-active', 'keypad-target-avoid');
    });
  }
}
