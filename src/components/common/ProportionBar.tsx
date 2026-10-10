import React from 'react';

export interface ProportionSegment {
  label: string;
  count: number;
  percentage: number;
  color: string; // Tailwind background class or hex
}

interface ProportionBarProps {
  title?: string;
  subtitle?: string;
  segments: ProportionSegment[];
  totalLabel?: string;
  showLegend?: boolean;
  height?: string;
}

export const ProportionBar: React.FC<ProportionBarProps> = ({
  title,
  subtitle,
  segments,
  showLegend = true,
  height = 'h-4'
}) => {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="w-full space-y-2">
      {(title || subtitle) && (
        <div className="flex items-baseline justify-between">
          {title && <span className="text-xs font-semibold text-slate-700">{title}</span>}
          {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
        </div>
      )}

      {/* Stacked bar */}
      <div className={`w-full ${height} rounded-md bg-slate-100 flex overflow-hidden border border-slate-200`}>
        {segments.map((seg, idx) => {
          if (seg.percentage <= 0) return null;
          return (
            <div
              key={idx}
              style={{
                width: `${seg.percentage}%`,
                backgroundColor: seg.color.startsWith('#') ? seg.color : undefined
              }}
              className={`${!seg.color.startsWith('#') ? seg.color : ''} h-full transition-all duration-300 relative group`}
              title={`${seg.label}: ${seg.count} (${seg.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Legend & Percentages */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color.startsWith('#') ? seg.color : undefined }}
              />
              <span className="text-slate-600 font-medium">{seg.label}:</span>
              <span className="font-semibold text-slate-900">{seg.count}</span>
              <span className="text-slate-400 text-[11px]">({seg.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
