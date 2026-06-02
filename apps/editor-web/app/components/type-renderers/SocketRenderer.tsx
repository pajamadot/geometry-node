import React from 'react';
import { Handle, Position } from 'reactflow';
import { TypeRendererProps, TYPE_METADATA } from './types';

interface SocketRendererProps extends TypeRendererProps {
  children?: React.ReactNode; // Widget content
}

export const SocketRenderer: React.FC<SocketRendererProps> = ({
  id,
  name,
  type,
  isConnected,
  isInput,
  isParameter,
  children,
  onValueChange
}) => {
  const metadata = TYPE_METADATA[type];
  const handleId = isInput ? `${id}-in` : `${id}-out`;
  const position = isInput ? Position.Left : Position.Right;

  // Get socket size based on metadata
  const getSocketSize = () => {
    switch (metadata.size) {
      case 'small': return '10px';
      case 'large': return '18px';
      default: return '14px';
    }
  };

  // Get socket shape styles
  const getSocketShape = () => {
    const size = getSocketSize();
    const baseStyle = {
      width: size,
      height: size,
      zIndex: 10, // Always on top
      opacity: 1 // Always visible
    };

    switch (metadata.shape) {
      case 'diamond':
        return {
          ...baseStyle,
          // Create a diamond using CSS that's naturally centered
         borderRadius: '2px'
        };
      case 'square':
        return {
          ...baseStyle,
          borderRadius: '2px'
        };
      default:
        return {
          ...baseStyle,
          borderRadius: '50%'
        };
    }
  };

  if (isInput) {
    // Input pattern: PIN → LABEL → WIDGET (when unwired) or PIN → LABEL (when wired)
    return (
      <div className="flex items-center gap-2">
        {/* Pin: Show for inputs, but not for parameters */}
        {!isParameter && (
          <Handle
            type="target"
            position={position}
            id={handleId}
            className={`${metadata.className} border-2 border-white cursor-pointer`}
            style={{
              backgroundColor: metadata.color,
              ...getSocketShape()
            }}
          />
        )}
        
        {/* Spacing - increased from w-2 to w-4 */}
        <div className="w-4" />
        
        {/* Label */}
        <div className="text-xs text-gray-400 flex-shrink-0 w-16">
          {name}
        </div>
        
        {/* Spacing */}
        <div className="w-2" />
        
        {/* Widget (show when not connected, or always for select/enum types) */}
        {(!isConnected || type === 'select' || type === 'enum') && (
          <div className="flex-1">
            {children}
          </div>
        )}
      </div>
    );
  } else {
    // Output pattern: LABEL → PIN
    return (
      <div className="flex items-center justify-end gap-2">
        {/* Label */}
        <div className="text-xs text-gray-400 flex-shrink-0 w-16 text-right">
          {name}
        </div>
        
        {/* Spacing - increased from w-2 to w-4 */}
        <div className="w-4" />
        
        {/* Pin */}
        <Handle
          type="source"
          position={position}
          id={handleId}
          className={`${metadata.className} border-2 border-white cursor-pointer`}
          style={{
            backgroundColor: metadata.color,
            ...getSocketShape()
          }}
        />
      </div>
    );
  }
}; 