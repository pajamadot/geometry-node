'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PrimitiveNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';
import { CoreOperations, geometryDataToThreeJS } from '../utils/geometryBridge';

// ===========================
// BLENDER-STYLE NODE WRAPPER
// ===========================
// This demonstrates how nodes should be THIN wrappers
// that just handle UI and call core operations

interface FoundationalPrimitiveNodeProps extends NodeProps {
  data: PrimitiveNodeData;
}

export default function FoundationalPrimitiveNode({ data, id }: FoundationalPrimitiveNodeProps) {
  const { primitiveType, parameters, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleParameterChange = (key: string, value: number) => {
    const newParameters = { ...parameters, [key]: value };
    updateNodeData(id, { parameters: newParameters });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    return data.inputConnections && data.inputConnections[paramKey];
  };

  // ===========================
  // THIS IS THE KEY DIFFERENCE
  // ===========================
  // Instead of implementing geometry creation logic here,
  // we call the core operation functions!
  
  const createGeometry = () => {
    try {
      let geometryData;
      
      switch (primitiveType) {
        case 'cube':
          const cubeParams = parameters as any;
          // Call the CORE OPERATION - not inline logic!
          geometryData = CoreOperations.createCube({
            width: cubeParams.width || 1,
            height: cubeParams.height || 1,
            depth: cubeParams.depth || 1
          });
          break;
          
        case 'sphere':
          const sphereParams = parameters as any;
          // Call the CORE OPERATION
          geometryData = CoreOperations.createSphere({
            radius: sphereParams.radius || 1,
            widthSegments: sphereParams.widthSegments || 32,
            heightSegments: sphereParams.heightSegments || 16
          });
          break;
          
        default:
          // Fallback - create a simple cube
          geometryData = CoreOperations.createCube({
            width: 1, height: 1, depth: 1
          });
      }
      
      // Convert to Three.js for rendering (bridge function)
      return geometryDataToThreeJS(geometryData);
      
    } catch (error) {
      console.error('Foundational Primitive Node Error:', error);
      // Return fallback geometry
      const fallback = CoreOperations.createCube({ width: 0.1, height: 0.1, depth: 0.1 });
      return geometryDataToThreeJS(fallback);
    }
  };

  const renderParameters = () => {
    switch (primitiveType) {
      case 'cube':
        const cubeParams = parameters as any;
        return (
          <div className="space-y-1">
            <ParameterInput
              label="Width"
              value={cubeParams.width || 1}
              onChange={(value: number) => handleParameterChange('width', value)}
              handleId="width-in"
              nodeId={id}
              hasConnection={hasInputConnection('width')}
              step={0.1}
              min={0.1}
            />
            <ParameterInput
              label="Height"
              value={cubeParams.height || 1}
              onChange={(value: number) => handleParameterChange('height', value)}
              handleId="height-in"
              nodeId={id}
              hasConnection={hasInputConnection('height')}
              step={0.1}
              min={0.1}
            />
            <ParameterInput
              label="Depth"
              value={cubeParams.depth || 1}
              onChange={(value: number) => handleParameterChange('depth', value)}
              handleId="depth-in"
              nodeId={id}
              hasConnection={hasInputConnection('depth')}
              step={0.1}
              min={0.1}
            />
          </div>
        );

      case 'sphere':
        const sphereParams = parameters as any;
        return (
          <div className="space-y-1">
            <ParameterInput
              label="Radius"
              value={sphereParams.radius || 1}
              onChange={(value: number) => handleParameterChange('radius', value)}
              handleId="radius-in"
              nodeId={id}
              hasConnection={hasInputConnection('radius')}
              step={0.1}
              min={0.1}
            />
            <ParameterInput
              label="Segments"
              value={sphereParams.widthSegments || 32}
              onChange={(value: number) => handleParameterChange('widthSegments', Math.floor(value))}
              handleId="segments-in"
              nodeId={id}
              hasConnection={hasInputConnection('widthSegments')}
              step={1}
              min={3}
              max={128}
            />
          </div>
        );

      default:
        return (
          <div className="text-xs text-gray-400">
            Foundational primitive system active
          </div>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/50 rounded-lg min-w-[180px] overflow-hidden backdrop-blur-sm"
         style={{
           boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 12px 24px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(16, 185, 129, 0.3)'
         }}>
      {/* Header - Green to indicate foundational system */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-2">
        <h3 className="text-sm font-semibold text-white capitalize tracking-wide">
          🏗️ {label || primitiveType} (v2)
        </h3>
        <div className="text-xs text-emerald-100 opacity-75">
          Foundational System
        </div>
      </div>

      {/* Parameters */}
      <div className="p-3">
        {renderParameters()}
        
        {/* System Info */}
        <div className="mt-2 p-2 bg-emerald-900/20 border border-emerald-700/30 rounded text-xs">
          <div className="text-emerald-400 font-semibold mb-1">⚡ Core Operations</div>
          <div className="text-gray-300 text-xs space-y-0.5">
            <div>• Pure function calls</div>
            <div>• Attribute-based geometry</div>
            <div>• Easy to extend</div>
          </div>
        </div>
      </div>

      {/* Output Handle - Geometry (emerald to indicate v2 system) */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
      />
    </div>
  );
}

// ===========================
// BENEFITS OF THIS APPROACH
// ===========================

/*
🎯 BLENDER'S FOUNDATIONAL APPROACH BENEFITS:

1. **SEPARATION OF CONCERNS**
   - UI logic in nodes (this file)
   - Core logic in operations (geometryBridge.ts)
   - Clean, maintainable code

2. **EASY TESTING**
   - Test core operations independently
   - Test UI components independently
   - No mixed concerns

3. **REUSABILITY**
   - Core operations work outside of UI
   - Can be used in scripts, APIs, etc.
   - Not tied to React/node system

4. **EXTENSIBILITY**
   - Add new operation → Core function + Node wrapper
   - Takes 5 minutes instead of 50
   - No touching existing files

5. **DEBUGGING**
   - Issues are either UI or core logic
   - Easy to isolate problems
   - Clear error boundaries

6. **PERFORMANCE**
   - Core operations are optimized
   - No UI re-renders during computation
   - Cacheable pure functions

EXAMPLE: Adding a new "Pyramid" node:

1. Write core operation (10 lines):
   ```
   export function createPyramid(params) {
     // Pure geometry creation logic
     return GeometryFactory.fromVerticesAndFaces(vertices, faces);
   }
   ```

2. Create node wrapper (50 lines):
   ```
   export function PyramidNode({ data, id }) {
     // UI logic that calls CoreOperations.createPyramid()
   }
   ```

3. Register (1 line):
   ```
   registerOperation('pyramid', { execute: CoreOperations.createPyramid });
   ```

That's it! System extended with zero changes to existing code.

COMPARE TO CURRENT APPROACH:
- Touch 5+ files
- Mix UI and core logic
- Hard to test
- Difficult to extend
- Coupling issues

THE FOUNDATIONAL APPROACH IS SUPERIOR! 🚀
*/ 