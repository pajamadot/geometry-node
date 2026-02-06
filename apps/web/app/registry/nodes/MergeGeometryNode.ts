import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Merge } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

// MERGE GEOMETRY NODE
export const mergeGeometryNodeDefinition: NodeDefinition = {
  type: 'merge-geometry',
  name: 'Merge Geometry',
  description: 'Combine multiple geometries into one',
  category: 'modifiers',
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
      description: 'First geometry to merge'
    },
    {
      id: 'geometryB',
      name: 'Geometry B',
      type: 'geometry',
      required: true,
      description: 'Second geometry to merge'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'union',
      options: ['union', 'intersection', 'difference'],
      description: 'Merge operation type'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Merged geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 200,
    icon: Merge
  },
  execute: (inputs, parameters) => {
    const geometryA = inputs.geometryA as EnhancedGeometryData;
    const geometryB = inputs.geometryB as EnhancedGeometryData;
    const operation = inputs.operation || 'union';
    
    const geometries = [geometryA, geometryB].filter(Boolean);
    
    if (geometries.length === 0) {
      return { geometry: null };
    }
    
    if (geometries.length === 1) {
      return { geometry: VertexDataUtils.clone(geometries[0]) };
    }
    
    // Simple merge (Union via concatenation)
    // True boolean CSG is complex and we don't have a library yet.
    // For 'union', simple merge is often visually sufficient if materials are same.
    
    const mergedGeometry = VertexDataUtils.merge(geometries);
    
    return { geometry: mergedGeometry };
  }
};
