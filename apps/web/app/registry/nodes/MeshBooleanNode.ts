import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Combine } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

// MESH BOOLEAN NODE
export const meshBooleanNodeDefinition: NodeDefinition = {
  type: 'meshBoolean',
  name: 'Mesh Boolean',
  description: 'Perform boolean operations (union, difference, intersection)',
  category: 'modifiers',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },

  inputs: [
    {
      id: 'geometryA',
      name: 'Geometry A',
      type: 'geometry',
      required: true,
      description: 'First geometry'
    },
    {
      id: 'geometryB',
      name: 'Geometry B',
      type: 'geometry',
      required: true,
      description: 'Second geometry'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'union',
      options: ['union', 'difference', 'intersection'],
      description: 'Boolean operation type'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Result of boolean operation'
    }
  ],
  parameters: [],
  ui: {
    width: 240,
    height: 280,
    icon: Combine
  },
  execute: (inputs, parameters) => {
    const geometryA = inputs.geometryA as EnhancedGeometryData;
    const geometryB = inputs.geometryB as EnhancedGeometryData;
    const operation = inputs.operation || 'union';

    if (!geometryA || !geometryB) {
      return { geometry: geometryA || geometryB || null };
    }

    // Placeholder implementation:
    // CSG is hard. We'll just return geometryA for now or a simple merge for union.
    // Ideally we'd use a library like csg.js or manifold tailored for our data structure.
    
    if (operation === 'union') {
        return { geometry: VertexDataUtils.merge([geometryA, geometryB]) };
    }

    // For difference/intersection, fallback to A for now to prevent crash
    console.warn('Mesh Boolean (Difference/Intersection) not implemented yet - returning Geometry A');
    return { geometry: VertexDataUtils.clone(geometryA) };
  }
};
