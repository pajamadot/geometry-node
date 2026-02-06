/**
 * E2E Tests: Visual Regression - Primitive Rendering
 * Tests that geometry primitives render consistently
 */

import { test, expect } from '@playwright/test';
import { EditorHelpers } from '../helpers/editor-helpers';

test.describe('Primitive Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();

    // Set consistent camera position
    await page.evaluate(() => {
      const camera = (window as any).camera;
      if (camera) {
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
      }
    });
  });

  test('box should render consistently', async ({ page }) => {
    await editor.createNode('Box');
    await editor.setNodeParameter('box', 'width', 2);
    await editor.setNodeParameter('box', 'height', 2);
    await editor.setNodeParameter('box', 'depth', 2);

    await editor.executeGraph();
    await editor.waitForGeometryRender();

    // Wait for rendering to stabilize
    await page.waitForTimeout(500);

    // Visual snapshot
    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('box-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('sphere should render consistently', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.setNodeParameter('sphere', 'radius', 1);
    await editor.setNodeParameter('sphere', 'widthSegments', 32);
    await editor.setNodeParameter('sphere', 'heightSegments', 24);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('sphere-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('cylinder should render consistently', async ({ page }) => {
    await editor.createNode('Cylinder');
    await editor.setNodeParameter('cylinder', 'radius', 1);
    await editor.setNodeParameter('cylinder', 'height', 2);
    await editor.setNodeParameter('cylinder', 'segments', 32);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('cylinder-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('torus should render consistently', async ({ page }) => {
    await editor.createNode('Torus');
    await editor.setNodeParameter('torus', 'radius', 1);
    await editor.setNodeParameter('torus', 'tube', 0.3);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('torus-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('plane should render consistently', async ({ page }) => {
    await editor.createNode('Plane');
    await editor.setNodeParameter('plane', 'width', 2);
    await editor.setNodeParameter('plane', 'height', 2);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('plane-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Operation Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('subdivided geometry should render consistently', async ({ page }) => {
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');
    await editor.setNodeParameter('subdivide', 'iterations', 2);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('box-subdivided.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });

  test('displaced geometry should render consistently', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.createNode('Subdivide');
    await editor.createNode('Displace');

    await editor.connectNodes('sphere', 'geometry', 'subdivide', 'geometry');
    await editor.connectNodes('subdivide', 'geometry', 'displace', 'geometry');

    await editor.setNodeParameter('subdivide', 'iterations', 2);
    await editor.setNodeParameter('displace', 'strength', 0.5);
    await editor.setNodeParameter('displace', 'scale', 0.1);
    await editor.setNodeParameter('displace', 'seed', 42);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('sphere-displaced.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('twisted geometry should render consistently', async ({ page }) => {
    await editor.createNode('Cylinder');
    await editor.createNode('Twist');

    await editor.connectNodes('cylinder', 'geometry', 'twist', 'geometry');
    await editor.setNodeParameter('twist', 'angle', Math.PI / 2);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('cylinder-twisted.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });

  test('colored geometry should render consistently', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.createNode('ColorByHeight');

    await editor.connectNodes('sphere', 'geometry', 'colorByHeight', 'geometry');

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('sphere-colored-height.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });
});

test.describe('Complex Scene Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('multiple objects should render consistently', async ({ page }) => {
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.createNode('Sphere', { x: 300, y: 100 });
    await editor.createNode('Cylinder', { x: 500, y: 100 });

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('multiple-primitives.png', {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test('complete pipeline should render consistently', async ({ page }) => {
    // Create: Box -> Subdivide -> Displace -> Twist -> Color
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.createNode('Displace');
    await editor.createNode('Twist');
    await editor.createNode('ColorByHeight');

    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');
    await editor.connectNodes('subdivide', 'geometry', 'displace', 'geometry');
    await editor.connectNodes('displace', 'geometry', 'twist', 'geometry');
    await editor.connectNodes('twist', 'geometry', 'colorByHeight', 'geometry');

    await editor.setNodeParameter('subdivide', 'iterations', 1);
    await editor.setNodeParameter('displace', 'strength', 0.3);
    await editor.setNodeParameter('displace', 'seed', 42);
    await editor.setNodeParameter('twist', 'angle', Math.PI / 4);

    await editor.executeGraph();
    await editor.waitForGeometryRender();
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
    await expect(canvas).toHaveScreenshot('complex-pipeline.png', {
      maxDiffPixels: 250,
      threshold: 0.2,
    });
  });
});

test.describe('Camera Angles Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should render from multiple camera angles', async ({ page }) => {
    await editor.createNode('Torus');
    await editor.executeGraph();
    await editor.waitForGeometryRender();

    const angles = [
      { name: 'front', x: 0, y: 0, z: 5 },
      { name: 'top', x: 0, y: 5, z: 0 },
      { name: 'side', x: 5, y: 0, z: 0 },
      { name: 'iso', x: 5, y: 5, z: 5 },
    ];

    for (const angle of angles) {
      // Set camera position
      await page.evaluate(
        ({ x, y, z }) => {
          const camera = (window as any).camera;
          if (camera) {
            camera.position.set(x, y, z);
            camera.lookAt(0, 0, 0);
          }
        },
        { x: angle.x, y: angle.y, z: angle.z }
      );

      await page.waitForTimeout(300);

      const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
      await expect(canvas).toHaveScreenshot(`torus-${angle.name}.png`, {
        maxDiffPixels: 100,
        threshold: 0.2,
      });
    }
  });
});

test.describe('Lighting Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should render with different lighting setups', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();
    await editor.waitForGeometryRender();

    // Test with different lighting conditions
    const lightingModes = ['default', 'studio', 'outdoor', 'dark'];

    for (const mode of lightingModes) {
      // Change lighting mode
      await page.click('[data-testid="lighting-menu"]');
      await page.click(`[data-lighting="${mode}"]`);

      await page.waitForTimeout(300);

      const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
      await expect(canvas).toHaveScreenshot(`sphere-lighting-${mode}.png`, {
        maxDiffPixels: 150,
        threshold: 0.2,
      });
    }
  });
});

test.describe('Material Visual Regression', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should render with different materials', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();

    const materials = ['standard', 'phong', 'lambert', 'wireframe'];

    for (const material of materials) {
      await page.click('[data-testid="material-menu"]');
      await page.click(`[data-material="${material}"]`);

      await page.waitForTimeout(300);

      const canvas = page.locator('canvas[data-testid="viewport-canvas"]');
      await expect(canvas).toHaveScreenshot(`sphere-material-${material}.png`, {
        maxDiffPixels: 150,
        threshold: 0.2,
      });
    }
  });
});
