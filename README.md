# 🐂🎯 BullSheet

> *Because pub math is total bull-sheet.*

A darts scoreboard web app that runs in your browser. No ads, no accounts, no install required. Works offline once loaded.

Designed to run on a phone or tablet at the oche. Or honestly, a laptop on the kitchen table.

Vibe-coded in an evening, because every other darts app insists on showing you endless 30-second ads with an "x" button harder to find than Waldo — all before you can subtract 60 (or in my case, 26) from 501. */rant*


---

## What It Does

### 10 Game Modes

| Mode | What It Is |
| :--- | :--- |
| **X01** | 501 / 301 / 701 / 101 with configurable In/Out rules (Straight In, Double Out, etc.), Legs & Sets |
| **Cricket** | Standard and Cutthroat, with marks-per-round tracking |
| **Split Score** | Halve-It — miss your target, lose half your score |
| **Killer** | Party game: claim a double, gain killer status, hunt opponents' lives |
| **Elimination** | Beat the previous player's 3-dart total or lose a life |
| **Shanghai** | Sequential rounds, instant win if you hit single + double + treble in one turn |
| **Around the Clock** | Race from 1 → 20 → Bull, with double/treble jumps |
| **Bob's 27** | The classic doubles training drill (start at 27, hit your doubles or lose points) |
| **Highscore** | Fixed-round scoring practice (5, 7, or 10 rounds) |
| **Shooter** | Random target accuracy drill |

### Two Input Methods
- **Pro Speed Keypad** — Quick-tap buttons for common scores (20, 1, 5, T20, Bull, 25, Miss) with multiplier toggles (Double, Treble). Fast enough for real match play.
- **Interactive SVG Dartboard** — Tap directly on the board. Highlights checkout routes during X01 finishes.

Toggle between them mid-game with the 🎯 button.

### Caller Voice Packs
Three pre-recorded audio caller packs with score announcements:
- **Russ Bray** ("The Voice")
- **George Noble**
- **British Pub Referee**

Volume control and mute toggle in settings.

### AI Opponents
Five bot difficulty profiles for solo practice:

| Bot | Skill | Vibe |
| :--- | :--- | :--- |
| 🤡 Beginner | Shaky aim, lots of misses | Your mate who's "never played before" |
| 🍺 Casual | Solid singles, occasional trebles | Pub league regular |
| 📊 Tactician | Calculated, low miss rate | Plays the percentages |
| 🎯 Semi-Pro | Heavy treble scoring | County-level |
| 👑 Master | Near-flawless | Not fun to play against |

### Other Stuff
- **Saved player roster** — Add regulars, tap to add them to the lineup
- **Match history** — Local match log with 3-dart averages, 180 counts, and high turns
- **Throw heatmap** — Radial visualization of where your darts actually landed
- **Match card export** — Generates a shareable PNG summary of the match
- **History import/export** — Backup and restore match data as JSON
- **Pub excuse generator** — Random excuses for when you hit single 1 instead of treble 20
- **Rules reference** — Built-in rules popup for each game mode
- **Checkout suggestions** — PDC checkout route lookup for X01 finishes (170 down to 2)
- **Multi-step undo** — Works across all game modes
- **4 color themes** — Pub Chalkboard (default), Excel Sheet, PDC Arena (neon), OLED Midnight

### Offline & Privacy
- Installable as a PWA (Add to Home Screen)
- Everything stored in `localStorage` — no data leaves the browser
- Works without internet after first load (Service Worker cache)

---

## Tech Stack

Vanilla ES6+ JavaScript, HTML5, CSS3. Zero runtime frameworks, zero runtime dependencies.

Audio is handled through the Web Audio API and pre-recorded MP3 caller packs. The dartboard is pure SVG with coordinate-based hit detection.

---

## Running Locally

Serve it instantly with the included zero-dependency Node.js server:

```bash
# Start local dev server (http://localhost:8080)
npm start
# or: node dev_server.js
```

Then open `http://localhost:8080/`.

---

## Testing & Quality

BullSheet uses Node.js native `node:test` runner for unit tests and **Playwright** for automated browser testing:

```bash
# Run the complete test suite (Unit + E2E)
npm test

# Run only zero-dependency unit tests (runs in ~0.2s)
npm run test:unit

# Run headless browser E2E tests
npm run test:e2e

# Run code style & static analysis linter
npm run lint
```

---

## Project Layout

```
bull-sheet/
├── index.html              # Single-page app markup
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline cache)
├── CHANGELOG.md             # Release notes
├── CONTRIBUTING.md          # Contributor guide & test docs
├── package.json             # Dev scripts & tooling configuration
├── eslint.config.js         # ESLint configuration
├── playwright.config.js     # Playwright E2E browser test configuration
├── dev_server.js            # Zero-dependency static HTTP dev server
├── css/
│   ├── main.css             # Layout and components
│   ├── themes.css           # Color themes
│   └── animations.css       # Transitions
├── js/
│   ├── app.js               # Main app controller
│   ├── audio/               # Caller voice system + sound effects
│   ├── bot/                 # AI opponent engine
│   ├── components/          # Dartboard, Keypad, Scoreboard, Heatmap, etc.
│   ├── games/               # 10 game engine modules
│   └── storage/             # localStorage persistence
├── audio/                   # Pre-recorded caller MP3 packs
│   ├── russ_bray/
│   ├── george_noble/
│   └── british_ref/
└── tests/
    ├── unit/                # Native Node.js unit tests (X01, Cricket, Party games, Bots, Stats, Integrity)
    └── e2e/                 # Playwright automated browser tests
```

---

## License

[GPL-3.0](LICENSE)
