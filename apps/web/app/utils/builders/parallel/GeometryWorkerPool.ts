import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * GeometryWorkerPool - Manages web workers for parallel geometry generation
 * Enables background processing of heavy geometry operations
 */
export class GeometryWorkerPool {
  private static instance: GeometryWorkerPool;
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: QueuedTask[] = [];
  private maxWorkers: number;
  private workerScript: string;

  private constructor(maxWorkers: number = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = maxWorkers;
    this.workerScript = this.createWorkerScript();
  }

  static getInstance(maxWorkers?: number): GeometryWorkerPool {
    if (!GeometryWorkerPool.instance) {
      GeometryWorkerPool.instance = new GeometryWorkerPool(maxWorkers);
    }
    return GeometryWorkerPool.instance;
  }

  /**
   * Initialize worker pool
   */
  async initialize(): Promise<void> {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Create a web worker from inline script
   */
  private createWorker(): Worker {
    const blob = new Blob([this.workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };

    return worker;
  }

  /**
   * Execute geometry operation in worker
   */
  async executeInWorker<T extends EnhancedGeometryData>(
    operation: string,
    params: Record<string, any>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: QueuedTask = {
        operation,
        params,
        resolve,
        reject,
      };

      if (this.availableWorkers.length > 0) {
        this.runTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Run task on available worker
   */
  private runTask(task: QueuedTask): void {
    const worker = this.availableWorkers.pop();
    if (!worker) return;

    const handleMessage = (event: MessageEvent) => {
      const { success, data, error } = event.data;

      worker.removeEventListener('message', handleMessage);
      this.availableWorkers.push(worker);

      if (success) {
        // Reconstruct EnhancedGeometryData from transferred arrays
        const geometryData = this.reconstructGeometryData(data);
        task.resolve(geometryData);
      } else {
        task.reject(new Error(error));
      }

      // Process next task in queue
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()!;
        this.runTask(nextTask);
      }
    };

    worker.addEventListener('message', handleMessage);

    // Send message with transferable objects for zero-copy transfer
    worker.postMessage({
      operation: task.operation,
      params: task.params,
    });
  }

  /**
   * Reconstruct geometry data from worker response
   */
  private reconstructGeometryData(data: any): EnhancedGeometryData {
    return {
      vertices: [],
      faces: [],
      vertexCount: data.vertexCount,
      faceCount: data.faceCount,
      positionsArray: data.positions ? new Float32Array(data.positions) : undefined,
      normalsArray: data.normals ? new Float32Array(data.normals) : undefined,
      uvsArray: data.uvs ? new Float32Array(data.uvs) : undefined,
      colorsArray: data.colors ? new Float32Array(data.colors) : undefined,
      indicesArray: data.indices ? new Uint32Array(data.indices) : undefined,
      attributes: {
        vertex: new Map(data.attributes?.vertex || []),
        edge: new Map(data.attributes?.edge || []),
        face: new Map(data.attributes?.face || []),
        corner: new Map(data.attributes?.corner || []),
      },
    };
  }

  /**
   * Parallel execution of multiple operations
   */
  async executeParallel<T extends EnhancedGeometryData>(
    operations: Array<{ operation: string; params: Record<string, any> }>
  ): Promise<T[]> {
    return Promise.all(
      operations.map((op) => this.executeInWorker<T>(op.operation, op.params))
    );
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      queuedTasks: this.taskQueue.length,
    };
  }

  /**
   * Create worker script (inline to avoid bundler issues)
   */
  private createWorkerScript(): string {
    return `
      // Geometry Worker - Executes geometry operations in background thread

      self.onmessage = function(event) {
        const { operation, params } = event.data;

        try {
          let result;

          switch (operation) {
            case 'sphere':
              result = generateSphere(params);
              break;
            case 'box':
              result = generateBox(params);
              break;
            case 'subdivide':
              result = subdivideGeometry(params);
              break;
            case 'noise':
              result = applyNoise(params);
              break;
            default:
              throw new Error('Unknown operation: ' + operation);
          }

          // Send result with transferable objects
          self.postMessage({
            success: true,
            data: result,
          }, [
            result.positions?.buffer,
            result.normals?.buffer,
            result.uvs?.buffer,
            result.colors?.buffer,
            result.indices?.buffer,
          ].filter(Boolean));

        } catch (error) {
          self.postMessage({
            success: false,
            error: error.message,
          });
        }
      };

      // Geometry generation functions
      function generateSphere(params) {
        const { radius = 1, segments = 32 } = params;
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

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

        return {
          vertexCount: positions.length / 3,
          faceCount: indices.length / 3,
          positions: new Float32Array(positions),
          normals: new Float32Array(normals),
          uvs: new Float32Array(uvs),
          indices: new Uint32Array(indices),
          attributes: { vertex: [], edge: [], face: [], corner: [] },
        };
      }

      function generateBox(params) {
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
          0, 1, 2, 0, 2, 3,       // Front
          4, 5, 6, 4, 6, 7,       // Back
          8, 9, 10, 8, 10, 11,    // Top
          12, 13, 14, 12, 14, 15, // Bottom
          16, 17, 18, 16, 18, 19, // Right
          20, 21, 22, 20, 22, 23, // Left
        ]);

        return {
          vertexCount: 24,
          faceCount: 12,
          positions,
          normals,
          indices,
          attributes: { vertex: [], edge: [], face: [], corner: [] },
        };
      }

      function subdivideGeometry(params) {
        // Placeholder - actual implementation would go here
        return params.geometry;
      }

      function applyNoise(params) {
        const { geometry, amplitude = 1, frequency = 0.1 } = params;
        const positions = new Float32Array(geometry.positions);

        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const y = positions[i + 1];
          const z = positions[i + 2];

          const noise = Math.sin(x * frequency) * Math.cos(z * frequency);
          positions[i + 1] += noise * amplitude;
        }

        return {
          ...geometry,
          positions,
        };
      }
    `;
  }
}

interface QueuedTask {
  operation: string;
  params: Record<string, any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

interface PoolStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  queuedTasks: number;
}

// Global pool instance
export const workerPool = GeometryWorkerPool.getInstance();
