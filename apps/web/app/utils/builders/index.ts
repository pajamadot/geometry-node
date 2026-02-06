/**
 * Geometry Builders - Modular geometry construction system
 */

export { GeometryBuilder, type EnhancedGeometryData } from './GeometryBuilder';
export { VertexDataUtils } from './VertexDataUtils';

// Basic primitive builders
export { BoxBuilder } from './primitives/BoxBuilder';
export { SphereBuilder } from './primitives/SphereBuilder';
export { CylinderBuilder } from './primitives/CylinderBuilder';

// Advanced primitive builders
export { PlaneBuilder } from './primitives/PlaneBuilder';
export { TorusBuilder } from './primitives/TorusBuilder';
export { ConeBuilder } from './primitives/ConeBuilder';
export { GridBuilder } from './primitives/GridBuilder';

// Parametric builders
export { RibbonBuilder } from './parametric/RibbonBuilder';
export { TubeBuilder } from './parametric/TubeBuilder';
export { LatheBuilder } from './parametric/LatheBuilder';

// Geometry operations
export { GeometryOperations } from './operations/GeometryOperations';
export { AttributeOperations } from './operations/AttributeOperations';

// Caching & performance
export { GeometryCache, DirtyFlagSystem } from './cache/GeometryCache';

// Materials
export { MaterialCoupling } from './materials/MaterialCoupling';

// Procedural generators
export { TerrainGenerator, RockGenerator, TreeGenerator } from './generators/TerrainGenerator';

// Import/export
export { GeometryIO, type GeometryStatistics } from './io/GeometryIO';

// Developer tools
export { GeometryProfiler, GeometryInspector, profiler } from './devtools/GeometryProfiler';

// Parallel processing
export { GeometryWorkerPool, workerPool } from './parallel/GeometryWorkerPool';
export { ParallelGeometryBuilder, parallelBuilder } from './parallel/ParallelGeometryBuilder';
export { WorkerNodeExecutor, workerExecutor, WorkerCompatible } from './parallel/WorkerNodeExecutor';

// Streaming & LOD
export { GeometryStreamer, GeometryStreamLoader, type GeometryChunk } from './streaming/GeometryStreamer';
export { LODGenerator, type LODLevel, type LODStats } from './streaming/LODGenerator';
export { SimplificationEngine, type SimplificationQuality } from './streaming/SimplificationEngine';
export { AdaptiveLOD, AdaptiveLODManager, lodManager } from './streaming/AdaptiveLOD';

// GPU-accelerated operations
export { GPUComputeShaders, gpuCompute, type GPUInfo } from './gpu/GPUComputeShaders';
export { GPUNoiseGenerator, gpuNoise } from './gpu/GPUNoiseGenerator';
export { GPUInstanceRenderer, gpuInstances, type InstanceStats } from './gpu/GPUInstanceRenderer';
export { ComputeBufferPool, bufferPool } from './gpu/ComputeBufferPool';

// Memory management
export { GeometryPool, geometryPool } from './memory/GeometryPool';
export { BufferAllocator, bufferAllocator } from './memory/BufferAllocator';
export { GeometryRecycler, geometryRecycler } from './memory/GeometryRecycler';
export { MemoryMonitor, memoryMonitor } from './memory/MemoryMonitor';

// Incremental computation
export { DependencyGraph, IncrementalCompiler, RuntimeOptimizer, incrementalCompiler, runtimeOptimizer } from './runtime/IncrementalComputation';

// Boolean operations
export { BooleanOperations } from './boolean/BooleanOperations';

// Advanced modifiers
export { AdvancedModifiers } from './modifiers/AdvancedModifiers';

// Particle systems
export { ParticleSystem, ParticleEmitter, PointCloudGenerator } from './particles/ParticleSystem';

// Physics integration
export { CollisionDetector, RigidBodySimulator, SoftBodyDeformer, PhysicsConstraints, collisionDetector, rigidBodySimulator, physicsConstraints, type RigidBody } from './physics/PhysicsIntegration';

// Advanced exporters
export { GLTFExporter, OBJExporter, STLExporter, UniversalGeometryConverter } from './export/AdvancedExporters';
