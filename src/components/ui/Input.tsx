import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    const inputClasses = `
      block px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 focus:ring-offset-1
      disabled:bg-gray-100 disabled:cursor-not-allowed
      transition-shadow duration-200
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
      ${widthClass}
      ${className}
    `.trim();

    return (
      <div className={widthClass}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input ref={ref} id={inputId} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
