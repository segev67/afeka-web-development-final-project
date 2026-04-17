import Link from 'next/link';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Route from '@/lib/models/Route';
import type { SavedRoute } from '@/types';
import RouteListClient from '@/components/RouteListClient';

// ===========================================
// HELPER FUNCTION - GET USER FROM TOKEN
// ===========================================

/**
 * Extract User ID from JWT Cookie
 */
async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  try {
    // Decode JWT (same logic as proxy)
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
// HISTORY PAGE COMPONENT
// ===========================================

/**
 * History Page - Server Component
 *
 * Fetches routes directly from database during render.
 *
 * @returns Rendered history page with routes
 */
export default async function HistoryPage() {
  // Get user ID from JWT token
  const userId = await getUserIdFromToken();

  if (!userId) {
    // This shouldn't happen (proxy should redirect), but just in case
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card text-center py-16">
          <p className="text-red-600">Please log in to view your routes.</p>
          <Link href="/login" className="btn btn-primary mt-4 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Connect to database and fetch routes
  await dbConnect();

  // Fetch user's routes, newest first
  const routesFromDb = await Route.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  // Convert MongoDB objects to plain JSON for Client Component
  const routes = routesFromDb.map((route: any) => ({
    ...route,
    _id: route._id.toString(), // Convert ObjectId to string
    createdAt: route.createdAt?.toISOString() || new Date().toISOString(), // Convert Date to ISO string
    updatedAt: route.updatedAt?.toISOString() || new Date().toISOString(), // Convert Date to ISO string
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                My Adventures
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your saved routes are ready for your next journey
              </p>
            </div>
            <Link
              href="/planning"
              className="btn btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Plan New Route
            </Link>
          </div>

          {/* Quick Stats */}
          {routes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-primary">
                  {routes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Saved Routes
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-primary">
                  {routes.reduce((sum, r) => sum + (r as any).totalDistanceKm, 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total km
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-primary">
                  {routes.reduce((sum, r) => sum + (r as any).durationDays, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Days
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-primary">
                  {new Set(routes.map(r => (r as any).country)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Countries
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Routes List or Empty State */}
        {routes.length === 0 ? (
          /* Empty State */
          <div className="card text-center py-20 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-dashed border-primary/30">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Start Your First Adventure!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              You haven&apos;t saved any routes yet. Let our AI plan the perfect hiking or cycling route for you.
            </p>
            <Link
              href="/planning"
              className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Plan Your First Route
            </Link>
          </div>
        ) : (
          /* Route List with Filters */
          <RouteListClient routes={routes as unknown as SavedRoute[]} />
        )}

        {/* Info Box */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                Fresh Weather Forecasts
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                Every time you open a saved route, we fetch the latest 3-day weather forecast for your starting point.
                Plan your adventure with up-to-date conditions!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
