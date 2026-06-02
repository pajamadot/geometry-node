import { JsonNodeCollection } from '../types/jsonNodes';
import {
  // Geometry Nodes
  mandelbrotSurfaceNode,
  twistDeformNode,
  voronoiSurfaceNode,
  kleinBottleNode,
  perlinTerrainNode,
  crystalGrowthNode,
  // Material Nodes
  holographicMaterialNode,
  lavaMaterialNode,
  matrixRainMaterialNode,
  portalMaterialNode,
  neonGlowMaterialNode
} from './nodes'; // Import from the new index file

// Server-side node definitions
// In a real application, this would come from a database
export const SERVER_NODE_DEFINITIONS: JsonNodeCollection = {
  version: '1.0.0',
  created: '2024-01-01T00:00:00.000Z',
  modified: new Date().toISOString(),
  nodes: [
    // Geometry Nodes
    mandelbrotSurfaceNode,
    twistDeformNode,
    voronoiSurfaceNode,
    kleinBottleNode,
    perlinTerrainNode,
    crystalGrowthNode,

    // Material Nodes
    holographicMaterialNode,
    lavaMaterialNode,
    matrixRainMaterialNode,
    portalMaterialNode,
    neonGlowMaterialNode
  ]
}; 