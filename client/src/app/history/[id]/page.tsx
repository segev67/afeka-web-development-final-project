import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Route from '@/lib/models/Route';
import { fetchWeatherForRoute, getWeatherIconUrl, formatTemperature } from '@/lib/weather';
import { getImageAltText } from '@/lib/images';
import type { SavedRoute } from '@/types';
import RouteDetailClient from './RouteDetailClient';
import ImageWithFallback from '@/components/ImageWithFallback';

// ===========================================
// HELPER FUNCTION
// ===========================================

async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    return payload.userId || null;
  } catch {
    return null;
  }
}

// ===========================================
// PAGE COMPONENT
// ===========================================

/**
 * Route Detail Page
 *
 * Server Component that fetches route data and weather forecast.
 *
 * @param params - Route parameters containing the route ID
 */
export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Get authenticated user
  const userId = await getUserIdFromToken();

  if (!userId) {
    redirect('/login');
  }

  // Connect to database
  await dbConnect();

  // Fetch the route
  const route = await Route.findOne({ _id: id, userId }).lean().exec();

  if (!route) {
    notFound(); // Returns 404 page
  }

  // Type assertion
  const savedRoute = route as unknown as SavedRoute;

  // Fetch updated weather
  const firstLandmark = savedRoute.routes[0]?.majorLandmarks?.[0];
  const updatedWeather = firstLandmark?.lat && firstLandmark?.lng
    ? await fetchWeatherForRoute([{ lat: firstLandmark.lat, lng: firstLandmark.lng }])
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/history"
        className="inline-flex items-center text-primary hover:underline mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to History
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {savedRoute.name || `${savedRoute.city}, ${savedRoute.country}`}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {savedRoute.tripType === 'bicycle' ? 'Cycling Route' : 'Hiking Route'} •
          {' '}{savedRoute.durationDays} day{savedRoute.durationDays > 1 ? 's' : ''} •
          {' '}{savedRoute.totalDistanceKm} km total
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Created on {new Date(savedRoute.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Overview & Image */}
        <div className="lg:col-span-1 space-y-6">
          {/* Country Image */}
          {savedRoute.imageUrl && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Destination Image</h2>
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                <ImageWithFallback
                  src={savedRoute.imageUrl}
                  alt={getImageAltText(savedRoute.country, savedRoute.city, savedRoute.tripType)}
                  className="w-full h-full object-cover"
                  country={savedRoute.country}
                  city={savedRoute.city}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Typical landscape of {savedRoute.city}, {savedRoute.country}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Routes, Weather & Map */}
        <div className="lg:col-span-2">
          <RouteDetailClient
            routes={savedRoute.routes}
            routeId={savedRoute._id.toString()}
            userId={userId}
            tripType={savedRoute.tripType}
            updatedWeather={updatedWeather}
          />
        </div>
      </div>
    </div>
  );
}
