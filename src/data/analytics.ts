import {
  DemographicRecord,
  CbcRecord,
  RdtResult,
  Gender,
  LocalityType,
  MaritalStatus,
  HospitalisedStatus
} from './types';

// Statistical helpers
export function calculateMean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid] * 100) / 100;
}

export function calculateStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 3) return null;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0 || isNaN(denominator)) return null;
  return Math.round((numerator / denominator) * 100) / 100;
}

// Binned histogram generator
export function createHistogram(values: number[], binSize: number, minVal?: number, maxVal?: number) {
  if (values.length === 0) return [];
  const min = minVal !== undefined ? minVal : Math.floor(Math.min(...values) / binSize) * binSize;
  const max = maxVal !== undefined ? maxVal : Math.ceil(Math.max(...values) / binSize) * binSize;

  const bins: { range: string; min: number; max: number; count: number; percentage: number }[] = [];
  for (let b = min; b < max; b += binSize) {
    const bMax = b + binSize;
    bins.push({
      range: `${b}–${bMax}`,
      min: b,
      max: bMax,
      count: 0,
      percentage: 0
    });
  }

  values.forEach(v => {
    const bin = bins.find(b => v >= b.min && v < b.max);
    if (bin) {
      bin.count++;
    } else if (v >= max && bins.length > 0) {
      bins[bins.length - 1].count++;
    }
  });

  bins.forEach(b => {
    b.percentage = Math.round((b.count / values.length) * 1000) / 10;
  });

  return bins;
}

// Demographic KPIs calculation
export function computeDemographicKpis(records: DemographicRecord[]) {
  const total = records.length;
  if (total === 0) {
    return {
      totalRecords: 0,
      uniquePatients: 0,
      maleCount: 0,
      femaleCount: 0,
      malePct: 0,
      femalePct: 0,
      meanAge: 0,
      medianAge: 0,
      minAge: 0,
      maxAge: 0,
      pvCount: 0,
      pvPct: 0,
      pastMalariaCount: 0,
      pastMalariaPct: 0,
      preExistingIllnessCount: 0,
      preExistingIllnessPct: 0,
      hospitalisedCount: 0,
      hospitalisedPct: 0,
      missingCriticalCount: 0,
      missingCriticalPct: 0
    };
  }

  const uniqueIds = new Set(records.map(r => r.id)).size;
  const maleCount = records.filter(r => r.gender === 'Male').length;
  const femaleCount = records.filter(r => r.gender === 'Female').length;
  const knownGenderTotal = maleCount + femaleCount || 1;

  const ages = records.map(r => r.age).filter((a): a is number => a !== null);
  const meanAge = calculateMean(ages) || 0;
  const medianAge = calculateMedian(ages) || 0;
  const minAge = ages.length > 0 ? Math.min(...ages) : 0;
  const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

  const pvCount = records.filter(r => r.rdt === 'PV').length;
  const pastMalariaCount = records.filter(r => r.pastMalariaHistory === true).length;
  const knownMalariaHistory = records.filter(r => r.pastMalariaHistory !== null).length || 1;

  const preExistingIllnessCount = records.filter(r => r.preExistingIllness === 'Yes').length;
  const knownPreExisting = records.filter(r => r.preExistingIllness !== 'Unknown').length || 1;

  const hospitalisedCount = records.filter(r => r.hospitalised === 'Yes').length;
  const knownHosp = records.filter(r => r.hospitalised !== 'Unknown').length || 1;

  const missingCriticalCount = records.filter(r => !r.isComplete).length;

  return {
    totalRecords: total,
    uniquePatients: uniqueIds,
    maleCount,
    femaleCount,
    malePct: Math.round((maleCount / knownGenderTotal) * 1000) / 10,
    femalePct: Math.round((femaleCount / knownGenderTotal) * 1000) / 10,
    meanAge,
    medianAge,
    minAge,
    maxAge,
    pvCount,
    pvPct: Math.round((pvCount / total) * 1000) / 10,
    pastMalariaCount,
    pastMalariaPct: Math.round((pastMalariaCount / knownMalariaHistory) * 1000) / 10,
    preExistingIllnessCount,
    preExistingIllnessPct: Math.round((preExistingIllnessCount / knownPreExisting) * 1000) / 10,
    hospitalisedCount,
    hospitalisedPct: Math.round((hospitalisedCount / knownHosp) * 1000) / 10,
    missingCriticalCount,
    missingCriticalPct: Math.round((missingCriticalCount / total) * 1000) / 10
  };
}

// CBC KPIs calculation
export function computeCbcKpis(records: CbcRecord[]) {
  const total = records.length;
  if (total === 0) {
    return {
      totalRecords: 0,
      completeCount: 0,
      completePct: 0,
      incompleteCount: 0,
      meanAge: 0,
      medianAge: 0,
      meanHb: 0,
      medianHb: 0,
      stdHb: 0,
      meanWbc: 0,
      medianWbc: 0,
      meanPlatelet: 0,
      medianPlatelet: 0,
      meanRbc: 0,
      medianRbc: 0,
      rdtDistribution: {} as Record<string, number>,
      hospitalisationRate: 0,
      usablePeripheralSmearCount: 0,
      missingLabMetrics: {
        hbMissingPct: 0,
        wbcMissingPct: 0,
        plateletMissingPct: 0,
        rbcMissingPct: 0,
        pcvMissingPct: 0
      }
    };
  }

  const completeCount = records.filter(r => r.isComplete).length;
  const incompleteCount = total - completeCount;

  const ages = records.map(r => r.age).filter((a): a is number => a !== null);
  const hbs = records.map(r => r.hbFinal).filter((h): h is number => h !== null);
  const wbcs = records.map(r => r.totalWbc).filter((w): w is number => w !== null);
  const platelets = records.map(r => r.plateletCount).filter((p): p is number => p !== null);
  const rbcs = records.map(r => r.rbc).filter((r): r is number => r !== null);

  const rdtCounts: Record<string, number> = {};
  records.forEach(r => {
    rdtCounts[r.rdt] = (rdtCounts[r.rdt] || 0) + 1;
  });

  const hospYes = records.filter(r => r.hospitalised === 'Yes').length;
  const hospKnown = records.filter(r => r.hospitalised !== 'Unknown').length || 1;

  const usableSmearCount = records.filter(r => r.peripheralSmear && r.peripheralSmear !== '0' && r.peripheralSmear !== 'NA').length;

  const missingLabMetrics = {
    hbMissingPct: Math.round(((total - hbs.length) / total) * 1000) / 10,
    wbcMissingPct: Math.round(((total - wbcs.length) / total) * 1000) / 10,
    plateletMissingPct: Math.round(((total - platelets.length) / total) * 1000) / 10,
    rbcMissingPct: Math.round(((total - rbcs.length) / total) * 1000) / 10,
    pcvMissingPct: Math.round(((total - records.filter(r => r.pcv !== null).length) / total) * 1000) / 10
  };

  return {
    totalRecords: total,
    completeCount,
    completePct: Math.round((completeCount / total) * 1000) / 10,
    incompleteCount,
    meanAge: calculateMean(ages) || 0,
    medianAge: calculateMedian(ages) || 0,
    meanHb: calculateMean(hbs) || 0,
    medianHb: calculateMedian(hbs) || 0,
    stdHb: calculateStdDev(hbs) || 0,
    meanWbc: calculateMean(wbcs) || 0,
    medianWbc: calculateMedian(wbcs) || 0,
    meanPlatelet: calculateMean(platelets) || 0,
    medianPlatelet: calculateMedian(platelets) || 0,
    meanRbc: calculateMean(rbcs) || 0,
    medianRbc: calculateMedian(rbcs) || 0,
    rdtDistribution: rdtCounts,
    hospitalisationRate: Math.round((hospYes / hospKnown) * 1000) / 10,
    usablePeripheralSmearCount: usableSmearCount,
    missingLabMetrics
  };
}

// Categorical distribution helper
export function getCategoryDistribution<T>(records: T[], key: keyof T, topN: number = 10) {
  const counts: Record<string, number> = {};
  records.forEach(r => {
    const val = String(r[key] || 'Unknown').trim();
    if (val && val !== '0' && val !== 'NA' && val !== 'null') {
      counts[val] = (counts[val] || 0) + 1;
    }
  });

  const total = records.length || 1;
  const sorted = Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length <= topN) return sorted;
  
  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, item) => sum + item.count, 0);
  if (otherCount > 0) {
    top.push({
      name: 'Other Categories',
      count: otherCount,
      percentage: Math.round((otherCount / total) * 1000) / 10
    });
  }
  return top;
}

// Symptom Frequency Analysis
export function computeSymptomFrequencies(records: { symptoms: string[] }[]) {
  const counts: Record<string, number> = {};
  let totalWithSymptoms = 0;

  records.forEach(r => {
    if (r.symptoms.length > 0) {
      totalWithSymptoms++;
      r.symptoms.forEach(sym => {
        counts[sym] = (counts[sym] || 0) + 1;
      });
    }
  });

  const denom = totalWithSymptoms || 1;
  return Object.entries(counts)
    .map(([symptom, count]) => ({
      symptom,
      count,
      percentage: Math.round((count / denom) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count);
}

// Age Group vs Gender cross-tabulation
export function computeAgeGenderCrossTab(records: { ageGroup: string; gender: Gender }[]) {
  const groups = ['< 15 (Pediatric)', '15–24 (Youth)', '25–44 (Young Adult)', '45–64 (Middle Aged)', '65+ (Senior)'];
  return groups.map(group => {
    const subset = records.filter(r => r.ageGroup === group);
    const male = subset.filter(r => r.gender === 'Male').length;
    const female = subset.filter(r => r.gender === 'Female').length;
    const unknown = subset.filter(r => r.gender === 'Unknown').length;
    return {
      ageGroup: group,
      Male: male,
      Female: female,
      Unknown: unknown,
      total: subset.length
    };
  });
}

// Correlation matrix computation for CBC
export function computeCorrelationMatrix(records: CbcRecord[]) {
  const fields = [
    { key: 'hbFinal', label: 'Hemoglobin' },
    { key: 'totalWbc', label: 'Total WBC' },
    { key: 'plateletCount', label: 'Platelet' },
    { key: 'rbc', label: 'RBC' },
    { key: 'pcv', label: 'PCV / HCT' },
    { key: 'neutrophils', label: 'Neutrophil %' },
    { key: 'lymphocytes', label: 'Lymphocyte %' },
    { key: 'monocytes', label: 'Monocyte %' },
    { key: 'age', label: 'Age' }
  ];

  const matrix: { x: string; y: string; correlation: number | null }[] = [];

  for (let i = 0; i < fields.length; i++) {
    for (let j = 0; j < fields.length; j++) {
      const f1 = fields[i];
      const f2 = fields[j];

      if (i === j) {
        matrix.push({ x: f1.label, y: f2.label, correlation: 1.0 });
        continue;
      }

      // Collect pairs where both are valid numbers
      const pairs: [number, number][] = [];
      records.forEach(r => {
        const v1 = (r as any)[f1.key];
        const v2 = (r as any)[f2.key];
        if (typeof v1 === 'number' && typeof v2 === 'number' && !isNaN(v1) && !isNaN(v2)) {
          pairs.push([v1, v2]);
        }
      });

      if (pairs.length >= 10) {
        const r = calculatePearsonCorrelation(
          pairs.map(p => p[0]),
          pairs.map(p => p[1])
        );
        matrix.push({ x: f1.label, y: f2.label, correlation: r });
      } else {
        matrix.push({ x: f1.label, y: f2.label, correlation: null });
      }
    }
  }

  return { fields: fields.map(f => f.label), matrix };
}

// Comparative CBC Lab Analysis by Group (e.g. by RDT, Sex, AgeGroup, Hospitalised)
export function computeComparativeLabStats(records: CbcRecord[], groupKey: keyof CbcRecord) {
  const groups: Record<string, CbcRecord[]> = {};
  records.forEach(r => {
    const val = String(r[groupKey] || 'Unknown').trim();
    if (val && val !== '0') {
      if (!groups[val]) groups[val] = [];
      groups[val].push(r);
    }
  });

  return Object.entries(groups).map(([group, recs]) => {
    const hbs = recs.map(r => r.hbFinal).filter((v): v is number => v !== null);
    const wbcs = recs.map(r => r.totalWbc).filter((v): v is number => v !== null);
    const plts = recs.map(r => r.plateletCount).filter((v): v is number => v !== null);
    const rbcs = recs.map(r => r.rbc).filter((v): v is number => v !== null);
    const pcvs = recs.map(r => r.pcv).filter((v): v is number => v !== null);

    return {
      group,
      recordCount: recs.length,
      meanHb: calculateMean(hbs),
      medianHb: calculateMedian(hbs),
      meanWbc: calculateMean(wbcs),
      medianWbc: calculateMedian(wbcs),
      meanPlatelet: calculateMean(plts),
      medianPlatelet: calculateMedian(plts),
      meanRbc: calculateMean(rbcs),
      meanPcv: calculateMean(pcvs)
    };
  }).filter(g => g.recordCount >= 3).sort((a, b) => b.recordCount - a.recordCount);
}
