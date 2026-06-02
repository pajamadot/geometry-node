import React from 'react';
import { TypeRendererProps } from '../types';
import { ParameterLabel } from './ParameterLabel';
import NumericInput from './NumericInput';

interface NumericWidgetProps extends TypeRendererProps {
  min?: number;
  max?: number;
  step?: number;
  showSlider?: boolean;
}

export const NumericWidget: React.FC<NumericWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 0.1,
  showSlider = true
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
        showSlider={showSlider}
      />
    </div>
  );
}; 