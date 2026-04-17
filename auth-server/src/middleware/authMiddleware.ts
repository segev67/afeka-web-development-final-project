/**
 * Authentication Middleware
 * Verifies JWT tokens on protected routes.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, DecodedToken } from '../utils/tokenUtils';

// ===========================================
// EXTEND EXPRESS REQUEST TYPE
// ===========================================

/**
 * Extend Express Request to include user property.
 * Enables type-safe access to decoded token data in route handlers.
 */
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

/**
 * Protect Middleware - Verifies JWT Token
 *
 * Flow:
 * 1. Extract token from Authorization header ("Bearer <token>")
 * 2. Verify token signature and expiration using JWT_SECRET
 * 3. If valid, attach decoded user data to req.user
 * 4. If invalid, return 401 Unauthorized
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Check if token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Verify token signature and expiration
    const decoded = verifyAccessToken(token);

    // Attach user data to request for use in route handlers
    req.user = decoded;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          message: 'Invalid token.',
          code: 'INVALID_TOKEN',
        });
        return;
      }
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Optional Auth Middleware
 * Verifies token if present, but doesn't reject unauthenticated requests.
 * Useful for routes that behave differently for logged-in users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    // Continue regardless of auth status
    next();
  } catch {
    // Token invalid, but we don't reject - just continue without user
    next();
  }
};
