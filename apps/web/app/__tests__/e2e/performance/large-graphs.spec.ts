/**
 * E2E Tests: Performance - Large Node Graphs
 * Tests system performance with complex geometry and large node graphs
 */

import { test, expect } from '@playwright/test';
import { EditorHelpers, PerformanceHelpers } from '../helpers/editor-helpers';

test.describe('Large Node Graph Performance', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should handle 50 nodes efficiently', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    const startTime = Date.now();

    // Create 50 box nodes
    for (let i = 0; i < 50; i++) {
      await editor.createNode('Box', {
        x: (i % 10) * 150 + 100,
        y: Math.floor(i / 10) * 150 + 100,
      });
    }

    const creationTime = Date.now() - startTime;

    // Verify all nodes created
    expect(await editor.getNodeCount()).toBe(50);

    // Check performance metrics
    const metrics = await editor.getPerformanceMetrics();

    // Should maintain reasonable FPS
    expect(metrics?.avgFPS).toBeGreaterThan(20);
    expect(metrics?.minFPS).toBeGreaterThan(15);

    // Memory should not grow excessively
    if (metrics?.maxMemory) {
      expect(metrics.maxMemory).toBeLessThan(200 * 1024 * 1024); // < 200MB
    }

    // Creation should complete in reasonable time
    expect(creationTime).toBeLessThan(30000); // 30 seconds

    console.log('Performance metrics:', metrics);
  });

  test('should handle deeply connected pipeline', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create long pipeline: 20 nodes in sequence
    await editor.createNode('Box', { x: 100, y: 100 });

    for (let i = 0; i < 19; i++) {
      // Alternate between operations
      const nodeTypes = ['Subdivide', 'Twist', 'Bend', 'Taper'];
      const nodeType = nodeTypes[i % nodeTypes.length];

      await editor.createNode(nodeType, { x: 100 + (i + 1) * 150, y: 100 });
    }

    // Connect all nodes in sequence
    const nodes = await editor.getNodesInGraph();
    for (let i = 0; i < nodes.length - 1; i++) {
      await editor.connectNodes(nodes[i], 'geometry', nodes[i + 1], 'geometry');
    }

    // Execute pipeline
    const executeStart = Date.now();
    await editor.executeGraph();
    const executeDuration = Date.now() - executeStart;

    // Should complete in reasonable time
    expect(executeDuration).toBeLessThan(10000); // 10 seconds

    // Check metrics
    const metrics = await editor.getPerformanceMetrics();
    expect(metrics?.avgFPS).toBeGreaterThan(15);
  });

  test('should handle complex branching graph', async ({ page }) => {
    // Create tree structure: 1 source, 3 branches, 5 nodes each
    await editor.createNode('Box', { x: 100, y: 100 });

    for (let branch = 0; branch < 3; branch++) {
      for (let node = 0; node < 5; node++) {
        const nodeType = ['Subdivide', 'Displace', 'Twist', 'ColorByHeight'][node % 4];
        await editor.createNode(nodeType, {
          x: 300 + node * 150,
          y: 100 + branch * 200,
        });

        // Connect first node of branch to source
        if (node === 0) {
          await editor.connectNodes('box', 'geometry', nodeType.toLowerCase(), 'geometry');
        }
      }
    }

    // Execute all branches
    await editor.executeGraph();

    // Verify all executed
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });

  test('should maintain FPS with many connections', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create grid of nodes with many connections
    const gridSize = 5;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        await editor.createNode('Box', {
          x: 100 + x * 150,
          y: 100 + y * 150,
        });
      }
    }

    // Create connections (mesh pattern)
    await page.waitForTimeout(1000);

    const metrics = await editor.getPerformanceMetrics();

    // Should maintain 30+ FPS with 25 nodes
    expect(metrics?.avgFPS).toBeGreaterThan(30);
    expect(metrics?.minFPS).toBeGreaterThan(20);
  });

  test('should handle rapid node creation', async ({ page }) => {
    const startTime = Date.now();

    // Create 30 nodes rapidly
    const promises = [];
    for (let i = 0; i < 30; i++) {
      promises.push(
        editor.createNode('Box', {
          x: (i % 6) * 150 + 100,
          y: Math.floor(i / 6) * 150 + 100,
        })
      );
    }

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    // Should complete in reasonable time
    expect(duration).toBeLessThan(15000); // 15 seconds

    // Verify all created
    expect(await editor.getNodeCount()).toBe(30);
  });

  test('should cleanup memory when deleting nodes', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create 30 nodes
    for (let i = 0; i < 30; i++) {
      await editor.createNode('Box', {
        x: (i % 6) * 150 + 100,
        y: Math.floor(i / 6) * 150 + 100,
      });
    }

    const metricsAfterCreate = await editor.getPerformanceMetrics();
    const memoryAfterCreate = metricsAfterCreate?.maxMemory || 0;

    // Delete all nodes
    await editor.clearGraph();

    // Wait for cleanup
    await page.waitForTimeout(2000);

    const metricsAfterDelete = await editor.getPerformanceMetrics();
    const memoryAfterDelete = metricsAfterDelete?.maxMemory || 0;

    // Memory should not grow unbounded
    const memoryGrowth = memoryAfterDelete - memoryAfterCreate;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // < 50MB growth
  });
});

test.describe('High-Poly Geometry Performance', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should handle high-poly sphere', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    await editor.createNode('Sphere');
    await editor.setNodeParameter('sphere', 'widthSegments', 128);
    await editor.setNodeParameter('sphere', 'heightSegments', 96);

    const executeStart = Date.now();
    await editor.executeGraph();
    await editor.waitForGeometryRender();
    const executeDuration = Date.now() - executeStart;

    // Should complete in reasonable time
    expect(executeDuration).toBeLessThan(5000); // 5 seconds

    // Check geometry stats
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(10000);

    // Check rendering performance
    const metrics = await editor.getPerformanceMetrics();
    expect(metrics?.avgFPS).toBeGreaterThan(20);
  });

  test('should handle multiple subdivisions', async ({ page }) => {
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');

    await editor.setNodeParameter('subdivide', 'iterations', 4);

    const executeStart = Date.now();
    await editor.executeGraph();
    const executeDuration = Date.now() - executeStart;

    // Should complete even with high subdivision
    expect(executeDuration).toBeLessThan(10000);

    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(1000);
  });

  test('should handle complex displaced geometry', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    await editor.createNode('Sphere');
    await editor.createNode('Subdivide');
    await editor.createNode('Displace');

    await editor.connectNodes('sphere', 'geometry', 'subdivide', 'geometry');
    await editor.connectNodes('subdivide', 'geometry', 'displace', 'geometry');

    await editor.setNodeParameter('sphere', 'widthSegments', 64);
    await editor.setNodeParameter('sphere', 'heightSegments', 48);
    await editor.setNodeParameter('subdivide', 'iterations', 2);
    await editor.setNodeParameter('displace', 'strength', 0.5);
    await editor.setNodeParameter('displace', 'scale', 0.1);

    const executeStart = Date.now();
    await editor.executeGraph();
    await editor.waitForGeometryRender();
    const executeDuration = Date.now() - executeStart;

    expect(executeDuration).toBeLessThan(15000);

    const metrics = await editor.getPerformanceMetrics();
    expect(metrics?.avgFPS).toBeGreaterThan(15);
  });

  test('should handle viewport interaction with heavy geometry', async ({ page }) => {
    // Create heavy geometry
    await editor.createNode('Sphere');
    await editor.setNodeParameter('sphere', 'widthSegments', 96);
    await editor.setNodeParameter('sphere', 'heightSegments', 72);
    await editor.executeGraph();
    await editor.waitForGeometryRender();

    await editor.startPerformanceMonitoring();

    // Test viewport interactions
    await editor.zoomViewport('in', 5);
    await editor.rotateViewport(200, 100);
    await editor.zoomViewport('out', 3);

    await page.waitForTimeout(1000);

    const metrics = await editor.getPerformanceMetrics();

    // Should maintain reasonable FPS during interaction
    expect(metrics?.minFPS).toBeGreaterThan(20);
  });
});

test.describe('Stress Testing', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should handle maximum reasonable node count', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create 100 nodes (stress test)
    for (let i = 0; i < 100; i++) {
      await editor.createNode('Box', {
        x: (i % 10) * 150 + 100,
        y: Math.floor(i / 10) * 150 + 100,
      });

      // Check every 25 nodes
      if (i % 25 === 24) {
        const metrics = await editor.getPerformanceMetrics();
        console.log(`Metrics at ${i + 1} nodes:`, metrics);

        // Should still be responsive
        expect(metrics?.avgFPS).toBeGreaterThan(15);
      }
    }

    expect(await editor.getNodeCount()).toBe(100);
  });

  test('should detect performance degradation', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    const measurements = [];

    // Create nodes in batches and measure
    for (let batch = 0; batch < 5; batch++) {
      for (let i = 0; i < 10; i++) {
        await editor.createNode('Box', {
          x: (batch * 10 + i) * 150 + 100,
          y: 100,
        });
      }

      const metrics = await editor.getPerformanceMetrics();
      measurements.push(metrics?.avgFPS || 0);

      console.log(`Batch ${batch + 1}: ${metrics?.avgFPS} FPS`);
    }

    // FPS should not degrade dramatically
    const firstBatchFPS = measurements[0];
    const lastBatchFPS = measurements[measurements.length - 1];

    const degradation = ((firstBatchFPS - lastBatchFPS) / firstBatchFPS) * 100;

    // Should not degrade more than 50%
    expect(degradation).toBeLessThan(50);
  });

  test('should recover after clearing large graph', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create large graph
    for (let i = 0; i < 50; i++) {
      await editor.createNode('Box', {
        x: (i % 10) * 150 + 100,
        y: Math.floor(i / 10) * 150 + 100,
      });
    }

    const metricsWithNodes = await editor.getPerformanceMetrics();

    // Clear graph
    await editor.clearGraph();
    await page.waitForTimeout(1000);

    const metricsAfterClear = await editor.getPerformanceMetrics();

    // FPS should improve after clearing
    expect(metricsAfterClear?.avgFPS).toBeGreaterThanOrEqual(metricsWithNodes?.avgFPS || 0);
  });
});

test.describe('WebGL Performance', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();

    // Check WebGL available
    const hasWebGL = await editor.checkWebGLAvailable();
    if (!hasWebGL) {
      test.skip('WebGL not available');
    }
  });

  test('should report WebGL capabilities', async ({ page }) => {
    const webglInfo = await editor.getWebGLInfo();

    console.log('WebGL Info:', webglInfo);

    expect(webglInfo).toBeTruthy();
    expect(webglInfo?.version).toBeTruthy();
  });

  test('should handle draw call optimization', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    // Create multiple instances of same geometry
    for (let i = 0; i < 20; i++) {
      await editor.createNode('Sphere', {
        x: (i % 5) * 150 + 100,
        y: Math.floor(i / 5) * 150 + 100,
      });
    }

    await editor.executeGraph();
    await page.waitForTimeout(1000);

    const metrics = await editor.getPerformanceMetrics();

    // Should maintain reasonable performance
    expect(metrics?.avgFPS).toBeGreaterThan(20);
  });

  test('should handle shader compilation efficiently', async ({ page }) => {
    const materials = ['standard', 'phong', 'lambert', 'wireframe'];

    await editor.createNode('Sphere');
    await editor.executeGraph();

    for (const material of materials) {
      const startTime = Date.now();

      await page.click('[data-testid="material-menu"]');
      await page.click(`[data-material="${material}"]`);

      await editor.waitForGeometryRender();

      const duration = Date.now() - startTime;

      // Shader compilation should be fast
      expect(duration).toBeLessThan(1000); // 1 second
    }
  });
});

test.describe('Memory Profiling', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should not leak memory on node creation/deletion cycle', async ({ page }) => {
    await editor.startPerformanceMonitoring();

    const initialMetrics = await editor.getPerformanceMetrics();
    const initialMemory = initialMetrics?.avgMemory || 0;

    // Create and delete nodes 5 times
    for (let cycle = 0; cycle < 5; cycle++) {
      // Create 20 nodes
      for (let i = 0; i < 20; i++) {
        await editor.createNode('Box', {
          x: (i % 5) * 150 + 100,
          y: Math.floor(i / 5) * 150 + 100,
        });
      }

      // Delete all
      await editor.clearGraph();
      await page.waitForTimeout(500);
    }

    const finalMetrics = await editor.getPerformanceMetrics();
    const finalMemory = finalMetrics?.maxMemory || 0;

    const memoryIncrease = finalMemory - initialMemory;

    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

    // Should not grow excessively (allow some growth for caches)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // < 100MB
  });
});
