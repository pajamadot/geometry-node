'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function NumberInput({ 
  value, 
  onChange, 
  min, 
  max, 
  step = 0.1, 
  className = "",
  label,
  disabled = false
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExternalValue = useRef(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external value changes (but only when not focused)
  useEffect(() => {
    if (!isFocused && value !== lastExternalValue.current) {
      setLocalValue(value.toString());
      lastExternalValue.current = value;
    }
  }, [value, isFocused]);

  const validateAndClamp = useCallback((numValue: number): number => {
    if (isNaN(numValue)) return value;
    
    let clampedValue = numValue;
    if (min !== undefined) clampedValue = Math.max(min, clampedValue);
    if (max !== undefined) clampedValue = Math.min(max, clampedValue);
    
    return clampedValue;
  }, [value, min, max]);

  const commitValue = useCallback((inputValue: string) => {
    const numValue = parseFloat(inputValue);
    const validValue = validateAndClamp(numValue);
    
    // Only call onChange if the value actually changed
    if (validValue !== value) {
      onChange(validValue);
    }
    
    // Update local value to show the validated/clamped result
    setLocalValue(validValue.toString());
    lastExternalValue.current = validValue;
  }, [value, onChange, validateAndClamp]);

  // Debounced real-time update function
  const debouncedUpdate = useCallback((inputValue: string) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout for real-time updates
    debounceTimeoutRef.current = setTimeout(() => {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const validValue = validateAndClamp(numValue);
        if (validValue !== value) {
          onChange(validValue);
          lastExternalValue.current = validValue;
        }
      }
    }, 150); // 150ms debounce for smooth real-time updates
  }, [validateAndClamp, value, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Set local value immediately for responsive UI
    setLocalValue(inputValue);
    
    // Allow empty string, minus sign, decimal point for better UX while typing
    if (inputValue === '' || inputValue === '-' || inputValue === '.' || inputValue === '-.') {
      return;
    }
    
    // Trigger debounced real-time update
    debouncedUpdate(inputValue);
  }, [debouncedUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Commit value on Enter (immediate, no debounce)
    if (e.key === 'Enter') {
      e.preventDefault();
      // Clear any pending debounced update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      commitValue(localValue);
      inputRef.current?.blur();
    }
    
    // Reset on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      // Clear any pending debounced update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setLocalValue(value.toString());
      inputRef.current?.blur();
    }
  }, [localValue, commitValue, value]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Sync with current external value when focusing
    setLocalValue(value.toString());
    lastExternalValue.current = value;
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Clear any pending debounced update and commit immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    commitValue(localValue);
  }, [localValue, commitValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Use local value when focused, external value when not focused
  const formatDisplayValue = (val: number) => {
    // Show only 3 significant digits, remove trailing zeros
    const formatted = val.toFixed(3).replace(/\.?0+$/, '');
    return formatted === '' ? '0' : formatted;
  };
  
  const displayValue = isFocused ? localValue : formatDisplayValue(value);

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

  return (
    <div className="flex items-center justify-between relative group">
      {label && <label className="text-xs text-gray-300">{label}</label>}
      
      {/* Numeric Input with Left/Right Buttons */}
      <div className="flex items-center border border-gray-600 rounded bg-gray-700">
        {/* Left Minus Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && value <= min)}
          className="px-1.5 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-gray-600"
        >
          −
        </button>
        
        {/* Center Input */}
        <input
          ref={inputRef}
          type="number"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-12 px-1 py-1 text-xs bg-transparent text-white text-center focus:outline-none focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          step={step}
          min={min}
          max={max}
          autoComplete="off"
          spellCheck={false}
          title="Updates in real-time • Enter for immediate • Escape to reset"
        />
        
        {/* Right Plus Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="px-1.5 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-600 focus:outline-none focus:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-gray-600"
        >
          +
        </button>
      </div>
      
      {/* Subtle tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        Real-time • Enter ↵ • Esc ⎋
      </div>
    </div>
  );
} 