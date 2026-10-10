import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { DemographicRecord } from '../../data/types';
import {
  processLocationPipeline,
  LocationPerspective,
  MapViewScope,
  LocalityCluster,
  ResolvedGeoRecord,
  GeoQualityStats
} from '../../data/geoPipeline';
import {
  loadGoogleMaps,
  getStoredApiKey,
  saveStoredApiKey,
  getStoredMapId,
  resetGoogleMapsLoader,
  geocodeApprovedLocality
} from '../../services/googleMapsService';
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Layers,
  Key,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  ExternalLink,
  CheckCircle2,
  Maximize2,
  Map as MapIcon,
  X
} from 'lucide-react';

interface GoogleMapsViewProps {
  records: DemographicRecord[];
  onSelectCluster?: (cluster: LocalityCluster | null) => void;
  selectedCluster?: LocalityCluster | null;
}

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  records,
  onSelectCluster,
  selectedCluster
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // States
  const [viewScope, setViewScope] = useState<MapViewScope>('GOA');
  const [perspective, setPerspective] = useState<LocationPerspective>('CURRENT_RESIDENCE');
  const [colorBy, setColorBy] = useState<'locality' | 'hospitalised' | 'gender'>('locality');

  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [inputKey, setInputKey] = useState<string>(getStoredApiKey());
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, { lat: number; lng: number }>>({});

  // Process data through geospatial pipeline
  const { resolvedRecords, goaClusters, indiaClusters, stats } = useMemo(() => {
    return processLocationPipeline(records, perspective, geocodeCache);
  }, [records, perspective, geocodeCache]);

  const activeClusters = viewScope === 'GOA' ? goaClusters : indiaClusters;

  // Compute stats with view-specific exclusion counts
  const viewStats = useMemo(() => {
    const plottedInView = activeClusters.reduce((sum, c) => sum + c.count, 0);
    const excluded = records.length - plottedInView;
    return {
      ...stats,
      successfullyPlotted: plottedInView,
      excludedByActiveView: Math.max(0, excluded)
    };
  }, [stats, activeClusters, records.length]);

  // Color helper
  const getClusterColor = useCallback((c: LocalityCluster) => {
    if (colorBy === 'locality') {
      if (c.dominantLocalityType === 'Construction Site') return '#0d9488'; // Teal
      if (c.dominantLocalityType === 'Housing') return '#0284c7'; // Sky
      return '#f59e0b'; // Amber
    }
    if (colorBy === 'hospitalised') {
      const hospRate = c.hospitalisedCount / (c.count || 1);
      return hospRate > 0.4 ? '#e11d48' : '#10b981'; // Rose vs Emerald
    }
    // Gender
    const maleRate = c.maleCount / (c.count || 1);
    return maleRate > 0.5 ? '#2563eb' : '#ec4899';
  }, [colorBy]);

  // Initialize or update Google Map
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        setMapError(null);
        const maps = await loadGoogleMaps(apiKey);
        if (isCancelled || !mapContainerRef.current) return;

        // Viewport config
        const isGoa = viewScope === 'GOA';
        const center = isGoa
          ? { lat: 15.54, lng: 73.83 } // North Goa Focus
          : { lat: 22.59, lng: 78.96 }; // All-India Focus
        const zoom = isGoa ? 11 : 5;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
            center,
            zoom,
            mapId: getStoredMapId(),
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'administrative.country',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#0d9488' }, { weight: 1.5 }]
              }
            ]
          });
          infoWindowRef.current = new maps.InfoWindow();
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(zoom);
        }

        setMapLoaded(true);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Google Maps Initialization Warning:', err);
          setMapError(err?.message || 'Google Maps failed to load');
          setMapLoaded(false);
        }
      }
    }

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [apiKey, viewScope]);

  // Render Markers on Map
  useEffect(() => {
    const gWindow = window as any;
    if (!mapInstanceRef.current || !mapLoaded || !gWindow.google?.maps) return;

    const gMaps = gWindow.google.maps;
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => {
      if (m.setMap) m.setMap(null);
      if (m.map) m.map = null;
    });
    markersRef.current = [];

    if (activeClusters.length === 0) return;

    const bounds = new gMaps.LatLngBounds();

    activeClusters.forEach(cluster => {
      const pos = { lat: cluster.lat, lng: cluster.lng };
      bounds.extend(pos);

      const color = getClusterColor(cluster);
      const isSelected = selectedCluster?.id === cluster.id;
      const markerSize = Math.min(38, Math.max(22, 18 + Math.sqrt(cluster.count) * 4));

      // Try AdvancedMarkerElement if available, else standard marker
      try {
        if (gMaps.marker && gMaps.marker.AdvancedMarkerElement) {
          const pinElement = document.createElement('div');
          pinElement.className = 'custom-cluster-pin';
          pinElement.style.cssText = `
            background-color: ${color};
            color: #ffffff;
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${markerSize > 28 ? '12px' : '10px'};
            font-weight: 700;
            border: 2px solid ${isSelected ? '#facc15' : '#ffffff'};
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25), 0 2px 4px -1px rgba(0,0,0,0.15);
            cursor: pointer;
            transition: transform 0.15s ease;
          `;
          pinElement.innerText = String(cluster.count);

          const advMarker = new gMaps.marker.AdvancedMarkerElement({
            map,
            position: pos,
            content: pinElement,
            title: `${cluster.localityName} (${cluster.count} patients)`
          });

          advMarker.addListener('click', () => {
            onSelectCluster?.(cluster);
            if (infoWindow) {
              infoWindow.setContent(`
                <div style="font-family: sans-serif; font-size: 12px; padding: 4px; min-width: 210px;">
                  <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                    📍 ${cluster.localityName}, ${cluster.state}
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; color: #334155;">
                    <div><strong>Patients:</strong> ${cluster.count}</div>
                    <div><strong>Admitted:</strong> ${cluster.hospitalisedCount}</div>
                    <div><strong>Males:</strong> ${cluster.maleCount}</div>
                    <div><strong>Females:</strong> ${cluster.femaleCount}</div>
                  </div>
                  <div style="font-size: 11px; color: #64748b; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div><strong>Locality:</strong> ${cluster.dominantLocalityType}</div>
                    <div><strong>Workforce:</strong> ${cluster.dominantOccupation}</div>
                  </div>
                </div>
              `);
              infoWindow.open({ anchor: advMarker, map });
            }
          });

          markersRef.current.push(advMarker);
          return;
        }
      } catch (advErr) {
        // Fallback to standard marker
      }

      // Standard Google Maps Marker Fallback
      const svgIcon = {
        path: gMaps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.9,
        strokeWeight: isSelected ? 3 : 1.5,
        strokeColor: isSelected ? '#facc15' : '#ffffff',
        scale: markerSize / 2
      };

      const stdMarker = new gMaps.Marker({
        position: pos,
        map,
        icon: svgIcon,
        label: {
          text: String(cluster.count),
          color: '#ffffff',
          fontSize: markerSize > 28 ? '11px' : '9px',
          fontWeight: 'bold'
        },
        title: `${cluster.localityName} (${cluster.count} patients)`
      });

      stdMarker.addListener('click', () => {
        onSelectCluster?.(cluster);
        if (infoWindow) {
          infoWindow.setContent(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px; min-width: 210px;">
              <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                📍 ${cluster.localityName}, ${cluster.state}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; color: #334155;">
                <div><strong>Patients:</strong> ${cluster.count}</div>
                <div><strong>Admitted:</strong> ${cluster.hospitalisedCount}</div>
                <div><strong>Males:</strong> ${cluster.maleCount}</div>
                <div><strong>Females:</strong> ${cluster.femaleCount}</div>
              </div>
              <div style="font-size: 11px; color: #64748b; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
                <div><strong>Locality:</strong> ${cluster.dominantLocalityType}</div>
                <div><strong>Workforce:</strong> ${cluster.dominantOccupation}</div>
              </div>
            </div>
          `);
          infoWindow.open(map, stdMarker);
        }
      });

      markersRef.current.push(stdMarker);
    });
  }, [mapLoaded, activeClusters, selectedCluster, getClusterColor, onSelectCluster]);

  // Fit bounds handler
  const handleFitBounds = () => {
    const gWindow = window as any;
    if (!mapInstanceRef.current || activeClusters.length === 0 || !gWindow.google?.maps) return;
    const bounds = new gWindow.google.maps.LatLngBounds();
    activeClusters.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));
    mapInstanceRef.current.fitBounds(bounds, 50);
  };

  // Safe On-Demand Geocoding for Unresolved Localities
  const handleResolveUnmappedLocalities = async () => {
    const unmapped = resolvedRecords.filter(r => r.lat === null || r.resolutionStatus === 'UNRESOLVED');
    if (unmapped.length === 0) return;

    setIsGeocoding(true);
    const updatedCache = { ...geocodeCache };

    const uniqueTargets = Array.from(new Set(unmapped.map(r => `${r.localityName}|${r.state}`)));

    for (const target of uniqueTargets.slice(0, 10)) {
      const [loc, st] = target.split('|');
      if (loc && st) {
        const coords = await geocodeApprovedLocality(loc, st);
        if (coords) {
          const cacheKey = `${loc}, ${st}, India`.toUpperCase();
          updatedCache[cacheKey] = coords;
        }
      }
    }

    setGeocodeCache(updatedCache);
    setIsGeocoding(false);
  };

  const handleSaveApiKey = () => {
    saveStoredApiKey(inputKey);
    setApiKey(inputKey);
    resetGoogleMapsLoader();
    setIsKeyDialogOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex flex-col gap-4">
      
      {/* 1. Header & Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <MapIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Geographic Spatial Intelligence — Google Maps Platform
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewScope === 'GOA'
              ? `Goa View: Plotting ${viewStats.successfullyPlotted} verified patient cases across Goa localities`
              : `India View: Plotting ${viewStats.successfullyPlotted} cases across 18 Indian states and union territories`}
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* A. Goa vs India Segmented Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setViewScope('GOA')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                viewScope === 'GOA'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Goa View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewScope('INDIA')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                viewScope === 'INDIA'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>India View</span>
            </button>
          </div>

          {/* B. Location Perspective Selector */}
          <div className="flex items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <select
              value={perspective}
              onChange={(e) => setPerspective(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="CURRENT_RESIDENCE">Current Residences (Goa GPS)</option>
              <option value="NATIVE_ORIGIN">Native Origins (India GPS)</option>
              <option value="COLLECTION_FACILITY">Collection Health Facilities</option>
            </select>
          </div>

          {/* C. Marker Color Scheme */}
          <div className="flex items-center bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium mr-1.5">Color:</span>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="locality">Locality Risk</option>
              <option value="hospitalised">Hospitalisation</option>
              <option value="gender">Gender Split</option>
            </select>
          </div>

          {/* D. API Key Config Button */}
          <button
            type="button"
            onClick={() => setIsKeyDialogOpen(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
            title="Configure Google Maps API Key"
          >
            <Key className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* 2. Map Viewport & Fallback Container */}
      <div className="relative h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 flex flex-col justify-center">
        
        {/* Actual Google Maps DOM Container */}
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Missing API Key / Error Banner */}
        {(!apiKey || mapError) && (
          <div className="absolute inset-4 z-20 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between max-w-xl mx-auto my-auto overflow-y-auto max-h-[440px]">
            <div>
              <div className="flex items-center gap-2 text-amber-700 font-bold text-base mb-1">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                Google Maps JavaScript API Configuration Required
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                To render live Google Maps tiles and Advanced Marker Clusters, provide a valid Google Maps JavaScript API key from your Google Cloud Console.
              </p>

              {/* Quick in-app key input */}
              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-slate-700 block">Enter Google Maps API Key:</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Apply Key
                  </button>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">How to configure in project:</span>
                <p>1. Open Google Cloud Console → Enable <strong>Maps JavaScript API</strong> and <strong>Geocoding API</strong>.</p>
                <p>2. Create Credentials → API Key (restricted to your development domain).</p>
                <p>3. Set in your <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">.env.local</code>:</p>
                <pre className="bg-slate-900 text-teal-300 p-2 rounded text-[11px] font-mono mt-1 overflow-x-auto">VITE_GOOGLE_MAPS_API_KEY=your_actual_key</pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Local coordinate pipeline is active ({activeClusters.length} clusters ready)</span>
              <a
                href="https://developers.google.com/maps/documentation/javascript"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline"
              >
                Google Maps Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Floating Map Actions (Fit Bounds & Legend) */}
        {mapLoaded && (
          <>
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={handleFitBounds}
                className="px-3 py-1.5 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Fit Map to Markers</span>
              </button>

              {viewStats.unresolvedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResolveUnmappedLocalities}
                  disabled={isGeocoding}
                  className="px-3 py-1.5 bg-white/95 backdrop-blur-xs hover:bg-white text-teal-800 text-xs font-semibold rounded-lg shadow-md border border-teal-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Geocode approved unmapped localities safely via Google Geocoding"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-teal-600 ${isGeocoding ? 'animate-spin' : ''}`} />
                  <span>{isGeocoding ? 'Geocoding...' : `Resolve ${viewStats.unresolvedCount} Localities`}</span>
                </button>
              )}
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-xs max-w-[200px]">
              <span className="font-bold text-slate-800 text-[11px] block mb-1.5">Locality Legend</span>
              {colorBy === 'locality' && (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-600 flex-shrink-0" />
                    <span className="text-slate-700">Construction Camps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-600 flex-shrink-0" />
                    <span className="text-slate-700">Housing / Residential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-slate-700">Rented / Other</span>
                  </div>
                </div>
              )}
              {colorBy === 'hospitalised' && (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-600 flex-shrink-0" />
                    <span className="text-slate-700">High Admission (&gt;40%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">Outpatient / Low</span>
                  </div>
                </div>
              )}
              {colorBy === 'gender' && (
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
                    <span className="text-slate-700">Male Workforce Dominant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500 flex-shrink-0" />
                    <span className="text-slate-700">Female Patient Cluster</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* 3. Selected Cluster Highlight Card (if user clicked a marker) */}
      {selectedCluster && (
        <div className="p-4 bg-teal-50/80 rounded-xl border border-teal-200 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedCluster.count}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{selectedCluster.localityName}</span>
                <span className="text-slate-500">• {selectedCluster.state}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Workforce: <strong className="text-slate-800">{selectedCluster.dominantOccupation}</strong> • Locality: <strong className="text-slate-800">{selectedCluster.dominantLocalityType}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-700">
            <div><span className="text-slate-500">Gender Split:</span> <strong>{selectedCluster.maleCount}M / {selectedCluster.femaleCount}F</strong></div>
            <div><span className="text-slate-500">Hospitalised:</span> <strong className="text-rose-700">{selectedCluster.hospitalisedCount}</strong></div>
            <button
              type="button"
              onClick={() => onSelectCluster?.(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 4. Geographic Data Quality & Resolution Audit Panel (Requirement 8) */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Geographic Data Quality & Spatial Audit Panel
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Perspective: {perspective === 'CURRENT_RESIDENCE' ? 'Goa Residence' : perspective === 'NATIVE_ORIGIN' ? 'Native State' : 'Health Center'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Cohort</span>
            <span className="text-base font-bold text-slate-900">{viewStats.totalConsidered}</span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-teal-700 font-medium block">Valid GPS Points</span>
            <span className="text-base font-bold text-teal-700">{viewStats.validExactCoordinates}</span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-emerald-700 font-medium block">Plotted in {viewScope}</span>
            <span className="text-base font-bold text-emerald-700">{viewStats.successfullyPlotted}</span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Excluded by Scope</span>
            <span className="text-base font-bold text-slate-600">{viewStats.excludedByActiveView}</span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-amber-700 font-medium block">Missing Coordinates</span>
            <span className="text-base font-bold text-amber-700">{viewStats.missingCoordinates}</span>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
            <span className="text-[11px] text-rose-700 font-medium block">Unresolved / Text</span>
            <span className="text-base font-bold text-rose-700">{viewStats.unresolvedCount}</span>
          </div>

        </div>

        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span>Classified: <strong>{viewStats.classifiedGoa} Goa</strong> • <strong>{viewStats.classifiedOtherStates} Other States</strong> • <strong>{viewStats.classifiedUnresolved} Unresolved</strong></span>
          </div>
          <span className="text-slate-400">All patient coordinates verified; no arbitrary coordinates invented.</span>
        </div>
      </div>

      {/* API Key Dialog Modal */}
      {isKeyDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-teal-700" />
                <h4 className="font-bold text-slate-900 text-sm">Google Maps API Key Setup</h4>
              </div>
              <button type="button" onClick={() => setIsKeyDialogOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Google Maps Platform API Key:</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                Stored in browser session storage for testing. For persistent setup, configure <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env.local</code>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsKeyDialogOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-sm"
              >
                Save & Reload Map
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
