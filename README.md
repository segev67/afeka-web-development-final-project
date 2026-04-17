# Route Planner

**Final Project - Web Platform Development - Semester A 2026**

A comprehensive web application for planning hiking and cycling routes using AI-powered recommendations, real-time weather forecasts, and interactive maps with realistic routing.

---

## 👥 Project Team

- **Course**: Web Platform Development
- **Semester**: A, 2026

---

## 🌐 Live Deployment

- **Application URL**: [Cloud URL - To be added]
- **GitHub Repository**: [Your GitHub URL]

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technologies Used](#technologies-used)
4. [Key Features](#key-features)
5. [Installation Guide](#installation-guide)
6. [Environment Configuration](#environment-configuration)
7. [Running the Application](#running-the-application)
8. [Project Structure](#project-structure)
9. [API Documentation](#api-documentation)
10. [Security Implementation](#security-implementation)
11. [Known Issues](#known-issues)

---

## 🎯 Project Overview

Route Planner is a full-stack web application that enables users to plan personalized hiking and cycling routes using artificial intelligence. The system generates realistic routes based on user preferences, displays them on interactive maps with actual road/trail paths, and provides real-time weather forecasts for upcoming trips.

### Core Functionality

1. **AI-Powered Route Planning**: Generate custom routes using Google Gemini AI
2. **Realistic Path Rendering**: Routes follow actual roads/trails using OSRM routing engine and Leaflet.js
3. **Weather Integration**: 3-day forecasts from OpenWeatherMap API
4. **Route Management**: Save and retrieve routes with personalized notes from MongoDB database
5. **Secure Authentication**: JWT-based authentication with silent token refresh

---

## 🏗️ Architecture

The application follows a **two-server architecture**:

### Server 1: Express.js Authentication Server (Port 4000)

**Purpose**: User authentication, authorization, and JWT token management

**Responsibilities**:
- User registration with bcrypt password hashing (salt rounds: 10)
- User login with JWT token generation
- Silent token refresh mechanism (15-minute access tokens with automatic renewal)
- Token verification and validation
- Secure httpOnly cookie management for refresh tokens

**Key Security Features**:
- HMAC-SHA256 JWT signing with separate secrets for access and refresh tokens
- Access tokens: 15 minutes (short-lived for security)
- Refresh tokens: 7 days (long-lived for convenience)
- Token rotation on refresh (one-time use refresh tokens)
- Password hashing with bcrypt (10 salt rounds)
- HttpOnly cookies with sameSite protection (CSRF prevention)

**Technologies**:
- Node.js + Express.js
- MongoDB + Mongoose (user data storage)
- bcrypt (password hashing)
- jsonwebtoken (JWT generation and verification)
- cookie-parser (HTTP-only cookie management)
- CORS (cross-origin resource sharing)

### Server 2: Next.js Application Server (Port 3000)

**Purpose**: Main application interface and business logic

**Responsibilities**:
- User interface (React components with TypeScript)
- Server Actions for authentication (login, register, token management)
- Route planning with AI integration (Google Gemini)
- Interactive map visualization (Leaflet.js + OSRM)
- Route storage and retrieval (MongoDB)
- Weather API integration (OpenWeatherMap)
- Authentication middleware (JWT validation and silent refresh via Proxy)
- Image generation with fallback cascade (Unsplash → Pollinations → Picsum)

**Technologies**:
- Next.js 15 (App Router, Edge Runtime)
- React 19
- TypeScript
- Tailwind CSS (styling)
- Leaflet.js + Leaflet Routing Machine (maps)
- OSRM plugin (realistic routing)

### Database: MongoDB

**Purpose**: Persistent data storage

**Collections**:
- `users`: User accounts (username, email, hashed passwords)
- `routes`: Saved hiking/cycling routes with full details, weather data, and user notes

---

## 💻 Technologies Used

### Backend
- **Express.js** - Authentication server
- **Node.js** - Runtime environment
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **bcrypt** - Password encryption with salt
- **jsonwebtoken** - JWT implementation
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### APIs & Services
- **Google Gemini AI** - Route generation with natural language processing
- **Leaflet.js** - Interactive maps with OpenStreetMap tiles
- **Leaflet Routing Machine** - Route visualization with turn-by-turn directions
- **OSRM** - Open Source Routing Machine (realistic path calculation)
- **OpenWeatherMap API** - Real-time weather forecasts
- **Unsplash API** - High-quality location images (primary)
- **Pollinations.ai** - AI-generated images (fallback)
- **Picsum.photos** - Placeholder images (final fallback)

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control
- **VS Code** - Development environment

---

## ✨ Key Features

### 1. User Authentication & Security
- **Registration**: Secure password hashing with bcrypt (10 salt rounds)
- **Login**: JWT-based authentication with httpOnly cookies
- **Server Actions**: Next.js Server Actions handle login/register (server-side cookie setting)
- **Token Architecture**:
  - Access tokens: 15 minutes (HMAC-SHA256 with JWT_SECRET)
  - Refresh tokens: 7 days (HMAC-SHA256 with JWT_REFRESH_SECRET)
  - Separate secrets for defense in depth
- **Silent Token Refresh**: Automatic token renewal via Proxy middleware (single refresh interceptor)
- **Token Rotation**: New refresh token issued on each refresh
- **Secure Cookies**: 
  - httpOnly (JavaScript cannot access - XSS protection)
  - sameSite=none in production (cross-domain support for Vercel)
  - secure in production (HTTPS only)
- **Client-side JWT Decoding**: Next.js Proxy middleware decodes tokens (no signature verification on client)
- **Server-side JWT Verification**: Auth server fully verifies signatures with secrets

### 2. AI-Powered Route Planning
- **Input Parameters**:
  - Location (Country/Region/City)
  - Trip type (Hiking/Cycling)
  - Duration (1-30 days)
  - Optional user notes (custom preferences injected into AI prompt)

- **AI Generation**:
  - Routes generated by Google Gemini AI (Gemini 3.1-lite-preview)
  - Real place names and landmarks
  - Narrative turn-by-turn directions
  - Distance calculations per day
  - Auto-generated route titles

- **Route Specifications**:
  - **Cycling**: 30-70 km per day, linear city-to-city routes
  - **Hiking**: 5-10 km per day, circular routes (start = end point)

### 3. Interactive Maps with Realistic Routing
- **Leaflet.js Integration**: Interactive map display
- **Realistic Paths**: Routes follow actual roads/trails (not straight lines)
- **OSRM Routing**: Uses Open Source Routing Machine
- **Route Profiles**: 
  - `bike` profile for cycling routes
  - `foot` profile for hiking trails
- **Numbered Waypoints**: Visual markers for major landmarks
- **Zoom to Day**: Click daily route to zoom to specific segment

### 4. Weather Forecasting
- **3-Day Forecast**: Next 3 days starting tomorrow
- **OpenWeatherMap API**: Real-time weather data
- **Per-Route Weather**: Forecast for route starting point
- **Detailed Information**:
  - Temperature (current, high, low)
  - Weather conditions
  - Humidity
  - Wind speed

### 5. Route Management
- **Save Routes**: Store generated routes to MongoDB with auto-generated titles
- **Route History**: View all previously saved routes with filter options
- **Filtering**: Filter by trip type (all/trek/bicycle) and sort by various criteria
- **Route Details**: Full route information with fresh weather data on each view
- **Interactive Cards**: Click to view detailed route information with maps

### 6. AI-Generated Images with Smart Fallback
- **Primary Source**: Unsplash API for high-quality, location-specific photographs
- **AI Fallback**: Pollinations.ai for AI-generated images if Unsplash fails
- **Final Fallback**: Picsum.photos for deterministic placeholder images
- **Deterministic**: Same location = same image (consistent experience)
- **Location-Specific**: Images characteristic of the country/region

---

## 📥 Installation Guide

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **API Keys** (see Environment Configuration)

### Step 1: Clone the Repository

```bash
git clone [YOUR_GITHUB_URL]
cd afeka_webdevelopment_26a_final_proj
```

### Step 2: Install Dependencies

#### Install Auth Server Dependencies
```bash
cd auth-server
npm install
```

#### Install Client Dependencies
```bash
cd ../client
npm install
```

---

## ⚙️ Environment Configuration

### Auth Server Environment Variables

Create `auth-server/.env`:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Connection
# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/hiking-auth
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hiking-auth

# JWT Configuration
# IMPORTANT: Generate strong secrets for production
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret-also-change-this

# JWT Expiration
# Access token: 15 minutes (security), Refresh token: 7 days (convenience)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

**Security Note**: Generate strong random secrets for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Client Environment Variables

Create `client/.env.local`:

```env
# Auth Server URL
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:4000

# JWT Expiration (OPTIONAL - defaults to 15m and 7d if not set)
# Only needed if you want different expiration times than the defaults
# JWT_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d

# Google Gemini AI API Key
# Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# OpenWeatherMap API Key
# Get from: https://openweathermap.org/api
OPENWEATHERMAP_API_KEY=your-openweathermap-api-key-here

# Unsplash API Key (optional, for high-quality images)
# Get from: https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=your-unsplash-key-here

# MongoDB Connection (for route storage)
MONGODB_URI=mongodb://localhost:27017/hiking-routes
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hiking-routes
```

### Obtaining API Keys

#### 1. Google Gemini API Key (Required)
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to `GEMINI_API_KEY`

#### 2. OpenWeatherMap API Key (Required)
1. Visit https://openweathermap.org/api
2. Sign up for free account
3. Go to "API keys" section
4. Generate a new key
5. Copy to `OPENWEATHERMAP_API_KEY`

#### 3. Unsplash API Key (Optional, Recommended)
1. Visit https://unsplash.com/developers
2. Create a developer account
3. Create a new application
4. Copy the Access Key to `UNSPLASH_ACCESS_KEY`
5. Note: Without this, app falls back to Pollinations.ai and Picsum

#### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS:
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Linux:
sudo apt-get install mongodb
sudo systemctl start mongodb

# Use: MONGODB_URI=mongodb://localhost:27017/hiking-auth
```

**Option B: MongoDB Atlas (Recommended)**
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free tier available)
4. Get connection string
5. Replace `<password>` with your database user password
6. Use the connection string in `MONGODB_URI`

---

## 🚀 Running the Application

### Step 1: Start MongoDB

**If using local MongoDB:**
```bash
# macOS:
brew services start mongodb-community

# Ubuntu/Linux:
sudo systemctl start mongodb
```

**If using MongoDB Atlas:** No action needed (cloud-hosted)

### Step 2: Start the Auth Server

```bash
cd auth-server
npm start
```

Expected output:
```
🚀 Auth Server Starting...
✅ MongoDB connected successfully
🔒 Auth Server running on port 4000
```

### Step 3: Start the Next.js Client

```bash
cd client
npm run dev
```

Expected output:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
- Ready in 2.3s
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Default Test User (Development Only)

For testing, you can register a new user or use these test credentials if seeded:
- Username: `testuser`
- Password: `Test123!`

---

## 📁 Project Structure

```
afeka_webdevelopment_26a_final_proj/
│
├── auth-server/                    # Express.js Authentication Server
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.ts   # Login, register, token refresh
│   │   ├── models/
│   │   │   └── User.ts             # Mongoose user schema
│   │   ├── utils/
│   │   │   └── tokenUtils.ts       # JWT generation/verification
│   │   ├── db.ts                   # MongoDB connection
│   │   └── index.ts                # Express server entry point
│   ├── .env                        # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── client/                         # Next.js Application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── auth/
│   │   │   │   └── actions.ts      # Auth Server Actions (NEW)
│   │   │   ├── planning/
│   │   │   │   ├── page.tsx        # Route planning page
│   │   │   │   └── actions.ts      # Server actions
│   │   │   ├── history/
│   │   │   │   ├── page.tsx        # Routes history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Route detail page
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx        # Register page
│   │   │   └── layout.tsx          # Root layout
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Navigation component
│   │   │   ├── RouteMap.tsx        # Leaflet map with routing
│   │   │   └── ImageWithFallback.tsx # Image with error handling
│   │   │
│   │   ├── lib/
│   │   │   ├── gemini.ts           # AI route generation
│   │   │   ├── weather.ts          # Weather API integration
│   │   │   ├── images.ts           # Image generation
│   │   │   ├── db.ts               # MongoDB connection
│   │   │   └── models/
│   │   │       └── Route.ts        # Mongoose route schema
│   │   │
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   │
│   │   └── proxy.ts                # Middleware for auth
│   │
│   ├── .env.local                  # Environment variables
│   ├── package.json
│   ├── next.config.ts
│   └── tailwind.config.ts
│
├── Documentation/                  # Project documentation
│   ├── REQUIREMENTS_CHECKLIST.md  # Requirements compliance
│   ├── ROUTING_IMPLEMENTATION.md  # Realistic routing explanation
│   ├── WEATHER_REQUIREMENT_COMPLIANCE.md
│   ├── SILENT_TOKEN_REFRESH.md    # Token refresh implementation
│   └── ...
│
└── README.md                       # This file
```

---

## 📡 API Documentation

### Auth Server Endpoints

#### POST `/auth/register`
Register a new user

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

#### POST `/auth/login`
Authenticate user and receive JWT tokens

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt-token",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

**Cookies Set:**
- `accessToken`: HTTP-only, 15-minute expiration
- `refreshToken`: HTTP-only, 7-day expiration

#### POST `/auth/refresh`
Refresh access token using refresh token

**Request:** Refresh token in HTTP-only cookie

**Response:**
```json
{
  "success": true,
  "accessToken": "new-jwt-token"
}
```

#### POST `/auth/verify`
Verify if access token is valid

**Request:** Access token in HTTP-only cookie

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "string",
    "username": "string",
    "email": "string"
  }
}
```

#### POST `/auth/logout`
Logout user and clear tokens

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Client Server Actions

#### Authentication Actions (`client/src/app/auth/actions.ts`)

##### `loginAction(email, password)`
Login user and set httpOnly cookies (Server Action)

**Parameters:**
- `email`: string
- `password`: string

**Returns:** 
```typescript
{
  success: boolean,
  message: string,
  data?: {
    user: { id, username, email },
    accessToken: string
  }
}
```

**Side Effects:** Sets httpOnly cookies for accessToken and refreshToken

##### `registerAction(username, email, password)`
Register new user and set httpOnly cookies (Server Action)

**Returns:** Same as loginAction

##### `getCurrentUser()`
Get current authenticated user (Server Action)

**Returns:** `User | null` by reading httpOnly cookies server-side

##### `logoutAction()`
Logout user and clear cookies (Server Action)

#### Route Planning Actions (`client/src/app/planning/actions.ts`)

#### `generateRoutePlan(formData)`
Generate a new route using AI

**Parameters:**
- `location`: string
- `tripType`: "trek" | "bicycle"
- `durationDays`: number (1-30)
- `userNotes`: string (optional custom preferences)

**Returns:** RouteGenerationResult with routes, weather, image, and auto-generated title

#### `saveRoute(routePlan, userId, username)`
Save a generated route to database

**Returns:** { success: boolean, routeId?: string }

---

## 🔐 Security Implementation

### JWT Architecture

**Token Types:**
1. **Access Token** (15 minutes)
   - Used for API authentication
   - Signed with `JWT_SECRET` using HMAC-SHA256
   - Stored in httpOnly cookie
   - Short-lived for security

2. **Refresh Token** (7 days)
   - Used only to obtain new access tokens
   - Signed with `JWT_REFRESH_SECRET` (separate secret for defense in depth)
   - Stored in httpOnly cookie
   - Rotated on each use (one-time use tokens)

### JWT Structure

```
HEADER.PAYLOAD.SIGNATURE

Header:  {"alg":"HS256","typ":"JWT"}         (Base64 encoded)
Payload: {"userId":"123","exp":1709483400}   (Base64 encoded)
Signature: HMACSHA256(header+payload, SECRET) (Cryptographic signature)
```

**Important**: JWTs are **SIGNED**, not encrypted. Anyone can decode and read the payload (it's Base64), but only the server with the secret can verify the signature and create valid tokens.

### Authentication Flow

**Login Flow:**
1. **User Login**:
   - User submits credentials on login page
   - `loginAction()` Server Action calls auth server
   - Auth server validates with bcrypt
   - Auth server generates access + refresh tokens
   - Auth server sets `refreshToken` as httpOnly cookie
   - `loginAction()` receives `accessToken` in response
   - `loginAction()` sets `accessToken` as httpOnly cookie
   - User redirected to homepage

2. **Protected Route Access**:
   - User navigates to protected route (e.g., /planning)
   - Next.js Proxy middleware intercepts request
   - Proxy reads `accessToken` from httpOnly cookie (server-side)
   - Proxy decodes token and checks expiration
   - If valid → Allow access
   - If expired → Trigger silent refresh (see below)

3. **Silent Refresh** (automatic, every ~15 minutes):
   - Access token expires
   - Proxy middleware detects expiration
   - Proxy calls auth server `/auth/refresh` with `refreshToken` cookie
   - Auth server **verifies** refresh token signature (server-side)
   - Auth server generates new access + refresh tokens
   - Auth server returns new tokens
   - Proxy sets new `accessToken` cookie
   - User continues seamlessly (never notices refresh)

4. **User State in Navbar**:
   - Navbar calls `getCurrentUser()` Server Action
   - Server Action reads `accessToken` from httpOnly cookie
   - Server Action calls auth server `/auth/verify`
   - Returns user info or null
   - Navbar displays username or login button

### Single Refresh Interceptor Pattern

**Best Practice:** All token refresh logic is centralized in ONE place - the Proxy middleware.

- ✅ Proxy middleware: Handles ALL token refresh
- ✅ Server Actions: Only validate tokens, never refresh
- ✅ Clean separation of concerns
- ✅ Follows industry best practices

### Why Two Different Secrets?

**Defense in Depth Strategy:**
- If `JWT_SECRET` is compromised → Attacker can forge access tokens
- BUT attacker still cannot forge refresh tokens (need `JWT_REFRESH_SECRET`)
- Limits the blast radius of a security breach
- Access tokens rotate every 15 minutes, refresh tokens every 7 days

### Security Best Practices Implemented

✅ **Password Hashing**: bcrypt with 10 salt rounds  
✅ **httpOnly Cookies**: JavaScript cannot access tokens (XSS protection)  
✅ **sameSite Cookies**: 'none' in production with secure flag (cross-domain + CSRF protection)  
✅ **Secure Cookies**: HTTPS only in production  
✅ **Token Rotation**: New refresh token on each refresh  
✅ **Short-lived Access Tokens**: 15 minutes (minimize exposure)  
✅ **Separate Secrets**: Access and refresh tokens use different signing keys  
✅ **Client-side Decoding Only**: No signature verification on client (Proxy middleware)  
✅ **Server-side Verification**: Full JWT signature verification on auth server  
✅ **Server Actions**: Cookie management happens server-side (can set httpOnly)  
✅ **Single Refresh Interceptor**: ONE place handles token refresh (Proxy middleware)  
✅ **Optimistic UI**: Navbar prevents jitter during token expiration  

---

## ⚠️ Known Issues

### 1. AI Image Loading
- **Issue**: External image APIs (Unsplash, Pollinations.ai) may load slowly or fail
- **Mitigation**: 3-tier fallback system (Unsplash → Pollinations → Picsum)
- **Impact**: Minimal - users always see an image

### 2. OSRM Routing for Remote Locations
- **Issue**: OSRM may not have complete data for very remote hiking trails
- **Mitigation**: Waypoints remain visible on map even if routing line fails; route text information is always complete
- **Impact**: Low - primarily affects visual route line

### 3. Gemini AI Response Variability
- **Issue**: AI may occasionally generate routes with incorrect day count or format
- **Mitigation**: Validation logic filters invalid responses; users can regenerate routes
- **Impact**: Low - retry mechanism handles edge cases

### 4. Weather API Rate Limits
- **Issue**: OpenWeatherMap free tier has request limits
- **Mitigation**: Fetches weather only on demand (not pre-cached)
- **Impact**: Minimal - sufficient for normal usage patterns

### 5. Map Marker Visibility
- **Issue**: Default Leaflet/Routing Machine markers may interfere with custom numbered waypoints
- **Mitigation**: CSS rules to hide unwanted markers while preserving custom ones
- **Impact**: Resolved - custom markers display correctly

---

## 📄 License

This project is submitted as coursework for Web Platform Development, Afeka College of Engineering, 2026.
