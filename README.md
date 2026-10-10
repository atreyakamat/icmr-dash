# ICMR Healthcare Demographics & CBC Analytics Dashboard

A production-grade, interactive healthcare business intelligence system built for public health surveillance, clinical hematology analytics, and spatial epidemiology.

This application ingests, audits, normalizes, and visualizes data from `TEST DATA SET.xlsx`, maintaining data governance and separation between the **`DEMOGRAPHIC`** (513 records) and **`CBC`** (2,023 records) worksheets.

---

## 🌟 Key Capabilities & Modules

### 1. 📊 Executive Overview
- Unified KPI ribbon cross-referencing demographic case screening with CBC laboratory testing.
- Parasite diagnostic spectrum breakdown across *Plasmodium vivax* (PV), *Plasmodium falciparum* (PF), and Mixed infections.
- Clinical symptom prevalence analysis tokenized from medical triage.
- Inter-state migration source rankings for seasonal workforce cases.

### 2. 👥 Patient Demographics (`DEMOGRAPHIC` Sheet)
- **16 distinct clinical charts** covering:
  - Age distribution histograms across decade cohorts.
  - Gender ratio donut chart (90.3% Male vs 9.7% Female).
  - Age Group vs Gender stacked pyramid.
  - Occupation distribution (Labour, Mason, Housekeeping, Carpenter).
  - Educational attainment and formal schooling tiers.
  - Environmental locality settlement risks (66.0% Construction Sites).
  - Family size and marital status distributions.
  - Longitudinal sample intake timeline.
  - Chronic comorbidities (Hypertension, Diabetes, Asthma) and adult BMI classifications.
  - Hospitalisation admission rates and length of stay.

### 3. 🎨 Demographic Infographic
- Inspired by public health demographic infographics.
- **100-Icon Array representations** (1 icon ≈ 1% of the population) illustrating workforce gender concentrations and high-risk construction settlement exposures.
- Multi-segment proportion models and visual epidemiological stat cards.

### 4. 🩸 CBC Clinical Laboratory Analytics (`CBC` Sheet)
- Comprehensive hematology panels:
  - **Red Blood Cell Analysis**: Final Hemoglobin (`HB final`) distributions, Laboratory vs Bedside Clinic scatter concordance, RBC counts, Packed Cell Volume (`PCV / Hematocrit`), and red cell indices (MCV, MCH, MCHC).
  - **White Blood Cell Analysis**: Total Leukocyte count distributions (Leukopenia vs Leukocytosis), differential leukocyte breakdown (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils), and NLEBM differential sum balance checks.
  - **Platelet & Smear Analytics**: Platelet count histograms profiling malaria-induced thrombocytopenia (<150k/μL) and peripheral blood smear pathology morphology.
  - **Correlation Matrix Heatmap**: Interactive Pearson correlation grid between clinical biomarkers with statistical caution notices.
  - **Comparative Stratification**: Dynamic cross-tabulation comparing mean lab metrics across RDT species, Sex, Age groups, and Hospitalisation.

### 5. 🗺️ Geographic & Spatial Epidemiology (Open-Source Leaflet & OpenStreetMap)
- **100% Free & Open-Source**: Zero API keys, zero Google Cloud account required, and zero paid mapping subscriptions.
- **Dual-Scope Spatial Views with Interactive Switching**:
  - **Goa View**: Focuses on North Goa coastal belt, sub-districts, and health center clusters with exact GPS coordinates (350 records) and Goa facility lookups.
  - **India View**: Country-level migration origin mapping across 18 Indian states (310 records with exact native GPS coordinates + state-level aggregation).
- **Location Resolution & Classification Pipeline**:
  - Automatically classifies records into `Goa`, `Other States`, `State-Level Centroid`, or `Unresolved`.
  - Parses exact coordinates (decimal & DMS), health center registry lookups (e.g., Candolim PHC, Mapusa UPHC, Asilo Hospital), and geocodes unmapped administrative localities on-demand using throttled OpenStreetMap Nominatim.
  - Clusters records locally (~1.5km radius) for privacy preservation (no individual residential door numbers, patient names, or contact info exposed).
- **Interactive Controls**:
  - Location perspectives: *Current Residence* vs *Native Origin* vs *Collection Facility*.
  - Cluster coloring modes: *Locality Settlement Risk*, *Hospitalisation Status*, or *Gender Distribution*.
  - Configurable Tile Providers: Standard OpenStreetMap (with required attribution), CartoDB Positron, and Humanitarian OSM.
  - Geographic Data Quality & Audit breakdown panel showing valid GPS, plotted markers, state-level records, and unresolved entries.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# Clone or navigate to the repository
cd icmr-dash

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Previewing the Production Build
```bash
npm run preview
```

---

## 🔄 Dataset Ingestion & Refresh Procedures

1. **Default Source**: On startup, the application dynamically loads `TEST DATA SET.xlsx` from `/public/TEST DATA SET.xlsx` using SheetJS (`xlsx`).
2. **Uploading / Replacing Data**: Click the **"Upload Excel"** button in the top navigation bar to drop in an updated workbook. The application will parse both `DEMOGRAPHIC` and `CBC` sheets at runtime, normalize all fields, and recompute every KPI, chart, and correlation in real time.
3. **Resetting to Default**: Click **"Reset Data"** to restore the bundled `TEST DATA SET.xlsx` baseline.

---

## 📂 Project Architecture

```
icmr-dash/
├── public/
│   └── TEST DATA SET.xlsx          # Bundled Excel dataset
├── src/
│   ├── data/
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── normalizer.ts           # Data sanitization, GPS parsing, and normalization
│   │   ├── qualityAuditor.ts       # Anomaly audit engine & data dictionary
│   │   ├── analytics.ts            # Mathematical stats, distributions, correlation matrix
│   │   ├── excelLoader.ts          # SheetJS binary ingestion & CSV export
│   │   └── rawDataset.json         # High-speed pre-extracted fallback snapshot
│   ├── context/
│   │   └── DataContext.tsx         # Global reactive state, filter engines, & memoized records
│   ├── components/
│   │   ├── common/                 # KpiCard, ChartCard, IconArray, ProportionBar, Heatmap, Badge
│   │   ├── layout/                 # Header, Sidebar, FilterBar
│   │   └── maps/                   # GeographicMap (Leaflet dual-mode map)
│   ├── pages/
│   │   ├── OverviewPage.tsx        # Unified executive disease intelligence
│   │   ├── DemographicsPage.tsx    # 16-chart epidemiological dashboard
│   │   ├── DemographicInfographicPage.tsx # Visual 100-icon models
│   │   ├── CbcAnalyticsPage.tsx    # Complete blood count & hematology lab analytics
│   │   ├── GeographicPage.tsx      # Spatial mapping & inter-state migration
│   │   ├── DataExplorerPage.tsx    # Searchable, privacy-safe paginated data grid
│   │   └── DataQualityPage.tsx     # Data quality audit & exhaustive data dictionary
│   ├── __tests__/
│   │   └── analytics.test.ts       # Vitest unit test suite
│   ├── App.tsx                     # Main layout & router container
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Tailwind styles & Leaflet overrides
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🔒 Privacy & Clinical Ethics
- **No external geocoding calls**: Private patient addresses are never transmitted to external third-party geocoding APIs. All spatial points use pre-recorded coordinate attributes.
- **De-identification**: Personal identifiers (phone numbers, full patient names, precise door numbers) are masked by default in all public-facing explorer tables and tooltips.
