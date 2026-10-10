import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DemographicRecord } from '../../data/types';
import {
  processLocationPipeline,
  LocalityCluster,
  LocationPerspective,
  MapViewScope,
  GeoQualityStats
} from '../../data/geoPipeline';
import {
  batchResolveLocalities,
  getGeocodedCache
} from '../../services/nominatimService';
import {
  MapPin,
  Globe,
  Layers,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  Navigation,
  Compass,
  CheckCircle2,
  HelpCircle,
  Activity,
  UserCheck
} from 'lucide-react';

// Tile provider presets
const TILE_PROVIDERS = {
  osmStandard: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  cartoPositron: {
    name: 'CartoDB Positron (Clean Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20
  },
  osmHumanitarian: {
    name: 'Humanitarian OSM (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19
  }
};

type TileProviderKey = keyof typeof TILE_PROVIDERS;
type ColorMetric = 'LOCALITY_RISK' | 'HOSPITALISATION' | 'GENDER';

interface OpenSourceMapViewProps {
  records: DemographicRecord[];
  selectedCluster?: LocalityCluster | null;
  onSelectCluster?: (cluster: LocalityCluster | null) => void;
}

// Map bounds and view controller inside MapContainer
const MapViewController: React.FC<{
  viewScope: MapViewScope;
  clusters: LocalityCluster[];
  selectedCluster?: LocalityCluster | null;
  triggerFit: number;
}> = ({ viewScope, clusters, selectedCluster, triggerFit }) => {
  const map = useMap();
  const prevViewScope = useRef<MapViewScope>(viewScope);
  const prevFitTrigger = useRef<number>(triggerFit);

  // Center & bounds management
  useEffect(() => {
    const isViewScopeChange = prevViewScope.current !== viewScope;
    const isExplicitFit = prevFitTrigger.current !== triggerFit;
    prevViewScope.current = viewScope;
    prevFitTrigger.current = triggerFit;

    if (selectedCluster && selectedCluster.lat && selectedCluster.lng) {
      map.flyTo([selectedCluster.lat, selectedCluster.lng], 14, { duration: 1.0 });
      return;
    }

    if (clusters.length > 0) {
      const validPoints = clusters.filter(c => c.lat && c.lng);
      if (validPoints.length > 0) {
        if (isViewScopeChange || isExplicitFit) {
          const bounds = L.latLngBounds(validPoints.map(c => [c.lat, c.lng]));
          map.flyToBounds(bounds, {
            padding: [40, 40],
            maxZoom: viewScope === 'GOA' ? 13 : 8,
            duration: 1.2
          });
          return;
        }
      }
    }

    if (isViewScopeChange) {
      if (viewScope === 'GOA') {
        map.flyTo([15.5200, 73.8200], 11, { duration: 1.2 });
      } else {
        map.flyTo([22.5000, 82.0000], 5, { duration: 1.2 });
      }
    }
  }, [viewScope, clusters, selectedCluster, triggerFit, map]);

  return null;
};

// Create custom SVG/HTML cluster marker icons using L.divIcon
function createClusterIcon(cluster: LocalityCluster, colorMetric: ColorMetric, isSelected: boolean): L.DivIcon {
  let primaryColor = '#0f766e'; // teal-700
  let ringColor = '#14b8a6';   // teal-500

  if (colorMetric === 'LOCALITY_RISK') {
    const locType = (cluster.dominantLocalityType || '').toUpperCase();
    if (locType.includes('CONSTRUCTION')) {
      primaryColor = '#d97706'; // amber-600
      ringColor = '#f59e0b';
    } else if (locType.includes('RESIDENTIAL')) {
      primaryColor = '#0f766e'; // teal-700
      ringColor = '#14b8a6';
    } else if (locType.includes('COMMERCIAL') || locType.includes('HOTEL')) {
      primaryColor = '#0284c7'; // sky-600
      ringColor = '#38bdf8';
    } else {
      primaryColor = '#475569'; // slate-600
      ringColor = '#94a3b8';
    }
  } else if (colorMetric === 'HOSPITALISATION') {
    if (cluster.hospitalisedCount > 0) {
      primaryColor = '#e11d48'; // rose-600
      ringColor = '#f43f5e';
    } else {
      primaryColor = '#0f766e'; // teal-700
      ringColor = '#14b8a6';
    }
  } else if (colorMetric === 'GENDER') {
    if (cluster.maleCount > cluster.femaleCount) {
      primaryColor = '#0f766e'; // teal-700
      ringColor = '#2dd4bf';
    } else if (cluster.femaleCount > cluster.maleCount) {
      primaryColor = '#7c3aed'; // violet-600
      ringColor = '#a78bfa';
    } else {
      primaryColor = '#0284c7'; // sky-600
      ringColor = '#38bdf8';
    }
  }

  // Size marker based on count
  const size = Math.min(48, Math.max(30, 26 + Math.log2(cluster.count + 1) * 6));
  const borderStyle = isSelected ? 'border: 3px solid #facc15; box-shadow: 0 0 15px rgba(234, 179, 8, 0.8);' : 'border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25);';

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${primaryColor};
      border-radius: 50%;
      ${borderStyle}
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 700;
      font-size: ${size > 36 ? '13px' : '11px'};
      font-family: sans-serif;
      cursor: pointer;
      transition: transform 0.2s ease;
      position: relative;
    ">
      <span>${cluster.count}</span>
      ${cluster.resolutionStatus === 'EXACT_COORDINATES' ? `
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background-color: #10b981;
          border: 1.5px solid #ffffff;
          border-radius: 50%;
        " title="Exact GPS"></div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

export const OpenSourceMapView: React.FC<OpenSourceMapViewProps> = ({
  records,
  selectedCluster,
  onSelectCluster
}) => {
  // View states
  const [viewScope, setViewScope] = useState<MapViewScope>('GOA');
  const [perspective, setPerspective] = useState<LocationPerspective>('CURRENT_RESIDENCE');
  const [colorMetric, setColorMetric] = useState<ColorMetric>('LOCALITY_RISK');
  const [tileKey, setTileKey] = useState<TileProviderKey>('osmStandard');
  const [triggerFit, setTriggerFit] = useState<number>(0);
  
  // Geocode state
  const [geocodedCache, setGeocodedCache] = useState<Record<string, { lat: number; lng: number }>>(getGeocodedCache());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState<{ processed: number; total: number; newlyResolved: number } | null>(null);

  // Process geospatial resolution pipeline
  const { resolvedRecords, goaClusters, indiaClusters, stats } = useMemo(() => {
    return processLocationPipeline(records, perspective, geocodedCache);
  }, [records, perspective, geocodedCache]);

  // Active clusters based on view scope
  const activeClusters = useMemo(() => {
    if (viewScope === 'GOA') {
      return goaClusters;
    }
    return indiaClusters;
  }, [viewScope, goaClusters, indiaClusters]);

  // Active plotted count vs view exclusions
  const activePlottedCount = activeClusters.reduce((sum, c) => sum + c.count, 0);
  const excludedByViewCount = viewScope === 'GOA' 
    ? (stats.validExactCoordinates + stats.geocodedLocalities) - activePlottedCount 
    : 0;

  // Unmapped localities available for open-source geocoding
  const unmappedLocalities = useMemo(() => {
    const unmapped: Array<{ localityName: string; state: string }> = [];
    const seen = new Set<string>();

    resolvedRecords.forEach(r => {
      if (r.resolutionStatus === 'UNRESOLVED' && r.localityName && r.localityName !== 'Unspecified' && r.localityName !== 'Local Area') {
        const key = `${r.localityName}_${r.state}`.toUpperCase();
        if (!seen.has(key)) {
          seen.add(key);
          unmapped.push({ localityName: r.localityName, state: r.state });
        }
      }
    });

    return unmapped;
  }, [resolvedRecords]);

  // Trigger OpenStreetMap Nominatim Geocoding
  const handleResolveLocalities = async () => {
    if (unmappedLocalities.length === 0 || isGeocoding) return;

    setIsGeocoding(true);
    setGeocodeProgress({ processed: 0, total: unmappedLocalities.length, newlyResolved: 0 });

    try {
      const updatedCache = await batchResolveLocalities(unmappedLocalities, (processed, total, newlyResolved) => {
        setGeocodeProgress({ processed, total, newlyResolved });
      });
      setGeocodedCache(updatedCache);
    } catch (err) {
      console.error('Nominatim batch geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const activeTileConfig = TILE_PROVIDERS[tileKey];

  return (
    <div className="space-y-4">
      {/* 1. Main Navigation & Spatial Controls Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* A. Goa vs India Segmented Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Map Scope:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setViewScope('GOA');
                  if (onSelectCluster) onSelectCluster(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewScope === 'GOA'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Goa View
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  viewScope === 'GOA' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {goaClusters.reduce((s, c) => s + c.count, 0)} cases
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewScope('INDIA');
                  if (onSelectCluster) onSelectCluster(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewScope === 'INDIA'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                India View
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  viewScope === 'INDIA' ? 'bg-teal-800 text-teal-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {indiaClusters.reduce((s, c) => s + c.count, 0)} cases
                </span>
              </button>
            </div>
          </div>

          {/* B. Perspective & Metric Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Perspective */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Compass className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-xs text-slate-500 font-medium">Perspective:</span>
              <select
                value={perspective}
                onChange={e => {
                  setPerspective(e.target.value as LocationPerspective);
                  if (onSelectCluster) onSelectCluster(null);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer focus:ring-0"
              >
                <option value="CURRENT_RESIDENCE">Current Residence (Col 22)</option>
                <option value="NATIVE_ORIGIN">Native Origin (Map Native)</option>
                <option value="COLLECTION_FACILITY">Collection Facility</option>
              </select>
            </div>

            {/* Marker Color Mode */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-xs text-slate-500 font-medium">Color by:</span>
              <select
                value={colorMetric}
                onChange={e => setColorMetric(e.target.value as ColorMetric)}
                className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer focus:ring-0"
              >
                <option value="LOCALITY_RISK">Locality Risk (Site/Residential)</option>
                <option value="HOSPITALISATION">Hospitalisation Status</option>
                <option value="GENDER">Gender Distribution</option>
              </select>
            </div>

            {/* Tile Style */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs text-slate-500 font-medium">Tile:</span>
              <select
                value={tileKey}
                onChange={e => setTileKey(e.target.value as TileProviderKey)}
                className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer focus:ring-0"
              >
                <option value="osmStandard">OSM Standard</option>
                <option value="cartoPositron">Carto Positron (Clean)</option>
                <option value="osmHumanitarian">OSM Humanitarian</option>
              </select>
            </div>

            {/* Fit Map Button */}
            <button
              type="button"
              onClick={() => setTriggerFit(n => n + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
              title="Fit map viewport to all active markers"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
              Fit Bounds
            </button>
          </div>

        </div>

        {/* C. Interactive Legend & Info Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-500 font-medium">Legend:</span>
            {colorMetric === 'LOCALITY_RISK' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
                  <span className="text-slate-700 font-medium">Construction Site (High Risk)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-700 inline-block"></span>
                  <span className="text-slate-700 font-medium">Residential Area</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
                  <span className="text-slate-700 font-medium">Commercial / Hotel</span>
                </div>
              </>
            )}

            {colorMetric === 'HOSPITALISATION' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
                  <span className="text-slate-700 font-medium">Admitted Cases Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-700 inline-block"></span>
                  <span className="text-slate-700 font-medium">Outpatient Care Only</span>
                </div>
              </>
            )}

            {colorMetric === 'GENDER' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-700 inline-block"></span>
                  <span className="text-slate-700 font-medium">Male-Dominant Cluster</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-violet-600 inline-block"></span>
                  <span className="text-slate-700 font-medium">Female-Dominant Cluster</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-500">Verified Exact GPS</span>
            </div>
          </div>

          {/* Open-Source Geocoding Action */}
          {unmappedLocalities.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResolveLocalities}
                disabled={isGeocoding}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                {isGeocoding ? (
                  <span>Geocoding ({geocodeProgress?.processed}/{geocodeProgress?.total})...</span>
                ) : (
                  <span>Resolve {unmappedLocalities.length} Unmapped Localities (OSM)</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Leaflet Map Container */}
      <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-card bg-slate-100">
        
        {/* Leaflet Map */}
        <MapContainer
          center={viewScope === 'GOA' ? [15.5200, 73.8200] : [22.5000, 82.0000]}
          zoom={viewScope === 'GOA' ? 11 : 5}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Base Raster Tile Layer with Required Attribution */}
          <TileLayer
            key={tileKey}
            url={activeTileConfig.url}
            attribution={activeTileConfig.attribution}
            maxZoom={activeTileConfig.maxZoom}
          />

          {/* Map View Controller for View Updates & Bounds Fitting */}
          <MapViewController
            viewScope={viewScope}
            clusters={activeClusters}
            selectedCluster={selectedCluster}
            triggerFit={triggerFit}
          />

          {/* Clustered Privacy-Preserving Markers */}
          {activeClusters.map(cluster => {
            const isSelected = selectedCluster?.id === cluster.id;
            const icon = createClusterIcon(cluster, colorMetric, isSelected);

            return (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectCluster) onSelectCluster(cluster);
                  }
                }}
              >
                {/* Hover Tooltip */}
                <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                  <div className="text-xs font-sans">
                    <strong className="block text-slate-900 font-bold">{cluster.localityName}</strong>
                    <span className="text-slate-600">{cluster.count} Patients ({cluster.dominantOccupation})</span>
                  </div>
                </Tooltip>

                {/* Detailed Privacy-Preserving Popup */}
                <Popup className="custom-leaflet-popup">
                  <div className="p-3 max-w-[280px] font-sans text-xs">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cluster.localityName}</h4>
                        <span className="text-[11px] text-slate-500">{cluster.state || 'Goa'}, India</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                        {cluster.count} {cluster.count === 1 ? 'Record' : 'Records'}
                      </span>
                    </div>

                    {/* Aggregate Clinical Metrics */}
                    <div className="grid grid-cols-2 gap-2 my-2 py-1 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Gender Split</span>
                        <span className="text-slate-800 font-bold">{cluster.maleCount}M / {cluster.femaleCount}F</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hospitalised</span>
                        <span className={`font-bold ${cluster.hospitalisedCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {cluster.hospitalisedCount} ({Math.round((cluster.hospitalisedCount / cluster.count) * 100)}%)
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Dominant Profile</span>
                        <span className="text-slate-800 font-medium">{cluster.dominantOccupation} &bull; {cluster.dominantLocalityType}</span>
                      </div>
                    </div>

                    {/* Geospatial Provenance */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {cluster.resolutionStatus === 'EXACT_COORDINATES' ? 'Exact GPS (Col 22)' : 
                         cluster.resolutionStatus === 'FACILITY_COORDINATES' ? 'Health Facility Hub' : 
                         cluster.resolutionStatus === 'GEOCODED_LOCALITY' ? 'OSM Locality Match' : 'State Centroid'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {cluster.lat.toFixed(3)}°, {cluster.lng.toFixed(3)}°
                      </span>
                    </div>

                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* View Scope Indicator Overlay */}
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-md flex items-center gap-2 pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-800">
            {viewScope === 'GOA' ? 'Goa Spatial Focus' : 'India Country View'}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">&bull;</span>
          <span className="text-xs text-slate-600 font-medium">
            {activePlottedCount} Plotted Records in {activeClusters.length} Clusters
          </span>
        </div>

        {/* Empty State Overlay if no valid coordinates in this view */}
        {activeClusters.length === 0 && (
          <div className="absolute inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-md text-center">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">No Plotted Locations in {viewScope === 'GOA' ? 'Goa View' : 'India View'}</h3>
              <p className="text-xs text-slate-600 mb-4">
                The current active filters excluded all coordinates for this perspective, or records require locality resolution.
              </p>
              <button
                type="button"
                onClick={() => setViewScope(viewScope === 'GOA' ? 'INDIA' : 'GOA')}
                className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-800 shadow transition-all"
              >
                Switch to {viewScope === 'GOA' ? 'India View' : 'Goa View'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. Geographic Data Quality & Audit Report Ribbon */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
        <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Geographic Audit & Spatial Pipeline Status</h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Open-Source OpenStreetMap &bull; Zero API Key Required &bull; Privacy Preserved
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Dataset</span>
            <span className="text-base font-bold text-slate-900">{stats.totalConsidered}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Demographic cases</span>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Exact GPS Valid</span>
            <span className="text-base font-bold text-emerald-700">{stats.validExactCoordinates}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Numeric coordinates</span>
          </div>

          <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-200">
            <span className="text-[10px] text-teal-800 uppercase font-semibold block">Active Plotted</span>
            <span className="text-base font-bold text-teal-700">{activePlottedCount}</span>
            <span className="text-[10px] text-teal-600 block mt-0.5">In {viewScope} viewport</span>
          </div>

          {excludedByViewCount > 0 && (
            <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200">
              <span className="text-[10px] text-sky-800 uppercase font-semibold block">Other State Cases</span>
              <span className="text-base font-bold text-sky-700">{excludedByViewCount}</span>
              <span className="text-[10px] text-sky-600 block mt-0.5">In India View</span>
            </div>
          )}

          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
            <span className="text-[10px] text-amber-800 uppercase font-semibold block">Geocoded/Registry</span>
            <span className="text-base font-bold text-amber-700">{stats.geocodedLocalities}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Matched localities</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Invalid/Text Coords</span>
            <span className="text-base font-bold text-slate-700">{stats.invalidCoordinateStrings}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Text in GPS column</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Unresolved / Blank</span>
            <span className="text-base font-bold text-slate-700">{stats.unresolvedCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Requires geocoding</span>
          </div>

        </div>

        {/* Audit Details Footer */}
        <div className="mt-3 pt-2 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Individual patient coordinates are clustered locally (~1.5km) to protect patient privacy. No personal identifying information (PII) is transmitted.
            </span>
          </div>
          <span className="font-medium text-slate-600">
            Data Source: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">TEST DATA SET.xlsx</code>
          </span>
        </div>
      </div>

    </div>
  );
};
