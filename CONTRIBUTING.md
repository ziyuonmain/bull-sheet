# Contributing to BullSheet 🎯

Thanks for your interest in contributing to **BullSheet**!

BullSheet is a lightweight, zero-dependency, client-side darts scoreboard and party game app built with vanilla web technologies.

---

## 🛠️ Philosophy & Design Constraints

1. **Zero Runtime Dependencies**: No npm packages, frameworks, bundlers, or build steps. Pure Vanilla ES6 JavaScript, HTML5, and CSS3.
2. **Offline-First (PWA)**: All game engines, stats, audio calls, and rules must run entirely in the client without external backend servers.
3. **Privacy First**: All player rosters, statistics, and history remain local in `localStorage`. No telemetry or tracking.
4. **Mobile-First & Oche-Optimized**: High-contrast UI with large hit targets for phones in portrait mode and wall-mounted tablets in landscape.

---

## 🚀 Getting Started

### 1. Clone & Serve
Because there is no build step, you can serve the directory with any static HTTP server:

```bash
git clone https://github.com/zyu-wok/bull-sheet.git
cd bull-sheet

# Option A: Helper script (runs tests then starts dev server)
./start_local_dev.sh

# Option B: Python dev server
python3 dev_server.py 8080

# Option C: Python built-in server
python3 -m http.server 8080
```
Open `http://localhost:8080/` in your browser.

---

## 🧪 Testing & Development Environment

BullSheet uses Node.js built-in **`node:test`** runner for zero-dependency unit tests and **Playwright** for automated E2E browser testing.

### 1. Run All Tests
```bash
# Run the complete test suite (Unit + E2E)
npm test
```

### 2. Run Specific Test Suites
```bash
# Run only unit tests (zero external dependencies, runs instantly)
npm run test:unit
# or: node --test tests/unit/**/*.test.js

# Run only headless browser E2E tests
npm run test:e2e
# or: npx playwright test

# Run code style & static analysis linter
npm run lint
```

### 3. Test Suite Organization (`tests/`)

```
tests/
├── unit/
│   ├── x01.test.js            # X01 scoring, Double In/Out, Sets & Legs, busts, and undo
│   ├── cricket.test.js        # Standard & Cutthroat Cricket, 3-mark closures, MPR
│   ├── party_games.test.js    # Killer, Elimination, Shanghai, Around the Clock, Bob's 27
│   ├── bot_engine.test.js     # 5 bot difficulty profiles, accuracy scaling, dart simulation
│   ├── checkout.test.js       # Complete 170-to-2 checkout paths & bogey number detection
│   ├── stats_store.test.js    # LocalStorage persistence, lifetime stats, JSON import/export
│   ├── changelog.test.js      # CHANGELOG.md markdown structure & parser verification
│   └── integrity.test.js      # Static assets (audio/icons) & Service Worker cache validation
└── e2e/
    └── e2e.test.js            # Playwright headless browser E2E flow tests
```

When adding new game modes or components, please add corresponding unit tests in `tests/`.

---

## 📂 Project Architecture

```
bull-sheet/
├── index.html                  # Single-page app markup & views
├── manifest.json               # Progressive Web App manifest
├── sw.js                       # Service Worker & offline caching
├── CHANGELOG.md                # Single source of truth for release notes
├── pyproject.toml               # Python project & dev dependencies (Selenium)
├── css/
│   ├── main.css                # Layout, components, and responsive styles
│   ├── themes.css              # Theme CSS variables (Pub Chalkboard, OLED, etc.)
│   └── animations.css          # Subtle UI transitions
├── js/
│   ├── app.js                  # Main controller and route switcher
│   ├── audio/                  # Audio caller and procedural sound synthesizer
│   ├── bot/                    # Tactical AI engine and skill profiles
│   ├── components/             # Dartboard, Keypad, Scoreboard, Heatmap, Match Card
│   ├── games/                  # Modular game engines (10 modes)
│   └── storage/                # LocalStorage management and import/export
└── tests/
    ├── unit/                   # Unit test suite
    └── e2e/                    # E2E & browser test suite
```

---

## ➕ Adding a New Game Engine

All game engines are modular ES6 classes in `js/games/` implementing a standard interface:

```javascript
export class CustomGame {
  constructor(config = {}) {
    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({ ... }));
    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  getActivePlayer() { return this.players[this.activePlayerIdx]; }
  getNextPlayer() { ... }
  recordDart(dart) { ... }
  finishTurn() { ... }
  undo() { ... }
}
```

---

## 📝 Commit & Pull Request Guidelines

- **Conventional Commits**: Format commit messages using standard prefixes:
  - `feat:` New features or game modes
  - `fix:` Bug fixes
  - `style:` Formatting, UI/CSS alignment, visual tweaks
  - `docs:` Documentation and changelog updates
  - `test:` Adding or updating test cases
  - `chore:` Maintenance, git hygiene, tooling
- **Release Notes**: When adding a user-facing change, update [`CHANGELOG.md`](CHANGELOG.md). The in-app changelog viewer automatically renders changes directly from this file!

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
