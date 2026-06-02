import { NodeDefinition } from '../../types/nodeSystem';
import { Zap } from 'lucide-react';
import * as THREE from 'three';

// Hologram vertex shader
const hologramVertexShader = `
  uniform float time;
  uniform float glitchIntensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Simple noise for glitch effect
  float noise(vec3 p) {
    return sin(p.x * 10.0 + time) * sin(p.y * 10.0 + time * 1.3) * sin(p.z * 10.0 + time * 0.7);
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Add glitch displacement
    vec3 newPosition = position;
    if (glitchIntensity > 0.0) {
      float glitch = noise(position) * glitchIntensity * 0.1;
      newPosition += normal * glitch;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Hologram fragment shader  
const hologramFragmentShader = `
  uniform float time;
  uniform vec3 hologramColor;
  uniform float scanlineSpeed;
  uniform float scanlineCount;
  uniform float glitchIntensity;
  uniform float rimPower;
  uniform float transparency;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    
    // Rim lighting effect
    float rim = 1.0 - max(0.0, dot(viewDirection, normal));
    rim = pow(rim, rimPower);
    
    // Scanlines
    float scanline = sin(vUv.y * scanlineCount + time * scanlineSpeed);
    scanline = smoothstep(0.3, 0.7, scanline);
    
    // Glitch effect
    float glitch = 1.0;
    if (glitchIntensity > 0.0) {
      glitch = sin(vUv.x * 100.0 + time * 10.0) * sin(vUv.y * 80.0 + time * 7.0);
      glitch = step(0.9, glitch) * glitchIntensity + (1.0 - glitchIntensity);
    }
    
    // Combine effects
    vec3 finalColor = hologramColor * rim * (0.5 + scanline * 0.5) * glitch;
    float alpha = rim * (1.0 - transparency) * glitch;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// HOLOGRAM MATERIAL NODE
export const hologramMaterialNodeDefinition: NodeDefinition = {
  type: 'hologram-material',
  name: 'Hologram Material',
  description: 'Futuristic hologram/force field material with scanlines and rim lighting',
  category: 'materials',
  color: {
    primary: '#06ffa5',
    secondary: '#00d285'
  },
  inputs: [
    {
      id: 'hologramColor',
      name: 'Hologram Color',
      type: 'color',
      defaultValue: '#00ffff',
      description: 'Main hologram color'
    },
    {
      id: 'scanlineSpeed',
      name: 'Scanline Speed',
      type: 'number',
      defaultValue: 2.0,
      min: 0,
      max: 10,
      step: 0.1,
      description: 'Speed of scanline animation'
    },
    {
      id: 'scanlineCount',
      name: 'Scanline Count',
      type: 'number',
      defaultValue: 50.0,
      min: 10,
      max: 200,
      step: 1,
      description: 'Number of scanlines'
    },
    {
      id: 'glitchIntensity',
      name: 'Glitch Intensity',
      type: 'number',
      defaultValue: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Strength of glitch effect'
    },
    {
      id: 'rimPower',
      name: 'Rim Power',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 10,
      step: 0.1,
      description: 'Rim lighting intensity'
    },
    {
      id: 'transparency',
      name: 'Transparency',
      type: 'number',
      defaultValue: 0.3,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Material transparency'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Hologram material'
    }
  ],
  parameters: [],
  ui: {
    icon: Zap,
    width: 260,
    advanced: ['scanlineCount', 'rimPower']
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
      return new THREE.Vector3(0, 1, 1);
    };

    const hologramColor = parseColor(inputs.hologramColor || '#00ffff');
    const scanlineSpeed = inputs.scanlineSpeed ?? 2.0;
    const scanlineCount = inputs.scanlineCount ?? 50.0;
    const glitchIntensity = inputs.glitchIntensity ?? 0.2;
    const rimPower = inputs.rimPower ?? 2.0;
    const transparency = inputs.transparency ?? 0.3;

    const material = new THREE.ShaderMaterial({
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      uniforms: {
        time: { value: 0.0 },
        hologramColor: { value: hologramColor },
        scanlineSpeed: { value: scanlineSpeed },
        scanlineCount: { value: scanlineCount },
        glitchIntensity: { value: glitchIntensity },
        rimPower: { value: rimPower },
        transparency: { value: transparency }
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending // Additive blending for glow effect
    });

    // Animation function
    (material as any).isHologramMaterial = true;
    (material as any).animateHologram = (time: number) => {
      if (material.uniforms && material.uniforms.time) {
        material.uniforms.time.value = time;
      }
    };

    return { material };
  }
}; 