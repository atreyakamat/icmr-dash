import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { FilterBar } from './components/layout/FilterBar';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { OverviewPage } from './pages/OverviewPage';
import { DemographicsPage } from './pages/DemographicsPage';
import { CbcAnalyticsPage } from './pages/CbcAnalyticsPage';
import { DemographicInfographicPage } from './pages/DemographicInfographicPage';
import { GeographicPage } from './pages/GeographicPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';

const DashboardContent: React.FC = () => {
  const { activeTab, loading, error, reloadDefaultDataset } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl max-w-md">
          <h3 className="text-base font-bold text-rose-800 mb-2">Error Loading Healthcare Dataset</h3>
          <p className="text-xs text-rose-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={reloadDefaultDataset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Retry Loading Default Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Application Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* Global Dynamic Filter Bar (hidden on Data Quality tab) */}
          {activeTab !== 'quality' && <FilterBar />}

          {/* Active View Module */}
          <div className="w-full">
            {activeTab === 'overview' && <OverviewPage />}
            {activeTab === 'demographics' && <DemographicsPage />}
            {activeTab === 'cbc' && <CbcAnalyticsPage />}
            {activeTab === 'infographic' && <DemographicInfographicPage />}
            {activeTab === 'geographic' && <GeographicPage />}
            {activeTab === 'explorer' && <DataExplorerPage />}
            {activeTab === 'quality' && <DataQualityPage />}
          </div>

          {/* Clinical Footer Notice */}
          <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>
              ICMR National Healthcare Demographics & CBC Analytics System • Built for Public Health Intelligence
            </p>
            <p className="text-[11px] text-slate-400/80 mt-1">
              Data source: TEST DATA SET.xlsx • Separation of DEMOGRAPHIC (513) & CBC (2,023) records maintained
            </p>
          </footer>

        </main>

      </div>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
};

export default App;
