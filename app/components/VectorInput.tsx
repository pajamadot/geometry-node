'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import NumberInput from './NumberInput';

interface VectorInputProps {
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (value: { x: number; y: number; z: number }) => void;
  nodeId: string;
  baseName: string; // e.g., "position", "rotation", "scale"
  hasConnections: { x: boolean; y: boolean; z: boolean };
  liveValues?: { x?: number; y?: number; z?: number };
  step?: number;
  className?: string;
}

export default function VectorInput({
  label,
  value,
  onChange,
  nodeId,
  baseName,
  hasConnections,
  liveValues,
  step = 0.1,
  className = ""
}: VectorInputProps) {
  // BLENDER BEHAVIOR: Alt+click on handle to disconnect
  const handleClick = (component: 'x' | 'y' | 'z') => (event: React.MouseEvent) => {
    if (event.altKey && hasConnections[component]) {
      event.preventDefault();
      event.stopPropagation();
      
      const handleId = `${baseName}-${component}-in`;
      
      // Dispatch custom event to remove connections from this handle
      const removeConnectionEvent = new CustomEvent('removeHandleConnection', {
        detail: { nodeId, handleId, handleType: 'target' }
      });
      window.dispatchEvent(removeConnectionEvent);
    }
  };
  const handleComponentChange = (component: 'x' | 'y' | 'z', newValue: number) => {
    onChange({
      ...value,
      [component]: newValue
    });
  };

  const hasAnyConnection = hasConnections.x || hasConnections.y || hasConnections.z;
  const handleId = `${baseName}-in`;

  return (
    <div className="flex items-center gap-2">
      {/* Single Input Pin */}
      <Handle
        type="target"
        position={Position.Left}
        id={handleId}
        className="vector-handle rounded-full"
        style={{
          width: '14px',
          height: '14px',
          zIndex: hasAnyConnection ? 1 : -1,
          opacity: hasAnyConnection ? 1 : 0
        }}
      />
      
      {/* Space */}
      <div className="w-2" />
      
      {/* X Y Z Input Boxes */}
      <div className="flex-1">
        {hasAnyConnection ? (
          <div className="w-full px-2 py-1 text-xs bg-cyan-600/20 border border-cyan-500 rounded text-cyan-300 text-center">
            {`(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`}
          </div>
        ) : (
          <div className="flex gap-1">
            {(['x', 'y', 'z'] as const).map(component => (
              <div key={component} className="flex-1">
                <NumberInput
                  value={value[component]}
                  onChange={(newValue) => handleComponentChange(component, newValue)}
                  step={step}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 