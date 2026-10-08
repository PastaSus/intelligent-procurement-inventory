import { test, expect } from '@playwright/test';

test.describe('Purchase requests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/purchase-requests');
  });

  test('shows empty state when no requests', async ({ page }) => {
    await expect(page.getByText(/no purchase requests found/i)).toBeVisible();
  });

  test('opens create request form', async ({ page }) => {
    await page.getByRole('button', { name: /new request/i }).click();
    await expect(page.getByText('New Purchase Request')).toBeVisible();
    await expect(page.getByPlaceholder('Item name')).toBeVisible();
  });

  test('can create a purchase request with items', async ({ page }) => {
    await page.getByRole('button', { name: /new request/i }).click();
    await expect(page.getByText('New Purchase Request')).toBeVisible();

    await page.getByPlaceholder('Item name').fill('E2E Test Mouse');
    await page.getByRole('button', { name: /create & save/i }).click();

    await expect(page.getByText(/PR-/)).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for empty line items', async ({ page }) => {
    await page.getByRole('button', { name: /new request/i }).click();
    // Whitespace passes native `required` so the app-level validation runs
    await page.getByPlaceholder('Item name').fill('   ');
    await page.getByRole('button', { name: /create & save/i }).click();
    await expect(page.getByRole('main').getByText(/at least one line item/i)).toBeVisible();
  });
});
