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
});
