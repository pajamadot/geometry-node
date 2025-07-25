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

/**
 * Builds JSON examples of node definitions for the AI model
 */
export function buildNodeExamples(): string {
  const cubeExample = {
    "type": "cube",
    "name": "Cube",
    "description": "Creates a cube geometry",
    "category": "geometry",
    "color": {
      "primary": "#4CAF50",
      "secondary": "#45a049"
    },
    "inputs": [],
    "outputs": [
      {
        "id": "geometry",
        "name": "Geometry", 
        "type": "geometry",
        "description": "Generated cube"
      }
    ],
    "parameters": [
      {
        "id": "size",
        "name": "Size",
        "type": "vector",
        "defaultValue": [1, 1, 1],
        "description": "Cube dimensions"
      }
    ],
    "executeCode": "const [width, height, depth] = parameters.size; const geometry = new THREE.BoxGeometry(width, height, depth); return { geometry };",
    "ui": {
      "width": 200,
      "icon": "box"
    },
    "version": "1.0.0",
    "author": "System",
    "created": new Date().toISOString(),
    "tags": ["geometry", "primitive"]
  };

  const transformExample = {
    "type": "transform",
    "name": "Transform",
    "description": "Transforms geometry with position, rotation, and scale",
    "category": "modifiers",
    "color": {
      "primary": "#FF9800",
      "secondary": "#f57c00"
    },
    "inputs": [
      {
        "id": "geometry",
        "name": "Geometry",
        "type": "geometry",
        "required": true,
        "description": "Input geometry to transform"
      }
    ],
    "outputs": [
      {
        "id": "geometry",
        "name": "Geometry",
        "type": "geometry",
        "description": "Transformed geometry"
      }
    ],
    "parameters": [
      {
        "id": "position",
        "name": "Position",
        "type": "vector",
        "defaultValue": [0, 0, 0],
        "description": "Position offset"
      },
      {
        "id": "rotation",
        "name": "Rotation",
        "type": "vector",
        "defaultValue": [0, 0, 0],
        "description": "Rotation in radians"
      },
      {
        "id": "scale",
        "name": "Scale",
        "type": "vector",
        "defaultValue": [1, 1, 1],
        "description": "Scale factor"
      }
    ],
    "executeCode": "const geometry = inputs.geometry.clone(); geometry.translate(...parameters.position); geometry.rotateX(parameters.rotation[0]); geometry.rotateY(parameters.rotation[1]); geometry.rotateZ(parameters.rotation[2]); geometry.scale(...parameters.scale); return { geometry };",
    "ui": {
      "width": 220,
      "icon": "move"
    },
    "version": "1.0.0",
    "author": "System",
    "created": new Date().toISOString(),
    "tags": ["transform", "modifier"]
  };

  const sphereExample = {
    "type": "sphere",
    "name": "Sphere",
    "description": "Creates a sphere geometry with customizable radius and detail",
    "category": "geometry",
    "color": {
      "primary": "#2196F3",
      "secondary": "#1976D2"
    },
    "inputs": [],
    "outputs": [
      {
        "id": "geometry",
        "name": "Geometry",
        "type": "geometry",
        "description": "Generated sphere"
      }
    ],
    "parameters": [
      {
        "id": "radius",
        "name": "Radius",
        "type": "number",
        "defaultValue": 1,
        "description": "Sphere radius"
      },
      {
        "id": "widthSegments",
        "name": "Width Segments",
        "type": "number",
        "defaultValue": 32,
        "description": "Number of horizontal segments"
      },
      {
        "id": "heightSegments",
        "name": "Height Segments",
        "type": "number",
        "defaultValue": 16,
        "description": "Number of vertical segments"
      }
    ],
    "executeCode": "const geometry = new THREE.SphereGeometry(parameters.radius, Math.max(3, Math.floor(parameters.widthSegments)), Math.max(2, Math.floor(parameters.heightSegments))); return { geometry };",
    "ui": {
      "width": 200,
      "icon": "sphere"
    },
    "version": "1.0.0",
    "author": "System",
    "created": new Date().toISOString(),
    "tags": ["geometry", "primitive", "sphere"]
  };

     return `IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:

${JSON.stringify(cubeExample, null, 2)}

ANOTHER EXAMPLE:

${JSON.stringify(transformExample, null, 2)}

THIRD EXAMPLE (with parameter validation):

${JSON.stringify(sphereExample, null, 2)}

EXECUTION CONTEXT:
Your executeCode runs with these variables available:
- inputs: Object containing input values (e.g., inputs.geometry, inputs.value1)
- parameters: Object containing parameter values (e.g., parameters.size, parameters.radius)
- Return an object with output names as keys (e.g., { geometry: myGeometry, value: myValue })

CRITICAL EXECUTION CONSTRAINTS:
Your executeCode MUST ONLY use these available functions and classes:

AVAILABLE THREE.JS CLASSES:
- THREE.BoxGeometry(width, height, depth)
- THREE.SphereGeometry(radius, widthSegments, heightSegments)
- THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
- THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
- THREE.RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments)
- THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
- THREE.ConeGeometry(radius, height, radialSegments)
- THREE.DodecahedronGeometry(radius, detail)
- THREE.IcosahedronGeometry(radius, detail)
- THREE.OctahedronGeometry(radius, detail)
- THREE.TetrahedronGeometry(radius, detail)
- THREE.LatheGeometry(points, segments)
- THREE.ExtrudeGeometry(shapes, extrudeSettings)
- THREE.ShapeGeometry(shapes)
- THREE.TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
- THREE.BufferGeometry()
- THREE.Vector3(x, y, z)
- THREE.Matrix4()
- THREE.Euler(x, y, z, order)
- THREE.Quaternion(x, y, z, w)
- THREE.Color(color)
- THREE.MeshBasicMaterial(parameters)
- THREE.MeshStandardMaterial(parameters)
- THREE.MeshLambertMaterial(parameters)
- THREE.MeshPhongMaterial(parameters)

AVAILABLE GEOMETRY METHODS:
- geometry.translate(x, y, z)
- geometry.rotateX(angle), geometry.rotateY(angle), geometry.rotateZ(angle)
- geometry.scale(x, y, z)
- geometry.clone()
- geometry.copy(otherGeometry)
- geometry.merge(geometry2)
- geometry.lookAt(vector)
- geometry.applyMatrix4(matrix)

AVAILABLE JAVASCRIPT:
- Math functions: Math.sin, Math.cos, Math.PI, Math.random, Math.floor, Math.ceil, etc.
- Array methods: map, filter, forEach, reduce, etc.
- Standard operators: +, -, *, /, %, etc.

FORBIDDEN - DO NOT USE:
- ThreeBSP (Boolean operations library)
- External libraries beyond THREE.js core
- CSG operations
- WebGL shaders
- External imports or requires
- Node.js specific functions
- Browser DOM APIs
- Async/await or Promises in executeCode

RULES:
1. Response must be ONLY valid JSON (no markdown, no explanations, no code blocks)
2. All field names and string values must use double quotes
3. executeCode must be a single line string containing ONLY the allowed JavaScript/THREE.js code above
4. Include all required fields: type, name, description, category, color, inputs, outputs, parameters, executeCode, ui, version, author, created, tags
5. Use appropriate icons: "box", "sphere", "code", "settings", "zap", "move", "rotate", etc.
6. Categories: "geometry", "modifiers", "inputs", "outputs", "math", "materials", "utilities"
7. Types: "geometry", "number", "vector", "boolean", "string", "material"
8. Test your executeCode mentally - ensure it only uses the allowed functions listed above`;
}

/**
 * Builds comprehensive scene examples for better AI guidance
 */
export function buildSceneExamples(): string {
  // Simple example scene
  const simpleExample = {
    nodes: [
      {
        id: 'cube-1',
        type: 'cube',
        position: { x: 100, y: 100 },
        data: {
          id: 'cube-1',
          type: 'cube',
          label: 'Basic Cube',
          parameters: { width: 2, height: 2, depth: 2 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'material-1',
        type: 'standard-material',
        position: { x: 400, y: 100 },
        data: {
          id: 'material-1',
          type: 'standard-material',
          label: 'Blue Material',
          parameters: { color: '#4CAF50', roughness: 0.5, metalness: 0.2 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'set-material-1',
        type: 'set-material',
        position: { x: 700, y: 100 },
        data: {
          id: 'set-material-1',
          type: 'set-material',
          label: 'Apply Material',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 1000, y: 100 },
        data: {
          id: 'output-1',
          type: 'output',
          label: 'Output',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      }
    ],
    edges: [
      {
        id: 'e-cube-setmaterial',
        source: 'cube-1',
        target: 'set-material-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in'
      },
      {
        id: 'e-material-setmaterial',
        source: 'material-1',
        target: 'set-material-1',
        sourceHandle: 'material-out',
        targetHandle: 'material-in'
      },
      {
        id: 'e-setmaterial-output',
        source: 'set-material-1',
        target: 'output-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in'
      }
    ]
  };

  // Complex animated example scene
  const animatedExample = {
    nodes: [
      {
        id: 'time-1',
        type: 'time',
        position: { x: 50, y: 100 },
        data: {
          id: 'time-1',
          type: 'time',
          label: 'Time',
          parameters: { speed: 1 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'sphere-1',
        type: 'sphere',
        position: { x: 300, y: 200 },
        data: {
          id: 'sphere-1',
          type: 'sphere',
          label: 'Animated Sphere',
          parameters: { radius: 1, segments: 32 },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'transform-1',
        type: 'transform',
        position: { x: 600, y: 200 },
        data: {
          id: 'transform-1',
          type: 'transform',
          label: 'Rotate Transform',
          parameters: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          inputConnections: {},
          liveParameterValues: {}
        }
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 900, y: 200 },
        data: {
          id: 'output-1',
          type: 'output',
          label: 'Output',
          parameters: {},
          inputConnections: {},
          liveParameterValues: {}
        }
      }
    ],
    edges: [
      {
        id: 'e-time-transform',
        source: 'time-1',
        target: 'transform-1',
        sourceHandle: 'time-out',
        targetHandle: 'rotation-in'
      },
      {
        id: 'e-sphere-transform',
        source: 'sphere-1',
        target: 'transform-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in'
      },
      {
        id: 'e-transform-output',
        source: 'transform-1',
        target: 'output-1',
        sourceHandle: 'geometry-out',
        targetHandle: 'geometry-in'
      }
    ]
  };

  return JSON.stringify({
    simple_scene: simpleExample,
    animated_scene: animatedExample
  }, null, 2);
}

/**
 * Builds enhanced scene generation guidelines
 */
export function buildSceneGenerationGuidelines(): string {
  return `
SCENE GENERATION GUIDELINES:

1. STRUCTURE REQUIREMENTS:
   - Every scene MUST have a "nodes" array and "edges" array
   - Every node MUST have: id, type, position {x, y}, data object
   - Every edge MUST have: id, source, target, sourceHandle, targetHandle
   - Node data MUST include: id, type, label, parameters, inputConnections, liveParameterValues

2. POSITIONING RULES:
   - Space nodes horizontally by ~300-400 pixels
   - Space nodes vertically by ~100-200 pixels for clarity
   - Start leftmost nodes around x: 50-100
   - Flow from left to right (inputs → processing → outputs)

3. CONNECTION PATTERNS (use the exact handle names from the catalog):
   - Geometry flow: geometry-out → geometry-in
   - Material application: material-out → material-in
   - Time animation: time-out → parameter inputs (rotation-in, position-in, etc.)
   - Multiple geometry joining: geometryA-in + geometryB-in → geometry-out
   - Final output: geometry-out → geometry-in (on output node)

4. REQUIRED SCENE STRUCTURE:
   - ALWAYS end with an output node (required)
   - Use set-material node to apply materials to geometry
   - Use transform nodes for positioning/rotating/scaling
   - Use join nodes to combine multiple geometries

5. PARAMETER BEST PRACTICES:
   - Use the commonParameters from the catalog for realistic values
   - Colors in hex format: "#4CAF50", "#2196F3", "#FF9800"
   - Positions/rotations as objects: {x: 0, y: 0, z: 0}
   - Reasonable sizes: 1-10 for most dimensions
   - Animation speeds: 0.5-2 for time nodes

6. SCENE COMPOSITION PATTERNS:
   
   MINIMAL SCENE:
   [geometry_node] → [output]
   
   BASIC SCENE:
   [geometry_node] → [set-material] ← [material_node]
                          ↓
                      [output]
   
   ANIMATED SCENE:
   [time] → [transform] ← [geometry_node]
               ↓
           [output]
   
   COMPLEX SCENE:
   [time] → [transform] ← [geometry_node_1] → [set-material] ← [material_1]
                                                   ↓
   [geometry_node_2] → [set-material] ← [material_2] → [join] → [output]
                           ↑                              ↑
                      [material_2]                  [other_geometry]

7. COMMON NODE COMBINATIONS:
   - Water scenes: time → gesner-wave → water-material → set-material → output
   - Architectural: lighthouse + standard-material → set-material → transform → join
   - Basic shapes: cube/sphere → standard-material → set-material → transform → output
   - Animations: time → multiple nodes with animated parameters

8. HANDLE NAMING CONVENTION:
   - Inputs: [parameter-name]-in (e.g., geometry-in, material-in, rotation-in)
   - Outputs: [parameter-name]-out (e.g., geometry-out, material-out, time-out)
   - Special cases: geometryA-in, geometryB-in for join nodes

9. SCENE VALIDATION CHECKLIST:
   ✓ Ends with output node
   ✓ All geometry has materials applied via set-material
   ✓ Proper handle connections (geometry-out → geometry-in)
   ✓ Reasonable parameter values
   ✓ Logical left-to-right flow
   ✓ Proper node spacing for readability

10. USE THE CATALOG:
    - Reference the nodesByCategory for available nodes in each category
    - Use usagePatterns for guidance on how to connect each node type
    - Use commonParameters for realistic parameter values
    - Follow connectionPatterns for proper data flow
`;
}

/**
 * Builds scene presets for the AI model
 */
export function buildScenePresets(): string {
  return buildSceneExamples(); // Use the enhanced examples
}

/**
 * Builds a prompt for a specific AI task
 */
export function buildPromptForTask(task: any): string {
  switch (task.task) {
    case 'create_node':
      let prompt = `TASK: "create_node"
BEHAVIOR: "${task.behavior}"

NODE_EXAMPLES:
${buildNodeExamples()}`;
      if (task.validator_report) {
        prompt += `\n\nVALIDATOR_REPORT:\n${task.validator_report}`;
      }
      return prompt;

    case 'plan_scene':
      return `TASK: "plan_scene"
SCENE_IDEA: "${task.scene_idea}"

CATALOG:
${buildCatalog()}`;

    case 'compose_scene':
      return `TASK: "compose_scene"
SELECTED_NODE_IDS: ${JSON.stringify(task.selected_node_ids)}

SCENE_PRESETS:
${buildScenePresets()}`;

    case 'generate_scene':
      return `TASK: "generate_scene"
SCENE_DESCRIPTION: "${task.scene_description}"

${buildSceneGenerationGuidelines()}

COMPREHENSIVE NODE CATALOG:
The following catalog contains ALL available nodes organized by category, with complete input/output information, usage patterns, and common parameter values. Use this as your primary reference for node selection and configuration.

${buildCatalog()}

SCENE_EXAMPLES:
Here are working examples of properly structured scenes:

${buildSceneExamples()}

CRITICAL INSTRUCTIONS:
1. Use ONLY nodes from the catalog above
2. Follow the exact handle naming convention (geometry-out → geometry-in, etc.)
3. Use the usagePatterns and commonParameters from the catalog for each node
4. Every scene MUST end with an output node
5. Apply materials using set-material nodes (geometry + material → set-material → output)
6. Use the connectionPatterns as your guide for data flow

RESPONSE FORMAT:
Return ONLY a valid JSON object with the complete scene structure. No explanations, no markdown formatting, just the raw JSON. The response should contain "nodes" and "edges" arrays following the exact structure shown in the examples.`;

    case 'diff_scene':
      return `TASK: "diff_scene"
OLD_SCENE_JSON: ${JSON.stringify(task.old_scene_json, null, 2)}
CHANGE_REQUEST: "${task.change_request}"`;

    case 'modify_node':
      return buildModifyNodePrompt(task);

    case 'modify_scene':
      return buildModifyScenePrompt(task);

    default:
      throw new Error(`Unknown task type: ${task.task}`);
  }
}

/**
 * Builds a prompt for modifying an existing node
 */
function buildModifyNodePrompt(request: any): string {
  return `TASK: "modify_node"
MODIFICATION_DESCRIPTION: "${request.modification_description}"

ORIGINAL_NODE_JSON:
${JSON.stringify(request.nodeData, null, 2)}

NODE_EXAMPLES:
${buildNodeExamples()}

MODIFICATION_INSTRUCTIONS:
You need to generate a diff patch that will modify the original node JSON according to the modification description.

The diff format must be:
<<<<<<< SEARCH
[exact content to find in the original JSON]
=======
[replacement content]
>>>>>>> REPLACE

RULES:
1. Generate a precise diff patch using the SEARCH/REPLACE format
2. The SEARCH section must match existing content exactly
3. Only modify what's necessary for the requested change
4. Maintain all required node structure (type, name, description, etc.)
5. Preserve proper JSON formatting and indentation
6. Keep executeCode valid JavaScript if modifying it
7. Ensure parameters, inputs, and outputs remain valid

RESPONSE FORMAT:
Return ONLY the diff patch using the SEARCH/REPLACE format. No explanations, no markdown, just the raw diff.`;
}

/**
 * Builds a prompt for modifying an existing scene
 */
function buildModifyScenePrompt(request: any): string {
  return `TASK: "modify_scene"
MODIFICATION_DESCRIPTION: "${request.modification_description}"

ORIGINAL_SCENE_JSON:
${JSON.stringify(request.sceneData, null, 2)}

COMPREHENSIVE NODE CATALOG:
The following catalog contains ALL available nodes organized by category, with complete input/output information, usage patterns, and common parameter values. Use this as your primary reference for node selection and configuration.

${buildCatalog()}

SCENE_GENERATION_GUIDELINES:
${buildSceneGenerationGuidelines()}

MODIFICATION_INSTRUCTIONS:
Analyze the original scene and the modification description, then generate a complete modified scene JSON that incorporates the requested changes.

MODIFICATION RULES:
1. Start with the original scene structure
2. Apply the requested modifications while preserving what should remain unchanged
3. Maintain proper scene structure (nodes and edges arrays)
4. Use only nodes from the catalog above
5. Follow proper handle naming conventions for new connections
6. Ensure all edges reference valid node IDs and handles
7. Generate new unique IDs for any new nodes you add
8. Preserve existing node IDs unless they need to be removed
9. Update positions appropriately for new nodes

CRITICAL INSTRUCTIONS:
1. Use ONLY nodes from the catalog above
2. Follow the exact handle naming convention (geometry-out → geometry-in, etc.)
3. Use the usagePatterns and commonParameters from the catalog for each node
4. Every scene MUST end with an output node
5. Apply materials using set-material nodes (geometry + material → set-material → output)
6. Use the connectionPatterns as your guide for data flow

RESPONSE FORMAT:
Return ONLY a valid JSON object with the complete modified scene structure. No explanations, no markdown formatting, just the raw JSON. The response should contain "nodes" and "edges" arrays following the exact structure of the original scene.`;
}