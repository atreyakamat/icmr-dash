import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Filter,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Calendar,
  Layers
} from 'lucide-react';
import { Gender, RdtResult, LocalityType, HospitalisedStatus } from '../../data/types';

export const FilterBar: React.FC = () => {
  const {
    activeTab,
    dataset,
    demoFilters,
    setDemoFilters,
    resetDemoFilters,
    activeDemoFilterCount,
    cbcFilters,
    setCbcFilters,
    resetCbcFilters,
    activeCbcFilterCount
  } = useData();

  const [isExpanded, setIsExpanded] = useState(false);

  const isDemoSheet = ['demographics', 'infographic', 'geographic'].includes(activeTab);
  const activeCount = isDemoSheet ? activeDemoFilterCount : activeCbcFilterCount;

  // Extract unique states and collection places from datasets
  const availableStates = React.useMemo(() => {
    if (!dataset) return [];
    const source = isDemoSheet ? dataset.normalizedDemographic : dataset.normalizedCbc;
    const states = Array.from(new Set(source.map(r => r.normalizedState).filter(s => s && s !== 'Unknown'))).sort();
    return states;
  }, [dataset, isDemoSheet]);

  const availablePlaces = React.useMemo(() => {
    if (!dataset) return [];
    const source = isDemoSheet ? dataset.normalizedDemographic : dataset.normalizedCbc;
    const places = Array.from(new Set(source.map(r => r.collectionPlace).filter(p => p && p !== '0' && p !== 'Unspecified'))).sort();
    return places;
  }, [dataset, isDemoSheet]);

  // Handle multi-select toggle
  const toggleArrayFilter = <T,>(current: T[], value: T): T[] => {
    return current.includes(value) ? current.filter(item => item !== value) : [...current, value];
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Main Bar: Search + Quick Pills + Expand Toggle + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isDemoSheet ? "Search ID, occupation, locality, state..." : "Search CBC ID, collection place, state, smear..."}
              value={isDemoSheet ? demoFilters.searchQuery : cbcFilters.searchQuery}
              onChange={(e) => {
                if (isDemoSheet) {
                  setDemoFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                } else {
                  setCbcFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
            {((isDemoSheet && demoFilters.searchQuery) || (!isDemoSheet && cbcFilters.searchQuery)) && (
              <button
                type="button"
                onClick={() => {
                  if (isDemoSheet) setDemoFilters(prev => ({ ...prev, searchQuery: '' }));
                  else setCbcFilters(prev => ({ ...prev, searchQuery: '' }));
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Group: Gender & RDT pills */}
          <div className="hidden md:flex items-center gap-2">
            
            {/* Gender / Sex Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
              <span className="px-2 text-slate-500 font-medium">Sex:</span>
              {(['Male', 'Female'] as Gender[]).map(g => {
                const isSelected = isDemoSheet ? demoFilters.genders.includes(g) : cbcFilters.sexes.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      if (isDemoSheet) {
                        setDemoFilters(prev => ({ ...prev, genders: toggleArrayFilter(prev.genders, g) }));
                      } else {
                        setCbcFilters(prev => ({ ...prev, sexes: toggleArrayFilter(prev.sexes, g) }));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            {/* RDT Result Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
              <span className="px-2 text-slate-500 font-medium">RDT:</span>
              {(['PV', 'PF', 'MIX', 'Negative'] as RdtResult[]).map(r => {
                const isSelected = isDemoSheet ? demoFilters.rdtResults.includes(r) : cbcFilters.rdtResults.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (isDemoSheet) {
                        setDemoFilters(prev => ({ ...prev, rdtResults: toggleArrayFilter(prev.rdtResults, r) }));
                      } else {
                        setCbcFilters(prev => ({ ...prev, rdtResults: toggleArrayFilter(prev.rdtResults, r) }));
                      }
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right: Expand More Filters + Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                isExpanded || activeCount > 0
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span>{isExpanded ? 'Hide Filters' : 'More Filters'}</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeCount}
                </span>
              )}
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {activeCount > 0 && (
              <button
                type="button"
                onClick={isDemoSheet ? resetDemoFilters : resetCbcFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Expandable Advanced Filter Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
            
            {/* 1. State Filter */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Origin State</label>
              <select
                value={isDemoSheet ? demoFilters.states[0] || '' : cbcFilters.states[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isDemoSheet) setDemoFilters(prev => ({ ...prev, states: val ? [val] : [] }));
                  else setCbcFilters(prev => ({ ...prev, states: val ? [val] : [] }));
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All States ({availableStates.length})</option>
                {availableStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* 2. Collection Place Filter */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Collection Health Center</label>
              <select
                value={isDemoSheet ? demoFilters.collectionPlaces[0] || '' : cbcFilters.collectionPlaces[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isDemoSheet) setDemoFilters(prev => ({ ...prev, collectionPlaces: val ? [val] : [] }));
                  else setCbcFilters(prev => ({ ...prev, collectionPlaces: val ? [val] : [] }));
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Health Centers ({availablePlaces.length})</option>
                {availablePlaces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 3. Hospitalisation Filter */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hospitalisation Status</label>
              <div className="flex gap-1.5">
                {(['Yes', 'No'] as HospitalisedStatus[]).map(status => {
                  const isSelected = isDemoSheet ? demoFilters.hospitalised.includes(status) : cbcFilters.hospitalised.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        if (isDemoSheet) {
                          setDemoFilters(prev => ({ ...prev, hospitalised: toggleArrayFilter(prev.hospitalised, status) }));
                        } else {
                          setCbcFilters(prev => ({ ...prev, hospitalised: toggleArrayFilter(prev.hospitalised, status) }));
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {status === 'Yes' ? 'Admitted (Yes)' : 'Outpatient (No)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sheet-Specific Filters */}
            {isDemoSheet ? (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Locality Type</label>
                <select
                  value={demoFilters.localityTypes[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value as LocalityType;
                    setDemoFilters(prev => ({ ...prev, localityTypes: val ? [val] : [] }));
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">All Localities</option>
                  <option value="Construction Site">Construction Site</option>
                  <option value="Housing">Housing</option>
                  <option value="Rented Room">Rented Room</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Record Completeness</label>
                <div className="flex gap-1.5">
                  {(['All', 'Complete', 'Incomplete'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCbcFilters(prev => ({ ...prev, recordCompleteness: opt }))}
                      className={`flex-1 py-1.5 px-1 rounded-lg border font-medium transition-colors text-[11px] ${
                        cbcFilters.recordCompleteness === opt
                          ? 'bg-teal-700 text-white border-teal-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
