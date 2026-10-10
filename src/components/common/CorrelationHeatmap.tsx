import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface CorrelationHeatmapProps {
  fields: string[];
  matrix: { x: string; y: string; correlation: number | null }[];
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ fields, matrix }) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: string; y: string; val: number | null } | null>(null);

  // Helper to get color based on r value
  const getCellColor = (r: number | null) => {
    if (r === null) return 'bg-slate-50 text-slate-300';
    if (r === 1.0) return 'bg-teal-600 text-white font-bold';
    
    // Positive correlations (Teal shades)
    if (r >= 0.7) return 'bg-teal-500 text-white font-semibold';
    if (r >= 0.4) return 'bg-teal-300 text-teal-950 font-medium';
    if (r >= 0.15) return 'bg-teal-100 text-teal-900';
    if (r > 0) return 'bg-teal-50 text-teal-800';

    // Negative correlations (Rose / Indigo shades)
    if (r <= -0.7) return 'bg-rose-600 text-white font-semibold';
    if (r <= -0.4) return 'bg-rose-400 text-white font-medium';
    if (r <= -0.15) return 'bg-rose-200 text-rose-950';
    return 'bg-rose-50 text-rose-800';
  };

  const getCellVal = (f1: string, f2: string) => {
    const item = matrix.find(m => m.x === f1 && m.y === f2);
    return item ? item.correlation : null;
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-semibold text-slate-500 w-24 text-[11px]">Parameter</th>
                {fields.map((f, i) => (
                  <th key={i} className="p-1.5 font-semibold text-slate-700 text-[11px] max-w-[70px] truncate" title={f}>
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((rowField, rowIdx) => (
                <tr key={rowIdx} className="border-t border-slate-100">
                  <td className="p-1.5 text-left font-medium text-slate-700 text-[11px] truncate max-w-[100px]" title={rowField}>
                    {rowField}
                  </td>
                  {fields.map((colField, colIdx) => {
                    const rVal = getCellVal(rowField, colField);
                    const colorClass = getCellColor(rVal);
                    return (
                      <td
                        key={colIdx}
                        onMouseEnter={() => setHoveredCell({ x: rowField, y: colField, val: rVal })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-2 border border-white cursor-pointer transition-all duration-150 ${colorClass}`}
                      >
                        {rVal !== null ? (rVal > 0 ? `+${rVal.toFixed(2)}` : rVal.toFixed(2)) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Footer & Note */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px]">Statistical correlation indicates linear association only; it does not establish causation.</span>
        </div>

        {/* Legend Scale */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-rose-600 font-medium">-1.0 (Neg)</span>
          <div className="w-20 h-2 rounded bg-gradient-to-r from-rose-500 via-slate-100 to-teal-500" />
          <span className="text-teal-700 font-medium">+1.0 (Pos)</span>
        </div>
      </div>
    </div>
  );
};
