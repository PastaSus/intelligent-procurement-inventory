import { test, expect } from '@playwright/test';

test.describe('Spare parts inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/inventory');
  });

  test('displays seeded inventory items', async ({ page }) => {
    await expect(page.getByText('KB-LOGI-K120')).toBeVisible();
    await expect(page.getByText('MS-LOGI-M90')).toBeVisible();
    await expect(page.getByText('RAM-DDR3-8GB')).toBeVisible();
  });

  test('shows stock status badges', async ({ page }) => {
    await expect(page.getByText('OK').first()).toBeVisible();
  });

  test('filters by component type', async ({ page }) => {
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.click();
    await page.getByRole('option', { name: 'KEYBOARD' }).click();
    await expect(page.getByText('KB-LOGI-K120')).toBeVisible();
    await expect(page.getByText('MS-LOGI-M90')).not.toBeVisible();
  });

  test('opens add part form', async ({ page }) => {
    await page.getByRole('button', { name: /add part/i }).click();
    await expect(page.getByText('Add Spare Part')).toBeVisible();
  });
});
