import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  const baseStyles =
    'bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6';
  const interactiveStyles = onClick
    ? 'cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all duration-300'
    : '';

  return (
    <div className={`${baseStyles} ${interactiveStyles} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
