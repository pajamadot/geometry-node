import { NodeDefinition } from '../../types/nodeSystem';
import { Copy } from 'lucide-react';

// INSTANCE ON POINTS NODE - was 130+ lines, now 30 lines of data
export const instanceOnPointsNodeDefinition: NodeDefinition = {
  type: 'instance-on-points',
  name: 'Instance on Points',
  description: 'Place geometry instances at point locations',
  category: 'instances',
  color: {
    primary: '#10b981',
    secondary: '#059669'
  },
  inputs: [
    {
      id: 'points',
      name: 'Points',
      type: 'points',
      required: true,
      description: 'Point locations for instances'
    },
    {
      id: 'instance',
      name: 'Instance',
      type: 'geometry',
      required: true,
      description: 'Geometry to instance'
    }
  ],
  outputs: [
    {
      id: 'instances',
      name: 'Instances',
      type: 'geometry',
      description: 'Instanced geometry'
    }
  ],
  parameters: [
    {
      id: 'pickInstance',
      name: 'Pick Instance',
      type: 'boolean',
      defaultValue: false,
      description: 'Pick specific instance index'
    },
    {
      id: 'instanceIndex',
      name: 'Instance Index',
      type: 'integer',
      defaultValue: 0,
      min: 0,
      step: 1,
      description: 'Instance index to use'
    },
    {
      id: 'rotation',
      name: 'Rotation',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      step: 0.1,
      description: 'Instance rotation'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'vector',
      defaultValue: { x: 1, y: 1, z: 1 },
      step: 0.1,
      description: 'Instance scale'
    }
  ],
  ui: {
    width: 220,
    icon: Copy
  },
  execute: (inputs, parameters) => {
    const { points, instance } = inputs;
    const { pickInstance, instanceIndex, rotation, scale } = parameters;
    
    if (!points || !instance) return { instances: null };
    
    // Simple instancing implementation (can be enhanced)
    // For now, just return the instance geometry
    return { instances: instance };
  }
}; 