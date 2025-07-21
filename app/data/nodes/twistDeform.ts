import { JsonNodeDefinition } from '../../types/jsonNodes';

export const twistDeformNode: JsonNodeDefinition = {
  type: 'twist-deform',
  name: 'Twist Deform',
  description: 'Applies helical twist deformation to geometry',
  category: 'modifiers',
  color: {
    primary: '#f59e0b',
    secondary: '#d97706'
  },
  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Input geometry to deform'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Twisted geometry'
    }
  ],
  parameters: [
    {
      id: 'axis',
      name: 'Twist Axis',
      type: 'select',
      defaultValue: 'y',
      options: ['x', 'y', 'z'],
      description: 'Axis of twist rotation'
    },
    {
      id: 'angle',
      name: 'Twist Angle',
      type: 'number',
      defaultValue: 1,
      min: -10,
      max: 10,
      step: 0.1,
      description: 'Twist strength (radians per unit)'
    },
    {
      id: 'falloff',
      name: 'Falloff',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      description: 'Distance falloff factor'
    }
  ],
  executeCode: `
const inputGeometry = inputs.geometry;
const axis = parameters.axis || 'y';
const angle = parameters.angle || 1;
const falloff = parameters.falloff || 1;

if (!inputGeometry || !inputGeometry.attributes || !inputGeometry.attributes.position) {
  // Create a simple fallback geometry if no input
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  return { geometry };
}

// Clone the input geometry
const geometry = inputGeometry.clone();
const positionAttribute = geometry.attributes.position;
const vertices = positionAttribute.array;

// Apply twist deformation
for (let i = 0; i < vertices.length; i += 3) {
  let x = vertices[i];
  let y = vertices[i + 1];
  let z = vertices[i + 2];
  
  let twistAmount;
  
  if (axis === 'y') {
    twistAmount = angle * y / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newX = x * cos - z * sin;
    const newZ = x * sin + z * cos;
    vertices[i] = newX;
    vertices[i + 2] = newZ;
  } else if (axis === 'x') {
    twistAmount = angle * x / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newY = y * cos - z * sin;
    const newZ = y * sin + z * cos;
    vertices[i + 1] = newY;
    vertices[i + 2] = newZ;
  } else { // z axis
    twistAmount = angle * z / falloff;
    const cos = Math.cos(twistAmount);
    const sin = Math.sin(twistAmount);
    const newX = x * cos - y * sin;
    const newY = x * sin + y * cos;
    vertices[i] = newX;
    vertices[i + 1] = newY;
  }
}

// Mark position attribute as needing update
positionAttribute.needsUpdate = true;
geometry.computeVertexNormals();

return { geometry };`,
  ui: {
    width: 220,
    icon: 'zap',
    advanced: ['falloff']
  },
  version: '1.0.0',
  author: 'GeometryScript',
  created: '2024-01-01T00:00:00.000Z',
  tags: ['deformation', 'twist', 'modifier']
}; 