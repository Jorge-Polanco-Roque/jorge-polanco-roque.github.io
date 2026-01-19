import type { StockLevel } from '../../types';

interface BadgeProps {
  variant: StockLevel | 'info' | 'success' | 'warning' | 'error' | 'default';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variants = {
    critical: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-50',
    low: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-50',
    normal: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-50',
    out: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50',
    info: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-50',
    success: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-50',
    warning: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-50',
    error: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-50',
    default: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
