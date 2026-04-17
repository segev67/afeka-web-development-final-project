/**
 * IMAGE UTILITIES
 *
 * PROJECT REQUIREMENT:
 * "The route page will be accompanied by one image (typical of the country),
 *  real or produced in generative code."
 *
 * APPROACH:
 * 1. Unsplash (primary) – real photos by location search; set UNSPLASH_ACCESS_KEY in .env
 * 2. Pollinations.ai (fallback) – AI-generated image, no API key
 * 3. Picsum.photos (final fallback) – deterministic placeholder
 */

/**
 * Generate a consistent seed for deterministic image generation
 */
function generateLocationSeed(country: string, city?: string, tripType?: string): string {
  const str = `${country.toLowerCase()}-${city?.toLowerCase() || 'region'}-${tripType || 'nature'}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}

/** Unsplash search response (minimal type for our use) */
interface UnsplashSearchResult {
  results?: { urls?: { regular?: string; raw?: string }; [key: string]: unknown }[];
}

/**
 * Try to get a real photo from Unsplash for the location.
 * Returns image URL or undefined if no key, no results, or error.
 */
async function tryUnsplashImage(
  country: string,
  city?: string,
  tripType?: 'trek' | 'bicycle'
): Promise<string | undefined> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey?.trim()) return undefined;

  const query = [city, country, tripType === 'trek' ? 'hiking landscape' : 'cycling landscape']
    .filter(Boolean)
    .join(' ');
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&client_id=${accessKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return undefined;
    const data = (await res.json()) as UnsplashSearchResult;
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return undefined;
    const photo = results[0];
    const imageUrl = photo?.urls?.regular || photo?.urls?.raw;
    if (imageUrl) return imageUrl;
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Build Pollinations.ai image URL (AI-generated). No API key required.
 */
function getPollinationsUrl(country: string, city?: string, tripType?: 'trek' | 'bicycle'): string {
  const locationFirst = `${country}${city ? ` ${city}` : ''}`.trim();
  const activityNoun = tripType === 'trek' ? 'hiking trail' : 'cycling path';
  const prompt = `${locationFirst}, typical ${country} landscape, ${activityNoun}, scenic view, ${
    tripType === 'trek' ? 'mountains and nature trail' : 'countryside road'
  }, iconic ${country} scenery, professional photography, vibrant colors`;
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = generateLocationSeed(country, city, tripType);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=600&seed=${seed}&nologo=true&enhance=true`;
}

export async function fetchCountryImage(
  country: string,
  city?: string,
  tripType?: 'trek' | 'bicycle'
): Promise<string | undefined> {
  const locationLabel = city ? `${city}, ${country}` : country;
  console.log(`Image for: ${locationLabel}`);

  try {
    // 1. Primary: Unsplash (real photos) – requires UNSPLASH_ACCESS_KEY in .env
    const unsplashUrl = await tryUnsplashImage(country, city, tripType);
    if (unsplashUrl) {
      console.log('Using Unsplash (real photo)');
      return unsplashUrl;
    }

    // 2. Fallback: Pollinations (AI-generated)
    const pollinationsUrl = getPollinationsUrl(country, city, tripType);
    console.log('Using Pollinations (AI-generated). Set UNSPLASH_ACCESS_KEY for real photos.');
    return pollinationsUrl;
  } catch (error) {
    console.error('Error fetching image:', error);
    return getPollinationsUrl(country, city, tripType);
  }
}

/**
 * Final fallback URL when the primary image fails to load in the browser (e.g. CORS).
 * Used by ImageWithFallback and planning page onError.
 */
export function getPicsumFallbackUrl(country: string, city?: string, tripType?: 'trek' | 'bicycle'): string {
  const seed = generateLocationSeed(country, city, tripType);
  return `https://picsum.photos/seed/${seed}/1200/600`;
}

/**
 * Get Image Alt Text
 *
 * Generates appropriate alt text for accessibility.
 *
 * @param country - Country name
 * @param city - City name (optional)
 * @param tripType - Type of trip
 * @returns Alt text description
 */
export function getImageAltText(
  country: string,
  city?: string,
  tripType?: 'trek' | 'bicycle'
): string {
  const location = city ? `${city}, ${country}` : country;
  const activity = tripType === 'trek' ? 'hiking' : 'cycling';
  return `Scenic ${activity} landscape in ${location}`;
}
