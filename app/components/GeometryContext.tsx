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
  compileNodes: (nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number) => void;
  isCompiling: boolean;
  error: string | null;
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
  const { addLog } = useLogging();
  
  // Track previous geometry for disposal
  const prevGeometryRef = React.useRef<THREE.BufferGeometry | null>(null);
  
  // Debounce compilation to prevent excessive WebGL calls
  const compilationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const compileNodes = useCallback((nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number) => {
    addLog('info', `Starting compilation with ${nodes.length} nodes and ${edges.length} edges`, 
      { nodeCount: nodes.length, edgeCount: edges.length }, 'compilation');
    
    // Clear any pending compilation
    if (compilationTimeoutRef.current) {
      clearTimeout(compilationTimeoutRef.current);
    }
    
    // Debounce compilation by 50ms for smooth real-time updates
    compilationTimeoutRef.current = setTimeout(() => {
      addLog('debug', 'Beginning node graph compilation...', null, 'compilation');
      setIsCompiling(true);
      setError(null);

      try {
        const result = compileNodeGraph(nodes, edges, currentTime || 0, frameRate || 30, addLog);
        
        if (result.success) {
          // Get the compiled geometry from the result
          const geometry = (result as any).compiledGeometry as THREE.BufferGeometry;
          if (geometry) {
            addLog('success', 'Geometry compilation successful', {
              vertices: geometry.attributes.position?.count || 0,
              faces: geometry.index ? geometry.index.count / 3 : 0,
              type: geometry.type
            }, 'compilation');
            
            // Dispose previous geometry to prevent memory leaks
            if (prevGeometryRef.current && prevGeometryRef.current !== geometry) {
              prevGeometryRef.current.dispose();
            }
            
            prevGeometryRef.current = geometry;
            setCompiledGeometry(geometry);
            setError(null);
          } else {
            const errorMsg = 'No geometry was produced by compilation';
            addLog('warning', errorMsg, null, 'compilation');
            setError(errorMsg);
          }
        } else {
          addLog('error', 'Compilation failed', { error: result.error }, 'compilation');
          setError(result.error || 'Unknown compilation error');
          setCompiledGeometry(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown compilation error';
        addLog('error', 'Compilation exception', { 
          error: errorMsg, 
          stack: err instanceof Error ? err.stack : undefined 
        }, 'compilation');
        setError(errorMsg);
        setCompiledGeometry(null);
      } finally {
        setIsCompiling(false);
      }
    }, 50);
  }, [addLog]);
  
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
    throw new Error('useGeometry must be used within a GeometryProvider');
  }
  return context;
} 