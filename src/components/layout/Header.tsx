import React, { useRef } from 'react';
import { useData } from '../../context/DataContext';
import {
  Activity,
  Upload,
  RefreshCw,
  Download,
  Menu,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    dataset,
    loading,
    activeTab,
    handleFileUpload,
    reloadDefaultDataset,
    exportCurrentView,
    activeDemoFilterCount,
    activeCbcFilterCount
  } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const isDemoSheet = ['demographics', 'infographic', 'geographic'].includes(activeTab);
  const activeFilters = isDemoSheet ? activeDemoFilterCount : activeCbcFilterCount;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile menu toggle + Brand Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                    ICMR Healthcare Analytics
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Dataset
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                  Demographics & Complete Blood Count (CBC) Clinical Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions (Data source, Upload, Reload, Export) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Filter Pill */}
            {activeFilters > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                {activeFilters} Active {activeFilters === 1 ? 'Filter' : 'Filters'}
              </span>
            )}

            {/* Hidden File Input for Excel Replacement */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={onFileInputChange}
              className="hidden"
            />

            {/* Replace / Upload Dataset Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Replace dataset with your own Excel file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Upload Excel</span>
            </button>

            {/* Reload Original Dataset */}
            <button
              type="button"
              onClick={reloadDefaultDataset}
              disabled={loading}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1"
              title="Reload default TEST DATA SET.xlsx"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Reset Data</span>
            </button>

            {/* Export Current View */}
            <button
              type="button"
              onClick={() => exportCurrentView('csv')}
              disabled={loading || !dataset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              title="Export currently filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
