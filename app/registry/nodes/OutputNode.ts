import { NodeDefinition } from '../../types/nodeSystem';
import { Download } from 'lucide-react';

// OUTPUT NODE - was 43+ lines, now 15 lines of data
export const outputNodeDefinition: NodeDefinition = {
  type: 'output',
  name: 'Output',
  description: 'Final geometry output for rendering',
  category: 'output',
  color: {
    primary: '#eab308',
    secondary: '#ca8a04'
  },

  inputs: [
    {
      id: 'geometry',
      name: 'Geometry',
      type: 'geometry',
      required: true,
      description: 'Final geometry to render'
    }
  ],
  outputs: [],
  parameters: [],
  ui: {
    width: 140,
    height: 80,
    icon: Download
  },
  execute: (inputs, parameters) => {
    // Output node just passes through the geometry
    // Handle both 'geometry' and 'geometry-in' input keys
    console.log('Output node inputs:', inputs);
    const geometry = inputs.geometry || inputs['geometry-in'] || inputs['geometry-out'];
    console.log('Output node geometry:', geometry);
    return { geometry: geometry };
  }
}; 