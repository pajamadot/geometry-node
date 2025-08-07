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
  axisLabel?: string;
  precision?: number;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 0.1,
  className = '',
  placeholder,
  showSlider = false,
  axisLabel,
  precision = 3,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startXRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(value);

  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(true);
    startXRef.current = e.clientX;
    startValueRef.current = value;

    window.addEventListener('pointermove', handlePointerMoveDrag);
    window.addEventListener('pointerup', handlePointerUpDrag);
  };

  const handlePointerMoveDrag = (e: PointerEvent) => {
    if (startXRef.current === null || startValueRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    let newValue = startValueRef.current + dx * step;
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(Number(newValue.toFixed(precision)));
  };

  const handlePointerUpDrag = () => {
    setDragging(false);
    startXRef.current = null;
    window.removeEventListener('pointermove', handlePointerMoveDrag);
    window.removeEventListener('pointerup', handlePointerUpDrag);
  };

  const handleInputClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleTextInputBlur = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
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

  const handleSliderChange = (values: number[]) => {
    if (values.length > 0) {
      onChange(values[0]);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
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

  const formatValue = (val: number) => {
    return step >= 1 ? Math.round(val).toString() : val.toFixed(precision);
  };

  const normalizedValue = Math.max(min, Math.min(max, value));
  const sliderValue = showSlider ? normalizedValue : 0;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Axis Label */}
      {axisLabel && (
        <div
          className={`text-xs font-medium flex-shrink-0 ${getAxisColor(axisLabel)} rounded px-1 py-0.5 text-center`}
          style={{ width: '20px', minWidth: '20px' }}
        >
          {axisLabel}
        </div>
      )}

      {/* Editable Input with Drag */}
      <div className="relative flex-shrink-0" style={{ width: '64px' }}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleTextInputChange}
            onBlur={handleTextInputBlur}
            onKeyDown={handleTextInputKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-blue-400"
          />
        ) : (
          <div className="relative group">
            <input
              type="text"
              value={formatValue(value)}
              readOnly
              onClick={handleInputClick}
              onPointerDown={handlePointerDownDrag}
              className={`w-full px-2 py-1 text-xs border rounded text-center select-none cursor-ew-resize
                ${dragging ? 'bg-blue-900 border-blue-600 text-white' : 'bg-gray-700 border-gray-600 text-white'}
              `}
            />
            <div className="absolute right-0 top-0 bottom-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleIncrement}
                className="w-3 h-2.5 text-[8px] bg-gray-600 border-l border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white focus:outline-none"
                disabled={value >= max}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                className="w-3 h-2.5 text-[8px] bg-gray-600 border-l border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white focus:outline-none"
                disabled={value <= min}
              >
                ▼
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Optional Slider */}
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

export default NumericInput;