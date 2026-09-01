
- **Zero Runtime Dependencies**: BullSheet has **zero** runtime dependencies and zero build step. All runtime logic is pure ES6 modules and native Web APIs.
- **Package Management**: Never install npm runtime packages into `dependencies`. Node.js packages belong exclusively in `devDependencies` for testing (`@playwright/test`, `eslint`, `@eslint/js`) and linting.
- **Vanilla ES6 Modules**: Use standard `import` / `export` syntax with explicit `.js` file extensions.

---

## 2. Modular Game Engine Contract

All game engines in `js/games/` must inherit or adhere to the standard engine contract:
- `constructor(config)`
- `recordDart(dart)` — returns scoring result object (e.g. `{ score, isBust, isWinner, ... }`)
- `finishTurn()` — advances active player and clears turn darts
- `undo()` — reverts the last dart or action with exact state symmetry
- `getActivePlayer()` — returns the current active player object
- `isMatchOver` (boolean)
- `winner` (player object or null)

### Engine Integrity Requirements:
1. **Undo Symmetry**: `this.history.push(this.serializeState())` must precede any state mutations in `recordDart()` and `finishTurn()`. `undo()` must completely restore scores, player turns, and bust/winner flags.
2. **Elimination & Party Play**: Game engines with player eliminations (e.g. *Killer*, *Elimination*, *Bob's 27*) must skip eliminated players when calculating `getActivePlayer()`, advancing turns in `finishTurn()`, and rolling back via `undo()`.
3. **Stats Metric Isolation**: Non-X01 game modes must never pollute core X01 statistics (such as 3-dart averages or checkout percentages). Party games and drills record isolated mode-specific metrics in `StatsStore`.

---

## 3. Oche Mobile Ergonomics & Multi-Theme System

- **Touch Ergonomics**: All interactive elements (buttons, keypad keys, dartboard sectors) must have minimum touch targets of **44px by 44px**.
- **No Horizontal Scrolling**: Prevent horizontal scrolling on mobile portrait screens (`<768px`).
- **4 Theme Compatibility**: All visual elements must support all 4 themes in `css/themes.css` using CSS custom properties (`var(--...)`):
  1. 🍺 **Pub Chalkboard** (Default pub chalkboard aesthetic)
  2. 📊 **Excel Sheet** (Office spreadsheet stealth theme)
  3. ⚡ **PDC Arena** (High-voltage television stage neon)
  4. 🌑 **OLED Midnight** (True black battery saver)
- **Triple Input Ergonomics**: Ensure seamless switching between the 3 primary input modes:
  - 🎯 **Dartboard View** (Visual SVG dartboard with polar touch/click detection and outline segment highlights)
  - 🔢 **Keypad View** (Quick multipliers `Single`, `Double`, `Treble`, speed bar buttons, and 1-20/Bull grid)
  - ⌨️ **Numpad View** (Fast 3-column numpad for quick single dart entries)

---

## 4. Service Worker & Offline Cache Synchronization

- **Cache Synchronization**: Whenever adding, renaming, or deleting any JS, CSS, audio, or icon asset, you **must** update `ASSETS_TO_CACHE` in `sw.js`.
- **Cache Invalidation**: Increment `CACHE_NAME` (e.g. `bullsheet-cache-v35`) in `sw.js` upon releases.
- **Cache Integrity Verification**: Always verify cache synchronization with `npm run test:unit`.

---

## 5. Dynamic Changelog & Release Workflow

- **Changelog Integrity**: `CHANGELOG.md` is loaded and rendered dynamically at runtime by `js/components/changelog_loader.js`. Always maintain standard Keep-a-Changelog headings (`#### Added`, `#### Changed`, `#### Fixed`, `#### Removed`).
- **Automated CI Tagging & Release**: Never manually create git tags locally. Version increments in `package.json` pushed to `main` trigger GitHub Actions CI to automatically tag `vX.Y.Z`, create the GitHub Release, and deploy to GitHub Pages.
- **Version Synchronizer**: Use `npm run bump [patch|minor|major]` to update version strings across `package.json`, `package-lock.json`, `index.html`, and unit tests.

---

## 6. Merge, Rebase & E2E Testing Hygiene

- **Merge Conflict Resolution**: When resolving merge/rebase conflicts, inspect surrounding context to prevent resurrecting deleted legacy elements (e.g. obsolete nav tabs or duplicate buttons).
- **Playwright Selector Scoping**: When writing or updating Playwright tests in `tests/e2e/e2e.test.js`, always scope selectors to active parent containers (e.g. `#dart-keypad-container .speed-dart-btn`) to avoid strict-mode multi-element collisions between input modes.
- **Pre-Push Validation**: Always execute `npm test && npm run lint` before committing and pushing changes.

---

## Key file locations

- **App controller**: [js/app.js](file:///home/ziyu/Codespace/git-code/bull-sheet/js/app.js)
- **Game engines**: [js/games/](file:///home/ziyu/Codespace/git-code/bull-sheet/js/games/)
- **UI components**: [js/components/](file:///home/ziyu/Codespace/git-code/bull-sheet/js/components/)
- **AI bot simulation**: [js/bot/bot_engine.js](file:///home/ziyu/Codespace/git-code/bull-sheet/js/bot/bot_engine.js)
- **Audio engine & voice caller**: [js/audio/](file:///home/ziyu/Codespace/git-code/bull-sheet/js/audio/)
- **Storage & state persistence**: [js/storage/stats_store.js](file:///home/ziyu/Codespace/git-code/bull-sheet/js/storage/stats_store.js)
- **Styles & themes**: [css/](file:///home/ziyu/Codespace/git-code/bull-sheet/css/)
- **Service worker & PWA**: [sw.js](file:///home/ziyu/Codespace/git-code/bull-sheet/sw.js), [manifest.json](file:///home/ziyu/Codespace/git-code/bull-sheet/manifest.json)
- **Version bumper**: [scripts/bump_version.js](file:///home/ziyu/Codespace/git-code/bull-sheet/scripts/bump_version.js)
