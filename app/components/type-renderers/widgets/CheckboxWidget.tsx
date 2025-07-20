import React from 'react';
import { TypeRendererProps } from '../types';

export const CheckboxWidget: React.FC<TypeRendererProps> = ({
  value,
  defaultValue,
  onValueChange
}) => {
  const currentValue = value ?? defaultValue ?? false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.checked);
  };

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={currentValue}
        onChange={handleChange}
        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
      />
    </div>
  );
}; 