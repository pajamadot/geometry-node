import React, { useState, useRef } from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  axisLabel?: string; // X, Y, Z, etc.
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  className = "",
  placeholder,
  axisLabel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleTextInputBlur = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
    setIsEditing(false);
  };

  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTextInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleInputClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const formatValue = (val: number) => {
    if (step >= 1) return Math.round(val).toString();
    if (step >= 0.1) return val.toFixed(1);
    return val.toFixed(3);
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (min !== undefined && newValue >= min) {
      onChange(newValue);
    }
  };

  const getAxisColor = (label: string) => {
    switch (label?.toUpperCase()) {
      case 'X':
        return 'bg-red-500 text-white';
      case 'Y':
        return 'bg-green-500 text-white';
      case 'Z':
        return 'bg-blue-500 text-white';
      case 'W':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Axis Label on the Left */}
      {axisLabel && (
        <div className={`text-xs font-medium flex-shrink-0 ${getAxisColor(axisLabel)} rounded px-1 py-0.5 text-center`} style={{ width: '20px', minWidth: '20px' }}>
          {axisLabel}
        </div>
      )}
      
      {/* Numeric Input with Left/Right Buttons */}
      <div className="relative flex-shrink-0 border border-gray-600 rounded bg-gray-700">
        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleTextInputChange}
              onBlur={handleTextInputBlur}
              onKeyDown={handleTextInputKeyDown}
              className="w-12 px-1 py-1 text-xs bg-transparent border-0 text-white focus:outline-none text-center"
            />
          </div>
        ) : (
          <div className="flex items-center">
            {/* Left Minus Button */}
            <button
              type="button"
              onClick={handleDecrement}
              className="px-1.5 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-gray-600"
              disabled={min !== undefined && value <= min}
            >
              −
            </button>
            
            {/* Center Input */}
            <input
              type="text"
              value={formatValue(value)}
              onClick={handleInputClick}
              readOnly
              className="w-12 px-1 py-1 text-xs bg-transparent border-0 text-white text-center cursor-pointer focus:outline-none"
            />
            
            {/* Right Plus Button */}
            <button
              type="button"
              onClick={handleIncrement}
              className="px-1.5 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-gray-600"
              disabled={max !== undefined && value >= max}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 