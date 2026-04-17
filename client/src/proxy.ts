/**
 * Next.js Proxy - JWT Token Validation & Silent Refresh
 * Runs on every request to protected routes.
 * Automatically refreshes expired access tokens using refresh tokens.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Convert JWT expiration string to seconds
 * JWT libraries use strings like '15m', '7d', '1h' for expiration.
 * Cookie maxAge needs seconds (number).
 */
function parseJwtExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    console.warn(`[Proxy] Invalid JWT expiration format: ${expiresIn}, defaulting to 15m`);
    return 60 * 15;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 60 * 15;
  }
}

// Get cookie maxAge from environment variables
const ACCESS_TOKEN_MAX_AGE = parseJwtExpiration(process.env.JWT_EXPIRES_IN || '15m');
const REFRESH_TOKEN_MAX_AGE = parseJwtExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

// ===========================================
// CONFIGURATION
// ===========================================

/**
 * Routes that require authentication.
 * Users without valid token will be redirected to login.
 */
const protectedRoutes = ['/planning', '/history'];

/**
 * Routes that should redirect authenticated users.
 */
const authRoutes = ['/login', '/register'];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Decode JWT without verification (client-side only)
 *
 * Decodes the token to extract payload and check expiration.
 * Signature verification happens only on the auth server.
 */
function decodeToken(token: string): { exp?: number; userId?: string } | null {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const base64Url = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(
      Buffer.from(base64Url, 'base64').toString()
    );

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 * @param exp - Expiration timestamp (seconds since epoch)
 * @returns true if expired, false otherwise
 */
function isTokenExpired(exp?: number): boolean {
  if (!exp) return true;

  return Date.now() >= exp * 1000;
}

// ===========================================
// MIDDLEWARE FUNCTION
// ===========================================

/**
 * Refresh Access Token using Refresh Token
 *
 * Implements silent refresh - when access token expires,
 * automatically uses refresh token to get a new one.
 * User doesn't notice the refresh.
 */
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; newRefreshToken?: string } | null> {
  try {
    const authServerUrl = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:5001';

    console.log('[Proxy] 🔄 Access token expired, attempting silent refresh...');
    console.log(`[Proxy] Auth server URL: ${authServerUrl}/auth/refresh`);

    const response = await fetch(`${authServerUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`,
      },
      credentials: 'include',
    });

    console.log(`[Proxy] Auth server response status: ${response.status}`);

    if (!response.ok) {
      console.log('[Proxy] ❌ Token refresh failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    const accessToken = data.data?.accessToken || data.accessToken;
    console.log(`[Proxy] Response data has accessToken: ${!!accessToken}`);

    if (accessToken) {
      console.log('[Proxy] ✅ Token refreshed successfully (silent)');

      const setCookieHeader = response.headers.get('set-cookie');
      let newRefreshToken: string | undefined;

      if (setCookieHeader) {
        const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
        if (refreshTokenMatch) {
          newRefreshToken = refreshTokenMatch[1];
          console.log('[Proxy] 🔄 Refresh token rotated');
        }
      }

      return {
        accessToken,
        newRefreshToken,
      };
    }

    console.log('[Proxy] ❌ No accessToken in response data');
    return null;
  } catch (error) {
    console.error('[Proxy] ❌ Error refreshing token:', error);
    return null;
  }
}

/**
 * Main Proxy Function
 *
 * Execution flow:
 * 1. Check if route is protected
 * 2. Get access token from cookie
 * 3. Decode and validate token
 * 4. If expired, attempt silent refresh with refresh token
 * 5. Redirect to login only if refresh fails
 * 6. Continue to page if valid
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // ===========================================
  // PROTECTED ROUTE HANDLING
  // ===========================================

  if (isProtectedRoute) {
    if (!accessToken) {
      // Try to refresh if we have a refresh token
      if (refreshToken) {
        console.log(`[Proxy] No access token, attempting silent refresh...`);
        const refreshResult = await refreshAccessToken(refreshToken);

        if (refreshResult) {
          const response = NextResponse.next();

          response.cookies.set('accessToken', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: ACCESS_TOKEN_MAX_AGE,
          });

          if (refreshResult.newRefreshToken) {
            response.cookies.set('refreshToken', refreshResult.newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              path: '/',
              maxAge: REFRESH_TOKEN_MAX_AGE,
            });
          }

          console.log(`[Proxy] ✅ Silent refresh successful, allowing access to ${pathname}`);
          return response;
        }
      }

      // No refresh token or refresh failed - redirect to login
      console.log(`[Proxy] No valid tokens, redirecting to login from ${pathname}`);

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');

      return response;
    }

    // Decode and check access token
    const decoded = decodeToken(accessToken);

    if (!decoded || isTokenExpired(decoded.exp)) {
      console.log(`[Proxy] Access token expired or invalid`);

      if (refreshToken) {
        console.log('[Proxy] Attempting silent token refresh...');
        const refreshResult = await refreshAccessToken(refreshToken);

        if (refreshResult) {
          const response = NextResponse.next();

          response.cookies.set('accessToken', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: ACCESS_TOKEN_MAX_AGE,
          });

          if (refreshResult.newRefreshToken) {
            response.cookies.set('refreshToken', refreshResult.newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              path: '/',
              maxAge: REFRESH_TOKEN_MAX_AGE,
            });
          }

          console.log(`[Proxy] ✅ Token refreshed silently, allowing access to ${pathname}`);
          return response;
        }
      }

      // Refresh failed - redirect to login
      console.log(`[Proxy] Token refresh failed, redirecting to login`);

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');

      return response;
    }

    console.log(`[Proxy] Token valid, allowing access to ${pathname}`);
  }

  // ===========================================
  // AUTH ROUTE HANDLING
  // ===========================================

  if (isAuthRoute) {
    if (accessToken) {
      const decoded = decodeToken(accessToken);

      if (decoded && !isTokenExpired(decoded.exp)) {
        console.log(`[Proxy] Already authenticated, redirecting to home`);
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // ===========================================
  // CONTINUE TO PAGE
  // ===========================================

  return NextResponse.next();
}

// ===========================================
// MATCHER CONFIGURATION
// ===========================================

/**
 * Configure which routes the proxy runs on.
 * Excludes static files, images, and API routes for performance.
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
