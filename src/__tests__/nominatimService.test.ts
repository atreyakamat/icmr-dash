import { describe, it, expect } from 'vitest';
import { sanitizeGeocodeQuery } from '../services/nominatimService';

describe('Open-Source Nominatim Geocoder Service', () => {
  it('sanitizes locality queries removing house numbers and PII', () => {
    const raw = 'HNO. 42/B near St. Alex Church Calangute';
    const query = sanitizeGeocodeQuery(raw, 'Goa');
    expect(query).not.toContain('HNO');
    expect(query).not.toContain('42');
    expect(query).toContain('Goa');
  });

  it('preserves clean village names and attaches state context', () => {
    const query = sanitizeGeocodeQuery('Candolim', 'Goa');
    expect(query).toBe('Candolim, Goa, India');
  });

  it('handles empty or whitespace strings with graceful fallback', () => {
    const query = sanitizeGeocodeQuery('', 'Goa');
    expect(query).toBe('Goa, India');
  });
});
