import { NodeDefinition } from '../../types/nodeSystem';
import { Mountain } from 'lucide-react';
import * as THREE from 'three';

// Low Poly Rock Node - Built from scratch with BufferGeometry
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
      defaultValue: 100,
      description: 'Number of vertices (higher = more detail)'
    },
    {
      id: 'noise',
      name: 'Noise',
      type: 'number',
      defaultValue: 0.3,
      description: 'Noise intensity for rock deformation'
    },
    {
      id: 'seed',
      name: 'Seed',
      type: 'number',
      defaultValue: 42,
      description: 'Random seed for noise generation'
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
    const detail = Math.max(3, Math.min(5, inputs.detail || 3)); // Icosahedron detail levels
    const noise = inputs.noise || 0.3;
    const seed = inputs.seed || 42;

    // Start with a sphere geometry
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    
    // Get the position attribute
    const positions = geometry.attributes.position;
    const tmp = new THREE.Vector3();
    const normal = new THREE.Vector3();

    // Simple deterministic RNG for noise
    const random = new (class {
      private seed: number;
      constructor(seed: number) {
        this.seed = seed;
      }
      random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
      }
    })(seed);

    // Apply noise deformation to each vertex
    for (let i = 0; i < positions.count; i++) {
      tmp.set(positions.getX(i), positions.getY(i), positions.getZ(i));
      normal.copy(tmp).normalize();
      
      // Generate noise based on vertex position
      const noiseValue = (random.random() - 0.5) * 2 * noise;
      
      // Apply radial displacement along the normal
      tmp.addScaledVector(normal, noiseValue);
      
      // Update vertex position
      positions.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    
    // Mark position attribute as needing update
    positions.needsUpdate = true;
    
    // Recompute normals after deformation
    geometry.computeVertexNormals();
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080, // Gray color
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    });

    // Attach material to geometry for rendering
    (geometry as any).material = material;

    return { geometry };
  }
}; 