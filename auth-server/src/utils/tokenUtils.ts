/**
 * JWT Token Utilities
 * Functions for generating, verifying, and managing JWT tokens.
 */

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

// ===========================================
// TYPESCRIPT INTERFACES
// ===========================================

/**
 * Token Payload Interface
 * Payload included in JWT tokens for user identification.
 */
export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

/**
 * Decoded Token Interface
 * Extends JwtPayload to include custom token fields.
 */
export interface DecodedToken extends JwtPayload, TokenPayload {}

// ===========================================
// TOKEN GENERATION FUNCTIONS
// ===========================================

/**
 * Generate Access Token
 *
 * Access tokens are short-lived (15 minutes default).
 * Used for authenticating every API request.
 * Contains user information so server doesn't need to query database.
 * Signed with JWT_SECRET to prevent tampering.
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate Refresh Token
 *
 * Refresh tokens are long-lived (7 days default).
 * Used only to obtain new access tokens (silent refresh).
 * Stored in httpOnly cookie for security.
 * Uses separate secret (JWT_REFRESH_SECRET) for defense in depth.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
};

// ===========================================
// TOKEN VERIFICATION FUNCTIONS
// ===========================================

/**
 * Verify Access Token
 *
 * Checks:
 * - Is the signature valid? (was it signed with JWT_SECRET?)
 * - Is the token expired?
 * - Is the token structure valid?
 *
 * Returns decoded payload if valid, throws error if invalid.
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret) as DecodedToken;
};

/**
 * Verify Refresh Token
 * Same as verifyAccessToken but uses JWT_REFRESH_SECRET.
 * Only used when client needs a new access token.
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret) as DecodedToken;
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Extract Token from Authorization Header
 *
 * Authorization header format: "Bearer <token>"
 * Extracts just the token part.
 * Returns null if header is missing or malformed.
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Cookie Options for Refresh Token
 *
 * Security settings:
 * - httpOnly: true - Cookie cannot be accessed by JavaScript (prevents XSS)
 * - secure: true in production - Only sent over HTTPS
 * - sameSite: Prevents cross-site cookie usage
 * - maxAge: Cookie expiration (7 days)
 */
export const getRefreshTokenCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});
