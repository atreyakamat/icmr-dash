import React from 'react';
import { useData, ActiveTab } from '../../context/DataContext';
import {
  LayoutDashboard,
  Users,
  TestTube2,
  PieChart,
  MapPin,
  TableProperties,
  ShieldAlert,
  FileSpreadsheet,
  Calendar,
  X,
  Database
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    dataset,
    filteredDemographic,
    filteredCbc,
    totalRawDemoCount,
    totalRawCbcCount
  } = useData();

  const navItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeVariant?: 'teal' | 'blue' | 'purple' | 'amber' | 'slate';
    sheetTag: 'ALL' | 'DEMOGRAPHIC' | 'CBC';
  }[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      description: 'Unified clinical summary & disease metrics',
      icon: LayoutDashboard,
      badge: 'Unified',
      badgeVariant: 'teal',
      sheetTag: 'ALL'
    },
    {
      id: 'demographics',
      label: 'Patient Demographics',
      description: 'Age, gender, occupation & health history',
      icon: Users,
      badge: `${filteredDemographic.length}/${totalRawDemoCount}`,
      badgeVariant: 'blue',
      sheetTag: 'DEMOGRAPHIC'
    },
    {
      id: 'cbc',
      label: 'CBC Clinical Analytics',
      description: 'RBC, WBC differential, platelets & labs',
      icon: TestTube2,
      badge: `${filteredCbc.length}/${totalRawCbcCount}`,
      badgeVariant: 'purple',
      sheetTag: 'CBC'
    },
    {
      id: 'infographic',
      label: 'Demographic Infographic',
      description: 'Visual icon arrays & proportion models',
      icon: PieChart,
      badge: 'Visuals',
      badgeVariant: 'teal',
      sheetTag: 'DEMOGRAPHIC'
    },
    {
      id: 'geographic',
      label: 'Geographic Analysis',
      description: 'Interactive map: Goa residences & native origins',
      icon: MapPin,
      badge: 'Dual Map',
      badgeVariant: 'amber',
      sheetTag: 'DEMOGRAPHIC'
    },
    {
      id: 'explorer',
      label: 'Data Explorer',
      description: 'Searchable, privacy-safe record grid',
      icon: TableProperties,
      badge: 'Table',
      badgeVariant: 'slate',
      sheetTag: 'ALL'
    },
    {
      id: 'quality',
      label: 'Data Quality & Audit',
      description: 'Missingness, anomalies & data dictionary',
      icon: ShieldAlert,
      badge: `${dataset?.qualityReport.issues.length || 0} Flags`,
      badgeVariant: 'amber',
      sheetTag: 'ALL'
    }
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-screen lg:h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header in mobile view */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
              ICMR
            </div>
            <span className="font-bold text-slate-800 text-sm">Healthcare Portal</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dashboard Modules
            </span>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 font-semibold ring-1 ring-teal-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div
                  className={`p-2 rounded-lg mt-0.5 transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-semibold truncate leading-tight">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border flex-shrink-0 ${
                          isActive
                            ? 'bg-white text-teal-700 border-teal-200 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-teal-700/80 font-normal' : 'text-slate-400 font-normal'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-teal-600 rounded-r" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dataset Metadata Box at Bottom of Sidebar */}
        <div className="p-3 m-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              Source Dataset
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-teal-100/60 text-teal-800 font-semibold rounded">
              {dataset?.sourceType === 'uploaded-xlsx' ? 'User Upload' : 'TEST DATA SET.xlsx'}
            </span>
          </div>

          <div className="space-y-1 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">DEMOGRAPHIC:</span>
              <span className="font-semibold text-slate-800">{totalRawDemoCount} records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CBC Clinical:</span>
              <span className="font-semibold text-slate-800">{totalRawCbcCount} records</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-400">
              <span>Loaded:</span>
              <span>{dataset?.loadedAt ? new Date(dataset.loadedAt).toLocaleTimeString() : 'Ready'}</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
