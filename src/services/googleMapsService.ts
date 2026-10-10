import { Loader } from '@googlemaps/js-api-loader';

// In-memory geocode cache
const geocodeMemoryCache: Record<string, { lat: number; lng: number }> = {};

// Session storage key for optional in-app runtime API key configuration
const SESSION_API_KEY_STORAGE = 'ICMR_GOOGLE_MAPS_API_KEY';
const SESSION_MAP_ID_STORAGE = 'ICMR_GOOGLE_MAPS_MAP_ID';

export function getStoredApiKey(): string {
  // 1. Check Vite env variable
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim() !== '' && !envKey.includes('your_actual_api_key')) {
    return envKey.trim();
  }
  // 2. Check session storage
  try {
    const sessionKey = sessionStorage.getItem(SESSION_API_KEY_STORAGE);
    if (sessionKey && sessionKey.trim()) return sessionKey.trim();
  } catch (e) {
    // Ignore storage errors
  }
  return '';
}

export function saveStoredApiKey(apiKey: string): void {
  try {
    if (apiKey.trim()) {
      sessionStorage.setItem(SESSION_API_KEY_STORAGE, apiKey.trim());
    } else {
      sessionStorage.removeItem(SESSION_API_KEY_STORAGE);
    }
  } catch (e) {
    // Ignore
  }
}

export function getStoredMapId(): string {
  const envId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID;
  if (envId && typeof envId === 'string' && envId.trim()) return envId.trim();
  try {
    const sessionId = sessionStorage.getItem(SESSION_MAP_ID_STORAGE);
    if (sessionId && sessionId.trim()) return sessionId.trim();
  } catch (e) {
    // Ignore
  }
  return 'DEMO_MAP_ID';
}

let loaderInstance: Loader | null = null;
let googleMapsPromise: Promise<any> | null = null;

export function loadGoogleMaps(apiKey?: string): Promise<any> {
  const keyToUse = apiKey || getStoredApiKey();

  if (!keyToUse) {
    return Promise.reject(new Error('MISSING_API_KEY: Google Maps API key is not configured.'));
  }

  if (googleMapsPromise && loaderInstance) {
    return googleMapsPromise;
  }

  loaderInstance = new Loader({
    apiKey: keyToUse,
    version: 'weekly',
    libraries: ['places', 'marker', 'geometry']
  });

  googleMapsPromise = (loaderInstance as any).importLibrary('maps').then(() => {
    return (window as any).google?.maps;
  });

  return googleMapsPromise!;
}

// Reset loader (when user provides a new key)
export function resetGoogleMapsLoader(): void {
  loaderInstance = null;
  googleMapsPromise = null;
  const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
  scripts.forEach(s => s.remove());
  if ((window as any).google && (window as any).google.maps) {
    delete (window as any).google.maps;
  }
}

// Safe geocoding for approved non-identifying locality names
export async function geocodeApprovedLocality(
  localityName: string,
  state: string
): Promise<{ lat: number; lng: number } | null> {
  const query = `${localityName.trim()}, ${state.trim()}, India`.toUpperCase();

  if (geocodeMemoryCache[query]) {
    return geocodeMemoryCache[query];
  }

  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();

    return new Promise(resolve => {
      geocoder.geocode(
        {
          address: `${localityName}, ${state}, India`,
          componentRestrictions: { country: 'IN' }
        },
        (results: any[], status: any) => {
          if (status === maps.GeocoderStatus.OK && results && results[0]) {
            const loc = results[0].geometry.location;
            const coords = { lat: loc.lat(), lng: loc.lng() };
            geocodeMemoryCache[query] = coords;
            resolve(coords);
          } else {
            console.warn(`Geocoding failed for "${query}":`, status);
            resolve(null);
          }
        }
      );
    });
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}
