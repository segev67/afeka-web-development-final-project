/**
 * Express Authentication Server - Entry Point
 * Handles user registration, login, token refresh, and JWT validation.
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';

// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Create Express application instance
const app: Application = express();

// ===========================================
// MIDDLEWARE CONFIGURATION
// ===========================================

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * Allows requests only from authorized client origins.
 * credentials: true enables httpOnly cookie transmission across origins.
 */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * JSON Body Parser
 * Parses incoming JSON request bodies and makes them available as req.body.
 */
app.use(express.json());

/**
 * URL-Encoded Body Parser
 * Parses URL-encoded form data from HTML form submissions.
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Cookie Parser
 * Parses cookies from request headers and makes them available as req.cookies.
 * Required for reading httpOnly refresh token cookies.
 */
app.use(cookieParser());

// ===========================================
// REQUEST LOGGING MIDDLEWARE
// ===========================================

// Log all incoming requests for debugging (without sensitive data)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n${req.method} ${req.path}`);
  next();
});

// ===========================================
// DATABASE CONNECTION MIDDLEWARE (Production)
// ===========================================

// Connection state tracking
let isMongoConnected = false;

async function ensureMongoConnection() {
  if (isMongoConnected && mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('MongoDB connected');
  } catch (error: any) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

// For production (Vercel), ensure connection before each request
if (process.env.NODE_ENV === 'production') {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ensureMongoConnection();
      next();
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: error.message,
      });
    }
  });
}

// ===========================================
// ROUTES
// ===========================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'ok',
    server: 'auth-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount authentication routes at /auth prefix
app.use('/auth', authRoutes);

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================

/**
 * Global Error Handler
 * Catches all errors thrown in route handlers and provides consistent error responses.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 Handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ===========================================
// DATABASE CONNECTION & SERVER START
// ===========================================

const PORT = process.env.PORT || 4000;

// For local development only
if (process.env.NODE_ENV !== 'production') {
  mongoose
    .connect(process.env.MONGODB_URI as string)
    .then(() => {
      console.log('\n' + '='.repeat(50));
      console.log('Connected to MongoDB');
      console.log('   Database:', process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'localhost');
      console.log('='.repeat(50));

      // Start server only after DB connection is established
      app.listen(PORT, () => {
        console.log(`Auth Server Running`);
        console.log('='.repeat(50));
        console.log(`   Port:        ${PORT}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Health:      http://localhost:${PORT}/health`);
        console.log(`   API Base:    http://localhost:${PORT}/auth`);
        console.log('='.repeat(50));
        console.log('Endpoints:');
        console.log('   POST /auth/register  - Register new user');
        console.log('   POST /auth/login     - Login user');
        console.log('   POST /auth/refresh   - Refresh access token');
        console.log('   GET  /auth/verify    - Verify token');
        console.log('   POST /auth/logout    - Logout user');
        console.log('='.repeat(50));
        console.log('Security Features:');
        console.log('   bcrypt password hashing with salt');
        console.log('   JWT authentication');
        console.log('   httpOnly cookies for refresh tokens');
        console.log('   CORS protection');
        console.log('='.repeat(50) + '\n');
        console.log('Waiting for requests...\n');
      });
    })
    .catch((error) => {
      console.error('\nMongoDB connection failed:', error.message);
      process.exit(1);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Rejection:', reason.message);
});

// Export app for Vercel
export default app;
