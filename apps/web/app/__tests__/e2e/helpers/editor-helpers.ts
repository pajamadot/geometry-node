/**
 * E2E Test Helpers for Geometry Editor
 * Reusable functions for interacting with the node editor
 */

import { Page, expect } from '@playwright/test';

export class EditorHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to the editor
   */
  async navigateToEditor() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Wait for Clerk authentication to complete
    await this.page.waitForSelector('[data-clerk-loaded="true"]', { timeout: 10000 }).catch(() => {
      console.warn('Clerk did not load within timeout, continuing anyway');
    });

    // Wait for Three.js initialization
    await this.page.waitForFunction(() => {
      return (window as any).THREE !== undefined;
    }, { timeout: 15000 }).catch(() => {
      console.warn('THREE.js did not load within timeout');
    });
  }

  /**
   * Verify user is authenticated
   */
  async verifyAuthenticated() {
    // Check for user button or auth indicator
    const isAuthenticated = await this.page.locator('[data-testid="user-button"], [data-clerk-loaded="true"]').isVisible();
    return isAuthenticated;
  }

  /**
   * Create a node by type
   */
  async createNode(nodeType: string, position?: { x: number; y: number }) {
    // Open node creation menu
    await this.page.click('[data-testid="add-node-button"]', { timeout: 5000 });

    // Search for node type
    await this.page.fill('[data-testid="node-search"]', nodeType);

    // Click on the node type
    await this.page.click(`[data-node-type="${nodeType.toLowerCase()}"]`);

    // If position provided, move node
    if (position) {
      const node = this.page.locator(`.react-flow__node:has-text("${nodeType}")`).last();
      await node.dragTo(this.page.locator('.react-flow__pane'), {
        targetPosition: position,
      });
    }

    // Wait for node to be created
    await this.page.waitForSelector(`.react-flow__node:has-text("${nodeType}")`, {
      timeout: 5000,
    });
  }

  /**
   * Connect two nodes
   */
  async connectNodes(sourceNode: string, sourceSocket: string, targetNode: string, targetSocket: string) {
    const sourceHandle = this.page.locator(
      `[data-node-type="${sourceNode}"] [data-handleid="${sourceSocket}"]`
    );
    const targetHandle = this.page.locator(
      `[data-node-type="${targetNode}"] [data-handleid="${targetSocket}"]`
    );

    await sourceHandle.dragTo(targetHandle);

    // Verify connection created
    await expect(this.page.locator('.react-flow__edge')).toBeVisible();
  }

  /**
   * Set node parameter value
   */
  async setNodeParameter(nodeType: string, paramName: string, value: string | number) {
    // Select node
    await this.page.click(`[data-node-type="${nodeType}"]`);

    // Wait for parameter panel
    await this.page.waitForSelector('[data-testid="parameter-panel"]');

    // Find and set parameter
    const input = this.page.locator(`[data-param="${paramName}"]`);
    await input.clear();
    await input.fill(String(value));
    await input.press('Enter');

    // Wait for update to process
    await this.page.waitForTimeout(100);
  }

  /**
   * Get geometry statistics from viewport info
   */
  async getGeometryStats() {
    const stats = await this.page.locator('[data-testid="geometry-stats"]').textContent();
    if (!stats) return null;

    const vertexMatch = stats.match(/Vertices:\s*(\d+)/);
    const faceMatch = stats.match(/Faces:\s*(\d+)/);

    return {
      vertices: vertexMatch ? parseInt(vertexMatch[1]) : 0,
      faces: faceMatch ? parseInt(faceMatch[1]) : 0,
    };
  }

  /**
   * Wait for geometry to render in viewport
   */
  async waitForGeometryRender() {
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas[data-testid="viewport-canvas"]') as HTMLCanvasElement;
      if (!canvas) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Check if canvas has content (not blank)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some(pixel => pixel !== 0);
    }, { timeout: 10000 });
  }

  /**
   * Take screenshot of viewport only
   */
  async screenshotViewport(name: string) {
    const canvas = this.page.locator('canvas[data-testid="viewport-canvas"]');
    return await canvas.screenshot({ path: `test-results/screenshots/${name}` });
  }

  /**
   * Execute node graph
   */
  async executeGraph() {
    await this.page.click('[data-testid="execute-graph"]');
    await this.waitForGeometryRender();
  }

  /**
   * Export geometry to format
   */
  async exportGeometry(format: 'gltf' | 'obj' | 'stl' | 'ply') {
    await this.page.click('[data-testid="export-menu"]');

    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click(`[data-format="${format}"]`);

    const download = await downloadPromise;
    const path = await download.path();

    return path;
  }

  /**
   * Clear all nodes
   */
  async clearGraph() {
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');

    // Verify all nodes removed
    await expect(this.page.locator('.react-flow__node')).toHaveCount(0);
  }

  /**
   * Get node count
   */
  async getNodeCount() {
    return await this.page.locator('.react-flow__node').count();
  }

  /**
   * Get edge count (connections)
   */
  async getEdgeCount() {
    return await this.page.locator('.react-flow__edge').count();
  }

  /**
   * Zoom viewport camera
   */
  async zoomViewport(direction: 'in' | 'out', steps: number = 3) {
    const canvas = this.page.locator('canvas[data-testid="viewport-canvas"]');

    for (let i = 0; i < steps; i++) {
      if (direction === 'in') {
        await canvas.dispatchEvent('wheel', { deltaY: -100 });
      } else {
        await canvas.dispatchEvent('wheel', { deltaY: 100 });
      }
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Rotate viewport camera
   */
  async rotateViewport(deltaX: number, deltaY: number) {
    const canvas = this.page.locator('canvas[data-testid="viewport-canvas"]');
    const box = await canvas.boundingBox();

    if (!box) return;

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up({ button: 'right' });

    await this.page.waitForTimeout(100);
  }

  /**
   * Check if WebGL is available
   */
  async checkWebGLAvailable() {
    return await this.page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    });
  }

  /**
   * Get WebGL info
   */
  async getWebGLInfo() {
    return await this.page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext;
      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
        version: gl.getParameter(gl.VERSION),
      };
    });
  }

  /**
   * Monitor performance metrics
   */
  async startPerformanceMonitoring() {
    await this.page.evaluate(() => {
      (window as any).__perfMetrics = {
        fps: [],
        memory: [],
        drawCalls: [],
        startTime: performance.now(),
      };

      const monitor = () => {
        const metrics = (window as any).__perfMetrics;
        const now = performance.now();

        // Calculate FPS
        if (metrics.lastFrame) {
          const fps = 1000 / (now - metrics.lastFrame);
          metrics.fps.push(fps);
        }
        metrics.lastFrame = now;

        // Memory
        if ((performance as any).memory) {
          metrics.memory.push((performance as any).memory.usedJSHeapSize);
        }

        requestAnimationFrame(monitor);
      };

      requestAnimationFrame(monitor);
    });
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const metrics = (window as any).__perfMetrics;
      if (!metrics || !metrics.fps.length) return null;

      const avgFPS = metrics.fps.reduce((a: number, b: number) => a + b, 0) / metrics.fps.length;
      const minFPS = Math.min(...metrics.fps);
      const maxMemory = Math.max(...metrics.memory);
      const avgMemory = metrics.memory.reduce((a: number, b: number) => a + b, 0) / metrics.memory.length;

      return {
        avgFPS,
        minFPS,
        maxMemory,
        avgMemory,
        duration: performance.now() - metrics.startTime,
      };
    });
  }

  /**
   * Wait for AI generation to complete
   */
  async waitForAIGeneration(timeout: number = 30000) {
    await this.page.waitForSelector('[data-testid="ai-generating"]', { state: 'visible', timeout: 5000 });
    await this.page.waitForSelector('[data-testid="ai-generating"]', { state: 'hidden', timeout });
  }

  /**
   * Open AI generation dialog
   */
  async openAIDialog() {
    await this.page.click('[data-testid="ai-generate-button"]');
    await this.page.waitForSelector('[data-testid="ai-prompt-input"]');
  }

  /**
   * Generate geometry with AI prompt
   */
  async generateWithAI(prompt: string) {
    await this.openAIDialog();
    await this.page.fill('[data-testid="ai-prompt-input"]', prompt);
    await this.page.click('[data-testid="ai-generate-submit"]');
    await this.waitForAIGeneration();
  }

  /**
   * Verify node exists in graph
   */
  async verifyNodeExists(nodeType: string) {
    await expect(this.page.locator(`[data-node-type="${nodeType}"]`)).toBeVisible();
  }

  /**
   * Get all node types in current graph
   */
  async getNodesInGraph() {
    const nodes = await this.page.locator('.react-flow__node').all();
    const nodeTypes: string[] = [];

    for (const node of nodes) {
      const type = await node.getAttribute('data-node-type');
      if (type) nodeTypes.push(type);
    }

    return nodeTypes;
  }
}

/**
 * Validation helpers
 */
export class ValidationHelpers {
  /**
   * Validate GLTF file structure
   */
  static async validateGLTF(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf8');

    try {
      const gltf = JSON.parse(content);
      const errors: string[] = [];

      // Check required fields
      if (!gltf.asset) errors.push('Missing asset field');
      if (!gltf.asset?.version) errors.push('Missing asset version');

      // Validate version
      if (gltf.asset?.version && !gltf.asset.version.startsWith('2.')) {
        errors.push(`Invalid GLTF version: ${gltf.asset.version}`);
      }

      // Check for meshes
      if (!gltf.meshes || gltf.meshes.length === 0) {
        errors.push('No meshes found in GLTF');
      }

      // Check for accessors
      if (!gltf.accessors) errors.push('Missing accessors');

      // Check for bufferViews
      if (!gltf.bufferViews) errors.push('Missing bufferViews');

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { valid: false, errors: [`Failed to parse GLTF: ${error}`] };
    }
  }

  /**
   * Validate OBJ file structure
   */
  static async validateOBJ(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    const errors: string[] = [];

    const lines = content.split('\n');
    let hasVertices = false;
    let hasFaces = false;

    for (const line of lines) {
      if (line.startsWith('v ')) hasVertices = true;
      if (line.startsWith('f ')) hasFaces = true;
    }

    if (!hasVertices) errors.push('No vertices found in OBJ');
    if (!hasFaces) errors.push('No faces found in OBJ');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Compare two images for visual regression
   */
  static async compareImages(
    image1Path: string,
    image2Path: string,
    threshold: number = 0.01
  ): Promise<{ match: boolean; difference: number }> {
    // This would use a library like pixelmatch or resemble.js
    // For now, placeholder implementation
    return { match: true, difference: 0 };
  }
}

/**
 * Performance testing helpers
 */
export class PerformanceHelpers {
  /**
   * Measure operation time
   */
  static async measureOperation<T>(
    operation: () => Promise<T>,
    label: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  /**
   * Check if performance is acceptable
   */
  static assertPerformance(duration: number, maxDuration: number, operation: string) {
    if (duration > maxDuration) {
      throw new Error(
        `Performance issue: ${operation} took ${duration.toFixed(2)}ms (max: ${maxDuration}ms)`
      );
    }
  }
}
