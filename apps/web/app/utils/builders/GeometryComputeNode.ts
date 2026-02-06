import { EnhancedGeometryData } from './GeometryBuilder';
import { GeometryOperations } from './operations/GeometryOperations';

export type NodeInput = EnhancedGeometryData | number | string | boolean | any;
export type NodeContext = Record<string, any>;

/**
 * Base class for all geometry nodes that support async execution
 * and potential GPU acceleration.
 */
export abstract class GeometryComputeNode {
  protected id: string;
  protected name: string;
  protected inputs: Map<string, NodeInput> = new Map();
  protected outputs: Map<string, any> = new Map();
  protected dirty: boolean = true;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Set input value
   */
  setInput(name: string, value: NodeInput): void {
    this.inputs.set(name, value);
    this.dirty = true;
  }

  /**
   * Get output value
   */
  getOutput(name: string): any {
    return this.outputs.get(name);
  }

  /**
   * Execute the node operation
   */
  abstract execute(context?: NodeContext): Promise<void>;

  /**
   * Check if node needs update
   */
  isDirty(): boolean {
    return this.dirty;
  }
}

/**
 * Example Transform Node using the new async/GPU system
 */
export class TransformComputeNode extends GeometryComputeNode {
  constructor(id: string) {
    super(id, 'Transform');
  }

  async execute(context?: NodeContext): Promise<void> {
    const geometry = this.inputs.get('geometry') as EnhancedGeometryData;
    const matrix = this.inputs.get('matrix') as any; // THREE.Matrix4

    if (!geometry || !matrix) {
      return; // Or output null
    }

    // Use async transform which prefers GPU
    const result = await GeometryOperations.transformAsync(geometry, matrix);
    
    this.outputs.set('geometry', result);
    this.dirty = false;
  }
}

/**
 * Example Displace Node
 */
export class DisplaceComputeNode extends GeometryComputeNode {
  constructor(id: string) {
    super(id, 'Displace');
  }

  async execute(context?: NodeContext): Promise<void> {
    const geometry = this.inputs.get('geometry') as EnhancedGeometryData;
    const amplitude = (this.inputs.get('amplitude') as number) || 1.0;
    const frequency = (this.inputs.get('frequency') as number) || 1.0;
    const seed = (this.inputs.get('seed') as number) || 0;

    if (!geometry) return;

    const result = await GeometryOperations.displaceAsync(geometry, amplitude, frequency, seed);
    
    this.outputs.set('geometry', result);
    this.dirty = false;
  }
}

