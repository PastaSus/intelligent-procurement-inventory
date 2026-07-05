import { test, expect } from '@playwright/test';

test.describe('Dashboard smoke tests', () => {
  test('loads dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2')).toContainText('Dashboard');
  });

  test('navigates to rooms via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Rooms').click();
    await expect(page).toHaveURL(/\/dashboard\/rooms/);
    await expect(page.locator('h2')).toContainText('Laboratory Rooms');
  });

  test('navigates to units via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Units').click();
    await expect(page).toHaveURL(/\/dashboard\/units/);
    await expect(page.locator('h2')).toContainText('Computer Units');
  });

  test('navigates to component health via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Component Health').click();
    await expect(page).toHaveURL(/\/dashboard\/component-status/);
    await expect(page.locator('h2')).toContainText('Component Health');
  });

  test('navigates to spare parts via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Spare Parts').click();
    await expect(page).toHaveURL(/\/dashboard\/inventory/);
    await expect(page.locator('h2')).toContainText('Spare Parts');
  });

  test('navigates to purchase requests via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Requests').click();
    await expect(page).toHaveURL(/\/dashboard\/purchase-requests/);
    await expect(page.locator('h2')).toContainText('Purchase Requests');
  });

  test('navigates to chat via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Chat').click();
    await expect(page).toHaveURL(/\/dashboard\/chat/);
    await expect(page.locator('h2')).toContainText('AI Assistant');
  });
});
