import React from 'react';
import { TypeRendererProps } from '../types';

interface DropdownWidgetProps extends TypeRendererProps {
  options?: string[];
}

export const DropdownWidget: React.FC<DropdownWidgetProps> = ({
  value,
  defaultValue,
  onValueChange,
  options = []
}) => {
  const currentValue = value ?? defaultValue ?? (options[0] || '');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value);
  };

  // Debug logging
  console.log('DropdownWidget render:', { value, defaultValue, currentValue, options });

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none min-w-0"
      style={{ minWidth: '80px' }}
    >
      {options.length === 0 ? (
        <option value="">No options</option>
      ) : (
        options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))
      )}
    </select>
  );
}; 