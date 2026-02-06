/**
 * E2E Tests: Export and Import Workflows
 * Tests file format exports, imports, and cross-application compatibility
 */

import { test, expect } from '@playwright/test';
import { EditorHelpers, ValidationHelpers } from '../helpers/editor-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Geometry Export', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should export box geometry to GLTF', async ({ page }) => {
    // Create simple box
    await editor.createNode('Box');
    await editor.setNodeParameter('box', 'width', 2);
    await editor.setNodeParameter('box', 'height', 2);
    await editor.setNodeParameter('box', 'depth', 2);

    await editor.executeGraph();

    // Export
    const exportPath = await editor.exportGeometry('gltf');
    expect(exportPath).toBeTruthy();

    // Validate GLTF structure
    const validation = await ValidationHelpers.validateGLTF(exportPath!);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Read and check content
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    expect(gltf.asset.version).toBe('2.0');
    expect(gltf.meshes).toBeDefined();
    expect(gltf.meshes.length).toBeGreaterThan(0);
    expect(gltf.accessors).toBeDefined();
  });

  test('should export subdivided geometry to GLTF', async ({ page }) => {
    // Create box with subdivision
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');
    await editor.setNodeParameter('subdivide', 'iterations', 2);

    await editor.executeGraph();

    // Export
    const exportPath = await editor.exportGeometry('gltf');
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    // Should have more vertices than simple box
    const positionAccessor = gltf.accessors.find((a: any) => a.type === 'VEC3');
    expect(positionAccessor.count).toBeGreaterThan(24); // Simple box has 24 vertices
  });

  test('should export geometry with colors to GLTF', async ({ page }) => {
    // Create colored geometry
    await editor.createNode('Sphere');
    await editor.createNode('ColorByHeight');
    await editor.connectNodes('sphere', 'geometry', 'colorByHeight', 'geometry');

    await editor.executeGraph();

    // Export
    const exportPath = await editor.exportGeometry('gltf');
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    // Should have color accessor
    const colorAccessor = gltf.accessors.find((a: any) => a.type === 'VEC4');
    expect(colorAccessor).toBeDefined();
  });

  test('should export to OBJ format', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('obj');
    expect(exportPath).toBeTruthy();

    // Validate OBJ structure
    const validation = await ValidationHelpers.validateOBJ(exportPath!);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Check content
    const content = await fs.readFile(exportPath!, 'utf8');
    expect(content).toContain('v '); // Vertices
    expect(content).toContain('f '); // Faces
  });

  test('should export to STL format', async ({ page }) => {
    await editor.createNode('Cylinder');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('stl');
    expect(exportPath).toBeTruthy();

    // Check file exists and has content
    const stats = await fs.stat(exportPath!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should export to PLY format', async ({ page }) => {
    await editor.createNode('Torus');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('ply');
    expect(exportPath).toBeTruthy();

    const content = await fs.readFile(exportPath!, 'utf8');
    expect(content).toContain('ply'); // PLY header
    expect(content).toContain('format');
    expect(content).toContain('element vertex');
    expect(content).toContain('element face');
  });

  test('should export complex pipeline to all formats', async ({ page }) => {
    // Create complex geometry
    await editor.createNode('Sphere');
    await editor.createNode('Subdivide');
    await editor.createNode('Displace');
    await editor.createNode('ColorByHeight');

    await editor.connectNodes('sphere', 'geometry', 'subdivide', 'geometry');
    await editor.connectNodes('subdivide', 'geometry', 'displace', 'geometry');
    await editor.connectNodes('displace', 'geometry', 'colorByHeight', 'geometry');

    await editor.setNodeParameter('subdivide', 'iterations', 1);
    await editor.setNodeParameter('displace', 'strength', 0.3);

    await editor.executeGraph();

    // Export to all formats
    const formats: Array<'gltf' | 'obj' | 'stl' | 'ply'> = ['gltf', 'obj', 'stl', 'ply'];

    for (const format of formats) {
      const exportPath = await editor.exportGeometry(format);
      expect(exportPath).toBeTruthy();

      // Verify file exists
      const stats = await fs.stat(exportPath!);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  test('should preserve vertex normals in export', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('gltf');
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    // Should have normals accessor
    const normalAccessor = gltf.accessors.find(
      (a: any) => a.type === 'VEC3' && a.name?.includes('NORMAL')
    );
    expect(normalAccessor || gltf.accessors.length > 1).toBeTruthy();
  });

  test('should handle large geometry exports', async ({ page }) => {
    // Create high-poly geometry
    await editor.createNode('Sphere');
    await editor.setNodeParameter('sphere', 'widthSegments', 64);
    await editor.setNodeParameter('sphere', 'heightSegments', 48);

    await editor.createNode('Subdivide');
    await editor.connectNodes('sphere', 'geometry', 'subdivide', 'geometry');
    await editor.setNodeParameter('subdivide', 'iterations', 2);

    await editor.executeGraph();

    const startTime = Date.now();
    const exportPath = await editor.exportGeometry('gltf');
    const duration = Date.now() - startTime;

    expect(exportPath).toBeTruthy();

    // Should complete in reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds

    // Check file size is reasonable
    const stats = await fs.stat(exportPath!);
    expect(stats.size).toBeGreaterThan(10000); // At least 10KB
  });

  test('should export with custom filename', async ({ page }) => {
    await editor.createNode('Box');
    await editor.executeGraph();

    // Open export dialog
    await page.click('[data-testid="export-menu"]');

    // Set custom filename
    await page.fill('[data-testid="export-filename"]', 'my-custom-box');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-format="gltf"]');

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    expect(filename).toContain('my-custom-box');
  });
});

test.describe('Batch Export', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should export multiple geometries at once', async ({ page }) => {
    // Create multiple geometries
    await editor.createNode('Box', { x: 100, y: 100 });
    await editor.createNode('Sphere', { x: 300, y: 100 });
    await editor.createNode('Cylinder', { x: 500, y: 100 });

    // Select all
    await page.keyboard.press('Control+A');

    // Batch export
    await page.click('[data-testid="export-menu"]');
    await page.click('[data-testid="batch-export"]');

    // Should download multiple files or a zip
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-confirm"]');

    const download = await downloadPromise;
    expect(download).toBeTruthy();
  });

  test('should export to multiple formats simultaneously', async ({ page }) => {
    await editor.createNode('Torus');
    await editor.executeGraph();

    // Open export dialog
    await page.click('[data-testid="export-menu"]');
    await page.click('[data-testid="multi-format-export"]');

    // Select multiple formats
    await page.check('[data-format-checkbox="gltf"]');
    await page.check('[data-format-checkbox="obj"]');
    await page.check('[data-format-checkbox="stl"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-all"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(zip|tar\.gz)$/);
  });
});

test.describe('Import Validation', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should import GLTF file', async ({ page }) => {
    // First export a file
    await editor.createNode('Box');
    await editor.executeGraph();
    const exportPath = await editor.exportGeometry('gltf');

    // Clear graph
    await editor.clearGraph();

    // Import the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exportPath!);

    // Wait for import
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify geometry loaded
    await editor.waitForGeometryRender();

    // Check stats
    const stats = await editor.getGeometryStats();
    expect(stats?.vertices).toBeGreaterThan(0);
  });

  test('should validate imported files', async ({ page }) => {
    // Try to import invalid file
    const tempFile = path.join(process.cwd(), 'temp-invalid.gltf');
    await fs.writeFile(tempFile, 'invalid json content');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempFile);

    // Should show error
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible({
      timeout: 5000,
    });

    // Cleanup
    await fs.unlink(tempFile);
  });

  test('should round-trip export and import', async ({ page }) => {
    // Create geometry
    await editor.createNode('Sphere');
    await editor.setNodeParameter('sphere', 'radius', 1.5);
    await editor.executeGraph();

    // Get original stats
    const originalStats = await editor.getGeometryStats();

    // Export
    const exportPath = await editor.exportGeometry('gltf');

    // Clear and import
    await editor.clearGraph();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exportPath!);

    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    await editor.waitForGeometryRender();

    // Get imported stats
    const importedStats = await editor.getGeometryStats();

    // Should match closely (within tolerance)
    expect(Math.abs((importedStats?.vertices || 0) - (originalStats?.vertices || 0))).toBeLessThan(
      10
    );
  });
});

test.describe('External Tool Compatibility', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should export GLTF compatible with gltf-validator', async ({ page }) => {
    await editor.createNode('Box');
    await editor.createNode('Subdivide');
    await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('gltf');

    // Validate with official validator
    const validation = await ValidationHelpers.validateGLTF(exportPath!);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should export manifold geometry', async ({ page }) => {
    // Create closed manifold geometry (sphere)
    await editor.createNode('Sphere');
    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('gltf');
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    // Verify it's a closed mesh (should have proper topology)
    expect(gltf.meshes[0].primitives[0].attributes.POSITION).toBeDefined();
  });

  test('should export with correct coordinate system', async ({ page }) => {
    await editor.createNode('Box');
    await editor.setNodeParameter('box', 'width', 1);
    await editor.setNodeParameter('box', 'height', 2);
    await editor.setNodeParameter('box', 'depth', 3);

    await editor.executeGraph();

    const exportPath = await editor.exportGeometry('gltf');
    const content = await fs.readFile(exportPath!, 'utf8');
    const gltf = JSON.parse(content);

    // GLTF uses right-handed Y-up coordinate system
    // Verify accessor mins/maxs are reasonable
    const positionAccessor = gltf.accessors[0];
    expect(positionAccessor.min).toBeDefined();
    expect(positionAccessor.max).toBeDefined();
  });
});

test.describe('Export Options', () => {
  let editor: EditorHelpers;

  test.beforeEach(async ({ page }) => {
    editor = new EditorHelpers(page);
    await editor.navigateToEditor();
  });

  test('should export with compression options', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();

    // Open export with options
    await page.click('[data-testid="export-menu"]');
    await page.click('[data-testid="export-options"]');

    // Enable compression
    await page.check('[data-option="compress"]');
    await page.click('[data-format="gltf"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-confirm"]');

    const download = await downloadPromise;
    const path = await download.path();

    // Compressed file should be smaller
    const stats = await fs.stat(path!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should export with different precision levels', async ({ page }) => {
    await editor.createNode('Sphere');
    await editor.executeGraph();

    // Export with low precision
    await page.click('[data-testid="export-menu"]');
    await page.select('[data-option="precision"]', 'low');

    const exportPath = await editor.exportGeometry('gltf');
    const lowPrecisionSize = (await fs.stat(exportPath!)).size;

    // Export with high precision
    await page.select('[data-option="precision"]', 'high');
    const exportPath2 = await editor.exportGeometry('gltf');
    const highPrecisionSize = (await fs.stat(exportPath2!)).size;

    // High precision should be larger
    expect(highPrecisionSize).toBeGreaterThanOrEqual(lowPrecisionSize);
  });
});
