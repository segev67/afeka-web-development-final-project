'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { TripType, RoutePlan } from '@/types';
import { generateRoutePlan, saveRoute } from './actions';
import { getCurrentUser } from '@/app/auth/actions';
import { getImageAltText } from '@/lib/images';

// Dynamic import for RouteMap (no SSR)
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-[500px] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

// ===========================================
// PLANNING PAGE COMPONENT
// ===========================================

export default function PlanningPage() {
  // Form state
  const [location, setLocation] = useState('');
  const [tripType, setTripType] = useState<TripType>('trek');
  const [duration, setDuration] = useState(1);
  const [userNotes, setUserNotes] = useState('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Route data
  const [generatedRoute, setGeneratedRoute] = useState<RoutePlan | null>(null);

  /**
   * Handle Route Generation
   */
  const handleGenerateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setGeneratedRoute(null);
    setIsGenerating(true);

    try {
      // Get authenticated user (Server Action reads httpOnly cookie)
      const user = await getCurrentUser();

      if (!user) {
        setError('Please log in to generate routes');
        return;
      }

      // Call Server Action
      const result = await generateRoutePlan(
        location,
        tripType,
        duration,
        user.id,
        user.username,
        userNotes
      );

      if (result.success && result.data) {
        setGeneratedRoute(result.data);
        setSuccessMessage('Route generated successfully! Review and approve to save.');
      } else {
        setError(result.message || 'Failed to generate route');
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle Route Approval/Saving
   */
  const handleApproveRoute = async () => {
    if (!generatedRoute) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await saveRoute(generatedRoute);

      if (result.success) {
        setSavedRouteId(result.data?._id || null);
        setSuccessMessage('Route saved successfully! Redirecting to history...');

        // Redirect to history page after 2 seconds
        setTimeout(() => {
          window.location.href = '/history';
        }, 2000);
      } else {
        setError(result.message || 'Failed to save route');
      }

    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save route. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Saving Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm mx-4 shadow-2xl">
            <div className="text-center">
              <div className="spinner mx-auto mb-4 w-12 h-12" />
              <h3 className="text-xl font-semibold mb-2">Saving Your Route</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we save your adventure...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Plan Your Route
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Enter your destination and preferences to generate a personalized route with AI.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ===========================================
            LEFT COLUMN: INPUT FORM
            =========================================== */}
        <div className="lg:col-span-1 flex">
          <div className="card sticky top-24 w-full flex flex-col">
            <h2 className="text-xl font-semibold mb-6">Route Details</h2>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-700 dark:text-red-300 flex-1">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-green-700 dark:text-green-300 font-semibold">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerateRoute} className="space-y-5">
              {/* Location Input */}
              <div>
                <label htmlFor="location" className="form-label">
                  Location (Country/Region/City)
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Swiss Alps, Switzerland"
                  required
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a specific location for better route suggestions
                </p>
              </div>

              {/* Trip Type Selection */}
              <div>
                <label className="form-label">Trip Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTripType('trek')}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      tripType === 'trek'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🥾</div>
                    <div className="font-medium">Hiking</div>
                    <div className="text-xs text-gray-500">5-10 km/day</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTripType('bicycle')}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      tripType === 'bicycle'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚴</div>
                    <div className="font-medium">Cycling</div>
                    <div className="text-xs text-gray-500">30-70 km/day</div>
                  </button>
                </div>
              </div>

              {/* Duration Input */}
              <div>
                <label htmlFor="duration" className="form-label">
                  Duration (Days)
                </label>
                <input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="form-input"
                  min={1}
                  max={30}
                  required
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {tripType === 'trek'
                    ? `Up to 3 circular routes will be generated per day`
                    : 'Plan your multi-day cycling adventure (1-30 days)'}
                </p>
              </div>

              {/* User Notes (Optional) */}
              <div>
                <label htmlFor="userNotes" className="form-label">
                  Custom Preferences (Optional)
                </label>
                <textarea
                  id="userNotes"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="form-input min-h-[80px] resize-y"
                  placeholder="e.g., 'I want to see historical sites', 'Prefer routes with cafes', 'Avoid steep hills'..."
                  disabled={isGenerating}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full btn btn-primary py-3 mt-auto"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner mr-2" />
                    Generating Route...
                  </span>
                ) : (
                  'Generate Route with AI'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ===========================================
            RIGHT COLUMN: MAP & RESULTS
            =========================================== */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Map Container - Flex to match form height */}
          <div id="route-map" className="card flex-1 flex flex-col min-h-[550px]">
            <h2 className="text-xl font-semibold mb-4">Route Map</h2>
            <div className="flex-1 flex items-center justify-center min-h-0">
              {generatedRoute && generatedRoute.routes.length > 0 ? (
                <div className="w-full h-full">
                  <RouteMap
                    routes={generatedRoute.routes}
                    tripType={generatedRoute.tripType}
                    height="100%"
                    highlightDay={selectedDay}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-lg font-medium">Map will appear here</p>
                    <p className="text-sm">Generate a route to see it on the map</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Country Image */}
          {generatedRoute && generatedRoute.imageUrl && (
            <div className="card animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">Destination Image</h2>
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={generatedRoute.imageUrl}
                  alt={getImageAltText(generatedRoute.country, generatedRoute.city, generatedRoute.tripType)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to Lorem Picsum if AI image fails to load
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('picsum.photos')) {
                      console.log('AI image failed to load, using fallback');
                      const seed = Math.abs(
                        `${generatedRoute.country}-${generatedRoute.city}`.split('').reduce(
                          (acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0
                        )
                      );
                      target.src = `https://picsum.photos/seed/${seed}/1200/600`;
                    }
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Typical landscape of {generatedRoute.city}, {generatedRoute.country}
              </p>
            </div>
          )}

          {/* Route Details */}
          {generatedRoute && (
            <div className="card animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Route Details</h2>
                  <p className="text-gray-600 mt-1">
                    {generatedRoute.city}, {generatedRoute.country}
                  </p>
                </div>
                <button
                  onClick={handleApproveRoute}
                  disabled={isSaving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" />
                      Saving Route...
                    </>
                  ) : (
                    <>
                      Approve & Save Route
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                {generatedRoute.routes.map((route) => {
                  const isExpanded = expandedDays.has(route.day);

                  const toggleExpand = () => {
                    const newExpanded = new Set(expandedDays);
                    if (isExpanded) {
                      newExpanded.delete(route.day);
                    } else {
                      newExpanded.add(route.day);
                    }
                    setExpandedDays(newExpanded);
                  };

                  const handleDayClick = () => {
                    setSelectedDay(route.day);
                    // Scroll to map
                    document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  };

                  return (
                    <div key={route.day} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Summary Header - Always Visible */}
                      <div className="flex">
                        <button
                          onClick={toggleExpand}
                          className="flex-1 text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">
                              Day {route.day}: {route.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>{route.totalDistanceKm} km</span>
                              <span>{route.segments.length} segments</span>
                              <span>{route.majorLandmarks.length} landmarks</span>
                            </div>
                          </div>
                          <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleDayClick}
                          className="px-4 py-2 text-primary hover:bg-primary/10 transition-colors border-l border-gray-200 dark:border-gray-700"
                          title="View on map"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Detailed Content - Expandable */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                          {route.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                              {route.description}
                            </p>
                          )}

                          {/* Route Segments */}
                          <div className="space-y-3">
                            {route.segments.map((segment, segmentIndex) => (
                              <div key={segmentIndex} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-start gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {segmentIndex + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm mb-1">
                                      {segment.from} → {segment.to}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                      {segment.description}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="font-medium">{segment.distanceKm} km</span>
                                      {segment.landmarks && segment.landmarks.length > 0 && (
                                        <span>
                                          Landmarks: {segment.landmarks.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <p className="text-sm font-semibold mt-4 text-gray-700 dark:text-gray-300">
                            Day {route.day} Total: {route.totalDistanceKm} km
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-lg font-semibold">
                  Total Distance: {generatedRoute.totalDistanceKm} km
                </p>
              </div>
            </div>
          )}

          {/* Weather Notice */}
          {generatedRoute && (
            <div className="card animate-fade-in bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-2xl">i</div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Weather Forecast Available After Saving
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Once you approve and save this route, you'll be able to view it in your History
                    with a <strong>3-day weather forecast</strong> for starting your trip tomorrow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
