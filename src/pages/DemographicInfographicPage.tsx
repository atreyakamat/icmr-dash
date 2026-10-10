import React from 'react';
import { useData } from '../context/DataContext';
import {
  computeDemographicKpis,
  getCategoryDistribution,
  computeSymptomFrequencies
} from '../data/analytics';
import { IconArray } from '../components/common/IconArray';
import { ProportionBar } from '../components/common/ProportionBar';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users,
  UserCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Heart,
  Activity,
  Stethoscope,
  Sparkles,
  MapPin,
  PieChart as PieIcon,
  Home,
  ShieldCheck
} from 'lucide-react';

export const DemographicInfographicPage: React.FC = () => {
  const { filteredDemographic, resetDemoFilters } = useData();
  const total = filteredDemographic.length;

  const kpis = React.useMemo(() => computeDemographicKpis(filteredDemographic), [filteredDemographic]);

  // Gender icon array groups
  const genderIconGroups = React.useMemo(() => [
    { label: 'Male Workforce', count: kpis.maleCount, percentage: kpis.malePct, color: '#0d9488' },
    { label: 'Female Patients', count: kpis.femaleCount, percentage: kpis.femalePct, color: '#ec4899' }
  ], [kpis]);

  // Locality icon array groups
  const localityDist = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'localityType', 4), [filteredDemographic]);
  const localityIconGroups = React.useMemo(() => {
    const colors: Record<string, string> = {
      'Construction Site': '#0d9488',
      'Housing': '#0284c7',
      'Rented Room': '#f59e0b',
      'Other': '#64748b'
    };
    return localityDist.map(item => ({
      label: item.name,
      count: item.count,
      percentage: item.percentage,
      color: colors[item.name] || '#94a3b8'
    }));
  }, [localityDist]);

  // Age group segments for proportion bar
  const ageSegments = React.useMemo(() => {
    const ageDist = getCategoryDistribution(filteredDemographic, 'ageGroup', 5);
    const colors: Record<string, string> = {
      '< 15 (Pediatric)': '#38bdf8',
      '15–24 (Youth)': '#0d9488',
      '25–44 (Young Adult)': '#0284c7',
      '45–64 (Middle Aged)': '#6366f1',
      '65+ (Senior)': '#f59e0b'
    };
    return ageDist.map(item => ({
      label: item.name,
      count: item.count,
      percentage: item.percentage,
      color: colors[item.name] || '#94a3b8'
    }));
  }, [filteredDemographic]);

  // Education segments
  const educationSegments = React.useMemo(() => {
    const eduDist = getCategoryDistribution(filteredDemographic, 'educationCategory', 6);
    const colors: Record<string, string> = {
      'No Formal': '#94a3b8',
      'Primary': '#38bdf8',
      'Middle School': '#0d9488',
      'Secondary': '#0284c7',
      'Higher Secondary': '#6366f1',
      'Graduate': '#8b5cf6',
      'Post Graduate': '#ec4899'
    };
    return eduDist.map(item => ({
      label: item.name,
      count: item.count,
      percentage: item.percentage,
      color: colors[item.name] || '#94a3b8'
    }));
  }, [filteredDemographic]);

  // Marital Status segments
  const maritalSegments = React.useMemo(() => {
    const mDist = getCategoryDistribution(filteredDemographic, 'maritalStatus', 3);
    return mDist.map(item => ({
      label: item.name,
      count: item.count,
      percentage: item.percentage,
      color: item.name === 'Married' ? '#0d9488' : item.name === 'Unmarried' ? '#0284c7' : '#94a3b8'
    }));
  }, [filteredDemographic]);

  // Top Occupations
  const topOccupations = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'occupation', 6), [filteredDemographic]);

  // Top Symptoms
  const symptoms = React.useMemo(() => computeSymptomFrequencies(filteredDemographic).slice(0, 5), [filteredDemographic]);

  // Origin States Top 4
  const topStates = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'normalizedState', 4), [filteredDemographic]);

  if (total === 0) {
    return <EmptyState onResetFilters={resetDemoFilters} title="No Demographic Records Match Filters" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Infographic Title Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              <PieIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Demographic Infographic Overview
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Population & Vulnerability Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Proportional representation of {total} malaria cases in Goa. Visual models illustrating social, occupational, and environmental determinants of transmission.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block font-medium">Screened Cohort</span>
            <span className="text-lg font-bold text-slate-900">{total} Patients</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            PV
          </div>
        </div>
      </div>

      {/* 1. Icon Array Models (Gender & Locality) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gender 100-Icon Array */}
        <IconArray
          title="Sex Representation (Per 100 Patients)"
          subtitle={`90.3% Male workforce concentration in seasonal migrant labor pool (n=${total})`}
          totalPopulation={total}
          groups={genderIconGroups}
        />

        {/* Locality 100-Icon Array */}
        <IconArray
          title="Living Environment & Locality Exposure"
          subtitle={`66.0% residing in active construction labor camps with high vector contact (n=${total})`}
          totalPopulation={total}
          groups={localityIconGroups}
        />

      </div>

      {/* 2. Structured Proportion Bars Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Proportional Population Stratification
          </h3>
          <p className="text-xs text-slate-500">
            Comparative multi-segment proportions across life stages, educational background, and family status.
          </p>
        </div>

        {/* Age Bands */}
        <ProportionBar
          title="Age Group Cohorts"
          subtitle="Stratified by epidemiological life stages"
          segments={ageSegments}
        />

        {/* Education Tiers */}
        <ProportionBar
          title="Educational Attainment"
          subtitle="Formal schooling level achieved"
          segments={educationSegments}
        />

        {/* Marital Status */}
        <ProportionBar
          title="Marital Status Distribution"
          subtitle="Family structure in migrant labor community"
          segments={maritalSegments}
        />
      </div>

      {/* 3. Visual Infographic Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Occupation Breakdown Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                Workforce Sectors
              </span>
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">Top 6</span>
            </div>
            <div className="space-y-2.5">
              {topOccupations.map((occ, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]">{occ.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{occ.count}</span>
                    <span className="text-slate-400 text-[11px]">({occ.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Manual and construction labour represent over 60% of all malaria presentations.
          </div>
        </div>

        {/* Clinical Presentation & Hospitalisation Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                Clinical Presentation
              </span>
              <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">Admission</span>
            </div>

            {/* Hospitalisation visual pill */}
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Hospitalised Patients:</span>
                <span className="text-base font-extrabold text-rose-700">{kpis.hospitalisedCount} ({kpis.hospitalisedPct}%)</span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-0.5">Required inpatient management in Goa medical facilities</p>
            </div>

            {/* Top Symptoms */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase">Prevalent Symptoms:</span>
              {symptoms.map((sym, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{sym.symptom}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sym.percentage}%` }} />
                    </div>
                    <span className="font-bold text-slate-900 text-[11px]">{sym.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Classical triad: Fever (98.6%), Chills (87.6%), and Severe Headache (77.8%).
          </div>
        </div>

        {/* Origin Migration Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Inter-State Migration Origin
              </span>
              <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">Origin</span>
            </div>
            <div className="space-y-2.5">
              {topStates.map((st, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{st.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{st.count}</span>
                    <span className="text-slate-400 text-[11px]">({st.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Eastern corridor (Bihar, UP, West Bengal, Jharkhand) accounts for 63.5% of migratory cases.
          </div>
        </div>

      </div>

    </div>
  );
};
