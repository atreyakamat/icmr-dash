import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DemographicRecord,
  CbcRecord,
  QualityReport,
  DemographicFilterState,
  CbcFilterState,
  Gender,
  RdtResult,
  LocalityType,
  MaritalStatus,
  HospitalisedStatus
} from '../data/types';
import {
  loadInitialDataset,
  parseWorkbookBuffer,
  LoadedDataset,
  exportToCsv
} from '../data/excelLoader';

export type ActiveTab = 'overview' | 'demographics' | 'cbc' | 'infographic' | 'geographic' | 'explorer' | 'quality';

interface DataContextType {
  dataset: LoadedDataset | null;
  loading: boolean;
  error: string | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Demographic Filtering
  demoFilters: DemographicFilterState;
  setDemoFilters: React.Dispatch<React.SetStateAction<DemographicFilterState>>;
  resetDemoFilters: () => void;
  filteredDemographic: DemographicRecord[];
  activeDemoFilterCount: number;

  // CBC Filtering
  cbcFilters: CbcFilterState;
  setCbcFilters: React.Dispatch<React.SetStateAction<CbcFilterState>>;
  resetCbcFilters: () => void;
  filteredCbc: CbcRecord[];
  activeCbcFilterCount: number;

  // Actions
  handleFileUpload: (file: File) => Promise<void>;
  reloadDefaultDataset: () => Promise<void>;
  exportCurrentView: (format: 'csv' | 'json') => void;
  
  // Quick cross-sheet counts
  totalRawDemoCount: number;
  totalRawCbcCount: number;
}

const initialDemoFilters: DemographicFilterState = {
  searchQuery: '',
  dateRange: { start: '', end: '' },
  ageRange: [0, 100],
  genders: [],
  rdtResults: [],
  localityTypes: [],
  states: [],
  collectionPlaces: [],
  maritalStatuses: [],
  hospitalised: [],
  pastMalariaHistory: 'All',
  preExistingIllness: 'All',
  bloodGroups: []
};

const initialCbcFilters: CbcFilterState = {
  searchQuery: '',
  dateRange: { start: '', end: '' },
  ageRange: [0, 100],
  sexes: [],
  rdtResults: [],
  collectionPlaces: [],
  states: [],
  hospitalised: [],
  bloodGroups: [],
  recordCompleteness: 'All',
  hbRange: [0, 25],
  wbcRange: [0, 35000],
  plateletRange: [0, 1000000]
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<LoadedDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [demoFilters, setDemoFilters] = useState<DemographicFilterState>(initialDemoFilters);
  const [cbcFilters, setCbcFilters] = useState<CbcFilterState>(initialCbcFilters);

  // Initialize dataset on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setLoading(true);
        const data = await loadInitialDataset();
        if (isMounted) {
          setDataset(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load dataset');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  // Reset filter handlers
  const resetDemoFilters = () => setDemoFilters(initialDemoFilters);
  const resetCbcFilters = () => setCbcFilters(initialCbcFilters);

  // Count active Demographic filters
  const activeDemoFilterCount = useMemo(() => {
    let count = 0;
    if (demoFilters.searchQuery.trim()) count++;
    if (demoFilters.dateRange.start || demoFilters.dateRange.end) count++;
    if (demoFilters.ageRange[0] > 0 || demoFilters.ageRange[1] < 100) count++;
    if (demoFilters.genders.length > 0) count += demoFilters.genders.length;
    if (demoFilters.rdtResults.length > 0) count += demoFilters.rdtResults.length;
    if (demoFilters.localityTypes.length > 0) count += demoFilters.localityTypes.length;
    if (demoFilters.states.length > 0) count += demoFilters.states.length;
    if (demoFilters.collectionPlaces.length > 0) count += demoFilters.collectionPlaces.length;
    if (demoFilters.maritalStatuses.length > 0) count += demoFilters.maritalStatuses.length;
    if (demoFilters.hospitalised.length > 0) count += demoFilters.hospitalised.length;
    if (demoFilters.pastMalariaHistory !== 'All') count++;
    if (demoFilters.preExistingIllness !== 'All') count++;
    if (demoFilters.bloodGroups.length > 0) count += demoFilters.bloodGroups.length;
    return count;
  }, [demoFilters]);

  // Count active CBC filters
  const activeCbcFilterCount = useMemo(() => {
    let count = 0;
    if (cbcFilters.searchQuery.trim()) count++;
    if (cbcFilters.dateRange.start || cbcFilters.dateRange.end) count++;
    if (cbcFilters.ageRange[0] > 0 || cbcFilters.ageRange[1] < 100) count++;
    if (cbcFilters.sexes.length > 0) count += cbcFilters.sexes.length;
    if (cbcFilters.rdtResults.length > 0) count += cbcFilters.rdtResults.length;
    if (cbcFilters.collectionPlaces.length > 0) count += cbcFilters.collectionPlaces.length;
    if (cbcFilters.states.length > 0) count += cbcFilters.states.length;
    if (cbcFilters.hospitalised.length > 0) count += cbcFilters.hospitalised.length;
    if (cbcFilters.bloodGroups.length > 0) count += cbcFilters.bloodGroups.length;
    if (cbcFilters.recordCompleteness !== 'All') count++;
    if (cbcFilters.hbRange[0] > 0 || cbcFilters.hbRange[1] < 25) count++;
    if (cbcFilters.wbcRange[0] > 0 || cbcFilters.wbcRange[1] < 35000) count++;
    if (cbcFilters.plateletRange[0] > 0 || cbcFilters.plateletRange[1] < 1000000) count++;
    return count;
  }, [cbcFilters]);

  // Filtered Demographic records
  const filteredDemographic = useMemo(() => {
    if (!dataset) return [];
    return dataset.normalizedDemographic.filter(record => {
      // Search
      if (demoFilters.searchQuery.trim()) {
        const q = demoFilters.searchQuery.toLowerCase();
        const matchesId = record.id.toLowerCase().includes(q);
        const matchesOccupation = record.occupation.toLowerCase().includes(q);
        const matchesLocality = record.localityType.toLowerCase().includes(q);
        const matchesState = record.normalizedState.toLowerCase().includes(q);
        const matchesPlace = record.collectionPlace.toLowerCase().includes(q);
        if (!matchesId && !matchesOccupation && !matchesLocality && !matchesState && !matchesPlace) {
          return false;
        }
      }

      // Age range
      if (record.age !== null) {
        if (record.age < demoFilters.ageRange[0] || record.age > demoFilters.ageRange[1]) return false;
      }

      // Gender
      if (demoFilters.genders.length > 0 && !demoFilters.genders.includes(record.gender)) {
        return false;
      }

      // RDT
      if (demoFilters.rdtResults.length > 0 && !demoFilters.rdtResults.includes(record.rdt)) {
        return false;
      }

      // Locality
      if (demoFilters.localityTypes.length > 0 && !demoFilters.localityTypes.includes(record.localityType)) {
        return false;
      }

      // State
      if (demoFilters.states.length > 0 && !demoFilters.states.includes(record.normalizedState)) {
        return false;
      }

      // Collection place
      if (demoFilters.collectionPlaces.length > 0 && !demoFilters.collectionPlaces.includes(record.collectionPlace)) {
        return false;
      }

      // Marital status
      if (demoFilters.maritalStatuses.length > 0 && !demoFilters.maritalStatuses.includes(record.maritalStatus)) {
        return false;
      }

      // Hospitalised
      if (demoFilters.hospitalised.length > 0 && !demoFilters.hospitalised.includes(record.hospitalised)) {
        return false;
      }

      // Past malaria
      if (demoFilters.pastMalariaHistory === 'Yes' && record.pastMalariaHistory !== true) return false;
      if (demoFilters.pastMalariaHistory === 'No' && record.pastMalariaHistory !== false) return false;

      // Pre-existing illness
      if (demoFilters.preExistingIllness === 'Yes' && record.preExistingIllness !== 'Yes') return false;
      if (demoFilters.preExistingIllness === 'No' && record.preExistingIllness !== 'No') return false;

      // Blood group
      if (demoFilters.bloodGroups.length > 0 && !demoFilters.bloodGroups.includes(record.bloodGroup)) {
        return false;
      }

      // Date range
      if (demoFilters.dateRange.start && record.collectionDate && record.collectionDate < demoFilters.dateRange.start) return false;
      if (demoFilters.dateRange.end && record.collectionDate && record.collectionDate > demoFilters.dateRange.end) return false;

      return true;
    });
  }, [dataset, demoFilters]);

  // Filtered CBC records
  const filteredCbc = useMemo(() => {
    if (!dataset) return [];
    return dataset.normalizedCbc.filter(record => {
      // Search
      if (cbcFilters.searchQuery.trim()) {
        const q = cbcFilters.searchQuery.toLowerCase();
        const matchesId = record.id.toLowerCase().includes(q);
        const matchesPlace = record.collectionPlace.toLowerCase().includes(q);
        const matchesState = record.normalizedState.toLowerCase().includes(q);
        const matchesSmear = record.peripheralSmear.toLowerCase().includes(q);
        if (!matchesId && !matchesPlace && !matchesState && !matchesSmear) {
          return false;
        }
      }

      // Age range
      if (record.age !== null) {
        if (record.age < cbcFilters.ageRange[0] || record.age > cbcFilters.ageRange[1]) return false;
      }

      // Sex
      if (cbcFilters.sexes.length > 0 && !cbcFilters.sexes.includes(record.sex)) {
        return false;
      }

      // RDT
      if (cbcFilters.rdtResults.length > 0 && !cbcFilters.rdtResults.includes(record.rdt)) {
        return false;
      }

      // Collection place
      if (cbcFilters.collectionPlaces.length > 0 && !cbcFilters.collectionPlaces.includes(record.collectionPlace)) {
        return false;
      }

      // State
      if (cbcFilters.states.length > 0 && !cbcFilters.states.includes(record.normalizedState)) {
        return false;
      }

      // Hospitalised
      if (cbcFilters.hospitalised.length > 0 && !cbcFilters.hospitalised.includes(record.hospitalised)) {
        return false;
      }

      // Blood group
      if (cbcFilters.bloodGroups.length > 0 && !cbcFilters.bloodGroups.includes(record.bloodGroup)) {
        return false;
      }

      // Record completeness
      if (cbcFilters.recordCompleteness === 'Complete' && !record.isComplete) return false;
      if (cbcFilters.recordCompleteness === 'Incomplete' && record.isComplete) return false;

      // Hemoglobin range
      if (record.hbFinal !== null) {
        if (record.hbFinal < cbcFilters.hbRange[0] || record.hbFinal > cbcFilters.hbRange[1]) return false;
      }

      // WBC range
      if (record.totalWbc !== null) {
        if (record.totalWbc < cbcFilters.wbcRange[0] || record.totalWbc > cbcFilters.wbcRange[1]) return false;
      }

      // Platelet range
      if (record.plateletCount !== null) {
        if (record.plateletCount < cbcFilters.plateletRange[0] || record.plateletCount > cbcFilters.plateletRange[1]) return false;
      }

      // Date range
      if (cbcFilters.dateRange.start && record.collectionDate && record.collectionDate < cbcFilters.dateRange.start) return false;
      if (cbcFilters.dateRange.end && record.collectionDate && record.collectionDate > cbcFilters.dateRange.end) return false;

      return true;
    });
  }, [dataset, cbcFilters]);

  // File upload handler
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const buffer = await file.arrayBuffer();
      const newDataset = parseWorkbookBuffer(buffer, file.name);
      setDataset(newDataset);
      resetDemoFilters();
      resetCbcFilters();
      setError(null);
    } catch (err: any) {
      setError(`Failed to parse uploaded workbook: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Reload default
  const reloadDefaultDataset = async () => {
    try {
      setLoading(true);
      const data = await loadInitialDataset();
      setDataset(data);
      resetDemoFilters();
      resetCbcFilters();
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to reload dataset');
    } finally {
      setLoading(false);
    }
  };

  // Export handler
  const exportCurrentView = (format: 'csv' | 'json') => {
    if (!dataset) return;
    const isDemoTab = ['demographics', 'infographic', 'geographic'].includes(activeTab);
    const dataToExport = isDemoTab ? filteredDemographic : filteredCbc;
    const prefix = isDemoTab ? 'Demographic_Export' : 'CBC_Export';
    const filename = `${prefix}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const sanitizedRows = dataToExport.map(r => {
        const copy: any = { ...r };
        delete copy.rawRow;
        delete copy.rawContact;
        delete copy.rawName;
        return copy;
      });
      exportToCsv(sanitizedRows, filename);
    } else {
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const totalRawDemoCount = dataset?.rawDemographic.length || 0;
  const totalRawCbcCount = dataset?.rawCbc.length || 0;

  return (
    <DataContext.Provider
      value={{
        dataset,
        loading,
        error,
        activeTab,
        setActiveTab,
        demoFilters,
        setDemoFilters,
        resetDemoFilters,
        filteredDemographic,
        activeDemoFilterCount,
        cbcFilters,
        setCbcFilters,
        resetCbcFilters,
        filteredCbc,
        activeCbcFilterCount,
        handleFileUpload,
        reloadDefaultDataset,
        exportCurrentView,
        totalRawDemoCount,
        totalRawCbcCount
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
