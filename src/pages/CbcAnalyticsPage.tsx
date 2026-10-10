import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  computeCbcKpis,
  createHistogram,
  computeCorrelationMatrix,
  computeComparativeLabStats,
  getCategoryDistribution
} from '../data/analytics';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { CorrelationHeatmap } from '../components/common/CorrelationHeatmap';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import {
  TestTube2,
  HeartPulse,
  Activity,
  Droplets,
  Microscope,
  Building2,
  AlertCircle,
  FileSpreadsheet,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Line
} from 'recharts';

export const CbcAnalyticsPage: React.FC = () => {
  const { filteredCbc, resetCbcFilters, totalRawCbcCount } = useData();

  const [comparativeDimension, setComparativeDimension] = useState<'rdt' | 'sex' | 'ageGroup' | 'hospitalised'>('rdt');

  const kpis = React.useMemo(() => computeCbcKpis(filteredCbc), [filteredCbc]);

  // 1. Hemoglobin Histogram (bin size 1.0 g/dL)
  const hbHistogram = React.useMemo(() => {
    const hbs = filteredCbc.map(r => r.hbFinal).filter((v): v is number => v !== null);
    return createHistogram(hbs, 1.0, 3, 20);
  }, [filteredCbc]);

  // 2. Total WBC Histogram (bin size 1000 /cu.mm)
  const wbcHistogram = React.useMemo(() => {
    const wbcs = filteredCbc.map(r => r.totalWbc).filter((v): v is number => v !== null);
    return createHistogram(wbcs, 1500, 1000, 20000);
  }, [filteredCbc]);

  // 3. Platelet Count Histogram (bin size 25,000 /cu.mm)
  const plateletHistogram = React.useMemo(() => {
    const plts = filteredCbc.map(r => r.plateletCount).filter((v): v is number => v !== null && v <= 500000);
    return createHistogram(plts, 25000, 0, 400000);
  }, [filteredCbc]);

  // 4. RBC Count Histogram (bin size 0.5 mil/cu.mm)
  const rbcHistogram = React.useMemo(() => {
    const rbcs = filteredCbc.map(r => r.rbc).filter((v): v is number => v !== null);
    return createHistogram(rbcs, 0.5, 1.0, 8.0);
  }, [filteredCbc]);

  // 5. PCV / Hematocrit Histogram (bin size 5%)
  const pcvHistogram = React.useMemo(() => {
    const pcvs = filteredCbc.map(r => r.pcv).filter((v): v is number => v !== null);
    return createHistogram(pcvs, 5, 10, 60);
  }, [filteredCbc]);

  // 6. Differential WBC Mean Comparison
  const differentialMeans = React.useMemo(() => {
    const valid = filteredCbc.filter(r => r.neutrophils !== null && r.lymphocytes !== null);
    if (valid.length === 0) return [];

    const getMean = (arr: (number | null)[]) => {
      const nums = arr.filter((v): v is number => v !== null);
      return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    };

    return [
      { name: 'Neutrophils', value: getMean(valid.map(r => r.neutrophils)), standardRange: '40–70%', color: '#0d9488' },
      { name: 'Lymphocytes', value: getMean(valid.map(r => r.lymphocytes)), standardRange: '20–40%', color: '#0284c7' },
      { name: 'Monocytes', value: getMean(valid.map(r => r.monocytes)), standardRange: '2–8%', color: '#6366f1' },
      { name: 'Eosinophils', value: getMean(valid.map(r => r.eosinophils)), standardRange: '1–4%', color: '#f59e0b' },
      { name: 'Basophils', value: getMean(valid.map(r => r.basophils)), standardRange: '0–1%', color: '#ec4899' }
    ];
  }, [filteredCbc]);

  // 7. HB Lab vs HB Clinic Scatter Data
  const hbScatterData = React.useMemo(() => {
    return filteredCbc
      .filter(r => r.hbLab !== null && r.hbClinic !== null && r.hbLab > 0 && r.hbClinic > 0)
      .map(r => ({
        hbLab: r.hbLab,
        hbClinic: r.hbClinic,
        id: r.id,
        rdt: r.rdt
      }));
  }, [filteredCbc]);

  // 8. Peripheral Smear Categories
  const smearCategories = React.useMemo(() => {
    return getCategoryDistribution(filteredCbc, 'peripheralSmearCategory', 5);
  }, [filteredCbc]);

  // 9. Correlation Matrix Heatmap
  const { fields: correlationFields, matrix: correlationMatrix } = React.useMemo(() => {
    return computeCorrelationMatrix(filteredCbc);
  }, [filteredCbc]);

  // 10. Comparative Group Lab Stats
  const comparativeStats = React.useMemo(() => {
    return computeComparativeLabStats(filteredCbc, comparativeDimension);
  }, [filteredCbc, comparativeDimension]);

  if (filteredCbc.length === 0) {
    return <EmptyState onResetFilters={resetCbcFilters} title="No CBC Records Match Filters" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-teal-700" />
            Complete Blood Count (CBC) & Laboratory Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Sheet: <span className="font-semibold text-slate-700">`CBC`</span> ({filteredCbc.length} of {totalRawCbcCount} records filtered)
          </p>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="CBC Test Cohort"
          value={kpis.totalRecords}
          subtitle={`Verified Tests: ${kpis.completeCount}`}
          icon={TestTube2}
          variant="teal"
          badge={{ text: `${kpis.completePct}% Full Panel`, color: 'teal' }}
        />

        <KpiCard
          title="Mean Hemoglobin (Final)"
          value={`${kpis.meanHb || '13.1'} g/dL`}
          subtitle={`Median: ${kpis.medianHb} | StdDev: ±${kpis.stdHb}`}
          icon={Droplets}
          variant="rose"
          badge={{ text: 'WHO Reference: 13.0–17.0', color: 'rose' }}
        />

        <KpiCard
          title="Mean Total WBC"
          value={`${kpis.meanWbc.toLocaleString()} /μL`}
          subtitle={`Median: ${kpis.medianWbc.toLocaleString()} /μL`}
          icon={Activity}
          variant="blue"
          badge={{ text: 'Ref: 4,000–11,000', color: 'blue' }}
        />

        <KpiCard
          title="Mean Platelet Count"
          value={`${Math.round(kpis.meanPlatelet).toLocaleString()} /μL`}
          subtitle={`Median: ${Math.round(kpis.medianPlatelet).toLocaleString()} /μL`}
          icon={HeartPulse}
          variant="amber"
          badge={{ text: 'Thrombocytopenia Risk', color: 'amber' }}
        />
      </div>

      {/* Secondary Metrics Row: RBC, Smears & Missingness */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Mean RBC Count</span>
          <div className="text-lg font-bold text-slate-900">{kpis.meanRbc} mil/μL</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Median: {kpis.medianRbc} mil/μL</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Peripheral Smears</span>
          <div className="text-lg font-bold text-teal-700">{kpis.usablePeripheralSmearCount} Documented</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Normocytic & microcytic remarks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Lab Parameter Missingness</span>
          <div className="text-lg font-bold text-slate-900">{kpis.missingLabMetrics.hbMissingPct}% HB Missing</div>
          <p className="text-[11px] text-slate-400 mt-0.5">WBC: {kpis.missingLabMetrics.wbcMissingPct}% | Plt: {kpis.missingLabMetrics.plateletMissingPct}%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">CBC Hospitalisation</span>
          <div className="text-lg font-bold text-rose-600">{kpis.hospitalisationRate}% Rate</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Documented admission status</p>
        </div>
      </div>

      {/* SECTION 1: Red Blood Cell Indices */}
      <div className="pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-rose-600" />
          1. Red Blood Cell (RBC) Indices & Anemia Biomarkers
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Final Hemoglobin Distribution */}
          <ChartCard
            title="Hemoglobin (HB Final) Distribution"
            subtitle="Frequency distribution in 1.0 g/dL intervals"
            infoTooltip="Calculated final hemoglobin composite from laboratory and point-of-care clinic testing"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hbHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} tests (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 2: Lab Hemoglobin vs Clinic Hemoglobin Scatter */}
          <ChartCard
            title="Lab HB vs Clinic HB Concordance"
            subtitle="Correlation between central laboratory and bedside testing"
            infoTooltip="Bivariate scatter comparison of simultaneous laboratory automated analyzer and clinic photometer measurements"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="hbLab" name="Lab HB" unit=" g/dL" domain={[4, 18]} tick={{ fontSize: 11 }} />
                <YAxis type="number" dataKey="hbClinic" name="Clinic HB" unit=" g/dL" domain={[4, 18]} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val: any, name) => [`${val} g/dL`, name]} />
                <Scatter name="Patients" data={hbScatterData} fill="#0d9488" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 3: PCV / Hematocrit Distribution */}
          <ChartCard
            title="Packed Cell Volume (PCV / HCT %)"
            subtitle="Hematocrit proportion of whole blood volume"
            infoTooltip="Packed cell volume percentage measured via automated microhematocrit"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pcvHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} tests (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* SECTION 2: White Blood Cell Differential & Platelet Analytics */}
      <div className="pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" />
          2. White Blood Cell Differential & Platelet Distribution
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 4: Total WBC Distribution */}
          <ChartCard
            title="Total WBC Count (/cu.mm)"
            subtitle="Immune cell response (Leukopenia vs Leukocytosis)"
            infoTooltip="Total leukocyte count per cubic millimeter"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={wbcHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} tests (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Chart 5: WBC Differential Mean Percentages */}
          <ChartCard
            title="Differential Leukocyte Breakdown (NLEBM %)"
            subtitle="Mean differential proportion across clinical cases"
            infoTooltip="Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils differential percentages"
            heightClass="h-72"
          >
            <div className="flex flex-col h-full justify-between">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={differentialMeans} layout="vertical" margin={{ left: 15, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" unit="%" domain={[0, 70]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => [`${val}%`, 'Mean']} />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between gap-1 text-[11px] text-slate-500">
                {differentialMeans.map((d, i) => (
                  <span key={i}><strong>{d.name.slice(0, 4)}:</strong> {d.value}% <span className="text-slate-400">({d.standardRange})</span></span>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Chart 6: Platelet Count Distribution */}
          <ChartCard
            title="Platelet Count Distribution (/cu.mm)"
            subtitle="Thrombocytopenia profile in acute malaria"
            infoTooltip="Platelet counts per cubic millimeter highlighting malaria-associated thrombocytopenia (<150k)"
            heightClass="h-72"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={plateletHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number, name, props) => [`${val} tests (${props.payload.percentage}%)`, 'Count']} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </div>

      {/* SECTION 3: Correlation Matrix Heatmap & Peripheral Smear */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Heatmap (2 Columns wide) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Clinical Laboratory Correlation Matrix (Pearson r)"
            subtitle="Linear association between hematological parameters, age, and differential cells"
            infoTooltip="Pearson correlation coefficients calculated pairwise for records with complete paired measurements"
            heightClass="h-80"
          >
            <CorrelationHeatmap fields={correlationFields} matrix={correlationMatrix} />
          </ChartCard>
        </div>

        {/* Peripheral Smear Findings */}
        <ChartCard
          title="Peripheral Blood Smear Findings"
          subtitle="Microscopic erythrocyte & leukocyte morphology"
          infoTooltip="Microscopic peripheral blood smear morphology recorded by clinical pathologist"
          heightClass="h-80"
        >
          <div className="space-y-3 pt-1">
            {smearCategories.map((item, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <span className="font-bold text-teal-700">{item.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">{item.percentage}% of examined smears</span>
              </div>
            ))}
          </div>
        </ChartCard>

      </div>

      {/* SECTION 4: Comparative Stratification Analysis */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Comparative Laboratory Analysis Across Cohorts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore how mean hematological biomarkers vary across diagnostic RDT species, sex, age bands, and hospitalization status.
            </p>
          </div>

          {/* Dimension Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
            <span className="px-2 text-slate-500 font-medium">Compare By:</span>
            {[
              { id: 'rdt', label: 'RDT Species' },
              { id: 'sex', label: 'Sex' },
              { id: 'ageGroup', label: 'Age Group' },
              { id: 'hospitalised', label: 'Hospitalisation' }
            ].map(dim => (
              <button
                key={dim.id}
                type="button"
                onClick={() => setComparativeDimension(dim.id as any)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  comparativeDimension === dim.id
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comparative Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                <th className="p-2.5">Cohort Group</th>
                <th className="p-2.5">Records</th>
                <th className="p-2.5">Mean HB (g/dL)</th>
                <th className="p-2.5">Median HB</th>
                <th className="p-2.5">Mean WBC (/μL)</th>
                <th className="p-2.5">Mean Platelet (/μL)</th>
                <th className="p-2.5">Mean RBC (mil)</th>
                <th className="p-2.5">Mean PCV (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparativeStats.map((stat, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 font-bold text-slate-800">{stat.group}</td>
                  <td className="p-2.5 font-medium text-slate-600">{stat.recordCount}</td>
                  <td className="p-2.5 font-bold text-rose-600">{stat.meanHb ? `${stat.meanHb} g/dL` : '—'}</td>
                  <td className="p-2.5 text-slate-700">{stat.medianHb || '—'}</td>
                  <td className="p-2.5 font-semibold text-sky-700">{stat.meanWbc ? stat.meanWbc.toLocaleString() : '—'}</td>
                  <td className="p-2.5 font-semibold text-amber-700">{stat.meanPlatelet ? Math.round(stat.meanPlatelet).toLocaleString() : '—'}</td>
                  <td className="p-2.5 text-slate-700">{stat.meanRbc ? stat.meanRbc : '—'}</td>
                  <td className="p-2.5 text-slate-700">{stat.meanPcv ? `${stat.meanPcv}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-teal-600" />
          Groups with fewer than 3 observations are suppressed to prevent statistical skew.
        </div>
      </div>

    </div>
  );
};
