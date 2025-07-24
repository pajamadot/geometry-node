'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Monitor, X, Activity, Clock, Zap, Database, TrendingUp } from 'lucide-react';
import { useGeometry } from './GeometryContext';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  webglMemoryEstimate: number;
}

export default function SystemMonitor() {
  const { performanceStats } = useGeometry();
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'memory'>('performance');

  useEffect(() => {
    const updateMemoryInfo = () => {
      try {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const webglMemoryEstimate = estimateWebGLMemory();
          
          const info: MemoryInfo = {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            webglMemoryEstimate
          };
          
          setMemoryInfo(info);
          
          // Warning if memory usage is high
          const memoryUsagePercent = (info.usedJSHeapSize / info.jsHeapSizeLimit) * 100;
          const shouldWarn = memoryUsagePercent > 75 || webglMemoryEstimate > 100; // 100MB WebGL threshold
          
          setIsWarning(shouldWarn);
          setIsVisible(shouldWarn || isVisible);
        }
      } catch (error) {
        console.warn('Memory monitoring error:', error);
      }
    };

    const estimateWebGLMemory = (): number => {
      try {
        const canvas = document.querySelector('canvas');
        if (!canvas) return 0;
        
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width * dpr;
        const height = rect.height * dpr;
        const pixelCount = width * height;
        
        const estimatedMemory = pixelCount * 4 * 4; // 4x for safety margin
        const memoryMB = estimatedMemory / (1024 * 1024);
        return Math.min(memoryMB, 500); // Cap at 500MB max estimate
      } catch (error) {
        console.warn('Unable to estimate WebGL memory:', error);
        return 50; // 50MB default estimate
      }
    };

    const interval = setInterval(updateMemoryInfo, 2000);
    updateMemoryInfo();

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleClearMemory = () => {
    if ('gc' in window) {
      (window as any).gc();
    }
    
    setTimeout(() => {
      // Clear any cached geometries (this would need to be implemented in the geometry cache)
    }, 100);
  };

  const performCleanup = useCallback(() => {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        // Ignore errors
      }
    }
  }, []);

  if (!memoryInfo) {
    return null;
  }

  const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
  const avgExecutionTime = performanceStats.executionCount > 0 ? 
    (performanceStats.totalExecutionTime / performanceStats.executionCount) : 0;

  // Determine overall system status
  const isPerformanceGood = avgExecutionTime < 5;
  const isMemoryGood = memoryUsagePercent < 75 && memoryInfo.webglMemoryEstimate < 100;
  const overallStatus = isPerformanceGood && isMemoryGood ? 'good' : 
                       (!isPerformanceGood || !isMemoryGood) ? 'warning' : 'critical';

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleToggleVisibility}
        className={`
          fixed top-4 right-4 z-30 w-10 h-10 rounded-full border-2 text-xs font-bold transition-all duration-200
          flex items-center justify-center
          ${overallStatus === 'critical' 
            ? 'bg-red-500/80 border-red-400 text-white animate-pulse' 
            : overallStatus === 'warning'
            ? 'bg-yellow-500/80 border-yellow-400 text-white'
            : 'bg-gray-700/80 border-gray-600 text-gray-300 hover:bg-gray-600/80'
          }
        `}
        title={`System Status: ${overallStatus.toUpperCase()}`}
      >
        {overallStatus === 'critical' ? <AlertTriangle size={16} /> : 
         overallStatus === 'warning' ? <TrendingUp size={16} /> : 
         <Monitor size={16} />}
      </button>

      {/* System Monitor Panel */}
      {isVisible && (
        <div className="fixed top-4 right-16 z-30 bg-black/95 backdrop-blur-sm border border-gray-700 rounded-lg text-sm text-white min-w-[380px] max-w-[420px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
              <Monitor size={16} />
              System Monitor
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'performance'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Activity size={12} />
              Performance
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`flex-1 px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'memory'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Database size={12} />
              Memory
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'performance' && (
              <div className="space-y-3">
                {/* Performance Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`text-xs font-semibold ${
                    avgExecutionTime < 5 ? 'text-green-400' :
                    avgExecutionTime < 16 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {avgExecutionTime < 5 ? '🟢 Excellent' :
                     avgExecutionTime < 16 ? '🟡 Good' : '🔴 Slow'}
                  </span>
                </div>

                {/* Execution Stats */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-green-400" />
                      Executions:
                    </span>
                    <span className="font-mono">{performanceStats.executionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-400" />
                      Last Exec:
                    </span>
                    <span className="font-mono">{performanceStats.lastExecutionTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Avg Exec:
                    </span>
                    <span className="font-mono">{avgExecutionTime.toFixed(2)}ms</span>
                  </div>

                  {/* Compilation Stats */}
                  <div className="border-t border-gray-600 pt-2 mt-3">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-yellow-400" />
                        Compilations:
                      </span>
                      <span className="font-mono">{performanceStats.compilationCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-yellow-400" />
                        Last Compile:
                      </span>
                      <span className="font-mono">{performanceStats.lastCompilationTime.toFixed(2)}ms</span>
                    </div>
                  </div>

                  {/* Performance Target */}
                  <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-600">
                    Target: &lt;5ms for 60fps
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="space-y-3">
                {/* Memory Usage */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">JS Heap Usage:</span>
                    <span className={`text-xs font-semibold ${
                      memoryUsagePercent > 75 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {memoryUsagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        memoryUsagePercent > 75 ? 'bg-red-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min(memoryUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* WebGL Memory */}
                <div>
                  <div className="flex justify-between">
                    <span className="text-xs">WebGL Estimate:</span>
                    <span className={`text-xs font-semibold ${
                      memoryInfo.webglMemoryEstimate > 100 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {memoryInfo.webglMemoryEstimate.toFixed(1)} MB
                    </span>
                  </div>
                </div>

                {/* Warning Section */}
                {isWarning && (
                  <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded text-xs">
                    <div className="text-red-400 font-semibold mb-1">High Memory Usage!</div>
                    <div className="text-gray-300">
                      WebGL context may be at risk. Consider simplifying the scene.
                    </div>
                  </div>
                )}

                {/* Memory Actions */}
                <button
                  onClick={handleClearMemory}
                  className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                >
                  Suggest Cleanup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 