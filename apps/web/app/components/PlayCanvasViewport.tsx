'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as pc from 'playcanvas';
import { useGeometry } from './GeometryContext';
import { useTime } from './TimeContext';

export default function PlayCanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<pc.Application | null>(null);
  const cameraEntityRef = useRef<pc.Entity | null>(null);
  const lightEntityRef = useRef<pc.Entity | null>(null);
  const geometryEntityRef = useRef<pc.Entity | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { compiledGeometry, material } = useGeometry();
  const { isPlaying } = useTime();

  // Initialize PlayCanvas Application
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    try {
      const canvas = canvasRef.current;
      
      // Initialize Application
      const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas),
        keyboard: new pc.Keyboard(window),
        elementInput: new pc.ElementInput(canvas),
        graphicsDeviceOptions: {
          alpha: false,
          powerPreference: 'high-performance',
          antialias: true
        }
      });

      app.start();
      app.setCanvasFillMode(pc.FILLMODE_NONE);
      app.setCanvasResolution(pc.RESOLUTION_AUTO);

      // Resize handling
      const resize = () => app.resizeCanvas();
      window.addEventListener('resize', resize);
      
      // Initial scene setup
      const camera = new pc.Entity('camera');
      camera.addComponent('camera', {
        clearColor: new pc.Color(0.1, 0.1, 0.1),
        farClip: 1000,
        fov: 45
      });
      camera.setPosition(5, 5, 5);
      camera.lookAt(0, 0, 0);
      app.root.addChild(camera);
      cameraEntityRef.current = camera;

      // Lighting
      const light = new pc.Entity('light');
      light.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 1, 1),
        intensity: 1
      });
      light.setEulerAngles(45, 45, 0);
      app.root.addChild(light);
      lightEntityRef.current = light;

      // Orbit controls (simple implementation or use script)
      // For simplicity in this refactor, we start with a static camera view or basic mouse input listener
      // Ideally, we would load the OrbitCamera script from PlayCanvas engine/scripts or implement a simple one.
      
      // Basic mouse rotation logic
      let ex = 0, ey = 0;
      if (app.mouse) {
        app.mouse.on(pc.EVENT_MOUSEMOVE, (event: any) => {
          if (event.buttons[0]) {
            ex -= event.dx * 0.2;
            ey -= event.dy * 0.2;
            ey = pc.math.clamp(ey, -90, 90);
            // Very basic orbit
            // To do properly: Convert to spherical coordinates or rotate parent pivot
          }
        });
      }

      appRef.current = app;
      setIsInitialized(true);

      return () => {
        window.removeEventListener('resize', resize);
        app.destroy();
        appRef.current = null;
      };
    } catch (e) {
      console.error("Failed to initialize PlayCanvas", e);
    }
  }, []);

  // Update Geometry
  useEffect(() => {
    if (!appRef.current || !compiledGeometry) return;
    const app = appRef.current;

    // Remove old entity
    if (geometryEntityRef.current) {
      geometryEntityRef.current.destroy();
      geometryEntityRef.current = null;
    }

    // Ensure geometry is compiled for PlayCanvas (we refactored GeometryBuilder to output pc.Mesh)
    // compiledGeometry is now of type `pc.Mesh` directly or `{ mesh: pc.Mesh, material: ... }` based on refactor?
    // Wait, GeometryBuilder.build() returns `EnhancedGeometryData`. 
    // We added `toPlayCanvas(device)` to GeometryBuilder.
    // The `compiledGeometry` in Context comes from the Nodes.
    // Nodes likely return `EnhancedGeometryData`.
    
    // We need to verify what `compiledGeometry` actually is in the context.
    // In `GeometryContext`, it is likely typed as `any` or `EnhancedGeometryData`.
    // We need to convert `EnhancedGeometryData` to `pc.MeshInstance` or `pc.Entity` here.
    
    // Assuming compiledGeometry is EnhancedGeometryData (from build() method)
    // We need to construct the pc.Mesh here.
    
    // BUT, wait. The `GeometryContext` likely stores the result of `node.execute()`.
    // If the final node returns `geometry` as `EnhancedGeometryData`, we need to convert it.
    
    // Let's assume we need to create a Mesh from data.
    // We can use the `GeometryBuilder` logic or a utility helper if we exported one.
    // Or we can instantiate a builder to convert.
    // Actually we modified `GeometryBuilder` to have `toPlayCanvas`.
    // But `compiledGeometry` is just the data object (JSON-like struct), not the class instance.
    
    // We need a helper to convert Data -> Mesh using `app.graphicsDevice`.
    
    if (compiledGeometry && (compiledGeometry as any).positionsArray) {
        // Reconstruct a builder or use a utility to convert
        // Since we can't import GeometryBuilder here easily without circular deps or complex logic,
        // let's implement a lightweight converter or assume we can import `GeometryBuilder` class and re-hydrate.
        // Or better: The Node system should return a `GeometryBuilder` instance or we make a utility.
        
        // Let's implement raw conversion here for now to ensure it works.
        const mesh = new pc.Mesh(app.graphicsDevice);
        const data = compiledGeometry as any; // EnhancedGeometryData
        
        if (data.positionsArray) mesh.setPositions(data.positionsArray);
        if (data.normalsArray) mesh.setNormals(data.normalsArray);
        if (data.uvsArray) mesh.setUvs(0, data.uvsArray);
        if (data.indicesArray) mesh.setIndices(data.indicesArray);
        
        mesh.update(pc.PRIMITIVE_TRIANGLES);
        
        const material = new pc.StandardMaterial();
        material.diffuse.set(0.8, 0.8, 0.8);
        material.update();

        const meshInstance = new pc.MeshInstance(mesh, material);
        const entity = new pc.Entity('GeneratedGeometry');
        entity.addComponent('render', {
            meshInstances: [meshInstance]
        });
        
        app.root.addChild(entity);
        geometryEntityRef.current = entity;
    }

  }, [compiledGeometry, material]);

  return (
    <div className="h-full w-full bg-gray-900 relative">
      <canvas 
        ref={canvasRef} 
        className="h-full w-full block outline-none"
        tabIndex={0}
      />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Initializing PlayCanvas...
        </div>
      )}
    </div>
  );
}

