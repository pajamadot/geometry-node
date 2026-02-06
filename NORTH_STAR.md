# Geometry Node System - North Star Architecture

## Inspired by Babylon.js Node Geometry + Blender Geometry Nodes

This document outlines our target architecture based on best practices from Babylon.js and Blender.

---

## Key Principles from Babylon.js

### 1. **Modular Builder Pattern**
Babylon.js separates geometry creation into specialized builders:
- Each primitive has its own builder module (boxBuilder.ts, sphereBuilder.ts, etc.)
- Builders expose both `CreateVertexData` and `Create[Mesh]` functions
- Central `MeshBuilder` facade provides unified access

**Application to our system:**
- Create dedicated builder utilities in `apps/web/app/utils/builders/`
- Separate vertex data generation from node execution
- Enable reusable geometry generation functions

### 2. **VertexData as Core Data Structure**
Babylon.js uses `VertexData` as the intermediate representation:
- Positions, normals, indices, UVs, colors stored separately
- Vertex data can be transformed, merged, and composed before creating meshes
- Enables non-destructive geometry operations

**Application to our system:**
- Enhance our `GeometryData` type to be more VertexData-like
- Add helper methods for vertex data manipulation
- Support contextual data access (position, normal, UVs per vertex)

### 3. **Contextual Values System**
Babylon.js Node Geometry provides contextual access:
- Nodes can read: positions, normals, colors, UVs, vertexID, faceID
- Enables data-driven transformations (e.g., scale by vertex height)
- Powers procedural variation and attribute-based operations

**Application to our system:**
- Implement attribute system in GeometryData
- Add context-aware nodes (e.g., SetPositionByNormal, ColorByHeight)
- Support per-vertex, per-edge, per-face attributes

### 4. **Instancing Operations**
Critical for fast procedural generation:
- `InstantiateOnVerticesBlock` - geometry per vertex
- `InstantiateOnFacesBlock` - geometry per face
- Matrix-based transformations for efficient copying

**Application to our system:**
- Enhance `InstanceOnPointsNode` with more options
- Add InstanceOnFaces, InstanceOnEdges nodes
- Implement efficient matrix-based instance transforms

### 5. **Composition over Complex Primitives**
Babylon.js composes complex shapes from simple primitives:
- Segmented box = 6 ground planes transformed and merged
- Encourages building blocks approach
- Reduces code duplication

**Application to our system:**
- Create atomic geometry operations
- Build complex nodes by composing simple operations
- Add utility functions for common compositions

---

## Comparison: Current vs Target Architecture

### Current State
```
Node Definition → Execute Function → THREE.js Geometry
```
**Pros:**
- Simple, straightforward
- Works with Three.js directly
- Easy to understand

**Cons:**
- Limited intermediate processing
- Hard to add procedural variations
- No attribute system
- Difficult to compose operations

### Target State (North Star)
```
Source Node → Geometry Builders → VertexData/GeometryData →
Modifier Nodes (contextual) → Merge/Compose → Output → THREE.js Mesh
```

**Benefits:**
- Non-destructive workflow
- Powerful attribute system
- Composable operations
- Contextual data access
- Efficient instancing

---

## Implementation Roadmap (20 Iterations)

### Phase 1: Core Geometry Builders (Iterations 1-5)

**Iteration 1: Builder Infrastructure**
- Create `apps/web/app/utils/builders/` directory
- Implement `GeometryBuilder` base class
- Add `VertexDataUtils` helper class

**Iteration 2: Basic Primitive Builders**
- `BoxBuilder` with width/height/depth/segments
- `SphereBuilder` with radius/segments
- `CylinderBuilder` with top/bottom radius/height/segments
- Each returns enhanced GeometryData

**Iteration 3: Advanced Primitive Builders**
- `PlaneBuilder` with subdivisions
- `TorusBuilder` with radius/tube/segments
- `ConeBuilder` with radius/height/segments
- `GridBuilder` for planes with customizable divisions

**Iteration 4: Parametric Builders**
- `RibbonBuilder` for path-based geometries
- `TubeBuilder` for path extrusion
- `LatheBuilder` for revolution surfaces
- Support custom path functions

**Iteration 5: Geometry Data Utilities**
- `computeNormals()` - automatic normal calculation
- `computeBounds()` - bounding box computation
- `optimizeGeometry()` - vertex deduplication
- `extractAttributes()` - attribute extraction helpers

### Phase 2: Modifier & Operation Nodes (Iterations 6-10)

**Iteration 6: Transform Modifiers**
- `SetPositionsNode` - modify vertices by function
- `SetNormalsNode` - custom normal manipulation
- `SetColorsNode` - per-vertex coloring
- `SetUVsNode` - UV coordinate mapping

**Iteration 7: Attribute-Based Modifiers**
- `DisplaceByAttributeNode` - displace based on attributes
- `ScaleByHeightNode` - scale vertices by Y position
- `ColorByNormalNode` - color based on normal direction
- `RandomizeByIDNode` - procedural variation by vertex ID

**Iteration 8: Geometry Math Operations**
- `NoiseDisplacementNode` - Perlin/Simplex noise
- `TwistNode` - parametric twist deformation
- `BendNode` - curve bending operation
- `TaperNode` - scale along axis

**Iteration 9: Advanced Instancing**
- `InstanOnFacesNode` - instance geometry on face centers
- `InstanceOnEdgesNode` - instance along edges
- `InstanceGridNode` - array/grid instancing
- `InstanceCircleNode` - radial/circular instancing

**Iteration 10: Merge & Boolean Enhancements**
- Improve `MergeGeometryNode` with VertexData approach
- Add `CSGUnionNode`, `CSGIntersectNode`, `CSGSubtractNode`
- Implement `CleanGeometryNode` - remove duplicates/degenerates
- Add `SeparateGeometryNode` - split by material/island

### Phase 3: Contextual & Procedural Nodes (Iterations 11-15)

**Iteration 11: Contextual Value Nodes**
- `GetPositionNode` - extract vertex positions
- `GetNormalNode` - extract normals
- `GetVertexIDNode` - access vertex indices
- `GetFaceIDNode` - access face indices

**Iteration 12: Attribute System Nodes**
- `CreateAttributeNode` - add custom attributes
- `ReadAttributeNode` - read attribute values
- `WriteAttributeNode` - set attribute values
- `DeleteAttributeNode` - remove attributes

**Iteration 13: Procedural Distribution**
- `DistributePointsNode` enhancements (Poisson disc, grid)
- `ScatterOnSurfaceNode` - random surface scattering
- `AlignToNormalNode` - orient instances to surface
- `RandomTransformNode` - jitter position/rotation/scale

**Iteration 14: Curve & Path Operations**
- `CreateCurveNode` - Bezier/NURBS curves
- `ResampleCurveNode` - uniform point distribution
- `CurveToMeshNode` - convert curves to tube meshes
- `SweepNode` - sweep profile along path

**Iteration 15: Surface & UV Operations**
- `UVProjectNode` - planar/cylindrical/spherical projection
- `UVUnwrapNode` - automatic UV generation
- `SubdivideNode` enhancements (Loop, Catmull-Clark)
- `SimplifyNode` - mesh decimation

### Phase 4: Optimization & Advanced Features (Iterations 16-20)

**Iteration 16: Performance Optimization**
- Implement geometry caching system
- Add dirty-flag propagation for efficient updates
- Optimize matrix operations with typed arrays
- Add Web Worker support for heavy computations

**Iteration 17: Material Integration**
- Material/geometry coupling improvements
- Multi-material support in all nodes
- Material attribute mapping
- Shader-based procedural materials

**Iteration 18: Advanced Procedural Generators**
- `TerrainGeneratorNode` - heightmap-based terrain
- `TreeGeneratorNode` - L-system or procedural trees
- `RockGeneratorNode` - procedural rock/stone
- `BuildingGeneratorNode` - parametric architecture

**Iteration 19: Import/Export & Serialization**
- Export to GLB/GLTF with attributes preserved
- Import external meshes as GeometryData
- Snippet system (like Babylon's)
- Node graph templates and presets

**Iteration 20: Developer Experience**
- Node creation templates/generators
- Visual attribute inspector
- Performance profiler for node graphs
- Interactive documentation with live examples

---

## Technical Architecture Details

### Enhanced GeometryData Structure

```typescript
interface EnhancedGeometryData {
  // Core vertex data
  positions: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
  indices?: Uint32Array;

  // Attribute system
  attributes: {
    vertex: Map<string, AttributeData>;
    edge: Map<string, AttributeData>;
    face: Map<string, AttributeData>;
    corner: Map<string, AttributeData>;
  };

  // Metadata
  bounds?: BoundingBox;
  vertexCount: number;
  faceCount: number;

  // Material support
  materials?: THREE.Material[];
  materialGroups?: MaterialGroup[];
}
```

### Geometry Builder Pattern

```typescript
class GeometryBuilder {
  protected data: EnhancedGeometryData;

  constructor() {
    this.data = this.createEmpty();
  }

  // Chainable methods
  setPositions(positions: Float32Array): this;
  setNormals(normals: Float32Array): this;
  setIndices(indices: Uint32Array): this;
  setAttribute(domain: 'vertex' | 'face', name: string, data: AttributeData): this;

  // Build final geometry
  build(): EnhancedGeometryData;
  toTHREE(): THREE.BufferGeometry;
}

class BoxBuilder extends GeometryBuilder {
  constructor(params: { width, height, depth, segments? }) {
    super();
    this.generateBoxGeometry(params);
  }

  private generateBoxGeometry(params): void {
    // Vertex generation logic
    // Similar to Babylon.js boxBuilder.ts
  }
}
```

### Node Execution Pattern

```typescript
// Old way (current)
execute: (inputs, parameters) => {
  const radius = inputs.radius || 1;
  const geometry = new THREE.SphereGeometry(radius, 32, 16);
  return { geometry };
}

// New way (north star)
execute: (inputs, parameters, context) => {
  const radius = inputs.radius || 1;
  const segments = inputs.segments || 32;

  // Use builder for VertexData generation
  const builder = new SphereBuilder({ radius, segments });
  const geometryData = builder.build();

  // Apply contextual modifications
  if (inputs.displacementNoise) {
    geometryData = applyNoiseDisplacement(geometryData, inputs.displacementNoise);
  }

  // Convert to THREE.js when needed
  const threeGeometry = builder.toTHREE();

  return {
    geometry: threeGeometry,
    geometryData // Pass along for further processing
  };
}
```

---

## Success Metrics

1. **Performance**: 10x faster geometry generation for complex scenes
2. **Flexibility**: 5x more nodes for procedural operations
3. **Composability**: Build complex geometries from 3-5 simple nodes
4. **User Experience**: Instant visual feedback, < 16ms node updates
5. **Code Quality**: 50% reduction in node implementation code

---

### Phase 5: Performance & Runtime Optimization (Iterations 21-25)

**Iteration 21: Web Workers & Parallel Processing**
- `GeometryWorkerPool` - Background geometry generation
- `ParallelGeometryBuilder` - Multi-threaded primitive creation
- `WorkerNodeExecutor` - Execute heavy nodes in workers
- Message passing with transferable ArrayBuffers

**Iteration 22: Geometry Streaming & LOD**
- `GeometryStreamer` - Progressive geometry loading
- `LODGenerator` - Automatic level-of-detail creation
- `SimplificationEngine` - Mesh decimation algorithms
- `AdaptiveLOD` - Distance-based quality switching

**Iteration 23: GPU-Accelerated Operations**
- `GPUComputeShaders` - Transform feedback operations
- `GPUNoiseGenerator` - Shader-based noise displacement
- `GPUInstanceRenderer` - Hardware instancing support
- `ComputeBufferPool` - Efficient GPU memory management

**Iteration 24: Memory Pooling & Reuse**
- `GeometryPool` - Object pooling for typed arrays
- `BufferAllocator` - Custom memory allocation strategy
- `GeometryRecycler` - Reuse geometry data structures
- `MemoryMonitor` - Real-time memory usage tracking

**Iteration 25: Incremental Computation**
- `IncrementalCompiler` - Only recompute changed subgraphs
- `DependencyGraph` - Track node dependencies
- `PartialEvaluator` - Cache intermediate results
- `RuntimeOptimizer` - Dynamic execution plan optimization

### Phase 6: Advanced Geometry Features (Iterations 26-30)

**Iteration 26: Boolean Operations**
- `BooleanUnion` - CSG union operation
- `BooleanSubtract` - CSG subtraction
- `BooleanIntersect` - CSG intersection
- `BooleanEngine` - Fast BSP-tree based CSG

**Iteration 27: Advanced Modifiers**
- `LatticeDeform` - Lattice-based deformation
- `CurveDeform` - Deform along curve path
- `WaveModifier` - Sine wave deformations
- `MirrorModifier` - Symmetrical geometry operations

**Iteration 28: Particle Systems & Point Clouds**
- `ParticleEmitter` - Geometry-based particle emission
- `PointCloudGenerator` - Efficient point cloud creation
- `ParticleSimulator` - Physics-based particle motion
- `PointCloudRenderer` - Optimized point rendering

**Iteration 29: Physics Integration**
- `CollisionDetector` - Geometry collision detection
- `RigidBodySimulator` - Basic physics simulation
- `SoftBodyDeformer` - Soft body dynamics
- `PhysicsConstraints` - Distance/angle constraints

**Iteration 30: Advanced Export Formats**
- `GLTFExporter` - Full GLTF/GLB export with extensions
- `OBJExporter` - Wavefront OBJ export
- `STLExporter` - 3D printing STL format
- `FBXExporter` - Autodesk FBX export
- `UniversalGeometryConverter` - Format conversion pipeline

---

### Phase 7: Advanced Node System (Iterations 31-35)

**Iteration 31: Custom Node Framework**
- `NodeBuilder` - Visual node creation interface
- `CustomNodeDefinition` - User-defined node templates
- `NodeCodeGenerator` - Auto-generate node code from UI
- `NodeValidation` - Real-time node validation

**Iteration 32: Node Templates & Presets**
- `NodeTemplateLibrary` - Pre-built node templates
- `PresetManager` - Save/load node configurations
- `NodeSnippets` - Reusable node patterns
- `TemplateMarketplace` - Share templates community-wide

**Iteration 33: Node Groups & Encapsulation**
- `NodeGroup` - Combine multiple nodes into reusable groups
- `GroupIO` - Input/output management for groups
- `NestedGraphs` - Subgraphs within nodes
- `GroupLibrary` - Organized group collections

**Iteration 34: Dynamic Socket System**
- `DynamicSockets` - Runtime socket creation/deletion
- `SocketTypes` - Custom socket type definitions
- `TypeConversion` - Automatic type casting
- `PolymorphicSockets` - Multi-type socket support

**Iteration 35: Node Versioning & Migration**
- `NodeVersioning` - Track node version history
- `MigrationSystem` - Auto-upgrade old nodes
- `BackwardCompatibility` - Support legacy graphs
- `ChangelogTracking` - Document node changes

### Phase 8: AI & Procedural Systems (Iterations 36-40)

**Iteration 36: AI-Powered Optimization**
- `AIGeometryOptimizer` - ML-based mesh optimization
- `SmartSubdivision` - Adaptive subdivision
- `AutoLOD` - AI-generated LOD levels
- `GeometryAnalyzer` - Quality assessment AI

**Iteration 37: Procedural City Generator**
- `CityLayoutGenerator` - Street network generation
- `BuildingGenerator` - Parametric buildings
- `DistrictSystem` - Zoned city areas
- `InfrastructureGen` - Roads, parks, utilities

**Iteration 38: Organic Growth Algorithms**
- `AdvancedLSystem` - Enhanced L-system implementation
- `GrowthSimulator` - Organic structure growth
- `VegetationSystem` - Procedural plants/trees
- `CoralGenerator` - Branching organic structures

**Iteration 39: Texture Synthesis & Baking**
- `TextureSynthesizer` - Procedural texture generation
- `UVBaker` - Bake geometry details to textures
- `NormalMapGenerator` - Generate normal maps
- `AmbientOcclusionBaker` - AO map generation

**Iteration 40: Smart Material System**
- `MaterialGraph` - Node-based material editor
- `PBRMaterialBuilder` - Physical-based rendering materials
- `MaterialLibrary` - Preset material collection
- `ShaderNodeSystem` - Custom shader nodes

### Phase 9: Collaboration & Cloud (Iterations 41-45)

**Iteration 41: Real-time Collaboration**
- `CollaborationServer` - WebSocket-based server
- `PresenceSystem` - See other users in scene
- `ConflictResolution` - Merge conflicting edits
- `LiveCursors` - Real-time cursor positions

**Iteration 42: Cloud Storage & Versioning**
- `CloudProjectManager` - Cloud-based project storage
- `VersionControl` - Git-like version history
- `CloudSync` - Automatic sync to cloud
- `BranchingSystem` - Work on feature branches

**Iteration 43: Asset Library System**
- `AssetBrowser` - Visual asset exploration
- `AssetImporter` - Multi-format asset import
- `AssetTags` - Categorization and search
- `ThumbnailGenerator` - Auto-generate previews

**Iteration 44: Multiplayer Scene Editing**
- `MultiplayerSession` - Shared editing sessions
- `LockingSystem` - Prevent simultaneous edits
- `ChatSystem` - In-app communication
- `ActivityFeed` - Track team member actions

**Iteration 45: Project Templates & Sharing**
- `ProjectTemplates` - Starter templates
- `PublicGallery` - Share projects publicly
- `EmbedSystem` - Embed scenes in websites
- `ExportLinks` - Shareable project URLs

### Phase 10: Production Tools (Iterations 46-50)

**Iteration 46: Animation System**
- `TimelineEditor` - Keyframe animation
- `AnimationCurves` - Bezier curve interpolation
- `GeometryMorphing` - Morph between geometries
- `ProceduralAnimation` - Noise-driven animation

**Iteration 47: Render Pipeline Integration**
- `CustomRenderPipeline` - Configurable rendering
- `PostProcessingStack` - Effects pipeline
- `LightingSystem` - Advanced lighting controls
- `ShadowQuality` - Optimized shadow rendering

**Iteration 48: VR/AR Preview**
- `VRPreviewMode` - WebXR integration
- `ARPlacement` - AR object placement
- `HandTracking` - VR hand interaction
- `SpatialUI` - 3D UI for VR/AR

**Iteration 49: Performance Profiling Dashboard**
- `PerformanceDashboard` - Real-time metrics
- `BottleneckDetector` - Identify slow operations
- `MemoryVisualizer` - Memory usage graphs
- `OptimizationSuggestions` - AI-powered tips

**Iteration 50: Production Export Pipeline**
- `BatchExporter` - Export multiple formats
- `CompressionPipeline` - Optimize exports
- `MetadataEmbedding` - Add project metadata
- `CDNIntegration` - Direct upload to CDN

---

## Next Steps

1. ✅ **Iterations 1-30 Complete** - Core system + performance optimization
2. 🚀 **Iterations 31-35** - Advanced Node System
3. 🤖 **Iterations 36-40** - AI & Procedural Systems
4. 🌐 **Iterations 41-45** - Collaboration & Cloud
5. 🎬 **Iterations 46-50** - Production Tools
6. Continue measuring against success metrics
7. Build comprehensive test suite
8. Create interactive documentation

---

*This is a living document. Update as we learn and iterate.*
