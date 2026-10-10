import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'blue' | 'purple' | 'amber' | 'rose' | 'emerald' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
      } ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
