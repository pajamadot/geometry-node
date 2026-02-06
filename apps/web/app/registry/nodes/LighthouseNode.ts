import * as pc from 'playcanvas';
import { NodeDefinition } from '../../types/nodes';
import { Building2 } from 'lucide-react';
import { EnhancedGeometryData } from '../../utils/builders/GeometryBuilder';
import { VertexDataUtils } from '../../utils/builders/VertexDataUtils';
import { CylinderBuilder } from '../../utils/builders/primitives/CylinderBuilder';
import { ConeBuilder } from '../../utils/builders/primitives/ConeBuilder';

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
    // ... same inputs as before ...
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

    // Build lighthouse from bottom to top
    const parts: EnhancedGeometryData[] = [];
    
    // 1. Base foundation (sealed cylinder)
    const base = CylinderBuilder.create({ 
      height: baseHeight, 
      radiusTop: baseRadius, 
      radiusBottom: baseRadius,
      radialSegments: segments 
    });
    parts.push(VertexDataUtils.translate(base, 0, baseHeight/2, 0));
    
    // 2. Main tower (sealed cylinder)
    const tower = CylinderBuilder.create({ 
      height: towerHeight, 
      radiusTop: towerRadius * 0.8, // Slight taper
      radiusBottom: towerRadius,
      radialSegments: segments 
    });
    parts.push(VertexDataUtils.translate(tower, 0, baseHeight + towerHeight/2, 0));
    
    // 4. Balcony (cylinder)
    const balcony = CylinderBuilder.create({ 
        height: balconyHeight, 
        radiusTop: balconyRadius, 
        radiusBottom: balconyRadius,
        radialSegments: segments
    });
    const balconyY = baseHeight + towerHeight;
    parts.push(VertexDataUtils.translate(balcony, 0, balconyY, 0));
    
    // 5. Lantern room
    const lantern = CylinderBuilder.create({
        height: lanternHeight,
        radiusTop: lanternRadius,
        radiusBottom: lanternRadius,
        radialSegments: segments
    });
    parts.push(VertexDataUtils.translate(lantern, 0, balconyY + lanternHeight/2, 0));
    
    // 6. Roof (cone)
    const roof = ConeBuilder.create({
        height: roofHeight,
        radius: roofRadius,
        radialSegments: segments
    });
    parts.push(VertexDataUtils.translate(roof, 0, balconyY + lanternHeight + roofHeight/2, 0));

    // Merge all parts
    const geometry = VertexDataUtils.merge(parts);
    
    // Compute vertex normals
    const result = VertexDataUtils.computeNormals(geometry);

    return { geometry: result };
  }
};
