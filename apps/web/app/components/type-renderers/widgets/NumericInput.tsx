import React, { useState, useRef } from 'react';

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

          </div>
        )}
      </div>


    </div>
  );
};

export default NumericInput;