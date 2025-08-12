import { test, expect } from '@playwright/test';

test.describe('MTG Investment App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads homepage correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/MTG Investment/);
    await expect(page.locator('h1')).toContainText('MTG Investment Tracker');
  });

  test('displays admin tools panel', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-tools-panel"]')).toBeVisible();
  });

  test('can upload CSV file', async ({ page }) => {
    // Create a test CSV file
    const csvContent = 'Name,Price\nLightning Bolt,5.00\nCounterspell,3.50';
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click();
    const fileChooser = await fileChooserPromise;
    
    // Upload the test file
    await fileChooser.setFiles({
      name: 'test-cards.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for processing to complete
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-grid"]')).toBeVisible();
    
    // Verify cards were loaded
    await expect(page.locator('text=Lightning Bolt')).toBeVisible();
    await expect(page.locator('text=Counterspell')).toBeVisible();
  });

  test('can filter cards by name', async ({ page }) => {
    // Assume some cards are already loaded
    await page.fill('[data-testid="search-input"]', 'Lightning');
    
    // Verify filtering works
    await expect(page.locator('text=Lightning Bolt')).toBeVisible();
    await expect(page.locator('text=Counterspell')).not.toBeVisible();
  });

  test('can filter cards by price range', async ({ page }) => {
    await page.fill('[data-testid="min-price-input"]', '5');
    await page.fill('[data-testid="max-price-input"]', '10');
    
    // Verify price filtering
    await expect(page.locator('[data-testid="total-value"]')).toContainText('$');
  });

  test('admin tools work correctly', async ({ page }) => {
    // Test MTGJSON check
    await page.click('[data-testid="check-mtgjson-btn"]');
    await expect(page.locator('[data-testid="file-status"]')).toBeVisible();
    
    // Test price history download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-price-history-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('price-history');
  });
});