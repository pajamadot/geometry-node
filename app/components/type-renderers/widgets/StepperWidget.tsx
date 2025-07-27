import React from 'react';
import { TypeRendererProps } from '../types';
import { NumericInput } from './NumericInput';

interface StepperWidgetProps extends TypeRendererProps {
  min?: number;
  max?: number;
  step?: number;
}

export const StepperWidget: React.FC<StepperWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1
}) => {
  const currentValue = value ?? defaultValue ?? 0;

  const handleChange = (newValue: number) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className="flex items-center">
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