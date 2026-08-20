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
    await expect(page.locator('.nav-tab-btn[data-target="view-settings"]')).toBeVisible();
    await expect(page.locator('.nav-tab-btn[data-target="view-changelog"]')).toBeVisible();
  });

  test('02: start match and transition to active game scoreboard view', async ({ page }) => {
    await page.goto('/');

    // Click Start Match
    const startBtn = page.locator('#btn-start-match');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify game view is active
    const gameView = page.locator('#view-game');
    await expect(gameView).toHaveClass(/active/);

    // Verify scoreboard container and control buttons exist
    await expect(page.locator('#scoreboard-container')).toBeVisible();
    await expect(page.locator('#btn-rules-game')).toBeVisible();
    await expect(page.locator('#btn-end-game')).toBeVisible();
  });

  test('03: throw 3 darts via keypad, verify score updates, and exit match dialog', async ({ page }) => {
    await page.goto('/');

    // Start match
    await page.locator('#btn-start-match').click();
    await expect(page.locator('#view-game')).toHaveClass(/active/);

    // Throw 3x 20 via dart keypad
    const btn20 = page.locator('.num-btn:has-text("20"), .keypad-btn:has-text("20"), button:has-text("20")').first();
    await expect(btn20).toBeVisible();
    await btn20.click();
    await btn20.click();
    await btn20.click();

    // Open exit confirmation dialog and confirm forfeit
    await page.locator('#btn-end-game').click();
    const confirmModal = page.locator('#modal-confirm-exit');
    await expect(confirmModal).toHaveClass(/active/);

    await page.locator('#btn-confirm-leave').click();
    await expect(page.locator('#view-setup')).toHaveClass(/active/);
  });

  test('04: navigation tabs switch between Settings and Changelog views', async ({ page }) => {
    await page.goto('/');

    // Switch to Settings tab
    await page.locator('.nav-tab-btn[data-target="view-settings"]').click();
    await expect(page.locator('#view-settings')).toHaveClass(/active/);

    // Switch to Changelog tab
    await page.locator('.nav-tab-btn[data-target="view-changelog"]').click();
    await expect(page.locator('#view-changelog')).toHaveClass(/active/);
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

    // Throw single 20 via speed bar (score must remain locked at 501)
    const btnSpeed20 = page.locator('.speed-dart-btn.btn-quick-s20');
    await btnSpeed20.click();
    await expect(heroScore).toContainText('501');

    // Switch to Double multiplier (x2) and click 20 on number grid -> D20
    const btnMult2 = page.locator('.mult-btn[data-mult="2"]').first();
    const btnGrid20 = page.locator('.dart-num-btn[data-num="20"]');
    await btnMult2.click();
    await btnGrid20.click();

    // Score now unlocked from 501 - 40 = 461
    await expect(heroScore).toContainText('461');
  });
});
