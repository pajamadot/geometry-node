// Data-driven node system - inspired by Blender and Unreal Engine
export type SocketType = 
  | 'geometry' | 'vector' | 'number' | 'integer' | 'boolean' 
  | 'string' | 'color' | 'time' | 'points' | 'vertices' 
  | 'faces' | 'instances' | 'material';

export type ParameterType = 
  | 'number' | 'integer' | 'boolean' | 'string' | 'vector' 
  | 'select' | 'color' | 'file' | 'vertices' | 'faces';

// Socket definition - describes an input or output
export interface SocketDefinition {
  id: string;
  name: string;
  type: SocketType;
  required?: boolean;
  defaultValue?: any;
  description?: string;
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
  
  // Sockets define the node's interface
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
export const SOCKET_METADATA: Record<SocketType, {
  color: string;
  className: string;
  compatibleWith: SocketType[];
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