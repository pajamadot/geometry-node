'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import * as THREE from 'three';
import { Node, Edge } from 'reactflow';
import { GeometryNodeData } from '../types/nodes';
import { compileNodeGraph, compileNodeGraphOptimized, createDefaultMaterial } from '../utils/nodeCompiler';
import { graphCompiler, CompiledGraph } from '../utils/graphCompiler';
import { useTime } from './TimeContext';
import { useLogging } from './LoggingContext';

interface GeometryContextValue {
  compiledGeometry: THREE.BufferGeometry | null;
  material: THREE.Material;
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
  const [compiledGeometry, setCompiledGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [material] = useState<THREE.Material>(() => createDefaultMaterial());
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveParameterValues, setLiveParameterValues] = useState<Record<string, Record<string, any>>>({});

  
  // Track previous geometry for disposal
  const prevGeometryRef = React.useRef<THREE.BufferGeometry | null>(null);
  
  // Debounce compilation to prevent excessive WebGL calls
  const compilationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Cache the compiled graph structure
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
    // Clear any pending compilation
    if (compilationTimeoutRef.current) {
      clearTimeout(compilationTimeoutRef.current);
    }
    
    // Check if graph structure has changed
    const currentGraphHash = generateGraphHash(nodes, edges);
    const needsRecompilation = currentGraphHash !== lastGraphHashRef.current;
    
    // Use shorter debounce for time updates to enable real-time animation
    // But only if there are actually time nodes in the graph
    const hasTimeNodes = nodes.some(node => node.data.type === 'time');
    const debounceTime = (isTimeUpdate && hasTimeNodes) ? 2 : 50; // Even faster for time updates
    
    compilationTimeoutRef.current = setTimeout(() => {
      setIsCompiling(true);
      setError(null);

      try {
        let compiledGraph = compiledGraphRef.current;
        
        // COMPILATION PHASE: Only when graph structure changes
        if (needsRecompilation || !compiledGraph) {
          const compileStart = performance.now();
          console.log(`📦 Graph structure changed, recompiling...`);
          
          compiledGraph = graphCompiler.compileGraph(nodes, edges);
          compiledGraphRef.current = compiledGraph;
          lastGraphHashRef.current = currentGraphHash;
          
          const compileTime = performance.now() - compileStart;
          performanceRef.current.compilationCount++;
          performanceRef.current.lastCompilationTime = compileTime;
        }
        
        // EXECUTION PHASE: Always happens, but optimized for time updates
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
            const geometry = result.finalGeometry;
            
            // Update live parameter values
            setLiveParameterValues(result.liveParameterValues);
            
            // Dispose previous geometry to prevent memory leaks
            if (prevGeometryRef.current && prevGeometryRef.current !== geometry) {
              prevGeometryRef.current.dispose();
            }
            
            prevGeometryRef.current = geometry;
            setCompiledGeometry(geometry);
            setError(null);
            
            // Animate water materials if present
            const animateWaterMaterials = (time: number) => {
              const materials = [
                (geometry as any).material,
                ...(geometry.userData?.materials || [])
              ].filter(Boolean);
              
              materials.forEach(mat => {
                if (mat && (mat as any).isWaterMaterial && (mat as any).animateWater) {
                  (mat as any).animateWater(time * 0.001); // Convert to seconds
                }
                if (mat && (mat as any).isHologramMaterial && (mat as any).animateHologram) {
                  (mat as any).animateHologram(time * 0.001);
                }
                if (mat && (mat as any).isLavaMaterial && (mat as any).animateLava) {
                  (mat as any).animateLava(time * 0.001);
                }
              });
            };
            
            // Set up animation loop for water materials if needed
            const hasShaderMaterials = [
              (geometry as any).material,
              ...(geometry.userData?.materials || [])
            ].some(mat => mat && (
              (mat as any).isWaterMaterial || 
              (mat as any).isHologramMaterial || 
              (mat as any).isLavaMaterial
            ));
            
            if (hasShaderMaterials) {
              const animate = () => {
                animateWaterMaterials(Date.now());
                requestAnimationFrame(animate);
              };
              animate();
            }
            
            // Performance stats are now available through the context
            
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

  // Helper function to generate a hash of the graph structure
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
    // Return a default context instead of throwing
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