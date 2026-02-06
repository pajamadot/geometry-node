import { EnhancedGeometryData } from '../GeometryBuilder';

/**
 * GeometryProfiler - Performance profiling for geometry operations
 */
export class GeometryProfiler {
  private static instance: GeometryProfiler;
  private measurements: Map<string, PerformanceMeasurement[]>;
  private active: boolean = false;

  private constructor() {
    this.measurements = new Map();
  }

  static getInstance(): GeometryProfiler {
    if (!GeometryProfiler.instance) {
      GeometryProfiler.instance = new GeometryProfiler();
    }
    return GeometryProfiler.instance;
  }

  /**
   * Start profiling
   */
  start(): void {
    this.active = true;
    this.measurements.clear();
    console.log('🔍 Geometry Profiler: Started');
  }

  /**
   * Stop profiling
   */
  stop(): void {
    this.active = false;
    console.log('🔍 Geometry Profiler: Stopped');
  }

  /**
   * Measure operation execution time
   */
  measure<T>(
    operationName: string,
    operation: () => T,
    context?: Record<string, any>
  ): T {
    if (!this.active) {
      return operation();
    }

    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    let result: T;
    let error: Error | null = null;

    try {
      result = operation();
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const measurement: PerformanceMeasurement = {
        operation: operationName,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        timestamp: Date.now(),
        context,
        error: error?.message,
      };

      if (!this.measurements.has(operationName)) {
        this.measurements.set(operationName, []);
      }
      this.measurements.get(operationName)!.push(measurement);
    }

    return result!;
  }

  /**
   * Get profiling report
   */
  getReport(): ProfilingReport {
    const operations: OperationStats[] = [];

    for (const [operation, measurements] of this.measurements.entries()) {
      const durations = measurements.map((m) => m.duration);
      const memoryDeltas = measurements.map((m) => m.memoryDelta);

      operations.push({
        operation,
        count: measurements.length,
        totalDuration: durations.reduce((a, b) => a + b, 0),
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        totalMemory: memoryDeltas.reduce((a, b) => a + b, 0),
        avgMemory: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        errors: measurements.filter((m) => m.error).length,
      });
    }

    // Sort by total duration
    operations.sort((a, b) => b.totalDuration - a.totalDuration);

    return {
      operations,
      totalOperations: Array.from(this.measurements.values()).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      totalTime: operations.reduce((sum, op) => sum + op.totalDuration, 0),
    };
  }

  /**
   * Print report to console
   */
  printReport(): void {
    const report = this.getReport();

    console.group('📊 Geometry Profiler Report');
    console.log(`Total Operations: ${report.totalOperations}`);
    console.log(`Total Time: ${report.totalTime.toFixed(2)}ms`);
    console.log('\n');

    console.table(
      report.operations.map((op) => ({
        Operation: op.operation,
        Count: op.count,
        'Total (ms)': op.totalDuration.toFixed(2),
        'Avg (ms)': op.avgDuration.toFixed(2),
        'Min (ms)': op.minDuration.toFixed(2),
        'Max (ms)': op.maxDuration.toFixed(2),
        'Mem (KB)': (op.totalMemory / 1024).toFixed(2),
        Errors: op.errors,
      }))
    );

    console.groupEnd();
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements.clear();
  }
}

/**
 * GeometryInspector - Detailed geometry analysis and visualization
 */
export class GeometryInspector {
  /**
   * Analyze geometry for issues
   */
  static analyze(geometry: EnhancedGeometryData): GeometryAnalysis {
    const issues: string[] = [];
    const warnings: string[] = [];
    const stats = {
      vertices: geometry.vertexCount,
      faces: geometry.faceCount,
      hasNormals: !!geometry.normalsArray,
      hasUVs: !!geometry.uvsArray,
      hasColors: !!geometry.colorsArray,
      hasIndices: !!geometry.indicesArray,
    };

    // Check for issues
    if (!geometry.normalsArray) {
      warnings.push('Missing normals - lighting may not work correctly');
    }

    if (!geometry.uvsArray) {
      warnings.push('Missing UVs - textures may not map correctly');
    }

    if (geometry.vertexCount === 0) {
      issues.push('Geometry has no vertices');
    }

    if (geometry.faceCount === 0) {
      issues.push('Geometry has no faces');
    }

    if (geometry.vertexCount > 100000) {
      warnings.push(
        `High vertex count (${geometry.vertexCount}) - may impact performance`
      );
    }

    // Check for degenerate triangles
    if (geometry.indicesArray && geometry.positionsArray) {
      const degenerateCount = this.countDegenerateTriangles(
        geometry.positionsArray,
        geometry.indicesArray
      );

      if (degenerateCount > 0) {
        warnings.push(
          `Found ${degenerateCount} degenerate triangles - consider cleaning geometry`
        );
      }
    }

    return {
      stats,
      issues,
      warnings,
      quality: issues.length === 0 ? (warnings.length === 0 ? 'excellent' : 'good') : 'poor',
    };
  }

  /**
   * Count degenerate triangles (zero area)
   */
  private static countDegenerateTriangles(
    positions: Float32Array,
    indices: Uint32Array
  ): number {
    let count = 0;

    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;

      const v1x = positions[i1];
      const v1y = positions[i1 + 1];
      const v1z = positions[i1 + 2];

      const v2x = positions[i2];
      const v2y = positions[i2 + 1];
      const v2z = positions[i2 + 2];

      const v3x = positions[i3];
      const v3y = positions[i3 + 1];
      const v3z = positions[i3 + 2];

      // Calculate triangle area using cross product
      const edge1x = v2x - v1x;
      const edge1y = v2y - v1y;
      const edge1z = v2z - v1z;

      const edge2x = v3x - v1x;
      const edge2y = v3y - v1y;
      const edge2z = v3z - v1z;

      const crossX = edge1y * edge2z - edge1z * edge2y;
      const crossY = edge1z * edge2x - edge1x * edge2z;
      const crossZ = edge1x * edge2y - edge1y * edge2x;

      const area = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) / 2;

      if (area < 0.000001) {
        count++;
      }
    }

    return count;
  }

  /**
   * Print analysis to console
   */
  static printAnalysis(geometry: EnhancedGeometryData): void {
    const analysis = this.analyze(geometry);

    console.group('🔬 Geometry Inspector');

    console.log('📊 Statistics:');
    console.table(analysis.stats);

    if (analysis.issues.length > 0) {
      console.error('❌ Issues:');
      analysis.issues.forEach((issue) => console.error(`  - ${issue}`));
    }

    if (analysis.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      analysis.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    console.log(`\n✨ Quality: ${analysis.quality.toUpperCase()}`);

    console.groupEnd();
  }
}

interface PerformanceMeasurement {
  operation: string;
  duration: number;
  memoryDelta: number;
  timestamp: number;
  context?: Record<string, any>;
  error?: string;
}

interface OperationStats {
  operation: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalMemory: number;
  avgMemory: number;
  errors: number;
}

interface ProfilingReport {
  operations: OperationStats[];
  totalOperations: number;
  totalTime: number;
}

interface GeometryAnalysis {
  stats: {
    vertices: number;
    faces: number;
    hasNormals: boolean;
    hasUVs: boolean;
    hasColors: boolean;
    hasIndices: boolean;
  };
  issues: string[];
  warnings: string[];
  quality: 'excellent' | 'good' | 'poor';
}

// Global profiler instance
export const profiler = GeometryProfiler.getInstance();
