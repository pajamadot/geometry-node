import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/Geometry|Node/i);
});

test('editor deep-link loads (no 404 / white screen when signed out)', async ({ page }) => {
  await page.goto('/editor');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('#root')).toBeAttached();
});
