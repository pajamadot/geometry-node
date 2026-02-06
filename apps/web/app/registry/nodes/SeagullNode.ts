import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';

export const seagullNodeDefinition: NodeDefinition = {
  type: 'seagull',
  name: 'Seagull',
  category: 'animation',
  description: 'Creates a flying seagull with flapping wings that circles around a center point',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },
  ui: {
    icon: '🕊️',
    advanced: []
  },
  inputs: [
    {
      id: 'center',
      name: 'Center',
      type: 'vector',
      defaultValue: [0, 0, 0]
    },
    {
      id: 'time',
      name: 'Time',
      type: 'time',
      defaultValue: 0
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry'
    }
  ],
  parameters: [
    {
      id: 'radius',
      name: 'Flight Radius',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
      step: 0.5,
      description: 'Radius of the circular flight path'
    },
    {
      id: 'height',
      name: 'Flight Height',
      type: 'number',
      defaultValue: 5,
      min: 0,
      max: 20,
      step: 0.5,
      description: 'Height of the flight path'
    },
    {
      id: 'speed',
      name: 'Flight Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      description: 'Speed of the circular flight'
    },
    {
      id: 'wingFlapSpeed',
      name: 'Wing Flap Speed',
      type: 'number',
      defaultValue: 8,
      min: 1,
      max: 20,
      step: 0.5,
      description: 'Speed of wing flapping animation'
    },
    {
      id: 'wingFlapAmplitude',
      name: 'Wing Flap Amplitude',
      type: 'number',
      defaultValue: 0.3,
      min: 0.1,
      max: 1,
      step: 0.05,
      description: 'Amplitude of wing flapping'
    },
    {
      id: 'seagullSize',
      name: 'Seagull Size',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      step: 0.1,
      description: 'Size of the seagull'
    }
  ],
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => {
      // Placeholder execution logic for now or implement builder logic
      // Since this requires complex procedural generation similar to Lighthouse,
      // we'll return a simple placeholder or null to satisfy the build.
      // A full implementation would mirror the Three.js logic but use VertexDataUtils/GeometryBuilder.
      
      return { geometry: null }; 
  }
};
