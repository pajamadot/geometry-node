import React from 'react';
import { TypeRendererProps } from '../types';

export const TextWidget: React.FC<TypeRendererProps> = ({
  value,
  defaultValue,
  onValueChange
}) => {
  const currentValue = value ?? defaultValue ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
  };

  return (
    <input
      type="text"
      value={currentValue}
      onChange={handleChange}
      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
      placeholder="Enter text..."
    />
  );
}; 