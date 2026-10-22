import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/admin.json';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });
});
