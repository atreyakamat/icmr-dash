import React from 'react';
import { FilterX, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Matching Records Found',
  message = 'Try adjusting or clearing your active filters to display records.',
  onResetFilters,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200 shadow-card">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {icon || <FilterX className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      )}
    </div>
  );
};
