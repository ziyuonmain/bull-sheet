// Pro Speed Dart Keypad Component for BullSheet with High-Visibility MISS Button
export class DartKeypad {
  constructor(containerEl, onDartSubmitCallback, onUndoCallback, onNextPlayerCallback) {
    this.container = containerEl;
    this.onDartSubmit = onDartSubmitCallback;
    this.onUndo = onUndoCallback;
    this.onNextPlayer = onNextPlayerCallback;
    this.currentMultiplier = 1; // 1 = Single, 2 = Double, 3 = Treble
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
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
        
        <!-- 1. Top 1-Tap Speed Bar with High-Visibility MISS Button -->
        <div class="speed-bar-header">
          <span class="speed-bar-label">⚡ 1-TAP INSTANT SCORING</span>
          <button class="btn-prominent-miss" type="button" data-num="0" data-mult="0" data-score="0" data-label="Miss">
            <span class="prominent-miss-icon">❌</span>
            <span class="prominent-miss-text">MISS (0)</span>
          </button>
        </div>

        <div class="speed-darts-grid">
          ${quickTriples.map(d => `
            <button class="speed-dart-btn ${d.cls}" type="button" data-num="${d.num}" data-mult="${d.mult}" data-score="${d.score}" data-label="${d.label}">
              <span class="speed-lbl">${d.label}</span>
              <span class="speed-pts">${d.score}</span>
            </button>
          `).join('')}
        </div>

        <!-- 2. Fast Checkout Doubles Row -->
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

        <!-- 3. Multiplier Modifier Bar -->
        <div class="dart-multiplier-bar">
          <button class="mult-btn ${this.currentMultiplier === 1 ? 'active' : ''}" type="button" data-mult="1">Single (1x)</button>
          <button class="mult-btn ${this.currentMultiplier === 2 ? 'active' : ''}" type="button" data-mult="2">Double (2x)</button>
          <button class="mult-btn ${this.currentMultiplier === 3 ? 'active' : ''}" type="button" data-mult="3">Treble (3x)</button>
        </div>

        <!-- 4. Main Number Grid (1 to 20) -->
        <div class="dart-numbers-grid">
          ${numbers.map(n => `
            <button class="dart-num-btn" type="button" data-num="${n}">
              ${n}
            </button>
          `).join('')}
        </div>

        <!-- 5. Bottom Controls (Undo & Optional Finish Turn) -->
        <div class="dart-keypad-bottom">
          <button class="btn-keypad-undo" type="button" id="btn-dart-keypad-undo">↶ Undo Dart</button>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
  }

  attachEvents() {
    // Direct 1-Tap Speed Darts & Prominent Miss Button
    this.container.querySelectorAll('.speed-dart-btn, .quick-double-btn, .btn-prominent-miss').forEach(btn => {
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

        // Auto-reset multiplier back to Single (1x) after throwing
        this.currentMultiplier = 1;
        this.container.querySelectorAll('.mult-btn').forEach(b => {
          b.classList.toggle('active', Number(b.dataset.mult) === 1);
        });
      });
    });

    // Undo button
    this.container.querySelector('#btn-dart-keypad-undo')?.addEventListener('click', () => {
      if (this.onUndo) this.onUndo();
    });
  }
}
