import React, { useState } from 'react';
import { Info, Maximize2, Minimize2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  infoTooltip?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  heightClass?: string;
  className?: string;
  allowFullscreen?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  infoTooltip,
  children,
  headerAction,
  heightClass = 'h-72',
  className = '',
  allowFullscreen = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-card transition-all duration-200 flex flex-col ${
        isFullscreen
          ? 'fixed inset-4 z-50 p-6 overflow-auto shadow-2xl ring-1 ring-slate-900/10'
          : `p-4 sm:p-5 ${className}`
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight">
              {title}
            </h3>
            {infoTooltip && (
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title={infoTooltip}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
          {showInfo && infoTooltip && (
            <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-200">
              {infoTooltip}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerAction}
          {allowFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              title={isFullscreen ? 'Exit full screen' : 'Expand chart'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Chart Body */}
      <div className={`w-full min-h-[280px] flex-1 flex flex-col justify-center ${isFullscreen ? 'h-[calc(100vh-140px)] min-h-[450px]' : heightClass}`}>
        {children}
      </div>
    </div>
  );
};
