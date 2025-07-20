'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  initialLeftWidth?: number; // percentage (0-100)
  minLeftWidth?: number;     // percentage
  maxLeftWidth?: number;     // percentage
}

export default function ResizableLayout({
  leftPanel,
  rightPanel,
  initialLeftWidth = 40,
  minLeftWidth = 20,
  maxLeftWidth = 80
}: ResizableLayoutProps) {
  // Always start with initialLeftWidth to avoid hydration mismatch
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resizable-layout-width');
      if (saved) {
        const parsedWidth = parseFloat(saved);
        if (parsedWidth >= minLeftWidth && parsedWidth <= maxLeftWidth) {
          setLeftWidth(parsedWidth);
        }
      }
    }
  }, [minLeftWidth, maxLeftWidth]);

  // Save to localStorage when width changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('resizable-layout-width', leftWidth.toString());
    }
  }, [leftWidth, isHydrated]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Clamp the width between min and max
    const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth));
    setLeftWidth(clampedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts for quick layout adjustments
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + [ for smaller left panel
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        setLeftWidth(prev => Math.max(minLeftWidth, prev - 5));
      }
      // Ctrl/Cmd + ] for larger left panel  
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        setLeftWidth(prev => Math.min(maxLeftWidth, prev + 5));
      }
      // Ctrl/Cmd + \ for 50/50 split
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setLeftWidth(50);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [minLeftWidth, maxLeftWidth]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full"
    >
      {/* Left Panel */}
      <div 
        className="h-full relative"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Draggable Splitter */}
      <div
        className={`
          relative w-1 bg-gray-700 hover:bg-cyan-400 cursor-col-resize transition-all duration-200
          ${isDragging ? 'bg-cyan-400 shadow-cyan-400/50 shadow-lg' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Splitter Visual Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`
            w-0.5 h-8 rounded-full transition-all duration-200
            ${isDragging ? 'bg-white h-12' : 'bg-gray-500 opacity-50'}
          `}></div>
        </div>
        
        {/* Grip Dots */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col space-y-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`
                w-1 h-1 rounded-full transition-all duration-200
                ${isDragging ? 'bg-white scale-110' : 'bg-gray-500 opacity-60'}
              `}
            />
          ))}
        </div>
        
        {/* Expanded Hit Area */}
        <div className="absolute inset-y-0 -left-3 -right-3 cursor-col-resize"></div>
        
        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-400 text-black px-3 py-2 rounded-lg text-xs font-bold shadow-lg border border-cyan-300 mt-8">
            <div className="flex items-center space-x-2">
              <span>{Math.round(leftWidth)}%</span>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <span>{Math.round(100 - leftWidth)}%</span>
            </div>
          </div>
        )}
        
        {/* Hover Tooltip */}
        {!isDragging && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none mt-8">
            Drag to resize
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div 
        className="h-full relative"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
} 