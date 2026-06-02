import { JsonNodeDefinition } from '../../types/jsonNodes';

export const portalMaterialNode: JsonNodeDefinition = {
  type: 'portal-material',
  name: 'Portal Material',
  description: 'Swirling interdimensional portal effect',
  category: 'materials',
  color: {
    primary: '#06b6d4',
    secondary: '#0891b2'
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
      description: 'Portal swirl shader material'
    }
  ],
  parameters: [
    {
      id: 'swirl',
      name: 'Swirl Intensity',
      type: 'number',
      defaultValue: 3.0,
      min: 0.5,
      max: 8.0,
      step: 0.1,
      description: 'Spiral distortion strength'
    },
    {
      id: 'color1',
      name: 'Inner Color',
      type: 'color',
      defaultValue: '#ff006e',
      description: 'Portal center color'
    },
    {
      id: 'color2',
      name: 'Outer Color',
      type: 'color',
      defaultValue: '#8338ec',
      description: 'Portal edge color'
    }
  ],
  executeCode: `
const time = inputs.time || 0;
const swirl = parameters.swirl || 3.0;
const color1 = parameters.color1 || '#ff006e';
const color2 = parameters.color2 || '#8338ec';

// Convert hex colors to RGB
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const rgb1 = hexToRgb(color1);
const rgb2 = hexToRgb(color2);

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
  uniform float uSwirl;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 pos = vUv - center;
    
    // Polar coordinates
    float radius = length(pos);
    float angle = atan(pos.y, pos.x);
    
    // Spiral distortion
    angle += radius * uSwirl + uTime * 2.0;
    
    // Animated spiral pattern
    float spiral = sin(angle * 6.0 - radius * 20.0 + uTime * 3.0) * 0.5 + 0.5;
    
    // Radial fade
    float fade = 1.0 - smoothstep(0.0, 0.5, radius);
    
    // Energy rings
    float rings = sin(radius * 30.0 - uTime * 5.0) * 0.3 + 0.7;
    
    // Color mixing
    vec3 color = mix(uColor2, uColor1, spiral * rings);
    
    // Portal glow
    float glow = exp(-radius * 3.0) * 2.0;
    color += vec3(0.3, 0.6, 1.0) * glow;
    
    float alpha = fade * rings * (0.7 + spiral * 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uSwirl: { value: swirl },
    uColor1: { value: new THREE.Vector3(...rgb1) },
    uColor2: { value: new THREE.Vector3(...rgb2) }
  },
  transparent: true,
  side: THREE.DoubleSide
});

return { material };`,
  ui: {
    width: 240,
    icon: 'zap',
    advanced: ['swirl']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['material', 'shader', 'portal', 'dimensional', 'swirl']
}; 