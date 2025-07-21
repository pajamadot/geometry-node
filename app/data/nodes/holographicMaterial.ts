import { JsonNodeDefinition } from '../../types/jsonNodes';

export const holographicMaterialNode: JsonNodeDefinition = {
  type: 'holographic-material',
  name: 'Holographic Material',
  description: 'Creates iridescent holographic material with rainbow effects',
  category: 'materials',
  color: {
    primary: '#a855f7',
    secondary: '#7c3aed'
  },
  inputs: [
    {
      id: 'time',
      name: 'Time',
      type: 'number',
      defaultValue: 0,
      description: 'Animation time'
    }
  ],
  outputs: [
    {
      id: 'material',
      name: 'Material',
      type: 'material',
      description: 'Holographic shader material'
    }
  ],
  parameters: [
    {
      id: 'intensity',
      name: 'Intensity',
      type: 'number',
      defaultValue: 2.0,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      description: 'Hologram intensity'
    },
    {
      id: 'speed',
      name: 'Animation Speed',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      description: 'Animation speed'
    },
    {
      id: 'fresnelPower',
      name: 'Fresnel Power',
      type: 'number',
      defaultValue: 3.0,
      min: 1.0,
      max: 10.0,
      step: 0.5,
      description: 'Edge highlighting strength'
    }
  ],
  executeCode: `
const time = inputs.time || 0;
const intensity = parameters.intensity || 2.0;
const speed = parameters.speed || 1.0;
const fresnelPower = parameters.fresnelPower || 3.0;

// Holographic vertex shader
const vertexShader = \`
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

// Holographic fragment shader
const fragmentShader = \`
  uniform float uTime;
  uniform float uIntensity;
  uniform float uFresnelPower;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    
    // Fresnel effect
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, uFresnelPower);
    
    // Animated rainbow colors
    float colorShift = vUv.x * 3.0 + vUv.y * 2.0 + uTime * 0.5;
    vec3 rainbow = hsv2rgb(vec3(fract(colorShift), 0.8, 1.0));
    
    // Holographic interference pattern
    float pattern = sin(vWorldPosition.y * 20.0 + uTime * 2.0) * 0.5 + 0.5;
    pattern *= sin(vWorldPosition.x * 15.0 + uTime * 1.5) * 0.5 + 0.5;
    
    // Combine effects
    vec3 color = rainbow * pattern * fresnel * uIntensity;
    float alpha = fresnel * 0.8 + pattern * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
\`;

// Create shader material
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time * speed },
    uIntensity: { value: intensity },
    uFresnelPower: { value: fresnelPower }
  },
  transparent: true,
  side: THREE.DoubleSide
});

return { material };`,
  ui: {
    width: 260,
    icon: 'zap',
    advanced: ['fresnelPower', 'speed']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['material', 'shader', 'holographic', 'rainbow']
}; 