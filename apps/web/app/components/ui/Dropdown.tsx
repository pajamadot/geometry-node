import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string | LucideIcon | React.ComponentType<{ size?: number }>;
  description?: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  size = 'sm',
  variant = 'secondary',
  loading = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-w-[120px]',
    sm: 'px-3 py-2 text-xs min-w-[140px]',
    md: 'px-4 py-2 text-sm min-w-[160px]',
    lg: 'px-6 py-3 text-base min-w-[180px]'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20
  };

  // Variant configurations
  const variantClasses = {
    primary: 'bg-blue-600/80 hover:bg-blue-700/80 border-blue-500/30 text-white',
    secondary: 'bg-gray-600/80 hover:bg-gray-700/80 border-gray-500/30 text-white',
    ghost: 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/30 text-white'
  };

  const selectedOption = options.find(opt => opt.value === value);
  const finalIconSize = iconSizes[size];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleReactFlowClick = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    // Listen for both document clicks and ReactFlow interactions
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also listen for clicks on ReactFlow elements specifically
    const reactFlowElement = document.querySelector('.react-flow');
    if (reactFlowElement) {
      reactFlowElement.addEventListener('mousedown', handleReactFlowClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (reactFlowElement) {
        reactFlowElement.removeEventListener('mousedown', handleReactFlowClick);
      }
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderIcon = (option: DropdownOption) => {
    if (!option.icon) return null;
    
    if (typeof option.icon === 'string') {
      return <span>{option.icon}</span>;
    }
    
    const IconComponent = option.icon;
    return <IconComponent size={finalIconSize} />;
  };

  const handleOptionClick = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-between gap-2
          rounded-lg border backdrop-blur-sm
          font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          shadow-lg
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {loading ? (
            <>
              <svg
                className="animate-spin"
                width={finalIconSize}
                height={finalIconSize}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="truncate">Loading...</span>
            </>
          ) : selectedOption ? (
            <>
              {renderIcon(selectedOption)}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate text-gray-300">{placeholder}</span>
          )}
        </div>
        {!loading && (
          <ChevronDown 
            size={finalIconSize} 
            className={`transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl backdrop-blur-sm">
          <div>
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                disabled={option.disabled}
                className={`
                  w-full px-3 py-3 text-left flex items-center gap-2
                  text-gray-300 transition-colors
                  ${option.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-slate-700/50 hover:text-white'
                  }
                  ${option.value === value ? 'bg-slate-700/30 text-white' : ''}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {renderIcon(option)}
                <div className="flex-1 min-w-0">
                  <div className={`truncate ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                    {option.label}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export default Dropdown; 