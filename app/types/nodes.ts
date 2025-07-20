import { Node, Edge, Connection } from 'reactflow';
import { GeometryData, PrimitiveParams, PrimitiveType, TransformData, MaterialData } from './geometry';

// Base node data structure
export interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  inputConnections?: Record<string, any>; // Track which parameters have input connections
  liveParameterValues?: Record<string, any>; // Live values from connected inputs
  parameters?: Record<string, any>; // Node parameters for registry-based nodes
}

// Node types in our geometry system  
export type NodeType = 
  | 'primitive' 
  | 'transform' 
  | 'material' 
  | 'output' 
  | 'math' 
  | 'vector-math'
  | 'vector'
  | 'combine'
  | 'join'
  | 'modifier'
  | 'parametric'
  | 'time'
  | 'distribute-points'
  | 'instance-on-points'
  | 'mesh-boolean'
  | 'subdivide-mesh'
  | 'set-position'
  | 'create-vertices'
  | 'create-faces'
  | 'merge-geometry'
  | 'get-vertex-data'
  | 'set-vertex-attributes'
  // Registry-based node types
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'subdivide-mesh';

// Input/Output port types
export type PortType = 'geometry' | 'vector' | 'number' | 'integer' | 'material' | 'boolean' | 'string' | 'color' | 'time' | 'vertices' | 'faces' | 'attributes' | 'points' | 'instances';

export interface NodePort {
  id: string;
  name: string;
  type: PortType;
  required?: boolean;
  defaultValue?: any;
}

// Specific node data types
export interface PrimitiveNodeData extends BaseNodeData {
  type: 'primitive';
  primitiveType: PrimitiveType;
  parameters: PrimitiveParams[PrimitiveType];
}

export interface TransformNodeData extends BaseNodeData {
  type: 'transform';
  transform: TransformData;
}

export interface MaterialNodeData extends BaseNodeData {
  type: 'material';
  material: MaterialData;
}

export interface OutputNodeData extends BaseNodeData {
  type: 'output';
}



export interface VectorNodeData extends BaseNodeData {
  type: 'vector';
  operation: 'add' | 'subtract' | 'multiply' | 'cross' | 'dot' | 'normalize' | 'length';
  vector?: { x: number; y: number; z: number };
}

export interface CombineNodeData extends BaseNodeData {
  type: 'combine';
  operation: 'merge' | 'union' | 'difference' | 'intersection';
}

export interface JoinNodeData extends BaseNodeData {
  type: 'join';
  operation: 'merge' | 'instance' | 'array';
}

// Parametric Surface Node
export interface ParametricSurfaceNodeData extends BaseNodeData {
  type: 'parametric';
  uFunction: string;  // JavaScript function for X coordinate
  vFunction: string;  // JavaScript function for Y coordinate
  zFunction: string;  // JavaScript function for Z coordinate
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  uSegments: number;
  vSegments: number;
}

// Time Node
export interface TimeNodeData extends BaseNodeData {
  type: 'time';
  timeMode: 'seconds' | 'frames';
  outputType: 'raw' | 'sin' | 'cos' | 'sawtooth' | 'triangle' | 'square';
  frequency: number;
  amplitude: number;
  offset: number;
  phase: number;
}

// Blender-inspired Geometry Nodes
export interface DistributePointsNodeData extends BaseNodeData {
  type: 'distribute-points';
  distributeMethod: 'random' | 'poisson' | 'grid';
  density: number;
  seed: number;
  distanceMin?: number;
}

export interface InstanceOnPointsNodeData extends BaseNodeData {
  type: 'instance-on-points';
  pickInstance: boolean;
  instanceIndex: number;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface MeshBooleanNodeData extends BaseNodeData {
  type: 'mesh-boolean';
  operation: 'difference' | 'union' | 'intersect';
  useSelf: boolean;
  holeThreshold: number;
}

export interface SubdivideMeshNodeData extends BaseNodeData {
  type: 'subdivide-mesh';
  level: number;
}

export interface SetPositionNodeData extends BaseNodeData {
  type: 'set-position';
  positionOffset: { x: number; y: number; z: number };
  selectionEnabled: boolean;
}

// Raw Vertex/Face Construction System
export interface CreateVerticesNodeData extends BaseNodeData {
  type: 'create-vertices';
  vertices: Array<{ x: number; y: number; z: number }>;
  vertexCount: number;
}

export interface CreateFacesNodeData extends BaseNodeData {
  type: 'create-faces';
  faces: Array<{ a: number; b: number; c: number; d?: number }>; // Triangle or quad faces
  faceCount: number;
}

export interface MergeGeometryNodeData extends BaseNodeData {
  type: 'merge-geometry';
  computeNormals: boolean;
  generateUVs: boolean;
}

export interface GetVertexDataNodeData extends BaseNodeData {
  type: 'get-vertex-data';
  outputType: 'positions' | 'normals' | 'uvs' | 'colors' | 'indices';
}

export interface SetVertexAttributesNodeData extends BaseNodeData {
  type: 'set-vertex-attributes';
  attributeType: 'normals' | 'uvs' | 'colors';
  attributeData: Array<{ x: number; y: number; z?: number; w?: number }>;
}

// Registry-based node data (for new data-driven system)
export interface RegistryNodeData extends BaseNodeData {
  type: 'cube' | 'sphere' | 'cylinder' | 'subdivide-mesh' | 'transform' | 'output' | 'math' | 'vector-math' | 'join' | 'distribute-points' | 'instance-on-points' | 'create-vertices' | 'create-faces' | 'merge-geometry' | 'time';
  parameters: Record<string, any>;
}

// Import math node interfaces
import { MathNodeData } from '../nodes/MathNode';
import { VectorMathNodeData } from '../nodes/VectorMathNode';

// Union type for all node data
export type GeometryNodeData = 
  | PrimitiveNodeData 
  | TransformNodeData 
  | MaterialNodeData 
  | OutputNodeData 
  | MathNodeData 
  | VectorMathNodeData
  | VectorNodeData 
  | CombineNodeData
  | JoinNodeData
  | ParametricSurfaceNodeData
  | TimeNodeData
  | DistributePointsNodeData
  | InstanceOnPointsNodeData
  | MeshBooleanNodeData
  | SubdivideMeshNodeData
  | SetPositionNodeData
  | CreateVerticesNodeData
  | CreateFacesNodeData
  | MergeGeometryNodeData
  | GetVertexDataNodeData
  | SetVertexAttributesNodeData
  | RegistryNodeData;

// React Flow node with our data
export type GeometryNode = Node<GeometryNodeData>;

// Node definitions for creating new nodes
export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  category: 'primitives' | 'transforms' | 'materials' | 'math' | 'utilities';
  defaultData: Partial<GeometryNodeData>;
}

// Graph execution context
export interface NodeExecutionContext {
  nodeId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  cache: Map<string, any>;
}

// Result of node execution
export interface NodeExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
}

// Graph compilation result
export interface GraphCompilationResult {
  success: boolean;
  geometry?: GeometryData;
  material?: MaterialData;
  transform?: TransformData;
  error?: string;
} 