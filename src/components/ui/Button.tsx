import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white hover:from-terracotta-600 hover:to-coral-600 focus:ring-terracotta-500 active:from-terracotta-700 active:to-coral-700 shadow-md hover:shadow-lg',
      secondary:
        'bg-white border-2 border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50 focus:ring-terracotta-500 active:bg-terracotta-100',
      outline:
        'border-2 border-terracotta-600 text-terracotta-600 hover:bg-terracotta-50 focus:ring-terracotta-500 active:bg-terracotta-100',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-terracotta-300 active:bg-gray-200',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

    return (
      <button ref={ref} disabled={disabled || loading} className={classes} {...props}>
        {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
