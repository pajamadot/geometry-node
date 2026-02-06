import * as pc from 'playcanvas';
import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * GPUComputeShaders - GPU-accelerated geometry operations using compute shaders
 * Uses WebGPU if available, or WebGL2 Transform Feedback
 */
export class GPUComputeShaders {
  private device?: pc.GraphicsDevice;
  private initialized: boolean = false;

  constructor(device?: pc.GraphicsDevice) {
    this.device = device;
    if (device) this.initialized = true;
  }

  /**
   * Initialize GPU compute capabilities
   */
  async initialize(device: pc.GraphicsDevice): Promise<void> {
    this.device = device;
    
    if (device.isWebGPU) {
        console.log('WebGPU available for compute shaders');
    } else {
        console.log('Using WebGL fallback');
    }

    this.initialized = true;
  }

  /**
   * Check if GPU compute is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}

// Global GPU compute instance
export const gpuCompute = new GPUComputeShaders();
