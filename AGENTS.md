# BullSheet Developer & Agent Guidelines

BullSheet is a zero-dependency, offline-first client-side browser darts scoreboard, party game suite, and voice caller application built with vanilla web technologies.

---

## Core architectural principles

- **Zero runtime dependencies**: BullSheet has **zero** runtime dependencies and zero build step. All runtime logic is pure ES6 modules and native Web APIs. Never install npm runtime packages into `dependencies`. Node.js packages belong exclusively in `devDependencies` for testing and linting.
- **Service worker cache synchronization**: Whenever you add, rename, or delete any JS, CSS, audio, or icon asset, you **must** update `ASSETS_TO_CACHE` in `sw.js`. Always verify cache integrity using `npm run test:unit`.
- **Dynamic changelog integrity**: `CHANGELOG.md` is loaded and rendered dynamically at runtime by `js/components/changelog_loader.js`. Always use standard Keep-a-Changelog headings (`#### Added`, `#### Changed`, `#### Fixed`, `#### Removed`).
- **Oche mobile ergonomics**: BullSheet is designed for touchscreens at the oche (darts throw line). Touch targets must be at least 44px by 44px. Prevent horizontal scrolling on mobile portrait (<768px). All visual elements must support all 4 themes in `css/themes.css` (Pub Chalkboard, Excel Sheet, PDC Arena, OLED Midnight).
- **Modular game engine contract**: Every game engine in `js/games/` is an ES6 class maintaining an internal undo stack and implementing standard methods: `recordDart(dart)`, `finishTurn()`, `undo()`, `getActivePlayer()`, `isMatchOver`, and `winner`.

---

## Testing & quality assurance

Always validate changes with the relevant test scripts before completing a task:

```bash
# Run linter
npm run lint

# Run unit & integrity test suite
npm run test:unit

# Run headless browser E2E test suite
npm run test:e2e

# Run full test suite
npm test
```

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
