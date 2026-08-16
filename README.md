# BullSheet

> *Because pub math is total bull-sheet.*

A lightweight, zero-dependency, client-side darts scoreboard and party game PWA written in vanilla ES6 JavaScript, HTML5, and CSS3. Built as a personal hobby project for running on a wall-mounted tablet or phone at the oche.

---

## Technical Overview

BullSheet is a static single-page application with no build steps, external frameworks, or server-side dependencies.

- **Stack**: Vanilla ES6 JavaScript, HTML5, CSS3.
- **Offline / PWA**: Installable PWA with a network-first Service Worker (`sw.js`).
- **Audio**: Procedural synthesizer using the Web Audio API (`AudioContext`) and voice referee calls via the Web Speech API (`SpeechSynthesis`).
- **State & Recovery**: Snapshot-based history for multi-step undo (`↶ UNDO`) and automatic session persistence via `localStorage`.
- **Input Modes**:
  - **Pro Speed Keypad**: Direct 1-tap buttons for common scoring segments (`T20`, `T19`, `Bull`, `25`, `Miss`, finish doubles) and multiplier modifiers.
  - **SVG Dartboard**: Interactive vector dartboard with segment hit detection and dynamic checkout route lighting.

---

## Game Engines

Game logic is implemented as modular classes in `js/games/`:

- **`x01.js`**: Standard PDC 501 / 301 / 701 / 101 with Straight/Double In, Double/Single/Master Out, Sets & Legs, and PDC checkout route lookups.
- **`cricket.js`**: Standard and Cutthroat variants with live MPR (Marks Per Round) tracking.
- **`split_score.js`**: Halve-It mode with Random, Classic, or Custom target sequences.
- **`killer.js`**: 2–8 player party game with Double qualification and life hunting.
- **`elimination.js`**: Knockout challenge to beat the preceding player's 3-dart score.
- **`shanghai.js`**: Sequential rounds with instant Shanghai win detection (Single + Double + Treble in one turn).
- **`around_clock.js`**: 1 to 20 + Bullseye race with Double (2x) and Treble (3x) leaps.
- **`highscore.js`**: Fixed-round scoring drill (5, 7, or 10 rounds).
- **`shooter.js`**: Random target accuracy practice.

---

## AI Bot Simulation

The bot engine (`js/bot/bot_engine.js`) simulates opponents using game-mode-specific decision logic across 5 evenly-spaced difficulty tiers:

| Profile | Tier | Treble | Double | Miss | Tactical IQ |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **The Bullshitter 🤡** | *Beginner* | 2% | 8% | 35% | 15% |
| **Pub Regular Dave 🍺** | *Casual* | 15% | 25% | 15% | 40% |
| **Clinical Accountant 📊** | *Tactician* | 35% | 45% | 5% | 70% |
| **Oche Master Jack 🎯** | *Semi-Pro* | 58% | 68% | 2% | 90% |
| **The 180 Machine 👑** | *Master* | 80% | 88% | 1% | 100% |

---

## Project Structure

```
bull-sheet/
├── index.html                  # Main markup
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker & offline cache
├── start_local_dev.sh          # Local dev script
├── css/
│   ├── main.css                # Layout and controls
│   ├── themes.css              # Theme CSS variables
│   └── animations.css          # Visual animations
├── js/
│   ├── app.js                  # App controller & routing
│   ├── audio/                  # Web Audio & Speech synthesis
│   ├── bot/                    # AI bot engine
│   ├── components/             # Dartboard, Keypad, Scoreboard, Checkout
│   ├── games/                  # 9 game engines
│   └── storage/                # LocalStorage management
└── tests/                      # Python unittest test suite
    ├── test_verification.py    # Structural integrity & asset checks
    ├── test_game_mechanics.py  # Game rules & scoring tests
    └── test_turn_flow.py       # Pacing & visit advancement tests
```

---

## Development & Testing

### Running Locally
Serve the directory with any static HTTP server:

```bash
# Using the helper script
./start_local_dev.sh

# Or directly with Python
python3 -m http.server 8080
```

### Running Tests
Automated tests use Python's standard `unittest` framework:

```bash
python3 -m unittest discover tests -v
```

---

## License

Licensed under the [GNU General Public License v3.0 (GPL-3.0)](LICENSE).
