# 🎯🐂 BullSheet

<div align="center">

<h3>Because pub math is total bull-sheet.</h3>

<p>
  <strong>A 100% Free, Zero-Ad, Touch-Optimized Darts Scoreboard & Party Game PWA.</strong><br>
  Built for iPads, tablets, mobile phones, and laptops with zero dependencies.
</p>

[![Live Web App](https://img.shields.io/badge/Play_Live-GitHub_Pages-f59e0b?style=for-the-badge&logo=dart&logoColor=white)](https://zyu-wok.github.io/bull-sheet/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE)
[![Offline PWA](https://img.shields.io/badge/PWA-100%25_Offline-10b981?style=for-the-badge&logo=pwa&logoColor=white)](manifest.json)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero_Pure_JS-purple?style=for-the-badge)](#-architecture--tech-stack)

</div>

---

## 📖 Overview

**BullSheet** is a modern, client-side darts companion designed to eliminate arguments over bad pub math, paywalled scoring apps, and cluttered interfaces. Built from the ground up for responsive touchscreens (iPad and mobile), it operates completely offline as a Progressive Web App (PWA) with zero ads, zero trackers, and zero subscriptions.

---

## ✨ Features at a Glance

### 🎯 1. Dual Tactile Input Modes
- **⚡ Pro Speed Dart Keypad**:
  - **1-Tap Direct Scoring**: Giant dedicated keys for the most common scoring darts (`T20`, `T19`, `T18`, `T17`, `BULL 50`, `25`, and a prominent high-visibility `MISS 0` button).
  - **1-Tap Common Finish Doubles**: Direct access to `D20`, `D16`, `D10`, `D8`, `D4`, `D2`.
  - **1–20 Number Grid**: Instant single entry with double and treble multiplier modifiers.
- **🎨 Interactive SVG Dartboard**:
  - Precision touch segments with animated hit pin ripples and dynamic score registration.
  - Scaled up to **580px** with responsive portrait/landscape adaptation and a dedicated top Miss button.
  - **Precision Multi-Stage Checkout Route Lighting**: Illuminates the exact next segment in **pulsing neon gold** and subsequent finish steps in **dashed cyan guide rings**.

---

### 🎮 2. Nine Complete Game Modes

| Game Mode | Players | Objective | Key Mechanics |
| :--- | :---: | :--- | :--- |
| **501 / X01** | 1–8 | Reduce score from 501, 301, 701, or 101 to 0 | Straight/Double In, Double/Single/Master Out, Sets & Legs, PDC Checkout Routes. |
| **Cricket & Cutthroat** | 1–8 | Close 15–20 & Bull before opponents | Standard Cricket (points to scorer) & Cutthroat (penalties to open friends). Live MPR tracking. |
| **Split Score (Halve-It)** | 1–8 | Hit target in each round or score is halved | 🎲 Random Shuffle (Default), 📜 Classic Sequence, or ✏️ Custom Sequence Builder. |
| **Highscore** | 1–8 | Maximize total points in 5, 7, or 10 rounds | No bust rules; pure scoring power drill. |
| **Shooter** | 1–8 | Quick-draw accuracy target drill | Randomized target assigned each round with accuracy scoring. |
| **Killer** | 2–8 | Qualify via Double and hunt friends' lives | Phase 1 (Qualify) ➔ Phase 2 (Hunting). Friendly fire penalty. |
| **Elimination (Knockout)** | 2–8 | Beat the previous player's score or lose a life | Dynamic "Score to Beat" pressure gauntlet. Last survivor wins. |
| **Shanghai** | 1–8 | Score on sequential numbers 1–7 (or 1–20) | **Instant Shanghai Win**: Hit Single + Double + Treble in 1 visit for immediate victory! |
| **Around the Clock** | 1–8 | Race around numbers 1 to 20 + Bullseye | Doubles leap 2 numbers ahead; Trebles leap 3 numbers ahead. |

---

### 🤖 3. Game-Mode-Aware AI Bot Engine

AI bots feature distinct playstyles and tactical decision-making engines rather than just static scoring averages:

* 🤡 **The Bullshitter** *(Beginner)*: Casual novice with high miss rate (35%), erratic drift, and panic on pressure darts.
* 🍺 **Pub Regular Dave** *(Casual)*: Steady pub thrower with dependable single scoring and relaxed rhythm.
* 📊 **Clinical Accountant** *(Tactician)*: Disciplined match competitor; calculates defensive risk in Cutthroat and Halve-It.
* 🎯 **Oche Master Jack** *(Semi-Pro)*: Heavy treble power, aggressive target hunting in Killer, and lethal double checkouts.
* 👑 **The 180 Machine** *(Master)*: World-class precision and near-flawless accuracy across all game modes.

---

### 🛡️ 4. Zero Data Loss & Universal Deep Undo
- **Universal Multi-Stage Undo**: Every single game engine features full snapshot undo history (`↶ UNDO`) to effortlessly roll back any misplaced dart or turn.
- **Persistent State Auto-Recovery**: Every dart throw and score update is synchronized in real time to `localStorage`. If you refresh or close your browser, an instant **"🔄 In-Progress Match Available"** recovery banner lets you resume with 1 tap.
- **Exit Protection**: Confirmation modal prevents accidental score loss when navigating during an active match.

---

### 👥 5. Saved Friends & Permanent Lineup Roster
- Save your regular dart buddies permanently so you never have to re-type their names.
- Quick-add chips allow assembling match lineups with 1 tap.
- Supports any mix of human and bot players up to 8 players.

---

### 🔊 6. Procedural Audio & Voice Caller
- **Procedural Web Audio**: Real-time synthesized dart thuds, bullseye gongs, bust buzzers, and 180 fanfare chords without external MP3 dependencies.
- **Offline Voice Caller**: Uses the device's native Speech Synthesis API to announce turn totals, game shots, and playful pub excuses.

---

### 🎨 7. Theme Customization
- 🐂 **BullSheet Pub Chalkboard** *(Authentic dark chalkboard with brass accents)*
- 📊 **Corporate Excel Parody** *(Disguised spreadsheet mode for lunchtime darts)*
- ⚡ **PDC Broadcast Arena** *(Electric neon cyan & purple)*
- 🌑 **OLED Midnight** *(Pure minimalist high-contrast black)*

---

## 📱 Installation (Offline PWA)

BullSheet is a Progressive Web App that runs 100% offline.

### 🍏 iPad / iPhone (Safari)
1. Open [`https://zyu-wok.github.io/bull-sheet/`](https://zyu-wok.github.io/bull-sheet/) in Safari.
2. Tap the **Share button** (square with an upward arrow).
3. Tap **"Add to Home Screen"**.

### 🤖 Android / Google Chrome
1. Open the URL in Chrome.
2. Tap the three-dot menu $\rightarrow$ tap **"Install App"** or **"Add to Home screen"**.

---

## 🛠️ Architecture & Tech Stack

```
bull-sheet/
├── index.html                  # Semantic, accessible HTML5 single-page application
├── manifest.json               # Progressive Web App manifest
├── sw.js                       # Network-first Service Worker with auto-purging offline cache
├── css/
│   ├── main.css                # Core layout, pro speed keypad, and responsive styles
│   ├── themes.css              # Theme definitions (Chalkboard, Excel, Arena, OLED)
│   └── animations.css          # Hit ripples, pulse effects, and celebration confetti
├── js/
│   ├── app.js                  # Master application state and navigation controller
│   ├── audio/
│   │   ├── sound_effects.js    # Procedural Web Audio API sound synthesizer
│   │   └── caller.js           # Web Speech API voice referee & announcer
│   ├── bot/
│   │   └── bot_engine.js       # Game-mode-aware AI bot simulator
│   ├── components/
│   │   ├── checkout.js         # Complete PDC 170-down-to-2 finish matrix
│   │   ├── dartboard.js        # Interactive SVG dartboard with precision route lighting
│   │   ├── dart_keypad.js      # 1-Tap Pro Speed tactile keypad
│   │   ├── scoreboard.js       # Scoreboard renderers for all 9 game modes
│   │   └── rules_modal.js      # Comprehensive tutorial and rules reference
│   ├── games/
│   │   ├── x01.js              # 501/301/701/101 engine
│   │   ├── cricket.js          # Standard & Cutthroat Cricket engine
│   │   ├── split_score.js      # Halve-It engine with custom sequence builder
│   │   ├── highscore.js        # Highscore round-based engine
│   │   ├── shooter.js          # Target drill engine
│   │   ├── killer.js           # Killer party game engine
│   │   ├── elimination.js      # Knockout elimination engine
│   │   ├── shanghai.js         # Shanghai & instant win engine
│   │   └── around_clock.js     # Around the Clock leap engine
│   └── storage/
│       └── stats_store.js      # LocalStorage persistent roster, history, and state manager
├── test_verification.py        # Automated structural & regression test suite
└── test_all_game_mechanics.py  # Exhaustive game mechanics and round-limit test suite
```

---

## 🧪 Automated Testing

BullSheet includes automated Python test suites to verify game mechanics, win conditions, round clampings, and asset integrity:

```bash
# Run structural verification
python3 test_verification.py

# Run comprehensive game mechanics & round termination tests
python3 test_all_game_mechanics.py
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** — free, open-source, and anti-paywall forever.
