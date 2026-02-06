import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Merge } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

// JOIN NODE
export const joinNodeDefinition: NodeDefinition = {
  type: 'join',
  name: 'Join Geometry',
  description: 'Combine multiple geometries',
  category: 'utilities',
  color: {
    primary: '#f59e42',
    secondary: '#b45309'
  },
  inputs: [
    {
      id: 'geometryA',
      name: 'Geometry A',
      type: 'geometry',
      required: true,
      description: 'First geometry to join'
    },
    {
      id: 'geometryB',
      name: 'Geometry B',
      type: 'geometry',
      required: true,
      description: 'Second geometry to join'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'merge',
      options: ['merge', 'instance', 'array'],
      description: 'Join operation type'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Combined geometry'
    }
  ],
  parameters: [],
  ui: {
    icon: Merge
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    // Handle both naming conventions: geometryA/geometryB and geometry
    const geometryA = (inputs.geometryA || inputs.geometry) as EnhancedGeometryData;
    const geometryB = inputs.geometryB as EnhancedGeometryData;
    const operation = inputs.operation || 'merge';
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) return { geometry: null };
    if (geometries.length === 1) return { geometry: geometries[0] };
    
    // Use shared VertexDataUtils for robust merging
    const mergedGeometry = VertexDataUtils.merge(geometries);
    
    return { geometry: mergedGeometry };
  }
};
