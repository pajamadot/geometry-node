import { JsonNodeDefinition } from '../../types/jsonNodes';

export const lavaMaterialNode: JsonNodeDefinition = {
  type: 'lava-material',
  name: 'Lava Material',
  description: 'Animated molten lava material with flowing effects',
  category: 'materials',
  color: {
    primary: '#dc2626',
    secondary: '#b91c1c'
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
      description: 'Animated lava shader material'
    }
  ],
  parameters: [
    {
      id: 'temperature',
      name: 'Temperature',
      type: 'number',
      defaultValue: 2000,
      min: 800,
      max: 4000,
      description: 'Lava temperature (affects color)'
    },
    {
      id: 'flowSpeed',
      name: 'Flow Speed',
      type: 'number',
      defaultValue: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      description: 'Lava flow animation speed'
    },
    {
      id: 'crustThickness',
      name: 'Crust Thickness',
      type: 'number',
      defaultValue: 0.3,
      min: 0.0,
      max: 1.0,
      step: 0.05,
      description: 'Dark crust layer thickness'
    }
  ],
  executeCode: `
const time = inputs.time || 0;
const temperature = parameters.temperature || 2000;
const flowSpeed = parameters.flowSpeed || 1.0;
const crustThickness = parameters.crustThickness || 0.3;

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

const fragmentShader = \`
  uniform float uTime;
  uniform float uTemperature;
  uniform float uCrustThickness;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  // Noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Multi-octave noise for lava flow
    vec2 flowUV = vUv * 4.0 + vec2(uTime * 0.1, uTime * 0.05);
    float lavaFlow = noise(flowUV);
    lavaFlow += noise(flowUV * 2.0) * 0.5;
    lavaFlow += noise(flowUV * 4.0) * 0.25;
    lavaFlow /= 1.75;
    
    // Temperature-based color
    float heat = (uTemperature - 800.0) / 3200.0;
    vec3 coldColor = vec3(0.1, 0.05, 0.02); // Dark crust
    vec3 warmColor = vec3(0.8, 0.3, 0.1);   // Orange glow
    vec3 hotColor = vec3(1.0, 0.9, 0.3);    // Yellow hot
    
    // Flow pattern affects temperature
    float localHeat = heat + (lavaFlow - 0.5) * 0.4;
    
    vec3 lavaColor;
    if (localHeat < 0.3) {
      lavaColor = mix(coldColor, warmColor, localHeat / 0.3);
    } else {
      lavaColor = mix(warmColor, hotColor, (localHeat - 0.3) / 0.7);
    }
    
    // Crust effect
    float crustMask = smoothstep(uCrustThickness - 0.1, uCrustThickness + 0.1, lavaFlow);
    lavaColor = mix(coldColor, lavaColor, crustMask);
    
    // Glowing edges
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vWorldNormal));
    lavaColor += hotColor * fresnel * 0.3 * crustMask;
    
    gl_FragColor = vec4(lavaColor, 1.0);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time * flowSpeed },
    uTemperature: { value: temperature },
    uCrustThickness: { value: crustThickness }
  }
});

return { material };`,
  ui: {
    width: 240,
    icon: 'zap',
    advanced: ['crustThickness']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['material', 'shader', 'lava', 'animated']
}; 