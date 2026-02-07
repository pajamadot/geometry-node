/**
 * E2E Tests for public pages (no auth required)
 * Verifies landing page, navigation, and basic page rendering.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {

  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should render without critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      !e.includes('Clerk') &&
      !e.includes('hydrat') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch') &&
      !e.includes('ChunkLoadError')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for GitHub link
    const githubLink = page.locator('a[href*="github"]');
    const hasGithub = await githubLink.count();
    expect(hasGithub).toBeGreaterThan(0);
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
    expect(page.url()).toContain('/tests');
  });

  test('should display the test runner UI', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: /Geometry Script/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const runButton = page.locator('button:has-text("Run Tests")');
    await expect(runButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Whitepaper Page', () => {

  test('should load without errors', async ({ page }) => {
    const response = await page.goto('/whitepaper');
    expect(response?.status()).toBe(200);
  });

  test('should not require authentication', async ({ page }) => {
    await page.goto('/whitepaper');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/whitepaper');
  });

  test('should have content', async ({ page }) => {
    await page.goto('/whitepaper');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });
});

test.describe('Investors Page', () => {

  test('should load without errors', async ({ page }) => {
    const response = await page.goto('/investors');
    expect(response?.status()).toBe(200);
  });

  test('should not require authentication', async ({ page }) => {
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/investors');
  });

  test('should have content', async ({ page }) => {
    await page.goto('/investors');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });
});

test.describe('Page Navigation', () => {

  test('should navigate between public pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/tests');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/tests');

    await page.goBack();
    await page.waitForLoadState('networkidle');
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle');

    // Should show a 404 page, not crash
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('404');
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

  test('tests page should render on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: /Geometry Script/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
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

  test('whitepaper should load within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/whitepaper');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });

  test('investors page should load within 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/investors');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Editor Page', () => {

  test('should load editor page', async ({ page }) => {
    const response = await page.goto('/editor');
    // Editor may redirect to sign-in (Clerk) or render directly
    const status = response?.status();
    expect(status).toBeLessThan(500); // Should not be a server error
  });

  test('editor page should not crash with 500', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/editor');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Filter out expected errors (Clerk auth, hydration, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('Clerk') &&
      !e.includes('hydrat') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch') &&
      !e.includes('ChunkLoadError') &&
      !e.includes('auth') &&
      !e.includes('sign-in')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('HTTP Headers & Security', () => {

  test('should return proper content type', async ({ page }) => {
    const response = await page.goto('/');
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('should not expose server version', async ({ page }) => {
    const response = await page.goto('/');
    const server = response?.headers()['server'];
    // If server header exists, it should not expose detailed version info
    if (server) {
      expect(server).not.toMatch(/\d+\.\d+\.\d+/);
    }
  });
});
