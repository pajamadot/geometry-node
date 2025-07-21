// Unified type system for all socket, parameter, and input types
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

// Execution types - how nodes are executed
export type NodeExecutionType = 
  | 'javascript'   // JavaScript function (legacy)
  | 'expression'   // Mathematical expression
  | 'template'     // Template-based execution
  | 'builtin'      // Built-in function by name
  | 'composite';   // Combination of multiple operations

// Serializable node execution definition
export interface SerializableExecution {
  type: NodeExecutionType;
  // For 'expression' type - mathematical expressions
  expressions?: Record<string, string>; // output_id -> expression
  // For 'builtin' type - function name
  functionName?: string;
  // For 'template' type - template configuration
  template?: {
    type: string;
    operations: Array<{
      operation: string;
      inputs: string[];
      output: string;
    }>;
  };
  // For 'composite' type - multiple steps
  steps?: Array<{
    operation: string;
    inputs: Record<string, string | number>;
    output: string;
  }>;
}

// Icon types - serializable icon identifiers
export type IconType = 
  | 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus'          // Geometry
  | 'calculator' | 'plus' | 'minus' | 'x' | 'divide'                    // Math
  | 'move' | 'rotate-3d' | 'scale' | 'grid-3x3'                        // Transform
  | 'clock' | 'play' | 'pause' | 'skip-forward'                        // Time
  | 'git-branch' | 'git-merge' | 'combine' | 'split'                    // Vector/Combine
  | 'map-pin' | 'target' | 'layers' | 'copy'                           // Points/Instance
  | 'settings' | 'sliders' | 'toggles' | 'monitor'                     // Utility
  | 'waves' | 'mountain' | 'building' | 'shapes' | 'sparkles';         // Procedural

// Database-ready node definition
export interface SerializableNodeDefinition {
  // Basic properties
  id?: string;              // Database ID
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  version?: string;         // For versioning
  
  // Visual properties
  color: {
    primary: string;
    secondary: string;
  };
  
  // Layout and UI
  layout?: LayoutRow[];
  ui?: {
    width?: number;
    height?: number;
    icon?: IconType;         // Serializable icon identifier
    advanced?: string[];
  };
  
  // Node definition
  inputs: SocketDefinition[];
  outputs: SocketDefinition[];
  parameters: ParameterDefinition[];
  
  // Serializable execution
  execution: SerializableExecution;
  
  // Metadata
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

// Runtime node definition (extends serializable with compiled functions)
export interface NodeDefinition extends Omit<SerializableNodeDefinition, 'ui'> {
  // Runtime execution function (compiled from SerializableExecution)
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => Record<string, any>;
  
  // UI with React component icon support
  ui?: {
    width?: number;
    height?: number;
    icon?: string | React.ComponentType<any>;
    advanced?: string[];
  };
}

// Alias for backward compatibility

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
  name: string;
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
  | 'output' | 'modifiers' | 'instances' | 'animation';

// Complete node definition - this is what defines a node type
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  color: {
    primary: string;
    secondary: string;
  };
  
  // Row-based layout definition (optional - can be auto-generated)
  layout?: LayoutRow[];
  
  // Legacy socket definitions (for backward compatibility)
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
    icon?: string | React.ComponentType<any>;
    advanced?: string[]; // parameter IDs that go in advanced section
  };
}

// Runtime node instance
export interface NodeInstance {
  id: string;
  definition: NodeDefinition;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  enabled: boolean;
  selected?: boolean;
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
    compatibleWith: ['number', 'integer']
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
export const CATEGORY_METADATA: Record<NodeCategory, {
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
  }
};

// Helper function to auto-generate layout from inputs and outputs
export function generateNodeLayout(
  inputs: SocketDefinition[], 
  outputs: SocketDefinition[]
): LayoutRow[] {
  const layout: LayoutRow[] = [
    {
      type: 'title',
      height: 40
    }
  ];

  // Add outputs row if there are outputs
  if (outputs.length > 0) {
    layout.push({
      type: 'outputs',
      components: outputs.map(output => ({
        id: output.id,
        name: output.name,
        type: output.type,
        description: output.description
      })),
      height: 32
    });
  }

  // Add inputs row if there are inputs
  if (inputs.length > 0) {
    layout.push({
      type: 'inputs',
      components: inputs.map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        defaultValue: input.defaultValue,
        description: input.description,
        required: input.required
      })),
      height: Math.max(32, inputs.length * 32) // Dynamic height based on input count
    });
  }

  return layout;
}

// Enhanced layout generation with pattern recognition
export function generateSmartLayout(
  inputs: SocketDefinition[], 
  outputs: SocketDefinition[],
  parameters: ParameterDefinition[] = []
): LayoutRow[] {
  return generateStandardLayout(inputs, outputs, parameters);
}













// Generate standard layout (socket inputs + parameters)
function generateStandardLayout(inputs: SocketDefinition[], outputs: SocketDefinition[], parameters: ParameterDefinition[]): LayoutRow[] {
  const layout: LayoutRow[] = [
    { type: 'title', height: 40 }
  ];
  
  // Add outputs
  if (outputs.length > 0) {
    layout.push({
      type: 'outputs',
      components: outputs.map(output => ({
        id: output.id,
        name: output.name,
        type: output.type,
        description: output.description
      })),
      height: Math.max(40, outputs.length * 40) // Increased height for better spacing
    });
  }
  
  // Add socket inputs row
  if (inputs.length > 0) {
    layout.push({
      type: 'inputs',
      components: inputs.map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        defaultValue: input.defaultValue,
        description: input.description,
        required: input.required
      })),
      height: Math.max(40, inputs.length * 40) // Increased height for better spacing
    });
  }
  
  // Add parameters row
  if (parameters.length > 0) {
    layout.push({
      type: 'parameters',
      components: parameters.map(param => ({
        id: param.id,
        name: param.name,
        type: param.type,
        defaultValue: param.defaultValue,
        description: param.description || `Parameter: ${param.name}`,
        min: param.min,
        max: param.max,
        step: param.step,
        options: param.options
      })),
      height: Math.max(40, parameters.length * 40) // Increased height for better spacing
    });
  }
  
  return layout;
}

 