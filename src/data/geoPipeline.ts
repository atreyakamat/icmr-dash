import { DemographicRecord } from './types';
import { parseCoordinates, normalizeState } from './normalizer';

export type GeoResolutionStatus =
  | 'EXACT_COORDINATES'
  | 'GEOCODED_LOCALITY'
  | 'FACILITY_COORDINATES'
  | 'STATE_CENTROID'
  | 'UNRESOLVED';

export type GeoScope = 'GOA' | 'INDIA_OTHER_STATE' | 'OUTSIDE_INDIA' | 'UNRESOLVED';
export type LocationPerspective = 'CURRENT_RESIDENCE' | 'NATIVE_ORIGIN' | 'COLLECTION_FACILITY';
export type MapViewScope = 'GOA' | 'INDIA';

export interface ResolvedGeoRecord {
  id: string;
  age: number | null;
  gender: string;
  occupation: string;
  localityType: string;
  hospitalised: string;
  rdt: string;
  lat: number | null;
  lng: number | null;
  localityName: string;
  state: string;
  scope: GeoScope;
  resolutionStatus: GeoResolutionStatus;
  unresolvedReason?: string;
  sourceText: string;
}

export interface LocalityCluster {
  id: string;
  localityName: string;
  state: string;
  lat: number;
  lng: number;
  count: number;
  maleCount: number;
  femaleCount: number;
  hospitalisedCount: number;
  dominantOccupation: string;
  dominantLocalityType: string;
  resolutionStatus: GeoResolutionStatus;
  recordIds: string[];
}

export interface GeoQualityStats {
  totalConsidered: number;
  validExactCoordinates: number;
  geocodedLocalities: number;
  successfullyPlotted: number;
  excludedByActiveView: number;
  missingCoordinates: number;
  invalidCoordinateStrings: number;
  unresolvedCount: number;
  classifiedGoa: number;
  classifiedOtherStates: number;
  classifiedUnresolved: number;
}

// Standard Goa Health Facilities Coordinate Registry
export const GOA_HEALTH_FACILITIES: Record<string, { lat: number; lng: number; name: string }> = {
  'ASILO NGDH': { lat: 15.5925, lng: 73.8164, name: 'Asilo North Goa District Hospital, Mapusa' },
  'GMC': { lat: 15.4632, lng: 73.8567, name: 'Goa Medical College Hospital, Bambolim' },
  'PHC CANDOLIM': { lat: 15.5186, lng: 73.7667, name: 'Primary Health Centre, Candolim' },
  'PHC ALDONA': { lat: 15.5891, lng: 73.8767, name: 'Primary Health Centre, Aldona' },
  'PHC SIOLIM': { lat: 15.6322, lng: 73.7686, name: 'Primary Health Centre, Siolim' }
};

// Standard Goa Localities Registry (for text coordinates like "Carambolim")
export const GOA_LOCALITIES: Record<string, { lat: number; lng: number }> = {
  'CARAMBOLIM': { lat: 15.5015, lng: 73.9312 },
  'MAPUSA': { lat: 15.5925, lng: 73.8164 },
  'CANDOLIM': { lat: 15.5186, lng: 73.7667 },
  'CALANGUTE': { lat: 15.5439, lng: 73.7553 },
  'SIOLIM': { lat: 15.6322, lng: 73.7686 },
  'ALDONA': { lat: 15.5891, lng: 73.8767 },
  'COLVALE': { lat: 15.6310, lng: 73.8282 },
  'THIVIM': { lat: 15.6216, lng: 73.8535 },
  'ANJUNA': { lat: 15.5833, lng: 73.7431 },
  'VAGATOR': { lat: 15.5982, lng: 73.7429 },
  'PANAJI': { lat: 15.4909, lng: 73.8278 },
  'NERUL': { lat: 15.5112, lng: 73.7845 },
  'BASTORA': { lat: 15.5786, lng: 73.8324 },
  'ARPORA': { lat: 15.5684, lng: 73.7656 }
};

// Indian States Centroids for State-Level Representation
export const INDIA_STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Bihar': { lat: 25.0961, lng: 85.3131 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'West Bengal': { lat: 22.9868, lng: 87.8550 },
  'Goa': { lat: 15.2993, lng: 74.1240 },
  'Jharkhand': { lat: 23.6102, lng: 85.2799 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Odisha': { lat: 20.9517, lng: 85.0985 },
  'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179 },
  'Gujarat': { lat: 22.2587, lng: 71.1924 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
  'Punjab': { lat: 31.1471, lng: 75.3412 },
  'Haryana': { lat: 29.0588, lng: 76.0856 },
  'Uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
  'Tripura': { lat: 23.9408, lng: 91.9882 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Meghalaya': { lat: 25.4670, lng: 91.3662 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
  'Jammu & Kashmir': { lat: 33.7782, lng: 76.5762 }
};

// Extract a sanitized locality label from address strings
export function extractSanitizedLocality(rawAddress: string, state: string): string {
  if (!rawAddress || rawAddress === '0' || rawAddress === 'NA') return state || 'Unspecified';
  
  const clean = rawAddress.replace(/HNO\.\s*\S+/gi, '').replace(/\d+/g, '').replace(/,/g, ' ').trim();
  const tokens = clean.split(/\s+/).filter(t => t.length > 2);
  
  // Look for prominent village / locality keywords
  const knownKeywords = [
    'Candolim', 'Calangute', 'Mapusa', 'Colvale', 'Siolim', 'Aldona', 'Thivim',
    'Anjuna', 'Vagator', 'Nerul', 'Bastora', 'Arpora', 'Chapora', 'Panaji',
    'Samastipur', 'Gonda', 'Bardhaman', 'Pakur', 'Lakhisarai', 'Hojai', 'Balrampur',
    'Katihar', 'Muzaffarpur', 'Darbhanga', 'Bhagalpur', 'Gorakhpur', 'Varanasi'
  ];

  for (const kw of knownKeywords) {
    if (rawAddress.toUpperCase().includes(kw.toUpperCase())) {
      return kw;
    }
  }

  return tokens.slice(0, 2).join(' ') || state || 'Local Area';
}

// Process records through the Location Resolution Pipeline
export function processLocationPipeline(
  records: DemographicRecord[],
  perspective: LocationPerspective,
  geocodedCache: Record<string, { lat: number; lng: number }> = {}
): {
  resolvedRecords: ResolvedGeoRecord[];
  goaClusters: LocalityCluster[];
  indiaClusters: LocalityCluster[];
  stats: GeoQualityStats;
} {
  const resolvedRecords: ResolvedGeoRecord[] = [];

  let validExactCoords = 0;
  let geocodedCount = 0;
  let missingCoords = 0;
  let invalidCoords = 0;
  let unresolvedCount = 0;
  let classifiedGoa = 0;
  let classifiedOtherStates = 0;

  records.forEach(r => {
    let lat: number | null = null;
    let lng: number | null = null;
    let resolutionStatus: GeoResolutionStatus = 'UNRESOLVED';
    let unresolvedReason: string | undefined = undefined;
    let sourceText = '';
    let localityName = '';

    const normState = r.normalizedState || normalizeState(r.state);

    if (perspective === 'COLLECTION_FACILITY') {
      sourceText = r.collectionPlace;
      localityName = r.collectionPlace;
      const upperPlace = r.collectionPlace.toUpperCase();
      const facilityKey = Object.keys(GOA_HEALTH_FACILITIES).find(k => upperPlace.includes(k));
      if (facilityKey && GOA_HEALTH_FACILITIES[facilityKey]) {
        lat = GOA_HEALTH_FACILITIES[facilityKey].lat;
        lng = GOA_HEALTH_FACILITIES[facilityKey].lng;
        resolutionStatus = 'FACILITY_COORDINATES';
      } else {
        unresolvedReason = `Unrecognized health facility: "${r.collectionPlace}"`;
        resolutionStatus = 'UNRESOLVED';
      }
    } else if (perspective === 'CURRENT_RESIDENCE') {
      sourceText = r.rawCurrentCoordinates || r.currentAddress;
      localityName = extractSanitizedLocality(r.currentAddress, 'Goa');

      // 1. Check exact GPS coordinates in Column 22
      if (r.currentCoordinates) {
        lat = r.currentCoordinates.lat;
        lng = r.currentCoordinates.lng;
        resolutionStatus = 'EXACT_COORDINATES';
        validExactCoords++;
      } else if (r.rawCurrentCoordinates && r.rawCurrentCoordinates.trim() !== '' && r.rawCurrentCoordinates !== '0') {
        const rawUpper = r.rawCurrentCoordinates.trim().toUpperCase();
        if (GOA_LOCALITIES[rawUpper]) {
          lat = GOA_LOCALITIES[rawUpper].lat;
          lng = GOA_LOCALITIES[rawUpper].lng;
          resolutionStatus = 'GEOCODED_LOCALITY';
          geocodedCount++;
        } else if (geocodedCache[rawUpper]) {
          lat = geocodedCache[rawUpper].lat;
          lng = geocodedCache[rawUpper].lng;
          resolutionStatus = 'GEOCODED_LOCALITY';
          geocodedCount++;
        } else {
          invalidCoords++;
          unresolvedReason = `Non-numeric coordinate text in Column 22: "${r.rawCurrentCoordinates}"`;
        }
      } else {
        missingCoords++;
        // Check if cached geocode exists for locality
        const cacheKey = `${localityName}, Goa, India`.toUpperCase();
        if (geocodedCache[cacheKey]) {
          lat = geocodedCache[cacheKey].lat;
          lng = geocodedCache[cacheKey].lng;
          resolutionStatus = 'GEOCODED_LOCALITY';
          geocodedCount++;
        } else {
          unresolvedReason = 'Current address GPS coordinates missing in workbook';
        }
      }
    } else {
      // NATIVE_ORIGIN
      sourceText = r.rawNativeCoordinates || r.nativeAddress || normState;
      localityName = extractSanitizedLocality(r.nativeAddress, normState);

      if (r.nativeCoordinates) {
        lat = r.nativeCoordinates.lat;
        lng = r.nativeCoordinates.lng;
        resolutionStatus = 'EXACT_COORDINATES';
        validExactCoords++;
      } else if (r.rawNativeCoordinates && r.rawNativeCoordinates.trim() !== '' && r.rawNativeCoordinates !== '0') {
        const rawUpper = r.rawNativeCoordinates.trim().toUpperCase();
        if (geocodedCache[rawUpper]) {
          lat = geocodedCache[rawUpper].lat;
          lng = geocodedCache[rawUpper].lng;
          resolutionStatus = 'GEOCODED_LOCALITY';
          geocodedCount++;
        } else {
          invalidCoords++;
          unresolvedReason = `Non-numeric coordinate in MAP NATIVE ADDRESS: "${r.rawNativeCoordinates}"`;
        }
      } else {
        missingCoords++;
        const cacheKey = `${localityName}, ${normState}, India`.toUpperCase();
        if (geocodedCache[cacheKey]) {
          lat = geocodedCache[cacheKey].lat;
          lng = geocodedCache[cacheKey].lng;
          resolutionStatus = 'GEOCODED_LOCALITY';
          geocodedCount++;
        } else if (normState && INDIA_STATE_CENTROIDS[normState]) {
          // State centroid fallback for India-wide overview
          lat = INDIA_STATE_CENTROIDS[normState].lat;
          lng = INDIA_STATE_CENTROIDS[normState].lng;
          resolutionStatus = 'STATE_CENTROID';
        } else {
          unresolvedReason = 'Native origin GPS coordinates missing and state unrecognized';
        }
      }
    }

    // Geographic Scope Classification
    let scope: GeoScope = 'UNRESOLVED';
    if (lat !== null && lng !== null) {
      // Goa geographic bounding box roughly: Lat 14.89 to 15.80, Lng 73.68 to 74.35
      const isWithinGoaBounds = lat >= 14.85 && lat <= 15.85 && lng >= 73.65 && lng <= 74.45;
      const isGoaState = normState.toUpperCase() === 'GOA' || perspective === 'CURRENT_RESIDENCE' || perspective === 'COLLECTION_FACILITY';

      if (isWithinGoaBounds || (isGoaState && perspective !== 'NATIVE_ORIGIN')) {
        scope = 'GOA';
        classifiedGoa++;
      } else if (lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0) {
        scope = 'INDIA_OTHER_STATE';
        classifiedOtherStates++;
      } else {
        scope = 'OUTSIDE_INDIA';
      }
    } else {
      unresolvedCount++;
    }

    resolvedRecords.push({
      id: r.id,
      age: r.age,
      gender: r.gender,
      occupation: r.occupation,
      localityType: r.localityType,
      hospitalised: r.hospitalised,
      rdt: r.rdt,
      lat,
      lng,
      localityName,
      state: normState,
      scope,
      resolutionStatus,
      unresolvedReason,
      sourceText
    });
  });

  // Build Privacy-Preserving Locality Clusters (grouping points within ~0.015 degrees ≈ 1.5km or matching locality)
  function buildClusters(recordsList: ResolvedGeoRecord[]): LocalityCluster[] {
    const valid = recordsList.filter(r => r.lat !== null && r.lng !== null);
    const clusters: LocalityCluster[] = [];

    valid.forEach(r => {
      // Find matching cluster within ~1.5km or identical locality name
      const existing = clusters.find(c => {
        const distLat = Math.abs(c.lat - (r.lat as number));
        const distLng = Math.abs(c.lng - (r.lng as number));
        return (distLat < 0.018 && distLng < 0.018) || (c.localityName.toUpperCase() === r.localityName.toUpperCase() && c.state === r.state);
      });

      if (existing) {
        existing.count++;
        existing.recordIds.push(r.id);
        if (r.gender === 'Male') existing.maleCount++;
        else if (r.gender === 'Female') existing.femaleCount++;
        if (r.hospitalised === 'Yes') existing.hospitalisedCount++;
      } else {
        clusters.push({
          id: `cluster_${r.localityName}_${clusters.length + 1}`,
          localityName: r.localityName,
          state: r.state,
          lat: r.lat as number,
          lng: r.lng as number,
          count: 1,
          maleCount: r.gender === 'Male' ? 1 : 0,
          femaleCount: r.gender === 'Female' ? 1 : 0,
          hospitalisedCount: r.hospitalised === 'Yes' ? 1 : 0,
          dominantOccupation: r.occupation,
          dominantLocalityType: r.localityType,
          resolutionStatus: r.resolutionStatus,
          recordIds: [r.id]
        });
      }
    });

    return clusters;
  }

  const goaRecords = resolvedRecords.filter(r => r.scope === 'GOA' && r.lat !== null && r.lng !== null);
  const indiaRecords = resolvedRecords.filter(r => (r.scope === 'GOA' || r.scope === 'INDIA_OTHER_STATE') && r.lat !== null && r.lng !== null);

  const goaClusters = buildClusters(goaRecords);
  const indiaClusters = buildClusters(indiaRecords);

  const stats: GeoQualityStats = {
    totalConsidered: records.length,
    validExactCoordinates: validExactCoords,
    geocodedLocalities: geocodedCount,
    successfullyPlotted: validExactCoords + geocodedCount,
    excludedByActiveView: 0,
    missingCoordinates: missingCoords,
    invalidCoordinateStrings: invalidCoords,
    unresolvedCount,
    classifiedGoa,
    classifiedOtherStates,
    classifiedUnresolved: unresolvedCount
  };

  return {
    resolvedRecords,
    goaClusters,
    indiaClusters,
    stats
  };
}
