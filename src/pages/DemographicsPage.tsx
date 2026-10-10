import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  computeDemographicKpis,
  getCategoryDistribution,
  computeSymptomFrequencies,
  computeAgeGenderCrossTab,
  createHistogram
} from '../data/analytics';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Activity,
  History,
  Scale,
  Stethoscope,
  HeartPulse,
  Home
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const DemographicsPage: React.FC = () => {
  const { filteredDemographic, resetDemoFilters, totalRawDemoCount } = useData();

  const kpis = React.useMemo(() => computeDemographicKpis(filteredDemographic), [filteredDemographic]);

  // 1. Age Distribution Histogram
  const ageHistogram = React.useMemo(() => {
    const ages = filteredDemographic.map(r => r.age).filter((a): a is number => a !== null);
    return createHistogram(ages, 10, 0, 80);
  }, [filteredDemographic]);

  // 2. Gender Donut Data
  const genderData = React.useMemo(() => [
    { name: 'Male', value: kpis.maleCount, color: '#0d9488' },
    { name: 'Female', value: kpis.femaleCount, color: '#ec4899' }
  ], [kpis]);

  // 3. Age Group vs Gender Cross-Tab
  const ageGenderData = React.useMemo(() => computeAgeGenderCrossTab(filteredDemographic), [filteredDemographic]);

  // 4. Occupation Distribution (Horizontal Bar)
  const occupationData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'occupation', 8), [filteredDemographic]);

  // 5. Marital Status Distribution
  const maritalData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'maritalStatus', 5), [filteredDemographic]);

  // 6. Education Qualification Distribution
  const educationData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'educationCategory', 8), [filteredDemographic]);

  // 7. Locality Type Distribution
  const localityData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'localityType', 5), [filteredDemographic]);

  // 8. Family Size Distribution
  const familySizeData = React.useMemo(() => {
    const counts: Record<string, number> = { '1–2': 0, '3–4': 0, '5–6': 0, '7+': 0, 'Single/0': 0 };
    filteredDemographic.forEach(r => {
      if (r.familySize === null || r.familySize === 0) counts['Single/0']++;
      else if (r.familySize <= 2) counts['1–2']++;
      else if (r.familySize <= 4) counts['3–4']++;
      else if (r.familySize <= 6) counts['5–6']++;
      else counts['7+']++;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (filteredDemographic.length || 1)) * 1000) / 10
    }));
  }, [filteredDemographic]);

  // 9. Blood Group Distribution
  const bloodGroupData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'bloodGroup', 8), [filteredDemographic]);

  // 10. Previous Malaria History
  const malariaHistoryData = React.useMemo(() => [
    { name: 'No Previous Malaria', count: filteredDemographic.filter(r => r.pastMalariaHistory === false).length, color: '#10b981' },
    { name: 'Documented Prior Malaria', count: filteredDemographic.filter(r => r.pastMalariaHistory === true).length, color: '#e11d48' },
    { name: 'Unknown / Not Recorded', count: filteredDemographic.filter(r => r.pastMalariaHistory === null).length, color: '#94a3b8' }
  ], [filteredDemographic]);

  // 11. Collection Date Timeline (Monthly Grouping)
  const timelineData = React.useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    filteredDemographic.forEach(r => {
      if (r.collectionDate) {
        const monthKey = r.collectionDate.substring(0, 7); // YYYY-MM
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      }
    });
    return Object.entries(monthlyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [filteredDemographic]);

  // 12. Pre-Existing Illness Distribution
  const illnessData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'kindOfIllness', 6), [filteredDemographic]);

  // 13. Hospitalisation & Admission Days
  const hospData = React.useMemo(() => [
    { name: 'Hospitalised (Admitted)', value: kpis.hospitalisedCount, color: '#e11d48' },
    { name: 'Outpatient Care', value: filteredDemographic.length - kpis.hospitalisedCount, color: '#0d9488' }
  ], [kpis, filteredDemographic]);

  // 14. Symptom Frequencies
  const symptomsData = React.useMemo(() => computeSymptomFrequencies(filteredDemographic), [filteredDemographic]);

  // 15. BMI Categories
  const bmiData = React.useMemo(() => getCategoryDistribution(filteredDemographic, 'bmiCategory', 5), [filteredDemographic]);

  if (filteredDemographic.length === 0) {
    return <EmptyState onResetFilters={resetDemoFilters} title="No Demographic Records Match Filters" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            Patient Demographics & Epidemiological Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Sheet: <span className="font-semibold text-slate-700">`DEMOGRAPHIC`</span> ({filteredDemographic.length} of {totalRawDemoCount} records filtered)
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Cohort"
          value={kpis.totalRecords}
          subtitle={`Unique Patients: ${kpis.uniquePatients}`}
          icon={Users}
          variant="teal"
          badge={{ text: '100% PV Malaria', color: 'teal' }}
        />

        <KpiCard
          title="Sex Distribution"
          value={`${kpis.malePct}% Male`}
          subtitle={`${kpis.maleCount} M vs ${kpis.femaleCount} F (${kpis.femalePct}%)`}
          icon={UserCheck}
          variant="blue"
        />

        <KpiCard
          title="Age Statistics"
          value={`${kpis.meanAge} yrs`}
          subtitle={`Median: ${kpis.medianAge} | Range: ${kpis.minAge}–${kpis.maxAge}`}
          icon={Calendar}
          variant="indigo"
        />

        <KpiCard
          title="Hospitalisation Rate"
          value={`${kpis.hospitalisedPct}%`}
          subtitle={`${kpis.hospitalisedCount} patients admitted`}
          icon={Building2}
          variant="rose"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Previous Malaria</span>
          <div className="text-lg font-bold text-slate-900">{kpis.pastMalariaPct}% ({kpis.pastMalariaCount} cases)</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Reported prior infection history</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Pre-existing Illness</span>
          <div className="text-lg font-bold text-slate-900">{kpis.preExistingIllnessPct}% ({kpis.preExistingIllnessCount} cases)</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Hypertension, Diabetes, Thyroid</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Locality Concentration</span>
          <div className="text-lg font-bold text-teal-700">66.0% Construction Sites</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Major migrant workforce exposure</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Data Completeness</span>
          <div className="text-lg font-bold text-slate-900">{100 - kpis.missingCriticalPct}% Complete</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{kpis.missingCriticalCount} missing critical demographic keys</p>
        </div>
      </div>

      {/* Section 1: Demographics & Age-Gender Profile */}
      <div className="pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Age, Gender & Social Demographics
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Age Histogram */}
          <ChartCard
            title="Age Distribution (10-Year Decades)"
            subtitle="Patient frequency binned across decade age cohorts"
            infoTooltip="Age in years calculated from demographic intake forms"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Gender Donut */}
          <ChartCard
            title="Gender Distribution"
            subtitle="Ratio of male vs female presentation"
            infoTooltip="Verified gender distribution across demographic records"
            heightClass="h-72"
          >
            <div className="flex flex-col h-full justify-between">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} patients (${Math.round((val / filteredDemographic.length) * 1000) / 10}%)`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-around pt-2 border-t border-slate-100 text-xs">
                {genderData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 font-medium">{d.name}:</span>
                    <span className="font-bold text-slate-900">{d.value}</span>
                    <span className="text-slate-400">({Math.round((d.value / (filteredDemographic.length || 1)) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Chart 3: Age Group vs Gender Stacked Bar */}
          <ChartCard
            title="Age Cohort vs Gender Split"
            subtitle="Male vs Female distribution by life stage"
            infoTooltip="Cross-tabulation of age groups by gender"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageGenderData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="ageGroup" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Male" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* Section 2: Occupational & Socioeconomic Profile */}
      <div className="pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          2. Occupational, Education & Household Profiles
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 4: Occupation Distribution */}
          <ChartCard
            title="Top Patient Occupations"
            subtitle="Workforce categorization of malaria cases"
            infoTooltip="Occupations recorded during patient epidemiological intake"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={occupationData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 5: Education Qualification */}
          <ChartCard
            title="Education Level Attainment"
            subtitle="Literacy and formal schooling distribution"
            infoTooltip="Highest education qualification achieved by screened patients"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={educationData} margin={{ left: -10, right: 10, top: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 6: Locality Type Distribution */}
          <ChartCard
            title="Locality / Living Settlement Type"
            subtitle="Environmental living conditions and exposure risk"
            infoTooltip="Settlement environment where patient resides in Goa"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={localityData} margin={{ left: -10, right: 10, top: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* Section 3: Clinical Health History & Biological Indicators */}
      <div className="pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          3. Clinical Health History, Symptoms & Anthropometrics
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 7: Symptom Frequencies */}
          <ChartCard
            title="Symptom Profile at Admission"
            subtitle="Normalized clinical presenting symptoms"
            infoTooltip="Multi-value symptom frequency tokenized from triage notes"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={symptomsData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="symptom" type="category" width={85} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val}% (${props.payload.count} patients)`, 'Frequency']} />
                <Bar dataKey="percentage" fill="#e11d48" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 8: BMI Distribution */}
          <ChartCard
            title="Adult BMI Classification"
            subtitle="WHO nutritional classification (kg/m²)"
            infoTooltip="Calculated from patient weight (kg) and height (m)"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bmiData} margin={{ left: -10, right: 10, top: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 9: Blood Group Distribution */}
          <ChartCard
            title="Blood Group Distribution"
            subtitle="ABO / Rh blood typing breakdown"
            infoTooltip="ABO/Rh blood typing recorded during clinical workup"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bloodGroupData} margin={{ left: -10, right: 10, top: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* Section 4: Longitudinal Timeline & Hospitalisation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Chart 10: Collection Date Timeline */}
        <ChartCard
          title="Case Intake Longitudinal Trend"
          subtitle="Monthly volume of screened demographic cases"
          infoTooltip="Longitudinal case volume grouped by sample collection month"
          heightClass="h-64"
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number) => [`${val} cases`, 'Volume']} />
              <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 11: Pre-existing Illness Spectrum */}
        <ChartCard
          title="Pre-Existing Comorbidity Spectrum"
          subtitle="Documented chronic health conditions"
          infoTooltip="Underlying chronic health conditions reported by patients"
          heightClass="h-64"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={illnessData} layout="vertical" margin={{ left: 15, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val: number, name, props) => [`${val} patients (${props.payload.percentage}%)`, 'Count']} />
              <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

    </div>
  );
};
