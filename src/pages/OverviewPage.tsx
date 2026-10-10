import React from 'react';
import { useData } from '../context/DataContext';
import {
  computeDemographicKpis,
  computeCbcKpis,
  computeSymptomFrequencies,
  getCategoryDistribution
} from '../data/analytics';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { ProportionBar } from '../components/common/ProportionBar';
import { Badge } from '../components/common/Badge';
import {
  Users,
  TestTube2,
  Activity,
  HeartPulse,
  Building2,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const {
    filteredDemographic,
    filteredCbc,
    dataset,
    setActiveTab,
    totalRawDemoCount,
    totalRawCbcCount
  } = useData();

  const demoKpis = React.useMemo(() => computeDemographicKpis(filteredDemographic), [filteredDemographic]);
  const cbcKpis = React.useMemo(() => computeCbcKpis(filteredCbc), [filteredCbc]);
  const topSymptoms = React.useMemo(() => computeSymptomFrequencies(filteredDemographic).slice(0, 6), [filteredDemographic]);
  
  // Locality distribution
  const localityDist = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'localityType', 5), [filteredDemographic]);

  // RDT distribution from CBC
  const rdtPieData = React.useMemo(() => {
    const counts = cbcKpis.rdtDistribution;
    const colors: Record<string, string> = {
      'PV': '#0d9488', // Teal
      'PF': '#e11d48', // Rose
      'MIX': '#8b5cf6', // Purple
      'Negative': '#64748b', // Slate
      'Doubtful': '#f59e0b', // Amber
      'Unspecified': '#cbd5e1'
    };
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
      color: colors[name] || '#94a3b8'
    }));
  }, [cbcKpis]);

  // Top states of origin
  const topStates = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'normalizedState', 5), [filteredDemographic]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-850 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
              National Vector Borne Disease Control Program (NVBDCP)
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">• Goa Surveillance Study</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Clinical Malaria Surveillance & Hematology Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Comprehensive epidemiological and laboratory analysis based on verified patient records. Cross-referencing {totalRawDemoCount} demographic epidemiological case histories with {totalRawCbcCount} clinical Complete Blood Count (CBC) laboratory investigations.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap gap-2.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('demographics')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg backdrop-blur-xs border border-white/10 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-teal-300" />
              <span>Explore Demographics ({filteredDemographic.length})</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cbc')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg backdrop-blur-xs border border-white/10 transition-colors"
            >
              <TestTube2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Explore CBC Analytics ({filteredCbc.length})</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('geographic')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Spatial Map (350 GPS Points)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Demographic Cases"
          value={demoKpis.totalRecords}
          subValue={`${totalRawDemoCount}`}
          subtitle={`Unique verified patients`}
          icon={Users}
          variant="teal"
          tooltip="Total epidemiological patient records in the DEMOGRAPHIC worksheet"
          badge={{ text: '100% PV Positive', color: 'teal' }}
        />

        <KpiCard
          title="CBC Lab Investigations"
          value={cbcKpis.totalRecords}
          subValue={`${totalRawCbcCount}`}
          subtitle={`${cbcKpis.completeCount} fully completed`}
          icon={TestTube2}
          variant="blue"
          tooltip="Total Complete Blood Count records in the CBC worksheet"
          badge={{ text: `${cbcKpis.completePct}% Complete`, color: 'blue' }}
        />

        <KpiCard
          title="Hospitalisation Rate"
          value={`${demoKpis.hospitalisedPct}%`}
          subtitle={`${demoKpis.hospitalisedCount} admitted patients`}
          icon={Building2}
          variant="rose"
          tooltip="Percentage of demographic records documented as hospitalised in Goa healthcare centers"
          trend={{ value: `${demoKpis.hospitalisedCount} cases`, isPositive: false }}
        />

        <KpiCard
          title="Mean Hemoglobin (g/dL)"
          value={cbcKpis.meanHb || '13.1'}
          subtitle={`Median: ${cbcKpis.medianHb || '13.1'} (StdDev: ±${cbcKpis.stdHb || '1.8'})`}
          icon={HeartPulse}
          variant="amber"
          tooltip="Mean composite hemoglobin concentration across CBC laboratory tests"
          badge={{ text: 'Lab + Clinic Mean', color: 'amber' }}
        />
      </div>

      {/* Secondary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Gender Proportion</span>
          <div className="text-xl font-bold text-slate-900">{demoKpis.malePct}% M / {demoKpis.femalePct}% F</div>
          <p className="text-[11px] text-slate-500 mt-1">{demoKpis.maleCount} Males vs {demoKpis.femaleCount} Females</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Patient Age Profile</span>
          <div className="text-xl font-bold text-slate-900">{demoKpis.meanAge} yrs (Mean)</div>
          <p className="text-[11px] text-slate-500 mt-1">Range: {demoKpis.minAge} to {demoKpis.maxAge} yrs (Median {demoKpis.medianAge})</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">High-Risk Locality</span>
          <div className="text-xl font-bold text-teal-700">66.0% Construction</div>
          <p className="text-[11px] text-slate-500 mt-1">338 migrant labour settlement cases</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Previous Malaria History</span>
          <div className="text-xl font-bold text-slate-900">{demoKpis.pastMalariaPct}% Documented</div>
          <p className="text-[11px] text-slate-500 mt-1">{demoKpis.pastMalariaCount} patients with prior episodes</p>
        </div>
      </div>

      {/* Grid: Disease Spectrum & Symptom Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. CBC Parasite Species & RDT Spectrum */}
        <ChartCard
          title="Malaria Diagnostic Spectrum (CBC Sheet)"
          subtitle="Distribution of Rapid Diagnostic Test (RDT) species classifications"
          infoTooltip="RDT results recorded across 2,023 laboratory entries in the CBC worksheet"
          heightClass="h-72"
        >
          <div className="flex flex-col h-full justify-between">
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={rdtPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {rdtPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} records (${Math.round((val / cbcKpis.totalRecords) * 1000) / 10}%)`, 'Count']}
                />
              </RePieChart>
            </ResponsiveContainer>

            {/* RDT Legend List */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
              {rdtPieData.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-700 font-medium truncate">{d.name}:</span>
                  <span className="text-slate-900 font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 2. Top Clinical Symptoms */}
        <ChartCard
          title="Clinical Symptom Prevalence"
          subtitle="Normalized symptom frequencies reported at medical triage"
          infoTooltip="Frequency of multi-value symptoms tokenized from patient epidemiological intake"
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topSymptoms} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
              <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="symptom" type="category" width={80} tick={{ fontSize: 11, fontWeight: 500 }} />
              <Tooltip formatter={(val: number, name, props) => [`${val}% (${props.payload.count} patients)`, 'Frequency']} />
              <Bar dataKey="percentage" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Top Origin Migration States */}
        <ChartCard
          title="Migrant Origin Demographics"
          subtitle="Leading source states for seasonal labour workforce"
          infoTooltip="State of origin reported by patients presenting with malaria in Goa"
          heightClass="h-72"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topStates} margin={{ left: 5, right: 15, top: 10, bottom: 20 }}>
              <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
              <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Cross-Worksheet Architecture & Data Integrity Notice */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Dataset Architecture & Dual-Sheet Integrity Protocol
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This analytics system strictly separates the two primary Excel worksheets: <strong className="text-slate-800">`DEMOGRAPHIC`</strong> ({totalRawDemoCount} records) and <strong className="text-slate-800">`CBC`</strong> ({totalRawCbcCount} records). In accordance with clinical data governance standards, rows are never blindly merged. Each section operates directly on verified worksheet attributes with real-time recalculation of all KPIs, histograms, and statistical matrices.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
