/**
 * Performance Monitor
 *
 * Tracks execution metrics for the node graph pipeline:
 * - Per-node execution time
 * - Frame budget tracking
 * - Memory pressure estimation
 * - Hot-path identification for the self-evolving pipeline
 */

export interface NodeExecutionMetric {
  nodeId: string;
  nodeType: string;
  executionTimeMs: number;
  timestamp: number;
}

export interface FrameMetrics {
  totalExecutionMs: number;
  nodeCount: number;
  slowestNodeId: string | null;
  slowestNodeMs: number;
  withinBudget: boolean;
}

export interface PerformanceReport {
  /** Average frame execution time over the window */
  avgFrameMs: number;
  /** 95th percentile frame time */
  p95FrameMs: number;
  /** Node types ranked by total time consumed */
  hotNodes: { nodeType: string; totalMs: number; avgMs: number; callCount: number }[];
  /** Number of frames that exceeded the budget */
  droppedFrames: number;
  /** Total frames sampled */
  totalFrames: number;
  /** Estimated memory pressure (0-1) */
  memoryPressure: number;
}

const DEFAULT_FRAME_BUDGET_MS = 16.67; // 60fps target
const DEFAULT_HISTORY_SIZE = 300; // ~5 seconds at 60fps

export class PerformanceMonitor {
  private frameBudgetMs: number;
  private historySize: number;
  private frameHistory: FrameMetrics[] = [];
  private nodeMetrics: NodeExecutionMetric[] = [];
  private currentFrameStart = 0;
  private currentFrameNodes: NodeExecutionMetric[] = [];
  private running = false;

  constructor(frameBudgetMs = DEFAULT_FRAME_BUDGET_MS, historySize = DEFAULT_HISTORY_SIZE) {
    this.frameBudgetMs = frameBudgetMs;
    this.historySize = historySize;
  }

  /** Start timing a new frame */
  beginFrame(): void {
    this.currentFrameStart = performance.now();
    this.currentFrameNodes = [];
    this.running = true;
  }

  /** Record a single node execution within the current frame */
  recordNodeExecution(nodeId: string, nodeType: string, executionTimeMs: number): void {
    const metric: NodeExecutionMetric = {
      nodeId,
      nodeType,
      executionTimeMs,
      timestamp: performance.now(),
    };
    this.currentFrameNodes.push(metric);
    this.nodeMetrics.push(metric);

    // Trim node metrics history
    if (this.nodeMetrics.length > this.historySize * 50) {
      this.nodeMetrics = this.nodeMetrics.slice(-this.historySize * 20);
    }
  }

  /** Wrap a node execution call and automatically record its timing */
  measure<T>(nodeId: string, nodeType: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      this.recordNodeExecution(nodeId, nodeType, performance.now() - start);
    }
  }

  /** End the current frame and store its metrics */
  endFrame(): FrameMetrics {
    const totalMs = performance.now() - this.currentFrameStart;
    let slowestId: string | null = null;
    let slowestMs = 0;

    for (const node of this.currentFrameNodes) {
      if (node.executionTimeMs > slowestMs) {
        slowestMs = node.executionTimeMs;
        slowestId = node.nodeId;
      }
    }

    const frame: FrameMetrics = {
      totalExecutionMs: totalMs,
      nodeCount: this.currentFrameNodes.length,
      slowestNodeId: slowestId,
      slowestNodeMs: slowestMs,
      withinBudget: totalMs <= this.frameBudgetMs,
    };

    this.frameHistory.push(frame);
    if (this.frameHistory.length > this.historySize) {
      this.frameHistory.shift();
    }

    this.running = false;
    return frame;
  }

  /** Generate a full performance report from collected data */
  getReport(): PerformanceReport {
    const frames = this.frameHistory;
    if (frames.length === 0) {
      return {
        avgFrameMs: 0,
        p95FrameMs: 0,
        hotNodes: [],
        droppedFrames: 0,
        totalFrames: 0,
        memoryPressure: 0,
      };
    }

    // Frame time stats
    const frameTimes = frames.map(f => f.totalExecutionMs).sort((a, b) => a - b);
    const avgFrameMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const p95Index = Math.floor(frameTimes.length * 0.95);
    const p95FrameMs = frameTimes[p95Index] ?? frameTimes[frameTimes.length - 1];
    const droppedFrames = frames.filter(f => !f.withinBudget).length;

    // Aggregate node metrics by type
    const typeStats = new Map<string, { totalMs: number; callCount: number }>();
    for (const metric of this.nodeMetrics) {
      const existing = typeStats.get(metric.nodeType) ?? { totalMs: 0, callCount: 0 };
      existing.totalMs += metric.executionTimeMs;
      existing.callCount++;
      typeStats.set(metric.nodeType, existing);
    }

    const hotNodes = Array.from(typeStats.entries())
      .map(([nodeType, stats]) => ({
        nodeType,
        totalMs: Math.round(stats.totalMs * 100) / 100,
        avgMs: Math.round((stats.totalMs / stats.callCount) * 100) / 100,
        callCount: stats.callCount,
      }))
      .sort((a, b) => b.totalMs - a.totalMs);

    // Memory pressure estimate
    const memoryPressure = this.estimateMemoryPressure();

    return {
      avgFrameMs: Math.round(avgFrameMs * 100) / 100,
      p95FrameMs: Math.round(p95FrameMs * 100) / 100,
      hotNodes,
      droppedFrames,
      totalFrames: frames.length,
      memoryPressure,
    };
  }

  /** Identify nodes that consistently exceed a time threshold */
  getBottlenecks(thresholdMs = 5): { nodeType: string; avgMs: number; callCount: number }[] {
    const report = this.getReport();
    return report.hotNodes.filter(n => n.avgMs > thresholdMs);
  }

  /** Check if we're currently within frame budget */
  isWithinBudget(): boolean {
    if (!this.running) return true;
    return (performance.now() - this.currentFrameStart) <= this.frameBudgetMs;
  }

  /** Get remaining budget for the current frame */
  getRemainingBudgetMs(): number {
    if (!this.running) return this.frameBudgetMs;
    return Math.max(0, this.frameBudgetMs - (performance.now() - this.currentFrameStart));
  }

  /** Clear all collected data */
  reset(): void {
    this.frameHistory = [];
    this.nodeMetrics = [];
    this.currentFrameNodes = [];
    this.running = false;
  }

  private estimateMemoryPressure(): number {
    // Use the Performance API's memory info if available
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      const used = perfMemory.usedJSHeapSize;
      const limit = perfMemory.jsHeapSizeLimit;
      return limit > 0 ? Math.min(1, used / limit) : 0;
    }
    // Fallback: estimate based on frame drop rate
    if (this.frameHistory.length === 0) return 0;
    const dropRate = this.frameHistory.filter(f => !f.withinBudget).length / this.frameHistory.length;
    return Math.min(1, dropRate * 2);
  }
}

// Singleton
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
}
