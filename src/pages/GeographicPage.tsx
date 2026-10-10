import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { OpenSourceMapView } from '../components/maps/OpenSourceMapView';
import { getCategoryDistribution } from '../data/analytics';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyState } from '../components/common/EmptyState';
import { LocalityCluster } from '../data/geoPipeline';
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const GeographicPage: React.FC = () => {
  const { filteredDemographic, resetDemoFilters } = useData();

  const [selectedCluster, setSelectedCluster] = useState<LocalityCluster | null>(null);

  const currentCoordsCount = filteredDemographic.filter(r => r.currentCoordinates !== null).length;
  const nativeCoordsCount = filteredDemographic.filter(r => r.nativeCoordinates !== null).length;

  // State distribution
  const stateDist = useMemo(() => {
    return getCategoryDistribution(filteredDemographic, 'normalizedState', 8);
  }, [filteredDemographic]);

  // Goa Collection Health Centers
  const centersDist = useMemo(() => {
    return getCategoryDistribution(filteredDemographic, 'collectionPlace', 6);
  }, [filteredDemographic]);

  if (filteredDemographic.length === 0) {
    return <EmptyState onResetFilters={resetDemoFilters} title="No Records Match Geographic Filter" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-700" />
            Geographic Analysis & Spatial Epidemiology
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Powered by <strong className="text-slate-700">OpenStreetMap & Leaflet</strong> &bull; Zero API Key Required &bull; Goa & India Dual Views
          </p>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Mapped Goa Residences</span>
          <div className="text-2xl font-bold text-teal-700">{currentCoordsCount} GPS Points</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified North Goa coordinates</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Mapped Native Origins</span>
          <div className="text-2xl font-bold text-sky-700">{nativeCoordsCount} GPS Points</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across 18 Indian origin states</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Top Transmission Corridor</span>
          <div className="text-2xl font-bold text-slate-900">Bihar & UP</div>
          <p className="text-[11px] text-slate-400 mt-0.5">39.7% of all migrant cases</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Primary Triage Hub</span>
          <div className="text-2xl font-bold text-slate-900">Asilo NGDH</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Mapusa, North Goa District Hospital</p>
        </div>
      </div>

      {/* Open-Source Leaflet Map Component with Goa & India Switch */}
      <OpenSourceMapView
        records={filteredDemographic}
        selectedCluster={selectedCluster}
        onSelectCluster={setSelectedCluster}
      />

      {/* Regional Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* State Migration Distribution */}
        <ChartCard
          title="State-of-Origin Breakdown"
          subtitle="Top home states of seasonal migrant patients"
          infoTooltip="Patient origin state distribution recorded during epidemiological intake"
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stateDist} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
              <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Collection Centers in Goa */}
        <ChartCard
          title="Goa Health Facility Diagnostic Load"
          subtitle="Distribution of sample collection across health centers"
          infoTooltip="Hospitals and Primary Health Centers (PHCs) conducting screening in Goa"
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={centersDist} margin={{ left: -10, right: 10, top: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
              <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

    </div>
  );
};
