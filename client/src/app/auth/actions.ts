/**
 * Auth Server Actions
 * Server-side functions for user authentication.
 * Can securely set httpOnly cookies.
 */

'use server';

import { cookies } from 'next/headers';

// ===========================================
// TYPES
// ===========================================

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
    };
    accessToken: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
}

// ===========================================
// CONSTANTS
// ===========================================

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'http://localhost:4000';

// Parse JWT expiration string to seconds
function parseJwtExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 15; // Default 15 minutes

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

const ACCESS_TOKEN_MAX_AGE = parseJwtExpiration(process.env.JWT_EXPIRES_IN || '15m');

// ===========================================
// AUTH ACTIONS
// ===========================================

/**
 * Get Current User
 *
 * Reads the httpOnly accessToken cookie and verifies it with the auth server.
 * Returns user object if authenticated, null otherwise.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return null;
    }

    // Verify token with auth server
    const response = await fetch(`${AUTH_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.data?.user) {
      const user = data.data.user;
      return {
        id: user.userId || user.id,
        username: user.username,
        email: user.email,
      };
    }

    return null;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    return null;
  }
}

/**
 * Register User
 *
 * @param username - User's display name
 * @param email - User's email
 * @param password - User's password
 */
export async function registerAction(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });

    const data: AuthResponse = await response.json();

    // Set accessToken in httpOnly cookie
    if (data.success && data.data?.accessToken) {
      const cookieStore = await cookies();

      cookieStore.set('accessToken', data.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      // Forward refreshToken cookie from auth server response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
        if (refreshTokenMatch) {
          const refreshToken = refreshTokenMatch[1];
          const refreshMaxAge = parseJwtExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

          cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: refreshMaxAge,
          });

          console.log('[registerAction] Forwarded refreshToken cookie to browser');
        }
      }
    }

    return data;
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      message: 'Registration failed. Please try again.',
    };
  }
}

/**
 * Login User
 *
 * @param email - User's email
 * @param password - User's password
 */
export async function loginAction(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await response.json();

    // Set accessToken in httpOnly cookie
    if (data.success && data.data?.accessToken) {
      const cookieStore = await cookies();

      cookieStore.set('accessToken', data.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      // Forward refreshToken cookie from auth server response
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        const refreshTokenMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
        if (refreshTokenMatch) {
          const refreshToken = refreshTokenMatch[1];
          const refreshMaxAge = parseJwtExpiration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

          cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: refreshMaxAge,
          });

          console.log('[loginAction] Forwarded refreshToken cookie to browser');
        } else {
          console.warn('[loginAction] No refreshToken found in Set-Cookie header');
        }
      } else {
        console.warn('[loginAction] No Set-Cookie header from auth server');
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed. Please try again.',
    };
  }
}

/**
 * Logout User
 */
export async function logoutAction(): Promise<void> {
  try {
    // Call auth server to clear refresh token
    await fetch(`${AUTH_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    // Clear accessToken cookie
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
  } catch (error) {
    console.error('Logout error:', error);
  }
}
