'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DayRoute } from '@/types';
import { deleteRoute } from '../actions';

// Dynamic import for RouteMap (no SSR)
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-[600px] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

// ===========================================
// COMPONENT PROPS
// ===========================================

interface RouteDetailClientProps {
  routes: DayRoute[];
  routeId: string;
  userId: string;
  tripType?: 'bicycle' | 'trek';
  updatedWeather?: Array<{
    date: string;
    temperature: number;
    temperatureMax: number;
    temperatureMin: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  }>;
}

// ===========================================
// COMPONENT
// ===========================================

export default function RouteDetailClient({ routes, routeId, userId, tripType, updatedWeather }: RouteDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const toggleExpand = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (expandedDays.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // Scroll to map
    document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getWeatherIconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const formatTemperature = (temp: number) => `${Math.round(temp)}°C`;

  // Color palette matching the map markers
  const dayColors = [
    '#2d5a27', // Day 1: Forest green
    '#8b5a2b', // Day 2: Earth brown
    '#3b82f6', // Day 3: Blue
    '#f59e0b', // Day 4: Amber
    '#ef4444', // Day 5: Red
  ];

  const getDayColor = (index: number) => dayColors[index % dayColors.length];

  // Helper to format dates
  const getTomorrowDate = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead + 1); // +1 for tomorrow
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  /**
   * Handle Route Deletion
   */
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteRoute(routeId, userId);

      if (result.success) {
        // Redirect to history page after successful deletion
        router.push('/history');
      } else {
        alert(result.message || 'Failed to delete route');
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the route');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {/* Hero Map Section - Full Width at Top */}
      <div id="route-map" className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Interactive Route Map</h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-sm"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Route
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click on daily routes below to zoom to specific segments on the map
        </p>
        <div className="rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          <RouteMap
            routes={routes}
            tripType={tripType}
            height="500px"
            highlightDay={selectedDay}
          />
        </div>
      </div>

      {/* Daily Itinerary - Full Width */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Daily Itinerary</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {routes.length} {routes.length === 1 ? 'day' : 'days'} • Weather forecast included
            </p>
          </div>
          {updatedWeather && updatedWeather.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-medium">
              Live Weather
            </span>
          )}
        </div>

        <div className="space-y-4">
          {routes.map((route, index) => {
            const isExpanded = expandedDays.has(route.day);
            const dayWeather = updatedWeather?.[index];

            return (
              <div key={route.day} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-primary/50 transition-colors shadow-sm">
                {/* Day Header with Weather */}
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
                  <div className="flex items-stretch">
                    {/* Main Content Area */}
                    <button
                      onClick={() => toggleExpand(route.day)}
                      className="flex-1 text-left px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-0"
                    >
                      <div className="flex items-center gap-4">
                        {/* Day Badge */}
                        <div
                          className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md"
                          style={{ backgroundColor: getDayColor(index) }}
                        >
                          {route.day}
                        </div>

                        {/* Route Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate">
                            {route.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              {route.totalDistanceKm} km
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {route.majorLandmarks?.length || route.segments.length} landmarks
                            </span>
                          </div>
                        </div>

                        {/* Weather Preview */}
                        {dayWeather && (
                          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 flex-shrink-0 w-48">
                            <img
                              src={getWeatherIconUrl(dayWeather.icon)}
                              alt={dayWeather.description}
                              className="w-10 h-10 flex-shrink-0"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {formatTemperature(dayWeather.temperature)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">
                                {dayWeather.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Expand Arrow */}
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* View Map Button - Always Visible */}
                    <button
                      onClick={() => handleDayClick(route.day)}
                      className="px-5 bg-primary/10 hover:bg-primary/20 text-primary transition-colors border-l-2 border-gray-200 dark:border-gray-700 group flex flex-col items-center justify-center gap-1 flex-shrink-0"
                      title="Zoom to this route on map"
                    >
                      <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="text-xs font-bold whitespace-nowrap">View Map</span>
                    </button>
                  </div>

                  {/* Detailed Weather - Only when not expanded */}
                  {!isExpanded && dayWeather && (
                    <div className="px-4 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">H:</span> {formatTemperature(dayWeather.temperatureMax)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">L:</span> {formatTemperature(dayWeather.temperatureMin)}
                          </span>
                          <span className="flex items-center gap-1">
                            {dayWeather.humidity}%
                          </span>
                          <span className="flex items-center gap-1">
                            {dayWeather.windSpeed} m/s
                          </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-500">
                          {getTomorrowDate(index)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800">
                    {/* Full Weather Details */}
                    {dayWeather && (
                      <div className="mb-5 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={getWeatherIconUrl(dayWeather.icon)}
                              alt={dayWeather.description}
                              className="w-16 h-16"
                            />
                            <div>
                              <p className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-1">
                                {getTomorrowDate(index)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize mb-1">
                                {dayWeather.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <span>{dayWeather.humidity}%</span>
                                <span>{dayWeather.windSpeed} m/s</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                              {formatTemperature(dayWeather.temperature)}
                            </p>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <p>H: {formatTemperature(dayWeather.temperatureMax)}</p>
                              <p>L: {formatTemperature(dayWeather.temperatureMin)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {route.description && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          {route.description}
                        </p>
                      </div>
                    )}

                    {/* Route Segments */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Route Segments:</h4>
                      {route.segments.map((segment, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                                <span className="truncate">{segment.from}</span>
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <span className="truncate">{segment.to}</span>
                              </p>
                              {segment.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  {segment.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                <span className="font-medium">{segment.distanceKm} km</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-bold text-primary">
                        Total Distance: {route.totalDistanceKm} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Delete This Route?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              This will permanently remove your saved route. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner-sm" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
