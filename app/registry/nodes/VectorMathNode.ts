import { NodeDefinition } from '../../types/nodeSystem';
import { GitBranch } from 'lucide-react';
import * as THREE from 'three';

// VECTOR MATH NODE - was 468+ lines, now 45 lines of data
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
  execution: {
    type: 'javascript'
  },
  execute: (inputs, parameters) => {
    const { vectorA = { x: 0, y: 0, z: 0 }, vectorB = { x: 0, y: 0, z: 0 }, scale = 1 } = inputs;
    const { operation } = parameters;
    
    const vA = new THREE.Vector3(vectorA.x, vectorA.y, vectorA.z);
    const vB = new THREE.Vector3(vectorB.x, vectorB.y, vectorB.z);
    
    let result = new THREE.Vector3();
    let value = 0;
    
    switch (operation) {
      case 'add':
        result = vA.clone().add(vB);
        break;
      case 'subtract':
        result = vA.clone().sub(vB);
        break;
      case 'multiply':
        result = vA.clone().multiply(vB);
        break;
      case 'divide':
        result = vA.clone().divide(vB);
        break;
      case 'cross':
        result = vA.clone().cross(vB);
        break;
      case 'dot':
        value = vA.dot(vB);
        result = vA.clone();
        break;
      case 'normalize':
        result = vA.clone().normalize();
        break;
      case 'length':
        value = vA.length();
        result = vA.clone();
        break;
      default:
        result = vA.clone();
    }
    
    return {
      result: { x: result.x, y: result.y, z: result.z },
      value
    };
  }
}; 