import React, { useState, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  showSlider?: boolean;
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
  showSlider = false,
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

  const handleSliderChange = (values: number[]) => {
    if (values.length > 0) {
      onChange(values[0]);
    }
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
    if (min === undefined || newValue >= min) {
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

  const normalizedValue = Math.max(min || 0, Math.min(max || 100, value));
  const sliderValue = showSlider && min !== undefined && max !== undefined ? normalizedValue : 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Axis Label on the Left */}
      {axisLabel && (
        <div className={`text-xs font-medium flex-shrink-0 ${getAxisColor(axisLabel)} rounded px-1 py-0.5 text-center`} style={{ width: '20px', minWidth: '20px' }}>
          {axisLabel}
        </div>
      )}
      
      {/* PlayCanvas-style Numeric Input */}
      <div className="relative flex-shrink-0" style={{ width: '64px' }}>
        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleTextInputChange}
              onBlur={handleTextInputBlur}
              onKeyDown={handleTextInputKeyDown}
              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none text-center"
            />
          </div>
        ) : (
          <div className="relative group">
            <input
              type="text"
              value={formatValue(value)}
              onClick={handleInputClick}
              readOnly
              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none text-center cursor-pointer"
            />
            {/* PlayCanvas-style Arrow Buttons */}
            <div className="absolute right-0 top-0 bottom-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleIncrement}
                className="w-3 h-2.5 text-[8px] bg-gray-600 border-l border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white focus:outline-none focus:bg-gray-500 focus:text-white transition-colors"
                disabled={max !== undefined && value >= max}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                className="w-3 h-2.5 text-[8px] bg-gray-600 border-l border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white focus:outline-none focus:bg-gray-500 focus:text-white transition-colors"
                disabled={min !== undefined && value <= min}
              >
                ▼
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Radix UI Slider (optional) */}
      {showSlider && min !== undefined && max !== undefined && (
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          max={max}
          min={min}
          step={step}
        >
          <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
            <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 bg-blue-500 border-2 border-blue-600 rounded-full hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            aria-label="Value"
          />
        </Slider.Root>
      )}
    </div>
  );
}; 