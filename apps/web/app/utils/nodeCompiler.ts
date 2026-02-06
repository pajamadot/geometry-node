import * as pc from 'playcanvas';
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
import { nodeRegistry } from '../registry/NodeRegistry';
import { EnhancedGeometryData, GeometryBuilder } from './builders/GeometryBuilder';
import { GeometryOperations } from './builders/operations/GeometryOperations';
import { VertexDataUtils } from './builders/VertexDataUtils';
import { BoxBuilder } from './builders/primitives/BoxBuilder';
import { SphereBuilder } from './builders/primitives/SphereBuilder';
import { CylinderBuilder } from './builders/primitives/CylinderBuilder';
import { ConeBuilder } from './builders/primitives/ConeBuilder';
import { PlaneBuilder } from './builders/primitives/PlaneBuilder';
import { TorusBuilder } from './builders/primitives/TorusBuilder';

// Create PlayCanvas geometry from primitive parameters
function createPrimitiveGeometry(data: PrimitiveNodeData): EnhancedGeometryData {
  const { primitiveType, parameters } = data;

  switch (primitiveType) {
    case 'cube':
      return BoxBuilder.create(parameters as any);

    case 'sphere':
      return SphereBuilder.create(parameters as any);

    case 'cylinder':
      return CylinderBuilder.create(parameters as any);

    case 'plane':
      return PlaneBuilder.create(parameters as any);

    case 'cone':
      return ConeBuilder.create(parameters as any);

    case 'torus':
      return TorusBuilder.create(parameters as any);

    default:
      console.warn(`Unknown primitive type: ${primitiveType}`);
      return BoxBuilder.create();
  }
}

// Create Parametric Surface Geometry
function createParametricSurface(data: ParametricSurfaceNodeData): EnhancedGeometryData {
    // Placeholder for parametric surface generation using PlayCanvas/GeometryBuilder
    // Ideally we implement a parametric builder in ./builders/parametric/ParametricBuilder.ts
    // For now, return a plane as fallback to avoid build errors
    return PlaneBuilder.create({ width: 10, height: 10, widthSegments: 10, heightSegments: 10 });
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

// PlayCanvas-inspired geometry node functions
function distributePointsOnMesh(geometry: EnhancedGeometryData, data: any): pc.Vec3[] {
  const { distributeMethod, density, seed } = data;
  const points: pc.Vec3[] = [];
  
  // Simple random distribution on mesh surface
  const positions = geometry.positionsArray;
  const indices = geometry.indicesArray;
  
  if (!positions) return points;
  
  // Create deterministic random number generator
  const rng = new SeededRandom(seed);
  
  const numPoints = Math.floor(density);
  
  for (let i = 0; i < numPoints; i++) {
    if (indices) {
      // Pick random triangle
      const triangleIndex = Math.floor(rng.random() * (indices.length / 3)) * 3;
      const a = indices[triangleIndex];
      const b = indices[triangleIndex + 1];
      const c = indices[triangleIndex + 2];
      
      // Get triangle vertices
      const vA = new pc.Vec3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
      const vB = new pc.Vec3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
      const vC = new pc.Vec3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
      
      // Random point on triangle using barycentric coordinates
      const r1 = rng.random();
      const r2 = rng.random();
      const sqrt_r1 = Math.sqrt(r1);
      const u = 1 - sqrt_r1;
      const v = r2 * sqrt_r1;
      const w = 1 - u - v;
      
      const point = new pc.Vec3();
      // point = vA * u + vB * v + vC * w
      const tempA = vA.clone().mulScalar(u);
      const tempB = vB.clone().mulScalar(v);
      const tempC = vC.clone().mulScalar(w);
      point.add(tempA).add(tempB).add(tempC);
      
      points.push(point);
    } else {
      // No indices, pick random vertex
      const vertexIndex = Math.floor(rng.random() * (positions.length / 3));
      const point = new pc.Vec3(
        positions[vertexIndex * 3],
        positions[vertexIndex * 3 + 1],
        positions[vertexIndex * 3 + 2]
      );
      points.push(point);
    }
  }
  
  return points;
}

function createInstancesAtPoints(points: pc.Vec3[], instanceGeometry: EnhancedGeometryData, data: any): EnhancedGeometryData {
  // For now, create a simple merged geometry of instances
  const { rotation, scale } = data;
  
  const geometries: EnhancedGeometryData[] = [];
  
  points.forEach((point) => {
    let instanceClone = VertexDataUtils.clone(instanceGeometry);
    
    // Apply transformation
    const matrix = new pc.Mat4();
    // Compose transformation: Translate, Rotate, Scale
    matrix.setTRS(
      point, 
      new pc.Quat().setFromEulerAngles(rotation.x, rotation.y, rotation.z), 
      new pc.Vec3(scale.x, scale.y, scale.z)
    );
    
    instanceClone = VertexDataUtils.transform(instanceClone, matrix);
    geometries.push(instanceClone);
  });
  
  // Merge all instances into single geometry
  if (geometries.length === 0) {
    return BoxBuilder.create(); // Fallback
  }
  
  return VertexDataUtils.merge(geometries);
}

function subdivideMesh(geometry: EnhancedGeometryData, level: number): EnhancedGeometryData {
  if (level <= 0) return VertexDataUtils.clone(geometry);
  return GeometryOperations.subdivide(geometry, level);
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

// Create Geometry from raw vertices and faces
function createGeometryFromVerticesAndFaces(
  vertices: Array<{ x: number; y: number; z: number }>,
  faces: Array<{ a: number; b: number; c: number; d?: number }>,
  options: { computeNormals: boolean; generateUVs: boolean }
): EnhancedGeometryData {
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
  
  const geometry: EnhancedGeometryData = {
    vertices: [], // Populated later or ignored if we use arrays directly
    faces: [],
    attributes: {
      vertex: new Map(),
      edge: new Map(),
      face: new Map(),
      corner: new Map()
    },
    vertexCount: vertices.length,
    faceCount: indices.length / 3,
    positionsArray: new Float32Array(positions),
    indicesArray: new Uint32Array(indices)
  };

  // Compute normals if requested
  if (options.computeNormals) {
    // Use our VertexDataUtils to compute normals
    // But wait, we need a way to call it on this data structure
    // Let's use VertexDataUtils.computeNormals directly
    // Note: VertexDataUtils.computeNormals returns a NEW object, need to assign back or mutate
    // Our VertexDataUtils methods return new objects (functional style)
    const withNormals = VertexDataUtils.computeNormals(geometry);
    geometry.normalsArray = withNormals.normalsArray;
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
    geometry.uvsArray = new Float32Array(uvs);
  }
  
  return geometry;
}

// Execute a single node using the registry system
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
    
    // Check cache first (skip for time-dependent nodes, transform nodes, and nodes with parameters)
    if (data.type !== 'time' && 
        data.type !== 'transform' && 
        !('parameters' in data && data.parameters && Object.keys(data.parameters).length > 0)) {
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

    // Try registry-based execution first (new system)
    const definition = nodeRegistry.getDefinition(data.type);
    if (definition) {
      if (addLog) {
        addLog('debug', `Executing node via registry: ${definition.name}`, { 
          nodeId: node.id,
          nodeType: data.type 
        }, 'registry-execution');
      }

      // Prepare parameters - combine default values with current values
      const parameters: Record<string, any> = {};
      
      // Start with default values from definition
      definition.parameters.forEach(param => {
        parameters[param.id] = param.defaultValue;
      });
      
      // Override with stored parameters from node data
      if ('parameters' in data && data.parameters) {
        Object.assign(parameters, data.parameters);
      }
      
      // Override with connected parameter values
      if (inputs.parameters) {
        Object.assign(parameters, inputs.parameters);
      }

      // Inject currentTime for time nodes
      if (data.type === 'time') {
        inputs.currentTime = currentTime;
        inputs.frameRate = frameRate;
      }
      
      // Execute using registry
      const outputs = nodeRegistry.executeNode(data.type, inputs, parameters);
      
      // Convert outputs to the expected format
      const formattedOutputs: Record<string, any> = {};
      Object.entries(outputs).forEach(([key, value]) => {
        // All nodes use -out suffix for consistency
        formattedOutputs[`${key}-out`] = value;
      });

      return {
        success: true,
        outputs: formattedOutputs
      };
    }

    // Fallback to legacy system for nodes not yet converted
    if (addLog) {
      addLog('warning', `Falling back to legacy execution for: ${data.type}`, { 
        nodeId: node.id,
        nodeType: data.type 
      }, 'legacy-execution');
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
        
        // Create geometry fresh every time to ensure updates are reflected
        // Caching can be added later if performance becomes an issue
        const geometry = createPrimitiveGeometry(modifiedPrimitiveData);
        
        if (addLog) {
          addLog('success', 'Primitive geometry created successfully', {
            vertexCount: geometry.vertexCount
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
            'time': timeValue
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
        
        const inputGeometry = inputs['geometry-in'] as EnhancedGeometryData;
        
        if (!inputGeometry) {
          const errorMsg = `Transform node requires geometry input. Available inputs: [${Object.keys(inputs).join(', ')}]. Expected 'geometry-in' but got: ${inputs['geometry-in']}`;
          return {
            success: false,
            outputs: {},
            error: errorMsg
          };
        }

        // Clone the geometry and apply transform
        const transformedGeometry = VertexDataUtils.clone(inputGeometry);
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
        const matrix = new pc.Mat4();
        matrix.setTRS(
          new pc.Vec3(position.x, position.y, position.z),
          new pc.Quat().setFromEulerAngles(rotation.x, rotation.y, rotation.z),
          new pc.Vec3(scale.x, scale.y, scale.z)
        );
        
        const resultGeom = VertexDataUtils.transform(transformedGeometry, matrix);
        
        return {
          success: true,
          outputs: {
            'geometry-out': resultGeom
          }
        };

            case 'join':
        const joinData = data as JoinNodeData;
        const geometries: EnhancedGeometryData[] = [];
        
        // Collect all geometry inputs
        const geometryInputs = [
          'geometry-in-1', 'geometry-in-2', 'geometry-in-3',  // Legacy naming
          'geometryA', 'geometryB', 'geometryC',               // Registry naming
          'geometry-in'                                         // Single geometry input
        ];
        
        geometryInputs.forEach(inputId => {
          const geom = inputs[inputId] as EnhancedGeometryData;
          if (geom) geometries.push(geom);
        });

        if (geometries.length === 0) {
          return {
            success: false,
            outputs: {},
            error: 'Join node requires at least one geometry input'
          };
        }

        // Implement proper geometry merging
        let joinedGeometry: EnhancedGeometryData;
        
        if (geometries.length === 1) {
          joinedGeometry = VertexDataUtils.clone(geometries[0]);
        } else {
          // Merge multiple geometries
          joinedGeometry = VertexDataUtils.merge(geometries);
        }

        return {
          success: true,
          outputs: {
            'geometry-out': joinedGeometry
          }
        };

      case 'distribute-points':
        const distributeData = data as any; // DistributePointsNodeData
        const inputMesh = inputs['geometry-in'] as EnhancedGeometryData;
        
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
        const instanceGeometry = inputs['instance-in'] as EnhancedGeometryData;
        
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
        const meshToSubdivide = inputs['geometry-in'] as EnhancedGeometryData;
        
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
        // This node is now handled by the registry system
        if (addLog) {
          addLog('warning', 'Create Vertices node using legacy execution', { 
            nodeId: node.id,
            nodeType: data.type 
          }, 'legacy-execution');
        }
        
        const vertexData = data as any; // CreateVerticesNodeData
        return {
          success: true,
          outputs: {
            'vertices-out': vertexData.vertices || []
          }
        };

      case 'create-faces':
        // This node is now handled by the registry system
        if (addLog) {
          addLog('warning', 'Create Faces node using legacy execution', { 
            nodeId: node.id,
            nodeType: data.type 
          }, 'legacy-execution');
        }
        
        const faceData = data as any; // CreateFacesNodeData
        return {
          success: true,
          outputs: {
            'faces-out': faceData.faces || []
          }
        };

      case 'lowPolyRock':
        // Legacy support
        const rockGeometry = SphereBuilder.create({ radius: 1, widthSegments: 1, heightSegments: 1 });
        
        return {
          success: true,
          outputs: {
            'geometry-out': rockGeometry
          }
        };

      case 'merge-geometry':
        if (addLog) {
          addLog('warning', 'Merge Geometry node using legacy execution', { 
            nodeId: node.id,
            nodeType: data.type 
          }, 'legacy-execution');
        }
        
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

        // Create geometry from vertices and faces
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
        const outputGeometry = inputs['geometry-in'] as EnhancedGeometryData;
        return {
          success: true,
          outputs: {
            result: outputGeometry,
            geometry: outputGeometry
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
export function executeNodeWithCaching(
  node: Node<GeometryNodeData>,
  inputs: Record<string, any>,
  cache: Map<string, any>,
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
): NodeExecutionResult {
  const result = executeNode(node, inputs, cache, currentTime, frameRate, addLog);
  
  // Cache successful results (skip time-dependent nodes, nodes with parameters, and material-related nodes)
  // Also skip transform nodes as they may have time-dependent inputs
  const skipCaching = node.data.type === 'time' || 
                     node.data.type === 'transform' ||
                     node.data.type === 'set-material' ||
                     node.data.type === 'material-mixer' ||
                     node.data.type === 'water-material' ||
                     node.data.type === 'hologram-material' ||
                     node.data.type === 'lava-material' ||
                     ('parameters' in node.data && node.data.parameters && Object.keys(node.data.parameters).length > 0);
  
  if (result.success && !skipCaching) {
    cacheNodeResult(node.id, inputs, node.data, result.outputs);
    if (addLog) {
      addLog('debug', `Cached result for node: ${node.data.label || node.data.type}`, { 
        nodeId: node.id,
        nodeType: node.data.type 
      }, 'caching');
    }
  } else if (result.success && skipCaching) {
    // console.log(`⚠️ Skipping cache for ${node.data.type} to avoid re-execution issues`);
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
    if (value && value.positionsArray) {
      return `Geometry:${value.vertexCount}`;
    }
    if (value && value.x !== undefined && value.y !== undefined && value.z !== undefined) {
      return `Vec3:${value.x},${value.y},${value.z}`;
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

// Clone outputs for cache
function cloneOutputs(outputs: Record<string, any>): Record<string, any> {
  const cloned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(outputs)) {
    if (value && value.positionsArray) {
      // Clone Geometry (EnhancedGeometryData)
      cloned[key] = VertexDataUtils.clone(value);
    } else if (value && value.clone && typeof value.clone === 'function') {
      // Clone PlayCanvas math types
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

// Clear cache for specific node
export function clearNodeCache(nodeId?: string) {
  if (nodeId) {
    nodeResultCache.delete(nodeId);
  } else {
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
      // Handle circular dependency or disjoint graphs gracefully
      const remaining = nodes.filter(n => !executed.has(n.id));
      if (remaining.length > 0) {
         // Just process remaining nodes in order as best effort
         remaining.forEach(node => {
           executed.add(node.id);
           result.push(node);
         });
      }
      break;
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
  liveParameterTracker?: Map<string, Record<string, any>>,
  nodeData?: any,
  allNodes?: Node<GeometryNodeData>[]
): Record<string, any> {
  const inputs: Record<string, any> = {};
  
  // Track which inputs are connected
  const connectedInputs = new Set<string>();
  
  edges.forEach(edge => {
    if (edge.target === nodeId) {
      const sourceOutputs = nodeOutputs.get(edge.source);
      
      if (sourceOutputs && edge.sourceHandle && edge.targetHandle) {
        const outputValue = sourceOutputs[edge.sourceHandle];
        connectedInputs.add(edge.targetHandle);
        
        // Extract socket names from handle IDs
        const targetSocketName = edge.targetHandle.replace('-in', '');
        
        inputs[targetSocketName] = outputValue;
        
        // Track live parameter values for UI display
        if (liveParameterTracker) {
          if (!liveParameterTracker.has(nodeId)) {
            liveParameterTracker.set(nodeId, {});
          }
          const nodeParams = liveParameterTracker.get(nodeId)!;
          nodeParams[targetSocketName] = outputValue;
        }
      }
    }
  });
  
  // Add default values for unconnected inputs from node parameters
  if (nodeData?.parameters) {
    Object.entries(nodeData.parameters).forEach(([paramId, value]) => {
      if (!connectedInputs.has(`${paramId}-in`)) {
        inputs[paramId] = value;
      }
    });
  }
  
  return inputs;
}

// Geometry cache to prevent recreation of identical geometries
const geometryCache = new Map<string, any>();
const maxCacheSize = 50;

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
      // geometry.dispose(); // If we had disposable geometries
      geometryCache.delete(key);
    });
  }
}

// ===== NODE GRAPH CLEANUP OPTIMIZATION =====
// (Keep existing cleanup logic as is)

/**
 * Find all nodes that contribute to the final output by traversing backwards from output nodes
 */
export function findNodesContributingToOutput(
  nodes: Node<GeometryNodeData>[], 
  edges: Edge[]
): Set<string> {
  const contributingNodes = new Set<string>();
  
  const outputNodes = nodes.filter(node => node.data.type === 'output');
  
  if (outputNodes.length === 0) {
    return contributingNodes;
  }
  
  const reverseDependencies = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!reverseDependencies.has(edge.source)) {
      reverseDependencies.set(edge.source, []);
    }
    reverseDependencies.get(edge.source)!.push(edge.target);
  });
  
  const queue: string[] = outputNodes.map(node => node.id);
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    
    if (visited.has(currentNodeId)) {
      continue;
    }
    
    visited.add(currentNodeId);
    contributingNodes.add(currentNodeId);
    
    const inputEdges = edges.filter(edge => edge.target === currentNodeId);
    inputEdges.forEach(edge => {
      if (!visited.has(edge.source)) {
        queue.push(edge.source);
      }
    });
  }
  
  return contributingNodes;
}

/**
 * Analyze the node graph to identify unused nodes
 */
export function analyzeNodeGraphForCleanup(
  nodes: Node<GeometryNodeData>[], 
  edges: Edge[]
): {
  totalNodes: number;
  contributingNodes: Set<string>;
  unusedNodes: Node<GeometryNodeData>[];
  unusedCount: number;
  canCleanup: boolean;
  outputNodes: Node<GeometryNodeData>[];
} {
  const contributingNodes = findNodesContributingToOutput(nodes, edges);
  const unusedNodes = nodes.filter(node => !contributingNodes.has(node.id));
  const outputNodes = nodes.filter(node => node.data.type === 'output');
  
  return {
    totalNodes: nodes.length,
    contributingNodes,
    unusedNodes,
    unusedCount: unusedNodes.length,
    canCleanup: unusedNodes.length > 0,
    outputNodes
  };
}

/**
 * Remove unused nodes and their associated edges from the graph
 */
export function cleanupNodeGraph(
  nodes: Node<GeometryNodeData>[], 
  edges: Edge[]
): {
  cleanedNodes: Node<GeometryNodeData>[];
  cleanedEdges: Edge[];
  removedNodes: Node<GeometryNodeData>[];
  removedEdges: Edge[];
  stats: {
    totalNodesBefore: number;
    totalNodesAfter: number;
    nodesRemoved: number;
    edgesRemoved: number;
  };
} {
  const analysis = analyzeNodeGraphForCleanup(nodes, edges);
  const contributingNodeIds = analysis.contributingNodes;
  
  const cleanedNodes = nodes.filter(node => contributingNodeIds.has(node.id));
  
  const cleanedEdges = edges.filter(edge => 
    contributingNodeIds.has(edge.source) && contributingNodeIds.has(edge.target)
  );
  
  const removedNodes = nodes.filter(node => !contributingNodeIds.has(node.id));
  const removedEdges = edges.filter(edge => 
    !contributingNodeIds.has(edge.source) || !contributingNodeIds.has(edge.target)
  );
  
  return {
    cleanedNodes,
    cleanedEdges,
    removedNodes,
    removedEdges,
    stats: {
      totalNodesBefore: nodes.length,
      totalNodesAfter: cleanedNodes.length,
      nodesRemoved: removedNodes.length,
      edgesRemoved: removedEdges.length
    }
  };
}

/**
 * Enhanced compilation function that only processes nodes contributing to output
 */
export function compileNodeGraphOptimized(
  nodes: Node<GeometryNodeData>[],
  edges: Edge[],
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void,
  optimizeGraph: boolean = true
): GraphCompilationResult & { 
  liveParameterValues?: Record<string, any>;
  optimizationStats?: {
    totalNodes: number;
    processedNodes: number;
    skippedNodes: number;
    optimizationEnabled: boolean;
  };
} {
  let effectiveNodes = nodes;
  let effectiveEdges = edges;
  let optimizationStats = {
    totalNodes: nodes.length,
    processedNodes: nodes.length,
    skippedNodes: 0,
    optimizationEnabled: optimizeGraph
  };
  
  if (optimizeGraph) {
    const analysis = analyzeNodeGraphForCleanup(nodes, edges);
    if (analysis.canCleanup) {
      effectiveNodes = nodes.filter(node => analysis.contributingNodes.has(node.id));
      effectiveEdges = edges.filter(edge => 
        analysis.contributingNodes.has(edge.source) && analysis.contributingNodes.has(edge.target)
      );
      
      optimizationStats = {
        totalNodes: nodes.length,
        processedNodes: effectiveNodes.length,
        skippedNodes: analysis.unusedCount,
        optimizationEnabled: true
      };
      
      if (addLog) {
        addLog('info', `Graph optimization: Processing ${effectiveNodes.length}/${nodes.length} nodes (skipped ${analysis.unusedCount} unused)`, optimizationStats, 'optimization');
      }
    }
  }
  
  const result = compileNodeGraph(effectiveNodes, effectiveEdges, currentTime, frameRate, addLog);
  
  return {
    ...result,
    optimizationStats
  };
}

// Main compilation function
export function compileNodeGraph(
  nodes: Node<GeometryNodeData>[],
  edges: Edge[],
  currentTime: number = 0,
  frameRate: number = 30,
  addLog?: (level: 'error' | 'warning' | 'info' | 'debug' | 'success', message: string, details?: any, category?: string) => void
): GraphCompilationResult & { liveParameterValues?: Record<string, any> } {
  const temporaryGeometries: EnhancedGeometryData[] = [];
  const liveParameterTracker = new Map<string, Record<string, any>>();
  
  try {
    const executionOrder = getExecutionOrder(nodes, edges);
    
    const nodeOutputs = new Map<string, Record<string, any>>();
    const cache = new Map<string, any>();
    
    for (const node of executionOrder) {
      const inputs = getNodeInputs(node.id, edges, nodeOutputs, liveParameterTracker, node.data, nodes);
      
      const result = executeNodeWithCaching(node, inputs, cache, currentTime, frameRate, addLog);
      
      if (!result.success) {
        console.error('❌ Node execution failed:', node.data.type, result.error);
        
        return {
          success: false,
          error: `Node ${node.id} (${node.data.label}): ${result.error}`,
          liveParameterValues: {}
        };
      }
      
      // Track intermediate geometries for debugging or cleanup if objects were heavy
      Object.values(result.outputs).forEach(output => {
        if (output && output.positionsArray) {
          temporaryGeometries.push(output);
        }
      });
      
      nodeOutputs.set(node.id, result.outputs);
    }
    
    const outputNode = nodes.find(n => n.data.type === 'output');
    if (!outputNode) {
      return {
        success: false,
        error: 'No output node found in graph',
        liveParameterValues: {}
      };
    }
    
    const outputResult = nodeOutputs.get(outputNode.id);
    
    const finalGeometry = outputResult?.['result'] || 
                         outputResult?.['result-out'] ||
                         outputResult?.['geometry-out'] || 
                         outputResult?.['geometry'] as EnhancedGeometryData;
    
    if (!finalGeometry) {
      return {
        success: false,
        error: `No geometry produced by output node. Available outputs: ${Object.keys(outputResult || {}).join(', ')}`,
        liveParameterValues: {}
      };
    }
    
    // Clean up cache if needed
    cleanupCache();
    
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
        vertexCount: finalGeometry.vertexCount,
        faceCount: finalGeometry.faceCount
      },
      compiledGeometry: finalGeometry,
      liveParameterValues
    } as GraphCompilationResult & { compiledGeometry: EnhancedGeometryData; liveParameterValues: Record<string, any> };
    
  } catch (error) {
    console.error('💥 Compilation failed:', error);
    
    return {
      success: false,
      error: `Compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      liveParameterValues: {}
    };
  }
}

// Helper function to create a default material
export function createDefaultMaterial(): pc.StandardMaterial {
  const material = new pc.StandardMaterial();
  material.diffuse.set(1, 1, 1);
  material.metalness = 0.0;
  material.shininess = 50;
  material.useMetalness = true;
  material.cull = pc.CULLFACE_NONE;
  material.update();
  return material;
}
