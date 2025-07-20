'use client';

import React, { useState, useEffect } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  webglMemoryEstimate: number;
}

export default function MemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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
        // Silently handle errors during memory monitoring
        console.warn('Memory monitoring error:', error);
      }
    };

    const estimateWebGLMemory = (): number => {
      try {
        // Safe WebGL memory estimation without accessing existing contexts
        const canvas = document.querySelector('canvas');
        if (!canvas) return 0;
        
        // Get canvas dimensions without accessing its WebGL context
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width * dpr;
        const height = rect.height * dpr;
        const pixelCount = width * height;
        
        // Conservative estimate based on canvas size and typical Three.js usage
        // Rough calculation: 
        // - Color buffer: width * height * 4 bytes (RGBA)
        // - Depth buffer: width * height * 4 bytes  
        // - Typical Three.js overhead: ~2x the above for geometries, textures, etc.
        const estimatedMemory = pixelCount * 4 * 4; // 4x for safety margin
        
        // Convert to MB and cap at reasonable maximum
        const memoryMB = estimatedMemory / (1024 * 1024);
        return Math.min(memoryMB, 500); // Cap at 500MB max estimate
      } catch (error) {
        // If estimation fails, return a conservative default
        console.warn('Unable to estimate WebGL memory:', error);
        return 50; // 50MB default estimate
      }
    };

    // Update every 2 seconds
    const interval = setInterval(updateMemoryInfo, 2000);
    updateMemoryInfo(); // Initial update

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
    // Trigger garbage collection hint
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Force a more aggressive cleanup
    setTimeout(() => {
      // Clear any cached geometries (this would need to be implemented in the geometry cache)
      console.log('Attempting memory cleanup...');
    }, 100);
  };

  if (!memoryInfo) {
    return null;
  }

  const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleToggleVisibility}
        className={`
          fixed top-4 right-4 z-30 w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-200
          ${isWarning 
            ? 'bg-red-500/80 border-red-400 text-white animate-pulse' 
            : 'bg-gray-700/80 border-gray-600 text-gray-300 hover:bg-gray-600/80'
          }
        `}
        title={`Memory Usage: ${memoryUsagePercent.toFixed(1)}%`}
      >
        {isWarning ? '⚠' : 'M'}
      </button>

      {/* Memory Info Panel */}
      {isVisible && (
        <div className="fixed top-4 right-16 z-30 bg-black/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-sm text-white min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-cyan-400">Memory Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between">
                <span>JS Heap:</span>
                <span className={memoryUsagePercent > 75 ? 'text-red-400' : 'text-green-400'}>
                  {memoryUsagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)}
              </div>
            </div>

            <div>
              <div className="flex justify-between">
                <span>WebGL Est:</span>
                <span className={memoryInfo.webglMemoryEstimate > 100 ? 'text-red-400' : 'text-green-400'}>
                  {memoryInfo.webglMemoryEstimate.toFixed(1)} MB
                </span>
              </div>
            </div>

            {isWarning && (
              <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded text-xs">
                <div className="text-red-400 font-semibold mb-1">High Memory Usage!</div>
                <div className="text-gray-300">
                  WebGL context may be at risk. Consider simplifying the scene.
                </div>
              </div>
            )}

            <button
              onClick={handleClearMemory}
              className="w-full mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
            >
              Suggest Cleanup
            </button>
          </div>
        </div>
      )}
    </>
  );
} 