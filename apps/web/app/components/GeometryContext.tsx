'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import * as pc from 'playcanvas';
import { Node, Edge } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';
import { compileNodeGraph, createDefaultMaterial } from '../utils/nodeCompiler';
import { graphCompiler, CompiledGraph } from '../utils/graphCompiler';
import { useTime } from './TimeContext';
import { useLogging } from './LoggingContext';
import { EnhancedGeometryData } from '../utils/builders/GeometryBuilder';

interface GeometryContextValue {
  compiledGeometry: EnhancedGeometryData | null;
  material: pc.StandardMaterial;
  compileNodes: (nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number, isTimeUpdate?: boolean) => void;
  isCompiling: boolean;
  error: string | null;
  liveParameterValues: Record<string, Record<string, any>>;
  performanceStats: {
    compilationCount: number;
    executionCount: number;
    lastCompilationTime: number;
    lastExecutionTime: number;
    totalExecutionTime: number;
  };
}

const GeometryContext = createContext<GeometryContextValue | null>(null);

interface GeometryProviderProps {
  children: ReactNode;
}

export function GeometryProvider({ children }: GeometryProviderProps) {
  const [compiledGeometry, setCompiledGeometry] = useState<EnhancedGeometryData | null>(null);
  const [material] = useState<pc.StandardMaterial>(() => createDefaultMaterial());
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveParameterValues, setLiveParameterValues] = useState<Record<string, Record<string, any>>>({});
  
  // Track previous geometry for cleanup if necessary
  const prevGeometryRef = React.useRef<EnhancedGeometryData | null>(null);
  
  // Debounce compilation
  const compilationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Cache compiled graph
  const compiledGraphRef = useRef<CompiledGraph | null>(null);
  const lastGraphHashRef = useRef<string>('');
  
  // Performance monitoring
  const performanceRef = useRef({
    compilationCount: 0,
    executionCount: 0,
    lastCompilationTime: 0,
    lastExecutionTime: 0,
    totalExecutionTime: 0
  });

  const compileNodes = useCallback((nodes: Node<GeometryNodeData>[], edges: Edge[], currentTime?: number, frameRate?: number, isTimeUpdate = false) => {
    if (compilationTimeoutRef.current) {
      clearTimeout(compilationTimeoutRef.current);
    }
    
    const currentGraphHash = generateGraphHash(nodes, edges);
    const needsRecompilation = currentGraphHash !== lastGraphHashRef.current;
    
    const hasTimeNodes = nodes.some(node => node.data.type === 'time');
    const debounceTime = (isTimeUpdate && hasTimeNodes) ? 2 : 50;
    
    compilationTimeoutRef.current = setTimeout(() => {
      setIsCompiling(true);
      setError(null);

      try {
        let compiledGraph = compiledGraphRef.current;
        
        if (needsRecompilation || !compiledGraph) {
          const compileStart = performance.now();
          // console.log(`📦 Graph structure changed, recompiling...`);
          
          compiledGraph = graphCompiler.compileGraph(nodes, edges);
          compiledGraphRef.current = compiledGraph;
          lastGraphHashRef.current = currentGraphHash;
          
          const compileTime = performance.now() - compileStart;
          performanceRef.current.compilationCount++;
          performanceRef.current.lastCompilationTime = compileTime;
        }
        
        if (compiledGraph) {
          const executeStart = performance.now();
          
          const result = graphCompiler.executeGraph(
            compiledGraph,
            currentTime || 0,
            frameRate || 30,
            isTimeUpdate
          );
          
          const executeTime = performance.now() - executeStart;
          performanceRef.current.executionCount++;
          performanceRef.current.lastExecutionTime = executeTime;
          performanceRef.current.totalExecutionTime += executeTime;
          
          if (result.success && result.finalGeometry) {
            const geometry = result.finalGeometry as EnhancedGeometryData;
            
            setLiveParameterValues(result.liveParameterValues);
            
            prevGeometryRef.current = geometry;
            setCompiledGeometry(geometry);
            setError(null);
            
            // Animation handling for materials would go here if implemented
            
          } else {
            setError(result.error || 'Graph execution failed');
            setCompiledGeometry(null);
            console.error('❌ Execution failed:', result.error);
          }
        }
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown compilation error';
        setError(errorMsg);
        setCompiledGeometry(null);
        console.error('💥 Compilation/execution crashed:', err);
      } finally {
        setIsCompiling(false);
      }
    }, debounceTime);
  }, []);

  const generateGraphHash = (nodes: Node<GeometryNodeData>[], edges: Edge[]): string => {
    const nodeData = nodes.map(n => ({
      id: n.id,
      type: n.data.type,
      parameters: n.data.parameters
    }));
    
    const edgeData = edges.map(e => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    }));

    return JSON.stringify({ nodes: nodeData, edges: edgeData });
  };
  
  React.useEffect(() => {
    return () => {
      if (compilationTimeoutRef.current) {
        clearTimeout(compilationTimeoutRef.current);
      }
      // Material cleanup handled by PlayCanvas usually or manual destroy
      // if (material) material.destroy(); 
    };
  }, [material]);

  const value: GeometryContextValue = {
    compiledGeometry,
    material,
    compileNodes,
    isCompiling,
    error,
    liveParameterValues,
    performanceStats: performanceRef.current
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
    return {
      compiledGeometry: null,
      material: createDefaultMaterial(),
      compileNodes: () => {},
      isCompiling: false,
      error: 'Geometry context not available',
      liveParameterValues: {},
      performanceStats: {
        compilationCount: 0,
        executionCount: 0,
        lastCompilationTime: 0,
        lastExecutionTime: 0,
        totalExecutionTime: 0
      }
    };
  }
  return context;
} 