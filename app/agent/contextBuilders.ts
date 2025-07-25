import { nodeRegistry } from '../registry/NodeRegistry';

/**
 * Builds a catalog of all available nodes with their descriptions, inputs, and outputs
 */
export function buildCatalog(): string {
  const allNodes = nodeRegistry.getAllDefinitions();
  const catalog = allNodes.map(node => ({
    id: node.type,
    name: node.name,
    description: node.description || 'No description available', // Safe fallback for missing description
    category: node.category,
    inputs: node.inputs.map(i => ({
      id: i.id,
      name: i.name,
      type: i.type,
      required: i.required || false,
      description: i.description || 'No description available'
    })),
    outputs: node.outputs.map(o => ({
      id: o.id,
      name: o.name,
      type: o.type,
      description: o.description || 'No description available'
    }))
  }));
  return JSON.stringify(catalog, null, 2);
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
 * Builds scene presets for the AI model
 */
export function buildScenePresets(): string {
  const presets = [
    {
      nodes: [
        {
          id: 'cube1',
          type: 'cube',
          position: { x: 100, y: 100 },
          data: {
            id: 'cube1',
            type: 'cube',
            label: 'Cube',
            parameters: { size: [2, 2, 2] },
            inputConnections: {},
            liveParameterValues: {}
          }
        },
        {
          id: 'output1',
          type: 'output',
          position: { x: 400, y: 100 },
          data: {
            id: 'output1',
            type: 'output',
            label: 'Output',
            parameters: {},
            inputConnections: { geometry: 'cube1.geometry' },
            liveParameterValues: {}
          }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'cube1',
          target: 'output1',
          sourceHandle: 'geometry',
          targetHandle: 'geometry'
        }
      ]
    }
  ];
  return JSON.stringify(presets, null, 2);
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

    case 'diff_scene':
      return `TASK: "diff_scene"
OLD_SCENE_JSON: ${JSON.stringify(task.old_scene_json, null, 2)}
CHANGE_REQUEST: "${task.change_request}"`;

    default:
      throw new Error(`Unknown task type: ${task.task}`);
  }
} 