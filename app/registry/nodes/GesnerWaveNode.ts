import { NodeDefinition } from '../../types/nodeSystem';
import { Waves } from 'lucide-react';
import * as THREE from 'three';

// GESNER WAVE NODE - Generates realistic ocean wave surfaces
export const gesnerWaveNodeDefinition: NodeDefinition = {
  type: 'gesner-wave',
  name: 'Gesner Wave',
  description: 'Generate realistic ocean wave surfaces using Gerstner wave model',
  category: 'geometry',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },

  inputs: [
    {
      id: 'waveType',
      name: 'Wave Type',
      type: 'select',
      defaultValue: 'single',
      options: [
        'single',
        'multiple',
        'storm',
        'calm'
      ],
      description: 'Type of wave pattern'
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 10.0,
      step: 0.1,
      description: 'Wave height/amplitude'
    },
    {
      id: 'wavelength',
      name: 'Wavelength',
      type: 'number',
      defaultValue: 10.0,
      min: 1.0,
      max: 100.0,
      step: 0.5,
      description: 'Distance between wave crests'
    },
    {
      id: 'steepness',
      name: 'Steepness',
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      description: 'Wave steepness (0.1-1.0)'
    },
    {
      id: 'direction',
      name: 'Direction',
      type: 'number',
      defaultValue: 0.0,
      min: 0.0,
      max: Math.PI * 2,
      step: 0.1,
      description: 'Wave direction in radians'
    },
    {
      id: 'speed',
      name: 'Speed',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      description: 'Wave propagation speed'
    },
    {
      id: 'time',
      name: 'Time',
      type: 'number',
      defaultValue: 0.0,
      min: 0.0,
      max: 100.0,
      step: 0.1,
      description: 'Animation time'
    },
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      defaultValue: 50.0,
      min: 10.0,
      max: 200.0,
      step: 1.0,
      description: 'Surface width'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      defaultValue: 50.0,
      min: 10.0,
      max: 200.0,
      step: 1.0,
      description: 'Surface height'
    },
    {
      id: 'segments',
      name: 'Segments',
      type: 'integer',
      defaultValue: 64,
      min: 16,
      max: 256,
      step: 8,
      description: 'Mesh resolution'
    },
    {
      id: 'waveCount',
      name: 'Wave Count',
      type: 'integer',
      defaultValue: 3,
      min: 1,
      max: 10,
      step: 1,
      description: 'Number of overlapping waves'
    },
    {
      id: 'seed',
      name: 'Random Seed',
      type: 'integer',
      defaultValue: 42,
      min: 1,
      max: 1000,
      step: 1,
      description: 'Seed for wave variation (different seeds = different patterns)'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated wave surface geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 300,
    icon: Waves,
    advanced: ['steepness', 'direction', 'speed', 'time', 'waveCount']
  },
  execution: {
    type: 'javascript'
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const waveType = inputs.waveType || 'single';
    const amplitude = inputs.amplitude || 1.0;
    const wavelength = inputs.wavelength || 10.0;
    const steepness = inputs.steepness || 0.5;
    const direction = inputs.direction || 0.0;
    const speed = inputs.speed || 1.0;
    const time = inputs.time || 0.0;
    const width = inputs.width || 50.0;
    const height = inputs.height || 50.0;
    const segments = inputs.segments || 64;
    const waveCount = inputs.waveCount || 3;
    const seed = inputs.seed || 42;

    // Create wave geometry
    const geometry = createGesnerWaveGeometry({
      waveType,
      amplitude,
      wavelength,
      steepness,
      direction,
      speed,
      time,
      width,
      height,
      segments,
      waveCount,
      seed
    });

    return { geometry };
  }
};

// Helper function to create Gesner wave geometry
function createGesnerWaveGeometry(params: {
  waveType: string;
  amplitude: number;
  wavelength: number;
  steepness: number;
  direction: number;
  speed: number;
  time: number;
  width: number;
  height: number;
  segments: number;
  waveCount: number;
  seed: number;
}): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const { waveType, amplitude, wavelength, steepness, direction, speed, time, width, height, segments, waveCount, seed } = params;

      // Generate wave parameters based on type
    const waves = generateWaveParameters(waveType, waveCount, wavelength, amplitude, direction, seed);

  // Create vertices
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments - 0.5) * width;
    for (let j = 0; j <= segments; j++) {
      const z = (j / segments - 0.5) * height;
      
      // Calculate wave displacement
      const displacement = calculateGesnerWave(x, z, waves, steepness, speed, time);
      
      vertices.push(x + displacement.x, displacement.y, z + displacement.z);
      uvs.push(i / segments, j / segments);
    }
  }

  // Create indices with flipped winding order for upward-facing normals
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      const c = a + 1;
      const d = b + 1;

      // Flip winding order: clockwise instead of counter-clockwise
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  // Manually calculate normals facing upward
  const normals: number[] = [];
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      // Calculate normal using finite differences
      const u = i / segments;
      const v = j / segments;
      const x = (u - 0.5) * width;
      const z = (v - 0.5) * height;
      
      const du = 0.001;
      const dv = 0.001;
      
      // Get current point
      const p0 = calculateGesnerWave(x, z, waves, steepness, speed, time);
      const p0Pos = { x: x + p0.x, y: p0.y, z: z + p0.z };
      
      // Get neighboring points
      const p1 = calculateGesnerWave(x + du, z, waves, steepness, speed, time);
      const p1Pos = { x: x + du + p1.x, y: p1.y, z: z + p1.z };
      
      const p2 = calculateGesnerWave(x, z + dv, waves, steepness, speed, time);
      const p2Pos = { x: x + p2.x, y: p2.y, z: z + dv + p2.z };
      
      // Calculate tangent vectors
      const tangentU = {
        x: p1Pos.x - p0Pos.x,
        y: p1Pos.y - p0Pos.y,
        z: p1Pos.z - p0Pos.z
      };
      
      const tangentV = {
        x: p2Pos.x - p0Pos.x,
        y: p2Pos.y - p0Pos.y,
        z: p2Pos.z - p0Pos.z
      };
      
      // Calculate normal (cross product)
      const normal = {
        x: tangentU.y * tangentV.z - tangentU.z * tangentV.y,
        y: tangentU.z * tangentV.x - tangentU.x * tangentV.z,
        z: tangentU.x * tangentV.y - tangentU.y * tangentV.x
      };
      
      // Normalize and ensure upward facing
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      if (length > 0) {
        normal.x /= length;
        normal.y /= length;
        normal.z /= length;
        
        // Ensure normal points upward (positive Y)
        if (normal.y < 0) {
          normal.x = -normal.x;
          normal.y = -normal.y;
          normal.z = -normal.z;
        }
      } else {
        // Fallback to upward normal
        normal.x = 0;
        normal.y = 1;
        normal.z = 0;
      }
      
      normals.push(normal.x, normal.y, normal.z);
    }
  }
  
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  return geometry;
}

// Generate wave parameters based on type
function generateWaveParameters(type: string, count: number, baseWavelength: number, baseAmplitude: number, baseDirection: number, seed: number) {
  const waves: Array<{ wavelength: number; amplitude: number; direction: number; phase: number }> = [];

  switch (type) {
    case 'single':
      waves.push({
        wavelength: baseWavelength,
        amplitude: baseAmplitude,
        direction: baseDirection,
        phase: 0
      });
      break;

    case 'multiple':
      for (let i = 0; i < count; i++) {
        // Use seed-based deterministic values for varied but stable patterns
        const ratio = i / (count - 1);
        const seedOffset = (seed * 0.1) % 1.0;
        const wavelengthVariation = 0.8 + 0.4 * (ratio + seedOffset * 0.3);
        const amplitudeVariation = 0.7 + 0.6 * (ratio + seedOffset * 0.2);
        const directionVariation = (ratio - 0.5) * Math.PI * 0.8 + seedOffset * Math.PI * 0.4;
        const phaseVariation = ratio * Math.PI * 2 + seedOffset * Math.PI;
        
        waves.push({
          wavelength: baseWavelength * wavelengthVariation,
          amplitude: baseAmplitude * amplitudeVariation,
          direction: baseDirection + directionVariation,
          phase: phaseVariation
        });
      }
      break;

    case 'storm':
      for (let i = 0; i < count; i++) {
        const ratio = i / (count - 1);
        const seedOffset = (seed * 0.15) % 1.0;
        const wavelengthVariation = 0.5 + 0.5 * (ratio + seedOffset * 0.4);
        const amplitudeVariation = 1.5 + (ratio + seedOffset * 0.3);
        const directionVariation = (ratio - 0.5) * Math.PI * 0.5 + seedOffset * Math.PI * 0.6;
        const phaseVariation = ratio * Math.PI * 2 + seedOffset * Math.PI * 1.5;
        
        waves.push({
          wavelength: baseWavelength * wavelengthVariation,
          amplitude: baseAmplitude * amplitudeVariation,
          direction: baseDirection + directionVariation,
          phase: phaseVariation
        });
      }
      break;

    case 'calm':
      for (let i = 0; i < count; i++) {
        const ratio = i / (count - 1);
        const seedOffset = (seed * 0.08) % 1.0;
        const wavelengthVariation = 1.2 + 0.3 * (ratio + seedOffset * 0.2);
        const amplitudeVariation = 0.3 + 0.4 * (ratio + seedOffset * 0.15);
        const directionVariation = (ratio - 0.5) * Math.PI * 0.3 + seedOffset * Math.PI * 0.2;
        const phaseVariation = ratio * Math.PI * 2 + seedOffset * Math.PI * 0.8;
        
        waves.push({
          wavelength: baseWavelength * wavelengthVariation,
          amplitude: baseAmplitude * amplitudeVariation,
          direction: baseDirection + directionVariation,
          phase: phaseVariation
        });
      }
      break;
  }

  return waves;
}

// Calculate Gesner wave displacement
function calculateGesnerWave(x: number, z: number, waves: Array<{ wavelength: number; amplitude: number; direction: number; phase: number }>, steepness: number, speed: number, time: number) {
  let totalX = 0;
  let totalY = 0;
  let totalZ = 0;

  waves.forEach(wave => {
    const k = 2 * Math.PI / wave.wavelength; // Wave number
    const omega = Math.sqrt(9.81 * k); // Angular frequency (deep water)
    
    // Direction vector
    const dirX = Math.cos(wave.direction);
    const dirZ = Math.sin(wave.direction);
    
    // Phase calculation
    const phase = k * (x * dirX + z * dirZ) - omega * speed * time + wave.phase;
    
    // Gesner wave equations
    const Q = steepness * wave.amplitude * k;
    const cosPhase = Math.cos(phase);
    const sinPhase = Math.sin(phase);
    
    // Horizontal displacement
    const horizontalDisplacement = Q * cosPhase;
    
    // Vertical displacement
    const verticalDisplacement = wave.amplitude * sinPhase;
    
    totalX += horizontalDisplacement * dirX;
    totalY += verticalDisplacement;
    totalZ += horizontalDisplacement * dirZ;
  });

  return { x: totalX, y: totalY, z: totalZ };
} 