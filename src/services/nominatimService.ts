/**
 * Open-Source Nominatim Geocoding Service
 * 
 * Adheres strictly to the OpenStreetMap Nominatim Usage Policy:
 * 1. Maximum 1 request per second (rate-limited / throttled)
 * 2. Dedicated descriptive User-Agent
 * 3. In-memory and persistent localStorage caching to avoid redundant queries
 * 4. Deduplication of queries across records
 * 5. Strict privacy: Queries only sanitized locality/administrative names (NEVER patient names, phone numbers, exact house/door numbers, or medical data)
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

const CACHE_STORAGE_KEY = 'icmr_nominatim_geocode_cache_v1';
const USER_AGENT = 'ICMR-Malaria-Healthcare-Analytics-Dashboard/1.0 (OpenSource PublicHealth Spatial Analysis)';

// Load persisted cache from localStorage
function loadCache(): Record<string, { lat: number; lng: number }> {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save cache to localStorage
function saveCache(cache: Record<string, { lat: number; lng: number }>) {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}

const inMemoryCache: Record<string, { lat: number; lng: number }> = loadCache();
let lastRequestTime = 0;

/**
 * Throttle helper to respect OpenStreetMap Nominatim's 1-request-per-second limit
 */
async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < 1100) {
    const delay = 1100 - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

/**
 * Sanitize a location query string to ensure no PII or sensitive patient data is ever transmitted
 */
export function sanitizeGeocodeQuery(localityName: string, state: string): string {
  if (!localityName || localityName.trim() === '') return `${state}, India`;

  // Strip house numbers, ward numbers, phone numbers, symbols
  const cleaned = localityName
    .replace(/HNO\.\s*\S+/gi, '')
    .replace(/\b(near|opp|behind|beside|road|lane|cross|flat|room|building|apt|colony|nagar)\b/gi, '')
    .replace(/\d+/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  const primaryLocality = words.slice(0, 2).join(' ');

  if (state && !primaryLocality.toLowerCase().includes(state.toLowerCase())) {
    return `${primaryLocality}, ${state}, India`.replace(/^,\s*/, '');
  }

  return `${primaryLocality}, India`.replace(/^,\s*/, '');
}

/**
 * Geocode a sanitized locality using OpenStreetMap Nominatim
 */
export async function geocodeLocalityNominatim(
  localityName: string,
  state: string = 'Goa'
): Promise<{ lat: number; lng: number } | null> {
  const query = sanitizeGeocodeQuery(localityName, state);
  const cacheKey = query.toUpperCase();

  // 1. Check in-memory / persisted cache first
  if (inMemoryCache[cacheKey]) {
    return inMemoryCache[cacheKey];
  }

  // 2. Rate limit
  await throttleNominatim();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`Nominatim geocoding HTTP error ${response.status} for "${query}"`);
      return null;
    }

    const data: NominatimResult[] = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);

      if (!isNaN(lat) && !isNaN(lng) && lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0) {
        const coords = { lat, lng };
        inMemoryCache[cacheKey] = coords;
        saveCache(inMemoryCache);
        return coords;
      }
    }

    return null;
  } catch (error) {
    console.error(`Nominatim lookup failed for query "${query}":`, error);
    return null;
  }
}

/**
 * Batch resolve a list of unique unmapped localities with progress feedback
 */
export async function batchResolveLocalities(
  localities: Array<{ localityName: string; state: string }>,
  onProgress?: (processed: number, total: number, newlyResolved: number) => void
): Promise<Record<string, { lat: number; lng: number }>> {
  // Deduplicate queries
  const uniqueQueries = new Map<string, { localityName: string; state: string }>();
  
  localities.forEach(loc => {
    const query = sanitizeGeocodeQuery(loc.localityName, loc.state);
    const key = query.toUpperCase();
    if (!uniqueQueries.has(key) && !inMemoryCache[key]) {
      uniqueQueries.set(key, loc);
    }
  });

  const queryList = Array.from(uniqueQueries.entries());
  let processed = 0;
  let newlyResolved = 0;

  for (const [cacheKey, loc] of queryList) {
    const result = await geocodeLocalityNominatim(loc.localityName, loc.state);
    processed++;
    if (result) {
      newlyResolved++;
      inMemoryCache[cacheKey] = result;
    }
    if (onProgress) {
      onProgress(processed, queryList.length, newlyResolved);
    }
  }

  saveCache(inMemoryCache);
  return { ...inMemoryCache };
}

/**
 * Get current geocoded cache
 */
export function getGeocodedCache(): Record<string, { lat: number; lng: number }> {
  return { ...inMemoryCache };
}
