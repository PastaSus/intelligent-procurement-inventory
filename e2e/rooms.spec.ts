import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const createdRoomNames: string[] = [];

test.afterAll(async () => {
  if (createdRoomNames.length > 0) {
    await prisma.laboratoryRoom.deleteMany({
      where: { name: { in: createdRoomNames } },
    });
  }
  await prisma.$disconnect();
});

test.describe('Room management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/rooms');
  });

  test('displays seeded rooms', async ({ page }) => {
    await expect(page.getByText('LR2')).toBeVisible();
    await expect(page.getByText('MM3')).toBeVisible();
    await expect(page.getByText('LR4')).toBeVisible();
  });

  test('opens add room form', async ({ page }) => {
    await page.getByRole('button', { name: /add room/i }).click();
    await expect(page.getByText('Add Laboratory Room')).toBeVisible();
    await expect(page.getByLabel(/room name/i)).toBeVisible();
  });

  test('can create and then delete a room', async ({ page }) => {
    const roomName = `E2E-Test-${Date.now()}`;
    createdRoomNames.push(roomName);

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
    await page.getByPlaceholder(/search rooms/i).fill('LR2');
    await expect(page.getByText('LR2')).toBeVisible();
    await expect(page.getByText('MM3')).not.toBeVisible();
  });

  test('pagination appears with many rooms', async ({ page }) => {
    // 50 creates with a full reload after each one is slow in dev (remote DB);
    // 3 seeded + 50 > pageSize (50) so the pager still appears
    test.setTimeout(420000);
    for (let i = 0; i < 50; i++) {
      const roomName = `Pagination-Room-${i}`;
      createdRoomNames.push(roomName);
      await page.getByRole('button', { name: /add room/i }).click();
      await page.getByLabel(/room name/i).fill(roomName);
      await page.getByRole('button', { name: /create room/i }).click();
      await expect(page.getByText(roomName)).toBeVisible({ timeout: 15000 });
      // Create triggers a full page reload; let it settle or the next
      // iteration clicks Add on the old page and its modal gets detached
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }
    await expect(page.getByText(/page 1/i)).toBeVisible();
  });
});
