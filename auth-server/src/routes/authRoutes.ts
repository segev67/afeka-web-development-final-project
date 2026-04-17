/**
 * Authentication Routes
 * Defines API endpoints for user registration, login, token refresh, verification, and logout.
 */

import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  verifyToken,
  logout,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

// Create Express Router instance
const router = Router();

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get tokens
 * @access  Public
 * Refresh token is set in httpOnly cookie
 */
router.post('/login', login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token cookie
 * @access  Public (but requires valid refresh token cookie)
 *
 * Implements silent refresh mechanism - automatically issues new access token
 * when the current one expires.
 */
router.post('/refresh', refreshToken);

// ===========================================
// PROTECTED ROUTES (Authentication required)
// ===========================================

/**
 * @route   GET /auth/verify
 * @desc    Verify if access token is valid
 * @access  Protected
 */
router.get('/verify', protect, verifyToken);

/**
 * @route   POST /auth/logout
 * @desc    Logout user (clear refresh token cookie)
 * @access  Public
 */
router.post('/logout', logout);

// ===========================================
// EXPORT ROUTER
// ===========================================

export default router;
