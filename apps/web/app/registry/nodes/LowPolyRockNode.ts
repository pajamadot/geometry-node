import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Mountain } from 'lucide-react';
import { SphereBuilder } from '../../utils/builders/primitives/SphereBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';
import { GeometryOperations } from '../../utils/builders/operations/GeometryOperations';

// Low Poly Rock Node
export const lowPolyRockNodeDefinition: NodeDefinition = {
  type: 'lowPolyRock',
  name: 'Low Poly Rock',
  description: 'Generate a low poly rock shape',
  category: 'geometry',
  color: {
    primary: '#6b7280',
    secondary: '#374151'
  },
  inputs: [
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1.0,
      description: 'Base radius of the rock'
    },
    {
      id: 'detail',
      name: 'Detail',
      type: 'number',
      defaultValue: 1, // Lower default for low poly look
      description: 'Detail level'
    },
    {
      id: 'noise',
      name: 'Noise',
      type: 'number',
      defaultValue: 0.3,
      description: 'Noise intensity'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'number',
      defaultValue: 42,
      description: 'Random seed'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated low poly rock geometry'
    }
  ],
  parameters: [],
  ui: {
    icon: Mountain
  },
  execute: (inputs, parameters) => {
    const radius = inputs.radius || 1.0;
    const detail = Math.max(1, Math.min(3, inputs.detail || 1)); 
    const noise = inputs.noise || 0.3;
    const seed = inputs.seed || 42;

    // Start with a sphere geometry (Icosahedron-like)
    // widthSegments/heightSegments low for "low poly" look
    const segments = detail * 2 + 2;
    let geometry = SphereBuilder.create({ 
        radius, 
        widthSegments: segments, 
        heightSegments: segments 
    });
    
    // Apply noise displacement
    // We reuse our GeometryOperations.displace
    geometry = GeometryOperations.displace(geometry, noise, 2.0, seed);
    
    // Recompute flat normals for low poly look?
    // Ideally we want flat shading. 
    // PlayCanvas StandardMaterial handles flat shading via `shading: pc.SHADING_FLAT` if normals are set per face.
    // Our GeometryBuilder/VertexDataUtils currently does smooth normals by default.
    // To get hard edges, we need unique vertices per face.
    // This is implicit if we don't share vertices or if we explicitly split them.
    // For now, we'll just return the displaced geometry, user can set material to flat shading.
    
    const result = VertexDataUtils.computeNormals(geometry);

    return { geometry: result };
  }
};
