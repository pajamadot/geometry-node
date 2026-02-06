import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * GeometryPool - Object pooling for geometry data structures
 * Reuses allocated geometry objects to reduce GC pressure
 */
export class GeometryPool {
  private static instance: GeometryPool;
  private pool: EnhancedGeometryData[] = [];
  private maxPoolSize: number = 50;
  private stats = {
    created: 0,
    reused: 0,
    returned: 0,
    disposed: 0,
  };

  private constructor() {}

  static getInstance(): GeometryPool {
    if (!GeometryPool.instance) {
      GeometryPool.instance = new GeometryPool();
    }
    return GeometryPool.instance;
  }

  /**
   * Acquire geometry from pool or create new
   */
  acquire(): EnhancedGeometryData {
    if (this.pool.length > 0) {
      this.stats.reused++;
      return this.pool.pop()!;
    }

    this.stats.created++;
    return this.createEmpty();
  }

  /**
   * Return geometry to pool
   */
  release(geometry: EnhancedGeometryData): void {
    if (this.pool.length >= this.maxPoolSize) {
      this.stats.disposed++;
      return;
    }

    // Clear geometry data
    this.clearGeometry(geometry);

    this.pool.push(geometry);
    this.stats.returned++;
  }

  /**
   * Acquire with specific capacity
   */
  acquireWithCapacity(vertexCount: number, faceCount: number): EnhancedGeometryData {
    const geometry = this.acquire();

    // Pre-allocate arrays
    geometry.positionsArray = new Float32Array(vertexCount * 3);
    geometry.indicesArray = new Uint32Array(faceCount * 3);
    geometry.vertexCount = vertexCount;
    geometry.faceCount = faceCount;

    return geometry;
  }

  /**
   * Batch acquire multiple geometries
   */
  acquireBatch(count: number): EnhancedGeometryData[] {
    const geometries: EnhancedGeometryData[] = [];
    for (let i = 0; i < count; i++) {
      geometries.push(this.acquire());
    }
    return geometries;
  }

  /**
   * Batch release multiple geometries
   */
  releaseBatch(geometries: EnhancedGeometryData[]): void {
    for (const geometry of geometries) {
      this.release(geometry);
    }
  }

  /**
   * Clear all pooled geometries
   */
  clear(): void {
    this.pool = [];
    this.stats.disposed += this.pool.length;
  }

  /**
   * Set maximum pool size
   */
  setMaxPoolSize(size: number): void {
    this.maxPoolSize = size;

    // Trim pool if necessary
    while (this.pool.length > this.maxPoolSize) {
      this.pool.pop();
      this.stats.disposed++;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      maxPoolSize: this.maxPoolSize,
      reuseRate: this.stats.reused / (this.stats.created + this.stats.reused),
    };
  }

  /**
   * Create empty geometry
   */
  private createEmpty(): EnhancedGeometryData {
    return {
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
    };
  }

  /**
   * Clear geometry data for reuse
   */
  private clearGeometry(geometry: EnhancedGeometryData): void {
    geometry.vertices = [];
    geometry.faces = [];
    geometry.vertexCount = 0;
    geometry.faceCount = 0;
    geometry.positionsArray = undefined;
    geometry.normalsArray = undefined;
    geometry.uvsArray = undefined;
    geometry.colorsArray = undefined;
    geometry.indicesArray = undefined;
    geometry.attributes.vertex.clear();
    geometry.attributes.edge.clear();
    geometry.attributes.face.clear();
    geometry.attributes.corner.clear();
  }
}

interface PoolStats {
  created: number;
  reused: number;
  returned: number;
  disposed: number;
  poolSize: number;
  maxPoolSize: number;
  reuseRate: number;
}

// Global geometry pool
export const geometryPool = GeometryPool.getInstance();
