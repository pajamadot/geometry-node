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
    const debounceTime = (isTimeUpdate && hasTimeNodes) ? 8 : 50;
    
    // console.log('📅 Compilation requested:', {
    //   nodeCount: nodes.length,
    //   edgeCount: edges.length,
    //   isTimeUpdate,
    //   hasTimeNodes,
    //   debounceTime,
    //   currentTime: currentTime || 0
    // });
    
    compilationTimeoutRef.current = setTimeout(() => {
      // console.log('🔨 Starting compilation...');
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
            const hasWaterMaterials = [
              (geometry as any).material,
              ...(geometry.userData?.materials || [])
            ].some(mat => mat && (mat as any).isWaterMaterial);
            
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
            
            // console.log('✅ Compilation successful, geometry updated', {
            //   hasWaterMaterials,
            //   hasShaderMaterials,
            //   materialCount: (geometry.userData?.materials?.length || 0) + ((geometry as any).material ? 1 : 0)
            // });
          } else {
            const errorMsg = 'No geometry was produced by compilation';
            setError(errorMsg);
            console.error('❌', errorMsg);
          }
        } else {
          setError(result.error || 'Unknown compilation error');
          setCompiledGeometry(null);
          console.error('❌ Compilation failed:', result.error);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown compilation error';
        setError(errorMsg);
        setCompiledGeometry(null);
        console.error('💥 Compilation crashed:', err);
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