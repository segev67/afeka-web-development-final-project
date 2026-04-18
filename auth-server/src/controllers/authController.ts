/**
 * Authentication Controller
 * Contains business logic for user registration, login, token refresh, verification, and logout.
 */

import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
  getRefreshTokenCookieOptions,
} from '../utils/tokenUtils';

// ===========================================
// REGISTER CONTROLLER
// ===========================================

/**
 * Register New User
 *
 * Flow:
 * 1. Validate input (username, email, password)
 * 2. Check if email already exists
 * 3. Create new user (password auto-hashed by pre-save hook)
 * 4. Generate tokens
 * 5. Set refresh token in httpOnly cookie
 * 6. Return access token in response
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  console.log('\n[REGISTER] Request received');

  try {
    const { username, email, password } = req.body;

    console.log('[REGISTER] Attempting registration...');
    console.log(`   Username: ${username}`);

    // Validate required fields
    if (!username || !email || !password) {
      console.log('[REGISTER] Validation failed: Missing required fields');
      res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
      return;
    }

    // Check if user already exists
    console.log('[REGISTER] Checking if user exists...');
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log(`[REGISTER] User already exists (email hidden for security)`);
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user with bcrypt-hashed password
    console.log('[REGISTER] Creating user with hashed password...');
    const user = await User.create({
      username,
      email,
      password,
    });
    console.log(`[REGISTER] User created with ID: ${user._id}`);

    // Generate JWT tokens
    console.log('[REGISTER] Generating JWT tokens...');
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    console.log('[REGISTER] Tokens generated');

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
    console.log('[REGISTER] Refresh token set in httpOnly cookie');

    // Return success response with access token
    const duration = Date.now() - startTime;
    console.log(`[REGISTER] Registration successful for ${username} (${duration}ms)`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[REGISTER] Registration error (${duration}ms):`, error);

    // Handle Mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
};

// ===========================================
// LOGIN CONTROLLER
// ===========================================

/**
 * Login User
 *
 * Flow:
 * 1. Validate input (email, password)
 * 2. Find user by email
 * 3. Compare password using bcrypt
 * 4. Generate tokens
 * 5. Set refresh token in httpOnly cookie
 * 6. Return access token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { email, password } = req.body;

    console.log('[LOGIN] Attempting login...');

    // Validate required fields
    if (!email || !password) {
      console.log('[LOGIN] Validation failed: Missing credentials');
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Find user by email
    console.log('[LOGIN] Searching for user in database...');
    const user = await User.findOne({ email: email.toLowerCase() });

    // Generic error message prevents user enumeration
    if (!user) {
      console.log(`[LOGIN] User not found (email hidden for security)`);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    console.log(`[LOGIN] User found: ${user.username}`);

    // Compare password using bcrypt
    console.log('[LOGIN] Verifying password...');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Invalid password (user hidden for security)`);
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    console.log('[LOGIN] Password verified');

    // Generate tokens
    console.log('[LOGIN] Generating JWT tokens...');
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    console.log('[LOGIN] Tokens generated');

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
    console.log('[LOGIN] Refresh token set in httpOnly cookie');

    // Return success response
    const duration = Date.now() - startTime;
    console.log(`[LOGIN] Login successful for ${user.username} (${duration}ms)`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        accessToken,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[LOGIN] Login error (${duration}ms):`, error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

// ===========================================
// REFRESH TOKEN CONTROLLER
// ===========================================

/**
 * Refresh Access Token (Silent Refresh)
 *
 * Automatically issues a new access token when the current one expires.
 * Uses the refresh token stored in httpOnly cookie.
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    console.log('[REFRESH] Token refresh requested...');

    // Get refresh token from cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      console.log('[REFRESH] No refresh token found in cookies');
      res.status(401).json({
        success: false,
        message: 'Refresh token not found',
        code: 'NO_REFRESH_TOKEN',
      });
      return;
    }

    // Verify refresh token
    console.log('[REFRESH] Verifying refresh token...');
    const decoded = verifyRefreshToken(token);
    console.log(`[REFRESH] Token valid for user: ${decoded.username}`);

    // Verify user still exists in database
    console.log('[REFRESH] Checking if user still exists...');
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log(`[REFRESH] User not found: ${decoded.userId}`);
      res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    console.log(`[REFRESH] User verified: ${user.username}`);

    // Generate new tokens
    console.log('[REFRESH] Generating new tokens...');
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());
    console.log('[REFRESH] New tokens generated');
    console.log('[REFRESH] New refresh token set');

    // Return new access token
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[REFRESH] Silent refresh successful for ${user.username} (${duration}ms)`);
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[REFRESH] Token refresh error (${duration}ms):`, error);

    res.clearCookie('refreshToken');
    console.log('[REFRESH] Invalid token cleared from cookies');

    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
};

// ===========================================
// VERIFY TOKEN CONTROLLER
// ===========================================

/**
 * Verify Access Token
 * Used to check if an access token is still valid.
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[VERIFY] Token verified for user: ${req.user?.username}`);
  }

  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
    },
  });
};

// ===========================================
// LOGOUT CONTROLLER
// ===========================================

/**
 * Logout User
 * Clears the refresh token cookie.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  console.log('[LOGOUT] User logging out...');

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/',
  });

  console.log('[LOGOUT] Refresh token cleared');
  console.log('[LOGOUT] Logout successful');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
