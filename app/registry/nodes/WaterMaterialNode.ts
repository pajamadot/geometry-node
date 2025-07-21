import { NodeDefinition } from '../../types/nodeSystem';
import { Waves } from 'lucide-react';
import * as THREE from 'three';

// Water vertex shader - creates animated waves
const waterVertexShader = `
  uniform float time;
  uniform float waveHeight;
  uniform float waveSpeed;
  uniform float waveFrequency;
  uniform vec2 waveDirection;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  // Simple noise function for wave generation
  float noise(vec2 p) {
    return sin(p.x * 10.0) * cos(p.y * 10.0);
  }
  
  // Generate wave displacement
  float getWaveHeight(vec2 pos) {
    vec2 waveDir = normalize(waveDirection);
    float wave1 = sin(dot(pos, waveDir) * waveFrequency + time * waveSpeed) * waveHeight;
    float wave2 = sin(dot(pos, waveDir * 1.3) * waveFrequency * 0.7 + time * waveSpeed * 1.2) * waveHeight * 0.5;
    float wave3 = sin(dot(pos, waveDir * 0.8) * waveFrequency * 1.5 + time * waveSpeed * 0.8) * waveHeight * 0.3;
    
    // Add some noise for more organic movement
    float noiseWave = noise(pos * 2.0 + time * 0.1) * waveHeight * 0.1;
    
    return wave1 + wave2 + wave3 + noiseWave;
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Calculate wave displacement
    vec3 newPosition = position;
    newPosition.y += getWaveHeight(position.xz);
    
    // Calculate normals by sampling nearby points
    float eps = 0.1;
    float hL = getWaveHeight(position.xz - vec2(eps, 0.0));
    float hR = getWaveHeight(position.xz + vec2(eps, 0.0));
    float hD = getWaveHeight(position.xz - vec2(0.0, eps));
    float hU = getWaveHeight(position.xz + vec2(0.0, eps));
    
    vec3 tangentX = normalize(vec3(2.0 * eps, hR - hL, 0.0));
    vec3 tangentZ = normalize(vec3(0.0, hU - hD, 2.0 * eps));
    vNormal = normalize(cross(tangentZ, tangentX));
    
    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Water fragment shader - creates water appearance
const waterFragmentShader = `
  uniform float time;
  uniform vec3 shallowColor;
  uniform vec3 deepColor;
  uniform float transparency;
  uniform float reflectivity;
  uniform float metalness;
  uniform float roughness;
  uniform float fresnelPower;
  uniform vec3 lightDirection;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    
    // Fresnel effect - more reflection at grazing angles
    float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normal)), fresnelPower);
    
    // Simple lighting calculation
    vec3 lightDir = normalize(lightDirection);
    float lightIntensity = max(0.0, dot(normal, lightDir));
    
    // Color mixing based on depth simulation
    float depthFactor = 1.0 - fresnel;
    vec3 waterColor = mix(shallowColor, deepColor, depthFactor);
    
    // Add some sparkle effect
    float sparkle = sin(vUv.x * 100.0 + time * 2.0) * sin(vUv.y * 100.0 + time * 1.5);
    sparkle = smoothstep(0.8, 1.0, sparkle) * 0.3;
    
    // Combine lighting
    vec3 finalColor = waterColor * (0.3 + lightIntensity * 0.7) + sparkle;
    
    // Add reflection effect
    finalColor = mix(finalColor, vec3(0.8, 0.9, 1.0), fresnel * reflectivity);
    
    gl_FragColor = vec4(finalColor, 1.0 - transparency);
  }
`;

// WATER MATERIAL NODE - Procedural water shader
export const waterMaterialNodeDefinition: NodeDefinition = {
  type: 'water-material',
  name: 'Water Material',
  description: 'Procedural water material with animated waves and realistic water effects',
  category: 'materials',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },
  inputs: [
    {
      id: 'shallowColor',
      name: 'Shallow Color',
      type: 'color',
      defaultValue: '#40e0d0',
      description: 'Color of shallow water'
    },
    {
      id: 'deepColor',
      name: 'Deep Color',
      type: 'color',
      defaultValue: '#006994',
      description: 'Color of deep water'
    },
    {
      id: 'waveHeight',
      name: 'Wave Height',
      type: 'number',
      defaultValue: 0.2,
      min: 0,
      max: 2,
      step: 0.01,
      description: 'Height of water waves'
    },
    {
      id: 'waveSpeed',
      name: 'Wave Speed',
      type: 'number',
      defaultValue: 1.0,
      min: 0,
      max: 5,
      step: 0.1,
      description: 'Speed of wave animation'
    },
    {
      id: 'waveFrequency',
      name: 'Wave Frequency',
      type: 'number',
      defaultValue: 2.0,
      min: 0.1,
      max: 10,
      step: 0.1,
      description: 'Frequency of waves'
    },
    {
      id: 'transparency',
      name: 'Transparency',
      type: 'number',
      defaultValue: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Water transparency'
    },
    {
      id: 'reflectivity',
      name: 'Reflectivity',
      type: 'number',
      defaultValue: 0.8,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Surface reflectivity'
    },
    {
      id: 'fresnelPower',
      name: 'Fresnel Power',
      type: 'number',
      defaultValue: 3.0,
      min: 0.5,
      max: 10,
      step: 0.1,
      description: 'Fresnel reflection strength'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Procedural water material'
    }
  ],
  parameters: [],
  ui: {
    icon: Waves,
    width: 280,
    advanced: ['waveFrequency', 'fresnelPower']
  },
  execute: (inputs, parameters) => {
    // Parse color inputs
    const parseColor = (colorInput: any) => {
      if (typeof colorInput === 'string' && colorInput.startsWith('#')) {
        const hex = colorInput.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        return new THREE.Vector3(r, g, b);
      }
      return new THREE.Vector3(1, 1, 1);
    };

    const shallowColor = parseColor(inputs.shallowColor || '#40e0d0');
    const deepColor = parseColor(inputs.deepColor || '#006994');
    const waveHeight = inputs.waveHeight ?? 0.2;
    const waveSpeed = inputs.waveSpeed ?? 1.0;
    const waveFrequency = inputs.waveFrequency ?? 2.0;
    const transparency = inputs.transparency ?? 0.1;
    const reflectivity = inputs.reflectivity ?? 0.8;
    const fresnelPower = inputs.fresnelPower ?? 3.0;

    // console.log('Water Material inputs:', {
    //   shallowColor: inputs.shallowColor,
    //   deepColor: inputs.deepColor,
    //   waveHeight,
    //   waveSpeed,
    //   transparency,
    //   reflectivity
    // });

    // Create shader material with custom uniforms
    const material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        time: { value: 0.0 },
        shallowColor: { value: shallowColor },
        deepColor: { value: deepColor },
        waveHeight: { value: waveHeight },
        waveSpeed: { value: waveSpeed },
        waveFrequency: { value: waveFrequency },
        waveDirection: { value: new THREE.Vector2(1.0, 0.3) },
        transparency: { value: transparency },
        reflectivity: { value: reflectivity },
        fresnelPower: { value: fresnelPower },
        lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.5) }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    // Store animation function for time updates
    (material as any).isWaterMaterial = true;
    (material as any).animateWater = (time: number) => {
      if (material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = time;
      }
    };

    // console.log('Created Water Material with', Object.keys(material.uniforms).length, 'uniforms');

    return { material };
  }
}; 