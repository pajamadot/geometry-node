/**
 * E2E Tests for public pages (no auth required)
 * Verifies landing page, navigation, and basic page rendering.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {

  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should have content
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should render without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (Clerk, hydration, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('Clerk') &&
      !e.includes('hydrat') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Tests Page', () => {

  test('should be accessible without authentication', async ({ page }) => {
    const response = await page.goto('/tests');
    expect(response?.status()).toBe(200);
  });

  test('should not redirect to sign-in', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    // URL should still be /tests, not redirected to sign-in
    expect(page.url()).toContain('/tests');
  });
});

test.describe('Page Navigation', () => {

  test('should navigate between public pages', async ({ page }) => {
    // Start at landing
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to tests
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/tests');

    // Should be able to go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Responsive Layout', () => {

  test('should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should render on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});

test.describe('Performance', () => {

  test('landing page should load within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(10000);
  });

  test('test page should load within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/tests');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(10000);
  });
});
