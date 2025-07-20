// ===========================
// NODE CONNECTION TYPE SYSTEM
// ===========================
// Blender-inspired type system for node graph connections

export type SocketType = 
  | 'geometry'    // 3D geometry data
  | 'number'      // Single numeric value
  | 'integer'     // Integer values only
  | 'vector'      // 3D vector (x, y, z)
  | 'boolean'     // True/false
  | 'string'      // Text values
  | 'color'       // RGB/RGBA color values
  | 'time'        // Time/animation values
  | 'points'      // Point cloud data
  | 'vertices'    // Raw vertex data
  | 'faces'       // Face topology data
  | 'instances'   // Instance data
  | 'material';   // Material properties

export interface SocketTypeInfo {
  name: string;
  color: string;
  description: string;
  defaultValue: any;
  validator?: (value: any) => boolean;
}

export const SOCKET_TYPES: Record<SocketType, SocketTypeInfo> = {
  geometry: {
    name: 'Geometry',
    color: '#eab308', // Yellow
    description: 'Three.js geometry data',
    defaultValue: null,
  },
  number: {
    name: 'Number', 
    color: '#22c55e', // Green
    description: 'Floating point number',
    defaultValue: 0,
    validator: (value) => typeof value === 'number' && !isNaN(value),
  },
  integer: {
    name: 'Integer',
    color: '#16a34a', // Dark green
    description: 'Whole numbers only',
    defaultValue: 0,
    validator: (value) => Number.isInteger(value),
  },
  vector: {
    name: 'Vector',
    color: '#3b82f6', // Blue
    description: '3D vector (x, y, z)',
    defaultValue: { x: 0, y: 0, z: 0 },
    validator: (value) => value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number',
  },
  boolean: {
    name: 'Boolean',
    color: '#8b5cf6', // Purple
    description: 'True or false value',
    defaultValue: false,
    validator: (value) => typeof value === 'boolean',
  },
  string: {
    name: 'String',
    color: '#f59e0b', // Amber
    description: 'Text value',
    defaultValue: '',
    validator: (value) => typeof value === 'string',
  },
  color: {
    name: 'Color',
    color: '#ec4899', // Pink
    description: 'RGB color value',
    defaultValue: { r: 1, g: 1, b: 1 },
    validator: (value) => value && typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number',
  },
  time: {
    name: 'Time',
    color: '#ec4899', // Pink
    description: 'Time/animation value',
    defaultValue: 0,
    validator: (value) => typeof value === 'number',
  },
  points: {
    name: 'Points',
    color: '#06b6d4', // Cyan
    description: 'Point cloud data',
    defaultValue: [],
  },
  vertices: {
    name: 'Vertices',
    color: '#ef4444', // Red
    description: 'Raw vertex positions',
    defaultValue: [],
  },
  faces: {
    name: 'Faces',
    color: '#6366f1', // Indigo
    description: 'Face topology data',
    defaultValue: [],
  },
  instances: {
    name: 'Instances',
    color: '#10b981', // Emerald
    description: 'Instance transformation data',
    defaultValue: [],
  },
  material: {
    name: 'Material',
    color: '#78716c', // Stone
    description: 'Material properties',
    defaultValue: null,
  },
};

// Type conversion rules - which types can be converted to others
export const TYPE_CONVERSIONS: Record<SocketType, SocketType[]> = {
  number: ['integer', 'time'], // Numbers can become integers or time
  integer: ['number', 'time'], // Integers can become numbers or time
  time: ['number'], // Time can become a number
  vector: [], // Vectors are strict
  boolean: ['integer', 'number'], // Booleans can become 0/1
  string: [], // Strings are strict
  color: ['vector'], // Colors can become vectors
  geometry: [], // Geometry is strict
  points: [], // Points are strict
  vertices: [], // Vertices are strict
  faces: [], // Faces are strict
  instances: [], // Instances are strict
  material: [], // Materials are strict
};

/**
 * Check if two socket types are compatible for connection
 */
export function areTypesCompatible(sourceType: SocketType, targetType: SocketType): boolean {
  // Exact match
  if (sourceType === targetType) {
    return true;
  }
  
  // Check if source type can be converted to target type
  const conversions = TYPE_CONVERSIONS[sourceType] || [];
  return conversions.includes(targetType);
}

/**
 * Get the CSS class name for a socket type
 */
export function getSocketClassName(type: SocketType): string {
  return `${type}-handle`;
}

/**
 * Get socket type from handle ID
 */
export function getSocketTypeFromHandle(handleId: string): SocketType {
  // Extract type from handle ID patterns like "position-x-in", "width-in", etc.
  if (handleId.includes('geometry')) return 'geometry';
  if (handleId.includes('time')) return 'time';
  if (handleId.includes('points')) return 'points';
  if (handleId.includes('vertices')) return 'vertices';
  if (handleId.includes('faces')) return 'faces';
  if (handleId.includes('instances')) return 'instances';
  if (handleId.includes('material')) return 'material';
  if (handleId.includes('color')) return 'color';
  // Check for individual vector components first (position-x-in, scale-y-in, etc.)
  if (handleId.match(/-(x|y|z)-in$/)) return 'number';
  if (handleId.includes('position') || handleId.includes('rotation') || handleId.includes('scale')) return 'vector';
  if (handleId.includes('boolean') || handleId.includes('enabled') || handleId.includes('visible')) return 'boolean';
  if (handleId.includes('string') || handleId.includes('text') || handleId.includes('name')) return 'string';
  
  // Default to number for most numeric parameters
  return 'number';
}

/**
 * Convert value from one type to another
 */
export function convertValue(value: any, fromType: SocketType, toType: SocketType): any {
  if (fromType === toType) return value;
  
  // Number conversions
  if (fromType === 'number' && toType === 'integer') {
    return Math.round(value);
  }
  if (fromType === 'integer' && toType === 'number') {
    return value;
  }
  if (fromType === 'boolean' && toType === 'number') {
    return value ? 1 : 0;
  }
  if (fromType === 'boolean' && toType === 'integer') {
    return value ? 1 : 0;
  }
  if (fromType === 'color' && toType === 'vector') {
    return { x: value.r, y: value.g, z: value.b };
  }
  if (fromType === 'time' && toType === 'number') {
    return value;
  }
  
  // If no conversion available, return default value
  return SOCKET_TYPES[toType].defaultValue;
} 