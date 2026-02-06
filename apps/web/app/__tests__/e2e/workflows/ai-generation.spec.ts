/**
 * E2E Tests: AI-Powered Geometry Generation
 * Tests the AI node generation and scene creation workflows
 */

import { test, expect } from '@playwright/test';
import { EditorHelpers } from '../helpers/editor-helpers';

test.describe('AI Node Generation', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();

    // Check if API key is configured
    const hasApiKey = await page.evaluate(() => {
      return !!localStorage.getItem('openrouter_api_key');
    });

    if (!hasApiKey) {
      test.skip('OpenRouter API key not configured');
    }
  });

  test('should generate box geometry from prompt', async ({ page }) => {
    await editor.generateWithAI('Create a box with width 2, height 3, depth 4');

    // Verify box node created
    await editor.verifyNodeExists('box');

    // Verify parameters set correctly
    const nodes = await editor.getNodesInGraph();
    expect(nodes).toContain('box');

    // Verify geometry renders
    await editor.waitForGeometryRender();
  });

  test('should generate complete node graph from prompt', async ({ page }) => {
    await editor.generateWithAI(
      'Create a sphere, subdivide it 2 times, add noise displacement with strength 0.5, then color it from blue to red by height'
    );

    // Wait for generation
    await editor.waitForAIGeneration(30000);

    // Verify multiple nodes created
    const nodes = await editor.getNodesInGraph();
    expect(nodes.length).toBeGreaterThan(1);

    // Should have sphere as starting point
    expect(nodes.some(n => n.includes('sphere'))).toBe(true);

    // Should have operation nodes
    expect(nodes.some(n => n.includes('subdivide') || n.includes('displace'))).toBe(true);

    // Verify nodes are connected
    const edgeCount = await editor.getEdgeCount();
    expect(edgeCount).toBeGreaterThan(0);

    // Execute and verify result
    await editor.executeGraph();
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });

  test('should generate twisted cylinder from prompt', async ({ page }) => {
    await editor.generateWithAI('Make a cylinder and twist it 90 degrees');

    await editor.waitForAIGeneration();

    const nodes = await editor.getNodesInGraph();

    // Should have cylinder
    expect(nodes.some(n => n.includes('cylinder'))).toBe(true);

    // Should have twist operation
    expect(nodes.some(n => n.includes('twist'))).toBe(true);

    // Verify connection
    expect(await editor.getEdgeCount()).toBeGreaterThanOrEqual(1);
  });

  test('should handle complex multi-step prompts', async ({ page }) => {
    await editor.generateWithAI(
      'Create a box, extrude it upward by 2 units, bend it, and add a gradient from green to purple'
    );

    await editor.waitForAIGeneration(45000);

    const nodes = await editor.getNodesInGraph();

    // Verify complex graph created
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(await editor.getEdgeCount()).toBeGreaterThanOrEqual(2);

    // Execute complete pipeline
    await editor.executeGraph();

    // Verify final result renders
    await editor.waitForGeometryRender();

    // Take screenshot
    await editor.screenshotViewport('ai-complex-generation.png');
  });

  test('should generate procedural structures', async ({ page }) => {
    await editor.generateWithAI('Create a simple procedural building with a base, walls, and roof');

    await editor.waitForAIGeneration(30000);

    // Should create multiple primitives
    const nodes = await editor.getNodesInGraph();
    expect(nodes.length).toBeGreaterThanOrEqual(3);

    // Execute
    await editor.executeGraph();

    // Verify structure renders
    await editor.waitForGeometryRender();
  });

  test('should modify existing node graph with AI', async ({ page }) => {
    // Start with a box
    await editor.createNode('Box');

    // Ask AI to modify it
    await editor.generateWithAI('Add subdivision and displacement to this box');

    await editor.waitForAIGeneration();

    // Should add nodes to existing graph
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBeGreaterThan(1);

    // Original box should still exist
    await editor.verifyNodeExists('box');
  });

  test('should handle AI generation errors gracefully', async ({ page }) => {
    await editor.openAIDialog();

    // Submit invalid/empty prompt
    await page.fill('[data-testid="ai-prompt-input"]', '');
    await page.click('[data-testid="ai-generate-submit"]');

    // Should show validation error
    await expect(page.locator('[data-testid="prompt-error"]')).toBeVisible();
  });

  test('should stream AI responses in real-time', async ({ page }) => {
    await editor.openAIDialog();
    await page.fill('[data-testid="ai-prompt-input"]', 'Create a sphere with colors');

    // Start generation
    await page.click('[data-testid="ai-generate-submit"]');

    // Verify streaming indicator appears
    await expect(page.locator('[data-testid="ai-streaming"]')).toBeVisible({
      timeout: 5000,
    });

    // Wait for completion
    await editor.waitForAIGeneration();

    // Verify nodes created
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should generate with different AI models', async ({ page }) => {
    // Open model selector
    await editor.openAIDialog();
    await page.click('[data-testid="model-selector"]');

    // Select different model
    await page.click('[data-model="claude-3-sonnet"]');

    await page.fill('[data-testid="ai-prompt-input"]', 'Create a torus');
    await page.click('[data-testid="ai-generate-submit"]');

    await editor.waitForAIGeneration();

    // Verify generation worked
    await editor.verifyNodeExists('torus');
  });

  test('should cancel AI generation mid-stream', async ({ page }) => {
    await editor.openAIDialog();
    await page.fill('[data-testid="ai-prompt-input"]', 'Create a complex procedural city');
    await page.click('[data-testid="ai-generate-submit"]');

    // Wait for streaming to start
    await expect(page.locator('[data-testid="ai-streaming"]')).toBeVisible();

    // Cancel generation
    await page.click('[data-testid="cancel-generation"]');

    // Verify streaming stopped
    await expect(page.locator('[data-testid="ai-streaming"]')).not.toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('AI Scene Generation', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should generate complete scene from description', async ({ page }) => {
    await editor.generateWithAI(
      'Create a scene with 3 spheres arranged in a triangle, each with different colors'
    );

    await editor.waitForAIGeneration(45000);

    const nodes = await editor.getNodesInGraph();

    // Should have multiple sphere nodes
    const sphereNodes = nodes.filter(n => n.includes('sphere'));
    expect(sphereNodes.length).toBeGreaterThanOrEqual(3);

    // Execute scene
    await editor.executeGraph();
    await editor.waitForGeometryRender();

    // Take screenshot of scene
    await editor.screenshotViewport('ai-scene-generation.png');
  });

  test('should generate parametric variations', async ({ page }) => {
    await editor.generateWithAI('Create 5 boxes with increasing sizes from 1 to 5');

    await editor.waitForAIGeneration(30000);

    const nodes = await editor.getNodesInGraph();

    // Should create multiple box nodes
    const boxNodes = nodes.filter(n => n.includes('box'));
    expect(boxNodes.length).toBeGreaterThanOrEqual(5);
  });
});

test.describe('AI Prompt Quality', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should understand geometry terminology', async ({ page }) => {
    const prompts = [
      'Create a tesselated sphere',
      'Make a beveled cube',
      'Generate an icosphere',
      'Build a low-poly mesh',
    ];

    for (const prompt of prompts) {
      await editor.clearGraph();
      await editor.generateWithAI(prompt);
      await editor.waitForAIGeneration();

      // Each should create valid geometry
      const nodeCount = await editor.getNodeCount();
      expect(nodeCount).toBeGreaterThan(0);

      await editor.executeGraph();
      const stats = await editor.getGeometryStats();
      expect(stats?.vertices).toBeGreaterThan(0);
    }
  });

  test('should handle ambiguous prompts', async ({ page }) => {
    await editor.generateWithAI('Make something cool');

    await editor.waitForAIGeneration();

    // Should still generate something valid
    const nodeCount = await editor.getNodeCount();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should provide helpful suggestions', async ({ page }) => {
    await editor.openAIDialog();

    // Should show example prompts
    await expect(page.locator('[data-testid="example-prompts"]')).toBeVisible();

    // Click an example
    await page.click('[data-testid="example-prompt"]:first-child');

    // Prompt should be filled
    const promptValue = await page
      .locator('[data-testid="ai-prompt-input"]')
      .inputValue();
    expect(promptValue.length).toBeGreaterThan(0);
  });
});

test.describe('AI Performance', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should complete simple generations under 10 seconds', async ({ page }) => {
    const startTime = Date.now();

    await editor.generateWithAI('Create a box');
    await editor.waitForAIGeneration();

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10000);
  });

  test('should handle multiple rapid generations', async ({ page }) => {
    // Generate 3 times rapidly
    await editor.generateWithAI('Create a box');
    await editor.waitForAIGeneration();

    await editor.generateWithAI('Create a sphere');
    await editor.waitForAIGeneration();

    await editor.generateWithAI('Create a cylinder');
    await editor.waitForAIGeneration();

    // All should succeed
    const nodes = await editor.getNodesInGraph();
    expect(nodes.length).toBeGreaterThanOrEqual(3);
  });
});
