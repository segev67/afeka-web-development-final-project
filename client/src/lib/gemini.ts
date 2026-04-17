/**
 * GEMINI AI INTEGRATION
 *
 * This file handles route generation using Google Gemini AI.
 *
 * PROJECT REQUIREMENT:
 * "All information on the hiking routes is drawn from LLM models"
 *
 * HOW IT WORKS (HYBRID APPROACH):
 * 1. Gemini generates route concepts (start/end points, descriptions)
 * 2. OSRM routing service calculates realistic waypoints between points
 * 3. Result: Routes that follow real roads/trails, not imaginary paths
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TripType, LLMRouteResponse } from '@/types';

// ===========================================
// INITIALIZATION
// ===========================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini Flash model
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

// ===========================================
// PROMPT ENGINEERING
// ===========================================

/**
 * Create Route Generation Prompt
 */
function createRoutePrompt(
  location: string,
  tripType: TripType,
  durationDays: number,
  userNotes?: string
): string {
  const isBicycle = tripType === 'bicycle';
  const dailyDistanceMin = isBicycle ? 30 : 5;
  const dailyDistanceMax = isBicycle ? 70 : 10;
  const isLongTrip = durationDays >= 10;

  const compactNote = isLongTrip
    ? `
COMPACT OUTPUT (${durationDays} days): To avoid truncation, use SHORT format so the full JSON fits in one response:
- Use exactly 2-3 segments per day (not more).
- Use 3-4 major landmarks per day with lat/lng.
- One short sentence per segment "description" (e.g. "Walk north from X to Y along the river.").
- Omit or use one word for landmark "description" and route "description" if needed.
`
    : '';

  const userPreferences = userNotes
    ? `
USER'S SPECIAL PREFERENCES:
${userNotes}

Please incorporate these preferences into your route planning.
`
    : '';

  return `You are an EXPERT LOCAL ${isBicycle ? 'CYCLING' : 'HIKING'} GUIDE with intimate knowledge of ${location}.

Your task: Create EXACTLY ${durationDays} ${isBicycle ? 'days' : 'day(s)'} of realistic ${tripType} route(s) that a human can actually follow.
${compactNote}${userPreferences}
CRITICAL REQUIREMENTS:
1. MUST generate EXACTLY ${durationDays} routes (one per day) - NO MORE, NO LESS
2. Use REAL place names: actual street names, trail names, landmarks, cities
3. Routes must be FOLLOWABLE using your descriptions alone (no abstract GPS coordinates)
4. Write natural narrative directions: "Start at X, head north on Y road, after 5km you'll see Z..."
5. ${isBicycle ? 'LINEAR ROUTES: City to city, each day connects to the next. Use named roads/highways.' : 'CIRCULAR ROUTES: Start and end at same point. Use named trails and return to origin.'}
6. Distance per day: ${dailyDistanceMin}-${dailyDistanceMax} km
7. Include ${isLongTrip ? '3-4' : '5-7'} major landmarks per day with REAL names
8. Break each day into ${isLongTrip ? '2-3' : '3-5'} segments (from landmark A to landmark B)

IMPORTANT: The routes array MUST contain EXACTLY ${durationDays} items (day 1 through day ${durationDays}).

RESEARCH the location first - use real places that exist!

JSON RULES (critical for valid parsing):
- Return ONLY valid JSON. No markdown, no extra text.
- Inside string values: escape double-quotes as \\", and do NOT use literal newlines (use spaces or \\n).
- Keep each "description" to 1-2 short sentences to avoid truncation.

OUTPUT FORMAT (JSON only):
{
  "country": "Country name",
  "region": "Region name",
  "city": "Starting city",
  "routes": [
    {
      "day": 1,
      "title": "Descriptive route title (e.g., 'Geneva to Lausanne via Lake Geneva')",
      "segments": [
        {
          "from": "Starting landmark name",
          "to": "Destination landmark name",
          "description": "Natural narrative directions with street/trail names. Include what to look for, landmarks passed, and turns to make.",
          "distanceKm": 12,
          "landmarks": ["Notable place 1", "Notable place 2"]
        }
      ],
      "majorLandmarks": [
        {
          "name": "Landmark name",
          "description": "Brief description",
          "lat": 46.2044,
          "lng": 6.1432
        }
      ],
      "totalDistanceKm": ${dailyDistanceMin + (dailyDistanceMax - dailyDistanceMin) / 2},
      "description": "Overall day summary"
    }
  ],
  "totalDistanceKm": 0.0,
  "difficulty": "easy|moderate|hard",
  "recommendations": ["Practical tip 1", "Practical tip 2"]
}

CRITICAL: Return ONLY valid JSON. Use real places. Make routes followable by humans. Escape quotes in strings. No newlines inside strings.`;
}

/**
 * Normalize raw LLM text for JSON parsing: fix common issues that break JSON.parse.
 */
function normalizeJsonText(raw: string): string {
  return raw
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');
}

/**
 * If the JSON string looks truncated, try to close it.
 */
function tryCloseTruncatedJson(str: string): string | null {
  let repaired = str.trim();
  const unescapedQuotes = (repaired.match(/(?<!\\)"/g) || []).length;
  const inString = unescapedQuotes % 2 !== 0;
  if (inString) {
    repaired += '"';
  }
  const stack: string[] = [];
  let inStr = false;
  let escape = false;
  let i = 0;
  while (i < repaired.length) {
    const c = repaired[i];
    if (escape) {
      escape = false;
      i++;
      continue;
    }
    if (c === '\\' && inStr) {
      escape = true;
      i++;
      continue;
    }
    if ((c === '"') && !escape) {
      inStr = !inStr;
      i++;
      continue;
    }
    if (!inStr) {
      if (c === '{') stack.push('}');
      else if (c === '[') stack.push(']');
      else if (c === '}' || c === ']') stack.pop();
    }
    i++;
  }
  if (stack.length > 0) {
    repaired += stack.reverse().join('');
  }
  if (!inString && stack.length === 0) return null;
  return repaired;
}

/**
 * Sanitize route data after parsing
 */
function sanitizeRecoveredRouteData(data: LLMRouteResponse): LLMRouteResponse {
  const routes = (data.routes || []).filter((r) => {
    if (!Array.isArray(r.segments) || r.segments.length < 2) return false;
    const withCoords = (r.majorLandmarks || []).filter(
      (m) => m?.lat != null && m?.lng != null
    );
    return withCoords.length >= 2;
  });
  if (routes.length === 0) {
    return data;
  }

  const routesWithDistance = routes.map((r, i) => {
    let routeDistance = r.totalDistanceKm;

    if (routeDistance === undefined || routeDistance === null || routeDistance === 0) {
      routeDistance = (r.segments || []).reduce(
        (sum, seg) => sum + (Number(seg.distanceKm) || 0),
        0
      );

      if (routeDistance === 0 && r.segments && r.segments.length > 0) {
        routeDistance = r.segments.length * 5;
      }
    }

    return {
      ...r,
      day: i + 1,
      totalDistanceKm: Math.round(routeDistance * 10) / 10
    };
  });

  const totalDistanceKm =
    data.totalDistanceKm ??
    routesWithDistance.reduce((sum, r) => sum + (Number(r.totalDistanceKm) || 0), 0);

  return {
    ...data,
    routes: routesWithDistance,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    difficulty: data.difficulty || 'moderate',
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
  };
}

// ===========================================
// ROUTE GENERATION
// ===========================================

/**
 * Generate Route using Gemini AI
 *
 * @param location - Destination location
 * @param tripType - Type of trip (trek/bicycle)
 * @param durationDays - Trip duration
 * @param userNotes - Optional user preferences
 * @returns Generated route data or null
 */
export async function generateRoute(
  location: string,
  tripType: TripType,
  durationDays: number,
  userNotes?: string
): Promise<LLMRouteResponse | null> {
  try {
    console.log(`Generating ${tripType} route for ${location} (${durationDays} days)...`);
    if (userNotes) {
      console.log(`   User preferences: ${userNotes}`);
    }

    const prompt = createRoutePrompt(location, tripType, durationDays, userNotes);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();

    console.log('Gemini response received, parsing JSON...');

    let jsonText = text.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    jsonText = normalizeJsonText(jsonText);

    let routeData: LLMRouteResponse;
    try {
      routeData = JSON.parse(jsonText);
    } catch (parseError) {
      const len = text.length;
      console.error('JSON parsing failed. Response length:', len);
      console.error('   First 400 chars:', text.substring(0, 400));
      console.error('   Last 200 chars:', text.substring(Math.max(0, len - 200)));

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let candidate = normalizeJsonText(jsonMatch[0]);
        try {
          routeData = JSON.parse(candidate);
          console.log('Recovered JSON using regex + normalization');
        } catch {
          const repairedCandidate = tryCloseTruncatedJson(candidate);
          if (repairedCandidate) {
            try {
              routeData = JSON.parse(repairedCandidate);
              console.log('Recovered JSON after closing truncated brackets');
            } catch {
              throw new Error('Failed to parse Gemini response as JSON. The AI may have returned malformed or truncated data.');
            }
          } else {
            throw new Error('Failed to parse Gemini response as JSON. The AI may have returned malformed data.');
          }
        }
      } else {
        throw new Error('No valid JSON found in Gemini response');
      }
    }

    routeData = sanitizeRecoveredRouteData(routeData);

    if (!routeData.routes || routeData.routes.length === 0) {
      throw new Error('No routes in response');
    }

    console.log('Route generated successfully!');
    console.log(`   - ${routeData.routes.length} day(s)`);
    console.log(`   - Total distance: ${routeData.totalDistanceKm} km`);

    return routeData;

  } catch (error) {
    console.error('Error generating route:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }

    return null;
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Validate Route Data
 *
 * Ensures the LLM response has all required fields.
 *
 * @param data - Route data from LLM
 * @returns true if valid, false otherwise
 */
export function validateRouteData(data: Partial<LLMRouteResponse>): boolean {
  if (!data.country || !data.city) {
    console.error('Missing location data');
    return false;
  }

  if (!data.routes || data.routes.length === 0) {
    console.error('No routes provided');
    return false;
  }

  for (const route of data.routes) {
    if (!route.title) {
      console.error(`Route ${route.day}: Missing title`);
      return false;
    }

    if (!route.segments || route.segments.length < 2) {
      console.error(`Route ${route.day}: Need at least 2 segments (got ${route.segments?.length || 0})`);
      return false;
    }

    let validSegments = 0;
    for (const segment of route.segments) {
      if (!segment.from || !segment.to) {
        console.warn(`Route ${route.day}: Segment missing 'from' or 'to'`);
        continue;
      }

      if (!segment.description || segment.description.length < 20) {
        console.warn(`Route ${route.day}: Segment has short description`);
      }

      if (!segment.distanceKm || segment.distanceKm <= 0) {
        console.warn(`Route ${route.day}: Segment missing valid distance`);
      }

      validSegments++;
    }

    if (validSegments < route.segments.length / 2) {
      console.error(`Route ${route.day}: Too many invalid segments (${validSegments}/${route.segments.length} valid)`);
      return false;
    }

    if (!route.majorLandmarks || route.majorLandmarks.length < 2) {
      console.error(`Route ${route.day}: Need at least 2 major landmarks (got ${route.majorLandmarks?.length || 0})`);
      return false;
    }

    for (const landmark of route.majorLandmarks) {
      if (!landmark.name) {
        console.error(`Route ${route.day}: Landmark missing name`);
        return false;
      }

      if (landmark.lat === undefined || landmark.lng === undefined) {
        console.error(`Route ${route.day}: Landmark "${landmark.name}" missing GPS coordinates`);
        return false;
      }
    }
  }

  return true;
}
