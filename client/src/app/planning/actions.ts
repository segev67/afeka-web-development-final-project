'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Route from '@/lib/models/Route';
import { generateRoute, validateRouteData } from '@/lib/gemini';
import { fetchWeatherForRoute } from '@/lib/weather';
import { fetchCountryImage } from '@/lib/images';
import type { TripType, RoutePlan, SavedRoute, ApiResponse } from '@/types';

// ===========================================
// GENERATE ROUTE ACTION
// ===========================================

/**
 * Generate Route with Gemini AI
 *
 * Server Action that generates route using AI.
 *
 * @param location - User's destination
 * @param tripType - 'trek' or 'bicycle'
 * @param durationDays - Trip duration
 * @param userId - Authenticated user ID
 * @param username - User's name
 * @param userNotes - Optional user preferences/notes
 * @returns Route plan with weather data
 */
export async function generateRoutePlan(
  location: string,
  tripType: TripType,
  durationDays: number,
  userId: string,
  username: string,
  userNotes?: string
): Promise<ApiResponse<RoutePlan>> {
  try {
    console.log(`Generating route for ${username}...`);
    if (userNotes) {
      console.log(`   User preferences: ${userNotes}`);
    }

    // Steps 1+2: Generate + validate, with retry on LLM non-determinism
    const MAX_ATTEMPTS = 3;
    let routeData: Awaited<ReturnType<typeof generateRoute>> = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`Route generation attempt ${attempt}/${MAX_ATTEMPTS}...`);
      const candidate = await generateRoute(location, tripType, durationDays, userNotes);

      if (candidate && validateRouteData(candidate)) {
        routeData = candidate;
        break;
      }

      console.warn(`Attempt ${attempt} produced invalid route data, retrying...`);
    }

    if (!routeData) {
      return {
        success: false,
        message: 'Failed to generate a valid route after multiple attempts. Please try different parameters.',
      };
    }

    // Step 3: Fetch country-typical image
    const imageUrl = await fetchCountryImage(routeData.country, routeData.city, tripType);

    // Step 4: Create route plan object
    const routePlan: RoutePlan = {
      userId,
      username,
      name: routeData.routes[0]?.title || `${routeData.city} ${tripType === 'trek' ? 'Hiking' : 'Cycling'} Adventure`,
      country: routeData.country,
      region: routeData.region,
      city: routeData.city,
      tripType,
      durationDays,
      routes: routeData.routes.map(r => ({
        day: r.day,
        title: r.title,
        segments: r.segments,
        majorLandmarks: r.majorLandmarks,
        totalDistanceKm: r.totalDistanceKm,
        description: r.description,
      })),
      totalDistanceKm: routeData.totalDistanceKm,
      imageUrl,
      userNotes: userNotes || undefined,
      approved: false,
    };

    console.log('Route plan generated successfully');

    return {
      success: true,
      message: 'Route generated successfully!',
      data: routePlan,
    };

  } catch (error) {
    console.error('Error in generateRoutePlan:', error);

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================================
// SAVE ROUTE ACTION
// ===========================================

/**
 * Save Route to Database
 *
 * Called when user clicks "Approve Route" button.
 *
 * @param routePlan - Complete route plan to save
 * @returns Success/failure response
 */
export async function saveRoute(
  routePlan: RoutePlan
): Promise<ApiResponse<SavedRoute>> {
  try {
    console.log(`Saving route for user ${routePlan.userId}...`);

    // Step 1: Connect to database
    await dbConnect();

    // Step 2: Create route document
    const route = await Route.create({
      ...routePlan,
      approved: true,
    });

    console.log(`Route saved with ID: ${route._id}`);

    // Step 3: Revalidate history page
    revalidatePath('/history');

    // Convert Mongoose document to plain object for client serialization
    const plainRoute = {
      ...route.toObject(),
      _id: route._id.toString(),
    };

    return {
      success: true,
      message: 'Route saved successfully!',
      data: plainRoute as SavedRoute,
    };

  } catch (error) {
    console.error('Error saving route:', error);

    return {
      success: false,
      message: 'Failed to save route. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================================
// FETCH ROUTES ACTION
// ===========================================

/**
 * Fetch User's Saved Routes
 *
 * Used by the history page to display saved routes.
 *
 * @param userId - User ID to fetch routes for
 * @returns Array of saved routes
 */
export async function fetchUserRoutes(
  userId: string
): Promise<ApiResponse<SavedRoute[]>> {
  try {
    console.log(`Fetching routes for user ${userId}...`);

    await dbConnect();

    // Fetch routes, newest first
    const routes = await Route.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${routes.length} routes`);

    return {
      success: true,
      message: `Found ${routes.length} routes`,
      data: routes as SavedRoute[],
    };

  } catch (error) {
    console.error('Error fetching routes:', error);

    return {
      success: false,
      message: 'Failed to fetch routes',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================================
// DELETE ROUTE ACTION
// ===========================================

/**
 * Delete a Saved Route
 *
 * @param routeId - ID of route to delete
 * @param userId - User ID (for authorization)
 * @returns Success/failure response
 */
export async function deleteRoute(
  routeId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    console.log(`Deleting route ${routeId}...`);

    await dbConnect();

    // Delete only if route belongs to user (security check)
    const result = await Route.deleteOne({ _id: routeId, userId });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Route not found or unauthorized',
      };
    }

    console.log('Route deleted');

    // Revalidate history page
    revalidatePath('/history');

    return {
      success: true,
      message: 'Route deleted successfully',
    };

  } catch (error) {
    console.error('Error deleting route:', error);

    return {
      success: false,
      message: 'Failed to delete route',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
