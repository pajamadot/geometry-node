import { NodeDefinition } from '../../types/nodeSystem';
import { Building2 } from 'lucide-react';
import * as THREE from 'three';

// LIGHTHOUSE NODE - Generates procedural lighthouse geometry
export const lighthouseNodeDefinition: NodeDefinition = {
  type: 'lighthouse',
  name: 'Lighthouse',
  description: 'Generate procedural lighthouse with tower, roof, windows, and balcony',
  category: 'geometry',
  color: {
    primary: '#f59e0b',
    secondary: '#d97706'
  },

  inputs: [
    {
      id: 'towerHeight',
      name: 'Tower Height',
      type: 'number',
      defaultValue: 20.0,
      min: 5.0,
      max: 50.0,
      step: 0.5,
      description: 'Height of the main tower'
    },
    {
      id: 'towerRadius',
      name: 'Tower Radius',
      type: 'number',
      defaultValue: 3.0,
      min: 1.0,
      max: 10.0,
      step: 0.1,
      description: 'Radius of the main tower'
    },
    {
      id: 'roofHeight',
      name: 'Roof Height',
      type: 'number',
      defaultValue: 4.0,
      min: 1.0,
      max: 15.0,
      step: 0.2,
      description: 'Height of the conical roof'
    },
    {
      id: 'roofRadius',
      name: 'Roof Radius',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 8.0,
      step: 0.1,
      description: 'Radius of the roof base'
    },
    {
      id: 'baseHeight',
      name: 'Base Height',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 8.0,
      step: 0.1,
      description: 'Height of the foundation base'
    },
    {
      id: 'baseRadius',
      name: 'Base Radius',
      type: 'number',
      defaultValue: 4.0,
      min: 1.0,
      max: 12.0,
      step: 0.1,
      description: 'Radius of the foundation base'
    },
    {
      id: 'windowCount',
      name: 'Window Count',
      type: 'integer',
      defaultValue: 4,
      min: 0,
      max: 12,
      step: 1,
      description: 'Number of windows around the tower'
    },
    {
      id: 'windowHeight',
      name: 'Window Height',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 3.0,
      step: 0.1,
      description: 'Height of each window'
    },
    {
      id: 'windowWidth',
      name: 'Window Width',
      type: 'number',
      defaultValue: 0.8,
      min: 0.3,
      max: 2.0,
      step: 0.1,
      description: 'Width of each window'
    },
    {
      id: 'windowPosition',
      name: 'Window Position',
      type: 'number',
      defaultValue: 0.6,
      min: 0.1,
      max: 0.9,
      step: 0.05,
      description: 'Window position as fraction of tower height'
    },
    {
      id: 'balconyRadius',
      name: 'Balcony Radius',
      type: 'number',
      defaultValue: 3.5,
      min: 2.0,
      max: 8.0,
      step: 0.1,
      description: 'Radius of the balcony'
    },
    {
      id: 'balconyHeight',
      name: 'Balcony Height',
      type: 'number',
      defaultValue: 0.3,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      description: 'Height of the balcony railing'
    },
    {
      id: 'segments',
      name: 'Segments',
      type: 'integer',
      defaultValue: 16,
      min: 8,
      max: 32,
      step: 2,
      description: 'Mesh resolution for cylinders and cones'
    },
    {
      id: 'lanternRadius',
      name: 'Lantern Radius',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 4.0,
      step: 0.1,
      description: 'Radius of the lantern room'
    },
    {
      id: 'lanternHeight',
      name: 'Lantern Height',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 6.0,
      step: 0.1,
      description: 'Height of the lantern room'
    }
  ],
  outputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      description: 'Generated lighthouse geometry'
    }
  ],
  parameters: [],
  ui: {
    width: 300,
    height: 720,
    icon: Building2,
    advanced: ['windowCount', 'windowHeight', 'windowWidth', 'windowPosition', 'balconyRadius', 'balconyHeight', 'lanternRadius', 'lanternHeight']
  },
  execute: (inputs, parameters) => {
    // Get values from inputs (can come from UI or connections)
    const towerHeight = inputs.towerHeight || 20.0;
    const towerRadius = inputs.towerRadius || 3.0;
    const roofHeight = inputs.roofHeight || 4.0;
    const roofRadius = inputs.roofRadius || 2.5;
    const baseHeight = inputs.baseHeight || 2.0;
    const baseRadius = inputs.baseRadius || 4.0;
    const windowCount = inputs.windowCount || 4;
    const windowHeight = inputs.windowHeight || 1.5;
    const windowWidth = inputs.windowWidth || 0.8;
    const windowPosition = inputs.windowPosition || 0.6;
    const balconyRadius = inputs.balconyRadius || 3.5;
    const balconyHeight = inputs.balconyHeight || 0.3;
    const segments = inputs.segments || 16;
    const lanternRadius = inputs.lanternRadius || 1.5;
    const lanternHeight = inputs.lanternHeight || 2.0;

    // Create lighthouse geometry
    const geometry = createLighthouseGeometry({
      towerHeight,
      towerRadius,
      roofHeight,
      roofRadius,
      baseHeight,
      baseRadius,
      windowCount,
      windowHeight,
      windowWidth,
      windowPosition,
      balconyRadius,
      balconyHeight,
      segments,
      lanternRadius,
      lanternHeight
    });

    return { geometry };
  }
};

// Helper function to create lighthouse geometry
function createLighthouseGeometry(params: {
  towerHeight: number;
  towerRadius: number;
  roofHeight: number;
  roofRadius: number;
  baseHeight: number;
  baseRadius: number;
  windowCount: number;
  windowHeight: number;
  windowWidth: number;
  windowPosition: number;
  balconyRadius: number;
  balconyHeight: number;
  segments: number;
  lanternRadius: number;
  lanternHeight: number;
}): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const {
    towerHeight, towerRadius, roofHeight, roofRadius, baseHeight, baseRadius,
    windowCount, windowHeight, windowWidth, windowPosition, balconyRadius,
    balconyHeight, segments, lanternRadius, lanternHeight
  } = params;

  let vertexIndex = 0;

  // Helper function to add cylinder with proper caps
  const addCylinder = (height: number, radius: number, yOffset: number = 0, addCaps: boolean = true) => {
    const startIndex = vertexIndex;
    
    // Create vertices for cylinder sides
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Bottom ring
      vertices.push(x, yOffset, z);
      uvs.push(i / segments, 0);
      normals.push(x / radius, 0, z / radius);
      
      // Top ring
      vertices.push(x, yOffset + height, z);
      uvs.push(i / segments, 1);
      normals.push(x / radius, 0, z / radius);
    }
    
    // Create indices for cylinder sides
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    vertexIndex += (segments + 1) * 2;
    
    if (addCaps) {
      // Add bottom cap
      const bottomCenterIndex = vertexIndex;
      vertices.push(0, yOffset, 0);
      uvs.push(0.5, 0.5);
      normals.push(0, -1, 0);
      vertexIndex++;
      
      for (let i = 0; i < segments; i++) {
        const a = startIndex + i * 2;
        const b = startIndex + ((i + 1) % (segments + 1)) * 2;
        indices.push(bottomCenterIndex, b, a);
      }
      
      // Add top cap
      const topCenterIndex = vertexIndex;
      vertices.push(0, yOffset + height, 0);
      uvs.push(0.5, 0.5);
      normals.push(0, 1, 0);
      vertexIndex++;
      
      for (let i = 0; i < segments; i++) {
        const a = startIndex + i * 2 + 1;
        const b = startIndex + ((i + 1) % (segments + 1)) * 2 + 1;
        indices.push(topCenterIndex, a, b);
      }
    }
  };

  // Helper function to add cone with base cap
  const addCone = (height: number, radius: number, yOffset: number = 0) => {
    const startIndex = vertexIndex;
    
    // Create vertices for cone base ring
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Base ring
      vertices.push(x, yOffset, z);
      uvs.push(i / segments, 0);
      normals.push(x / radius, 0, z / radius);
    }
    
    // Top point
    vertices.push(0, yOffset + height, 0);
    uvs.push(0.5, 1);
    normals.push(0, 1, 0);
    
    // Create indices for cone sides
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i;
      const b = startIndex + ((i + 1) % (segments + 1));
      const c = startIndex + segments + 1; // Top point
      
      indices.push(a, b, c);
    }
    
    vertexIndex += segments + 2;
    
    // Add base cap
    const baseCenterIndex = vertexIndex;
    vertices.push(0, yOffset, 0);
    uvs.push(0.5, 0.5);
    normals.push(0, -1, 0);
    vertexIndex++;
    
    // Create base cap triangles
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i;
      const b = startIndex + ((i + 1) % (segments + 1));
      indices.push(baseCenterIndex, b, a);
    }
  };

  // Helper function to add ring (for balcony)
  const addRing = (radius: number, height: number, yOffset: number = 0) => {
    const startIndex = vertexIndex;
    
    // Create vertices for ring
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Bottom ring
      vertices.push(x, yOffset, z);
      uvs.push(i / segments, 0);
      normals.push(x / radius, 0, z / radius);
      
      // Top ring
      vertices.push(x, yOffset + height, z);
      uvs.push(i / segments, 1);
      normals.push(x / radius, 0, z / radius);
    }
    
    // Create indices for ring sides
    for (let i = 0; i < segments; i++) {
      const a = startIndex + i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    vertexIndex += (segments + 1) * 2;
  };

  // Helper function to add window
  const addWindow = (angle: number, yOffset: number) => {
    const windowDepth = 0.2;
    const startIndex = vertexIndex;
    
    // Window frame vertices
    const frameWidth = windowWidth + 0.2;
    const frameHeight = windowHeight + 0.2;
    
    for (let i = 0; i <= 4; i++) {
      for (let j = 0; j <= 4; j++) {
        const u = (i / 4) * frameWidth - frameWidth / 2;
        const v = (j / 4) * frameHeight - frameHeight / 2;
        
        const x = Math.cos(angle) * (towerRadius + u) - Math.sin(angle) * v;
        const y = yOffset + v;
        const z = Math.sin(angle) * (towerRadius + u) + Math.cos(angle) * v;
        
        vertices.push(x, y, z);
        uvs.push(i / 4, j / 4);
        normals.push(Math.cos(angle), 0, Math.sin(angle));
      }
    }
    
    // Create indices for window frame
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const a = startIndex + i * 5 + j;
        const b = a + 1;
        const c = a + 5;
        const d = a + 6;
        
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    vertexIndex += 25;
  };

  // Build lighthouse from bottom to top
  
  // 1. Base foundation (sealed cylinder)
  addCylinder(baseHeight, baseRadius, 0, true);
  
  // 2. Main tower (sealed cylinder)
  addCylinder(towerHeight, towerRadius, baseHeight, true);
  
  // 3. Add windows
  if (windowCount > 0) {
    const windowY = baseHeight + towerHeight * windowPosition;
    for (let i = 0; i < windowCount; i++) {
      const angle = (i / windowCount) * Math.PI * 2;
      addWindow(angle, windowY);
    }
  }
  
  // 4. Balcony (open ring - no caps)
  const balconyY = baseHeight + towerHeight - 0.5;
  addRing(balconyRadius, balconyHeight, balconyY);
  
  // 5. Lantern room (sealed cylinder)
  addCylinder(lanternHeight, lanternRadius, baseHeight + towerHeight, true);
  
  // 6. Roof (cone with sealed base)
  addCone(roofHeight, roofRadius, baseHeight + towerHeight + lanternHeight);

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  return geometry;
} 