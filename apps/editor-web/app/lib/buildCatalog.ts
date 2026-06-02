import { nodeRegistry } from '../registry/NodeRegistry';

/**
 * Builds a comprehensive catalog of all available nodes with detailed information for AI scene generation
 */
export function buildCatalog(): string {
  const allNodes = nodeRegistry.getAllDefinitions();

  // Group nodes by category for better organization
  const nodesByCategory: Record<string, any[]> = {};

  const catalog = allNodes.map(node => {
    const category = node.category || 'utilities';

    const nodeInfo = {
      id: node.type,
      name: node.name,
      description: node.description || 'No description available',
      category,

      // Input details with connection patterns
      inputs: node.inputs.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        required: i.required || false,
        description: i.description || 'No description available',
        // Add handle name for connections
        handle: `${i.id}-in`
      })),

      // Output details with connection patterns
      outputs: node.outputs.map(o => ({
        id: o.id,
        name: o.name,
        type: o.type,
        description: o.description || 'No description available',
        // Add handle name for connections
        handle: `${o.id}-out`
      })),

      // Parameter details with defaults and types
      parameters: node.parameters?.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        defaultValue: p.defaultValue,
        description: p.description || 'No description available',
        // Add constraints if available
        min: p.min,
        max: p.max,
        step: p.step
      })) || [],

      // Usage patterns and common connections
      usagePatterns: getNodeUsagePatterns(node.type),

      // Common parameter values
      commonParameters: getCommonParameterValues(node.type)
    };

    // Group by category
    if (!nodesByCategory[category]) {
      nodesByCategory[category] = [];
    }
    nodesByCategory[category].push(nodeInfo);

    return nodeInfo;
  });

  // Create organized output with categories and usage examples
  const organizedCatalog = {
    summary: {
      totalNodes: catalog.length,
      categories: Object.keys(nodesByCategory),
      connectionTypes: ['geometry', 'material', 'number', 'vector', 'boolean', 'time']
    },

    nodesByCategory,

    // Common connection patterns
    connectionPatterns: {
      geometry_flow: "geometry-out → geometry-in (standard geometry processing)",
      material_application: "material-out → material-in (applying materials to geometry)",
      animation: "time-out → parameter inputs (for time-based animation)",
      transforms: "geometry-out → transform(geometry-in) → geometry-out (positioning/scaling)",
      joining: "geometry-out → join(geometryA-in), geometry-out → join(geometryB-in) → geometry-out",
      final_output: "geometry-out → output(geometry-in) (required final step)"
    },

    // Scene building guidelines
    scenePatterns: {
      minimal: ["geometry_node", "output"],
      basic: ["geometry_node", "material_node", "set-material", "output"],
      animated: ["time", "geometry_node", "transform", "output"],
      complex: ["time", "multiple_geometry_nodes", "materials", "transforms", "join", "output"]
    }
  };

  return JSON.stringify(organizedCatalog, null, 2);
}

/**
 * Get common usage patterns for specific node types
 */
function getNodeUsagePatterns(nodeType: string): string[] {
  const patterns: Record<string, string[]> = {
    'time': [
      'Connect to transform rotation for animation',
      'Connect to material properties for color animation',
      'Use with math nodes to create wave functions'
    ],
    'cube': [
      'Basic geometry → set-material → output',
      'Geometry → transform → output for positioning',
      'Multiple cubes → join → output for combinations'
    ],
    'sphere': [
      'Simple sphere → material → output',
      'Sphere → transform for positioning/scaling',
      'Multiple spheres with different materials → join'
    ],
    'cylinder': [
      'Cylinder → material → output',
      'Useful for pillars, trees, mechanical parts',
      'Can be transformed for various orientations'
    ],
    'transform': [
      'Any geometry → transform → further processing',
      'Essential for positioning, rotating, scaling',
      'Can be animated with time input'
    ],
    'set-material': [
      'geometry + material → set-material → output',
      'Required step to apply materials to geometry',
      'Place between geometry processing and output'
    ],
    'join': [
      'geometryA + geometryB → join → output',
      'Combines multiple geometries into one',
      'Can chain multiple joins for complex scenes'
    ],
    'output': [
      'Final destination for all geometry',
      'Required in every scene',
      'Should be the rightmost node'
    ],
    'standard-material': [
      'Basic PBR material with color, roughness, metalness',
      'Connect to set-material node',
      'Good for most general purposes'
    ],
    'water-material': [
      'Specialized material for water effects',
      'Best used with wave geometry nodes',
      'Creates realistic water appearance'
    ],
    'lighthouse': [
      'Complex architectural geometry',
      'Often combined with water and rocks',
      'Good for maritime scenes'
    ],
    'gesner-wave': [
      'Water surface with wave animation',
      'Connect time input for animation',
      'Combine with water-material'
    ]
  };

  return patterns[nodeType] || [`Used for ${nodeType} operations`];
}

/**
 * Get common parameter values for specific node types
 */
function getCommonParameterValues(nodeType: string): Record<string, any> {
  const commonValues: Record<string, Record<string, any>> = {
    'cube': {
      width: [1, 2, 5, 10],
      height: [1, 2, 5, 10],
      depth: [1, 2, 5, 10]
    },
    'sphere': {
      radius: [0.5, 1, 2, 5],
      segments: [16, 32, 64]
    },
    'cylinder': {
      radiusTop: [1, 2, 3],
      radiusBottom: [1, 2, 3],
      height: [2, 5, 10]
    },
    'transform': {
      position: [{x: 0, y: 0, z: 0}, {x: 5, y: 0, z: 0}, {x: 0, y: 5, z: 0}],
      scale: [{x: 1, y: 1, z: 1}, {x: 2, y: 2, z: 2}, {x: 1, y: 0.5, z: 1}]
    },
    'standard-material': {
      color: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'],
      roughness: [0.1, 0.3, 0.5, 0.7, 0.9],
      metalness: [0, 0.1, 0.5, 0.8, 1.0]
    },
    'time': {
      speed: [0.5, 1, 2, 5]
    }
  };

  return commonValues[nodeType] || {};
}
