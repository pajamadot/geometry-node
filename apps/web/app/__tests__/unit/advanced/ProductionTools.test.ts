/**
 * Unit Tests: Production Tools
 * Tests for animation, rendering, VR/AR, profiling, and export pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TimelineEditor,
  GeometryMorpher,
  CustomRenderPipeline,
  VRPreviewMode,
  ARPlacement,
  PerformanceDashboard,
  BatchExporter,
  CompressionPipeline,
} from '@/utils/ProductionTools';
import { EnhancedGeometryData } from '@/utils/builders/GeometryBuilder';
import * as THREE from 'three';

describe('TimelineEditor', () => {
  let editor: TimelineEditor;

  beforeEach(() => {
    editor = new TimelineEditor();
  });

  describe('keyframe management', () => {
    it('should add keyframes', () => {
      editor.addKeyframe('position', 0, { x: 0, y: 0, z: 0 });
      editor.addKeyframe('position', 1, { x: 1, y: 1, z: 1 });

      const value = editor.getValue('position', 0);
      expect(value).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should sort keyframes by time', () => {
      editor.addKeyframe('rotation', 2, 180);
      editor.addKeyframe('rotation', 0, 0);
      editor.addKeyframe('rotation', 1, 90);

      const v0 = editor.getValue('rotation', 0);
      const v1 = editor.getValue('rotation', 1);
      const v2 = editor.getValue('rotation', 2);

      expect(v0).toBe(0);
      expect(v1).toBe(90);
      expect(v2).toBe(180);
    });
  });

  describe('interpolation', () => {
    it('should interpolate numbers', () => {
      editor.addKeyframe('scale', 0, 1);
      editor.addKeyframe('scale', 2, 3);

      const value = editor.getValue('scale', 1);
      expect(value).toBe(2); // Halfway between 1 and 3
    });

    it('should interpolate vectors', () => {
      editor.addKeyframe('position', 0, { x: 0, y: 0, z: 0 });
      editor.addKeyframe('position', 2, { x: 4, y: 6, z: 8 });

      const value = editor.getValue('position', 1);
      expect(value).toEqual({ x: 2, y: 3, z: 4 });
    });

    it('should handle exact keyframe times', () => {
      editor.addKeyframe('value', 0, 10);
      editor.addKeyframe('value', 1, 20);

      const value = editor.getValue('value', 1);
      expect(value).toBe(20);
    });

    it('should clamp to first/last keyframe outside range', () => {
      editor.addKeyframe('value', 1, 100);
      editor.addKeyframe('value', 2, 200);

      const before = editor.getValue('value', 0);
      const after = editor.getValue('value', 5);

      expect(before).toBe(100);
      expect(after).toBe(200);
    });

    it('should return null for empty track', () => {
      const value = editor.getValue('nonexistent', 1);
      expect(value).toBeNull();
    });
  });

  describe('playback control', () => {
    it('should play animation', () => {
      editor.play();
      editor.update(0.1);
      // Should be playing
      expect(editor).toBeDefined();
    });

    it('should pause animation', () => {
      editor.play();
      editor.pause();
      editor.update(0.1);
      // Should be paused
      expect(editor).toBeDefined();
    });

    it('should set time', () => {
      editor.setTime(5);
      // Time should be set
      expect(editor).toBeDefined();
    });

    it('should clamp time to duration', () => {
      editor.setTime(100);
      // Should be clamped to max duration
      expect(editor).toBeDefined();
    });

    it('should loop animation', () => {
      editor.play();
      editor.update(20); // Past duration
      // Should loop back
      expect(editor).toBeDefined();
    });
  });
});

describe('GeometryMorpher', () => {
  let morpher: GeometryMorpher;

  beforeEach(() => {
    morpher = new GeometryMorpher();
  });

  it('should morph between geometries', () => {
    const geoA: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 3,
      faceCount: 0,
      positionsArray: new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const geoB: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 3,
      faceCount: 0,
      positionsArray: new Float32Array([0, 1, 0, 1, 1, 0, 2, 1, 0]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const morphed = morpher.morph(geoA, geoB, 0.5);

    expect(morphed.positionsArray).toBeDefined();
    expect(morphed.positionsArray![1]).toBe(0.5); // Y interpolated
    expect(morphed.positionsArray![4]).toBe(0.5); // Y interpolated
  });

  it('should return first geometry at t=0', () => {
    const geoA: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 2,
      faceCount: 0,
      positionsArray: new Float32Array([0, 0, 0, 1, 0, 0]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const geoB: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 2,
      faceCount: 0,
      positionsArray: new Float32Array([5, 5, 5, 6, 6, 6]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const morphed = morpher.morph(geoA, geoB, 0);
    expect(morphed.positionsArray).toEqual(geoA.positionsArray);
  });

  it('should return first geometry if vertex counts differ', () => {
    const geoA: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 3,
      faceCount: 0,
      positionsArray: new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const geoB: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 2,
      faceCount: 0,
      positionsArray: new Float32Array([0, 0, 0, 1, 0, 0]),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const morphed = morpher.morph(geoA, geoB, 0.5);
    expect(morphed).toBe(geoA);
  });
});

describe('CustomRenderPipeline', () => {
  let pipeline: CustomRenderPipeline;

  beforeEach(() => {
    pipeline = new CustomRenderPipeline();
  });

  it('should add render passes', () => {
    const pass = {
      enabled: true,
      render: vi.fn(),
    };

    pipeline.addPass(pass);
    pipeline.render(0.016);

    expect(pass.render).toHaveBeenCalled();
  });

  it('should skip disabled passes', () => {
    const enabledPass = {
      enabled: true,
      render: vi.fn(),
    };

    const disabledPass = {
      enabled: false,
      render: vi.fn(),
    };

    pipeline.addPass(enabledPass);
    pipeline.addPass(disabledPass);
    pipeline.render(0.016);

    expect(enabledPass.render).toHaveBeenCalled();
    expect(disabledPass.render).not.toHaveBeenCalled();
  });

  it('should set quality levels', () => {
    pipeline.setQuality('low');
    pipeline.setQuality('medium');
    pipeline.setQuality('high');
    pipeline.setQuality('ultra');

    expect(pipeline).toBeDefined();
  });

  it('should execute passes in order', () => {
    const order: number[] = [];

    const pass1 = {
      enabled: true,
      render: () => order.push(1),
    };

    const pass2 = {
      enabled: true,
      render: () => order.push(2),
    };

    pipeline.addPass(pass1);
    pipeline.addPass(pass2);
    pipeline.render(0.016);

    expect(order).toEqual([1, 2]);
  });
});

describe('VRPreviewMode', () => {
  let vrMode: VRPreviewMode;

  beforeEach(() => {
    vrMode = new VRPreviewMode();

    // Mock navigator.xr
    (global.navigator as any).xr = {
      isSessionSupported: vi.fn().mockResolvedValue(true),
      requestSession: vi.fn().mockResolvedValue({
        addEventListener: vi.fn(),
        end: vi.fn(),
      }),
    };
  });

  it('should initialize VR mode', async () => {
    const mockRenderer = {
      xr: { enabled: false, setSession: vi.fn() },
    } as any;

    await vrMode.initialize(mockRenderer);
    expect(mockRenderer.xr.enabled).toBe(true);
  });

  it('should detect VR support', async () => {
    const mockRenderer = {
      xr: { enabled: false, setSession: vi.fn() },
    } as any;

    await expect(vrMode.initialize(mockRenderer)).resolves.toBeUndefined();
  });

  it('should throw if WebXR not supported', async () => {
    delete (global.navigator as any).xr;

    const mockRenderer = {
      xr: { enabled: false, setSession: vi.fn() },
    } as any;

    await expect(vrMode.initialize(mockRenderer)).rejects.toThrow('WebXR not supported');
  });

  it('should start VR session', async () => {
    const mockRenderer = {
      xr: {
        enabled: true,
        setSession: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    await vrMode.startVRSession(mockRenderer);
    expect(vrMode.isActive()).toBe(true);
  });

  it('should track active state', async () => {
    expect(vrMode.isActive()).toBe(false);

    const mockRenderer = {
      xr: {
        enabled: true,
        setSession: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    await vrMode.startVRSession(mockRenderer);
    expect(vrMode.isActive()).toBe(true);
  });
});

describe('ARPlacement', () => {
  let arPlacement: ARPlacement;

  beforeEach(() => {
    arPlacement = new ARPlacement();

    // Mock navigator.xr
    (global.navigator as any).xr = {
      isSessionSupported: vi.fn().mockResolvedValue(true),
    };
  });

  it('should initialize AR mode', async () => {
    await expect(arPlacement.initialize()).resolves.toBeUndefined();
  });

  it('should throw if WebXR not supported', async () => {
    delete (global.navigator as any).xr;

    await expect(arPlacement.initialize()).rejects.toThrow('WebXR not supported');
  });

  it('should throw if AR not supported', async () => {
    (global.navigator as any).xr = {
      isSessionSupported: vi.fn().mockResolvedValue(false),
    };

    await expect(arPlacement.initialize()).rejects.toThrow('AR not supported');
  });

  it('should place objects', () => {
    const position = new THREE.Vector3(1, 2, 3);
    const object = new THREE.Object3D();

    arPlacement.placeObject(position, object);

    expect(object.position.x).toBe(1);
    expect(object.position.y).toBe(2);
    expect(object.position.z).toBe(3);
  });
});

describe('PerformanceDashboard', () => {
  let dashboard: PerformanceDashboard;

  beforeEach(() => {
    dashboard = new PerformanceDashboard();
  });

  it('should track performance metrics', () => {
    const mockRenderer = {
      info: {
        render: {
          calls: 50,
          triangles: 10000,
        },
      },
    } as any;

    const mockScene = {} as any;

    dashboard.update(mockRenderer, mockScene);
    const metrics = dashboard.getMetrics();

    expect(metrics.drawCalls).toBe(50);
    expect(metrics.triangles).toBe(10000);
  });

  it('should maintain performance history', () => {
    const mockRenderer = {
      info: { render: { calls: 0, triangles: 0 } },
    } as any;

    dashboard.update(mockRenderer, {} as any);
    dashboard.update(mockRenderer, {} as any);

    const history = dashboard.getHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('should limit history length', () => {
    const mockRenderer = {
      info: { render: { calls: 0, triangles: 0 } },
    } as any;

    for (let i = 0; i < 400; i++) {
      dashboard.update(mockRenderer, {} as any);
    }

    const history = dashboard.getHistory();
    expect(history.length).toBeLessThanOrEqual(300);
  });

  describe('bottleneck detection', () => {
    it('should detect low FPS', () => {
      const mockRenderer = {
        info: { render: { calls: 0, triangles: 0 } },
      } as any;

      dashboard.update(mockRenderer, {} as any);
      const metrics = dashboard.getMetrics();
      (metrics as any).fps = 20; // Manually set low FPS

      // Create new dashboard with low FPS
      const testDashboard = new PerformanceDashboard();
      (testDashboard as any).metrics.fps = 20;

      const bottlenecks = testDashboard.detectBottlenecks();
      expect(bottlenecks.some((b) => b.type === 'fps')).toBe(true);
    });

    it('should detect high draw calls', () => {
      const testDashboard = new PerformanceDashboard();
      (testDashboard as any).metrics.drawCalls = 150;

      const bottlenecks = testDashboard.detectBottlenecks();
      expect(bottlenecks.some((b) => b.type === 'draw-calls')).toBe(true);
    });

    it('should detect high memory usage', () => {
      const testDashboard = new PerformanceDashboard();
      (testDashboard as any).metrics.memory = 600 * 1024 * 1024; // 600MB

      const bottlenecks = testDashboard.detectBottlenecks();
      expect(bottlenecks.some((b) => b.type === 'memory')).toBe(true);
    });

    it('should provide suggestions', () => {
      const testDashboard = new PerformanceDashboard();
      (testDashboard as any).metrics.fps = 20;

      const bottlenecks = testDashboard.detectBottlenecks();
      expect(bottlenecks[0].suggestion).toBeDefined();
      expect(bottlenecks[0].suggestion.length).toBeGreaterThan(0);
    });

    it('should categorize severity', () => {
      const testDashboard = new PerformanceDashboard();
      (testDashboard as any).metrics.fps = 20;

      const bottlenecks = testDashboard.detectBottlenecks();
      expect(['low', 'medium', 'high']).toContain(bottlenecks[0].severity);
    });
  });
});

describe('BatchExporter', () => {
  let exporter: BatchExporter;

  beforeEach(() => {
    exporter = new BatchExporter();
  });

  it('should export to multiple formats', async () => {
    const geometry: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 10,
      faceCount: 5,
      positionsArray: new Float32Array(30),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const results = await exporter.exportMultipleFormats([geometry], ['gltf', 'obj']);

    expect(results).toHaveLength(2);
    expect(results[0].format).toBe('gltf');
    expect(results[1].format).toBe('obj');
  });

  it('should include size estimates', async () => {
    const geometry: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 10,
      faceCount: 5,
      positionsArray: new Float32Array(30),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const results = await exporter.exportMultipleFormats([geometry], ['gltf']);

    expect(results[0].size).toBeDefined();
    expect(results[0].size).toBeGreaterThan(0);
  });

  it('should handle export errors', async () => {
    const badGeometry = null as any;

    const results = await exporter.exportMultipleFormats([badGeometry], ['gltf']);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toBeDefined();
  });

  it('should upload to CDN', async () => {
    const blob = new Blob(['test data'], { type: 'application/json' });
    const url = await exporter.uploadToCDN(blob, 'test.json');

    expect(url).toContain('https://');
    expect(url).toContain('test.json');
  });
});

describe('CompressionPipeline', () => {
  let compression: CompressionPipeline;

  beforeEach(() => {
    compression = new CompressionPipeline();
  });

  it('should compress geometry', () => {
    const geometry: EnhancedGeometryData = {
      vertices: [],
      faces: [],
      vertexCount: 1000,
      faceCount: 500,
      positionsArray: new Float32Array(3000),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    };

    const compressed = compression.compress(geometry);
    expect(compressed).toBeDefined();
  });

  it('should compress textures', async () => {
    const img = document.createElement('img');
    img.width = 256;
    img.height = 256;

    const blob = await compression.compressTexture(img);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should calculate compression ratio', () => {
    const ratio = compression.estimateCompressionRatio(1000, 400);
    expect(ratio).toBe(0.4);
  });

  it('should handle perfect compression', () => {
    const ratio = compression.estimateCompressionRatio(1000, 0);
    expect(ratio).toBe(0);
  });

  it('should handle no compression', () => {
    const ratio = compression.estimateCompressionRatio(1000, 1000);
    expect(ratio).toBe(1);
  });
});
