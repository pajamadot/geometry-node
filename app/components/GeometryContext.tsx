'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as THREE from 'three';
import { Node, Edge } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';
import { compileNodeGraph, createDefaultMaterial } from '../utils/nodeCompiler';
import { useTime } from './TimeContext';
import { useLogging } from './LoggingContext';

interface GeometryContextValue {
  compiledGeometry: THREE.BufferGeometry | null;
  material: THREE.Material;
  compileNodes: (nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number, isTimeUpdate?: boolean) => void;
  isCompiling: boolean;
  error: string | null;
  liveParameterValues: Record<string, Record<string, any>>;
}

const GeometryContext = createContext<GeometryContextValue | null>(null);

interface GeometryProviderProps {
  children: ReactNode;
}

export function GeometryProvider({ children }: GeometryProviderProps) {
  const [compiledGeometry, setCompiledGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [material] = useState<THREE.Material>(() => createDefaultMaterial());
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveParameterValues, setLiveParameterValues] = useState<Record<string, Record<string, any>>>({});

  
  // Track previous geometry for disposal
  const prevGeometryRef = React.useRef<THREE.BufferGeometry | null>(null);
  
  // Debounce compilation to prevent excessive WebGL calls
  const compilationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const compileNodes = useCallback((nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number, isTimeUpdate = false) => {
    // Clear any pending compilation
    if (compilationTimeoutRef.current) {
      clearTimeout(compilationTimeoutRef.current);
    }
    
    // Use shorter debounce for time updates to enable real-time animation
    // But only if there are actually time nodes in the graph
    const hasTimeNodes = nodes.some(node => node.data.type === 'time');
    const debounceTime = (isTimeUpdate && hasTimeNodes) ? 8 : 50; // 8ms for time with time nodes, 50ms otherwise
    compilationTimeoutRef.current = setTimeout(() => {
      setIsCompiling(true);
      setError(null);

      try {
        const result = compileNodeGraph(nodes, edges, currentTime || 0, frameRate || 30, undefined);
        
        if (result.success) {
          // Get the compiled geometry from the result
          const geometry = (result as any).compiledGeometry as THREE.BufferGeometry;
          const liveValues = (result as any).liveParameterValues || {};
          
          // Update live parameter values
          setLiveParameterValues(liveValues);
          
          if (geometry) {
            // Dispose previous geometry to prevent memory leaks
            if (prevGeometryRef.current && prevGeometryRef.current !== geometry) {
              prevGeometryRef.current.dispose();
            }
            
            prevGeometryRef.current = geometry;
            setCompiledGeometry(geometry);
            setError(null);
          } else {
            const errorMsg = 'No geometry was produced by compilation';
            setError(errorMsg);
          }
        } else {
          setError(result.error || 'Unknown compilation error');
          setCompiledGeometry(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown compilation error';
        setError(errorMsg);
        setCompiledGeometry(null);
      } finally {
        setIsCompiling(false);
      }
    }, debounceTime);
      }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (compilationTimeoutRef.current) {
        clearTimeout(compilationTimeoutRef.current);
      }
      if (prevGeometryRef.current) {
        prevGeometryRef.current.dispose();
      }
      material.dispose();
    };
  }, [material]);

  const value: GeometryContextValue = {
    compiledGeometry,
    material,
    compileNodes,
    isCompiling,
    error,
    liveParameterValues,
  };

  return (
    <GeometryContext.Provider value={value}>
      {children}
    </GeometryContext.Provider>
  );
}

export function useGeometry() {
  const context = useContext(GeometryContext);
  if (!context) {
    console.error('useGeometry called outside of GeometryProvider');
    // Return a default context instead of throwing
    return {
      compiledGeometry: null,
      material: createDefaultMaterial(),
      compileNodes: () => {},
      isCompiling: false,
      error: 'Geometry context not available',
      liveParameterValues: {}
    };
  }
  return context;
} 