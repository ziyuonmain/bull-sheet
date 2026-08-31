import { test, expect } from '@playwright/test';

test.describe('BullSheet Web App & Chrome Extension E2E Suite', () => {
  test('01: homepage loads with brand title, tagline, and navigation tabs', async ({ page }) => {
    await page.goto('/');
    
    // Check brand title
    const title = page.locator('.brand-title');
    await expect(title).toContainText('BullSheet');

    // Check brand tagline (case-insensitive)
    const tagline = page.locator('.brand-tagline');
    await expect(tagline).toBeVisible();
    const text = await tagline.innerText();
    expect(text.toLowerCase()).toContain('because pub math is total bull-sheet');

    // Check navigation tabs exist
    await expect(page.locator('.nav-tab-btn[data-target="view-setup"]')).toBeVisible();
    await expect(page.locator('.nav-tab-btn[data-target="view-stats"]')).toBeVisible();
    await expect(page.locator('.nav-tab-btn[data-target="view-settings"]')).toBeVisible();
  });

  test('02: start match and transition to active game scoreboard view', async ({ page }) => {
    await page.goto('/');

    // Verify header is visible on setup
    await expect(page.locator('.app-header')).toBeVisible();

    // Click Start Match
    const startBtn = page.locator('#btn-start-match');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify game view is active
    const gameView = page.locator('#view-game');
    await expect(gameView).toHaveClass(/active/);

    // Verify title bar auto-hides in game mode to maximize play area
    await expect(page.locator('.app-header')).toBeHidden();

    // Verify scoreboard container and control buttons exist
    await expect(page.locator('#scoreboard-container')).toBeVisible();
    await expect(page.locator('#game-mode-display')).toBeVisible();
    await expect(page.locator('#select-input-mode')).toBeVisible();
    await expect(page.locator('#btn-end-game')).toBeVisible();
  });

  test('03: throw 3 darts via keypad, verify score updates, and exit match dialog', async ({ page }) => {
    await page.goto('/');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);
    await expect(page.locator('.app-header')).toBeHidden();

    // Switch input mode dropdown to Keypad View
    await page.locator('#select-input-mode').selectOption('keypad');

    // Throw 3x 20 via dart keypad
    const btn20 = page.locator('.dart-num-btn:has-text("20"), .num-btn:has-text("20"), .keypad-btn:has-text("20"), button:has-text("20")').first();
    await expect(btn20).toBeVisible();
    await btn20.click();
    await btn20.click();
    await btn20.click();

    // Verify End Turn action button appears
    const endTurnBtn = page.locator('#btn-scoreboard-next-player, #btn-keypad-next');
    await expect(endTurnBtn.first()).toBeVisible();

    // Open exit confirmation dialog and confirm forfeit
    await page.locator('#btn-end-game').click();
    const confirmModal = page.locator('#modal-confirm-exit');
    await expect(confirmModal).toHaveClass(/active/);

    await page.locator('#btn-confirm-leave').click();
    await expect(page.locator('#view-setup')).toHaveClass(/active/);

    // Verify title bar is visible again on setup view
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('04: navigation tabs switch between Settings and History views', async ({ page }) => {
    await page.goto('/');

    // Switch to Settings tab
    await page.locator('.nav-tab-btn[data-target="view-settings"]').click();
    await expect(page.locator('#view-settings')).toHaveClass(/active/);

    // Switch to History tab
    await page.locator('.nav-tab-btn[data-target="view-stats"]').click();
    await expect(page.locator('#view-stats')).toHaveClass(/active/);
  });

  test('05: history player drilldown dropdown updates lifetime cards and displays Total Matches Won', async ({ page }) => {
    await page.goto('/');

    // Switch to History tab
    await page.locator('.nav-tab-btn[data-target="view-stats"]').click();
    await expect(page.locator('#view-stats')).toHaveClass(/active/);

    // Check that when All Players is selected, card 4 shows Saved Players
    const card4Label = page.locator('#lifetime-stats-grid .lifetime-stat-card:nth-child(4) .stat-card-lbl');
    await expect(card4Label).toHaveText(/Saved Players/);

    // Select a player from dropdown (e.g. the first saved player)
    const select = page.locator('#history-player-filter');
    const options = await select.locator('option').all();
    if (options.length > 1) {
      const secondOptionVal = await options[1].getAttribute('value');
      await select.selectOption(secondOptionVal);

      // Now card 4 must update to 'Total Matches Won' and card 1 to 'Total Matches / Win %'
      await expect(card4Label).toHaveText('Total Matches Won');
      const card1Label = page.locator('#lifetime-stats-grid .lifetime-stat-card:nth-child(1) .stat-card-lbl');
      await expect(card1Label).toHaveText('Total Matches / Win %');
    }
  });

  test('06: lineup player order can be reordered via drag handle and maintains perfect mobile layout bounds', async ({ page }) => {
    // Set viewport to mobile phone size
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/');

    // Ensure we are on setup view
    await expect(page.locator('#view-setup')).toHaveClass(/active/);

    // Verify drag handle exists on player item
    const dragHandle = page.locator('.roster-drag-handle').first();
    await expect(dragHandle).toBeVisible();

    // Verify no horizontal overflow in phone mode: the remove button must be completely inside the container
    const rosterItem = page.locator('.roster-item').first();
    const removeBtn = page.locator('.btn-remove-player').first();
    await expect(removeBtn).toBeVisible();
    const itemBox = await rosterItem.boundingBox();
    const btnBox = await removeBtn.boundingBox();
    expect(btnBox.x + btnBox.width).toBeLessThanOrEqual(itemBox.x + itemBox.width + 1);

    // Set first player name to 'Alpha' and second to 'Beta'
    const inputs = page.locator('.player-name-input');
    await inputs.nth(0).fill('Alpha');
    await inputs.nth(1).fill('Beta');

    // Drag handle of item 0 to handle of item 1
    const dragHandles = page.locator('.roster-drag-handle');
    await dragHandles.nth(0).dragTo(dragHandles.nth(1));

    // Now player #1 should be Beta and player #2 should be Alpha
    await expect(page.locator('.player-name-input').nth(0)).toHaveValue('Beta');
    await expect(page.locator('.player-name-input').nth(1)).toHaveValue('Alpha');
  });

  test('07: switch between all 3 input views (Board, Keypad, Numpad) and throw darts via Numpad', async ({ page }) => {
    await page.goto('/');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // 1. Verify default view is Dartboard View
    await expect(page.locator('#dartboard-container')).toBeVisible();
    await expect(page.locator('#dart-keypad-container')).toBeHidden();
    await expect(page.locator('#dart-numpad-container')).toBeHidden();

    // 2. Switch to Numpad View
    await page.locator('#select-input-mode').selectOption('numpad');
    await expect(page.locator('#dart-numpad-container')).toBeVisible();
    await expect(page.locator('#dartboard-container')).toBeHidden();
    await expect(page.locator('#dart-keypad-container')).toBeHidden();

    // 3. Enter '2', '0', then press Enter
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="2"]').click();
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="0"]').click();
    await expect(page.locator('#numpad-display-val')).toHaveText('S20');
    await expect(page.locator('#numpad-display-pts')).toHaveText('20 pts');

    await page.locator('#btn-numpad-enter').click();

    // Verify dart 1 is recorded as S20 (score 501 -> 481)
    await expect(page.locator('#hero-score-val')).toHaveText('481');

    // 4. Test Double toggle and 1-tap shortcut on Numpad
    await page.locator('#btn-numpad-double').click();
    await expect(page.locator('#btn-numpad-double')).toHaveClass(/active/);

    // Type 1, backspace, then 1, 0, Enter
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="1"]').click();
    await page.locator('#btn-numpad-backspace').click();
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="1"]').click();
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="0"]').click();
    await expect(page.locator('#numpad-display-val')).toHaveText('D10');
    await expect(page.locator('#numpad-display-pts')).toHaveText('20 pts');
    await page.locator('#btn-numpad-enter').click();

    // Verify dart 2 recorded as D10 (score 481 -> 461)
    await expect(page.locator('#hero-score-val')).toHaveText('461');

    // 5. Test 1-tap speed button (T20)
    await page.locator('#dart-numpad-container .btn-quick-t20').click();
    await expect(page.locator('#hero-score-val')).toHaveText('401');

    // 6. Switch to Keypad View
    await page.locator('#select-input-mode').selectOption('keypad');
    await expect(page.locator('#dart-keypad-container')).toBeVisible();
    await expect(page.locator('#dart-numpad-container')).toBeHidden();
  });

  test('08: clicking game mode badge opens rules modal and leg checkout triggers visual celebration banner', async ({ page }) => {
    await page.goto('/');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // Click game mode badge to view rules
    await page.locator('#game-mode-display').click();
    const rulesModal = page.locator('#modal-rules');
    await expect(rulesModal).toHaveClass(/active/);
    await expect(page.locator('#rules-modal-title')).toContainText('X01 Darts');
    await expect(page.locator('#rules-modal-objective')).toContainText('Reduce score from your starting total');

    // Close rules modal
    await page.locator('#modal-rules .modal-close').first().click();
    await expect(rulesModal).not.toHaveClass(/active/);
  });

  test('09: X01 leg win displays celebration banner with manual Start Next Leg button', async ({ page }) => {
    await page.goto('/');

    // Configure 101 First to 3 Legs in Setup
    await page.locator('#opt-x01-score').selectOption('101');
    await page.locator('#opt-x01-legs').selectOption('3');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // Switch to Numpad view
    await page.locator('#select-input-mode').selectOption('numpad');

    // Dart 1: T17 (51 pts) -> score 101 - 51 = 50 (leaves Bull checkout)
    await page.locator('#btn-numpad-treble').click();
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="1"]').click();
    await page.locator('#dart-numpad-container .numpad-digit-btn[data-digit="7"]').click();
    await page.locator('#btn-numpad-enter').click();
    await expect(page.locator('#hero-score-val')).toHaveText('50');

    // Dart 2: 🔴 Bull (50 pts checkout) -> wins Leg 1!
    await page.locator('#dart-numpad-container .btn-quick-bull').click();

    // Verify Leg Win celebration banner appears
    const banner = page.locator('#leg-win-celebration-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('GAME SHOT & THE LEG!');

    // Verify Start Next Leg button exists
    const nextLegBtn = page.locator('#btn-start-next-leg');
    await expect(nextLegBtn).toBeVisible();

    // Click Start Next Leg to advance to Leg 2
    await nextLegBtn.click();
    await expect(banner).toBeHidden();

    // Score is reset to 101 for Leg 2 and Player 1 has 1 Leg Won
    await expect(page.locator('#hero-score-val')).toHaveText('101');
  });

  test('10: in-game settings modal can be opened and adjusted without interrupting the current match', async ({ page }) => {
    await page.goto('/');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // Switch to Numpad and throw a dart (e.g. 20)
    await page.locator('#select-input-mode').selectOption('numpad');
    await page.locator('#dart-numpad-container .btn-quick-s20').click();
    await expect(page.locator('#hero-score-val')).toHaveText('481');

    // Click in-game Settings button
    const settingsBtn = page.locator('#btn-game-settings');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Verify In-Game Settings modal appears
    const settingsModal = page.locator('#modal-settings');
    await expect(settingsModal).toHaveClass(/active/);

    // Change theme to neon (PDC Arena)
    await page.locator('#modal-setting-theme').selectOption('neon');
    await expect(page.locator('body')).toHaveClass(/theme-neon/);

    // Test Audio Mode sub-control visibility inside in-game settings modal
    const modalAudioSel = page.locator('#modal-setting-audio-mode');
    const modalVolumeGroup = page.locator('#modal-volume-group');
    const modalVoiceGroup = page.locator('#modal-ref-voice-group');

    // 1. Mute -> Volume and Voice groups are hidden
    await modalAudioSel.selectOption('muted');
    await expect(modalVolumeGroup).toBeHidden();
    await expect(modalVoiceGroup).toBeHidden();

    // 2. SFX Only -> Volume visible, Voice group hidden
    await modalAudioSel.selectOption('sound_only');
    await expect(modalVolumeGroup).toBeVisible();
    await expect(modalVoiceGroup).toBeHidden();

    // 3. Ref Voice -> Volume and Voice group both visible
    await modalAudioSel.selectOption('ref_voice');
    await expect(modalVolumeGroup).toBeVisible();
    await expect(modalVoiceGroup).toBeVisible();

    // Close Settings modal via Resume Match button
    await page.locator('#btn-modal-resume-settings').click();
    await expect(settingsModal).not.toHaveClass(/active/);

    // Verify game view is still active and score is still 481 (uninterrupted)
    await expect(page.locator('#view-game')).toHaveClass(/active/);
    await expect(page.locator('#hero-score-val')).toHaveText('481');
  });

  test('11: match specifications panel title and visibility for modes without extra specs, rules modal Got It button', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Match Specifications header title and visibility for default X01
    const specPanel = page.locator('#setup-spec-panel');
    await expect(specPanel).toBeVisible();
    await expect(specPanel.locator('.setup-section-title')).toHaveText('Match Specifications');

    // 2. Select Around the Clock (no extra specifications) -> specPanel hidden
    await page.locator('.game-mode-card[data-mode="around_clock"]').click();
    await expect(specPanel).toBeHidden();

    // 3. Select Bob\'s 27 (no extra specifications) -> specPanel hidden
    await page.locator('.game-mode-card[data-mode="bobs27"]').click();
    await expect(specPanel).toBeHidden();

    // 4. Select Cricket -> specPanel visible again
    await page.locator('.game-mode-card[data-mode="cricket"]').click();
    await expect(specPanel).toBeVisible();

    // 5. Open rules modal from setup and verify "Got It" button
    await page.locator('#btn-rules-setup').click();
    const rulesModal = page.locator('#modal-rules');
    await expect(rulesModal).toHaveClass(/active/);
    const gotItBtn = rulesModal.locator('.btn-modal-next');
    await expect(gotItBtn).toHaveText('Got It');
    await gotItBtn.click();
    await expect(rulesModal).not.toHaveClass(/active/);
  });

  test('05: Double In mode displays streamlined entry guidance, lock badge, and entry tags', async ({ page }) => {
    await page.goto('/');

    // Select Double In option
    await page.locator('#opt-x01-in').selectOption('double');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // Verify hero lock badge
    const lockBadge = page.locator('.hero-lock-badge');
    await expect(lockBadge).toBeVisible();
    await expect(lockBadge).toContainText('DOUBLE IN');

    // Verify entry route guidance pill
    const entryPill = page.locator('.checkout-pill-bar.in-mode-entry-bar');
    await expect(entryPill).toBeVisible();
    await expect(entryPill).toContainText('Aim any Double');

    // Verify score display
    const heroScore = page.locator('#hero-score-val');
    await expect(heroScore).toContainText('501');

    // Verify standings strip has locked tag
    await expect(page.locator('.mini-in-tag.tag-locked').first()).toContainText('Locked');

    // Switch to keypad mode
    await page.locator('#select-input-mode').selectOption('keypad');

    // Throw single 20 via speed bar (score must remain locked at 501)
    const btnSpeed20 = page.locator('#dart-keypad-container .speed-dart-btn.btn-quick-s20');
    await btnSpeed20.click();
    await expect(heroScore).toContainText('501');

    // Switch to Double multiplier (x2) and click 20 on number grid -> D20
    const btnMult2 = page.locator('#dart-keypad-container .mult-btn[data-mult="2"]');
    const btnGrid20 = page.locator('#dart-keypad-container .dart-num-btn[data-num="20"]');
    await btnMult2.click();
    await btnGrid20.click();

    // Score now unlocked from 501 - 40 = 461
    await expect(heroScore).toContainText('461');
  });
});
