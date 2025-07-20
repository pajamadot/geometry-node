import { NodeDefinition } from '../../types/nodeSystem';
import * as THREE from 'three';

export const lowPolyRockNodeDefinition: NodeDefinition = {
  type: 'low-poly-rock',
  name: 'Low Poly Rock',
  category: 'geometry',
  description: 'Creates procedural low poly rock geometry with customizable parameters',
  color: {
    primary: '#8b5a2b',
    secondary: '#6b4423'
  },
  ui: {
    icon: '🪨',
    advanced: []
  },
  inputs: [
    {
      id: 'seed',
      name: 'Seed',
      type: 'number',
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
      id: 'size',
      name: 'Size',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      description: 'Overall size of the rock'
    },
    {
      id: 'complexity',
      name: 'Complexity',
      type: 'number',
      defaultValue: 8,
      min: 3,
      max: 20,
      step: 1,
      description: 'Number of vertices (higher = more detailed)'
    },
    {
      id: 'roughness',
      name: 'Roughness',
      type: 'number',
      defaultValue: 0.3,
      min: 0,
      max: 1,
      step: 0.05,
      description: 'Surface roughness and irregularity'
    },
    {
      id: 'spikiness',
      name: 'Spikiness',
      type: 'number',
      defaultValue: 0.2,
      min: 0,
      max: 1,
      step: 0.05,
      description: 'How spiky/angular the rock is'
    },
    {
      id: 'flatness',
      name: 'Flatness',
      type: 'number',
      defaultValue: 0.1,
      min: 0,
      max: 1,
      step: 0.05,
      description: 'How flat the rock is (0 = spherical, 1 = very flat)'
    },
    {
      id: 'noiseScale',
      name: 'Noise Scale',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 3,
      step: 0.1,
      description: 'Scale of surface noise and detail'
    }
  ],
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => {
    /** ---------- helpers ---------- */
    const seed = (inputs.seed ?? 0) | 0;
  
    // simple deterministic RNG
    const rand = (n: number) => {
      // Robert Jenkins’ 32-bit integer hash
      n = (n + 0x7ed55d16 + (n << 12)) & 0xffffffff;
      n = (n ^ 0xc761c23c ^ (n >>> 19)) & 0xffffffff;
      n = (n + 0x165667b1 + (n << 5)) & 0xffffffff;
      n = (n + 0xd3a2646c ^ (n << 9)) & 0xffffffff;
      n = (n + 0xfd7046c5 + (n << 3)) & 0xffffffff;
      n = (n ^ 0xb55a4f09 ^ (n >>> 16)) & 0xffffffff;
      return (n >>> 0) / 0xffffffff;          // 0‥1
    };
  
    // 3-D value noise, 2 octaves are enough for a low-poly rock
    const valueNoise = (x: number, y: number, z: number, scale: number) => {
      const xi = Math.floor(x * scale);
      const yi = Math.floor(y * scale);
      const zi = Math.floor(z * scale);
      const hash = (xi * 73856093) ^ (yi * 19349663) ^ (zi * 83492791) ^ seed;
      return rand(hash);
    };
  
    /** ---------- parameters ---------- */
    const {
      size        = 1,
      complexity  = 8,     // 3–20 in UI
      roughness   = 0.3,   // ± max radial deviation
      spikiness   = 0.2,   // exaggerates positive noise (makes sharp edges)
      flatness    = 0.1,   // squash in Y
      noiseScale  = 1
    } = parameters;
  
    // Map 3–20 “complexity” to icosahedron detail 0–3
    const detail = Math.max(0, Math.min(3, Math.round((complexity - 3) / 6)));
  
    /** ---------- base geometry ---------- */
    const geometry = new THREE.IcosahedronGeometry(1, detail);     // unit radius
  
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const tmp = new THREE.Vector3();
    const normal = new THREE.Vector3();
  
    for (let i = 0; i < pos.count; i++) {
      tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i));        // original vertex
      normal.copy(tmp).normalize();                          // outward normal
  
      // two-octave fractal noise, centred about 0
      const n1 = valueNoise(tmp.x, tmp.y, tmp.z, noiseScale);
      const n2 = valueNoise(tmp.x, tmp.y, tmp.z, noiseScale * 2) * 0.5;
      let n = (n1 + n2) - 0.75;                              // bias so rocks stay chunky
  
      // apply user sliders
      n *= roughness;
      if (n > 0) n *= 1 + spikiness;                         // only push outward
  
      // radial displacement
      tmp.addScaledVector(normal, n);
  
      // flatness squash
      tmp.y *= 1 - flatness;
  
      // overall size
      tmp.multiplyScalar(size);
  
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
  
    pos.needsUpdate = true;
    geometry.computeVertexNormals();                         // after deformation
  
    return { geometry };
  }
}; 