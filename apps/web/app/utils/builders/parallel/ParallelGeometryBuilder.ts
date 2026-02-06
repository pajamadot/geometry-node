import { EnhancedGeometryData } from '../GeometryBuilder';
import { GeometryWorkerPool } from './GeometryWorkerPool';

/**
 * ParallelGeometryBuilder - High-level interface for parallel geometry generation
 * Automatically uses web workers for heavy operations
 */
export class ParallelGeometryBuilder {
  private workerPool: GeometryWorkerPool;
  private useWorkers: boolean = true;

  constructor(useWorkers: boolean = true) {
    this.workerPool = GeometryWorkerPool.getInstance();
    this.useWorkers = useWorkers && typeof Worker !== 'undefined';
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    if (this.useWorkers) {
      await this.workerPool.initialize();
    }
  }

  /**
   * Generate sphere in worker
   */
  async createSphere(params: {
    radius?: number;
    segments?: number;
  }): Promise<EnhancedGeometryData> {
    if (!this.useWorkers) {
      // Fallback to synchronous generation
      return this.createSphereFallback(params);
    }

    return this.workerPool.executeInWorker('sphere', params);
  }

  /**
   * Generate box in worker
   */
  async createBox(params: {
    width?: number;
    height?: number;
    depth?: number;
  }): Promise<EnhancedGeometryData> {
    if (!this.useWorkers) {
      return this.createBoxFallback(params);
    }

    return this.workerPool.executeInWorker('box', params);
  }

  /**
   * Apply noise displacement in worker
   */
  async applyNoise(
    geometry: EnhancedGeometryData,
    amplitude: number = 1,
    frequency: number = 0.1
  ): Promise<EnhancedGeometryData> {
    if (!this.useWorkers) {
      return this.applyNoiseFallback(geometry, amplitude, frequency);
    }

    return this.workerPool.executeInWorker('noise', {
      geometry: this.serializeGeometry(geometry),
      amplitude,
      frequency,
    });
  }

  /**
   * Batch generate multiple geometries in parallel
   */
  async createBatch(
    operations: Array<{
      type: 'sphere' | 'box' | 'cylinder';
      params: Record<string, any>;
    }>
  ): Promise<EnhancedGeometryData[]> {
    if (!this.useWorkers) {
      return Promise.all(
        operations.map((op) => {
          switch (op.type) {
            case 'sphere':
              return this.createSphereFallback(op.params);
            case 'box':
              return this.createBoxFallback(op.params);
            default:
              throw new Error(`Unknown type: ${op.type}`);
          }
        })
      );
    }

    return this.workerPool.executeParallel(
      operations.map((op) => ({
        operation: op.type,
        params: op.params,
      }))
    );
  }

  /**
   * Serialize geometry for worker transfer
   */
  private serializeGeometry(geometry: EnhancedGeometryData): any {
    return {
      vertexCount: geometry.vertexCount,
      faceCount: geometry.faceCount,
      positions: geometry.positionsArray,
      normals: geometry.normalsArray,
      uvs: geometry.uvsArray,
      colors: geometry.colorsArray,
      indices: geometry.indicesArray,
    };
  }

  /**
   * Fallback sphere generation (synchronous)
   */
  private createSphereFallback(params: {
    radius?: number;
    segments?: number;
  }): Promise<EnhancedGeometryData> {
    const { radius = 1, segments = 32 } = params;
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat / segments) * Math.PI;
      for (let lon = 0; lon <= segments; lon++) {
        const phi = (lon / segments) * Math.PI * 2;

        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        positions.push(x, y, z);
        normals.push(x / radius, y / radius, z / radius);
        uvs.push(lon / segments, lat / segments);
      }
    }

    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const first = lat * (segments + 1) + lon;
        const second = first + segments + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    return Promise.resolve({
      vertices: [],
      faces: [],
      vertexCount: positions.length / 3,
      faceCount: indices.length / 3,
      positionsArray: new Float32Array(positions),
      normalsArray: new Float32Array(normals),
      uvsArray: new Float32Array(uvs),
      indicesArray: new Uint32Array(indices),
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    });
  }

  /**
   * Fallback box generation (synchronous)
   */
  private createBoxFallback(params: {
    width?: number;
    height?: number;
    depth?: number;
  }): Promise<EnhancedGeometryData> {
    const { width = 1, height = 1, depth = 1 } = params;
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const positions = new Float32Array([
      // Front
      -w, -h, d, w, -h, d, w, h, d, -w, h, d,
      // Back
      -w, -h, -d, -w, h, -d, w, h, -d, w, -h, -d,
      // Top
      -w, h, -d, -w, h, d, w, h, d, w, h, -d,
      // Bottom
      -w, -h, -d, w, -h, -d, w, -h, d, -w, -h, d,
      // Right
      w, -h, -d, w, h, -d, w, h, d, w, -h, d,
      // Left
      -w, -h, -d, -w, -h, d, -w, h, d, -w, h, -d,
    ]);

    const normals = new Float32Array([
      // Front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // Back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // Top
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // Bottom
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // Right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // Left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ]);

    const indices = new Uint32Array([
      0, 1, 2, 0, 2, 3, // Front
      4, 5, 6, 4, 6, 7, // Back
      8, 9, 10, 8, 10, 11, // Top
      12, 13, 14, 12, 14, 15, // Bottom
      16, 17, 18, 16, 18, 19, // Right
      20, 21, 22, 20, 22, 23, // Left
    ]);

    return Promise.resolve({
      vertices: [],
      faces: [],
      vertexCount: 24,
      faceCount: 12,
      positionsArray: positions,
      normalsArray: normals,
      indicesArray: indices,
      attributes: {
        vertex: new Map(),
        edge: new Map(),
        face: new Map(),
        corner: new Map(),
      },
    });
  }

  /**
   * Fallback noise application (synchronous)
   */
  private applyNoiseFallback(
    geometry: EnhancedGeometryData,
    amplitude: number,
    frequency: number
  ): Promise<EnhancedGeometryData> {
    if (!geometry.positionsArray) {
      return Promise.resolve(geometry);
    }

    const positions = new Float32Array(geometry.positionsArray);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      const noise = Math.sin(x * frequency) * Math.cos(z * frequency);
      positions[i + 1] += noise * amplitude;
    }

    return Promise.resolve({
      ...geometry,
      positionsArray: positions,
    });
  }

  /**
   * Get worker pool statistics
   */
  getStats() {
    return this.workerPool.getStats();
  }

  /**
   * Terminate worker pool
   */
  terminate(): void {
    this.workerPool.terminate();
  }
}

// Global parallel builder instance
export const parallelBuilder = new ParallelGeometryBuilder();
