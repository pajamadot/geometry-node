/**
 * BufferAllocator - Custom typed array allocation strategy
 * Manages pools of typed arrays for efficient geometry data storage
 */
export class BufferAllocator {
  private static instance: BufferAllocator;
  private float32Pool: Map<number, Float32Array[]> = new Map();
  private uint32Pool: Map<number, Uint32Array[]> = new Map();
  private maxPoolSize: number = 20;
  private stats = {
    allocations: 0,
    reuses: 0,
    totalMemory: 0,
  };

  private constructor() {}

  static getInstance(): BufferAllocator {
    if (!BufferAllocator.instance) {
      BufferAllocator.instance = new BufferAllocator();
    }
    return BufferAllocator.instance;
  }

  /**
   * Allocate Float32Array
   */
  allocateFloat32(length: number): Float32Array {
    // Round up to nearest power of 2 for better pooling
    const size = this.nextPowerOf2(length);

    const pool = this.float32Pool.get(size) || [];

    if (pool.length > 0) {
      this.stats.reuses++;
      const buffer = pool.pop()!;
      // Clear buffer
      buffer.fill(0);
      return buffer.subarray(0, length);
    }

    this.stats.allocations++;
    this.stats.totalMemory += size * 4;
    return new Float32Array(length);
  }

  /**
   * Allocate Uint32Array
   */
  allocateUint32(length: number): Uint32Array {
    const size = this.nextPowerOf2(length);

    const pool = this.uint32Pool.get(size) || [];

    if (pool.length > 0) {
      this.stats.reuses++;
      const buffer = pool.pop()!;
      buffer.fill(0);
      return buffer.subarray(0, length);
    }

    this.stats.allocations++;
    this.stats.totalMemory += size * 4;
    return new Uint32Array(length);
  }

  /**
   * Release Float32Array back to pool
   */
  releaseFloat32(array: Float32Array): void {
    if (!array || array.length === 0) return;

    const size = this.nextPowerOf2(array.length);
    const pool = this.float32Pool.get(size) || [];

    if (pool.length < this.maxPoolSize) {
      // Create full-size buffer if it's a subarray
      const fullBuffer = array.buffer.byteLength === array.byteLength
        ? array
        : new Float32Array(array);

      pool.push(fullBuffer);
      this.float32Pool.set(size, pool);
    }
  }

  /**
   * Release Uint32Array back to pool
   */
  releaseUint32(array: Uint32Array): void {
    if (!array || array.length === 0) return;

    const size = this.nextPowerOf2(array.length);
    const pool = this.uint32Pool.get(size) || [];

    if (pool.length < this.maxPoolSize) {
      const fullBuffer = array.buffer.byteLength === array.byteLength
        ? array
        : new Uint32Array(array);

      pool.push(fullBuffer);
      this.uint32Pool.set(size, pool);
    }
  }

  /**
   * Clear all pools
   */
  clear(): void {
    this.float32Pool.clear();
    this.uint32Pool.clear();
    this.stats.totalMemory = 0;
  }

  /**
   * Get statistics
   */
  getStats(): AllocatorStats {
    let float32Count = 0;
    let uint32Count = 0;

    for (const pool of this.float32Pool.values()) {
      float32Count += pool.length;
    }

    for (const pool of this.uint32Pool.values()) {
      uint32Count += pool.length;
    }

    return {
      ...this.stats,
      float32Pooled: float32Count,
      uint32Pooled: uint32Count,
      reuseRate: this.stats.reuses / (this.stats.allocations + this.stats.reuses),
    };
  }

  /**
   * Get next power of 2
   */
  private nextPowerOf2(n: number): number {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}

interface AllocatorStats {
  allocations: number;
  reuses: number;
  totalMemory: number;
  float32Pooled: number;
  uint32Pooled: number;
  reuseRate: number;
}

// Global buffer allocator
export const bufferAllocator = BufferAllocator.getInstance();
