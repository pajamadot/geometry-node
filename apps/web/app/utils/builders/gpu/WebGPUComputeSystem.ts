/**
 * WebGPU Compute System
 * Manages WebGPU device initialization, context, and resource capabilities.
 * Serves as the foundation for GPU-accelerated geometry operations.
 */

export class WebGPUComputeSystem {
  private static instance: WebGPUComputeSystem;
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  private initialized: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): WebGPUComputeSystem {
    if (!WebGPUComputeSystem.instance) {
      WebGPUComputeSystem.instance = new WebGPUComputeSystem();
    }
    return WebGPUComputeSystem.instance;
  }

  /**
   * Initialize WebGPU device
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.initImpl();
    return this.initializationPromise;
  }

  private async initImpl(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      console.warn('WebGPU is not supported in this environment.');
      return false;
    }

    try {
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });

      if (!this.adapter) {
        console.warn('No WebGPU adapter found.');
        return false;
      }

      this.device = await this.adapter.requestDevice();
      
      this.device.lost.then((info) => {
        console.error(`WebGPU device was lost: ${info.message}`);
        this.device = null;
        this.initialized = false;
      });

      this.initialized = true;
      console.log('WebGPU Compute System Initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error);
      return false;
    }
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  isAvailable(): boolean {
    return this.initialized && !!this.device;
  }

  /**
   * Create a buffer from data
   */
  createBuffer(data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags): GPUBuffer | null {
    if (!this.device) return null;

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: usage | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    if (data instanceof Float32Array) {
      new Float32Array(buffer.getMappedRange()).set(data);
    } else {
      new Uint32Array(buffer.getMappedRange()).set(data);
    }
    
    buffer.unmap();
    return buffer;
  }

  /**
   * Create a buffer for reading back data
   */
  createReadBuffer(size: number): GPUBuffer | null {
    if (!this.device) return null;

    return this.device.createBuffer({
      size: size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
  }

  /**
   * Read data from a GPU buffer
   */
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Float32Array | null> {
    if (!this.device) return null;

    // Map the buffer for reading
    await buffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = buffer.getMappedRange();
    const data = new Float32Array(copyArrayBuffer.slice(0));
    buffer.unmap();
    
    return data;
  }
}

// Global instance
export const webGPUCompute = WebGPUComputeSystem.getInstance();

