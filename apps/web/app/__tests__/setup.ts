/**
 * Test Setup
 * Global configuration and utilities for all tests
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Define Mock Classes
class MockVector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  clone() {
    return new MockVector3(this.x, this.y, this.z);
  }

  add(v: MockVector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: MockVector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  distanceTo(v: MockVector3) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  dot(v: MockVector3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  crossVectors(a: MockVector3, b: MockVector3) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  }

  applyAxisAngle(axis: MockVector3, angle: number) {
    // Simplified rotation
    return this;
  }

  copy(v: MockVector3) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  applyMatrix4(matrix: any) {
    if (matrix.elements) {
      const e = matrix.elements;
      const x = this.x, y = this.y, z = this.z;
      const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

      this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
      this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
      this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    }
    return this;
  }

  applyMatrix3(matrix: any) {
    // Simplified matrix transformation
    return this;
  }
}

class MockVector2 {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new MockVector2(this.x, this.y);
  }
}

class MockColor {
  r: number;
  g: number;
  b: number;

  constructor(color?: number) {
    if (color !== undefined) {
      this.r = ((color >> 16) & 255) / 255;
      this.g = ((color >> 8) & 255) / 255;
      this.b = (color & 255) / 255;
    } else {
      this.r = 1;
      this.g = 1;
      this.b = 1;
    }
  }

  lerpColors(c1: MockColor, c2: MockColor, t: number) {
    this.r = c1.r + (c2.r - c1.r) * t;
    this.g = c1.g + (c2.g - c1.g) * t;
    this.b = c1.b + (c2.b - c1.b) * t;
    return this;
  }
}

class MockMatrix4 {
  elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

  makeTranslation(x: number, y: number, z: number) {
    this.elements[0] = 1; this.elements[4] = 0; this.elements[8] = 0; this.elements[12] = x;
    this.elements[1] = 0; this.elements[5] = 1; this.elements[9] = 0; this.elements[13] = y;
    this.elements[2] = 0; this.elements[6] = 0; this.elements[10] = 1; this.elements[14] = z;
    this.elements[3] = 0; this.elements[7] = 0; this.elements[11] = 0; this.elements[15] = 1;
    return this;
  }

  makeScale(x: number, y: number, z: number) {
    this.elements[0] = x; this.elements[4] = 0; this.elements[8] = 0; this.elements[12] = 0;
    this.elements[1] = 0; this.elements[5] = y; this.elements[9] = 0; this.elements[13] = 0;
    this.elements[2] = 0; this.elements[6] = 0; this.elements[10] = z; this.elements[14] = 0;
    this.elements[3] = 0; this.elements[7] = 0; this.elements[11] = 0; this.elements[15] = 1;
    return this;
  }
  
  makeRotationAxis(axis: MockVector3, angle: number) {
    // Simplified rotation identity for now to avoid complex math implementation in test
    // Ideally we'd implement Rodrigues' rotation formula here
    return this;
  }

  makeRotationFromEuler(euler: any) {
    return this;
  }
}

class MockObject3D {
  position = new MockVector3();
  rotation = new MockEuler();
  scale = new MockVector3(1, 1, 1);
  add() {}
  remove() {}
  updateMatrixWorld() {}
}

class MockEuler {
  x = 0;
  y = 0;
  z = 0;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
}

// Mock THREE.js
vi.mock('three', () => ({
  Vector3: MockVector3,
  Vector2: MockVector2,
  Color: MockColor,
  Matrix3: class Matrix3 {
    getNormalMatrix(matrix: any) {
      return this;
    }
  },
  Matrix4: MockMatrix4,
  BufferGeometry: class BufferGeometry {},
  BufferAttribute: class BufferAttribute {},
  Euler: MockEuler,
  MeshStandardMaterial: class MeshStandardMaterial {},
  Mesh: class Mesh {},
  Object3D: MockObject3D,
  EffectComposer: class EffectComposer {},
  GLTFExporter: class GLTFExporter {
    parse(scene: any, onCompleted: (result: any) => void, onError: (error: any) => void, options: any) {
      onCompleted({ mock: 'gltf' });
    }
  },
}));

// Mock WebGL context
global.WebGLRenderingContext = class {} as any;
global.WebGL2RenderingContext = class {} as any;

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
  },
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

// Mock HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      createImageData: (width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    } as any;
  }
  return null;
}) as any;

// Mock HTMLCanvasElement.prototype.toBlob
HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
  callback(new Blob(['mock-canvas-data'], { type: 'image/png' }));
}) as any;

// Export test utilities
export const createMockGeometry = () => ({
  vertices: [],
  faces: [],
  vertexCount: 0,
  faceCount: 0,
  attributes: {
    vertex: new Map(),
    edge: new Map(),
    face: new Map(),
    corner: new Map(),
  },
});
