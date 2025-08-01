import React from 'react';
import * as Label from '@radix-ui/react-label';

interface ParameterLabelProps {
  label: string;
  className?: string;
}

export const ParameterLabel: React.FC<ParameterLabelProps> = ({ 
  label, 
  className = "" 
}) => {
  return (
    <Label.Root 
      className={`text-xs text-gray-400 font-medium flex-shrink-0 ${className}`}
      style={{ width: '32px' }}
    >
      {label}
    </Label.Root>
  );
}; 