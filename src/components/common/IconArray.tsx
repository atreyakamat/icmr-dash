import React from 'react';
import { User, Users } from 'lucide-react';

interface IconArrayGroup {
  label: string;
  count: number;
  percentage: number;
  color: string; // Hex color
  textColor?: string;
}

interface IconArrayProps {
  title: string;
  subtitle?: string;
  totalPopulation: number;
  groups: IconArrayGroup[];
  totalIcons?: number; // Default 100 for percentage
}

export const IconArray: React.FC<IconArrayProps> = ({
  title,
  subtitle,
  totalPopulation,
  groups,
  totalIcons = 100
}) => {
  // Generate array of length totalIcons with appropriate colors
  const icons: { color: string; label: string }[] = [];
  let remaining = totalIcons;

  groups.forEach((g, idx) => {
    // Number of icons proportional to percentage
    const isLast = idx === groups.length - 1;
    const num = isLast ? remaining : Math.round((g.percentage / 100) * totalIcons);
    const count = Math.min(num, remaining);
    for (let i = 0; i < count; i++) {
      icons.push({ color: g.color, label: g.label });
    }
    remaining -= count;
  });

  // Fill any remaining with last color
  while (icons.length < totalIcons) {
    const last = groups[groups.length - 1];
    icons.push({ color: last ? last.color : '#94a3b8', label: last ? last.label : 'Other' });
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-card flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
          <Users className="w-4 h-4" />
        </div>
      </div>

      {/* Grid of 100 icons (10x10) */}
      <div className="my-3 grid grid-cols-10 sm:grid-cols-20 gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100 justify-items-center">
        {icons.map((item, i) => (
          <span
            key={i}
            title={`${item.label} (Representation: 1 icon ≈ ${Math.round(totalPopulation / totalIcons)} subjects)`}
            className="cursor-pointer transition-transform hover:scale-125 duration-150 inline-flex items-center justify-center"
          >
            <User
              className="w-3.5 h-3.5"
              style={{ color: item.color }}
            />
          </span>
        ))}
      </div>

      {/* Summary Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        {groups.map((g, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
            <span className="text-slate-600">{g.label}:</span>
            <span className="font-semibold text-slate-900">{g.percentage}%</span>
            <span className="text-slate-400 text-[11px]">({g.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
