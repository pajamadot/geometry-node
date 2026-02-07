/**
 * E2E Tests for the in-browser test runner page (/tests)
 * No authentication required - this is a public page.
 */

import { test, expect } from '@playwright/test';

// Run these tests serially
test.describe.configure({ mode: 'serial' });

test.describe('In-Browser Test Runner', () => {

  test('should load the test page', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: /Geometry Script/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('all in-browser tests should pass', async ({ page }) => {
    // Capture console for debugging
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        consoleErrors.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    await page.goto('/tests');
    await page.waitForLoadState('networkidle');

    // Wait for React hydration
    await page.waitForTimeout(3000);

    // The fixed header may overlay the Run Tests button.
    // Use JavaScript click to bypass pointer interception.
    const runButton = page.locator('button:has-text("Run Tests")');
    const isIdle = await runButton.isVisible().catch(() => false);

    if (isIdle) {
      // Use evaluate to click without pointer event interception
      await runButton.evaluate((btn: HTMLElement) => btn.click());
    }

    // Wait for tests to complete
    try {
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text.includes('ALL PASSED') || text.includes('FAILED');
      }, { timeout: 120000 });
    } catch {
      const bodyText = await page.locator('body').innerText();
      throw new Error(
        `Tests did not complete within timeout.\n` +
        `Console errors (${consoleErrors.length}): ${consoleErrors.slice(0, 10).join('\n')}\n` +
        `Page text: ${bodyText.substring(0, 800)}\n` +
        `Console logs (last 15): ${consoleLogs.slice(-15).join('\n')}`
      );
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('ALL PASSED');
  });

  test('should have all expected test suites', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Trigger tests via JS click
    const runButton = page.locator('button:has-text("Run Tests")');
    if (await runButton.isVisible().catch(() => false)) {
      await runButton.evaluate((btn: HTMLElement) => btn.click());
    }

    await page.waitForFunction(() => {
      return document.body.innerText.includes('ALL PASSED') ||
             document.body.innerText.includes('FAILED');
    }, { timeout: 120000 });

    const expectedSuites = [
      'NodeRegistry',
      'PerformanceMonitor',
      'IncrementalComputation',
      'OptimizedNodeExecutor',
      'RuntimeGeometryProcessor',
      'CubeNode',
      'CylinderNode',
      'TransformNode',
      'MaterialNodes',
      'GraphCompiler',
      'MathNode',
      'VectorMathNode',
      'SeagullNode',
      'Modifier Nodes',
      'Instance & Color Nodes',
      'EnhancedGeometryData Pipeline',
      'Special Material Nodes',
      'Complex Generator Nodes',
      'Registry Comprehensive',
    ];

    const bodyText = await page.locator('body').innerText();
    for (const suite of expectedSuites) {
      expect(bodyText).toContain(suite);
    }
  });

  test('Run Tests button should re-run and pass again', async ({ page }) => {
    await page.goto('/tests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // First run
    const runButton = page.locator('button:has-text("Run Tests")');
    if (await runButton.isVisible().catch(() => false)) {
      await runButton.evaluate((btn: HTMLElement) => btn.click());
    }

    await page.waitForFunction(() => {
      return document.body.innerText.includes('ALL PASSED') ||
             document.body.innerText.includes('FAILED');
    }, { timeout: 120000 });

    // Second run - click again
    await page.waitForTimeout(500);
    const runButton2 = page.locator('button:has-text("Run Tests")');
    await runButton2.waitFor({ state: 'visible', timeout: 5000 });
    await runButton2.evaluate((btn: HTMLElement) => btn.click());

    // Wait for second run
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return (text.includes('ALL PASSED') || text.includes('FAILED')) &&
             !text.includes('Running...');
    }, { timeout: 120000 });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('ALL PASSED');
  });
});
