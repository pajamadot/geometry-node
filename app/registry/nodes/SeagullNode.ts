import { NodeDefinition } from '../../types/nodeSystem';
import * as THREE from 'three';

export const seagullNodeDefinition: NodeDefinition = {
  type: 'seagull',
  name: 'Seagull',
  category: 'animation',
  description: 'Creates a flying seagull with flapping wings that circles around a center point',
  color: {
    primary: '#0ea5e9',
    secondary: '#0284c7'
  },
  ui: {
    icon: '🕊️',
    advanced: []
  },
  inputs: [
    {
      id: 'center',
      name: 'Center',
      type: 'vector',
      defaultValue: [0, 0, 0]
    },
    {
      id: 'time',
      name: 'Time',
      type: 'time',
      defaultValue: 0
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry'
    }
  ],
  parameters: [
    {
      id: 'radius',
      name: 'Flight Radius',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
      step: 0.5,
      description: 'Radius of the circular flight path'
    },
    {
      id: 'height',
      name: 'Flight Height',
      type: 'number',
      defaultValue: 5,
      min: 0,
      max: 20,
      step: 0.5,
      description: 'Height of the flight path'
    },
    {
      id: 'speed',
      name: 'Flight Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      description: 'Speed of the circular flight'
    },
    {
      id: 'wingFlapSpeed',
      name: 'Wing Flap Speed',
      type: 'number',
      defaultValue: 8,
      min: 1,
      max: 20,
      step: 0.5,
      description: 'Speed of wing flapping animation'
    },
    {
      id: 'wingFlapAmplitude',
      name: 'Wing Flap Amplitude',
      type: 'number',
      defaultValue: 0.3,
      min: 0.1,
      max: 1,
      step: 0.05,
      description: 'Amplitude of wing flapping'
    },
    {
      id: 'seagullSize',
      name: 'Seagull Size',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 3,
      step: 0.1,
      description: 'Size of the seagull'
    }
  ],
  execute: (inputs: Record<string, any>, parameters: Record<string, any>) => {
    const center = inputs.center || [0, 0, 0];
    const time = inputs.time || 0;
    const radius = parameters.radius || 10;
    const height = parameters.height || 5;
    const speed = parameters.speed || 1;
    const wingFlapSpeed = parameters.wingFlapSpeed || 8;
    const wingFlapAmplitude = parameters.wingFlapAmplitude || 0.3;
    const seagullSize = parameters.seagullSize || 1;

    // Calculate flight position
    const flightAngle = time * speed;
    const flightX = center[0] + radius * Math.cos(flightAngle);
    const flightY = center[1] + height + Math.sin(time * 2) * 0.5; // Slight up/down motion
    const flightZ = center[2] + radius * Math.sin(flightAngle);
    
    // Calculate seagull orientation (facing direction of flight)
    const tangentAngle = flightAngle + Math.PI / 2;
    const rotationY = tangentAngle;
    
    // Wing flapping animation
    const wingFlapAngle = Math.sin(time * wingFlapSpeed) * wingFlapAmplitude;
    
    // Create connected seagull geometry with proper triangles
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    // Body dimensions
    const bodyLength = 1.2 * seagullSize;
    const bodyWidth = 0.4 * seagullSize;
    const bodyHeight = 0.3 * seagullSize;
    
    // Wing dimensions
    const wingLength = 1.2 * seagullSize;
    const wingWidth = 0.8 * seagullSize;
    const wingThickness = 0.05 * seagullSize;
    
    // Head dimensions
    const headRadius = 0.15 * seagullSize;
    const headOffset = 0.6 * seagullSize;
    
    // Beak dimensions
    const beakLength = 0.2 * seagullSize;
    const beakWidth = 0.05 * seagullSize;
    
    // Tail dimensions
    const tailLength = 0.3 * seagullSize;
    const tailWidth = 0.2 * seagullSize;
    
    let vertexIndex = 0;
    
    // Helper function to add a triangle with proper winding order
    const addTriangle = (v1: number[], v2: number[], v3: number[], uv1: number[] = [0, 0], uv2: number[] = [1, 0], uv3: number[] = [0.5, 1]) => {
      // Add vertices in counter-clockwise order for outward-facing faces
      vertices.push(...v1, ...v2, ...v3);
      
      // Add UVs
      uvs.push(...uv1, ...uv2, ...uv3);
      
      // Add indices (counter-clockwise winding)
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
      vertexIndex += 3;
    };
    
    // Helper function to add a quad (two triangles)
    const addQuad = (v1: number[], v2: number[], v3: number[], v4: number[], uv1: number[] = [0, 0], uv2: number[] = [1, 0], uv3: number[] = [1, 1], uv4: number[] = [0, 1]) => {
      // Add vertices
      vertices.push(...v1, ...v2, ...v3, ...v4);
      
      // Add UVs
      uvs.push(...uv1, ...uv2, ...uv3, ...uv4);
      
      // Add indices (two triangles)
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
      indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 3);
      vertexIndex += 4;
    };
    
    // Body (elongated ellipsoid approximated with triangles)
    const bodySegments = 8;
    const bodyHeightSegments = 4;
    
    for (let i = 0; i < bodySegments; i++) {
      for (let j = 0; j < bodyHeightSegments; j++) {
        const angle1 = (i / bodySegments) * Math.PI * 2;
        const angle2 = ((i + 1) / bodySegments) * Math.PI * 2;
        const height1 = (j / bodyHeightSegments) * bodyHeight - bodyHeight / 2;
        const height2 = ((j + 1) / bodyHeightSegments) * bodyHeight - bodyHeight / 2;
        
        const x1 = Math.cos(angle1) * bodyWidth / 2;
        const z1 = Math.sin(angle1) * bodyWidth / 2;
        const x2 = Math.cos(angle2) * bodyWidth / 2;
        const z2 = Math.sin(angle2) * bodyWidth / 2;
        
        // Scale by body length
        const z1Scaled = z1 * (bodyLength / bodyWidth);
        const z2Scaled = z2 * (bodyLength / bodyWidth);
        
        // Ensure counter-clockwise winding for outward-facing faces
        addQuad(
          [x1, height1, z1Scaled],
          [x2, height1, z2Scaled],
          [x2, height2, z2Scaled],
          [x1, height2, z1Scaled]
        );
      }
    }
    
    // Wings (two triangles each, connected to body)
    const wingFlapOffset = Math.sin(wingFlapAngle) * 0.15 * seagullSize;
    const wingFlapRotation = Math.sin(wingFlapAngle) * 0.3; // Rotation angle for wing flapping
    
    // Left wing (two triangles) - more pronounced flapping
    const leftWingBase = [-bodyWidth / 2, 0, 0];
    const leftWingTip = [
      -bodyWidth / 2 - wingLength * Math.cos(wingFlapRotation), 
      wingFlapOffset, 
      -wingWidth / 2
    ];
    const leftWingBack = [
      -bodyWidth / 2 - wingLength * Math.cos(wingFlapRotation), 
      wingFlapOffset, 
      wingWidth / 2
    ];
    
    // Left wing with more detail (multiple triangles for better shape)
    const leftWingMid = [
      -bodyWidth / 2 - wingLength * 0.5 * Math.cos(wingFlapRotation), 
      wingFlapOffset * 0.5, 
      0
    ];
    
    // Left wing triangles - ensure outward-facing faces
    addTriangle(leftWingBase, leftWingMid, leftWingTip);
    addTriangle(leftWingBase, leftWingMid, leftWingBack);
    addTriangle(leftWingBase, leftWingBack, [leftWingBase[0], leftWingBase[1], leftWingBase[2] + wingWidth / 2]);
    
    // Right wing (two triangles) - opposite flapping motion
    const rightWingBase = [bodyWidth / 2, 0, 0];
    const rightWingTip = [
      bodyWidth / 2 + wingLength * Math.cos(wingFlapRotation), 
      -wingFlapOffset, 
      -wingWidth / 2
    ];
    const rightWingBack = [
      bodyWidth / 2 + wingLength * Math.cos(wingFlapRotation), 
      -wingFlapOffset, 
      wingWidth / 2
    ];
    
    // Right wing with more detail (multiple triangles for better shape)
    const rightWingMid = [
      bodyWidth / 2 + wingLength * 0.5 * Math.cos(wingFlapRotation), 
      -wingFlapOffset * 0.5, 
      0
    ];
    
    // Right wing triangles - ensure outward-facing faces
    addTriangle(rightWingBase, rightWingMid, rightWingTip);
    addTriangle(rightWingBase, rightWingMid, rightWingBack);
    addTriangle(rightWingBase, rightWingBack, [rightWingBase[0], rightWingBase[1], rightWingBase[2] + wingWidth / 2]);
    
    // Tail (one triangle, connected to body)
    const tailBase = [0, 0, -bodyLength / 2];
    const tailTip = [0, -tailLength / 2, -bodyLength / 2 - tailLength];
    const tailLeft = [-tailWidth / 2, 0, -bodyLength / 2 - tailLength / 2];
    
    // Tail triangle - ensure outward-facing face
    addTriangle(tailBase, tailTip, tailLeft);
    
    // Head (sphere approximated with triangles, connected to body)
    const headSegments = 6;
    const headHeightSegments = 3;
    
    for (let i = 0; i < headSegments; i++) {
      for (let j = 0; j < headHeightSegments; j++) {
        const angle1 = (i / headSegments) * Math.PI * 2;
        const angle2 = ((i + 1) / headSegments) * Math.PI * 2;
        const height1 = (j / headHeightSegments) * headRadius * 2 - headRadius;
        const height2 = ((j + 1) / headHeightSegments) * headRadius * 2 - headRadius;
        
        const x1 = Math.cos(angle1) * headRadius;
        const z1 = Math.sin(angle1) * headRadius;
        const x2 = Math.cos(angle2) * headRadius;
        const z2 = Math.sin(angle2) * headRadius;
        
        // Position head at front of body
        const headX1 = x1;
        const headZ1 = z1 + bodyLength / 2 + headOffset;
        const headX2 = x2;
        const headZ2 = z2 + bodyLength / 2 + headOffset;
        
        // Head quads - ensure counter-clockwise winding for outward-facing faces
        addQuad(
          [headX1, height1, headZ1],
          [headX2, height1, headZ2],
          [headX2, height2, headZ2],
          [headX1, height2, headZ1]
        );
      }
    }
    
    // Beak (cone approximated with triangles, connected to head)
    const beakSegments = 4;
    const beakBase = [0, 0, bodyLength / 2 + headOffset + headRadius];
    const beakTip = [0, 0, bodyLength / 2 + headOffset + headRadius + beakLength];
    
    for (let i = 0; i < beakSegments; i++) {
      const angle1 = (i / beakSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / beakSegments) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * beakWidth / 2;
      const y1 = Math.sin(angle1) * beakWidth / 2;
      const x2 = Math.cos(angle2) * beakWidth / 2;
      const y2 = Math.sin(angle2) * beakWidth / 2;
      
      // Beak side triangle - ensure outward-facing face
      addTriangle(
        [x1, y1, beakBase[2]],
        [x2, y2, beakBase[2]],
        [0, 0, beakTip[2]]
      );
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();
    
    // Apply transformations
    const matrix = new THREE.Matrix4();
    
    // Apply rotation (facing direction of flight)
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(rotationY);
    matrix.multiply(rotationMatrix);
    
    // Apply banking effect for turns
    const bankingAngle = Math.sin(flightAngle) * 0.2;
    const bankingMatrix = new THREE.Matrix4();
    bankingMatrix.makeRotationZ(bankingAngle);
    matrix.multiply(bankingMatrix);
    
    // Apply slight pitch for realistic flight
    const pitchAngle = Math.sin(time * speed * 0.5) * 0.1;
    const pitchMatrix = new THREE.Matrix4();
    pitchMatrix.makeRotationX(pitchAngle);
    matrix.multiply(pitchMatrix);
    
    // Apply position
    const positionMatrix = new THREE.Matrix4();
    positionMatrix.makeTranslation(flightX, flightY, flightZ);
    matrix.multiply(positionMatrix);
    
    // Apply transformations to geometry
    geometry.applyMatrix4(matrix);
    
    // Recompute normals after transformation to ensure proper lighting
    geometry.computeVertexNormals();
    
    return {
      geometry: geometry
    };
  }
}; 