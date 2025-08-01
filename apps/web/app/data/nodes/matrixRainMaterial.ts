import { JsonNodeDefinition } from '../../types/jsonNodes';

export const matrixRainMaterialNode: JsonNodeDefinition = {
  type: 'matrix-rain-material',
  name: 'Matrix Rain Material',
  description: 'Digital matrix rain effect with falling characters',
  category: 'materials',
  color: {
    primary: '#22c55e',
    secondary: '#16a34a'
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
      description: 'Matrix rain shader material'
    }
  ],
  parameters: [
    {
      id: 'density',
      name: 'Character Density',
      type: 'number',
      defaultValue: 20,
      min: 5,
      max: 50,
      description: 'Number of character columns'
    },
    {
      id: 'speed',
      name: 'Fall Speed',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      description: 'Speed of falling characters'
    },
    {
      id: 'brightness',
      name: 'Brightness',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 3.0,
      step: 0.1,
      description: 'Overall brightness'
    }
  ],
  executeCode: `
const time = inputs.time || 0;
const density = parameters.density || 20;
const speed = parameters.speed || 2.0;
const brightness = parameters.brightness || 1.5;

const vertexShader = \`
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const fragmentShader = \`
  uniform float uTime;
  uniform float uDensity;
  uniform float uSpeed;
  uniform float uBrightness;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 grid = vec2(uDensity, uDensity * 2.0);
    vec2 cell = floor(vUv * grid);
    vec2 cellUV = fract(vUv * grid);
    
    // Random offset for each column
    float columnOffset = random(vec2(cell.x, 0.0)) * 6.28;
    
    // Falling effect
    float fall = fract(uTime * uSpeed * 0.1 + columnOffset);
    float trailPos = cell.y / grid.y;
    
    // Distance from trail head
    float dist = abs(trailPos - fall);
    if (trailPos > fall) dist = min(dist, fall + 1.0 - trailPos);
    
    // Trail fade
    float trail = exp(-dist * 15.0);
    
    // Character pattern (simulated)
    float charPattern = step(0.3, random(cell + floor(uTime * uSpeed * 2.0)));
    
    // Matrix green color
    vec3 matrixGreen = vec3(0.0, 1.0, 0.3);
    vec3 darkGreen = vec3(0.0, 0.3, 0.1);
    
    // Lead character is brighter
    float leadBrightness = exp(-dist * 50.0) * 2.0;
    vec3 color = mix(darkGreen, matrixGreen, trail + leadBrightness);
    
    float alpha = (trail + leadBrightness) * charPattern * uBrightness;
    
    gl_FragColor = vec4(color * alpha, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uDensity: { value: density },
    uSpeed: { value: speed },
    uBrightness: { value: brightness }
  },
  transparent: true,
  side: THREE.DoubleSide
});

return { material };`,
  ui: {
    width: 260,
    icon: 'zap',
    advanced: ['density', 'brightness']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['material', 'shader', 'matrix', 'digital', 'cyberpunk']
}; 