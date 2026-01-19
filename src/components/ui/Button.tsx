import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl font-semibold',
    secondary:
      'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl font-semibold',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl font-semibold',
    ghost:
      'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 shadow-md font-medium',
    outline:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 font-medium',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
