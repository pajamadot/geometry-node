import { EnhancedGeometryData } from '../GeometryBuilder';
import { GeometryWorkerPool } from './GeometryWorkerPool';

/**
 * WorkerNodeExecutor - Execute node operations in web workers
 * Enables offloading heavy node computations to background threads
 */
export class WorkerNodeExecutor {
  private workerPool: GeometryWorkerPool;
  private heavyOperations = new Set([
    'subdivide',
    'noise',
    'terrain',
    'boolean',
    'simplify',
  ]);

  constructor() {
    this.workerPool = GeometryWorkerPool.getInstance();
  }

  /**
   * Check if operation should run in worker
   */
  shouldUseWorker(
    operationType: string,
    vertexCount: number,
    forceWorker: boolean = false
  ): boolean {
    if (forceWorker) return true;
    if (!this.heavyOperations.has(operationType)) return false;

    // Use workers for geometries with > 10k vertices
    return vertexCount > 10000;
  }

  /**
   * Execute node operation
   */
  async executeNode(
    operation: string,
    inputs: Record<string, any>,
    parameters: Record<string, any>,
    forceWorker: boolean = false
  ): Promise<EnhancedGeometryData> {
    // Check if we should use worker
    const inputGeometry = inputs.geometry as EnhancedGeometryData | undefined;
    const vertexCount = inputGeometry?.vertexCount || 0;

    if (!this.shouldUseWorker(operation, vertexCount, forceWorker)) {
      // Execute synchronously
      throw new Error('Synchronous execution not implemented - use node execute directly');
    }

    // Execute in worker
    return this.workerPool.executeInWorker(operation, {
      inputs: this.serializeInputs(inputs),
      parameters,
    });
  }

  /**
   * Batch execute multiple nodes
   */
  async executeBatch(
    nodes: Array<{
      operation: string;
      inputs: Record<string, any>;
      parameters: Record<string, any>;
    }>
  ): Promise<EnhancedGeometryData[]> {
    return this.workerPool.executeParallel(
      nodes.map((node) => ({
        operation: node.operation,
        params: {
          inputs: this.serializeInputs(node.inputs),
          parameters: node.parameters,
        },
      }))
    );
  }

  /**
   * Execute with progress callback
   */
  async executeWithProgress(
    operation: string,
    inputs: Record<string, any>,
    parameters: Record<string, any>,
    onProgress: (progress: number) => void
  ): Promise<EnhancedGeometryData> {
    // For now, simplified - real implementation would have worker send progress updates
    onProgress(0);

    const result = await this.executeNode(operation, inputs, parameters, true);

    onProgress(100);
    return result;
  }

  /**
   * Serialize inputs for worker transfer
   */
  private serializeInputs(inputs: Record<string, any>): Record<string, any> {
    const serialized: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputs)) {
      if (this.isGeometryData(value)) {
        serialized[key] = this.serializeGeometry(value);
      } else if (Array.isArray(value)) {
        serialized[key] = value.map((item) =>
          this.isGeometryData(item) ? this.serializeGeometry(item) : item
        );
      } else {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Check if value is geometry data
   */
  private isGeometryData(value: any): value is EnhancedGeometryData {
    return (
      value &&
      typeof value === 'object' &&
      'vertexCount' in value &&
      'faceCount' in value
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
      attributes: {
        vertex: Array.from(geometry.attributes.vertex.entries()),
        edge: Array.from(geometry.attributes.edge.entries()),
        face: Array.from(geometry.attributes.face.entries()),
        corner: Array.from(geometry.attributes.corner.entries()),
      },
    };
  }

  /**
   * Register custom heavy operation
   */
  registerHeavyOperation(operationType: string): void {
    this.heavyOperations.add(operationType);
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      ...this.workerPool.getStats(),
      heavyOperations: Array.from(this.heavyOperations),
    };
  }

  /**
   * Terminate workers
   */
  terminate(): void {
    this.workerPool.terminate();
  }
}

/**
 * Decorator for making node execute functions worker-compatible
 */
export function WorkerCompatible(heavyThreshold: number = 10000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [inputs, parameters] = args;
      const geometry = inputs.geometry as EnhancedGeometryData | undefined;

      // Check if should use worker
      if (geometry && geometry.vertexCount > heavyThreshold) {
        const executor = new WorkerNodeExecutor();
        try {
          return await executor.executeNode(
            propertyKey,
            inputs,
            parameters,
            false
          );
        } catch (error) {
          // Fallback to synchronous execution
          console.warn('Worker execution failed, using sync:', error);
          return originalMethod.apply(this, args);
        }
      }

      // Execute normally
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Global executor instance
export const workerExecutor = new WorkerNodeExecutor();
