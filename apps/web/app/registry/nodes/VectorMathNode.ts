import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { GitBranch } from 'lucide-react';

export const vectorMathNodeDefinition: NodeDefinition = {
  type: 'vector-math',
  name: 'Vector Math',
  description: 'Mathematical operations on vectors',
  category: 'vector',
  color: {
    primary: '#3b82f6',
    secondary: '#1d4ed8'
  },

  inputs: [
    {
      id: 'vectorA',
      name: 'Vector A',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'First vector operand'
    },
    {
      id: 'vectorB',
      name: 'Vector B',
      type: 'vector',
      defaultValue: { x: 0, y: 0, z: 0 },
      description: 'Second vector operand'
    },
    {
      id: 'scale',
      name: 'Scale',
      type: 'numeric',
      defaultValue: 1,
      description: 'Scale factor'
    },
    {
      id: 'operation',
      name: 'Operation',
      type: 'select',
      defaultValue: 'add',
      options: ['add', 'subtract', 'multiply', 'divide', 'cross', 'dot', 'normalize', 'length'],
      description: 'Vector operation to perform'
    }
  ],
  outputs: [
    {
      id: 'result',
      name: 'Vector',
      type: 'vector',
      description: 'Result vector'
    },
    {
      id: 'value',
      name: 'Value',
      type: 'numeric',
      description: 'Result value (for dot product, etc.)'
    }
  ],
  parameters: [],
  ui: {
    width: 200,
    icon: GitBranch
  },
  execute: (inputs, parameters) => {
    const { vectorA = { x: 0, y: 0, z: 0 }, vectorB = { x: 0, y: 0, z: 0 }, scale = 1 } = inputs;
    const { operation } = parameters;
    
    const vA = new pc.Vec3(vectorA.x, vectorA.y, vectorA.z);
    const vB = new pc.Vec3(vectorB.x, vectorB.y, vectorB.z);
    
    let result = new pc.Vec3();
    let value = 0;
    
    switch (operation) {
      case 'add':
        result.add2(vA, vB);
        break;
      case 'subtract':
        result.sub2(vA, vB);
        break;
      case 'multiply':
        result.mul2(vA, vB);
        break;
      case 'divide':
        // PlayCanvas doesn't have element-wise divide for Vec3, implementing manually
        if (vB.x !== 0 && vB.y !== 0 && vB.z !== 0) {
            result.set(vA.x / vB.x, vA.y / vB.y, vA.z / vB.z);
        }
        break;
      case 'cross':
        result.cross(vA, vB);
        break;
      case 'dot':
        value = vA.dot(vB);
        result.copy(vA);
        break;
      case 'normalize':
        result.copy(vA).normalize();
        break;
      case 'length':
        value = vA.length();
        result.copy(vA);
        break;
      default:
        result.copy(vA);
    }
    
    return {
      result: { x: result.x, y: result.y, z: result.z },
      value
    };
  }
};
