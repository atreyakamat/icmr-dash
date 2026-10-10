export type RdtResult = 'PV' | 'PF' | 'MIX' | 'Doubtful' | 'Negative' | 'Unspecified';
export type Gender = 'Male' | 'Female' | 'Unknown';
export type LocalityType = 'Construction Site' | 'Housing' | 'Rented Room' | 'Other' | 'Unknown';
export type MaritalStatus = 'Married' | 'Unmarried' | 'Unknown';
export type PreExistingIllness = 'Yes' | 'No' | 'Unknown';
export type HospitalisedStatus = 'Yes' | 'No' | 'Unknown';

export interface DemographicRecord {
  id: string; // From 'Column 1'
  originalId: string;
  status: string;
  rdt: RdtResult;
  rawRdt: string;
  collectionDate: string | null;
  parsedDate: Date | null;
  collectionPlace: string;
  age: number | null;
  ageGroup: string;
  gender: Gender;
  rawGender: string;
  occupation: string;
  occupationCategory: string;
  familySize: number | null;
  maritalStatus: MaritalStatus;
  education: string;
  educationCategory: string;
  localityType: LocalityType;
  pastMalariaHistory: boolean | null;
  lastMalariaTime: string;
  contact: string; // Masked for privacy
  rawContact: string;
  currentAddress: string;
  currentCoordinates: { lat: number; lng: number } | null;
  rawCurrentCoordinates: string;
  nativeAddress: string;
  nativeCoordinates: { lat: number; lng: number } | null;
  rawNativeCoordinates: string;
  state: string;
  normalizedState: string;
  bodyTemperature: number | null; // Normalized in °C
  bodyTemperatureUnit: 'C' | 'F' | 'Unknown';
  weightKg: number | null;
  heightFt: number | null;
  heightCm: number | null;
  bmi: number | null;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'Unknown';
  bloodGroup: string;
  hbCount: number | null;
  asiloHb: number | null;
  preExistingIllness: PreExistingIllness;
  kindOfIllness: string;
  symptoms: string[];
  rawSymptoms: string;
  hospitalised: HospitalisedStatus;
  daysAdmitted: number | null;
  additionalRemarks: string;
  isComplete: boolean;
  qualityIssues: string[];
  rawRow: Record<string, any>;
}

export interface CbcRecord {
  id: string;
  originalId: string;
  status: string;
  rdt: RdtResult;
  rawRdt: string;
  collectionDate: string | null;
  parsedDate: Date | null;
  collectionPlace: string;
  name: string; // Masked for privacy
  rawName: string;
  sex: Gender;
  rawSex: string;
  age: number | null;
  ageGroup: string;
  hbLab: number | null;
  hbClinic: number | null;
  hbFinal: number | null;
  pcv: number | null;
  rbc: number | null;
  totalWbc: number | null;
  neutrophils: number | null;
  lymphocytes: number | null;
  eosinophils: number | null;
  basophils: number | null;
  monocytes: number | null;
  totalDifferentialPct: number | null;
  plateletCount: number | null;
  plateletCountRaw: number | null;
  reticulocytePct: number | null;
  esr: number | null;
  mcv: number | null;
  mch: number | null;
  mchc: number | null;
  peripheralSmear: string;
  peripheralSmearCategory: string;
  hospitalised: HospitalisedStatus;
  state: string;
  normalizedState: string;
  weightKg: number | null;
  heightFt: number | null;
  bmi: number | null;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'Unknown';
  bloodGroup: string;
  preExistingIllness: PreExistingIllness;
  kindOfIllness: string;
  symptoms: string[];
  rawSymptoms: string;
  isComplete: boolean;
  qualityIssues: string[];
  rawRow: Record<string, any>;
}

export interface DemographicFilterState {
  searchQuery: string;
  dateRange: { start: string; end: string };
  ageRange: [number, number];
  genders: Gender[];
  rdtResults: RdtResult[];
  localityTypes: LocalityType[];
  states: string[];
  collectionPlaces: string[];
  maritalStatuses: MaritalStatus[];
  hospitalised: HospitalisedStatus[];
  pastMalariaHistory: ('Yes' | 'No' | 'All');
  preExistingIllness: ('Yes' | 'No' | 'All');
  bloodGroups: string[];
}

export interface CbcFilterState {
  searchQuery: string;
  dateRange: { start: string; end: string };
  ageRange: [number, number];
  sexes: Gender[];
  rdtResults: RdtResult[];
  collectionPlaces: string[];
  states: string[];
  hospitalised: HospitalisedStatus[];
  bloodGroups: string[];
  recordCompleteness: ('All' | 'Complete' | 'Incomplete');
  hbRange: [number, number];
  wbcRange: [number, number];
  plateletRange: [number, number];
}

export interface QualityIssue {
  id: string;
  sheet: 'DEMOGRAPHIC' | 'CBC';
  column: string;
  category: 'Missing Value' | 'Invalid Type / Formula' | 'Implausible Number' | 'Inconsistent Category' | 'Duplicate' | 'Coordinate Parse Error' | 'Date Formatting';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedCount: number;
  totalRecords: number;
  pctAffected: number;
  examples: string[];
  actionTaken: string;
}

export interface QualityReport {
  totalDemographicRows: number;
  totalCbcRows: number;
  demographicMissingByCol: Record<string, { missing: number; pct: number }>;
  cbcMissingByCol: Record<string, { missing: number; pct: number }>;
  demographicDuplicateIds: string[];
  cbcDuplicateIds: string[];
  issues: QualityIssue[];
  formulaErrorsCount: number;
  implausibleAgesCount: number;
  implausibleLabValuesCount: number;
  differentialImbalanceCount: number;
  unparseableCoordsCount: number;
}
