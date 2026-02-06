import { Node } from 'reactflow';
import * as pc from 'playcanvas';
import { GeometryData, TransformData, MaterialData, PrimitiveParams, PrimitiveType } from './geometry';

// ==========================================
// Unified Type System
// ==========================================

export type ParameterType = 
  | 'geometry'     // 3D geometry data
  | 'vector'       // 3-component vector (x, y, z)
  | 'number'       // Single number input
  | 'integer'      // Integer number
  | 'boolean'      // True/false input
  | 'string'       // Text input
  | 'color'        // Color input
  | 'time'         // Time/animation input
  | 'points'       // Point cloud data
  | 'vertices'     // Raw vertex data
  | 'faces'        // Face topology data
  | 'instances'    // Instance data
  | 'material'     // Material data
  | 'transform'    // Position + Rotation + Scale
  | 'quaternion'   // 4-component quaternion (x, y, z, w)
  | 'matrix'       // Matrix data
  | 'select'       // Enum/select input
  | 'enum'         // Enum/select input (alias for select)
  | 'numeric'      // Numeric input (alias for number)
  | 'file';        // File input

// Input component definition
export interface InputComponent {
  id: string;
  name: string;
  type: ParameterType;
  defaultValue?: any;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For enum/select type
}

// Row-based layout system
export type RowType = 
  | 'title'        // Node title row
  | 'instruction'  // Instructions/formulas row
  | 'outputs'      // Output sockets row
  | 'inputs'       // Input sockets row
  | 'parameters';  // Parameters row

export interface LayoutRow {
  type: RowType;
  height?: number;  // Row height in pixels
  components?: InputComponent[];
  instruction?: string;  // For instruction rows
}

// Socket definition - describes an input or output
export interface SocketDefinition {
  id: string;
  name: string;
  type: ParameterType;
  required?: boolean;
  defaultValue?: any;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For enum/select type
}

// Parameter definition - describes a controllable property
export interface ParameterDefinition {
  id: string;
  name: string; // Display name
  label?: string; // Alias for name (backward compatibility)
  type: ParameterType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for select type
  description?: string;
  category?: string; // for grouping
}

// Node category for organization
export type NodeCategory =
  | 'geometry' | 'math' | 'vector' | 'utilities' | 'input'
  | 'output' | 'modifiers' | 'instances' | 'animation' | 'materials';

// Node type identifier (string used to reference node definitions)
export type NodeType = string;

// Complete node definition - this is what defines a node type in the registry
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: NodeCategory | string; // Allow string for flexibility
  color: {
    primary: string;
    secondary: string;
  };
  
  // Row-based layout definition (optional - can be auto-generated)
  layout?: LayoutRow[];
  
  // Socket definitions
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  
  // Parameters define controllable properties
  parameters: ParameterDefinition[];
  
  // Node execution function
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any>;
  
  // Optional UI customization
  ui?: {
    width?: number;
    height?: number;
    icon?: any; // Lucide icon or string
    advanced?: string[]; // parameter IDs that go in advanced section
  };
}

// Socket metadata for styling and behavior
export const SOCKET_METADATA: Record<ParameterType, {
  color: string;
  className: string;
  compatibleWith: ParameterType[];
}> = {
  geometry: {
    color: '#eab308',
    className: 'geometry-handle',
    compatibleWith: ['geometry']
  },
  vector: {
    color: '#3b82f6',
    className: 'vector-handle',
    compatibleWith: ['vector']
  },
  number: {
    color: '#22c55e',
    className: 'number-handle',
    compatibleWith: ['number', 'integer', 'numeric']
  },
  integer: {
    color: '#16a34a',
    className: 'integer-handle',
    compatibleWith: ['integer', 'number']
  },
  boolean: {
    color: '#8b5cf6',
    className: 'boolean-handle',
    compatibleWith: ['boolean']
  },
  string: {
    color: '#f59e0b',
    className: 'string-handle',
    compatibleWith: ['string']
  },
  color: {
    color: '#ec4899',
    className: 'color-handle',
    compatibleWith: ['color']
  },
  time: {
    color: '#ec4899',
    className: 'time-handle',
    compatibleWith: ['time', 'number']
  },
  points: {
    color: '#06b6d4',
    className: 'points-handle',
    compatibleWith: ['points']
  },
  vertices: {
    color: '#ef4444',
    className: 'vertices-handle',
    compatibleWith: ['vertices']
  },
  faces: {
    color: '#6366f1',
    className: 'faces-handle',
    compatibleWith: ['faces']
  },
  instances: {
    color: '#10b981',
    className: 'instances-handle',
    compatibleWith: ['instances', 'geometry']
  },
  material: {
    color: '#78716c',
    className: 'material-handle',
    compatibleWith: ['material']
  },
  transform: {
    color: '#2563eb',
    className: 'transform-handle',
    compatibleWith: ['transform']
  },
  quaternion: {
    color: '#8b5cf6',
    className: 'quaternion-handle',
    compatibleWith: ['quaternion']
  },
  matrix: {
    color: '#059669',
    className: 'matrix-handle',
    compatibleWith: ['matrix']
  },
  numeric: {
    color: '#22c55e',
    className: 'number-handle',
    compatibleWith: ['number', 'integer', 'numeric']
  },
  enum: {
    color: '#a855f7',
    className: 'enum-handle',
    compatibleWith: ['enum', 'select']
  },
  select: {
    color: '#a855f7',
    className: 'select-handle',
    compatibleWith: ['enum', 'select']
  },
  file: {
    color: '#6b7280',
    className: 'file-handle',
    compatibleWith: ['file']
  }
};

// Category metadata
export const CATEGORY_METADATA: Record<string, {
  color: string;
  icon: string;
  description: string;
}> = {
  geometry: {
    color: 'orange',
    icon: '',
    description: 'Basic geometry creation and manipulation'
  },
  math: {
    color: 'green',
    icon: '',
    description: 'Mathematical operations and functions'
  },
  vector: {
    color: 'blue',
    icon: '',
    description: 'Vector mathematics and transformations'
  },
  utilities: {
    color: 'gray',
    icon: '',
    description: 'Utility nodes and helpers'
  },
  input: {
    color: 'cyan',
    icon: '',
    description: 'Input and data sources'
  },
  output: {
    color: 'yellow',
    icon: '',
    description: 'Output and visualization'
  },
  modifiers: {
    color: 'purple',
    icon: '',
    description: 'Geometry modifiers and effects'
  },
  instances: {
    color: 'emerald',
    icon: '',
    description: 'Instancing and duplication'
  },
  animation: {
    color: 'pink',
    icon: '',
    description: 'Time and animation'
  },
  materials: {
    color: 'stone',
    icon: '',
    description: 'Material creation and manipulation'
  }
};

// ==========================================
// React Flow Node Data Types (Runtime)
// ==========================================

export interface BaseNodeData {
  id: string;
  type: string;
  label: string;
  definition?: NodeDefinition; // Reference to definition
  inputConnections?: Record<string, any>; 
  liveParameterValues?: Record<string, any>; 
  parameters?: Record<string, any>; 
  socketValues?: Record<string, any>;
  disabled?: boolean;
  selected?: boolean;
}

// Specific node data types (Legacy & New)
export interface PrimitiveNodeData extends BaseNodeData {
  primitiveType: PrimitiveType;
  parameters: any; // PrimitiveParams[PrimitiveType];
}

export interface TransformNodeData extends BaseNodeData {
  transform: TransformData;
}

export interface MaterialNodeData extends BaseNodeData {
  material: MaterialData;
}

export interface OutputNodeData extends BaseNodeData {
  // specific fields
}

export interface VectorNodeData extends BaseNodeData {
  operation: 'add' | 'subtract' | 'multiply' | 'cross' | 'dot' | 'normalize' | 'length';
  vector?: { x: number; y: number; z: number };
}

export interface CombineNodeData extends BaseNodeData {
  operation: 'merge' | 'union' | 'difference' | 'intersection';
}

export interface JoinNodeData extends BaseNodeData {
  operation: 'merge' | 'instance' | 'array';
}

export interface ParametricSurfaceNodeData extends BaseNodeData {
  uFunction: string;
  vFunction: string;
  zFunction: string;
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  uSegments: number;
  vSegments: number;
}

export interface TimeNodeData extends BaseNodeData {
  timeMode: 'seconds' | 'frames';
  outputType: 'raw' | 'sin' | 'cos' | 'sawtooth' | 'triangle' | 'square';
  frequency: number;
  amplitude: number;
  offset: number;
  phase: number;
}

export interface DistributePointsNodeData extends BaseNodeData {
  distributeMethod: 'random' | 'poisson' | 'grid';
  density: number;
  seed: number;
  distanceMin?: number;
}

export interface InstanceOnPointsNodeData extends BaseNodeData {
  pickInstance: boolean;
  instanceIndex: number;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface MeshBooleanNodeData extends BaseNodeData {
  operation: 'difference' | 'union' | 'intersect';
  useSelf: boolean;
  holeThreshold: number;
}

export interface SubdivideMeshNodeData extends BaseNodeData {
  level: number;
}

export interface SetPositionNodeData extends BaseNodeData {
  positionOffset: { x: number; y: number; z: number };
  selectionEnabled: boolean;
}

export interface CreateVerticesNodeData extends BaseNodeData {
  vertices: Array<{ x: number; y: number; z: number }>;
  vertexCount: number;
}

export interface CreateFacesNodeData extends BaseNodeData {
  faces: Array<{ a: number; b: number; c: number; d?: number }>;
  faceCount: number;
}

export interface MergeGeometryNodeData extends BaseNodeData {
  computeNormals: boolean;
  generateUVs: boolean;
}

export interface GetVertexDataNodeData extends BaseNodeData {
  outputType: 'positions' | 'normals' | 'uvs' | 'colors' | 'indices';
}

export interface SetVertexAttributesNodeData extends BaseNodeData {
  attributeType: 'normals' | 'uvs' | 'colors';
  attributeData: Array<{ x: number; y: number; z?: number; w?: number }>;
}

// Math node data
export interface MathNodeData extends BaseNodeData {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sin' | 'cos' | 'sqrt' | 'abs';
  valueA?: number;
  valueB?: number;
}

export interface VectorMathNodeData extends BaseNodeData {
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'cross' | 'dot' | 'normalize' | 'length';
  vectorA?: { x: number; y: number; z: number };
  vectorB?: { x: number; y: number; z: number };
  scale?: number;
}

// Union type for all node data
export type GeometryNodeData = 
  | BaseNodeData
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
  | SetVertexAttributesNodeData;

// React Flow node type
export type GeometryNode = Node<GeometryNodeData>;

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

/**
 * Generate a smart layout from inputs, outputs, and parameters.
 * Auto-generates a layout if one is not provided in the node definition.
 */
export function generateSmartLayout(
  inputs: SocketDefinition[],
  outputs: SocketDefinition[],
  parameters: ParameterDefinition[]
): LayoutRow[] {
  const rows: LayoutRow[] = [];

  // Add title row
  rows.push({ type: 'title' as RowType, height: 32 });

  // Add outputs row if there are outputs
  if (outputs.length > 0) {
    rows.push({ type: 'outputs' as RowType, height: 28 });
  }

  // Add inputs row if there are inputs
  if (inputs.length > 0) {
    rows.push({ type: 'inputs' as RowType, height: 28 * inputs.length });
  }

  // Add parameters row if there are parameters
  if (parameters.length > 0) {
    // Convert parameters to InputComponent format for the layout
    const components: InputComponent[] = parameters.map(param => ({
      id: param.id,
      name: param.name || param.label || param.id,
      type: param.type,
      defaultValue: param.defaultValue,
      description: param.description,
      min: param.min,
      max: param.max,
      step: param.step,
      options: param.options,
    }));

    rows.push({
      type: 'parameters' as RowType,
      height: 36 * parameters.length,
      components,
    });
  }

  return rows;
}
