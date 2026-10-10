import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subValue?: string | number;
  icon: LucideIcon;
  variant?: 'teal' | 'blue' | 'indigo' | 'amber' | 'rose' | 'slate';
  tooltip?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badge?: {
    text: string;
    color: 'teal' | 'blue' | 'amber' | 'rose' | 'slate';
  };
}

const variantStyles = {
  teal: {
    iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    border: 'border-slate-200 hover:border-teal-300',
    accent: 'text-teal-600'
  },
  blue: {
    iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    border: 'border-slate-200 hover:border-sky-300',
    accent: 'text-sky-600'
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    border: 'border-slate-200 hover:border-indigo-300',
    accent: 'text-indigo-600'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    border: 'border-slate-200 hover:border-amber-300',
    accent: 'text-amber-600'
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    border: 'border-slate-200 hover:border-rose-300',
    accent: 'text-rose-600'
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200 hover:border-slate-300',
    accent: 'text-slate-700'
  }
};

const badgeColors = {
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  blue: 'bg-sky-50 text-sky-700 border-sky-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  subValue,
  icon: Icon,
  variant = 'teal',
  tooltip,
  trend,
  badge
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      title={tooltip}
      className={`bg-white rounded-xl p-4 sm:p-5 border ${styles.border} shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between relative group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {subValue && (
              <span className="text-sm font-medium text-slate-500">
                / {subValue}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${styles.iconBg} transition-transform group-hover:scale-105 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-1">
        {subtitle && (
          <span className="text-slate-500 truncate max-w-[200px]" title={subtitle}>
            {subtitle}
          </span>
        )}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full font-medium border text-[11px] ${badgeColors[badge.color]}`}>
            {badge.text}
          </span>
        )}
        {trend && (
          <span className={`font-semibold ml-auto ${trend.isPositive ? 'text-emerald-600' : 'text-slate-600'}`}>
            {trend.value} <span className="text-slate-400 font-normal">{trend.label || ''}</span>
          </span>
        )}
      </div>
    </div>
  );
};
