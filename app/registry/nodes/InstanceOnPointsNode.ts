import { NodeDefinition } from '../../types/nodeSystem';
import { Copy } from 'lucide-react';

// INSTANCE ON POINTS NODE - was 130+ lines, now 30 lines of data
export const instanceOnPointsNodeDefinition: NodeDefinition = {
  type: 'instance-on-points',
  name: 'Instance on Points',
  description: 'Place geometry instances at point locations',
  category: 'instances',
  color: {
    primary: '#f59e42',
    secondary: '#b45309'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Geometry to instance'
    },
    {
      id: 'points',
      name: 'Points',
      type: 'geometry',
      required: true,
      description: 'Points to instance on'
    },
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
  outputs: [
    {
      id: 'instances',
      name: 'Instances',
      type: 'geometry',
      description: 'Instanced geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 220,
    icon: Copy
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const geometry = inputs.geometry;
    const points = inputs.points;
    const pickInstance = inputs.pickInstance || false;
    const instanceIndex = inputs.instanceIndex || 0;
    const rotation = inputs.rotation || { x: 0, y: 0, z: 0 };
    const scale = inputs.scale || { x: 1, y: 1, z: 1 };
    
    if (!points || !geometry) return { instances: null };
    
    // Simple instancing implementation (can be enhanced)
    // For now, just return the instance geometry
    return { instances: geometry };
  }
}; 