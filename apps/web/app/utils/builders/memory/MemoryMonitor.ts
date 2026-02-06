/**
 * MemoryMonitor - Real-time memory usage tracking
 * Monitors geometry and buffer memory consumption
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private measurements: MemoryMeasurement[] = [];
  private maxMeasurements: number = 100;
  private warningThreshold: number = 500 * 1024 * 1024; // 500MB
  private criticalThreshold: number = 1024 * 1024 * 1024; // 1GB

  private constructor() {}

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Take memory measurement
   */
  measure(label: string = 'default'): void {
    const memory = this.getCurrentMemory();

    const measurement: MemoryMeasurement = {
      timestamp: Date.now(),
      label,
      jsHeapSize: memory.usedJSHeapSize,
      totalHeapSize: memory.totalJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
    };

    this.measurements.push(measurement);

    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Check thresholds
    this.checkThresholds(memory.usedJSHeapSize);
  }

  /**
   * Get current memory info
   */
  getCurrentMemory(): MemoryInfo {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    if (this.measurements.length === 0) {
      return {
        current: 0,
        peak: 0,
        average: 0,
        trend: 'stable',
        utilizationPercent: 0,
      };
    }

    const latest = this.measurements[this.measurements.length - 1];
    const sizes = this.measurements.map((m) => m.jsHeapSize);

    const peak = Math.max(...sizes);
    const average = sizes.reduce((a, b) => a + b, 0) / sizes.length;

    // Calculate trend
    const trend = this.calculateTrend();

    return {
      current: latest.jsHeapSize,
      peak,
      average,
      trend,
      utilizationPercent: (latest.jsHeapSize / latest.heapLimit) * 100,
    };
  }

  /**
   * Get memory report
   */
  getReport(): MemoryReport {
    const stats = this.getStats();
    const current = this.getCurrentMemory();

    return {
      stats,
      current: {
        used: this.formatBytes(current.usedJSHeapSize),
        total: this.formatBytes(current.totalJSHeapSize),
        limit: this.formatBytes(current.jsHeapSizeLimit),
      },
      status: this.getMemoryStatus(current.usedJSHeapSize),
      recommendations: this.getRecommendations(stats),
    };
  }

  /**
   * Print memory report to console
   */
  printReport(): void {
    const report = this.getReport();

    console.group('💾 Memory Monitor Report');
    console.log(`Status: ${report.status}`);
    console.log(`Current: ${report.current.used} / ${report.current.limit}`);
    console.log(`Peak: ${this.formatBytes(report.stats.peak)}`);
    console.log(`Average: ${this.formatBytes(report.stats.average)}`);
    console.log(`Trend: ${report.stats.trend}`);
    console.log(`Utilization: ${report.stats.utilizationPercent.toFixed(1)}%`);

    if (report.recommendations.length > 0) {
      console.log('\\nRecommendations:');
      report.recommendations.forEach((rec) => console.log(`  - ${rec}`));
    }

    console.groupEnd();
  }

  /**
   * Set warning threshold
   */
  setWarningThreshold(bytes: number): void {
    this.warningThreshold = bytes;
  }

  /**
   * Set critical threshold
   */
  setCriticalThreshold(bytes: number): void {
    this.criticalThreshold = bytes;
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements = [];
  }

  /**
   * Check memory thresholds
   */
  private checkThresholds(usedMemory: number): void {
    if (usedMemory >= this.criticalThreshold) {
      console.error('🚨 CRITICAL: Memory usage exceeds critical threshold!');
    } else if (usedMemory >= this.warningThreshold) {
      console.warn('⚠️  WARNING: Memory usage approaching limits');
    }
  }

  /**
   * Calculate memory trend
   */
  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.measurements.length < 10) return 'stable';

    const recent = this.measurements.slice(-10);
    const first = recent[0].jsHeapSize;
    const last = recent[recent.length - 1].jsHeapSize;

    const change = (last - first) / first;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Get memory status
   */
  private getMemoryStatus(usedMemory: number): 'healthy' | 'warning' | 'critical' {
    if (usedMemory >= this.criticalThreshold) return 'critical';
    if (usedMemory >= this.warningThreshold) return 'warning';
    return 'healthy';
  }

  /**
   * Get recommendations
   */
  private getRecommendations(stats: MemoryStats): string[] {
    const recommendations: string[] = [];

    if (stats.trend === 'increasing') {
      recommendations.push('Memory usage is increasing - consider recycling unused geometries');
    }

    if (stats.utilizationPercent > 80) {
      recommendations.push('High memory utilization - enable geometry pooling');
    }

    if (stats.peak > stats.average * 2) {
      recommendations.push('Large memory spikes detected - implement streaming for large geometries');
    }

    return recommendations;
  }

  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }
}

interface MemoryMeasurement {
  timestamp: number;
  label: string;
  jsHeapSize: number;
  totalHeapSize: number;
  heapLimit: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryStats {
  current: number;
  peak: number;
  average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  utilizationPercent: number;
}

interface MemoryReport {
  stats: MemoryStats;
  current: {
    used: string;
    total: string;
    limit: string;
  };
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

// Global memory monitor
export const memoryMonitor = MemoryMonitor.getInstance();
