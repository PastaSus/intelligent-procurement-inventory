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

    const deleteButton = page.getByTitle('Delete').last();
    await deleteButton.click();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByText(roomName)).not.toBeVisible();
  });

  test('search filters rooms', async ({ page }) => {
    await page.getByPlaceholder(/search rooms/i).fill('127A');
    await expect(page.getByText('Laboratory 127A')).toBeVisible();
    await expect(page.getByText('Laboratory 128A')).not.toBeVisible();
  });

  test('pagination appears with many rooms', async ({ page }) => {
    for (let i = 0; i < 52; i++) {
      await page.goto('/dashboard/rooms');
      await page.getByRole('button', { name: /add room/i }).click();
      await page.getByLabel(/room name/i).fill(`Pagination-Room-${i}`);
      await page.getByRole('button', { name: /create room/i }).click();
      await expect(page.getByText(`Pagination-Room-${i}`)).toBeVisible({ timeout: 5000 });
    }
    await expect(page.getByText(/page 1/i)).toBeVisible();
  });
});
