'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PrimitiveNodeData } from '../types/nodes';
import { useNodeContext } from '../components/NodeContext';
import ParameterInput from '../components/ParameterInput';

interface PrimitiveNodeProps extends NodeProps {
  data: PrimitiveNodeData;
}

export default function PrimitiveNode({ data, id }: PrimitiveNodeProps) {
  const { primitiveType, parameters, label } = data;
  const { updateNodeData } = useNodeContext();

  const handleParameterChange = (key: string, value: number) => {
    const newParameters = { ...parameters, [key]: value };
    updateNodeData(id, { parameters: newParameters });
  };

  // Check if parameter has an input connection
  const hasInputConnection = (paramKey: string) => {
    // This would be set by the parent component based on edges
    return data.inputConnections && data.inputConnections[paramKey];
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
              liveValue={data.liveParameterValues?.width}
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
              liveValue={data.liveParameterValues?.height}
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
              liveValue={data.liveParameterValues?.depth}
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
              liveValue={data.liveParameterValues?.radius}
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
              liveValue={data.liveParameterValues?.widthSegments}
              step={1}
              min={3}
              max={128}
            />
          </div>
        );

      case 'cylinder':
        const cylinderParams = parameters as any;
        return (
          <div className="space-y-1">
            <ParameterInput
              label="Radius"
              value={cylinderParams.radiusTop || 1}
              onChange={(value: number) => handleParameterChange('radiusTop', value)}
              handleId="radius-in"
              nodeId={id}
              hasConnection={hasInputConnection('radiusTop')}
              step={0.1}
              min={0}
            />
            <ParameterInput
              label="Height"
              value={cylinderParams.height || 1}
              onChange={(value: number) => handleParameterChange('height', value)}
              handleId="height-in"
              nodeId={id}
              hasConnection={hasInputConnection('height')}
              step={0.1}
              min={0.1}
            />
          </div>
        );

      default:
        return <div className="text-xs text-gray-400">Unknown primitive type</div>;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/50 rounded-lg min-w-[180px] overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-3 py-2">
        <h3 className="text-sm font-semibold text-white capitalize tracking-wide">
          {label || primitiveType}
        </h3>
      </div>

      {/* Parameters */}
      <div className="p-3">
        {renderParameters()}
      </div>

      {/* Output Handle - Geometry (Blender-style socket) */}
      <Handle
        type="source"
        position={Position.Right}
        id="geometry-out"
        className="geometry-handle rounded-full"
      />
    </div>
  );
} 