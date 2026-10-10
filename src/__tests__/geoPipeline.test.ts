import { describe, it, expect } from 'vitest';
import {
  processLocationPipeline,
  extractSanitizedLocality,
  GOA_HEALTH_FACILITIES
} from '../data/geoPipeline';
import { DemographicRecord } from '../data/types';

describe('Geographic Resolution Pipeline', () => {
  const sampleRecords: Partial<DemographicRecord>[] = [
    {
      id: 'A3',
      currentCoordinates: { lat: 15.6310, lng: 73.8282 },
      rawCurrentCoordinates: '15.6310, 73.8282',
      currentAddress: 'HNO. 181/0 MUSHIR WADDO, COLVALE-NORTH GOA',
      nativeCoordinates: { lat: 26.9308, lng: 81.8511 },
      rawNativeCoordinates: '26.9308, 81.8511',
      nativeAddress: 'Barouli village under Tarabganj, Gonda of Uttar Pradesh',
      state: 'UTTAR PRADESH',
      normalizedState: 'Uttar Pradesh',
      collectionPlace: 'ASILO NGDH',
      gender: 'Male',
      age: 38,
      occupation: 'Labour',
      localityType: 'Construction Site',
      hospitalised: 'Yes',
      rdt: 'PV'
    },
    {
      id: 'A5',
      currentCoordinates: { lat: 15.5982, lng: 73.7429 },
      rawCurrentCoordinates: '15.5982, 73.7429',
      currentAddress: 'NR RAMADA HOTEL VAGATOR VAGATOR, ANJUNA-NORTH GOA',
      nativeCoordinates: { lat: 25.9181, lng: 85.8618 },
      rawNativeCoordinates: '25.9181, 85.8618',
      nativeAddress: 'RAIPUR SAMASTIPUR',
      state: 'BIHAR',
      normalizedState: 'Bihar',
      collectionPlace: 'ASILO NGDH',
      gender: 'Male',
      age: 22,
      occupation: 'Housekeeping',
      localityType: 'Housing',
      hospitalised: 'No',
      rdt: 'PV'
    },
    {
      id: 'A8',
      currentCoordinates: null,
      rawCurrentCoordinates: 'Carambolim', // Text coordinate
      currentAddress: 'SOCORRO BUILDING-MAPUSA NORTH GOA',
      nativeCoordinates: { lat: 24.6296, lng: 87.8785 },
      rawNativeCoordinates: '24.6296, 87.8785',
      nativeAddress: 'Bhawanipur, Pakur district in Jharkhand',
      state: 'JHARKHAND',
      normalizedState: 'Jharkhand',
      collectionPlace: 'ASILO NGDH',
      gender: 'Male',
      age: 51,
      occupation: 'Labour',
      localityType: 'Construction Site',
      hospitalised: 'No',
      rdt: 'PV'
    }
  ];

  it('correctly classifies Goa residential coordinates vs Native origin coordinates', () => {
    const result = processLocationPipeline(
      sampleRecords as DemographicRecord[],
      'CURRENT_RESIDENCE'
    );

    expect(result.resolvedRecords.length).toBe(3);
    // 2 have exact GPS, 1 has text "Carambolim" which is mapped via Goa locality registry
    expect(result.stats.validExactCoordinates).toBe(2);
    expect(result.stats.geocodedLocalities).toBe(1);
    expect(result.goaClusters.length).toBeGreaterThan(0);
  });

  it('correctly classifies India-wide native states and centroids', () => {
    const result = processLocationPipeline(
      sampleRecords as DemographicRecord[],
      'NATIVE_ORIGIN'
    );

    expect(result.stats.classifiedOtherStates).toBeGreaterThan(0);
    const upRecord = result.resolvedRecords.find(r => r.id === 'A3');
    expect(upRecord?.state).toBe('Uttar Pradesh');
    expect(upRecord?.lat).toBeCloseTo(26.93, 1);
  });

  it('sanitizes address text and extracts clean non-identifying locality labels', () => {
    expect(extractSanitizedLocality('HNO. 181/0 MUSHIR WADDO, COLVALE-NORTH GOA', 'Goa')).toBe('Colvale');
    expect(extractSanitizedLocality('RAIPUR SAMASTIPUR BIHAR', 'Bihar')).toBe('Samastipur');
    expect(extractSanitizedLocality('Barouli village under Tarabganj, Gonda of Uttar Pradesh', 'Uttar Pradesh')).toBe('Gonda');
  });

  it('maps health facilities accurately in collection facility mode', () => {
    const result = processLocationPipeline(
      sampleRecords as DemographicRecord[],
      'COLLECTION_FACILITY'
    );

    const asilo = GOA_HEALTH_FACILITIES['ASILO NGDH'];
    expect(asilo).toBeDefined();
    expect(asilo.lat).toBeCloseTo(15.59, 1);
    expect(asilo.lng).toBeCloseTo(73.81, 1);
  });
});
