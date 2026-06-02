import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: LucideIcon | React.ComponentType<{ size?: number }>;
  iconSize?: number;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'sm',
  icon: Icon,
  iconSize,
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  
  // Size configurations
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20
  };

  // Variant configurations with glassmorphism aesthetic
  const variantClasses = {
    primary: 'bg-blue-600/80 hover:bg-blue-700/80 border-blue-500/30 text-white shadow-lg',
    secondary: 'bg-gray-600/80 hover:bg-gray-700/80 border-gray-500/30 text-white shadow-lg',
    success: 'bg-green-600/80 hover:bg-green-700/80 border-green-500/30 text-white shadow-lg',
    warning: 'bg-amber-600/80 hover:bg-amber-700/80 border-amber-500/30 text-white shadow-lg',
    danger: 'bg-red-600/80 hover:bg-red-700/80 border-red-500/30 text-white shadow-lg',
    info: 'bg-cyan-600/80 hover:bg-cyan-700/80 border-cyan-500/30 text-white shadow-lg',
    ghost: 'bg-transparent hover:bg-white/10 border-white/20 text-white'
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    rounded-lg border backdrop-blur-sm 
    font-medium transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed 
    disabled:hover:bg-opacity-80
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
    ${fullWidth ? 'w-full' : ''}
  `;

  const focusClasses = {
    primary: 'focus:ring-blue-500/50',
    secondary: 'focus:ring-gray-500/50',
    success: 'focus:ring-green-500/50',
    warning: 'focus:ring-amber-500/50',
    danger: 'focus:ring-red-500/50',
    info: 'focus:ring-cyan-500/50',
    ghost: 'focus:ring-white/50'
  };

  const finalIconSize = iconSize || iconSizes[size];

  return (
    <button
      ref={ref}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${focusClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
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
      ) : Icon ? (
        <Icon size={finalIconSize} />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 