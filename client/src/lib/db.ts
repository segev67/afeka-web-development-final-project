import mongoose, { Mongoose } from 'mongoose';

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global type declaration for cached mongoose connection
 */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

// Initialize cached connection object
let cached = global.mongoose;

// Store on global for persistence across hot reloads
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

/**
 * Connect to MongoDB
 *
 * Connection caching for serverless environment.
 *
 * @returns Promise resolving to mongoose connection
 */
async function dbConnect(): Promise<Mongoose> {
  // Validate MongoDB URI exists
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // Return existing connection if available
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  // Create new connection if no promise exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Creating new MongoDB connection...');

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      return mongooseInstance;
    });
  }

  try {
    // Await the connection promise
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on error so next call can retry
    cached.promise = null;
    throw error;
  }

  return cached.conn!;
}

export default dbConnect;
