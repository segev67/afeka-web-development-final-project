'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { SavedRoute } from '@/types';
import ImageWithFallback from '@/components/ImageWithFallback';

interface RouteListClientProps {
  routes: SavedRoute[];
}

export default function RouteListClient({ routes }: RouteListClientProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest' | 'duration'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'trek' | 'bicycle'>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(routes.map(r => r.country))].sort();
    return uniqueCountries;
  }, [routes]);

  const filteredAndSortedRoutes = useMemo(() => {
    let filtered = [...routes];

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.tripType === filterType);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(r => r.country === filterCountry);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'longest':
          return b.totalDistanceKm - a.totalDistanceKm;
        case 'shortest':
          return a.totalDistanceKm - b.totalDistanceKm;
        case 'duration':
          return b.durationDays - a.durationDays;
        default:
          return 0;
      }
    });

    return filtered;
  }, [routes, sortBy, filterType, filterCountry]);

  const activeFiltersCount = [
    filterType !== 'all',
    filterCountry !== 'all',
    sortBy !== 'newest'
  ].filter(Boolean).length;

  return (
    <div className="flex gap-6">
      {/* Sidebar Filters - Desktop */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="card sticky top-24 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort By
            </h3>
            <div className="space-y-2 mt-3">
              {[
                { value: 'newest', label: 'Newest First', icon: '' },
                { value: 'oldest', label: 'Oldest First', icon: '' },
                { value: 'longest', label: 'Longest', icon: '' },
                { value: 'shortest', label: 'Shortest', icon: '' },
                { value: 'duration', label: 'Most Days', icon: '' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    sortBy === option.value
                      ? 'bg-primary text-white font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Filters</h3>
            <div className="space-y-4 mt-3">
              {/* Trip Type */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Trip Type</label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'all', label: 'All Types' },
                    { value: 'trek', label: 'Hiking' },
                    { value: 'bicycle', label: 'Cycling' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilterType(option.value as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        filterType === option.value
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              {countries.length > 1 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  >
                    <option value="all">All Countries</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => {
                setSortBy('newest');
                setFilterType('all');
                setFilterCountry('all');
              }}
              className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All ({activeFiltersCount})
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredAndSortedRoutes.length} {filteredAndSortedRoutes.length === 1 ? 'route' : 'routes'}
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        {/* Routes Grid */}
        {filteredAndSortedRoutes.length === 0 ? (
          <div className="card text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No routes match your filters
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your filters to see more routes
            </p>
            <button
              onClick={() => {
                setSortBy('newest');
                setFilterType('all');
                setFilterCountry('all');
              }}
              className="btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedRoutes.map((savedRoute) => (
              <Link
                key={savedRoute._id.toString()}
                href={`/history/${savedRoute._id}`}
                className="group block"
              >
                <div className="card hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full overflow-hidden border-2 border-transparent hover:border-primary/30">
                  {/* Hero Image */}
                  {savedRoute.imageUrl && (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <ImageWithFallback
                        src={savedRoute.imageUrl}
                        alt={`${savedRoute.city}, ${savedRoute.country}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        country={savedRoute.country}
                        city={savedRoute.city}
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white shadow-lg">
                          {savedRoute.tripType === 'bicycle' ? 'Cycling' : 'Hiking'}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Route Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {savedRoute.city}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {savedRoute.region && `${savedRoute.region}, `}{savedRoute.country}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-primary">
                          {savedRoute.durationDays}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {savedRoute.durationDays === 1 ? 'Day' : 'Days'}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-primary">
                          {savedRoute.totalDistanceKm}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Kilometers
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-primary group-hover:text-primary-dark">
                        <span className="font-semibold text-sm">View Details & Weather</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
