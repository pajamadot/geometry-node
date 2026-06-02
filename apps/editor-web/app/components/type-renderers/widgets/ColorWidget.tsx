import React from 'react';
import { TypeRendererProps } from '../types';

export const ColorWidget: React.FC<TypeRendererProps> = ({
  value,
  defaultValue,
  onValueChange
}) => {
  const currentValue = value ?? defaultValue ?? '#ffffff';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={currentValue}
        onChange={handleChange}
        className="w-8 h-6 border border-gray-600 rounded cursor-pointer"
      />
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
        placeholder="#ffffff"
      />
    </div>
  );
}; 