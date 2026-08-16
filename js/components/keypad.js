// High-Contrast Touch-Optimized Keypad Component for iPad
export class Keypad {
  constructor(containerEl, onSubmitCallback, onUndoCallback) {
    this.container = containerEl;
    this.onSubmit = onSubmitCallback;
    this.onUndo = onUndoCallback;
    this.currentValue = '';
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="keypad-wrapper">
        <!-- Display & Multiplier Bar -->
        <div class="keypad-top-bar">
          <div class="keypad-input-display" id="keypad-display">
            <span class="keypad-placeholder">Enter turn score...</span>
          </div>
          <button class="keypad-btn btn-undo" id="btn-keypad-undo" title="Undo Last Dart / Turn" aria-label="Undo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
            <span>Undo</span>
          </button>
        </div>

        <!-- Quick Pub Score Presets -->
        <div class="keypad-presets-row">
          <button class="preset-btn" data-preset="26">26 <small>(BS)</small></button>
          <button class="preset-btn" data-preset="41">41</button>
          <button class="preset-btn" data-preset="45">45</button>
          <button class="preset-btn" data-preset="60">60</button>
          <button class="preset-btn" data-preset="85">85</button>
          <button class="preset-btn" data-preset="100">100</button>
          <button class="preset-btn" data-preset="140">140</button>
          <button class="preset-btn preset-180" data-preset="180">180! 🔥</button>
        </div>

        <!-- Main Number Pad Grid -->
        <div class="keypad-grid">
          <button class="num-btn" data-num="1">1</button>
          <button class="num-btn" data-num="2">2</button>
          <button class="num-btn" data-num="3">3</button>
          <button class="num-btn" data-num="4">4</button>
          <button class="num-btn" data-num="5">5</button>
          <button class="num-btn" data-num="6">6</button>
          <button class="num-btn" data-num="7">7</button>
          <button class="num-btn" data-num="8">8</button>
          <button class="num-btn" data-num="9">9</button>
          <button class="num-btn btn-clear" id="btn-keypad-clear" data-action="clear">CLR</button>
          <button class="num-btn" data-num="0">0</button>
          <button class="num-btn btn-enter" id="btn-keypad-enter" data-action="enter">ENTER ↵</button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const displayEl = this.container.querySelector('#keypad-display');

    const updateDisplay = () => {
      if (this.currentValue === '') {
        displayEl.innerHTML = '<span class="keypad-placeholder">Enter turn score...</span>';
      } else {
        displayEl.textContent = this.currentValue;
      }
    };

    // Number clicks
    this.container.querySelectorAll('.num-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const num = btn.dataset.num;
        if (this.currentValue.length < 3) {
          const nextVal = parseInt(this.currentValue + num, 10);
          if (nextVal <= 180) {
            this.currentValue += num;
            updateDisplay();
          }
        }
      });
    });

    // Preset clicks
    this.container.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const score = parseInt(btn.dataset.preset, 10);
        this.currentValue = '';
        updateDisplay();
        if (this.onSubmit) {
          this.onSubmit(score);
        }
      });
    });

    // Clear
    this.container.querySelector('#btn-keypad-clear').addEventListener('click', (e) => {
      e.preventDefault();
      this.currentValue = '';
      updateDisplay();
    });

    // Enter
    this.container.querySelector('#btn-keypad-enter').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentValue !== '') {
        const score = parseInt(this.currentValue, 10);
        this.currentValue = '';
        updateDisplay();
        if (this.onSubmit) {
          this.onSubmit(score);
        }
      }
    });

    // Undo
    this.container.querySelector('#btn-keypad-undo').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentValue !== '') {
        this.currentValue = this.currentValue.slice(0, -1);
        updateDisplay();
      } else if (this.onUndo) {
        this.onUndo();
      }
    });
  }

  reset() {
    this.currentValue = '';
    const displayEl = this.container.querySelector('#keypad-display');
    if (displayEl) displayEl.innerHTML = '<span class="keypad-placeholder">Enter turn score...</span>';
  }
}
