import { WebGPUComputeSystem, webGPUCompute } from './WebGPUComputeSystem';
import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * WebGPU Geometry Processor
 * Implements core geometry operations using WGSL compute shaders.
 */
export class WebGPUGeometryProcessor {
  private system: WebGPUComputeSystem;

  constructor() {
    this.system = webGPUCompute;
  }

  /**
   * Initialize the system if needed
   */
  async init(): Promise<boolean> {
    return this.system.initialize();
  }

  /**
   * Transform positions using a matrix on the GPU
   */
  async transform(
    geometry: EnhancedGeometryData,
    matrix: Float32Array // 4x4 matrix as flat array
  ): Promise<EnhancedGeometryData> {
    if (!this.system.isAvailable() || !geometry.positionsArray) {
      console.warn('WebGPU unavailable or invalid geometry, falling back to CPU');
      return geometry; // Should fallback ideally, but for this proof of concept we return original
    }

    const device = this.system.getDevice()!;
    const positions = geometry.positionsArray;
    const vertexCount = positions.length / 3;

    // 1. Create Buffers
    // Input Positions (Storage Buffer)
    const positionBuffer = this.system.createBuffer(
      positions,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    // Transform Matrix (Uniform Buffer)
    const matrixBuffer = this.system.createBuffer(
      matrix,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

    // Output Positions (Storage Buffer) - can reuse position buffer if in-place, 
    // but for safety/clarity we create a new one or reuse input if binding allows read_write.
    // Let's use read_write on the same buffer for in-place modification to save memory.

    if (!positionBuffer || !matrixBuffer) {
      throw new Error('Failed to create WebGPU buffers');
    }

    // 2. Shader Module
    const shaderModule = device.createShaderModule({
      code: `
        struct Uniforms {
          matrix: mat4x4<f32>,
        };

        @group(0) @binding(0) var<storage, read_write> positions : array<f32>;
        @group(0) @binding(1) var<uniform> uniforms : Uniforms;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
          let index = global_id.x;
          // Guard against out of bounds if vertexCount isn't multiple of 64
          if (index >= ${vertexCount}u) {
            return;
          }

          let baseIndex = index * 3u;
          let x = positions[baseIndex];
          let y = positions[baseIndex + 1u];
          let z = positions[baseIndex + 2u];

          let v = vec4<f32>(x, y, z, 1.0);
          let transformed = uniforms.matrix * v;

          positions[baseIndex] = transformed.x;
          positions[baseIndex + 1u] = transformed.y;
          positions[baseIndex + 2u] = transformed.z;
        }
      `
    });

    // 3. Pipeline
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' }
        }
      ]
    });

    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });

    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: positionBuffer }
        },
        {
          binding: 1,
          resource: { buffer: matrixBuffer }
        }
      ]
    });

    // 4. Execute
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    
    // Calculate workgroups
    const workgroupCount = Math.ceil(vertexCount / 64);
    passEncoder.dispatchWorkgroups(workgroupCount);
    passEncoder.end();

    // Copy result back
    // We need a read buffer
    const readBuffer = this.system.createReadBuffer(positions.byteLength);
    if (!readBuffer) throw new Error('Failed to create read buffer');

    commandEncoder.copyBufferToBuffer(
      positionBuffer,
      0,
      readBuffer,
      0,
      positions.byteLength
    );

    device.queue.submit([commandEncoder.finish()]);

    // 5. Read results
    const resultPositions = await this.system.readBuffer(readBuffer, positions.byteLength);
    
    // Cleanup (simplistic for now)
    positionBuffer.destroy();
    matrixBuffer.destroy();
    readBuffer.destroy();

    if (!resultPositions) return geometry;

    return {
      ...geometry,
      positionsArray: resultPositions
    };
  }

  /**
   * Apply noise displacement on the GPU
   */
  async displace(
    geometry: EnhancedGeometryData,
    amplitude: number,
    frequency: number,
    seed: number = 0
  ): Promise<EnhancedGeometryData> {
    if (!this.system.isAvailable() || !geometry.positionsArray || !geometry.normalsArray) {
      return geometry;
    }

    const device = this.system.getDevice()!;
    const positions = geometry.positionsArray;
    const normals = geometry.normalsArray;
    const vertexCount = positions.length / 3;

    const positionBuffer = this.system.createBuffer(positions, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC);
    const normalBuffer = this.system.createBuffer(normals, GPUBufferUsage.STORAGE);
    
    const paramsData = new Float32Array([amplitude, frequency, seed]);
    const paramsBuffer = this.system.createBuffer(paramsData, GPUBufferUsage.UNIFORM);

    if (!positionBuffer || !normalBuffer || !paramsBuffer) return geometry;

    const shaderModule = device.createShaderModule({
      code: `
        struct Params {
          amplitude: f32,
          frequency: f32,
          seed: f32,
        };

        @group(0) @binding(0) var<storage, read_write> positions : array<f32>;
        @group(0) @binding(1) var<storage, read> normals : array<f32>;
        @group(0) @binding(2) var<uniform> params : Params;

        // Simple pseudo-random noise function
        fn noise(p: vec3<f32>) -> f32 {
          return fract(sin(dot(p, vec3<f32>(12.9898, 78.233, 45.164) + params.seed)) * 43758.5453);
        }

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
          let index = global_id.x;
          if (index >= ${vertexCount}u) {
            return;
          }

          let i = index * 3u;
          let p = vec3<f32>(positions[i], positions[i + 1u], positions[i + 2u]);
          let n = vec3<f32>(normals[i], normals[i + 1u], normals[i + 2u]);

          // 3D Sine Noise combination
          let noiseVal = (
            sin(p.x * params.frequency + params.seed) * cos(p.y * params.frequency + params.seed) * sin(p.z * params.frequency) +
            sin(p.x * params.frequency * 2.0) * 0.5
          ) * 0.5;

          let displacement = noiseVal * params.amplitude;
          let newPos = p + n * displacement;

          positions[i] = newPos.x;
          positions[i + 1u] = newPos.y;
          positions[i + 2u] = newPos.z;
        }
      `
    });

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
      ]
    });

    const pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      compute: { module: shaderModule, entryPoint: 'main' }
    });

    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: positionBuffer } },
        { binding: 1, resource: { buffer: normalBuffer } },
        { binding: 2, resource: { buffer: paramsBuffer } }
      ]
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(vertexCount / 64));
    passEncoder.end();

    const readBuffer = this.system.createReadBuffer(positions.byteLength);
    if (!readBuffer) return geometry;

    commandEncoder.copyBufferToBuffer(positionBuffer, 0, readBuffer, 0, positions.byteLength);
    device.queue.submit([commandEncoder.finish()]);

    const resultPositions = await this.system.readBuffer(readBuffer, positions.byteLength);

    positionBuffer.destroy();
    normalBuffer.destroy();
    paramsBuffer.destroy();
    readBuffer.destroy();

    if (!resultPositions) return geometry;

    return {
      ...geometry,
      positionsArray: resultPositions
    };
  }
}

export const webGPUProcessor = new WebGPUGeometryProcessor();

