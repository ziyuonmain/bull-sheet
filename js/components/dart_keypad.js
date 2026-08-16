// Pro Speed Dart Keypad Component for BullSheet with Right-Half Unified Action Controls
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
        nextBtn.innerHTML = `<span>➔ NEXT PLAYER (${this.nextPlayerName})</span>`;
      } else {
        nextBtn.classList.add('hidden-action');
        nextBtn.classList.remove('active-pulse');
      }
    }
  }

  render() {
    const quickTriples = [
      { label: 'T20', num: 20, mult: 3, score: 60, cls: 'btn-quick-t20' },
      { label: 'T19', num: 19, mult: 3, score: 57, cls: 'btn-quick-t19' },
      { label: 'T18', num: 18, mult: 3, score: 54, cls: 'btn-quick-treble' },
      { label: 'T17', num: 17, mult: 3, score: 51, cls: 'btn-quick-treble' },
      { label: 'BULL', num: 25, mult: 2, score: 50, cls: 'btn-quick-bull' },
      { label: '25', num: 25, mult: 1, score: 25, cls: 'btn-quick-outer' }
    ];

    const quickDoubles = [
      { label: 'D20', num: 20, mult: 2, score: 40 },
      { label: 'D16', num: 16, mult: 2, score: 32 },
      { label: 'D10', num: 10, mult: 2, score: 20 },
      { label: 'D8', num: 8, mult: 2, score: 16 },
      { label: 'D4', num: 4, mult: 2, score: 8 },
      { label: 'D2', num: 2, mult: 2, score: 4 }
    ];

    const numbers = [
      20, 19, 18, 17, 16,
      15, 14, 13, 12, 11,
      10, 9, 8, 7, 6,
      5, 4, 3, 2, 1
    ];

    let html = `
      <div class="pro-dart-keypad">
        
        <!-- 1. Right-Half Primary Action Bar (UNDO • MISS • NEXT PLAYER) -->
        <div class="right-actions-top-bar">
          <button class="btn-panel-action btn-action-undo" type="button" id="btn-keypad-undo" title="Undo Last Dart">
            <span>↶ UNDO</span>
          </button>
          <button class="btn-panel-action btn-action-miss" type="button" data-num="0" data-mult="0" data-score="0" data-label="Miss" title="Record Miss (0 pts)">
            <span>❌ MISS (0)</span>
          </button>
          <button class="btn-panel-action btn-action-next hidden-action" type="button" id="btn-keypad-next" title="Advance Turn">
            <span>➔ NEXT PLAYER</span>
          </button>
        </div>

        <!-- 2. 1-Tap Speed Bar -->
        <div class="speed-bar-header">
          <span class="speed-bar-label">⚡ 1-TAP INSTANT SCORING</span>
        </div>

        <div class="speed-darts-grid">
          ${quickTriples.map(d => `
            <button class="speed-dart-btn ${d.cls}" type="button" data-num="${d.num}" data-mult="${d.mult}" data-score="${d.score}" data-label="${d.label}">
              <span class="speed-lbl">${d.label}</span>
              <span class="speed-pts">${d.score}</span>
            </button>
          `).join('')}
        </div>

        <!-- 3. Fast Checkout Doubles Row -->
        <div class="quick-doubles-row">
          <span class="quick-doubles-label">DOUBLES:</span>
          <div class="quick-doubles-chips">
            ${quickDoubles.map(d => `
              <button class="quick-double-btn" type="button" data-num="${d.num}" data-mult="${d.mult}" data-score="${d.score}" data-label="${d.label}">
                ${d.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 4. Multiplier Modifier Bar -->
        <div class="dart-multiplier-bar">
          <button class="mult-btn ${this.currentMultiplier === 1 ? 'active' : ''}" type="button" data-mult="1">Single (1x)</button>
          <button class="mult-btn ${this.currentMultiplier === 2 ? 'active' : ''}" type="button" data-mult="2">Double (2x)</button>
          <button class="mult-btn ${this.currentMultiplier === 3 ? 'active' : ''}" type="button" data-mult="3">Treble (3x)</button>
        </div>

        <!-- 5. Main Number Grid (1 to 20) -->
        <div class="dart-numbers-grid">
          ${numbers.map(n => `
            <button class="dart-num-btn" type="button" data-num="${n}">
              ${n}
            </button>
          `).join('')}
        </div>

      </div>
    `;

    this.container.innerHTML = html;
  }

  attachEvents() {
    // Top Right Action Buttons: Undo & Next Player
    this.container.querySelector('#btn-keypad-undo')?.addEventListener('click', () => {
      if (this.onUndo) this.onUndo();
    });

    this.container.querySelector('#btn-keypad-next')?.addEventListener('click', () => {
      if (this.onNextPlayer) this.onNextPlayer();
    });

    // 1-Tap Speed Darts & Miss Button
    this.container.querySelectorAll('.speed-dart-btn, .quick-double-btn, .btn-action-miss').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = Number(btn.dataset.num);
        const mult = Number(btn.dataset.mult);
        const score = Number(btn.dataset.score);
        const label = btn.dataset.label;

        if (this.onDartSubmit) {
          this.onDartSubmit({ number: num, mult, score, label });
        }
      });
    });

    // Multiplier Toggle Selection
    this.container.querySelectorAll('.mult-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentMultiplier = Number(btn.dataset.mult);
        this.container.querySelectorAll('.mult-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
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

        // Auto-reset multiplier back to Single (1x)
        this.currentMultiplier = 1;
        this.container.querySelectorAll('.mult-btn').forEach(b => {
          b.classList.toggle('active', Number(b.dataset.mult) === 1);
        });
      });
    });
  }
}
