import React from 'react';
import { TypeRendererProps } from '../types';
import { NumericInput } from './NumericInput';

export const RotationWidget: React.FC<TypeRendererProps> = ({
  value,
  defaultValue,
  onValueChange
}) => {
  const currentValue = value ?? defaultValue ?? { x: 0, y: 0, z: 0 };

  const handleComponentChange = (component: string, newValue: number) => {
    const newRotation = { ...currentValue, [component]: newValue };
    onValueChange?.(newRotation);
  };

  const components = [
    { key: 'x', label: 'X°', min: -180, max: 180 },
    { key: 'y', label: 'Y°', min: -180, max: 180 },
    { key: 'z', label: 'Z°', min: -180, max: 180 }
  ];

  return (
    <div className="flex gap-1">
      {components.map(({ key, label, min, max }) => {
        const componentValue = currentValue[key] ?? 0;

        return (
          <NumericInput
            key={key}
            value={componentValue}
            onChange={(newValue) => handleComponentChange(key, newValue)}
            min={min}
            max={max}
            step={1}
            axisLabel={label}
          />
        );
      })}
    </div>
  );
}; 