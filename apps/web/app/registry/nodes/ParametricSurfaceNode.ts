import { NodeDefinition } from '../../types/nodeSystem';
import { Waves } from 'lucide-react';
import * as THREE from 'three';

// Helper function to create parametric geometry
function createParametricGeometry(
  func: (u: number, v: number, target: THREE.Vector3) => void,
  slices: number,
  stacks: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];

  const temp = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();

  // Generate vertices
  for (let i = 0; i <= stacks; i++) {
    const v = i / stacks;
    for (let j = 0; j <= slices; j++) {
      const u = j / slices;
      func(u, v, temp);
      vertices.push(temp.x, temp.y, temp.z);
      uvs.push(u, v);
    }
  }

  // Generate indices
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      const a = i * (slices + 1) + j;
      const b = a + slices + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // Generate normals
  for (let i = 0; i <= stacks; i++) {
    for (let j = 0; j <= slices; j++) {
      const u = j / slices;
      const v = i / stacks;

      // Calculate normal using finite differences
      const du = 0.001;
      const dv = 0.001;

      const p0 = new THREE.Vector3();
      const p1 = new THREE.Vector3();
      const p2 = new THREE.Vector3();

      func(u, v, p0);
      func(u + du, v, p1);
      func(u, v + dv, p2);

      const tangentU = p1.sub(p0);
      const tangentV = p2.sub(p0);
      tempNormal.crossVectors(tangentU, tangentV).normalize();

      normals.push(tempNormal.x, tempNormal.y, tempNormal.z);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  return geometry;
}

// PARAMETRIC SURFACE NODE - Generates 3D surfaces using parametric equations
export const parametricSurfaceNodeDefinition: NodeDefinition = {
  type: 'parametric-surface',
  name: 'Parametric Surface',
  description: 'Generate 3D surfaces using parametric equations',
  category: 'surfaces',
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
      options: [
        'plane',
        'sphere', 
        'cylinder',
        'torus',
        'mobius',
        'klein',
        'custom'
      ],
      description: 'Type of parametric surface'
    },
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 10,
      min: 0.1,
      max: 100,
      step: 0.1,
      description: 'Surface width'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 10,
      min: 0.1,
      max: 100,
      step: 0.1,
      description: 'Surface height'
    },
    {
      id: 'widthSegments',
      name: 'Width Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 256,
      step: 1,
      description: 'Number of width segments'
    },
    {
      id: 'heightSegments',
      name: 'Height Segments',
      type: 'integer',
      defaultValue: 32,
      min: 3,
      max: 256,
      step: 1,
      description: 'Number of height segments'
    },
    {
      id: 'radius',
      name: 'Radius',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Surface radius (for curved surfaces)'
    },
    {
      id: 'tubeRadius',
      name: 'Tube Radius',
      type: 'number',
      defaultValue: 0.3,
      min: 0.01,
      max: 5,
      step: 0.01,
      description: 'Tube radius (for torus)'
    },
    {
      id: 'customX',
      name: 'Custom X(u,v)',
      type: 'string',
      defaultValue: 'u',
      description: 'Custom X coordinate function'
    },
    {
      id: 'customY',
      name: 'Custom Y(u,v)',
      type: 'string',
      defaultValue: 'v',
      description: 'Custom Y coordinate function'
    },
    {
      id: 'customZ',
      name: 'Custom Z(u,v)',
      type: 'string',
      defaultValue: '0',
      description: 'Custom Z coordinate function'
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
    icon: Waves,
    advanced: ['widthSegments', 'heightSegments', 'tubeRadius', 'customX', 'customY', 'customZ']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const surfaceType = inputs.surfaceType || 'plane';
    const width = inputs.width || 10;
    const height = inputs.height || 10;
    const widthSegments = inputs.widthSegments || 32;
    const heightSegments = inputs.heightSegments || 32;
    const radius = inputs.radius || 1;
    const tubeRadius = inputs.tubeRadius || 0.3;
    const customX = inputs.customX || 'u';
    const customY = inputs.customY || 'v';
    const customZ = inputs.customZ || '0';

    let geometry: THREE.BufferGeometry;

    switch (surfaceType) {
      case 'plane':
        geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(radius, radius, height, widthSegments, heightSegments);
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(radius, tubeRadius, widthSegments, heightSegments);
        break;

      case 'mobius':
        // Mobius strip parametric function
        geometry = createParametricGeometry((u: number, v: number, target: THREE.Vector3) => {
          const R = radius;
          const r = tubeRadius;
          const uRad = u * Math.PI * 2;
          const vRad = v * Math.PI * 2;
          
          target.x = (R + r * Math.cos(vRad / 2)) * Math.cos(uRad);
          target.y = (R + r * Math.cos(vRad / 2)) * Math.sin(uRad);
          target.z = r * Math.sin(vRad / 2);
        }, widthSegments, heightSegments);
        break;

      case 'klein':
        // Klein bottle parametric function (accurate mathematical formula)
        geometry = createParametricGeometry((u: number, v: number, target: THREE.Vector3) => {
          const cu = Math.cos(u * Math.PI);
          const su = Math.sin(u * Math.PI);
          const cv = Math.cos(v * Math.PI * 2);
          const sv = Math.sin(v * Math.PI * 2);
          
          const cu2 = cu * cu;
          const cu3 = cu2 * cu;
          const cu4 = cu2 * cu2;
          const cu5 = cu4 * cu;
          const cu6 = cu5 * cu;
          const cu7 = cu6 * cu;
          
          const k = 2.0 / 15.0;
          
          target.x = -k * cu * (3 * cv - 30 * su + 90 * cu4 * su - 60 * cu6 * su + 5 * cu * cv * su);
          target.y = -1.0 / 15.0 * su * (3 * cv - 3 * cu2 * cv - 48 * cu4 * cv + 48 * cu6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu3 * cv * su - 80 * cu5 * cv * su + 80 * cu7 * cv * su);
          target.z = k * (3 + 5 * cu * su) * sv;
        }, widthSegments, heightSegments);
        break;

      case 'custom':
        // Custom parametric function using string evaluation
        try {
          const customFunction = (u: number, v: number, target: THREE.Vector3) => {
            // Create a safe evaluation context
            const context = { u, v, Math, sin: Math.sin, cos: Math.cos, tan: Math.tan, 
                             exp: Math.exp, log: Math.log, sqrt: Math.sqrt, PI: Math.PI };
            
            // Evaluate the custom functions
            const x = new Function('u', 'v', 'Math', 'sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'PI', `return ${customX}`)
              .call(context, u, v, Math, Math.sin, Math.cos, Math.tan, Math.exp, Math.log, Math.sqrt, Math.PI);
            
            const y = new Function('u', 'v', 'Math', 'sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'PI', `return ${customY}`)
              .call(context, u, v, Math, Math.sin, Math.cos, Math.tan, Math.exp, Math.log, Math.sqrt, Math.PI);
            
            const z = new Function('u', 'v', 'Math', 'sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'PI', `return ${customZ}`)
              .call(context, u, v, Math, Math.sin, Math.cos, Math.tan, Math.exp, Math.log, Math.sqrt, Math.PI);
            
            target.x = x;
            target.y = y;
            target.z = z;
          };
          geometry = createParametricGeometry(customFunction, widthSegments, heightSegments);
        } catch (error) {
          console.error('Error evaluating custom parametric function:', error);
          // Fallback to plane geometry
          geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        }
        break;

      default:
        geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    }

    return { geometry };
  }
}; 