import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Waves } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';
import { PlaneBuilder } from '../../utils/builders/primitives/PlaneBuilder';
import { SphereBuilder } from '../../utils/builders/primitives/SphereBuilder';
import { CylinderBuilder } from '../../utils/builders/primitives/CylinderBuilder';
import { TorusBuilder } from '../../utils/builders/primitives/TorusBuilder';

// PARAMETRIC SURFACE NODE
export const parametricSurfaceNodeDefinition: NodeDefinition = {
  type: 'parametric-surface',
  name: 'Parametric Surface',
  description: 'Generate 3D surfaces using parametric equations',
  category: 'geometry',
  color: {
    primary: '#8b5cf6',
    secondary: '#7c3aed'
  },

  inputs: [
    {
      id: 'surfaceType',
      name: 'Surface Type',
      type: 'select',
      defaultValue: 'plane',
      options: ['plane', 'sphere', 'cylinder', 'torus', 'custom'],
      description: 'Type of parametric surface'
    },
    // ... dimensions inputs ...
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 10
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 10
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated parametric surface geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 280,
    icon: Waves
  },
  execute: (inputs, parameters) => {
    const surfaceType = inputs.surfaceType || 'plane';
    
    let geometry: EnhancedGeometryData;

    switch (surfaceType) {
      case 'plane':
        geometry = PlaneBuilder.create({ 
            width: inputs.width || 10, 
            height: inputs.height || 10 
        });
        break;
      case 'sphere':
        geometry = SphereBuilder.create({ radius: (inputs.width || 10) / 2 });
        break;
      case 'cylinder':
        geometry = CylinderBuilder.create({ 
            radiusTop: (inputs.width || 10)/2, 
            radiusBottom: (inputs.width || 10)/2, 
            height: inputs.height || 10 
        });
        break;
      case 'torus':
        geometry = TorusBuilder.create({ 
            radius: (inputs.width || 10)/2, 
            tube: (inputs.height || 2)/4 
        });
        break;
      default:
        // Custom not implemented yet, fallback to plane
        geometry = PlaneBuilder.create({ width: 10, height: 10 });
    }

    return { geometry };
  }
};
