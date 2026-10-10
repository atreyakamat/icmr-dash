import * as XLSX from 'xlsx';
import { normalizeDemographicRecord, normalizeCbcRecord } from './normalizer';
import { auditDataset } from './qualityAuditor';
import { DemographicRecord, CbcRecord, QualityReport } from './types';

export interface LoadedDataset {
  rawDemographic: Record<string, any>[];
  normalizedDemographic: DemographicRecord[];
  rawCbc: Record<string, any>[];
  normalizedCbc: CbcRecord[];
  qualityReport: QualityReport;
  sourceType: 'bundled-json' | 'bundled-xlsx' | 'uploaded-xlsx';
  fileName: string;
  loadedAt: Date;
}

export function processRawSheets(
  rawDemoRows: Record<string, any>[],
  rawCbcRows: Record<string, any>[],
  sourceType: LoadedDataset['sourceType'],
  fileName: string
): LoadedDataset {
  const normalizedDemographic = rawDemoRows.map((r, i) => normalizeDemographicRecord(r, i));
  const normalizedCbc = rawCbcRows.map((r, i) => normalizeCbcRecord(r, i));
  const qualityReport = auditDataset(normalizedDemographic, normalizedCbc, rawDemoRows, rawCbcRows);

  return {
    rawDemographic: rawDemoRows,
    normalizedDemographic,
    rawCbc: rawCbcRows,
    normalizedCbc,
    qualityReport,
    sourceType,
    fileName,
    loadedAt: new Date()
  };
}

// Convert XLSX sheet to row objects safely without iterating phantom empty rows
function safeSheetToJson(ws: XLSX.WorkSheet, maxExpectedRows: number = 5000): Record<string, any>[] {
  if (!ws || !ws['!ref']) return [];

  // Clamp range to prevent iterating 1,000,000+ blank rows from Excel template formatting
  const range = XLSX.utils.decode_range(ws['!ref']);
  if (range.e.r > maxExpectedRows) {
    range.e.r = maxExpectedRows;
    ws['!ref'] = XLSX.utils.encode_range(range);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
    raw: false,
    defval: null,
    blankrows: false
  });

  // Filter out any trailing empty objects
  return rawRows.filter(r => Object.values(r).some(v => v !== null && String(v).trim() !== ''));
}

// Ingest from ArrayBuffer / binary
export function parseWorkbookBuffer(buffer: ArrayBuffer, fileName: string = 'TEST DATA SET.xlsx'): LoadedDataset {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  let rawDemoRows: Record<string, any>[] = [];
  let rawCbcRows: Record<string, any>[] = [];

  const demoSheetName = wb.SheetNames.find(s => s.toUpperCase().includes('DEMO')) || wb.SheetNames[0];
  const cbcSheetName = wb.SheetNames.find(s => s.toUpperCase().includes('CBC')) || wb.SheetNames[1];

  if (demoSheetName && wb.Sheets[demoSheetName]) {
    rawDemoRows = safeSheetToJson(wb.Sheets[demoSheetName], 2000);
  }
  if (cbcSheetName && wb.Sheets[cbcSheetName]) {
    rawCbcRows = safeSheetToJson(wb.Sheets[cbcSheetName], 5000);
  }

  return processRawSheets(rawDemoRows, rawCbcRows, 'uploaded-xlsx', fileName);
}

// Load dataset quickly on app startup
export async function loadInitialDataset(): Promise<LoadedDataset> {
  // 1. Try lightweight instant JSON fetch
  try {
    const jsonRes = await fetch('/dataset.json');
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      const rawDemo = data.DEMOGRAPHIC?.rows || [];
      const rawCbc = data.CBC?.rows || [];
      if (rawDemo.length > 0 || rawCbc.length > 0) {
        return processRawSheets(rawDemo, rawCbc, 'bundled-json', 'TEST DATA SET.xlsx');
      }
    }
  } catch (err) {
    console.warn('Fast JSON fetch failed, attempting live xlsx fallback:', err);
  }

  // 2. Fallback to live Excel fetch if dataset.json unavailable
  try {
    const xlsxRes = await fetch('/TEST DATA SET.xlsx');
    if (xlsxRes.ok) {
      const arrayBuffer = await xlsxRes.arrayBuffer();
      if (arrayBuffer && arrayBuffer.byteLength > 1000) {
        const dataset = parseWorkbookBuffer(arrayBuffer, 'TEST DATA SET.xlsx');
        dataset.sourceType = 'bundled-xlsx';
        return dataset;
      }
    }
  } catch (err) {
    console.error('Failed to load dataset:', err);
  }

  return processRawSheets([], [], 'bundled-json', 'TEST DATA SET.xlsx');
}

// Export dataset to CSV
export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, `${filename}.csv`);
}
