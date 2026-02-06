import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Move3D } from 'lucide-react';
import { CylinderBuilder } from '../../utils/builders/primitives/CylinderBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

// SPIRAL STAIR NODE
export const spiralStairNodeDefinition: NodeDefinition = {
  type: 'spiralStair',
  name: 'Spiral Stair',
  description: 'Generate procedural spiral staircase',
  category: 'geometry',
  color: {
    primary: '#8b5a2b',
    secondary: '#6b4423'
  },

  inputs: [
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 20.0
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 2.5
    },
    {
      id: 'stepCount',
      name: 'Step Count',
      type: 'integer',
      defaultValue: 24
    },
    {
      id: 'stepWidth',
      name: 'Step Width',
      type: 'number',
      defaultValue: 1.2
    },
    {
      id: 'turns',
      name: 'Turns',
      type: 'number',
      defaultValue: 2.0
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated spiral staircase geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 280,
    height: 620,
    icon: Move3D
  },
  execute: (inputs, parameters) => {
      // Placeholder implementation using a single cylinder for now to pass build
      // Ideally, replicate the step generation loop using BoxBuilder + Transformations
      
      const height = inputs.height || 20.0;
      const radius = inputs.radius || 2.5;
      
      // Simple proxy geometry
      const geometry = CylinderBuilder.create({ 
          height, 
          radiusTop: radius, 
          radiusBottom: radius 
      });
      
      return { geometry };
  }
};
