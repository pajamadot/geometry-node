

# End-to-End Testing Guide

## Overview

Comprehensive E2E test suite for the geometry-script framework using Playwright. These tests validate the complete user journey from UI interactions through 3D rendering to file exports.

## Architecture

### What Makes This Different from Typical E2E Tests

Unlike traditional web app E2E tests that focus on forms and navigation, geometry framework E2E tests must validate:

1. **Visual Correctness** - 3D rendering must be pixel-perfect
2. **Computational Accuracy** - Geometry operations must produce correct vertex data
3. **Performance** - Real-time 3D rendering requires 30+ FPS
4. **File Format Compatibility** - Exports must work with external 3D tools
5. **WebGL Functionality** - GPU acceleration and shader compilation
6. **AI Integration** - Streaming responses and node generation

## Test Structure

```
apps/web/app/__tests__/e2e/
├── workflows/                    # User journey tests
│   ├── basic-geometry-creation.spec.ts
│   ├── ai-generation.spec.ts
│   └── export-import.spec.ts
├── visual/                       # Visual regression tests
│   └── primitives-rendering.spec.ts
├── performance/                  # Performance & stress tests
│   └── large-graphs.spec.ts
└── helpers/                      # Test utilities
    └── editor-helpers.ts
```

## Test Categories

### 1. Workflow Tests (User Journeys)

**Basic Geometry Creation** (28 tests)
- Creating primitive nodes (Box, Sphere, Cylinder, Torus, Plane)
- Modifying parameters
- Connecting nodes in pipelines
- Complete workflows (Box → Subdivide → Displace → Color)
- Node deletion, undo/redo, duplication
- Viewport interactions (zoom, pan, rotate)
- Keyboard shortcuts
- Project save/load

**AI Generation** (19 tests)
- Single node generation from prompts
- Complete graph generation
- Complex multi-step prompts
- Scene generation with multiple objects
- Streaming responses
- Error handling
- Model selection
- Cancellation

**Export/Import** (22 tests)
- GLTF export/import with validation
- OBJ, STL, PLY format exports
- Complex pipeline exports
- Batch exports to multiple formats
- Round-trip export/import verification
- External tool compatibility
- Compression and optimization options

### 2. Visual Regression Tests (20 tests)

**Primitive Rendering**
- Box, Sphere, Cylinder, Torus, Plane consistency
- Operations (subdivide, displace, twist, color)
- Multiple objects in scene
- Camera angle variations
- Lighting setups
- Material variations

**Visual Assertions**
```typescript
// Example: Visual snapshot with tolerance
await expect(canvas).toHaveScreenshot('box-default.png', {
  maxDiffPixels: 100,      // Allow 100 pixels difference
  threshold: 0.2,          // 20% tolerance
});
```

### 3. Performance Tests (15 tests)

**Large Node Graphs**
- 50+ nodes in graph
- Deeply connected pipelines (20 nodes in sequence)
- Complex branching graphs
- FPS maintenance (30+ target)
- Memory profiling
- Stress testing (100 nodes)

**High-Poly Geometry**
- High-resolution spheres (128x96 segments)
- Multiple subdivision levels
- Complex displacement operations
- Viewport interaction performance

**WebGL Performance**
- Draw call optimization
- Shader compilation speed
- Memory leak detection

## Helper Classes

### EditorHelpers

Provides high-level interactions with the editor:

```typescript
const editor = new EditorHelpers(page);

// Navigation
await editor.navigateToEditor();

// Node operations
await editor.createNode('Box', { x: 100, y: 100 });
await editor.setNodeParameter('box', 'width', 2);
await editor.connectNodes('box', 'geometry', 'subdivide', 'geometry');

// Execution
await editor.executeGraph();
await editor.waitForGeometryRender();

// Export
const exportPath = await editor.exportGeometry('gltf');

// AI
await editor.generateWithAI('Create a twisted cylinder');

// Performance
await editor.startPerformanceMonitoring();
const metrics = await editor.getPerformanceMetrics();
```

### ValidationHelpers

Validates file formats and output correctness:

```typescript
// Validate GLTF structure
const validation = await ValidationHelpers.validateGLTF(filePath);
expect(validation.valid).toBe(true);

// Validate OBJ structure
const objValidation = await ValidationHelpers.validateOBJ(filePath);
```

### PerformanceHelpers

Measures and validates performance:

```typescript
const { result, duration } = await PerformanceHelpers.measureOperation(
  async () => await editor.executeGraph(),
  'Graph Execution'
);

PerformanceHelpers.assertPerformance(duration, 5000, 'Graph execution');
```

## Prerequisites

### Authentication Setup

E2E tests require Clerk authentication. Before running tests:

1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install
   ```

2. **Configure test credentials** in `.env.test`:
   ```bash
   E2E_CLERK_USER_USERNAME=test@pajamadot.com
   E2E_CLERK_USER_PASSWORD=playwright@pajamadot
   CLERK_PUBLISHABLE_KEY=your_key_here
   CLERK_SECRET_KEY=your_key_here
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium firefox
   ```

📖 **See [QUICK_START_E2E.md](QUICK_START_E2E.md)** for detailed setup instructions

## Running Tests

### Basic Commands

```bash
# Run all E2E tests (authenticated)
npm run test:e2e

# Run specific test file
npx playwright test workflows/basic-geometry-creation.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Watch Mode

```bash
# Watch and rerun on changes
npx playwright test --watch
```

### CI/CD Mode

```bash
# Run with retries and video recording
npx playwright test --retries=2 --video=on

# Generate report
npx playwright show-report
```

## Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './app/__tests__/e2e',
  timeout: 60 * 1000,             // 1 minute per test
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### WebGL Configuration

For CI environments without GPU:

```typescript
launchOptions: {
  args: [
    '--use-gl=swiftshader',      // Software rendering
    '--disable-gpu-sandbox',
    '--enable-webgl',
  ],
}
```

## Visual Regression Testing

### Updating Snapshots

When geometry rendering intentionally changes:

```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update specific test
npx playwright test primitives-rendering.spec.ts --update-snapshots
```

### Snapshot Tolerance

Different systems may render slightly differently:

```typescript
await expect(canvas).toHaveScreenshot('image.png', {
  maxDiffPixels: 100,    // Allow 100 pixel differences
  threshold: 0.2,        // 20% color difference tolerance
});
```

## Performance Benchmarks

### Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Average FPS | >30 | >20 |
| Minimum FPS | >20 | >15 |
| Memory Growth | <100MB | <200MB |
| Node Creation | <1s | <2s |
| Graph Execution | <5s | <10s |
| Export Time | <3s | <5s |

### Measuring Performance

```typescript
test('should maintain 30+ FPS', async ({ page }) => {
  await editor.startPerformanceMonitoring();

  // Perform operations
  await editor.createNode('Sphere');
  await editor.executeGraph();

  const metrics = await editor.getPerformanceMetrics();

  expect(metrics.avgFPS).toBeGreaterThan(30);
  expect(metrics.minFPS).toBeGreaterThan(20);
  expect(metrics.maxMemory).toBeLessThan(200 * 1024 * 1024);
});
```

## File Format Validation

### GLTF Validation

```typescript
const validation = await ValidationHelpers.validateGLTF(exportPath);

// Check required fields
expect(validation.valid).toBe(true);
expect(validation.errors).toHaveLength(0);

// Verify structure
const gltf = JSON.parse(await fs.readFile(exportPath, 'utf8'));
expect(gltf.asset.version).toBe('2.0');
expect(gltf.meshes).toBeDefined();
expect(gltf.accessors).toBeDefined();
expect(gltf.bufferViews).toBeDefined();
```

### External Tool Compatibility

Tests ensure exports work with:
- Blender (GLTF, OBJ, STL, PLY)
- Unity (GLTF)
- Unreal Engine (GLTF)
- Three.js (GLTF)
- 3D printing software (STL)

## AI Integration Testing

### Testing AI Responses

```typescript
test('should generate from prompt', async ({ page }) => {
  await editor.generateWithAI('Create a twisted cylinder');

  // Wait for streaming completion
  await editor.waitForAIGeneration(30000);

  // Verify nodes created
  const nodes = await editor.getNodesInGraph();
  expect(nodes).toContain('cylinder');
  expect(nodes).toContain('twist');

  // Verify connections
  expect(await editor.getEdgeCount()).toBeGreaterThan(0);
});
```

### Streaming Validation

```typescript
test('should stream responses', async ({ page }) => {
  await editor.openAIDialog();
  await page.fill('[data-testid="ai-prompt-input"]', 'Create sphere');
  await page.click('[data-testid="ai-generate-submit"]');

  // Verify streaming indicator
  await expect(page.locator('[data-testid="ai-streaming"]')).toBeVisible();

  // Wait for completion
  await editor.waitForAIGeneration();
});
```

## Debugging Tests

### Debug Mode

```bash
# Run with debug inspector
npx playwright test --debug

# Debug specific test
npx playwright test --debug workflows/basic-geometry-creation.spec.ts:15
```

### Screenshots and Videos

```bash
# Take screenshots on failure
npx playwright test --screenshot=on

# Record videos
npx playwright test --video=on
```

### Trace Viewer

```bash
# Generate trace
npx playwright test --trace=on

# View trace
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Clean slate for each test
  await editor.navigateToEditor();
  await editor.clearGraph();
});
```

### 2. Deterministic Tests

Use fixed seeds and values:

```typescript
await editor.setNodeParameter('displace', 'seed', 42);  // Fixed seed
```

### 3. Appropriate Timeouts

```typescript
// Geometry operations may take time
await editor.waitForGeometryRender({ timeout: 10000 });

// AI generation can be slow
await editor.waitForAIGeneration(30000);
```

### 4. Meaningful Assertions

```typescript
// Bad: Too vague
expect(stats.vertices).toBeGreaterThan(0);

// Good: Specific expectation
expect(stats.vertices).toBe(24);  // Box has 24 vertices

// Better: Range for non-deterministic operations
expect(stats.vertices).toBeGreaterThan(1000);
expect(stats.vertices).toBeLessThan(2000);
```

### 5. Error Context

```typescript
test('should handle errors', async ({ page }) => {
  await editor.createNode('Subdivide');  // No input

  await editor.executeGraph();

  // Verify helpful error message
  const error = page.locator('[data-testid="execution-error"]');
  await expect(error).toBeVisible();
  await expect(error).toContainText('missing input');
});
```

## Troubleshooting

### WebGL Not Available

```typescript
test.beforeEach(async ({ page }) => {
  const hasWebGL = await editor.checkWebGLAvailable();
  if (!hasWebGL) {
    test.skip('WebGL not available in this environment');
  }
});
```

### Timing Issues

```typescript
// Use explicit waits instead of fixed timeouts
await editor.waitForGeometryRender();  // Good
await page.waitForTimeout(1000);       // Avoid unless necessary
```

### Flaky Tests

```typescript
// Add retries for flaky tests
test.describe.configure({ retries: 2 });

// Or specific test
test('flaky test', async ({ page }) => {
  test.fixme();  // Mark as known issue
  // test code
});
```

## Test Statistics

- **Total E2E Tests**: 104
- **Workflow Tests**: 69
- **Visual Tests**: 20
- **Performance Tests**: 15
- **Average Execution Time**: ~5 minutes (parallel)
- **Coverage**: All critical user paths

## Future Enhancements

- [ ] Add VR/AR E2E tests with XR emulation
- [ ] Collaboration multi-user E2E tests
- [ ] Mobile device testing
- [ ] Accessibility testing
- [ ] Load testing with K6
- [ ] Visual diff reporting dashboard
- [ ] Performance regression tracking

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Regression Testing Best Practices](https://playwright.dev/docs/test-snapshots)
- [WebGL Testing Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [Three.js Testing Patterns](https://threejs.org/docs/)
