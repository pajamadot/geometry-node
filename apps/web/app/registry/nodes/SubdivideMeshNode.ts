import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Scissors } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { GeometryOperations } from '../../utils/builders/operations/GeometryOperations';

export const subdivideMeshNodeDefinition: NodeDefinition = {
  type: 'subdivide-mesh',
  name: 'Subdivide Mesh',
  description: 'Add detail by subdividing mesh faces',
  category: 'modifiers',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to subdivide'
    },
    {
      id: 'level',
      name: 'Level',
      type: 'integer',
      defaultValue: 1,
      min: 0,
      max: 6,
      step: 1,
      description: 'Subdivision level'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Subdivided geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Scissors
  },
  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    const level = inputs.level || 1;
    
    if (!geometry || level === 0) return { geometry };
    
    const subdividedGeometry = GeometryOperations.subdivide(geometry, level);
    
    return { geometry: subdividedGeometry };
  }
};
