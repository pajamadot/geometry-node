import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Waves } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';

export const gesnerWaveNodeDefinition: NodeDefinition = {
  type: 'gesner-wave',
  name: 'Gerstner Wave',
  description: 'Apply Gerstner wave displacement',
  category: 'deformation',
  color: {
    primary: '#3b82f6',
    secondary: '#2563eb',
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry',
    },
    {
      id: 'time',
      name: 'Time',
      type: 'number',
      defaultValue: 0,
      description: 'Animation time',
    },
    {
      id: 'steepness',
      name: 'Steepness',
      type: 'number',
      defaultValue: 0.2,
      min: 0,
      max: 1,
      description: 'Wave steepness (0-1)',
    },
    {
      id: 'wavelength',
      name: 'Wavelength',
      type: 'number',
      defaultValue: 10,
      description: 'Distance between crests',
    },
  ],

  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Deformed geometry',
    },
  ],

  parameters: [
      {
          id: 'steepness',
          name: 'Steepness',
          type: 'number',
          defaultValue: 0.2,
          min: 0,
          max: 1
      },
      {
          id: 'wavelength',
          name: 'Wavelength',
          type: 'number',
          defaultValue: 10,
          min: 1,
          max: 100
      }
  ],

  ui: {
    icon: Waves,
    width: 220,
  },

  execute: (inputs, parameters) => {
    const geometry = inputs.geometry as EnhancedGeometryData;
    if (!geometry || !geometry.positionsArray) {
      return { geometry: null };
    }

    const time = inputs.time ?? 0;
    const steepness = inputs.steepness ?? parameters.steepness ?? 0.2;
    const wavelength = inputs.wavelength ?? parameters.wavelength ?? 10;

    // Basic Gerstner Wave implementation
    // P(x,y,t) = 
    // x + sum(Qi * Ai * Di.x * cos(wi * Di * (x,y) + phi_i * t))
    // y + sum(Ai * sin(wi * Di * (x,y) + phi_i * t))
    // z + sum(Qi * Ai * Di.y * cos(wi * Di * (x,y) + phi_i * t))
    
    // Simplified single wave for now
    // k = 2*PI / wavelength
    // c = sqrt(g / k)
    // theta = k * direction * (x,z) - c * k * t
    
    const k = 2 * Math.PI / wavelength;
    const c = Math.sqrt(9.8 / k);
    const speed = c;
    const amplitude = steepness / k;
    const direction = new pc.Vec2(1, 0).normalize(); // Direction X
    
    const positions = new Float32Array(geometry.positionsArray);
    const vertexCount = positions.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
        const x = positions[i*3];
        const y = positions[i*3+1]; // Original height (usually 0 for plane)
        const z = positions[i*3+2];
        
        const dot = direction.x * x + direction.y * z;
        const theta = k * dot - speed * k * time;
        
        const dispX = (steepness / k) * direction.x * Math.cos(theta);
        const dispY = amplitude * Math.sin(theta);
        const dispZ = (steepness / k) * direction.y * Math.cos(theta);
        
        positions[i*3] = x - dispX; // Move towards crest
        positions[i*3+1] = y + dispY;
        positions[i*3+2] = z - dispZ;
    }
    
    const deformed = {
        ...geometry,
        positionsArray: positions,
        normalsArray: undefined // Needs recomputation
    };
    
    // Recompute normals
    const result = VertexDataUtils.computeNormals(deformed);

    return { geometry: result };
  },
};
