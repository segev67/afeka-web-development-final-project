/**
 * TypeScript Type Definitions
 * Centralized type definitions for the application.
 */

// ===========================================
// USER TYPES
// ===========================================

export interface User {
  id: string;
  username: string;
  email: string;
}

// ===========================================
// ROUTE TYPES
// ===========================================

/**
 * Trip Type - Either bicycle or trek (walking)
 */
export type TripType = 'bicycle' | 'trek';

/**
 * Coordinate Point for Map
 */
export interface Coordinate {
  lat: number;
  lng: number;
  name?: string;
}

/**
 * Landmark Point - Named location with coordinates
 */
export interface LandmarkPoint {
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
}

/**
 * Route Segment - Directions from one landmark to another
 */
export interface RouteSegment {
  from: string;
  to: string;
  description: string;
  distanceKm: number;
  landmarks?: string[];
}

/**
 * A single day's route with landmark-based segments
 */
export interface DayRoute {
  day: number;
  title: string;
  segments: RouteSegment[];
  majorLandmarks: LandmarkPoint[];
  totalDistanceKm: number;
  description?: string;
}

/**
 * Weather data for a specific day/location
 */
export interface WeatherData {
  date: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

/**
 * Complete Route Plan
 */
export interface RoutePlan {
  id?: string;
  userId: string;
  username: string;
  name?: string;
  country: string;
  region?: string;
  city: string;
  tripType: TripType;
  durationDays: number;
  routes: DayRoute[];
  totalDistanceKm: number;
  weather?: WeatherData[];
  imageUrl?: string;
  userNotes?: string;
  createdAt?: Date;
  approved?: boolean;
}

/**
 * Route stored in database (with MongoDB _id)
 */
export interface SavedRoute extends RoutePlan {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// FORM TYPES
// ===========================================

/**
 * Route Planning Form Data
 */
export interface RoutePlanningFormData {
  location: string;
  tripType: TripType;
  durationDays: number;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ===========================================
// LLM RESPONSE TYPES
// ===========================================

/**
 * Expected response format from LLM for route generation
 */
export interface LLMRouteResponse {
  country: string;
  region: string;
  city: string;
  routes: {
    day: number;
    title: string;
    segments: {
      from: string;
      to: string;
      description: string;
      distanceKm: number;
      landmarks?: string[];
    }[];
    majorLandmarks: {
      name: string;
      description?: string;
      lat?: number;
      lng?: number;
    }[];
    totalDistanceKm: number;
    description?: string;
  }[];
  totalDistanceKm: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  recommendations: string[];
}
