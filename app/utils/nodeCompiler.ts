import * as THREE from 'three';
import { Node, Edge } from 'reactflow';
import { 
  GeometryNodeData, 
  PrimitiveNodeData, 
  TransformNodeData, 
  OutputNodeData,
  JoinNodeData,
  ParametricSurfaceNodeData,
  TimeNodeData,
  NodeExecutionResult,
  GraphCompilationResult
} from '../types/nodes';
import { GeometryData, CompiledGeometry, PrimitiveParams } from '../types/geometry';

// Create Three.js parametric surface
function createParametricSurface(data: ParametricSurfaceNodeData): THREE.BufferGeometry {
  const { uFunction, vFunction, zFunction, uMin, uMax, vMin, vMax, uSegments, vSegments } = data;
  
  try {
    // Create a safe function evaluator
    const createFunction = (funcStr: string) => {
      // Sanitize the function string - only allow basic math operations
      const sanitized = funcStr.replace(/[^a-zA-Z0-9\s\+\-\*\/\(\)\.\,\;]/g, '');
      
      // Create function with access to Math object and parameters u, v
      return new Function('u', 'v', 'Math', `
        "use strict";
        try {
          return ${sanitized};
        } catch (e) {
          return 0; // Return 0 if function evaluation fails
        }
      `);
    };
    
    const xFunc = createFunction(uFunction);
    const yFunc = createFunction(vFunction);
    const zFunc = createFunction(zFunction);
    
    // Define the parametric function for Three.js
    const parametricFunction = (u: number, v: number, target: THREE.Vector3) => {
      // Map parameters to the specified ranges
      const mappedU = uMin + (uMax - uMin) * u;
      const mappedV = vMin + (vMax - vMin) * v;
      
      // Evaluate the user-defined functions
      const x = xFunc(mappedU, mappedV, Math);
      const y = yFunc(mappedU, mappedV, Math);
      const z = zFunc(mappedU, mappedV, Math);
      
      target.set(
        typeof x === 'number' && !isNaN(x) ? x : 0,
        typeof y === 'number' && !isNaN(y) ? y : 0,
        typeof z === 'number' && !isNaN(z) ? z : 0
      );
    };
    
    // Create the parametric geometry manually since ParametricGeometry might not be available in all versions
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    // Generate vertices
    for (let v = 0; v <= vSegments; v++) {
      for (let u = 0; u <= uSegments; u++) {
        const normalizedU = u / uSegments;
        const normalizedV = v / vSegments;
        
        const vector = new THREE.Vector3();
        parametricFunction(normalizedU, normalizedV, vector);
        
        vertices.push(vector.x, vector.y, vector.z);
        uvs.push(normalizedU, normalizedV);
      }
    }
    
    // Generate indices
    for (let v = 0; v < vSegments; v++) {
      for (let u = 0; u < uSegments; u++) {
        const a = v * (uSegments + 1) + u;
        const b = v * (uSegments + 1) + u + 1;
        const c = (v + 1) * (uSegments + 1) + u + 1;
        const d = (v + 1) * (uSegments + 1) + u;
        
        // Two triangles per quad
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    // Set the geometry attributes
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    
    return geometry;
    
  } catch (error) {
    console.warn('Error creating parametric surface:', error);
    // Return a fallback geometry
    return new THREE.PlaneGeometry(1, 1, 10, 10);
  }
}

// Create Three.js geometry from primitive parameters
function createPrimitiveGeometry(data: PrimitiveNodeData): THREE.BufferGeometry {
  const { primitiveType, parameters } = data;

  switch (primitiveType) {
    case 'cube':
      const cubeParams = parameters as PrimitiveParams['cube'];
      return new THREE.BoxGeometry(
        cubeParams.width,
        cubeParams.height,
        cubeParams.depth,
        cubeParams.widthSegments,
        cubeParams.heightSegments,
        cubeParams.depthSegments
      );

    case 'sphere':
      const sphereParams = parameters as PrimitiveParams['sphere'];
      return new THREE.SphereGeometry(
        sphereParams.radius,
        sphereParams.widthSegments || 32,
        sphereParams.heightSegments || 16
      );

    case 'cylinder':
      const cylinderParams = parameters as PrimitiveParams['cylinder'];
      return new THREE.CylinderGeometry(
        cylinderParams.radiusTop,
        cylinderParams.radiusBottom,
        cylinderParams.height,
        cylinderParams.radialSegments || 32,
        cylinderParams.heightSegments || 1
      );

    case 'plane':
      const planeParams = parameters as PrimitiveParams['plane'];
      return new THREE.PlaneGeometry(
        planeParams.width,
        planeParams.height,
        planeParams.widthSegments,
        planeParams.heightSegments
      );

    case 'cone':
      const coneParams = parameters as PrimitiveParams['cone'];
      return new THREE.ConeGeometry(
        coneParams.radius,
        coneParams.height,
        coneParams.radialSegments || 32,
        coneParams.heightSegments || 1
      );

    case 'torus':
      const torusParams = parameters as PrimitiveParams['torus'];
      return new THREE.TorusGeometry(
        torusParams.radius,
        torusParams.tube,
        torusParams.radialSegments || 16,
        torusParams.tubularSegments || 100
      );

    default:
      console.warn(`Unknown primitive type: ${primitiveType}`);
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

// Evaluate time node output
function evaluateTimeNode(data: TimeNodeData, currentTime: number, frameRate: number): number {
  const { timeMode, outputType, frequency, amplitude, offset, phase } = data;
  
  const timeValue = timeMode === 'frames' ? currentTime * frameRate : currentTime;
  const scaledTime = (timeValue * frequency) + phase;
  
  let rawValue = 0;
  switch (outputType) {
    case 'raw':
      rawValue = timeValue;
      break;
    case 'sin':
      rawValue = Math.sin(scaledTime);
      break;
    case 'cos':
      rawValue = Math.cos(scaledTime);
      break;
    case 'sawtooth':
      rawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5));
      break;
    case 'triangle':
      const sawValue = 2 * (scaledTime / (2 * Math.PI) - Math.floor(scaledTime / (2 * Math.PI) + 0.5));
      rawValue = 2 * Math.abs(sawValue) - 1;
      break;
    case 'square':
      rawValue = Math.sin(scaledTime) >= 0 ? 1 : -1;
      break;
    default:
      rawValue = timeValue;
  }
  
  return (rawValue * amplitude) + offset;
}

// Blender-inspired geometry node functions
function distributePointsOnMesh(geometry: THREE.BufferGeometry, data: any): THREE.Vector3[] {
  const { distributeMethod, density, seed } = data;
  const points: THREE.Vector3[] = [];
  
  // Simple random distribution on mesh surface
  const positionAttribute = geometry.attributes.position;
  const indexAttribute = geometry.index;
  
  if (!positionAttribute) return points;
  
  // Create deterministic random number generator
  const rng = new SeededRandom(seed);
  
  const numPoints = Math.floor(density);
  
  for (let i = 0; i < numPoints; i++) {
    if (indexAttribute) {
      // Pick random triangle
      const triangleIndex = Math.floor(rng.random() * (indexAttribute.count / 3)) * 3;
      const a = indexAttribute.getX(triangleIndex);
      const b = indexAttribute.getX(triangleIndex + 1);
      const c = indexAttribute.getX(triangleIndex + 2);
      
      // Get triangle vertices
      const vA = new THREE.Vector3().fromBufferAttribute(positionAttribute, a);
      const vB = new THREE.Vector3().fromBufferAttribute(positionAttribute, b);
      const vC = new THREE.Vector3().fromBufferAttribute(positionAttribute, c);
      
      // Random point on triangle using barycentric coordinates
      const r1 = rng.random();
      const r2 = rng.random();
      const sqrt_r1 = Math.sqrt(r1);
      const u = 1 - sqrt_r1;
      const v = r2 * sqrt_r1;
      const w = 1 - u - v;
      
      const point = new THREE.Vector3()
        .addScaledVector(vA, u)
        .addScaledVector(vB, v)
        .addScaledVector(vC, w);
      
      points.push(point);
    } else {
      // No indices, pick random vertex
      const vertexIndex = Math.floor(rng.random() * (positionAttribute.count));
      const point = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex);
      points.push(point);
    }
  }
  
  return points;
}

function createInstancesAtPoints(points: THREE.Vector3[], instanceGeometry: THREE.BufferGeometry, data: any): THREE.BufferGeometry {
  // For now, create a simple merged geometry of instances
  // In a more sophisticated system, this would use InstancedMesh
  const { rotation, scale } = data;
  
  const geometries: THREE.BufferGeometry[] = [];
  
  points.forEach((point) => {
    const instanceClone = instanceGeometry.clone();
    
    // Apply transformation
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation.x, rotation.y, rotation.z)
    );
    matrix.compose(
      point,
      quaternion,
      new THREE.Vector3(scale.x, scale.y, scale.z)
    );
    
    instanceClone.applyMatrix4(matrix);
    geometries.push(instanceClone);
  });
  
  // Merge all instances into single geometry
  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }
  
  // Simple merge - in production, use THREE.BufferGeometryUtils.mergeGeometries
  return geometries[0]; // For now, just return first instance
}

function subdivideMesh(geometry: THREE.BufferGeometry, level: number): THREE.BufferGeometry {
  // Basic subdivision - in a real implementation, this would use proper subdivision algorithms
  if (level <= 0) return geometry.clone();
  
  // For now, just return the original geometry
  // In a full implementation, this would use algorithms like Catmull-Clark or Loop subdivision
  console.warn('Subdivision not fully implemented yet - returning original geometry');
  return geometry.clone();
}

// Simple seeded random number generator
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Create Three.js BufferGeometry from raw vertices and faces
function createGeometryFromVerticesAndFaces(
  vertices: Array<{ x: number; y: number; z: number }>,
  faces: Array<{ a: number; b: number; c: number; d?: number }>,
  options: { computeNormals: boolean; generateUVs: boolean }
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Convert vertices to flat array
  const positions: number[] = [];
  const indices: number[] = [];
  
  // Add all vertices
  vertices.forEach(vertex => {
    positions.push(vertex.x, vertex.y, vertex.z);
  });
  
  // Convert faces to indices (triangulate quads)
  faces.forEach(face => {
    if (face.d !== undefined) {
      // Quad - split into two triangles
      indices.push(face.a, face.b, face.c);
      indices.push(face.a, face.c, face.d);
    } else {
      // Triangle
      indices.push(face.a, face.b, face.c);
    }
  });
  
  // Set position attribute
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  // Set index attribute
  geometry.setIndex(indices);
  
  // Compute normals if requested
  if (options.computeNormals) {
    geometry.computeVertexNormals();
  }
  
  // Generate basic UVs if requested
  if (options.generateUVs) {
    const uvs: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      // Simple planar UV mapping (project XY coordinates)
      const vertex = vertices[i];
      uvs.push(
        (vertex.x + 1) * 0.5, // Map from [-1,1] to [0,1]
        (vertex.y + 1) * 0.5
      );
    }
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  
  return geometry;
}

// Execute a single node
function executeNode(
  node: Node<GeometryNodeData>,
  inputs: Record<string, any>,
  cache: Map<string, any>,
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
): NodeExecutionResult {
  try {
    const { data } = node;
    
    // Check cache first (skip for time-dependent nodes)
    if (data.type !== 'time') {
      const cachedResult = getCachedNodeResult(node.id, inputs, data);
      if (cachedResult) {
        if (addLog) {
          addLog('debug', `Cache hit for node: ${data.label || data.type}`, { 
            nodeId: node.id,
            nodeType: data.type 
          }, 'caching');
        }
        return cachedResult;
      }
    }
    
    switch (data.type) {
      case 'primitive':
        const primitiveData = data as PrimitiveNodeData;
        
        // Apply parameter inputs if connected
        let finalParameters = primitiveData.parameters;
        if (inputs.parameters) {
          finalParameters = { ...primitiveData.parameters } as any;
          
          // Override parameters with connected values
          Object.keys(inputs.parameters).forEach(paramKey => {
            if (inputs.parameters[paramKey] !== undefined) {
              (finalParameters as any)[paramKey] = inputs.parameters[paramKey];
            }
          });
        }
        
        const modifiedPrimitiveData = {
          ...primitiveData,
          parameters: finalParameters
        };
        
        console.log('🔧 Creating primitive geometry with parameters:', finalParameters);
        
        // Create geometry fresh every time to ensure updates are reflected
        // Caching can be added later if performance becomes an issue
        const geometry = createPrimitiveGeometry(modifiedPrimitiveData);
        
        if (addLog) {
          addLog('success', 'Primitive geometry created successfully', {
            geometryType: geometry.type,
            isBufferGeometry: geometry.isBufferGeometry,
            vertexCount: geometry.attributes.position?.count || 0
          }, 'node-execution');
        }
        
        const outputs = {
          'geometry-out': geometry
        };
        
        return {
          success: true,
          outputs: outputs
        };

      case 'parametric':
        const parametricData = data as ParametricSurfaceNodeData;
        // Always create fresh parametric surface to ensure parameter changes are reflected
        const parametricGeometry = createParametricSurface(parametricData);
        return {
          success: true,
          outputs: {
            'geometry-out': parametricGeometry
          }
        };

      case 'time':
        const timeData = data as TimeNodeData;
        const timeValue = evaluateTimeNode(timeData, currentTime, frameRate);
        
        if (addLog) {
          addLog('debug', `Time node output: ${timeValue.toFixed(3)} at time ${currentTime.toFixed(3)}`, {
            timeValue,
            currentTime,
            outputType: timeData.outputType,
            frequency: timeData.frequency
          }, 'time-node');
        }
        
        return {
          success: true,
          outputs: {
            'time-out': timeValue
          }
        };

      case 'transform':
        const transformData = data as TransformNodeData;
        if (addLog) {
          addLog('debug', 'Transform node processing inputs', {
            inputKeys: Object.keys(inputs),
            hasGeometryIn: 'geometry-in' in inputs,
            geometryInValue: inputs['geometry-in'],
            geometryInType: typeof inputs['geometry-in']
          }, 'node-execution');
        }
        
        const inputGeometry = inputs['geometry-in'] as THREE.BufferGeometry;
        
        if (!inputGeometry) {
          const errorMsg = `Transform node requires geometry input. Available inputs: [${Object.keys(inputs).join(', ')}]. Expected 'geometry-in' but got: ${inputs['geometry-in']}`;
          const errorDetails = {
            availableInputs: Object.keys(inputs),
            geometryInValue: inputs['geometry-in'],
            expectedInput: 'geometry-in'
          };
          
          if (addLog) {
            addLog('error', errorMsg, errorDetails, 'node-execution');
          } else {
            console.error(`❌ TRANSFORM FAILED - Missing geometry input`);
            console.error(`❌ All inputs:`, Object.keys(inputs));
            console.error(`❌ geometry-in:`, inputs['geometry-in']);
          }
          
          // Try to find any geometry in inputs
          const anyGeometry = Object.values(inputs).find(val => val && val.isBufferGeometry);
          if (anyGeometry) {
            const warnMsg = 'Found geometry in inputs but not at expected handle';
            if (addLog) {
              addLog('warning', warnMsg, { foundGeometry: anyGeometry }, 'node-execution');
            } else {
              console.warn(`⚠️ Found geometry in inputs but not at 'geometry-in':`, anyGeometry);
            }
          }
          
          return {
            success: false,
            outputs: {},
            error: errorMsg
          };
        }

        // Clone the geometry and apply transform
        const transformedGeometry = inputGeometry.clone();
        let { position, rotation, scale } = transformData.transform;
        
        // Apply parameter inputs if connected
        if (inputs.parameters) {
          // Handle individual component overrides
          position = {
            x: inputs.parameters['position-x'] !== undefined ? inputs.parameters['position-x'] : position.x,
            y: inputs.parameters['position-y'] !== undefined ? inputs.parameters['position-y'] : position.y,
            z: inputs.parameters['position-z'] !== undefined ? inputs.parameters['position-z'] : position.z,
          };
          
          rotation = {
            x: inputs.parameters['rotation-x'] !== undefined ? inputs.parameters['rotation-x'] : rotation.x,
            y: inputs.parameters['rotation-y'] !== undefined ? inputs.parameters['rotation-y'] : rotation.y,
            z: inputs.parameters['rotation-z'] !== undefined ? inputs.parameters['rotation-z'] : rotation.z,
          };
          
          scale = {
            x: inputs.parameters['scale-x'] !== undefined ? inputs.parameters['scale-x'] : scale.x,
            y: inputs.parameters['scale-y'] !== undefined ? inputs.parameters['scale-y'] : scale.y,
            z: inputs.parameters['scale-z'] !== undefined ? inputs.parameters['scale-z'] : scale.z,
          };
        }
        
        // Apply transformations via matrix
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation.x, rotation.y, rotation.z)
        );
        matrix.compose(
          new THREE.Vector3(position.x, position.y, position.z),
          quaternion,
          new THREE.Vector3(scale.x, scale.y, scale.z)
        );
        
        transformedGeometry.applyMatrix4(matrix);
        
        return {
          success: true,
          outputs: {
            'geometry-out': transformedGeometry
          }
        };

            case 'join':
        const joinData = data as JoinNodeData;
        const geometries: THREE.BufferGeometry[] = [];
        
        // Collect all geometry inputs
        ['geometry-in-1', 'geometry-in-2', 'geometry-in-3'].forEach(inputId => {
          const geom = inputs[inputId] as THREE.BufferGeometry;
          if (geom) geometries.push(geom);
        });

        if (geometries.length === 0) {
          return {
            success: false,
            outputs: {},
            error: 'Join node requires at least one geometry input'
          };
        }

        // For now, just merge geometries by combining their vertices
        // In a more sophisticated system, this would handle different join operations
        let joinedGeometry: THREE.BufferGeometry;
        
        if (geometries.length === 1) {
          joinedGeometry = geometries[0].clone();
        } else {
          // Simple merge - just use the first geometry for now
          // TODO: Implement proper geometry merging based on operation type
          joinedGeometry = geometries[0].clone();
          
          // For multiple geometries, we'd need more sophisticated merging
          // This is a simplified implementation
        }

        return {
          success: true,
          outputs: {
            'geometry-out': joinedGeometry
          }
        };

      case 'distribute-points':
        const distributeData = data as any; // DistributePointsNodeData
        const inputMesh = inputs['geometry-in'] as THREE.BufferGeometry;
        
        if (!inputMesh) {
          return {
            success: false,
            outputs: {},
            error: 'Distribute Points node requires geometry input'
          };
        }

        // Create points distributed on the mesh surface
        const points = distributePointsOnMesh(inputMesh, distributeData);
        
        return {
          success: true,
          outputs: {
            'points-out': points
          }
        };

      case 'instance-on-points':
        const instanceData = data as any; // InstanceOnPointsNodeData
        const pointsInput = inputs['points-in'];
        const instanceGeometry = inputs['instance-in'] as THREE.BufferGeometry;
        
        if (!pointsInput || !instanceGeometry) {
          return {
            success: false,
            outputs: {},
            error: 'Instance on Points node requires both points and instance geometry'
          };
        }

        // Create instances at point locations
        const instances = createInstancesAtPoints(pointsInput, instanceGeometry, instanceData);
        
        return {
          success: true,
          outputs: {
            'instances-out': instances
          }
        };

      case 'subdivide-mesh':
        const subdivideData = data as any; // SubdivideMeshNodeData
        const meshToSubdivide = inputs['geometry-in'] as THREE.BufferGeometry;
        
        if (!meshToSubdivide) {
          return {
            success: false,
            outputs: {},
            error: 'Subdivide Mesh node requires geometry input'
          };
        }

        // Apply subdivision
        const subdividedMesh = subdivideMesh(meshToSubdivide, subdivideData.level);
        
        return {
          success: true,
          outputs: {
            'geometry-out': subdividedMesh
          }
        };

      case 'create-vertices':
        const vertexData = data as any; // CreateVerticesNodeData
        
        // Output the vertex array for use by other nodes
        return {
          success: true,
          outputs: {
            'vertices-out': vertexData.vertices
          }
        };

      case 'create-faces':
        const faceData = data as any; // CreateFacesNodeData
        
        // Output the face array for use by other nodes
        return {
          success: true,
          outputs: {
            'faces-out': faceData.faces
          }
        };

      case 'merge-geometry':
        const mergeData = data as any; // MergeGeometryNodeData
        const verticesInput = inputs['vertices-in'];
        const facesInput = inputs['faces-in'];
        
        if (!verticesInput || !facesInput) {
          return {
            success: false,
            outputs: {},
            error: 'Merge Geometry node requires both vertices and faces input'
          };
        }

        // Create Three.js BufferGeometry from vertices and faces
        const mergedGeometry = createGeometryFromVerticesAndFaces(
          verticesInput as Array<{ x: number; y: number; z: number }>,
          facesInput as Array<{ a: number; b: number; c: number; d?: number }>,
          mergeData
        );
        
        return {
          success: true,
          outputs: {
            'geometry-out': mergedGeometry
          }
        };

      case 'output':
        const outputGeometry = inputs['geometry-in'] as THREE.BufferGeometry;
        return {
          success: true,
          outputs: {
            result: outputGeometry
          }
        };

      default:
         return {
           success: false,
           outputs: {},
           error: `Unknown node type: ${data.type}`
         };
     }
   } catch (error) {
     return {
       success: false,
       outputs: {},
       error: `Node execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
     };
   }
}

// Wrapper function that handles caching
function executeNodeWithCaching(
  node: Node<GeometryNodeData>,
  inputs: Record<string, any>,
  cache: Map<string, any>,
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
): NodeExecutionResult {
  const result = executeNode(node, inputs, cache, currentTime, frameRate, addLog);
  
  // Cache successful results (skip time-dependent nodes)
  if (result.success && node.data.type !== 'time') {
    cacheNodeResult(node.id, inputs, node.data, result.outputs);
    if (addLog) {
      addLog('debug', `Cached result for node: ${node.data.label || node.data.type}`, { 
        nodeId: node.id,
        nodeType: node.data.type 
      }, 'caching');
    }
  }
  
  return result;
}

// Enhanced caching system for node results
interface NodeCacheEntry {
  inputs: Record<string, any>;
  inputsHash: string;
  outputs: Record<string, any>;
  timestamp: number;
}

const nodeResultCache = new Map<string, NodeCacheEntry>();
const maxNodeCacheSize = 100;

// Generate hash for node inputs to detect changes
function generateInputsHash(inputs: Record<string, any>, nodeData: GeometryNodeData): string {
  // Include both inputs and node data in hash
  const inputsStr = JSON.stringify(inputs, (key, value) => {
    // Handle THREE.js objects specially
    if (value && value.isBufferGeometry) {
      return `BufferGeometry:${value.uuid}:${value.attributes.position?.count || 0}`;
    }
    if (value && value.isVector3) {
      return `Vector3:${value.x},${value.y},${value.z}`;
    }
    return value;
  });
  
  const nodeDataStr = JSON.stringify(nodeData);
  return `${inputsStr}::${nodeDataStr}`;
}

// Check if node result can be retrieved from cache
function getCachedNodeResult(nodeId: string, inputs: Record<string, any>, nodeData: GeometryNodeData): NodeExecutionResult | null {
  const cacheEntry = nodeResultCache.get(nodeId);
  if (!cacheEntry) return null;
  
  const currentHash = generateInputsHash(inputs, nodeData);
  if (cacheEntry.inputsHash !== currentHash) return null;
  
  // Cache hit - return cloned outputs to prevent mutation
  return {
    success: true,
    outputs: cloneOutputs(cacheEntry.outputs)
  };
}

// Cache node result
function cacheNodeResult(nodeId: string, inputs: Record<string, any>, nodeData: GeometryNodeData, outputs: Record<string, any>) {
  const inputsHash = generateInputsHash(inputs, nodeData);
  
  nodeResultCache.set(nodeId, {
    inputs: deepClone(inputs),
    inputsHash,
    outputs: cloneOutputs(outputs),
    timestamp: Date.now()
  });
  
  // Clean up old cache entries
  if (nodeResultCache.size > maxNodeCacheSize) {
    const entries = Array.from(nodeResultCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, nodeResultCache.size - maxNodeCacheSize);
    toRemove.forEach(([key, entry]) => {
      // Dispose geometries in cache
      Object.values(entry.outputs).forEach(output => {
        if (output && output.dispose && typeof output.dispose === 'function') {
          output.dispose();
        }
      });
      nodeResultCache.delete(key);
    });
  }
}

// Deep clone utility for cache
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

// Clone outputs for cache (especially THREE.js geometries)
function cloneOutputs(outputs: Record<string, any>): Record<string, any> {
  const cloned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(outputs)) {
    if (value && value.isBufferGeometry) {
      // Clone THREE.js geometry
      cloned[key] = value.clone();
    } else if (value && value.isVector3) {
      // Clone THREE.js vector
      cloned[key] = value.clone();
    } else if (Array.isArray(value)) {
      // Clone arrays
      cloned[key] = [...value];
    } else if (typeof value === 'object' && value !== null) {
      // Deep clone objects
      cloned[key] = deepClone(value);
    } else {
      // Primitive values
      cloned[key] = value;
    }
  }
  
  return cloned;
}

// Clear cache for specific node (useful when node is deleted or disabled)
export function clearNodeCache(nodeId?: string) {
  if (nodeId) {
    const entry = nodeResultCache.get(nodeId);
    if (entry) {
      Object.values(entry.outputs).forEach(output => {
        if (output && output.dispose && typeof output.dispose === 'function') {
          output.dispose();
        }
      });
      nodeResultCache.delete(nodeId);
    }
  } else {
    // Clear all cache
    nodeResultCache.forEach(entry => {
      Object.values(entry.outputs).forEach(output => {
        if (output && output.dispose && typeof output.dispose === 'function') {
          output.dispose();
        }
      });
    });
    nodeResultCache.clear();
  }
}

// Find nodes with no dependencies (starting points)
function findStartNodes(nodes: Node<GeometryNodeData>[], edges: Edge[]): Node<GeometryNodeData>[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  const targetNodes = new Set(edges.map(e => e.target));
  
  return nodes.filter(node => !targetNodes.has(node.id));
}

// Build dependency graph
function buildDependencyGraph(nodes: Node<GeometryNodeData>[], edges: Edge[]): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    dependencies.set(node.id, []);
  });
  
  // Add dependencies based on edges
  edges.forEach(edge => {
    const deps = dependencies.get(edge.target) || [];
    deps.push(edge.source);
    dependencies.set(edge.target, deps);
  });
  
  return dependencies;
}

// Topological sort for node execution order
function getExecutionOrder(nodes: Node<GeometryNodeData>[], edges: Edge[]): Node<GeometryNodeData>[] {
  const dependencies = buildDependencyGraph(nodes, edges);
  const executed = new Set<string>();
  const result: Node<GeometryNodeData>[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  function canExecute(nodeId: string): boolean {
    const deps = dependencies.get(nodeId) || [];
    return deps.every(dep => executed.has(dep));
  }
  
  while (result.length < nodes.length) {
    const readyNodes = nodes.filter(node => 
      !executed.has(node.id) && canExecute(node.id)
    );
    
    if (readyNodes.length === 0) {
      throw new Error('Circular dependency detected in node graph');
    }
    
    readyNodes.forEach(node => {
      executed.add(node.id);
      result.push(node);
    });
  }
  
  return result;
}

// Get node inputs from connected edges
function getNodeInputs(
  nodeId: string,
  edges: Edge[],
  nodeOutputs: Map<string, Record<string, any>>,
  liveParameterTracker?: Map<string, Record<string, any>>
): Record<string, any> {
  const inputs: Record<string, any> = {};
  const parameterInputs: Record<string, any> = {};
  
  edges.forEach(edge => {
    if (edge.target === nodeId) {
      const sourceOutputs = nodeOutputs.get(edge.source);
      
      if (sourceOutputs && edge.sourceHandle && edge.targetHandle) {
        const outputValue = sourceOutputs[edge.sourceHandle];
        
        // Check if this is a parameter input (specific patterns, not just ending with '-in')
        const isParameterInput = edge.targetHandle.match(/^(width|height|depth|radius|segments|position-[xyz]|rotation-[xyz]|scale-[xyz]|radiusTop|radiusBottom|radialSegments|heightSegments|widthSegments|depthSegments|tubularSegments|tube|density|seed|distanceMin|level|instanceIndex|vertexCount|faceCount)-in$/);
        
        if (isParameterInput) {
          const paramName = edge.targetHandle.replace('-in', '');
          parameterInputs[paramName] = outputValue;
          
          // Track live parameter values for UI display
          if (liveParameterTracker) {
            if (!liveParameterTracker.has(nodeId)) {
              liveParameterTracker.set(nodeId, {});
            }
            const nodeParams = liveParameterTracker.get(nodeId)!;
            nodeParams[paramName] = outputValue;
          }
        } else {
          // Direct inputs like 'geometry-in', 'points-in', 'instance-in', 'vertices-in', 'faces-in', 'time-in', etc.
          inputs[edge.targetHandle] = outputValue;
        }
      }
    }
  });
  
  // Add parameter inputs to the inputs object
  if (Object.keys(parameterInputs).length > 0) {
    inputs.parameters = parameterInputs;
  }
  
  return inputs;
}

// Geometry cache to prevent recreation of identical geometries
const geometryCache = new Map<string, THREE.BufferGeometry>();
const maxCacheSize = 50; // Limit cache size to prevent memory issues

// Helper to generate cache key for primitive parameters
function getCacheKey(nodeType: string, parameters: any): string {
  return `${nodeType}_${JSON.stringify(parameters)}`;
}

// Clean up old cache entries when cache gets too large
function cleanupCache() {
  if (geometryCache.size > maxCacheSize) {
    // Remove oldest entries
    const entries = Array.from(geometryCache.entries());
    const toRemove = entries.slice(0, geometryCache.size - maxCacheSize);
    
    toRemove.forEach(([key, geometry]) => {
      geometry.dispose();
      geometryCache.delete(key);
    });
  }
}

// Main compilation function
export function compileNodeGraph(
  nodes: Node<GeometryNodeData>[],
  edges: Edge[],
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
): GraphCompilationResult & { liveParameterValues?: Record<string, any> } {
  const temporaryGeometries: THREE.BufferGeometry[] = [];
  const liveParameterTracker = new Map<string, Record<string, any>>();
  
  if (addLog) {
    addLog('info', 'Starting node graph compilation', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: nodes.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })),
      edges: edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle }))
    }, 'compilation');
  }
  
  try {
    // Get execution order
    const executionOrder = getExecutionOrder(nodes, edges);
    
    // Execute nodes in order
    const nodeOutputs = new Map<string, Record<string, any>>();
    const cache = new Map<string, any>();
    
    for (const node of executionOrder) {
      if (addLog) {
        addLog('debug', `Executing node: ${node.data.label || node.data.type}`, { 
          nodeId: node.id, 
          nodeType: node.data.type 
        }, 'compilation');
      }
      
      const inputs = getNodeInputs(node.id, edges, nodeOutputs, liveParameterTracker);
      const result = executeNodeWithCaching(node, inputs, cache, currentTime, frameRate, addLog);
      
      if (!result.success) {
        // Clean up any temporary geometries on error
        temporaryGeometries.forEach(geom => geom.dispose());
        
        return {
          success: false,
          error: `Node ${node.id} (${node.data.label}): ${result.error}`,
          liveParameterValues: {}
        };
      }
      
      // Track intermediate geometries for cleanup
      Object.values(result.outputs).forEach(output => {
        if (output instanceof THREE.BufferGeometry) {
          temporaryGeometries.push(output);
        }
      });
      
      nodeOutputs.set(node.id, result.outputs);
      
      if (addLog) {
        addLog('debug', `Node execution completed`, {
          nodeId: node.id,
          outputKeys: Object.keys(result.outputs)
        }, 'compilation');
      }
    }
    
    // Find output node and get final geometry
    const outputNode = nodes.find(n => n.data.type === 'output');
    if (!outputNode) {
      temporaryGeometries.forEach(geom => geom.dispose());
      return {
        success: false,
        error: 'No output node found in graph',
        liveParameterValues: {}
      };
    }
    
    const outputResult = nodeOutputs.get(outputNode.id);
    const finalGeometry = outputResult?.result as THREE.BufferGeometry;
    
    if (!finalGeometry) {
      temporaryGeometries.forEach(geom => geom.dispose());
      return {
        success: false,
        error: 'No geometry produced by output node',
        liveParameterValues: {}
      };
    }
    
    // Clean up intermediate geometries, but keep the final one
    temporaryGeometries.forEach(geom => {
      if (geom !== finalGeometry) {
        geom.dispose();
      }
    });
    
    // Clear geometry cache periodically to prevent memory issues
    // since we're not using it anymore for primitives
    if (geometryCache.size > 0) {
      geometryCache.forEach(geom => geom.dispose());
      geometryCache.clear();
    }
    
    // Clean up cache if needed
    cleanupCache();
    
    // Convert live parameter tracker to plain object
    const liveParameterValues: Record<string, any> = {};
    liveParameterTracker.forEach((params, nodeId) => {
      liveParameterValues[nodeId] = params;
    });

    return {
      success: true,
      geometry: {
        vertices: [],
        faces: [],
        normals: [],
        uvs: [],
        attributes: {
          vertex: new Map(),
          edge: new Map(),
          face: new Map(),
          corner: new Map()
        },
        vertexCount: finalGeometry.attributes.position?.count || 0,
        faceCount: finalGeometry.index ? finalGeometry.index.count / 3 : 0
      },
      // Return the Three.js geometry for direct use
      compiledGeometry: finalGeometry,
      liveParameterValues
    } as GraphCompilationResult & { compiledGeometry: THREE.BufferGeometry; liveParameterValues: Record<string, any> };
    
  } catch (error) {
    // Clean up any temporary geometries on error
    temporaryGeometries.forEach(geom => geom.dispose());
    
    return {
      success: false,
      error: `Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      liveParameterValues: {}
    };
  }
}

// Helper function to create a default material
export function createDefaultMaterial(): THREE.Material {
  return new THREE.MeshStandardMaterial({
    color: 0xff6b35,
    roughness: 0.4,
    metalness: 0.1
  });
} 