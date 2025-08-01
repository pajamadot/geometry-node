import { ParameterType } from '../../types/nodeSystem';

// Re-export for convenience
export type { ParameterType };

// Base interface for all type renderers
export interface TypeRendererProps {
  id: string;
  name: string;
  type: ParameterType;
  isConnected: boolean;
  isInput: boolean; // true for input, false for output
  isParameter?: boolean; // true if this is a parameter, not a direct input
  value?: any;
  defaultValue?: any;
  onValueChange?: (value: any) => void;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For enum/select types
}

// Socket metadata for styling
export interface SocketStyle {
  color: string;
  className: string;
  size: 'small' | 'medium' | 'large';
  shape: 'circle' | 'diamond' | 'square';
}

// Type-specific metadata
export const TYPE_METADATA: Record<ParameterType, SocketStyle> = {
  geometry: {
    color: '#06b6d4', // cyan
    className: 'geometry-handle',
    size: 'large',
    shape: 'diamond'
  },
  vector: {
    color: '#0d9488', // teal
    className: 'vector-handle',
    size: 'medium',
    shape: 'circle'
  },
  number: {
    color: '#6b7280', // grey
    className: 'number-handle',
    size: 'medium',
    shape: 'circle'
  },
  integer: {
    color: '#374151', // dark-grey
    className: 'integer-handle',
    size: 'medium',
    shape: 'circle'
  },
  boolean: {
    color: '#22c55e', // green
    className: 'boolean-handle',
    size: 'medium',
    shape: 'circle'
  },
  string: {
    color: '#a855f7', // purple
    className: 'string-handle',
    size: 'medium',
    shape: 'circle'
  },
  color: {
    color: '#eab308', // yellow
    className: 'color-handle',
    size: 'medium',
    shape: 'circle'
  },
  time: {
    color: '#0ea5e9', // sky-blue
    className: 'time-handle',
    size: 'medium',
    shape: 'circle'
  },
  points: {
    color: '#06b6d4', // cyan
    className: 'points-handle',
    size: 'medium',
    shape: 'circle'
  },
  vertices: {
    color: '#ef4444', // red
    className: 'vertices-handle',
    size: 'medium',
    shape: 'circle'
  },
  faces: {
    color: '#6366f1', // indigo
    className: 'faces-handle',
    size: 'medium',
    shape: 'circle'
  },
  instances: {
    color: '#10b981', // emerald
    className: 'instances-handle',
    size: 'medium',
    shape: 'circle'
  },
  material: {
    color: '#78716c', // stone
    className: 'material-handle',
    size: 'medium',
    shape: 'circle'
  },
  transform: {
    color: '#0ea5e9', // sky-blue
    className: 'transform-handle',
    size: 'medium',
    shape: 'circle'
  },
  quaternion: {
    color: '#0ea5e9', // sky-blue
    className: 'quaternion-handle',
    size: 'medium',
    shape: 'circle'
  },
  matrix: {
    color: '#0891b2', // dark-cyan
    className: 'matrix-handle',
    size: 'medium',
    shape: 'circle'
  },
  select: {
    color: '#c084fc', // lilac
    className: 'select-handle',
    size: 'medium',
    shape: 'circle'
  },
  enum: {
    color: '#c084fc', // lilac
    className: 'enum-handle',
    size: 'medium',
    shape: 'circle'
  },
  numeric: {
    color: '#6b7280', // grey
    className: 'number-handle',
    size: 'medium',
    shape: 'circle'
  },
  file: {
    color: '#6b7280', // grey
    className: 'file-handle',
    size: 'medium',
    shape: 'circle'
  }
};

// Widget types for different parameter types
export type WidgetType = 
  | 'none'           // No widget (geometry)
  | 'numeric'        // Numeric field/slider
  | 'stepper'        // Integer stepper
  | 'checkbox'       // Boolean checkbox
  | 'vector2'        // X/Y fields
  | 'vector3'        // X/Y/Z fields
  | 'vector4'        // X/Y/Z/W fields
  | 'rotation'       // XYZ degree fields
  | 'quaternion'     // XYZW fields
  | 'matrix3'        // 3x3 grid
  | 'matrix4'        // 4x4 grid
  | 'color'          // Color picker
  | 'text'           // Text input
  | 'dropdown';      // Enum dropdown

// Type to widget mapping
export const TYPE_WIDGET_MAP: Record<ParameterType, WidgetType> = {
  geometry: 'none',
  vector: 'vector3',
  number: 'numeric',
  integer: 'stepper',
  boolean: 'checkbox',
  string: 'text',
  color: 'color',
  time: 'numeric',
  points: 'none',
  vertices: 'none',
  faces: 'none',
  instances: 'none',
  material: 'none',
  transform: 'none',
  quaternion: 'quaternion',
  matrix: 'matrix4',
  select: 'dropdown',
  enum: 'dropdown',
  numeric: 'numeric',
  file: 'text'
}; 