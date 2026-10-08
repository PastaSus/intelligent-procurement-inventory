import { test, expect } from '@playwright/test';

test.describe('Room management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/rooms');
  });

  test('displays seeded rooms', async ({ page }) => {
    await expect(page.getByText('Laboratory 127A')).toBeVisible();
    await expect(page.getByText('Laboratory 127B')).toBeVisible();
    await expect(page.getByText('Laboratory 128A')).toBeVisible();
  });

  test('opens add room form', async ({ page }) => {
    await page.getByRole('button', { name: /add room/i }).click();
    await expect(page.getByText('Add Laboratory Room')).toBeVisible();
    await expect(page.getByLabel(/room name/i)).toBeVisible();
  });

  test('can create and then delete a room', async ({ page }) => {
    const roomName = `E2E-Test-${Date.now()}`;

    await page.getByRole('button', { name: /add room/i }).click();
    await page.getByLabel(/room name/i).fill(roomName);
    await page.getByRole('button', { name: /create room/i }).click();
    await expect(page.getByText(roomName)).toBeVisible({ timeout: 5000 });

    const deleteButton = page.getByRole('row', { name: new RegExp(roomName) }).getByTitle('Delete');
    await deleteButton.click();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.locator('div.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
    // Modal closes when the delete action completes; redirect follows after a delay
    await expect(page.locator('div.fixed.inset-0')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText(roomName)).not.toBeVisible({ timeout: 15000 });
  });

  test('search filters rooms', async ({ page }) => {
    await page.getByPlaceholder(/search rooms/i).fill('127A');
    await expect(page.getByText('Laboratory 127A')).toBeVisible();
    await expect(page.getByText('Laboratory 128A')).not.toBeVisible();
  });

  test('pagination appears with many rooms', async ({ page }) => {
    // 50 creates with a full reload after each one is slow in dev (remote DB);
    // 3 seeded + 50 > pageSize (50) so the pager still appears
    test.setTimeout(420000);
    for (let i = 0; i < 50; i++) {
      await page.getByRole('button', { name: /add room/i }).click();
      await page.getByLabel(/room name/i).fill(`Pagination-Room-${i}`);
      await page.getByRole('button', { name: /create room/i }).click();
      await expect(page.getByText(`Pagination-Room-${i}`)).toBeVisible({ timeout: 15000 });
      // Create triggers a full page reload; let it settle or the next
      // iteration clicks Add on the old page and its modal gets detached
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }
    await expect(page.getByText(/page 1/i)).toBeVisible();
  });
});
