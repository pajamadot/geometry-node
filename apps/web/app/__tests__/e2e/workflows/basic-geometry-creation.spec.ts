/**
 * E2E Tests: Basic Geometry Creation Workflow
 * Tests the core user journey of creating and manipulating geometry
 */

import { test, expect } from '@playwright/test';
import { EditorHelpers, ValidationHelpers } from '../helpers/editor-helpers';

test.describe('Basic Geometry Creation', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should create a box node', async ({ page }) => {
    await editor.createNode('Box');

    // Verify node appears in graph
    await editor.verifyNodeExists('box');

    // Verify node count
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBe(1);

    // Verify geometry renders in viewport
    await editor.waitForGeometryRender();

    // Take screenshot for visual regression
    await editor.screenshotViewport('box-creation.png');
  });

  test('should create and modify box parameters', async ({ page }) => {
    await editor.createNode('Box');

    // Set parameters
    await editor.setNodeParameter('box', 'width', 2);
    await editor.setNodeParameter('box', 'height', 3);
    await editor.setNodeParameter('box', 'depth', 4);

    // Wait for geometry to update
    await editor.waitForGeometryRender();

    // Verify geometry stats updated
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });

  test('should create multiple primitive nodes', async ({ page }) => {
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.createNode('Sphere', { x: 300, y: 100 });
    await editor.createNode('Cylinder', { x: 500, y: 100 });

    // Verify all nodes created
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBe(3);

    await editor.verifyNodeExists('box');
    await editor.verifyNodeExists('sphere');
    await editor.verifyNodeExists('cylinder');
  });

  test('should connect box to subdivide node', async ({ page }) => {
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.createNode('Subdivide', { x: 300, y: 100 });

    // Connect nodes
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');

    // Verify connection created
    const edgeCount = await editor.getEdgeCount();
    expect(edgeCount).toBe(1);

    // Execute graph
    await editor.executeGraph();

    // Verify subdivided geometry has more vertices
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(24); // Box has 24 vertices
  });

  test('should create complete geometry pipeline', async ({ page }) => {
    // Create a complete pipeline: Box -> Subdivide -> Displace -> ColorByHeight

    // Step 1: Create Box
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.setNodeParameter('box', 'width', 2);

    // Step 2: Add Subdivide
    await editor.createNode('Subdivide', { x: 300, y: 100 });
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');
    await editor.setNodeParameter('subdivide', 'iterations', 2);

    // Step 3: Add Displace
    await editor.createNode('Displace', { x: 500, y: 100 });
    await editor.connectNodes('subdivide', 'geometry', 'displace', 'geometry');
    await editor.setNodeParameter('displace', 'strength', 0.5);

    // Step 4: Add ColorByHeight
    await editor.createNode('ColorByHeight', { x: 700, y: 100 });
    await editor.connectNodes('displace', 'geometry', 'colorByHeight', 'geometry');

    // Execute complete pipeline
    await editor.executeGraph();

    // Verify final geometry
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(100);

    // Verify all nodes present
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBe(4);

    // Verify all connections present
    const edgeCount = await editor.getEdgeCount();
    expect(edgeCount).toBe(3);

    // Take screenshot of final result
    await editor.screenshotViewport('complete-pipeline.png');
  });

  test('should delete nodes and connections', async ({ page }) => {
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.createNode('Sphere', { x: 300, y: 100 });

    // Verify nodes created
    expect(await editor.getNodeCount()).toBe(2);

    // Select and delete box
    await page.click('[data-node-type="box"]');
    await page.keyboard.press('Delete');

    // Verify node deleted
    expect(await editor.getNodeCount()).toBe(1);

    // Clear all
    await editor.clearGraph();
    expect(await editor.getNodeCount()).toBe(0);
  });

  test('should undo and redo operations', async ({ page }) => {
    await editor.createNode('Box');
    expect(await editor.getNodeCount()).toBe(1);

    // Undo
    await page.keyboard.press('Control+Z');
    expect(await editor.getNodeCount()).toBe(0);

    // Redo
    await page.keyboard.press('Control+Y');
    expect(await editor.getNodeCount()).toBe(1);
  });

  test('should duplicate nodes', async ({ page }) => {
    await editor.createNode('Box');
    await editor.setNodeParameter('box', 'width', 5);

    // Select node and duplicate
    await page.click('[data-node-type="box"]');
    await page.keyboard.press('Control+D');

    // Verify two nodes exist
    expect(await editor.getNodeCount()).toBe(2);
  });

  test('should zoom and pan viewport', async ({ page }) => {
    await editor.createNode('Box');
    await editor.waitForGeometryRender();

    // Zoom in
    await editor.zoomViewport('in', 3);
    await page.waitForTimeout(500);

    // Zoom out
    await editor.zoomViewport('out', 3);
    await page.waitForTimeout(500);

    // Rotate camera
    await editor.rotateViewport(100, 50);
    await page.waitForTimeout(500);

    // Verify geometry still visible
    await editor.waitForGeometryRender();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Create node with shortcut
    await page.keyboard.press('Shift+A');
    await page.waitForSelector('[data-testid="node-search"]');

    await page.fill('[data-testid="node-search"]', 'box');
    await page.keyboard.press('Enter');

    await editor.verifyNodeExists('box');
  });

  test('should save and load project', async ({ page }) => {
    // Create a simple graph
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');

    // Save project
    await page.click('[data-testid="save-project"]');
    await page.fill('[data-testid="project-name"]', 'Test Project');
    await page.click('[data-testid="save-confirm"]');

    // Wait for save confirmation
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

    // Clear graph
    await editor.clearGraph();
    expect(await editor.getNodeCount()).toBe(0);

    // Load project
    await page.click('[data-testid="open-project"]');
    await page.click('[data-project-name="Test Project"]');

    // Verify nodes restored
    expect(await editor.getNodeCount()).toBe(2);
    expect(await editor.getEdgeCount()).toBe(1);
  });
});

test.describe('Geometry Validation', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should validate geometry has valid vertex data', async ({ page }) => {
    await editor.createNode('Box');
    await editor.executeGraph();

    const stats = await editor.getGeometryStats();

    // Verify basic stats
    expect(stats?.vertices).toBeGreaterThan(0);
    expect(stats?.faces).toBeGreaterThan(0);

    // Verify reasonable values
    expect(stats?.vertices).toBeLessThan(1000000); // Sanity check
    expect(stats?.faces).toBeLessThan(1000000);
  });

  test('should handle invalid parameter values gracefully', async ({ page }) => {
    await editor.createNode('Box');

    // Try to set invalid values
    await editor.setNodeParameter('box', 'width', -1);

    // Should either reject or clamp to valid range
    await editor.executeGraph();

    // Geometry should still be valid
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });

  test('should detect degenerate geometry', async ({ page }) => {
    await editor.createNode('Box');
    await editor.setNodeParameter('box', 'width', 0);
    await editor.setNodeParameter('box', 'height', 0);
    await editor.setNodeParameter('box', 'depth', 0);

    // Should show warning or error
    await expect(
      page.locator('[data-testid="geometry-warning"]')
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Error Handling', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should handle disconnected nodes gracefully', async ({ page }) => {
    await editor.createNode('Subdivide');

    // Execute without input should show error or handle gracefully
    await editor.executeGraph();

    // Should show helpful error message
    await expect(
      page.locator('[data-testid="execution-error"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should recover from execution errors', async ({ page }) => {
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');

    // Set invalid subdivisions
    await editor.setNodeParameter('subdivide', 'iterations', 100);

    // Should either handle gracefully or show error
    await editor.executeGraph();

    // Fix the issue
    await editor.setNodeParameter('subdivide', 'iterations', 2);
    await editor.executeGraph();

    // Should work now
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });
});
