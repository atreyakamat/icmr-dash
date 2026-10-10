import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Ingesting & Normalizing Healthcare Analytics Data...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-teal-600">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight mb-1">
        Loading ICMR Healthcare Dataset
      </h3>
      <p className="text-xs text-slate-500 max-w-sm">
        {message}
      </p>
    </div>
  );
};
