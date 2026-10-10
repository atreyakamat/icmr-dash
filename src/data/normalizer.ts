import {
  DemographicRecord,
  CbcRecord,
  Gender,
  RdtResult,
  LocalityType,
  MaritalStatus,
  PreExistingIllness,
  HospitalisedStatus
} from './types';

// State normalization mapping
const STATE_MAP: Record<string, string> = {
  'UP': 'Uttar Pradesh',
  'UTTAR PRADESH': 'Uttar Pradesh',
  'UTTAR PRADESH ': 'Uttar Pradesh',
  'UTTARPRADESH': 'Uttar Pradesh',
  'BIHAR': 'Bihar',
  'GOA': 'Goa',
  'WEST BENGAL': 'West Bengal',
  'WEST BANGAL': 'West Bengal',
  'WEST BENGAL ': 'West Bengal',
  'JHARKHAND': 'Jharkhand',
  'ASSAM': 'Assam',
  'ODISHA': 'Odisha',
  'ORISSA': 'Odisha',
  'MADHYA PRADESH': 'Madhya Pradesh',
  'MP': 'Madhya Pradesh',
  'KARNATAKA': 'Karnataka',
  'MAHARASHTRA': 'Maharashtra',
  'ANDRA PRADESH': 'Andhra Pradesh',
  'ANDHRA PRADESH': 'Andhra Pradesh',
  'TAMIL NADU': 'Tamil Nadu',
  'TAMILNADU': 'Tamil Nadu',
  'RAJASTHAN': 'Rajasthan',
  'GUJARAT': 'Gujarat',
  'KERALA': 'Kerala',
  'PUNJAB': 'Punjab',
  'PUNJAB ': 'Punjab',
  'HARYANA': 'Haryana',
  'UTTARAKHAND': 'Uttarakhand',
  'DELHI': 'Delhi',
  'CHHATTISGARH': 'Chhattisgarh',
  'CHATTISGARH': 'Chhattisgarh',
  'TRIPURA': 'Tripura',
  'MANIPUR': 'Manipur',
  'MEGHALAYA': 'Meghalaya',
  'NAGALAND': 'Nagaland',
  'HIMACHAL PRADESH': 'Himachal Pradesh',
  'JAMMU AND KASHMIR': 'Jammu & Kashmir',
};

export function normalizeState(rawState: any): string {
  if (!rawState) return 'Unknown';
  const str = String(rawState).trim().toUpperCase();
  if (str === '0' || str === '#REF!' || str === 'NONE' || str === 'NA') return 'Unknown';
  return STATE_MAP[str] || str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function normalizeGender(rawGender: any): Gender {
  if (!rawGender) return 'Unknown';
  const str = String(rawGender).trim().toUpperCase();
  if (str === 'M' || str === 'MALE') return 'Male';
  if (str === 'F' || str === 'FEMALE') return 'Female';
  return 'Unknown';
}

export function normalizeRdt(rawRdt: any): RdtResult {
  if (!rawRdt) return 'Unspecified';
  const str = String(rawRdt).trim().toUpperCase();
  if (str === 'PV') return 'PV';
  if (str === 'PF') return 'PF';
  if (str === 'MIX') return 'MIX';
  if (str.includes('DOUBTFUL')) return 'Doubtful';
  if (str === 'NEGATIVE' || str === 'NEG') return 'Negative';
  if (str === '0' || str === 'NA' || str === 'NONE') return 'Unspecified';
  return 'Unspecified';
}

export function normalizeLocality(rawLocality: any): LocalityType {
  if (!rawLocality) return 'Unknown';
  const str = String(rawLocality).trim().toUpperCase();
  if (str.includes('CONSTRUCTION')) return 'Construction Site';
  if (str.includes('HOUSING') || str.includes('RESIDENTIAL')) return 'Housing';
  if (str.includes('RENT')) return 'Rented Room';
  return 'Other';
}

export function normalizeMaritalStatus(rawMarital: any): MaritalStatus {
  if (!rawMarital) return 'Unknown';
  const str = String(rawMarital).trim().toUpperCase();
  if (str.includes('UNMARRIED') || str.includes('SINGLE')) return 'Unmarried';
  if (str.includes('MARRIED')) return 'Married';
  return 'Unknown';
}

export function normalizeYesNo(rawVal: any): 'Yes' | 'No' | 'Unknown' {
  if (!rawVal) return 'Unknown';
  const str = String(rawVal).trim().toUpperCase();
  if (str === 'YES' || str === 'Y' || str === 'TRUE' || str === '1') return 'Yes';
  if (str === 'NO' || str === 'N' || str === 'FALSE' || str === '0') return 'No';
  return 'Unknown';
}

export function parseCoordinates(rawCoord: any): { lat: number; lng: number } | null {
  if (!rawCoord) return null;
  const str = String(rawCoord).trim();
  if (str === '0' || str === 'NA' || str === 'NONE' || str.length < 5) return null;

  // Decimal pattern: "15.351394, 73.954123" or "15.351394 73.954123"
  const decMatch = str.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decMatch) {
    const lat = parseFloat(decMatch[1]);
    const lng = parseFloat(decMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // DMS pattern: 15°42'27.3"N 73°58'21.5"E
  const dmsMatch = str.match(/(\d+)°(\d+)'([\d.]+)"?([NS])[,\s]+(\d+)°(\d+)'([\d.]+)"?([EW])/i);
  if (dmsMatch) {
    let lat = parseInt(dmsMatch[1], 10) + parseInt(dmsMatch[2], 10) / 60 + parseFloat(dmsMatch[3]) / 3600;
    if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
    let lng = parseInt(dmsMatch[5], 10) + parseInt(dmsMatch[6], 10) / 60 + parseFloat(dmsMatch[7]) / 3600;
    if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Loose comma split attempt
  if (str.includes(',')) {
    const parts = str.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    if (parts.length >= 2 && parts[0] >= -90 && parts[0] <= 90 && parts[1] >= -180 && parts[1] <= 180) {
      return { lat: parts[0], lng: parts[1] };
    }
  }

  return null;
}

export function parseDate(rawDate: any): { iso: string | null; date: Date | null } {
  if (!rawDate) return { iso: null, date: null };
  const str = String(rawDate).trim();
  if (str === '0' || str === '00:00:00' || str.includes('NOT AVAILABLE') || str === 'NA') {
    return { iso: null, date: null };
  }

  // If already standard ISO date or Date object string
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 1990 && directDate.getFullYear() < 2035) {
    return { iso: directDate.toISOString().split('T')[0], date: directDate };
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return { iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, date: d };
    }
  }

  // If numeric Excel timestamp
  const num = Number(str);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + num * 86400000);
    if (!isNaN(d.getTime())) {
      return { iso: d.toISOString().split('T')[0], date: d };
    }
  }

  return { iso: null, date: null };
}

export function categorizeAge(age: number | null): string {
  if (age === null || isNaN(age)) return 'Unknown';
  if (age < 15) return '< 15 (Pediatric)';
  if (age <= 24) return '15–24 (Youth)';
  if (age <= 44) return '25–44 (Young Adult)';
  if (age <= 64) return '45–64 (Middle Aged)';
  return '65+ (Senior)';
}

export function categorizeBmi(bmi: number | null): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'Unknown' {
  if (bmi === null || isNaN(bmi) || bmi <= 0 || bmi > 80) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Overweight';
  return 'Obese';
}

export function categorizeEducation(rawEdu: any): { label: string; category: string } {
  if (!rawEdu) return { label: 'Unspecified', category: 'Unspecified' };
  const str = String(rawEdu).trim().toUpperCase();
  if (str === '0' || str === 'NIL' || str === 'NONE' || str === 'UNEDUCATED' || str === 'ILLITERATE') {
    return { label: 'Nil / No Formal', category: 'No Formal' };
  }
  if (str.includes('PRIMARY') || str === '5TH' || str === '1ST' || str === '4TH') {
    return { label: str, category: 'Primary' };
  }
  if (str === '8TH' || str === '7TH' || str === '6TH' || str === '9TH') {
    return { label: str, category: 'Middle School' };
  }
  if (str === '10' || str === '10TH' || str.includes('SSC') || str.includes('MATRIC')) {
    return { label: '10th (Secondary)', category: 'Secondary' };
  }
  if (str === '12' || str === '12TH' || str.includes('HSC') || str.includes('HIGHER')) {
    return { label: '12th (Higher Secondary)', category: 'Higher Secondary' };
  }
  if (str.includes('GRADUATE') || str.includes('BCOM') || str.includes('BA') || str.includes('BSC') || str.includes('DEGREE')) {
    return { label: 'Graduate / Degree', category: 'Graduate' };
  }
  if (str.includes('POST') || str.includes('MASTER') || str.includes('MSC') || str.includes('MA') || str.includes('MBA')) {
    return { label: 'Post Graduate', category: 'Post Graduate' };
  }
  return { label: String(rawEdu).trim(), category: 'Other' };
}

export function categorizeOccupation(rawOcc: any): { label: string; category: string } {
  if (!rawOcc) return { label: 'Unspecified', category: 'Unspecified' };
  const str = String(rawOcc).trim().toUpperCase();
  if (str === '0' || str === 'NA' || str === 'NONE') return { label: 'Unspecified', category: 'Unspecified' };
  if (str.includes('LABOUR') || str.includes('WORKER') || str.includes('COOLIE') || str.includes('DAILY WAGE')) {
    return { label: 'Labour / Daily Wage', category: 'Manual / Labour' };
  }
  if (str.includes('CONSTRUCTION') || str.includes('MASON') || str.includes('PAINTER') || str.includes('CARPENTER') || str.includes('PLUMBER') || str.includes('ELECTRICIAN') || str.includes('WELDER')) {
    return { label: str.charAt(0) + str.slice(1).toLowerCase(), category: 'Skilled Trades' };
  }
  if (str.includes('HOUSEKEEPING') || str.includes('CLEANER') || str.includes('MAID') || str.includes('SWEEPER')) {
    return { label: 'Housekeeping / Cleaning', category: 'Service' };
  }
  if (str.includes('COOK') || str.includes('WAITER') || str.includes('CHEF') || str.includes('HOTEL')) {
    return { label: 'Hospitality / Cook', category: 'Service' };
  }
  if (str.includes('DRIVER') || str.includes('AUTO') || str.includes('PILOT')) {
    return { label: 'Driver / Transport', category: 'Transport' };
  }
  if (str.includes('SECURITY') || str.includes('GUARD')) {
    return { label: 'Security Guard', category: 'Service' };
  }
  if (str.includes('STUDENT')) return { label: 'Student', category: 'Student' };
  if (str.includes('HOUSEWIFE') || str.includes('HOMEMAKER')) return { label: 'Homemaker', category: 'Homemaker' };
  if (str.includes('BUSINESS') || str.includes('SHOP') || str.includes('VENDOR') || str.includes('AGENT')) {
    return { label: 'Business / Commerce', category: 'Commerce' };
  }
  return { label: str.charAt(0) + str.slice(1).toLowerCase(), category: 'Other' };
}

export function parseSymptoms(rawSym: any): string[] {
  if (!rawSym) return [];
  const str = String(rawSym).trim().toUpperCase();
  if (str === '0' || str === 'NA' || str === 'NO' || str === 'NONE') return [];
  
  const tokens = str.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  const normalized: string[] = [];
  
  tokens.forEach(t => {
    if (t.includes('FEVER')) normalized.push('Fever');
    else if (t.includes('CHILL')) normalized.push('Chills');
    else if (t.includes('HEADACHE')) normalized.push('Headache');
    else if (t.includes('VOMIT')) normalized.push('Vomiting');
    else if (t.includes('FATIGUE') || t.includes('TIRED') || t.includes('WEAKNESS')) normalized.push('Fatigue');
    else if (t.includes('BODY') || t.includes('MYALGIA') || t.includes('ACHE')) normalized.push('Body Ache');
    else if (t.includes('COUGH')) normalized.push('Cough');
    else if (t.includes('APPETITE')) normalized.push('Loss of Appetite');
    else if (t !== 'OTHER' && t !== 'NA') normalized.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  });

  return Array.from(new Set(normalized));
}

export function maskContact(rawContact: any): string {
  if (!rawContact) return 'N/A';
  const str = String(rawContact).replace(/\D/g, '');
  if (str.length >= 8) {
    return `${str.slice(0, 3)}****${str.slice(-2)}`;
  }
  return 'Protected';
}

export function maskName(rawName: any): string {
  if (!rawName || rawName === '#REF!' || rawName === '0') return 'Confidential Subject';
  const parts = String(rawName).trim().split(/\s+/);
  return parts.map(p => p.length > 0 ? `${p[0]}***` : '').join(' ');
}

// Normalize Demographic Record
export function normalizeDemographicRecord(row: Record<string, any>, index: number): DemographicRecord {
  const qualityIssues: string[] = [];
  
  // ID is stored in 'Column 1' in raw Excel
  const rawId = row['Column 1'] || row['ID'] || row['id'] || `DEMO_${index + 1}`;
  const id = String(rawId).trim();
  
  const status = String(row['STATUS'] || 'Unspecified').trim();
  const rawRdt = String(row['RDT'] || '').trim();
  const rdt = normalizeRdt(rawRdt);
  
  const { iso: collectionDate, date: parsedDate } = parseDate(row['Collection DATE']);
  if (!collectionDate && row['Collection DATE']) {
    qualityIssues.push(`Ambiguous date format: "${row['Collection DATE']}"`);
  }

  const collectionPlace = String(row['PLACE OF SAMPLE COLLECTION'] || 'Unspecified').trim();
  
  // Age
  let age: number | null = null;
  const rawAge = row['AGE (YEARS)'];
  if (rawAge !== null && rawAge !== undefined && String(rawAge).trim() !== '' && String(rawAge).trim() !== '0') {
    const parsedAge = parseFloat(String(rawAge));
    if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge <= 120) {
      age = parsedAge;
    } else {
      qualityIssues.push(`Implausible age value: "${rawAge}"`);
    }
  }

  // Gender
  const rawGender = String(row['GENDER'] || '').trim();
  const gender = normalizeGender(rawGender);
  if (gender === 'Unknown' && rawGender) {
    qualityIssues.push(`Unrecognized gender: "${rawGender}"`);
  }

  // Occupation & Education
  const occInfo = categorizeOccupation(row['OCCUPATION']);
  const eduInfo = categorizeEducation(row['EDUCATION QUALIFICATION']);
  
  // Family size
  let familySize: number | null = null;
  const rawFam = row['NO. OF PEOPLE IN FAMILY'];
  if (rawFam !== null && rawFam !== undefined && String(rawFam).trim() !== '') {
    const parsedFam = parseInt(String(rawFam), 10);
    if (!isNaN(parsedFam) && parsedFam >= 0) familySize = parsedFam;
  }

  const maritalStatus = normalizeMaritalStatus(row['MARITAL STATUS']);
  const localityType = normalizeLocality(row['LOCALITY TYPE']);
  const pastMalaria = normalizeYesNo(row['PAST HISTORY of malaria']);
  const pastMalariaHistory = pastMalaria === 'Yes' ? true : pastMalaria === 'No' ? false : null;

  // Coordinates
  const rawCurrentCoords = row['Column 22'] || row['MAP CURRENT ADDRESS'] || '';
  const currentCoordinates = parseCoordinates(rawCurrentCoords);
  if (rawCurrentCoords && !currentCoordinates) {
    qualityIssues.push(`Unparseable current coordinates: "${rawCurrentCoords}"`);
  }

  const rawNativeCoords = row['MAP NATIVE ADDRESS'] || '';
  const nativeCoordinates = parseCoordinates(rawNativeCoords);
  if (rawNativeCoords && !nativeCoordinates) {
    qualityIssues.push(`Unparseable native coordinates: "${rawNativeCoords}"`);
  }

  const state = String(row['STATE'] || '').trim();
  const normalizedState = normalizeState(state);

  // Body Temperature
  let bodyTemperature: number | null = null;
  let bodyTemperatureUnit: 'C' | 'F' | 'Unknown' = 'Unknown';
  const rawTemp = row['BODY TEMPERATURE'];
  if (rawTemp !== null && rawTemp !== undefined && String(rawTemp).trim() !== '') {
    const t = parseFloat(String(rawTemp));
    if (!isNaN(t) && t > 0) {
      if (t >= 34 && t <= 44) {
        bodyTemperature = Math.round(t * 10) / 10;
        bodyTemperatureUnit = 'C';
      } else if (t >= 94 && t <= 108) {
        // Convert F to C
        bodyTemperature = Math.round(((t - 32) * 5 / 9) * 10) / 10;
        bodyTemperatureUnit = 'F';
      } else {
        qualityIssues.push(`Implausible body temperature: "${rawTemp}"`);
      }
    }
  }

  // Weight & Height & BMI
  let weightKg: number | null = null;
  const rawWeight = row['WEIGHT'];
  if (rawWeight !== null && rawWeight !== undefined && String(rawWeight).trim() !== '' && String(rawWeight).trim() !== '0') {
    const w = parseFloat(String(rawWeight));
    if (!isNaN(w) && w >= 5 && w <= 250) weightKg = w;
  }

  let heightFt: number | null = null;
  let heightCm: number | null = null;
  const rawHeight = row['HEIGHT'];
  if (rawHeight !== null && rawHeight !== undefined && String(rawHeight).trim() !== '' && String(rawHeight).trim() !== '0') {
    const h = parseFloat(String(rawHeight));
    if (!isNaN(h)) {
      if (h >= 100 && h <= 250) {
        heightCm = h;
        heightFt = Math.round((h / 30.48) * 10) / 10;
      } else if (h >= 1.5 && h <= 8.0) {
        heightFt = h;
        heightCm = Math.round(h * 30.48);
      }
    }
  }

  let bmi: number | null = null;
  if (weightKg && heightCm && heightCm > 0) {
    const heightM = heightCm / 100;
    bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  } else if (row['BMI'] && !isNaN(parseFloat(String(row['BMI'])))) {
    const b = parseFloat(String(row['BMI']));
    if (b > 5 && b < 80) bmi = Math.round(b * 10) / 10;
  }

  const rawBg = String(row['BLOOD GROUP'] || '').trim().toUpperCase();
  const bloodGroup = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(rawBg) ? rawBg : (rawBg === '0' || !rawBg ? 'Unknown' : rawBg);

  const hbCount = row['HB COUNT g/dL'] ? parseFloat(String(row['HB COUNT g/dL'])) || null : null;
  const asiloHbVal = row['ASILO HB'] ? parseFloat(String(row['ASILO HB'])) || null : null;
  const asiloHb = asiloHbVal && asiloHbVal > 0 ? asiloHbVal : null;

  const preExisting = normalizeYesNo(row['PRE-EXISTING ILLNESS']);
  const hospVal = normalizeYesNo(row['HOSPITALISED']);

  let daysAdmitted: number | null = null;
  if (row['NO. OF DAYS ADMIT'] && !isNaN(parseInt(String(row['NO. OF DAYS ADMIT']), 10))) {
    daysAdmitted = parseInt(String(row['NO. OF DAYS ADMIT']), 10);
  }

  const isComplete = Boolean(id && age !== null && gender !== 'Unknown' && collectionPlace && state);

  return {
    id,
    originalId: id,
    status,
    rdt,
    rawRdt,
    collectionDate,
    parsedDate,
    collectionPlace,
    age,
    ageGroup: categorizeAge(age),
    gender,
    rawGender,
    occupation: occInfo.label,
    occupationCategory: occInfo.category,
    familySize,
    maritalStatus,
    education: eduInfo.label,
    educationCategory: eduInfo.category,
    localityType,
    pastMalariaHistory,
    lastMalariaTime: String(row['LAST TIME GOT MALARIA (LAST 5 YEARS)'] || '').trim(),
    contact: maskContact(row['CONTACT']),
    rawContact: String(row['CONTACT'] || ''),
    currentAddress: String(row['CURRENT ADDRESS'] || '').trim(),
    currentCoordinates,
    rawCurrentCoordinates: String(rawCurrentCoords),
    nativeAddress: String(row['NATIVE ADDRESS'] || '').trim(),
    nativeCoordinates,
    rawNativeCoordinates: String(rawNativeCoords),
    state,
    normalizedState,
    bodyTemperature,
    bodyTemperatureUnit,
    weightKg,
    heightFt,
    heightCm,
    bmi,
    bmiCategory: categorizeBmi(bmi),
    bloodGroup,
    hbCount: hbCount && hbCount > 0 && hbCount < 30 ? hbCount : null,
    asiloHb,
    preExistingIllness: preExisting,
    kindOfIllness: String(row['KIND OF ILLNESS'] || 'None').trim(),
    symptoms: parseSymptoms(row['SYMPTOMS']),
    rawSymptoms: String(row['SYMPTOMS'] || ''),
    hospitalised: hospVal,
    daysAdmitted,
    additionalRemarks: String(row['Additional remarks if any'] || '').trim(),
    isComplete,
    qualityIssues,
    rawRow: row
  };
}

// Normalize CBC Record
export function normalizeCbcRecord(row: Record<string, any>, index: number): CbcRecord {
  const qualityIssues: string[] = [];
  
  const rawId = row['ID'] || row['id'] || `CBC_${index + 1}`;
  const idStr = String(rawId).trim();
  const id = idStr === '0' || idStr === '#REF!' ? `UNID_${index + 1}` : idStr;
  
  if (idStr === '0' || idStr === '#REF!') {
    qualityIssues.push(`Invalid or placeholder identifier: "${idStr}"`);
  }

  const status = String(row['STATUS'] || 'Unspecified').trim();
  const rawRdt = String(row['RDT'] || '').trim();
  const rdt = normalizeRdt(rawRdt);
  
  const { iso: collectionDate, date: parsedDate } = parseDate(row['Collection DATE']);
  if (!collectionDate && row['Collection DATE'] && String(row['Collection DATE']).trim() !== '00:00:00') {
    qualityIssues.push(`Ambiguous date format: "${row['Collection DATE']}"`);
  }

  const collectionPlace = String(row['PLACE OF SAMPLE COLLECTION'] || 'Unspecified').trim();
  const rawSex = String(row['SEX'] || '').trim();
  const sex = normalizeGender(rawSex);

  // Age
  let age: number | null = null;
  const rawAge = row['AGE (YEARS)'];
  if (rawAge !== null && rawAge !== undefined && String(rawAge).trim() !== '' && String(rawAge).trim() !== '0') {
    const parsedAge = parseFloat(String(rawAge));
    if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge <= 120) {
      age = parsedAge;
    } else {
      qualityIssues.push(`Implausible age value: "${rawAge}"`);
    }
  }

  // Lab Hemoglobin values
  const parseNum = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '' || s === '0' || s === '#DIV/0!' || s === '#VALUE!' || s === '#REF!' || s.includes('not')) return null;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  const hbLab = parseNum(row['HB (LAB)']);
  const hbClinic = parseNum(row['Hb (Clinic)']);
  let hbFinal = parseNum(row['HB final']);
  if (hbFinal === null) {
    if (hbLab !== null && hbClinic !== null) hbFinal = Math.round(((hbLab + hbClinic) / 2) * 100) / 100;
    else if (hbLab !== null) hbFinal = hbLab;
    else if (hbClinic !== null) hbFinal = hbClinic;
  }

  const pcv = parseNum(row['PCV']);
  const rbc = parseNum(row['RBC']);
  const totalWbc = parseNum(row['TOTAL WBC COUNT/cu.mm']);
  
  const neutrophils = parseNum(row['NEUTROPHILS']);
  const lymphocytes = parseNum(row['LYMPHOCYTES']);
  const eosinophils = parseNum(row['EOSINOPHILS']);
  const basophils = parseNum(row['BASOPHILS']);
  const monocytes = parseNum(row['MONOCYTES']);

  // Differential count validation
  let totalDifferentialPct: number | null = null;
  if (neutrophils !== null || lymphocytes !== null || eosinophils !== null || basophils !== null || monocytes !== null) {
    const sum = (neutrophils || 0) + (lymphocytes || 0) + (eosinophils || 0) + (basophils || 0) + (monocytes || 0);
    totalDifferentialPct = Math.round(sum * 10) / 10;
    if (sum > 0 && (sum < 95 || sum > 105)) {
      qualityIssues.push(`Differential count total is out of balance: ${sum}% (expected 100%)`);
    }
  }

  // Platelet count parsing & anomaly detection
  let plateletCount: number | null = null;
  let plateletCountRaw: number | null = parseNum(row['PLATELATE COUNT/cu.mm']);
  if (plateletCountRaw !== null) {
    if (plateletCountRaw < 50 && plateletCountRaw > 0) {
      // Stored in lakhs (e.g., 3.96 -> 396,000)
      plateletCount = Math.round(plateletCountRaw * 100000);
      qualityIssues.push(`Platelet count appeared in lakhs/unit (${plateletCountRaw}), scaled to ${plateletCount}`);
    } else if (plateletCountRaw > 2000000) {
      // Possible extra zeros (e.g. 10150000 -> 101,500)
      plateletCount = Math.round(plateletCountRaw / 100);
      qualityIssues.push(`Platelet outlier detected (${plateletCountRaw}), normalized to ${plateletCount}`);
    } else {
      plateletCount = plateletCountRaw;
    }
  }

  const reticulocytePct = parseNum(row['RETICULOCYTE COUNT %']);
  const esr = parseNum(row['ESR mm']);
  const mcv = parseNum(row['MCV']);
  const mch = parseNum(row['MCH']);
  const mchc = parseNum(row['MCHC']);

  const smearStr = String(row['PERIPHERAL SMEAR'] || '').trim();
  let smearCategory = 'Unexamined / Not Done';
  if (smearStr && smearStr !== '0' && smearStr !== 'NA') {
    const uSmear = smearStr.toUpperCase();
    if (uSmear.includes('NORMOCYTIC')) smearCategory = 'Normocytic Normochromic';
    else if (uSmear.includes('MICROCYTIC') || uSmear.includes('MICROCYTE')) smearCategory = 'Microcytic / Hypochromic';
    else if (uSmear.includes('LEUCOPENIA') || uSmear.includes('LEUKOPENIA')) smearCategory = 'Leukopenia / Thrombocytopenia';
    else smearCategory = 'Other Smear Findings';
  }

  const hospVal = normalizeYesNo(row['HOSPITALISED']);
  const state = String(row['STATE'] || '').trim();
  const normalizedState = normalizeState(state);

  const weightKg = parseNum(row['WEIGHT']);
  const heightFt = parseNum(row['HEIGHT']);
  
  let bmi: number | null = null;
  if (weightKg && heightFt && heightFt > 0) {
    const heightM = heightFt * 0.3048;
    bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  } else if (row['BMI'] && parseNum(row['BMI'])) {
    bmi = parseNum(row['BMI']);
  }

  const rawBg = String(row['BLOOD GROUP'] || '').trim().toUpperCase();
  const bloodGroup = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(rawBg) ? rawBg : (rawBg === '0' || !rawBg ? 'Unknown' : rawBg);

  const preExisting = normalizeYesNo(row['PRE-EXISTING ILLNESS']);

  // Record completeness: has valid ID, age/sex, and at least 3 major lab parameters (HB, WBC, Platelet/RBC)
  const isComplete = Boolean(
    idStr !== '0' && idStr !== '#REF!' &&
    (hbFinal !== null || hbLab !== null) &&
    (totalWbc !== null || plateletCount !== null || rbc !== null)
  );

  return {
    id,
    originalId: idStr,
    status,
    rdt,
    rawRdt,
    collectionDate,
    parsedDate,
    collectionPlace,
    name: maskName(row['NAME']),
    rawName: String(row['NAME'] || ''),
    sex,
    rawSex,
    age,
    ageGroup: categorizeAge(age),
    hbLab,
    hbClinic,
    hbFinal,
    pcv,
    rbc,
    totalWbc,
    neutrophils,
    lymphocytes,
    eosinophils,
    basophils,
    monocytes,
    totalDifferentialPct,
    plateletCount,
    plateletCountRaw,
    reticulocytePct,
    esr,
    mcv,
    mch,
    mchc,
    peripheralSmear: smearStr,
    peripheralSmearCategory: smearCategory,
    hospitalised: hospVal,
    state,
    normalizedState,
    weightKg,
    heightFt,
    bmi,
    bmiCategory: categorizeBmi(bmi),
    bloodGroup,
    preExistingIllness: preExisting,
    kindOfIllness: String(row['KIND OF ILLNESS'] || 'None').trim(),
    symptoms: parseSymptoms(row['SYMPTOMS']),
    rawSymptoms: String(row['SYMPTOMS'] || ''),
    isComplete,
    qualityIssues,
    rawRow: row
  };
}
