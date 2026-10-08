import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });
});
