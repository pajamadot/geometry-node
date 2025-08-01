import { NodeDefinition } from '../../types/nodeSystem';
import { Flame } from 'lucide-react';
import * as THREE from 'three';

// Lava vertex shader
const lavaVertexShader = `
  uniform float time;
  uniform float bumpiness;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Noise functions for surface displacement
  float noise(vec2 p) {
    return sin(p.x * 6.0 + time * 0.5) * cos(p.y * 6.0 + time * 0.7) * 0.5 + 0.5;
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Add surface bumps for lava effect
    vec3 newPosition = position;
    float bump = noise(position.xz + time * 0.1) * bumpiness;
    newPosition += normal * bump;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Lava fragment shader
const lavaFragmentShader = `
  uniform float time;
  uniform vec3 hotColor;
  uniform vec3 coolColor;
  uniform float flowSpeed;
  uniform float noiseScale;
  uniform float temperature;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Multi-octave noise for realistic lava flow
  float noise(vec2 p) {
    return sin(p.x * 12.0) * cos(p.y * 12.0) * 0.5 + 0.5;
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    vec2 flowUv = vUv + vec2(time * flowSpeed * 0.1, time * flowSpeed * 0.05);
    
    // Generate lava flow pattern
    float lavaPattern = fbm(flowUv * noiseScale);
    lavaPattern += fbm(flowUv * noiseScale * 2.0 + time * 0.1) * 0.5;
    lavaPattern += fbm(flowUv * noiseScale * 4.0 + time * 0.2) * 0.25;
    
    // Temperature variation
    float tempVariation = fbm(vUv * 3.0 + time * 0.05);
    float finalTemp = temperature + tempVariation * 0.3;
    
    // Color mixing based on temperature
    vec3 lavaColor = mix(coolColor, hotColor, lavaPattern * finalTemp);
    
    // Add glow effect
    float glow = pow(lavaPattern, 2.0) * finalTemp;
    lavaColor += hotColor * glow * 0.5;
    
    // Emissive effect
    float emissive = lavaPattern * finalTemp;
    
    gl_FragColor = vec4(lavaColor, 1.0);
    
    // Add emissive for HDR glow
    gl_FragColor.rgb += lavaColor * emissive * 0.5;
  }
`;

// LAVA MATERIAL NODE
export const lavaMaterialNodeDefinition: NodeDefinition = {
  type: 'lava-material',
  name: 'Lava Material',
  description: 'Animated lava material with flowing hot and cool regions',
  category: 'materials',
  color: {
    primary: '#ff4500',
    secondary: '#dc2626'
  },
  inputs: [
    {
      id: 'hotColor',
      name: 'Hot Color',
      type: 'color',
      defaultValue: '#ff6600',
      description: 'Color of hot lava regions'
    },
    {
      id: 'coolColor',
      name: 'Cool Color',
      type: 'color',
      defaultValue: '#330000',
      description: 'Color of cooled lava regions'
    },
    {
      id: 'flowSpeed',
      name: 'Flow Speed',
      type: 'number',
      defaultValue: 1.0,
      min: 0,
      max: 5,
      step: 0.1,
      description: 'Speed of lava flow animation'
    },
    {
      id: 'temperature',
      name: 'Temperature',
      type: 'number',
      defaultValue: 0.8,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Overall temperature of the lava'
    },
    {
      id: 'noiseScale',
      name: 'Noise Scale',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 10,
      step: 0.1,
      description: 'Scale of lava flow patterns'
    },
    {
      id: 'bumpiness',
      name: 'Bumpiness',
      type: 'number',
      defaultValue: 0.1,
      min: 0,
      max: 0.5,
      step: 0.01,
      description: 'Surface displacement amount'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Lava material'
    }
  ],
  parameters: [],
  ui: {
    icon: Flame,
    width: 260,
    advanced: ['noiseScale', 'bumpiness']
  },
  execute: (inputs, parameters) => {
    const parseColor = (colorInput: any) => {
      if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
        const hex = colorInput.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        return new THREE.Vector3(r, g, b);
      }
      return new THREE.Vector3(1, 0.4, 0);
    };

    const hotColor = parseColor(inputs.hotColor || '#ff6600');
    const coolColor = parseColor(inputs.coolColor || '#330000');
    const flowSpeed = inputs.flowSpeed ?? 1.0;
    const temperature = inputs.temperature ?? 0.8;
    const noiseScale = inputs.noiseScale ?? 2.0;
    const bumpiness = inputs.bumpiness ?? 0.1;

    const material = new THREE.ShaderMaterial({
      vertexShader: lavaVertexShader,
      fragmentShader: lavaFragmentShader,
      uniforms: {
        time: { value: 0.0 },
        hotColor: { value: hotColor },
        coolColor: { value: coolColor },
        flowSpeed: { value: flowSpeed },
        temperature: { value: temperature },
        noiseScale: { value: noiseScale },
        bumpiness: { value: bumpiness }
      },
      side: THREE.DoubleSide
    });

    // Animation function
    (material as any).isLavaMaterial = true;
    (material as any).animateLava = (time: number) => {
      if (material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = time;
      }
    };

    return { material };
  }
}; 