import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { DemographicRecord } from '../../data/types';
import { MapPin, Navigation, Compass, Layers, ShieldCheck, Map as MapIcon, Info } from 'lucide-react';

interface GeographicMapProps {
  records: DemographicRecord[];
  onSelectState?: (state: string) => void;
}

// Map center adjuster on perspective change
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const GeographicMap: React.FC<GeographicMapProps> = ({ records, onSelectState }) => {
  const [perspective, setPerspective] = useState<'current' | 'native'>('current');
  const [colorBy, setColorBy] = useState<'locality' | 'hospitalised' | 'gender'>('locality');

  // Filter records with valid coordinates based on perspective
  const mappedRecords = records.filter(r => {
    return perspective === 'current' ? r.currentCoordinates !== null : r.nativeCoordinates !== null;
  });

  const validCurrentCount = records.filter(r => r.currentCoordinates !== null).length;
  const validNativeCount = records.filter(r => r.nativeCoordinates !== null).length;

  // Center coordinates: Goa for current, Central India for native
  const mapCenter: [number, number] = perspective === 'current' ? [15.55, 73.85] : [22.5937, 78.9629];
  const mapZoom = perspective === 'current' ? 11 : 5;

  const getMarkerColor = (r: DemographicRecord) => {
    if (colorBy === 'locality') {
      if (r.localityType === 'Construction Site') return '#0d9488'; // Teal
      if (r.localityType === 'Housing') return '#0284c7'; // Sky
      return '#f59e0b'; // Amber
    }
    if (colorBy === 'hospitalised') {
      return r.hospitalised === 'Yes' ? '#e11d48' : '#10b981'; // Rose vs Emerald
    }
    return r.gender === 'Male' ? '#2563eb' : '#ec4899'; // Blue vs Pink
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 sm:p-5 flex flex-col gap-4">
      
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <MapIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Spatial Distribution & Geographic Clustering
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {perspective === 'current'
              ? `Displaying ${mappedRecords.length} patients with verified residential GPS coordinates in Goa`
              : `Displaying ${mappedRecords.length} patients with verified native origin coordinates across India`}
          </p>
        </div>

        {/* View Toggle & Color By Switch */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Perspective Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPerspective('current')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                perspective === 'current'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Current Goa Residences ({validCurrentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setPerspective('native')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                perspective === 'native'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Native Origins ({validNativeCount})</span>
            </button>
          </div>

          {/* Marker Color Scheme */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Color:</span>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value as any)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="locality">Locality Type</option>
              <option value="hospitalised">Hospitalisation</option>
              <option value="gender">Gender</option>
            </select>
          </div>

        </div>
      </div>

      {/* Map Body */}
      <div className="relative h-[480px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={false}
          className="h-full w-full z-10"
        >
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {mappedRecords.map((record) => {
            const coords = perspective === 'current' ? record.currentCoordinates : record.nativeCoordinates;
            if (!coords) return null;

            const color = getMarkerColor(record);

            return (
              <CircleMarker
                key={record.id}
                center={[coords.lat, coords.lng]}
                radius={perspective === 'current' ? 6 : 5}
                fillColor={color}
                color="#ffffff"
                weight={1.5}
                opacity={1}
                fillOpacity={0.8}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="text-xs font-sans">
                    <span className="font-bold text-slate-900">{record.id}</span> • {record.gender}, {record.age}y
                    <div className="text-slate-600 text-[11px]">{record.occupation} • {record.localityType}</div>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="p-1 font-sans text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-teal-800">{record.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {record.rdt} Positive
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      <div><span className="text-slate-400">Age/Sex:</span> {record.age || 'N/A'}y / {record.gender}</div>
                      <div><span className="text-slate-400">Admitted:</span> {record.hospitalised}</div>
                      <div><span className="text-slate-400">Occupation:</span> {record.occupation}</div>
                      <div><span className="text-slate-400">Locality:</span> {record.localityType}</div>
                    </div>

                    <div className="text-[11px] pt-1 border-t text-slate-700">
                      <span className="font-semibold text-slate-800">
                        {perspective === 'current' ? 'Goa Address:' : 'Native Origin:'}
                      </span>
                      <p className="text-slate-600 text-[11px] leading-tight mt-0.5">
                        {perspective === 'current' ? record.currentAddress : record.nativeAddress}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-md border border-slate-200 text-xs">
          <span className="font-bold text-slate-800 text-[11px] block mb-1.5">Marker Legend</span>
          {colorBy === 'locality' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span className="text-slate-700">Construction Site</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-600" />
                <span className="text-slate-700">Housing / Residential</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-700">Rented Room / Other</span>
              </div>
            </div>
          )}
          {colorBy === 'hospitalised' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="text-slate-700">Hospitalised (Yes)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-slate-700">Outpatient (No)</span>
              </div>
            </div>
          )}
          {colorBy === 'gender' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-700">Male</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-pink-500" />
                <span className="text-slate-700">Female</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Map Insights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Goa Hotspot Concentrations</span>
          <span className="font-semibold text-slate-800 text-sm">Calangute, Candolim, Mapusa, Colvale</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Primary Origin Migration States</span>
          <span className="font-semibold text-slate-800 text-sm">Bihar (22.4%), UP (17.3%), West Bengal (14.4%)</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[11px]">High-Risk Locality Proportion</span>
          <span className="font-semibold text-slate-800 text-sm">66.0% Construction Labour Settlements</span>
        </div>
      </div>

    </div>
  );
};
