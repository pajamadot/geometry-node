import { JsonNodeDefinition } from '../../types/jsonNodes';

export const neonGlowMaterialNode: JsonNodeDefinition = {
  type: 'neon-glow-material',
  name: 'Neon Glow Material',
  description: 'Cyberpunk neon glow with edge lighting effects',
  category: 'materials',
  color: {
    primary: '#f97316',
    secondary: '#ea580c'
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
      description: 'Neon glow shader material'
    }
  ],
  parameters: [
    {
      id: 'glowColor',
      name: 'Glow Color',
      type: 'color',
      defaultValue: '#00ffff',
      description: 'Neon glow color'
    },
    {
      id: 'intensity',
      name: 'Glow Intensity',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      description: 'Glow brightness'
    },
    {
      id: 'pulse',
      name: 'Pulse Speed',
      type: 'number',
      defaultValue: 2.0,
      min: 0.0,
      max: 5.0,
      step: 0.1,
      description: 'Pulsing animation speed'
    }
  ],
  executeCode: `
const time = inputs.time || 0;
const glowColor = parameters.glowColor || '#00ffff';
const intensity = parameters.intensity || 2.5;
const pulse = parameters.pulse || 2.0;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const rgb = hexToRgb(glowColor);

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
  uniform vec3 uGlowColor;
  uniform float uIntensity;
  uniform float uPulse;
  
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec2 vUv;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    
    // Fresnel edge glow
    float fresnel = 1.0 - abs(dot(viewDir, normal));
    fresnel = pow(fresnel, 2.0);
    
    // Pulsing effect
    float pulseFactor = 1.0;
    if (uPulse > 0.0) {
      pulseFactor = 0.7 + 0.3 * sin(uTime * uPulse);
    }
    
    // Scanline effect
    float scanlines = sin(vUv.y * 100.0 + uTime * 10.0) * 0.1 + 0.9;
    
    // Base color with glow
    vec3 baseColor = uGlowColor * 0.3;
    vec3 glowEffect = uGlowColor * fresnel * uIntensity * pulseFactor * scanlines;
    
    vec3 finalColor = baseColor + glowEffect;
    
    // Alpha based on glow intensity
    float alpha = 0.8 + fresnel * 0.2;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
\`;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: time },
    uGlowColor: { value: new THREE.Vector3(...rgb) },
    uIntensity: { value: intensity },
    uPulse: { value: pulse }
  },
  transparent: true,
  side: THREE.DoubleSide
});

return { material };`,
  ui: {
    width: 240,
    icon: 'zap',
    advanced: ['pulse']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['material', 'shader', 'neon', 'cyberpunk', 'glow']
}; 