import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'gray' }) => {
  const colorStyles = {
    blue: 'bg-rose-100 text-rose-800 border-rose-200',
    green: 'bg-green-100 text-green-800 border-green-200 dark:border-emerald-800/50',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:border-amber-800/50',
    red: 'bg-red-100 text-red-800 border-red-200 dark:border-rose-800/50',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles[color]}`}>
      {children}
    </span>
  );
};

