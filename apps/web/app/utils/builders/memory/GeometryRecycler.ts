import { EnhancedGeometryData } from '../GeometryBuilder';
import { geometryPool } from './GeometryPool';
import { bufferAllocator } from './BufferAllocator';

/**
 * GeometryRecycler - High-level geometry recycling system
 * Combines pool and allocator for complete memory management
 */
export class GeometryRecycler {
  private static instance: GeometryRecycler;

  private constructor() {}

  static getInstance(): GeometryRecycler {
    if (!GeometryRecycler.instance) {
      GeometryRecycler.instance = new GeometryRecycler();
    }
    return GeometryRecycler.instance;
  }

  /**
   * Create geometry with pooled resources
   */
  create(vertexCount: number, faceCount: number): EnhancedGeometryData {
    const geometry = geometryPool.acquire();

    // Allocate arrays from buffer pool
    geometry.positionsArray = bufferAllocator.allocateFloat32(vertexCount * 3);
    geometry.normalsArray = bufferAllocator.allocateFloat32(vertexCount * 3);
    geometry.indicesArray = bufferAllocator.allocateUint32(faceCount * 3);

    geometry.vertexCount = vertexCount;
    geometry.faceCount = faceCount;

    return geometry;
  }

  /**
   * Recycle geometry and all its resources
   */
  recycle(geometry: EnhancedGeometryData): void {
    // Release buffers
    if (geometry.positionsArray) {
      bufferAllocator.releaseFloat32(geometry.positionsArray);
    }
    if (geometry.normalsArray) {
      bufferAllocator.releaseFloat32(geometry.normalsArray);
    }
    if (geometry.uvsArray) {
      bufferAllocator.releaseFloat32(geometry.uvsArray);
    }
    if (geometry.colorsArray) {
      bufferAllocator.releaseFloat32(geometry.colorsArray);
    }
    if (geometry.indicesArray) {
      bufferAllocator.releaseUint32(geometry.indicesArray);
    }

    // Return geometry to pool
    geometryPool.release(geometry);
  }

  /**
   * Batch recycle
   */
  recycleBatch(geometries: EnhancedGeometryData[]): void {
    for (const geometry of geometries) {
      this.recycle(geometry);
    }
  }

  /**
   * Clone geometry with pooled resources
   */
  clone(source: EnhancedGeometryData): EnhancedGeometryData {
    const geometry = this.create(source.vertexCount, source.faceCount);

    if (source.positionsArray) {
      geometry.positionsArray!.set(source.positionsArray);
    }
    if (source.normalsArray) {
      geometry.normalsArray!.set(source.normalsArray);
    }
    if (source.indicesArray) {
      geometry.indicesArray!.set(source.indicesArray);
    }

    return geometry;
  }

  /**
   * Get combined statistics
   */
  getStats() {
    return {
      pool: geometryPool.getStats(),
      allocator: bufferAllocator.getStats(),
    };
  }
}

// Global geometry recycler
export const geometryRecycler = GeometryRecycler.getInstance();
