import React from 'react';
import { TypeRendererProps } from '../types';
import { ParameterLabel } from './ParameterLabel';
import { NumericInput } from './NumericInput';

interface NumericWidgetProps extends TypeRendererProps {
  min?: number;
  max?: number;
  step?: number;
}

export const NumericWidget: React.FC<NumericWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 0.1
}) => {
  const currentValue = value ?? defaultValue ?? 0;

  const handleChange = (newValue: number) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <NumericInput
        value={currentValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}; 