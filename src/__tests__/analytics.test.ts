import { describe, it, expect } from 'vitest';
import {
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculatePearsonCorrelation,
  createHistogram,
  computeDemographicKpis,
  computeCbcKpis,
  computeSymptomFrequencies,
  getCategoryDistribution
} from '../data/analytics';
import {
  normalizeGender,
  normalizeRdt,
  normalizeState,
  parseCoordinates,
  categorizeAge,
  categorizeBmi,
  parseSymptoms
} from '../data/normalizer';
import { DemographicRecord, CbcRecord } from '../data/types';

describe('Statistical & Analytics Calculations', () => {
  it('correctly calculates Mean, Median, and StdDev', () => {
    const data = [10, 20, 30, 40, 50];
    expect(calculateMean(data)).toBe(30);
    expect(calculateMedian(data)).toBe(30);
    expect(calculateStdDev(data)).toBe(15.81);

    const evenData = [10, 20, 30, 40];
    expect(calculateMedian(evenData)).toBe(25);
  });

  it('calculates Pearson correlation coefficient accurately', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // Perfect positive
    expect(calculatePearsonCorrelation(x, y)).toBe(1);

    const negY = [10, 8, 6, 4, 2]; // Perfect negative
    expect(calculatePearsonCorrelation(x, negY)).toBe(-1);
  });

  it('generates accurate binned histograms', () => {
    const values = [12, 14, 15, 22, 28, 33];
    const hist = createHistogram(values, 10, 10, 40);
    expect(hist.length).toBe(3);
    expect(hist[0].count).toBe(3); // 12, 14, 15
    expect(hist[1].count).toBe(2); // 22, 28
    expect(hist[2].count).toBe(1); // 33
  });
});

describe('Data Normalization & Cleaning', () => {
  it('normalizes gender variations', () => {
    expect(normalizeGender('MALE')).toBe('Male');
    expect(normalizeGender('male')).toBe('Male');
    expect(normalizeGender('M')).toBe('Male');
    expect(normalizeGender('FEMALE')).toBe('Female');
    expect(normalizeGender('F')).toBe('Female');
    expect(normalizeGender('0')).toBe('Unknown');
    expect(normalizeGender(null)).toBe('Unknown');
  });

  it('normalizes RDT species classifications', () => {
    expect(normalizeRdt('PV')).toBe('PV');
    expect(normalizeRdt('PF')).toBe('PF');
    expect(normalizeRdt('MIX')).toBe('MIX');
    expect(normalizeRdt('pv but doubtful')).toBe('Doubtful');
    expect(normalizeRdt('NEGATIVE')).toBe('Negative');
    expect(normalizeRdt('neg')).toBe('Negative');
    expect(normalizeRdt('0')).toBe('Unspecified');
  });

  it('normalizes state names and aliases', () => {
    expect(normalizeState('UP')).toBe('Uttar Pradesh');
    expect(normalizeState('UTTAR PRADESH')).toBe('Uttar Pradesh');
    expect(normalizeState('West bangal')).toBe('West Bengal');
    expect(normalizeState('ANDRA PRADESH')).toBe('Andhra Pradesh');
  });

  it('parses both decimal and DMS GPS coordinates', () => {
    const dec = parseCoordinates('15.63102189, 73.82826096');
    expect(dec).not.toBeNull();
    expect(dec?.lat).toBeCloseTo(15.631, 2);
    expect(dec?.lng).toBeCloseTo(73.828, 2);

    const dms = parseCoordinates('15°42\'27.3"N 73°58\'21.5"E');
    expect(dms).not.toBeNull();
    expect(dms?.lat).toBeCloseTo(15.7075, 2);
    expect(dms?.lng).toBeCloseTo(73.9726, 2);

    expect(parseCoordinates('Carambolim')).toBeNull();
    expect(parseCoordinates('0')).toBeNull();
  });

  it('tokenizes multi-value symptoms', () => {
    const syms = parseSymptoms('FEVER, CHILLS, HEADACHE, VOMITING, FATIGUE');
    expect(syms).toContain('Fever');
    expect(syms).toContain('Chills');
    expect(syms).toContain('Headache');
    expect(syms).toContain('Vomiting');
    expect(syms).toContain('Fatigue');
  });

  it('categorizes BMI according to standard WHO adult bands', () => {
    expect(categorizeBmi(17.5)).toBe('Underweight');
    expect(categorizeBmi(22.0)).toBe('Normal');
    expect(categorizeBmi(27.5)).toBe('Overweight');
    expect(categorizeBmi(32.0)).toBe('Obese');
    expect(categorizeBmi(0)).toBe('Unknown');
  });
});
