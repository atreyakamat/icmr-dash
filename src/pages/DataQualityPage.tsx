import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Database,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  Search
} from 'lucide-react';
import { QualityIssue } from '../data/types';

export const DataQualityPage: React.FC = () => {
  const { dataset } = useData();
  const [activeSheetTab, setActiveSheetTab] = useState<'DEMOGRAPHIC' | 'CBC'>('DEMOGRAPHIC');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const qualityReport = dataset?.qualityReport;

  const missingMap = activeSheetTab === 'DEMOGRAPHIC'
    ? qualityReport?.demographicMissingByCol || {}
    : qualityReport?.cbcMissingByCol || {};

  const issues = qualityReport?.issues || [];

  const filteredIssues = issues.filter(issue => {
    if (issue.sheet !== activeSheetTab) return false;
    if (selectedCategory !== 'All' && issue.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return issue.column.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = ['All', 'Missing Value', 'Invalid Type / Formula', 'Implausible Number', 'Inconsistent Category', 'Coordinate Parse Error'];

  // Complete Data Dictionary
  const demographicDictionary = [
    { name: 'Column 1 (ID)', type: 'String', nulls: '0 (0%)', description: 'Unique patient identifier (A1..A1001). Normalized to Patient ID.', status: 'Normalized' },
    { name: 'STATUS', type: 'String', nulls: '0 (0%)', description: 'Case intake processing status (e.g., COMPLETE, INCOMPLETE).', status: 'Clean' },
    { name: 'RDT', type: 'Categorical', nulls: '0 (0%)', description: 'Rapid Diagnostic Test result. All 513 cases in demographic sheet are PV (Plasmodium vivax).', status: 'Clean' },
    { name: 'Collection DATE', type: 'Date / Text', nulls: '13 (2.5%)', description: 'Sample collection date. Normalized from ISO and DD/MM/YYYY formats.', status: 'Normalized' },
    { name: 'PLACE OF SAMPLE COLLECTION', type: 'Categorical', nulls: '0 (0%)', description: 'Health center in Goa (ASILO NGDH, GMC, PHC Aldona, Candolim, Siolim).', status: 'Clean' },
    { name: 'AGE (YEARS)', type: 'Numeric', nulls: '0 (0%)', description: 'Patient age in years (range 3 to 79).', status: 'Clean' },
    { name: 'GENDER', type: 'Categorical', nulls: '0 (0%)', description: 'Patient sex. Casing unified to Male (90.3%) and Female (9.7%).', status: 'Normalized' },
    { name: 'OCCUPATION', type: 'Categorical', nulls: '2 (0.4%)', description: 'Job profile (Labour, Housekeeping, Mason, Carpenter, Student).', status: 'Normalized' },
    { name: 'NO. OF PEOPLE IN FAMILY', type: 'Numeric', nulls: '0 (0%)', description: 'Reported family size (0 to 12 members).', status: 'Clean' },
    { name: 'MARITAL STATUS', type: 'Categorical', nulls: '0 (0%)', description: 'Married vs Unmarried.', status: 'Clean' },
    { name: 'EDUCATION QUALIFICATION', type: 'Categorical', nulls: '9 (1.8%)', description: 'Highest level of schooling attained (Nil, Primary, 10th, 12th, Graduate).', status: 'Normalized' },
    { name: 'LOCALITY TYPE', type: 'Categorical', nulls: '1 (0.2%)', description: 'Living settlement (Construction Site 66%, Housing 31.6%, Rented 2.4%).', status: 'Clean' },
    { name: 'PAST HISTORY of malaria', type: 'Binary', nulls: '1 (0.2%)', description: 'Prior malaria infection history (Yes / No).', status: 'Clean' },
    { name: 'LAST TIME GOT MALARIA', type: 'Text', nulls: '18 (3.5%)', description: 'Timeline notes for previous malaria episodes.', status: 'Clean' },
    { name: 'CONTACT', type: 'Protected', nulls: '12 (2.3%)', description: 'Phone contact numbers. Masked for privacy in all public views.', status: 'Protected' },
    { name: 'CURRENT ADDRESS', type: 'Text', nulls: '0 (0%)', description: 'Goa residential address. Masked in public explorer.', status: 'Protected' },
    { name: 'Column 22 (Current GPS)', type: 'Coordinates', nulls: '163 (31.8%)', description: 'GPS coordinates of Goa residence. Parsed 350 valid coordinates.', status: 'Normalized' },
    { name: 'NATIVE ADDRESS', type: 'Text', nulls: '2 (0.4%)', description: 'Origin village and district outside Goa.', status: 'Clean' },
    { name: 'MAP NATIVE ADDRESS', type: 'Coordinates', nulls: '203 (39.6%)', description: 'GPS coordinates of native village. Parsed 310 valid coordinates.', status: 'Normalized' },
    { name: 'STATE', type: 'Categorical', nulls: '0 (0%)', description: 'Native state. Standardized aliases (e.g. "UP" -> "Uttar Pradesh").', status: 'Normalized' },
    { name: 'BODY TEMPERATURE', type: 'Numeric', nulls: '386 (75.2%)', description: 'Triage temperature. Standardized to Celsius (°C).', status: 'Normalized' },
    { name: 'WEIGHT', type: 'Numeric', nulls: '2 (0.4%)', description: 'Weight in kg (8 to 103 kg).', status: 'Clean' },
    { name: 'HEIGHT', type: 'Numeric', nulls: '2 (0.4%)', description: 'Height in feet/inches and cm. Normalized to meters.', status: 'Normalized' },
    { name: 'BMI', type: 'Numeric', nulls: '4 (0.8%)', description: 'Body Mass Index (kg/m²). Categorized by WHO criteria.', status: 'Clean' },
    { name: 'BLOOD GROUP', type: 'Categorical', nulls: '9 (1.8%)', description: 'ABO / Rh blood group.', status: 'Clean' },
    { name: 'HB COUNT g/dL', type: 'Numeric', nulls: '20 (3.9%)', description: 'Clinic triage hemoglobin measurement.', status: 'Clean' },
    { name: 'ASILO HB', type: 'Numeric', nulls: '0 (0%)', description: 'Hospital laboratory hemoglobin.', status: 'Clean' },
    { name: 'PRE-EXISTING ILLNESS', type: 'Binary', nulls: '3 (0.6%)', description: 'Presence of chronic medical conditions (Yes / No).', status: 'Clean' },
    { name: 'KIND OF ILLNESS', type: 'Categorical', nulls: '11 (2.1%)', description: 'Specific chronic disease (Hypertension, Diabetes, Asthma).', status: 'Clean' },
    { name: 'SYMPTOMS', type: 'Multi-value', nulls: '3 (0.6%)', description: 'Triage symptoms. Tokenized into standardized array.', status: 'Normalized' },
    { name: 'HOSPITALISED', type: 'Binary', nulls: '2 (0.4%)', description: 'Admission status (Yes / No).', status: 'Clean' },
    { name: 'NO. OF DAYS ADMIT', type: 'Numeric', nulls: '452 (88.1%)', description: 'Inpatient duration in days (1 to 12 days).', status: 'Clean' },
    { name: 'Additional remarks if any', type: 'Text', nulls: '29 (5.7%)', description: 'Epidemiological notes and travel timeline.', status: 'Clean' }
  ];

  const cbcDictionary = [
    { name: 'ID', type: 'Identifier', nulls: '620 (30.6%)', description: 'Patient test ID. 605 zeroes and 15 #REF! assigned synthetic UNID.', status: 'Normalized' },
    { name: 'STATUS', type: 'Categorical', nulls: '594 (29.4%)', description: 'Record status (COMPLETE, INCOMPLETE, EXCLUDED).', status: 'Clean' },
    { name: 'RDT', type: 'Categorical', nulls: '0 (0%)', description: 'Malaria species (PV 784, PF 344, MIX 61, Negative 4, Doubtful 12, Unspecified 817).', status: 'Normalized' },
    { name: 'Collection DATE', type: 'Date / Text', nulls: '882 (43.6%)', description: 'Sample date. 860 values contained 00:00:00 time placeholders.', status: 'Normalized' },
    { name: 'PLACE OF SAMPLE COLLECTION', type: 'Categorical', nulls: '760 (37.6%)', description: 'Collection center (ASILO NGDH 992, PHC Candolim 155, GMC 86).', status: 'Clean' },
    { name: 'NAME', type: 'Protected', nulls: '1991 (98.4%)', description: 'Patient name. 1,991 rows contain #REF!. Masked for privacy.', status: 'Protected' },
    { name: 'SEX', type: 'Categorical', nulls: '839 (41.5%)', description: 'Patient sex (Male 1052, Female 132, Unknown 839).', status: 'Normalized' },
    { name: 'AGE (YEARS)', type: 'Numeric', nulls: '859 (42.5%)', description: 'Patient age in years (1 to 85, mean 29.9). 837 zeroes treated as missing.', status: 'Normalized' },
    { name: 'HB (LAB)', type: 'Numeric', nulls: '990 (48.9%)', description: 'Central laboratory hemoglobin (2.5 to 19.5 g/dL).', status: 'Clean' },
    { name: 'Hb (Clinic)', type: 'Numeric', nulls: '1244 (61.5%)', description: 'Point-of-care clinic hemoglobin (3.0 to 19.2 g/dL).', status: 'Clean' },
    { name: 'HB final', type: 'Numeric', nulls: '901 (44.5%)', description: 'Composite hemoglobin. 220 #DIV/0! formula errors safely recomputed.', status: 'Normalized' },
    { name: 'PCV', type: 'Numeric', nulls: '1256 (62.1%)', description: 'Packed Cell Volume / Hematocrit (9.6% to 60.1%).', status: 'Clean' },
    { name: 'RBC', type: 'Numeric', nulls: '1234 (61.0%)', description: 'Red Blood Cell count (1.03 to 8.66 mil/μL).', status: 'Clean' },
    { name: 'TOTAL WBC COUNT/cu.mm', type: 'Numeric', nulls: '1234 (61.0%)', description: 'Total leukocyte count (1,000 to 28,000 /μL).', status: 'Clean' },
    { name: 'NEUTROPHILS', type: 'Numeric', nulls: '1233 (60.9%)', description: 'Differential Neutrophil percentage (10% to 89%).', status: 'Clean' },
    { name: 'LYMPHOCYTES', type: 'Numeric', nulls: '1233 (60.9%)', description: 'Differential Lymphocyte percentage (3% to 84%).', status: 'Clean' },
    { name: 'EOSINOPHILS', type: 'Numeric', nulls: '1236 (61.1%)', description: 'Differential Eosinophil percentage (0% to 61%).', status: 'Clean' },
    { name: 'BASOPHILS', type: 'Numeric', nulls: '1243 (61.4%)', description: 'Differential Basophil percentage (0% to 6%).', status: 'Clean' },
    { name: 'MONOCYTES', type: 'Numeric', nulls: '1234 (61.0%)', description: 'Differential Monocyte percentage (0% to 19%).', status: 'Clean' },
    { name: 'TOTAL % FOR NLEBM', type: 'Numeric', nulls: '1233 (60.9%)', description: 'Differential cell total sum (validated against 100%).', status: 'Normalized' },
    { name: 'PLATELATE COUNT/cu.mm', type: 'Numeric', nulls: '1233 (60.9%)', description: 'Platelet count. Scaled decimal lakhs and outlier zeros.', status: 'Normalized' },
    { name: 'RETICULOCYTE COUNT %', type: 'Numeric', nulls: '2020 (99.9%)', description: 'Reticulocyte % (3 recorded measurements: 0.6%, 2.5%, 51%).', status: 'Clean' },
    { name: 'ESR mm', type: 'Numeric', nulls: '2023 (100%)', description: 'Erythrocyte sedimentation rate (empty column in workbook).', status: 'Empty' },
    { name: 'MCV', type: 'Numeric', nulls: '1967 (97.2%)', description: 'Mean Corpuscular Volume (56 measurements, 58.9 to 107.6 fL).', status: 'Clean' },
    { name: 'MCH', type: 'Numeric', nulls: '1967 (97.2%)', description: 'Mean Corpuscular Hemoglobin (56 measurements, 19.7 to 87.5 pg).', status: 'Clean' },
    { name: 'MCHC', type: 'Numeric', nulls: '1967 (97.2%)', description: 'Mean Corpuscular Hemoglobin Concentration (56 measurements, 31.4 to 35.4 g/dL).', status: 'Clean' },
    { name: 'PERIPHERAL SMEAR', type: 'Text', nulls: '1972 (97.5%)', description: 'Pathology smear notes (51 records, e.g. Normocytic, Microcytic).', status: 'Clean' },
    { name: 'HOSPITALISED', type: 'Categorical', nulls: '1189 (58.8%)', description: 'Admission status (YES 378, NO 456). 643 zeroes treated as missing.', status: 'Normalized' }
  ];

  const activeDictionary = activeSheetTab === 'DEMOGRAPHIC' ? demographicDictionary : cbcDictionary;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Data Quality Audit & Clinical Metadata Governance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of workbook integrity, formula resolution, anomaly detection, and data dictionary
          </p>
        </div>
      </div>

      {/* Quality Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Formula Errors Resolved</span>
          <div className="text-2xl font-bold text-emerald-700">220 #DIV/0!</div>
          <p className="text-[11px] text-slate-400 mt-0.5">In CBC `HB final` recomputed safely</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Placeholder IDs Normalized</span>
          <div className="text-2xl font-bold text-amber-700">620 Records</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned distinct synthetic keys</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Platelet Anomalies Fixed</span>
          <div className="text-2xl font-bold text-teal-700">Lakhs & Outliers</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Normalized 3.96 lakhs to 396k</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mb-1">Spatial Coordinates Parsed</span>
          <div className="text-2xl font-bold text-slate-900">660 GPS Points</div>
          <p className="text-[11px] text-slate-400 mt-0.5">350 Goa + 310 Native origins</p>
        </div>
      </div>

      {/* Sheet Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveSheetTab('DEMOGRAPHIC')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSheetTab === 'DEMOGRAPHIC'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>DEMOGRAPHIC Audit (513 Records)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSheetTab('CBC')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSheetTab === 'CBC'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CBC Laboratory Audit (2,023 Records)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Audited Quality Issues Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Documented Data Anomalies & Normalization Log ({filteredIssues.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified column irregularities, formula crashes, and transformations applied in memory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium text-slate-700"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Issue Cards */}
        <div className="space-y-3">
          {filteredIssues.map(issue => (
            <div
              key={issue.id}
              className={`p-4 rounded-xl border text-xs flex flex-col gap-2 ${
                issue.severity === 'high' ? 'bg-rose-50/50 border-rose-200' :
                issue.severity === 'medium' ? 'bg-amber-50/50 border-amber-200' :
                'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{issue.column}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    issue.severity === 'high' ? 'bg-rose-100 text-rose-800' :
                    issue.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {issue.severity} Severity
                  </span>
                  <span className="text-slate-500 font-medium">({issue.category})</span>
                </div>
                <span className="text-slate-600 font-semibold text-[11px]">
                  {issue.affectedCount} rows affected ({issue.pctAffected}%)
                </span>
              </div>

              <p className="text-slate-700 leading-relaxed">{issue.description}</p>

              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="text-slate-500">
                  <strong className="text-slate-700">Sample Raw:</strong> {issue.examples.join(', ')}
                </div>
                <div className="text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  <strong className="text-teal-900">Transformation:</strong> {issue.actionTaken}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Complete Data Dictionary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-700" />
            Complete Column Data Dictionary ({activeSheetTab})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exhaustive attribute dictionary documenting source types, missingness, normalization rules, and clinical descriptions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                <th className="p-2.5">Attribute Name</th>
                <th className="p-2.5">Data Type</th>
                <th className="p-2.5">Missingness</th>
                <th className="p-2.5">Description & Normalization Rule</th>
                <th className="p-2.5">Governance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDictionary.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{col.name}</td>
                  <td className="p-2.5 font-mono text-slate-600 text-[11px]">{col.type}</td>
                  <td className="p-2.5 font-medium text-slate-700">{col.nulls}</td>
                  <td className="p-2.5 text-slate-600 leading-snug">{col.description}</td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      col.status === 'Clean' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      col.status === 'Normalized' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      col.status === 'Protected' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {col.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
