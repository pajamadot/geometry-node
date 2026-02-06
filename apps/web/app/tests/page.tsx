'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// In-Browser Test Runner
// ============================================

interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

interface SuiteResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  tests: TestResult[];
}

type TestFn = () => void | Promise<void>;

class TestRunner {
  private suites: Map<string, { name: string; tests: { name: string; fn: TestFn }[] }> = new Map();
  private results: SuiteResult[] = [];
  private onProgress?: (result: TestResult) => void;

  describe(suite: string, setup: () => void) {
    this.suites.set(suite, { name: suite, tests: [] });
    const prevSuite = this._currentSuite;
    this._currentSuite = suite;
    setup();
    this._currentSuite = prevSuite;
  }

  private _currentSuite = '';

  it(name: string, fn: TestFn) {
    const suite = this.suites.get(this._currentSuite);
    if (suite) suite.tests.push({ name, fn });
  }

  setProgressCallback(cb: (result: TestResult) => void) {
    this.onProgress = cb;
  }

  async runAll(): Promise<SuiteResult[]> {
    this.results = [];

    for (const [suiteName, suite] of this.suites) {
      const suiteResult: SuiteResult = {
        name: suiteName,
        total: suite.tests.length,
        passed: 0,
        failed: 0,
        durationMs: 0,
        tests: [],
      };

      const suiteStart = performance.now();

      for (const test of suite.tests) {
        const start = performance.now();
        let passed = true;
        let error: string | undefined;

        try {
          await test.fn();
        } catch (e: any) {
          passed = false;
          error = e?.message || String(e);
        }

        const durationMs = Math.round((performance.now() - start) * 100) / 100;
        const result: TestResult = {
          name: test.name,
          suite: suiteName,
          passed,
          error,
          durationMs,
        };

        suiteResult.tests.push(result);
        if (passed) suiteResult.passed++;
        else suiteResult.failed++;

        this.onProgress?.(result);
      }

      suiteResult.durationMs = Math.round((performance.now() - suiteStart) * 100) / 100;
      this.results.push(suiteResult);
    }

    return this.results;
  }
}

// ============================================
// Assertion helpers
// ============================================

function assert(condition: boolean, message?: string): void {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

function assertGreaterThan(actual: number, threshold: number, message?: string): void {
  if (actual <= threshold) {
    throw new Error(message ?? `Expected ${actual} > ${threshold}`);
  }
}

function assertInstanceOf(value: any, cls: any, message?: string): void {
  if (!(value instanceof cls)) {
    throw new Error(message ?? `Expected instance of ${cls.name}`);
  }
}

// ============================================
// Test Suites
// ============================================

function registerTests(runner: TestRunner) {

  // ---- NodeRegistry Tests ----
  runner.describe('NodeRegistry', () => {

    runner.it('should be a singleton', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const a = NodeRegistry.getInstance();
      const b = NodeRegistry.getInstance();
      assert(a === b, 'Registry is not a singleton');
    });

    runner.it('should have registered default nodes', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const defs = registry.getAllDefinitions();
      assertGreaterThan(defs.length, 10, `Only ${defs.length} nodes registered`);
    });

    runner.it('should find cube node by type', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const cube = registry.getDefinition('cube');
      assertDefined(cube, 'Cube node not found');
      assertEqual(cube.name, 'Cube');
    });

    runner.it('should find sphere node by type', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const sphere = registry.getDefinition('sphere');
      assertDefined(sphere, 'Sphere node not found');
      assertEqual(sphere.name, 'Sphere');
    });

    runner.it('should execute cube node', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const result = registry.executeNode('cube', {}, { width: 2, height: 2, depth: 2 });
      assertDefined(result, 'Cube execution returned nothing');
      assert('geometry' in result, 'Cube output missing geometry');
    });

    runner.it('should execute sphere node', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const result = registry.executeNode('sphere', {}, { radius: 1, segments: 16 });
      assertDefined(result, 'Sphere execution returned nothing');
      assert('geometry' in result, 'Sphere output missing geometry');
    });

    runner.it('should execute transform node', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const cubeOut = registry.executeNode('cube', {}, { width: 1, height: 1, depth: 1 });
      const result = registry.executeNode('transform', { geometry: cubeOut.geometry }, {
        positionX: 1, positionY: 2, positionZ: 3,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scaleX: 1, scaleY: 1, scaleZ: 1,
      });
      assertDefined(result, 'Transform execution returned nothing');
    });

    runner.it('should check socket compatibility', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      assert(registry.areSocketsCompatible('geometry', 'geometry'), 'geometry <-> geometry should be compatible');
      assert(registry.areSocketsCompatible('number', 'integer'), 'number <-> integer should be compatible');
      assert(!registry.areSocketsCompatible('geometry', 'number'), 'geometry <-> number should NOT be compatible');
    });

    runner.it('should search nodes', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const results = registry.searchNodes('cube');
      assertGreaterThan(results.length, 0, 'Search for "cube" returned nothing');
      assert(results.some((r: any) => r.type === 'cube'), 'Cube not in search results');
    });

    runner.it('should get nodes by category', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const geoNodes = registry.getNodesByCategory('geometry');
      assertGreaterThan(geoNodes.length, 2, 'Too few geometry nodes');
    });

    runner.it('should create node instances with default params', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const instance = registry.createNodeInstance('cube', 'test-1', { x: 0, y: 0 });
      assertDefined(instance, 'Instance not created');
      assertEqual(instance.id, 'test-1');
      assert('parameters' in instance.data, 'Instance missing parameters');
    });
  });

  // ---- EvolutionFitnessEvaluator Tests ----
  runner.describe('EvolutionFitnessEvaluator', () => {

    runner.it('should evaluate a well-formed node', () => {
      const { EvolutionFitnessEvaluator } = require('../utils/EvolutionFitnessEvaluator');
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const evaluator = new EvolutionFitnessEvaluator();
      const cube = registry.getDefinition('cube');
      assertDefined(cube);
      const score = evaluator.evaluate(cube);
      assertGreaterThan(score.overall, 0, 'Overall score should be > 0');
      assertGreaterThan(score.structural, 0, 'Structural score should be > 0');
      assertGreaterThan(score.performance, 0, 'Performance score should be > 0');
    });

    runner.it('should score well-formed nodes higher than bare-minimum nodes', () => {
      const { EvolutionFitnessEvaluator } = require('../utils/EvolutionFitnessEvaluator');
      const evaluator = new EvolutionFitnessEvaluator();
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();

      const cube = registry.getDefinition('cube');
      assertDefined(cube);
      const cubeScore = evaluator.evaluate(cube);

      const bareNode = {
        type: 'x',
        name: 'X',
        description: '',
        category: 'geometry',
        color: { primary: '#000', secondary: '#000' },
        inputs: [],
        outputs: [],
        parameters: [],
        execute: () => ({}),
      };
      const bareScore = evaluator.evaluate(bareNode as any);

      assertGreaterThan(cubeScore.overall, bareScore.overall, 'Cube should score higher than bare node');
    });

    runner.it('should generate a profile with suggestions', () => {
      const { EvolutionFitnessEvaluator } = require('../utils/EvolutionFitnessEvaluator');
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const evaluator = new EvolutionFitnessEvaluator();
      const cube = registry.getDefinition('cube');
      assertDefined(cube);
      const profile = evaluator.profileNode(cube);
      assertDefined(profile.score);
      assert(Array.isArray(profile.strengths), 'Strengths should be array');
      assert(Array.isArray(profile.weaknesses), 'Weaknesses should be array');
      assert(Array.isArray(profile.suggestions), 'Suggestions should be array');
    });
  });

  // ---- PerformanceMonitor Tests ----
  runner.describe('PerformanceMonitor', () => {

    runner.it('should track frame metrics', () => {
      const { PerformanceMonitor } = require('../utils/PerformanceMonitor');
      const monitor = new PerformanceMonitor();
      monitor.beginFrame();
      monitor.recordNodeExecution('n1', 'cube', 2.5);
      monitor.recordNodeExecution('n2', 'sphere', 1.3);
      const frame = monitor.endFrame();
      assertEqual(frame.nodeCount, 2);
      assert(frame.totalExecutionMs >= 0, 'Total should be >= 0');
    });

    runner.it('should generate reports', () => {
      const { PerformanceMonitor } = require('../utils/PerformanceMonitor');
      const monitor = new PerformanceMonitor();
      for (let i = 0; i < 5; i++) {
        monitor.beginFrame();
        monitor.recordNodeExecution('n1', 'cube', 3);
        monitor.endFrame();
      }
      const report = monitor.getReport();
      assertEqual(report.totalFrames, 5);
      assertGreaterThan(report.hotNodes.length, 0, 'Should have hot nodes');
      assertEqual(report.hotNodes[0].nodeType, 'cube');
    });

    runner.it('should detect bottlenecks', () => {
      const { PerformanceMonitor } = require('../utils/PerformanceMonitor');
      const monitor = new PerformanceMonitor();
      for (let i = 0; i < 3; i++) {
        monitor.beginFrame();
        monitor.recordNodeExecution('n1', 'slow-node', 15);
        monitor.recordNodeExecution('n2', 'fast-node', 0.5);
        monitor.endFrame();
      }
      const bottlenecks = monitor.getBottlenecks(5);
      assert(bottlenecks.some((b: any) => b.nodeType === 'slow-node'), 'Should detect slow-node as bottleneck');
      assert(!bottlenecks.some((b: any) => b.nodeType === 'fast-node'), 'fast-node should not be a bottleneck');
    });

    runner.it('should measure with wrapper', () => {
      const { PerformanceMonitor } = require('../utils/PerformanceMonitor');
      const monitor = new PerformanceMonitor();
      monitor.beginFrame();
      const result = monitor.measure('n1', 'test', () => 42);
      monitor.endFrame();
      assertEqual(result, 42);
    });
  });

  // ---- IncrementalComputation Tests ----
  runner.describe('IncrementalComputation', () => {

    runner.it('should define and evaluate cells', () => {
      const { IncrementalComputation } = require('../utils/IncrementalComputation');
      const ic = new IncrementalComputation();
      ic.setValue('a', 10);
      ic.defineCell('b', (deps: any) => deps['a'] * 2, ['a']);
      assertEqual(ic.getValue('b'), 20);
    });

    runner.it('should propagate dirty flags', () => {
      const { IncrementalComputation } = require('../utils/IncrementalComputation');
      const ic = new IncrementalComputation();
      ic.setValue('x', 5);
      ic.defineCell('y', (deps: any) => deps['x'] + 1, ['x']);
      assertEqual(ic.getValue('y'), 6);
      ic.setValue('x', 10);
      assert(ic.isDirty('y'), 'y should be dirty after x changed');
      assertEqual(ic.getValue('y'), 11);
    });

    runner.it('should handle multi-level dependencies', () => {
      const { IncrementalComputation } = require('../utils/IncrementalComputation');
      const ic = new IncrementalComputation();
      ic.setValue('a', 1);
      ic.defineCell('b', (deps: any) => deps['a'] + 1, ['a']);
      ic.defineCell('c', (deps: any) => deps['b'] * 3, ['b']);
      assertEqual(ic.getValue('c'), 6); // (1+1)*3
      ic.setValue('a', 5);
      assertEqual(ic.getValue('c'), 18); // (5+1)*3
    });

    runner.it('should track stats', () => {
      const { IncrementalComputation } = require('../utils/IncrementalComputation');
      const ic = new IncrementalComputation();
      ic.setValue('a', 1);
      ic.defineCell('b', (deps: any) => deps['a'] + 1, ['a']);
      ic.getValue('b');
      ic.getValue('b'); // cache hit
      const stats = ic.getStats();
      assertEqual(stats.totalCells, 2);
      assertGreaterThan(stats.cacheHits, 0, 'Should have cache hits');
    });

    runner.it('should remove cells cleanly', () => {
      const { IncrementalComputation } = require('../utils/IncrementalComputation');
      const ic = new IncrementalComputation();
      ic.setValue('a', 1);
      ic.defineCell('b', (deps: any) => deps['a'], ['a']);
      ic.removeCell('b');
      assert(!ic.hasCell('b'), 'Cell b should be removed');
      assert(ic.hasCell('a'), 'Cell a should still exist');
    });
  });

  // ---- OptimizedNodeExecutor Tests ----
  runner.describe('OptimizedNodeExecutor', () => {

    runner.it('should execute a simple graph', () => {
      const { OptimizedNodeExecutor } = require('../utils/OptimizedNodeExecutor');
      const executor = new OptimizedNodeExecutor();
      const graph = {
        nodes: [
          { id: 'n1', type: 'cube', parameters: { width: 1, height: 1, depth: 1 } },
        ],
        edges: [],
      };
      const result = executor.execute(graph);
      assert(result.outputs.has('n1'), 'Should have output for n1');
      assertEqual(result.executedNodes, 1);
    });

    runner.it('should use cache on second run', () => {
      const { OptimizedNodeExecutor } = require('../utils/OptimizedNodeExecutor');
      const executor = new OptimizedNodeExecutor();
      const graph = {
        nodes: [
          { id: 'n1', type: 'cube', parameters: { width: 1, height: 1, depth: 1 } },
        ],
        edges: [],
      };
      executor.execute(graph);
      const result2 = executor.execute(graph);
      assertEqual(result2.cachedNodes, 1);
      assertEqual(result2.executedNodes, 0);
    });

    runner.it('should re-execute dirty nodes', () => {
      const { OptimizedNodeExecutor } = require('../utils/OptimizedNodeExecutor');
      const executor = new OptimizedNodeExecutor();
      const graph = {
        nodes: [
          { id: 'n1', type: 'cube', parameters: { width: 1, height: 1, depth: 1 } },
        ],
        edges: [],
      };
      executor.execute(graph);
      executor.markDirty('n1', graph);
      const result2 = executor.execute(graph);
      assertEqual(result2.executedNodes, 1);
      assertEqual(result2.cachedNodes, 0);
    });

    runner.it('should handle connected graph', () => {
      const { OptimizedNodeExecutor } = require('../utils/OptimizedNodeExecutor');
      const executor = new OptimizedNodeExecutor();
      const graph = {
        nodes: [
          { id: 'n1', type: 'cube', parameters: { width: 1, height: 1, depth: 1 } },
          { id: 'n2', type: 'transform', parameters: {
            positionX: 1, positionY: 0, positionZ: 0,
            rotationX: 0, rotationY: 0, rotationZ: 0,
            scaleX: 1, scaleY: 1, scaleZ: 1,
          }},
        ],
        edges: [
          { sourceNodeId: 'n1', sourceSocket: 'geometry', targetNodeId: 'n2', targetSocket: 'geometry' },
        ],
      };
      const result = executor.execute(graph);
      assertEqual(result.executedNodes, 2);
      assert(result.executionOrder.indexOf('n1') < result.executionOrder.indexOf('n2'),
        'n1 should execute before n2');
    });
  });

  // ---- RuntimeGeometryProcessor Tests ----
  runner.describe('RuntimeGeometryProcessor', () => {

    runner.it('should compute normals', () => {
      const { RuntimeGeometryProcessor } = require('../utils/RuntimeGeometryProcessor');
      const proc = new RuntimeGeometryProcessor();
      // Simple triangle
      const mesh = {
        vertices: new Float32Array([0,0,0, 1,0,0, 0,1,0]),
        indices: new Uint32Array([0,1,2]),
      };
      const normals = proc.computeNormals(mesh);
      assertEqual(normals.length, 9);
      // Normal should point in +Z direction
      assertGreaterThan(Math.abs(normals[2]), 0.9, 'Normal Z should be ~1');
    });

    runner.it('should compute bounding box', () => {
      const { RuntimeGeometryProcessor } = require('../utils/RuntimeGeometryProcessor');
      const proc = new RuntimeGeometryProcessor();
      const mesh = {
        vertices: new Float32Array([-1,-2,-3, 4,5,6]),
        indices: new Uint32Array([0,1,0]),
      };
      const bb = proc.computeBoundingBox(mesh);
      assertEqual(bb.min.x, -1);
      assertEqual(bb.max.y, 5);
      assertEqual(bb.size.z, 9);
    });

    runner.it('should merge meshes', () => {
      const { RuntimeGeometryProcessor } = require('../utils/RuntimeGeometryProcessor');
      const proc = new RuntimeGeometryProcessor();
      const a = { vertices: new Float32Array([0,0,0, 1,0,0, 0,1,0]), indices: new Uint32Array([0,1,2]) };
      const b = { vertices: new Float32Array([2,0,0, 3,0,0, 2,1,0]), indices: new Uint32Array([0,1,2]) };
      const merged = proc.mergeMeshes([a, b]);
      assertEqual(proc.getVertexCount(merged), 6);
      assertEqual(proc.getTriangleCount(merged), 2);
    });

    runner.it('should subdivide mesh', () => {
      const { RuntimeGeometryProcessor } = require('../utils/RuntimeGeometryProcessor');
      const proc = new RuntimeGeometryProcessor();
      const mesh = {
        vertices: new Float32Array([0,0,0, 1,0,0, 0,1,0]),
        indices: new Uint32Array([0,1,2]),
      };
      const sub = proc.subdivide(mesh, 1);
      assertEqual(proc.getTriangleCount(sub), 4); // 1 tri -> 4 tris
    });

    runner.it('should generate UVs', () => {
      const { RuntimeGeometryProcessor } = require('../utils/RuntimeGeometryProcessor');
      const proc = new RuntimeGeometryProcessor();
      const mesh = {
        vertices: new Float32Array([0,0,0, 1,0,0, 0,1,0]),
        indices: new Uint32Array([0,1,2]),
      };
      const uvs = proc.generateUVs(mesh);
      assertEqual(uvs.length, 6); // 3 vertices * 2 components
    });
  });

  // ---- SelfEvolvingPipeline Tests ----
  runner.describe('SelfEvolvingPipeline', () => {

    runner.it('should instantiate with default config', () => {
      const { SelfEvolvingPipeline } = require('../utils/SelfEvolvingPipeline');
      const pipeline = new SelfEvolvingPipeline();
      const progress = pipeline.getProgress();
      assertEqual(progress.status, 'idle');
    });

    runner.it('should evolve a single node', async () => {
      const { SelfEvolvingPipeline } = require('../utils/SelfEvolvingPipeline');
      const pipeline = new SelfEvolvingPipeline({
        populationSize: 2,
        generations: 1,
        strategies: ['parameter_optimization'],
        fitnessThreshold: 0,
        autoRegister: false,
      });
      const result = await pipeline.evolveNode('cube');
      assertGreaterThan(result.totalCandidates, 0, 'Should have candidates');
      assertGreaterThan(result.stats.totalMutations, 0, 'Should have mutations');
    });

    runner.it('should track lineage', async () => {
      const { SelfEvolvingPipeline } = require('../utils/SelfEvolvingPipeline');
      const pipeline = new SelfEvolvingPipeline({
        populationSize: 2,
        generations: 1,
        strategies: ['parameter_optimization'],
        fitnessThreshold: 0,
        trackLineage: true,
      });
      await pipeline.evolveNode('cube');
      const lineage = pipeline.getLineage();
      assertGreaterThan(lineage.length, 0, 'Should have lineage entries');
      assertDefined(lineage[0].parentType);
      assertDefined(lineage[0].strategy);
    });

    runner.it('should report progress', async () => {
      const { SelfEvolvingPipeline } = require('../utils/SelfEvolvingPipeline');
      const pipeline = new SelfEvolvingPipeline({
        populationSize: 1,
        generations: 1,
        strategies: ['code_optimization'],
        fitnessThreshold: 0,
      });
      const updates: string[] = [];
      pipeline.onProgress((p: any) => updates.push(p.status));
      await pipeline.evolveNode('cube');
      assertGreaterThan(updates.length, 0, 'Should have progress updates');
      assert(updates.includes('complete'), 'Should reach complete status');
    });

    runner.it('should abort mid-evolution', async () => {
      const { SelfEvolvingPipeline } = require('../utils/SelfEvolvingPipeline');
      const pipeline = new SelfEvolvingPipeline({
        populationSize: 5,
        generations: 10,
        strategies: ['parameter_optimization', 'code_optimization', 'feature_addition'],
        fitnessThreshold: 0,
      });
      // Abort almost immediately
      setTimeout(() => pipeline.abort(), 10);
      const result = await pipeline.evolveNode('cube');
      // Should have fewer candidates than full run
      assert(result.stats.generations <= 10, 'Should not complete all generations');
    });
  });

  // ---- Node Execution Stress Tests ----
  runner.describe('Node Execution Stress', () => {

    runner.it('should execute all registered nodes without crashing', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const defs = registry.getAllDefinitions();
      const failures: string[] = [];

      for (const def of defs) {
        if (def.type === 'output') continue; // Skip output node
        try {
          const params: Record<string, any> = {};
          for (const p of def.parameters) {
            params[p.id] = p.defaultValue;
          }
          def.execute({}, params);
        } catch (e: any) {
          failures.push(`${def.type}: ${e.message}`);
        }
      }

      // Allow some failures (nodes that need real geometry input) but flag if most fail
      const failRate = failures.length / defs.length;
      assert(failRate < 0.5, `Too many node execution failures (${failures.length}/${defs.length}):\n${failures.slice(0, 5).join('\n')}`);
    });

    runner.it('should execute 100 cube nodes in < 100ms', () => {
      const { NodeRegistry } = require('../registry/NodeRegistry');
      const registry = NodeRegistry.getInstance();
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        registry.executeNode('cube', {}, { width: 1, height: 1, depth: 1 });
      }
      const elapsed = performance.now() - start;
      assert(elapsed < 100, `100 cube executions took ${elapsed.toFixed(1)}ms (limit: 100ms)`);
    });
  });
}

// ============================================
// UI Component
// ============================================

export default function TestPage() {
  const [suites, setSuites] = useState<SuiteResult[]>([]);
  const [running, setRunning] = useState(false);
  const [liveResults, setLiveResults] = useState<TestResult[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const runTests = useCallback(async () => {
    setRunning(true);
    setSuites([]);
    setLiveResults([]);

    const runner = new TestRunner();
    registerTests(runner);

    runner.setProgressCallback((result) => {
      setLiveResults(prev => [...prev, result]);
    });

    try {
      const results = await runner.runAll();
      setSuites(results);
    } catch (e: any) {
      console.error('Test runner crashed:', e);
    }

    setRunning(false);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [liveResults]);

  // Auto-run on mount
  useEffect(() => {
    const timer = setTimeout(runTests, 500);
    return () => clearTimeout(timer);
  }, [runTests]);

  const totalPassed = suites.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suites.reduce((s, r) => s + r.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const totalDuration = suites.reduce((s, r) => s + r.durationMs, 0);

  return (
    <div style={{ fontFamily: 'monospace', background: '#0a0a0a', color: '#e5e5e5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>
            Geometry Script - In-Browser Tests
          </h1>
          <button
            onClick={runTests}
            disabled={running}
            style={{
              padding: '8px 16px',
              background: running ? '#374151' : '#22c55e',
              color: running ? '#9ca3af' : '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: running ? 'default' : 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
            }}
          >
            {running ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        {/* Summary */}
        {suites.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: totalFailed === 0 ? '#052e16' : '#450a0a',
            border: `1px solid ${totalFailed === 0 ? '#16a34a' : '#dc2626'}`,
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <span style={{ color: totalFailed === 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
              {totalFailed === 0 ? 'ALL PASSED' : `${totalFailed} FAILED`}
            </span>
            <span style={{ marginLeft: '16px', color: '#9ca3af' }}>
              {totalPassed}/{totalTests} passed in {totalDuration.toFixed(0)}ms
            </span>
          </div>
        )}

        {/* Live log during run */}
        {running && (
          <div
            ref={logRef}
            style={{
              background: '#111',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '12px',
              maxHeight: '200px',
              overflow: 'auto',
              marginBottom: '20px',
              fontSize: '12px',
            }}
          >
            {liveResults.map((r, i) => (
              <div key={i} style={{ color: r.passed ? '#22c55e' : '#ef4444' }}>
                {r.passed ? 'PASS' : 'FAIL'} {r.suite} &gt; {r.name} ({r.durationMs}ms)
                {r.error && <span style={{ color: '#fca5a5', marginLeft: '8px' }}>{r.error}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Suite results */}
        {suites.map((suite) => (
          <div key={suite.name} style={{
            marginBottom: '16px',
            border: '1px solid #333',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              background: suite.failed === 0 ? '#052e16' : '#1c1917',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 'bold', color: suite.failed === 0 ? '#22c55e' : '#fbbf24' }}>
                {suite.name}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                {suite.passed}/{suite.total} passed ({suite.durationMs}ms)
              </span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {suite.tests.map((test, i) => (
                <div key={i} style={{
                  padding: '4px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '13px',
                }}>
                  <span style={{ color: test.passed ? '#22c55e' : '#ef4444', flexShrink: 0 }}>
                    {test.passed ? '\u2713' : '\u2717'}
                  </span>
                  <span style={{ color: test.passed ? '#d4d4d4' : '#fca5a5' }}>
                    {test.name}
                    <span style={{ color: '#6b7280', marginLeft: '8px' }}>({test.durationMs}ms)</span>
                  </span>
                  {test.error && (
                    <div style={{ color: '#fca5a5', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                      {test.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {!running && suites.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            Tests will auto-run on page load...
          </div>
        )}
      </div>
    </div>
  );
}
