'use client';

import React, { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useGeometry } from './GeometryContext';
import { useTime } from './TimeContext';
import ThreeErrorBoundary from './ThreeErrorBoundary';
import FallbackViewport from './FallbackViewport';

// Loading fallback component
function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-white">Loading 3D Scene...</div>
    </div>
  );
}

// Compiled geometry display
function CompiledGeometry() {
  const geometryContext = useGeometry();
  const { compiledGeometry, material, error, isCompiling } = geometryContext;
  const [geometryKey, setGeometryKey] = React.useState(0);

  // Force remount when geometry changes to ensure proper updates
  React.useEffect(() => {
    // console.log('🎭 CompiledGeometry received new geometry:', compiledGeometry);
    if (compiledGeometry) {
      setGeometryKey(prev => {
        const newKey = prev + 1;
        // console.log('🔑 Geometry key updated to:', newKey);
        return newKey;
      });
    }
  }, [compiledGeometry]);

  if (error) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  if (!compiledGeometry) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh 
      key={`compiled-geometry-${geometryKey}`}
      position={[0, 0, 0]} 
      geometry={compiledGeometry} 
      material={material}
      scale={isCompiling ? 0.98 : 1.0} // Subtle scale animation during compilation
    />
  );
}

// Scene setup with ambient cube map environment
function Scene() {
  return (
    <>
      {/* Enhanced lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      
      {/* Environment with ambient cube map */}
      <Environment 
        preset="sunset" // Nice warm ambient lighting
        background={false}
        blur={0.1}
      />
      
      {/* Simple grid - no fancy effects */}
      <Grid 
        position={[0, -0.5, 0]} 
        args={[10, 10]} 
        cellSize={1} 
        cellColor="#444444" 
        sectionColor="#666666" 
        fadeDistance={20}
        infiniteGrid={false} // Disable infinite grid to reduce memory
      />
      
      {/* Compiled geometry from node graph */}
      <CompiledGeometry />
    </>
  );
}

export default function ThreeViewport() {
  const [contextLost, setContextLost] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const geometryContext = useGeometry();
  const { isCompiling } = geometryContext;
  const { isPlaying } = useTime();
  const recoveryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastRecoveryTime = React.useRef<number>(0);
  const maxRecoveryAttempts = 3;
  const recoveryDelay = 5000; // 5 seconds between attempts

  // Check WebGL support once
  const checkWebGLSupport = useCallback(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const testContext = testCanvas.getContext('webgl', { failIfMajorPerformanceCaveat: false });
      
      if (!testContext) {
        console.warn('WebGL not supported');
        setWebglSupported(false);
        return false;
      }
      
      // Clean up test canvas immediately
      testCanvas.remove();
      setWebglSupported(true);
      return true;
    } catch (error) {
      console.error('WebGL support check failed:', error);
      setWebglSupported(false);
      return false;
    }
  }, []);

  // Simplified context loss handler - NO automatic recovery
  const handleContextLoss = useCallback((event: Event) => {
    const now = Date.now();
    
    // Prevent recovery loop by checking if we just attempted recovery
    if (now - lastRecoveryTime.current < recoveryDelay) {
      console.log('Context loss detected too soon after recovery - stopping recovery loop');
      setContextLost(true);
      setWebglSupported(false);
      return;
    }
    
    console.log('WebGL context lost');
    event.preventDefault();
    setContextLost(true);
  }, []);

  // Manual recovery only
  const handleManualRecovery = useCallback(() => {
    if (recoveryAttempts >= maxRecoveryAttempts) {
      console.log('Max recovery attempts reached, refreshing page');
      window.location.reload();
      return;
    }

    console.log(`Manual recovery attempt ${recoveryAttempts + 1}/${maxRecoveryAttempts}`);
    
    lastRecoveryTime.current = Date.now();
    setRecoveryAttempts(prev => prev + 1);
    setContextLost(false);
    
    // Clear any existing timeouts
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
  }, [recoveryAttempts, maxRecoveryAttempts]);

  // Minimal canvas setup - let R3F handle most of the context management
  const onCanvasCreated = useCallback((state: any) => {
    try {
      const canvas = state.gl.domElement;
      canvasRef.current = canvas;
      
      // Only add context loss listener - no automatic recovery
      canvas.addEventListener('webglcontextlost', handleContextLoss, false);
      
      console.log('Canvas created successfully');
      
      // Reset recovery attempts on successful creation
      setRecoveryAttempts(0);
      setContextLost(false);
    } catch (error) {
      console.error('Error in canvas creation:', error);
      setContextLost(true);
    }
  }, [handleContextLoss]);

  // Check WebGL support on mount only
  React.useEffect(() => {
    checkWebGLSupport();
  }, [checkWebGLSupport]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLoss);
      }
    };
  }, [handleContextLoss]);

  // WebGL not supported fallback
  if (!webglSupported) {
    return <FallbackViewport />;
  }

  // Context lost recovery UI
  if (contextLost) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800">
        <div className="text-center text-white p-6">
          <div className="text-orange-400 text-xl mb-4">⚠️ WebGL Context Lost</div>
          <div className="text-gray-300 mb-4">
            The 3D rendering context was lost. This usually happens due to graphics driver issues or browser memory pressure.
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Manual recovery prevents infinite recovery loops that can crash the browser.
          </div>
          {recoveryAttempts < maxRecoveryAttempts ? (
            <button
              onClick={handleManualRecovery}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Now ({maxRecoveryAttempts - recoveryAttempts} attempts left)
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page (Max attempts reached)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ThreeErrorBoundary>
        <Suspense fallback={<Loading />}>
          <div className="h-full w-full">
            <Canvas
              camera={{ 
                position: [5, 5, 5], 
                fov: 60,
                near: 0.1,
                far: 1000
              }}
              dpr={1} // Fixed DPR for stability
              shadows={false} // Disable shadows to reduce memory pressure
              gl={{ 
                // Enhanced settings for better environment rendering
                antialias: true,
                alpha: false,
                powerPreference: "default",
                stencil: false,
                preserveDrawingBuffer: false,
                failIfMajorPerformanceCaveat: false,
                toneMapping: THREE.ACESFilmicToneMapping
              }}
              onCreated={onCanvasCreated}
              onError={(error) => {
                console.error('Canvas error:', error);
                setContextLost(true);
              }}
              frameloop={(isCompiling || isPlaying) ? "always" : "demand"}
            >
              <Scene />
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                dampingFactor={0.05}
                enableDamping={true}
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
              />
            </Canvas>
          </div>
        </Suspense>
      </ThreeErrorBoundary>
    </div>
  );
} 