import React from 'react';
import { TypeRendererProps } from '../types';
import NumericInput from './NumericInput';

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

  const handleIncrement = () => {
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      handleChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = currentValue - step;
    if (min === undefined || newValue >= min) {
      handleChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleDecrement}
        className="w-6 h-6 text-xs bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={min !== undefined && currentValue <= min}
      >
        -
      </button>
      
      <NumericInput
        value={currentValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
      />
      
      <button
        onClick={handleIncrement}
        className="w-6 h-6 text-xs bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={max !== undefined && currentValue >= max}
      >
        +
      </button>
    </div>
  );
}; 