# Contributing to BullSheet 🎯

Thanks for your interest in contributing to **BullSheet**!

BullSheet is a lightweight, zero-dependency, client-side darts scoreboard and party game app built with vanilla web technologies.

---

## 🛠️ Philosophy & Design Constraints

1. **Zero Runtime Dependencies**: No npm packages, frameworks, bundlers, or build steps. Pure Vanilla ES6 JavaScript, HTML5, and CSS3.
2. **Offline-First (PWA)**: All game engines, stats, audio calls, and rules must run entirely in the client without external backend servers.
3. **Privacy First**: All player rosters, statistics, and history remain local in `localStorage`. No telemetry or tracking.
4. **Mobile-First & Oche-Optimized**: High-contrast UI with large hit targets for phones in portrait mode and tablets in landscape.

---

## 📂 Project Architecture

```
bull-sheet/
├── index.html                  # Single-page app markup & views
├── manifest.json               # Progressive Web App manifest
├── sw.js                       # Service Worker & offline caching
├── CHANGELOG.md                # Single source of truth for release notes
├── CONTRIBUTING.md             # Contributor guide & testing docs
├── package.json                # Project & dev dependencies
├── eslint.config.js            # ESLint static analysis configuration
├── playwright.config.js        # Playwright E2E browser test configuration
├── dev_server.js               # Zero-dependency static HTTP dev server
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
    ├── unit/                   # Native Node.js unit tests (0 dependencies)
    └── e2e/                    # Playwright automated browser tests
```

---

## 🚀 Getting Started

### Clone & Serve
Because there is no build step, you can serve the directory with any static HTTP server:

```bash
git clone https://github.com/zyu-wok/bull-sheet.git
cd bull-sheet

# Start dev server
npm start
```
Open `http://localhost:8080/` in your browser.

---

## 🧪 Testing & Development Environment

BullSheet uses Node.js built-in **`node:test`** runner for unit tests and **Playwright** for E2E browser testing.

### Run Linter
```bash
npm run lint

# Or run with auto-fix
npm run lint:fix
```

### Run Tests
```bash
# Run only unit tests
npm run test:unit

# Run only headless browser E2E tests
npm run test:e2e

# Run all tests
npm test
```

### Test Suite Organization

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

## ➕ Adding a New Game Engine

All game engines are modular ES6 classes in `js/games/`.
Standard boilerplate for a new game engine:

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
