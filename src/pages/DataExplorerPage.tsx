import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  TableProperties,
  Search,
  Download,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  X
} from 'lucide-react';
import { DemographicRecord, CbcRecord } from '../data/types';
import { exportToCsv } from '../data/excelLoader';

export const DataExplorerPage: React.FC = () => {
  const {
    dataset,
    filteredDemographic,
    filteredCbc,
    totalRawDemoCount,
    totalRawCbcCount
  } = useData();

  const [selectedSheet, setSelectedSheet] = useState<'DEMOGRAPHIC' | 'CBC'>('DEMOGRAPHIC');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(false);
  const [columnVisibilityMenuOpen, setColumnVisibilityMenuOpen] = useState<boolean>(false);

  // Demographic columns definition
  const demoColumns = [
    { key: 'id', label: 'Patient ID', visible: true, isSensitive: false },
    { key: 'status', label: 'Status', visible: true, isSensitive: false },
    { key: 'rdt', label: 'RDT Result', visible: true, isSensitive: false },
    { key: 'collectionDate', label: 'Date', visible: true, isSensitive: false },
    { key: 'collectionPlace', label: 'Health Center', visible: true, isSensitive: false },
    { key: 'age', label: 'Age (Yrs)', visible: true, isSensitive: false },
    { key: 'gender', label: 'Gender', visible: true, isSensitive: false },
    { key: 'occupation', label: 'Occupation', visible: true, isSensitive: false },
    { key: 'localityType', label: 'Locality Type', visible: true, isSensitive: false },
    { key: 'normalizedState', label: 'Origin State', visible: true, isSensitive: false },
    { key: 'bloodGroup', label: 'Blood Group', visible: true, isSensitive: false },
    { key: 'hbCount', label: 'HB (g/dL)', visible: true, isSensitive: false },
    { key: 'hospitalised', label: 'Admitted', visible: true, isSensitive: false },
    { key: 'preExistingIllness', label: 'Pre-existing', visible: true, isSensitive: false },
    { key: 'contact', label: 'Contact Number', visible: true, isSensitive: true },
    { key: 'currentAddress', label: 'Residential Address', visible: true, isSensitive: true }
  ];

  // CBC columns definition
  const cbcColumns = [
    { key: 'id', label: 'Test ID', visible: true, isSensitive: false },
    { key: 'status', label: 'Status', visible: true, isSensitive: false },
    { key: 'rdt', label: 'RDT Species', visible: true, isSensitive: false },
    { key: 'collectionDate', label: 'Date', visible: true, isSensitive: false },
    { key: 'collectionPlace', label: 'Health Center', visible: true, isSensitive: false },
    { key: 'sex', label: 'Sex', visible: true, isSensitive: false },
    { key: 'age', label: 'Age (Yrs)', visible: true, isSensitive: false },
    { key: 'hbFinal', label: 'HB Final (g/dL)', visible: true, isSensitive: false },
    { key: 'hbLab', label: 'HB Lab', visible: true, isSensitive: false },
    { key: 'totalWbc', label: 'Total WBC (/μL)', visible: true, isSensitive: false },
    { key: 'plateletCount', label: 'Platelets (/μL)', visible: true, isSensitive: false },
    { key: 'rbc', label: 'RBC (mil/μL)', visible: true, isSensitive: false },
    { key: 'pcv', label: 'PCV (%)', visible: true, isSensitive: false },
    { key: 'neutrophils', label: 'Neutrophil %', visible: true, isSensitive: false },
    { key: 'lymphocytes', label: 'Lymphocyte %', visible: true, isSensitive: false },
    { key: 'monocytes', label: 'Monocyte %', visible: true, isSensitive: false },
    { key: 'hospitalised', label: 'Admitted', visible: true, isSensitive: false },
    { key: 'normalizedState', label: 'Origin State', visible: true, isSensitive: false },
    { key: 'name', label: 'Patient Name', visible: true, isSensitive: true }
  ];

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    demoColumns.forEach(c => { initial[c.key] = true; });
    cbcColumns.forEach(c => { initial[c.key] = true; });
    return initial;
  });

  const activeColumns = selectedSheet === 'DEMOGRAPHIC' ? demoColumns : cbcColumns;
  const currentDataset = selectedSheet === 'DEMOGRAPHIC' ? filteredDemographic : filteredCbc;

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...currentDataset].sort((a: any, b: any) => {
      let v1 = a[sortField];
      let v2 = b[sortField];

      if (v1 === null || v1 === undefined) return 1;
      if (v2 === null || v2 === undefined) return -1;

      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return sortDirection === 'asc' ? v1 - v2 : v2 - v1;
      }
      return sortDirection === 'asc'
        ? String(v1).localeCompare(String(v2))
        : String(v2).localeCompare(String(v1));
    });
  }, [currentDataset, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const exportData = sortedRecords.map((r: any) => {
      const obj: any = {};
      activeColumns.forEach(col => {
        if (visibleCols[col.key]) {
          if (col.isSensitive && !showSensitiveData) {
            obj[col.label] = '[PROTECTED]';
          } else {
            obj[col.label] = r[col.key] !== null && r[col.key] !== undefined ? r[col.key] : '';
          }
        }
      });
      return obj;
    });

    const filename = `${selectedSheet}_DataExplorer_${new Date().toISOString().split('T')[0]}`;
    exportToCsv(exportData, filename);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Explorer Controls Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-card flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Sheet Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => { setSelectedSheet('DEMOGRAPHIC'); setCurrentPage(1); setSortField('id'); }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                selectedSheet === 'DEMOGRAPHIC'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>DEMOGRAPHIC ({filteredDemographic.length}/{totalRawDemoCount})</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedSheet('CBC'); setCurrentPage(1); setSortField('id'); }}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                selectedSheet === 'CBC'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CBC ({filteredCbc.length}/{totalRawCbcCount})</span>
            </button>
          </div>
        </div>

        {/* Right: Privacy Toggle + Column Visibility + Export */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Sensitive Data Toggle */}
          <button
            type="button"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              showSensitiveData
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle masking for names, contacts, and personal addresses"
          >
            {showSensitiveData ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{showSensitiveData ? 'De-anonymized View' : 'Privacy-Protected View'}</span>
          </button>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColumnVisibilityMenuOpen(!columnVisibilityMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {columnVisibilityMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 space-y-1.5 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-600">
                  <span>Toggle Column Display</span>
                  <button type="button" onClick={() => setColumnVisibilityMenuOpen(false)}><X className="w-3.5 h-3.5" /></button>
                </div>
                {activeColumns.map(col => (
                  <label key={col.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key] !== false}
                      onChange={(e) => setVisibleCols(prev => ({ ...prev, [col.key]: e.target.checked }))}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Filtered View to CSV */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Table ({sortedRecords.length})</span>
          </button>

        </div>

      </div>

      {/* Main Interactive Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 border-b border-slate-200 text-slate-700 font-semibold select-none shadow-2xs">
              <tr>
                {activeColumns.filter(c => visibleCols[c.key] !== false).map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="p-3 hover:bg-slate-100 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === col.key ? 'text-teal-700' : 'text-slate-300'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedRecords.map((row: any, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-teal-50/40 transition-colors">
                  {activeColumns.filter(c => visibleCols[c.key] !== false).map(col => {
                    let val = row[col.key];

                    // Formatting & Sensitive masking
                    if (col.isSensitive && !showSensitiveData) {
                      val = col.key === 'contact' ? row.contact : col.key === 'name' ? row.name : 'Protected';
                    }

                    return (
                      <td key={col.key} className="p-3 whitespace-nowrap">
                        {val === null || val === undefined || val === '' || val === 'Unknown' ? (
                          <span className="text-slate-300">—</span>
                        ) : col.key === 'rdt' ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            val === 'PV' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                            val === 'PF' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            val === 'MIX' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {val}
                          </span>
                        ) : col.key === 'hospitalised' ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            val === 'Yes' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {val}
                          </span>
                        ) : typeof val === 'number' ? (
                          <span className="font-mono font-medium">{val.toLocaleString()}</span>
                        ) : (
                          <span>{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Stats Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded px-2 py-1 font-medium focus:outline-none"
            >
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
            <span>of <strong className="text-slate-900">{sortedRecords.length}</strong> matching records</span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
