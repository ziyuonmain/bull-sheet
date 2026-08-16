# Changelog

All notable changes to **BullSheet** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.1] - 2026-08-16
### 🧹 UI Cleanup, Navigation Polish & Dynamic Changelog
#### Added
- **📄 Dynamic In-App Changelog Loader**: The in-app release viewer now dynamically loads and parses `CHANGELOG.md` as the single source of truth, removing duplicate HTML markup and keeping release notes seamlessly synchronized offline.

#### Changed
- **Header & Title Streamlining**: Removed redundant promo subbadges (`No Ads • 100% Offline PWA`) and cleaned window title and drawer footer.
- **Navigation Icon Consistency**: Synchronized `📊` History and related navigation icons identically across mobile drawer and desktop tabs.
- **Repository Hygiene**: Untracked compiled `.pyc` / `.venv` cache files and updated `.gitignore`.

---

## [1.4.0] - 2026-08-16
### 📱 Mobile Portrait Overhaul & UI Streamlining
#### Added
- **🍔 Sandwich (Hamburger) Navigation Drawer**:
  - Top header features `🎯🐂 BullSheet` with prominent `v1.4.0` badge and a golden `☰` Menu trigger.
  - Slide-over drawer with quick access to *Play*, *History & Stats*, *Audio & Settings*, *Game Rules*, and *Changelog*.
- **📜 In-App Changelog & Release Notes Viewer**:
  - Interactive changelog modal accessible directly from Header, Setup, Settings, and the Menu drawer.
  - Prominent `v1.4.0` version badges across the application.
- **🛡️ Elimination & Killer Scoreboard Styling**:
  - Glowing Hero Target Banners (`🎯 SCORE TO BEAT`, `🔪 KILLER UNLEASHED`).
  - Dynamic visit status badges (`🔥 Set Target`, `✅ SAFE!`, `⚠️ Need 46+ to survive`).
  - High-contrast player status cards with visual life/shield badges (`🛡️🛡️🛡️`, `❤️❤️❤️`).

#### Changed
- **📐 Pixel-Perfect Card Alignment**:
  - Keypad and Interactive Dartboard share 100% border-to-border outer width alignment with the Standings and Scoreboard cards above.
- **🚫 Zero Horizontal Scrolling in Portrait Mode**:
  - Converted Saved Roster chips, Split Score 9-round timeline, history mode filters, and multiplayer standings into responsive multi-row wrapping grids.
- **🧹 UI Clutter & Redundancy Cleanup**:
  - Replaced bulky checkout banner with a sleek TV-broadcast finish pill (`[ FINISH ]` / `[ SETUP ]`).
  - Removed redundant emoji prefixes and duplicated score indicators across all 10 game modes and dialogs.
- **🎛️ In-Game Controls Toolbar**:
  - Streamlined toolbar into compact, single-line icon buttons (`[ℹ️] [🎯] [🐂] [🎙️ Voice ▾] [✕]`).

---

## [1.3.0] - 2026-08-16
### 📊 Player Analytics, Voice Packs & Saved Rosters
#### Added
- **📊 Lifetime Player Analytics**:
  - Interactive player stats drilldown with 3-dart averages, first-9 averages, checkout efficiency, and high turns.
  - **SVG Dart Throw Heatmaps**: Visual radial density mapping showing player accuracy and cluster patterns.
- **🎙️ Unified Audio & Referee Voice Packs**:
  - Support for *Russ Bray*, *George Noble*, and *British Pub Referee* audio styles.
  - Master volume control slider with live test audio preview.
  - Per-throw callouts and humorous pub banter options.
- **👥 Persistent Saved Player Roster**:
  - Permanent roster storage with one-tap lineup selection chips.
- **📸 Shareable Match PNG Cards**:
  - Client-side Canvas generator for exportable, high-resolution match summary cards.
- **🧪 Comprehensive Test Automation**:
  - Python test suite covering game engines, turn progression, and E2E mechanics.

---

## [1.2.0] - 2026-08-16
### ⚡ Pro Speed Keypad & Visual Route Highlighting
#### Added
- **⚡ Pro Speed Dart Keypad**:
  - 1-Tap Pub Neighbors speed bar for rapid scoring (`20`, `1`, `5`, `T20`, `🔴 Bull 50`, `🟢 25`).
  - Live multiplier math point preview badges on all number buttons (`Double 2x`, `Treble 3x`).
- **🎯 Dual-Color Precision Route Guidance**:
  - Interactive SVG dartboard highlights checkout paths (Primary pulsating gold + secondary cyan guide).
- **⏱️ Turn Flow & Pacing Refinements**:
  - 3rd throw slot retention across all game modes with guaranteed `➔ NEXT PLAYER` visit banner.
  - 4th throw auto-advancement protection to prevent turn blocking.

---

## [1.1.0] - 2026-08-16
### 🎲 Party Games Suite & Tactical Bot AI
#### Added
- **🎮 Expanded 10-Game Collection**:
  - **Party & Pub Games**: *Split Score (Halve-It)*, *Killer*, *Elimination (Knockout)*, *Shanghai*.
  - **Practice Drills**: *Shooter*, *Highscore*, *Around the Clock*, and *Bob's 27* (World standard double training).
- **🤖 Tactical Multi-Tiered Bot AI**:
  - 4 distinct AI personalities: *Pub Casual* (30–40 Avg), *League Regular* (45–60 Avg), *Tournament Pro* (70–85 Avg), and *Ally Pally Master* (95–110 Avg).
  - AI adapts dynamically to standard games, doubles practice, cricket segments, and opponent elimination.
  - Auto-pairing for 1-player solo mode in party games.
- **ℹ️ Dedicated Game Rules & Objectives Modal**:
  - Interactive tutorial overlays explaining the rules and target mechanics for all 10 modes.

---

## [1.0.0] - 2026-08-16
### 🎯 Initial Release: Core Darts PWA
#### Added
- **🎯 Core Dart Scoring Engine**:
  - Standard **501 / X01** with configurable starting scores (301, 501, 701) and out modes (Single Out, Double Out, Master Out).
  - **Cricket** with Standard and Cutthroat modes, real-time Marks Per Round (MPR), and closed segment indicators.
- **🎯 Interactive SVG Dartboard**:
  - High-precision radial coordinate hit detection with tactile click feedback and animated hit ripples.
- **📱 100% Offline Progressive Web App (PWA)**:
  - Zero external dependencies, local browser storage persistence, and Service Worker offline caching.
  - Zero ads, zero paywalls, 100% free open-source software.
