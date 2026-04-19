# Afeka Trips Route 2026

**Final Project - Web Platform Development - Semester A 2026**

A comprehensive web application for planning hiking and cycling routes using AI-powered recommendations, real-time weather forecasts, and interactive maps with realistic routing.

---

## Project Team

- **Course**: Web Platform Development
- **Semester**: A, 2026

---

## Live Deployment

- **Application URL**: https://project-hiking.vercel.app

---

## Table of Contents

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

## Project Overview

Afeka Trips Route 2026 is a full-stack web application that enables users to plan personalized hiking and cycling routes using artificial intelligence. The system generates realistic routes based on user preferences, displays them on interactive maps with actual road/trail paths, and provides real-time weather forecasts for upcoming trips.

### Core Functionality

1. **AI-Powered Route Planning**: Generate custom routes using Google Gemini AI
2. **Realistic Path Rendering**: Routes follow actual roads/trails using the OSRM routing engine and Leaflet.js
3. **Weather Integration**: 3-day forecasts from OpenWeatherMap API
4. **Route Management**: Save and retrieve routes with personalized notes from MongoDB
5. **Secure Authentication**: JWT-based authentication with silent token refresh

---

## Architecture

The application follows a **two-server architecture**:

### Server 1: Express.js Authentication Server (Port 4000)

**Purpose**: User authentication, authorization, and JWT token management.

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
- httpOnly cookies with sameSite protection (CSRF prevention)

**Technologies**:
- Node.js + Express 5
- MongoDB + Mongoose (user data storage)
- bcrypt (password hashing)
- jsonwebtoken (JWT generation and verification)
- cookie-parser (httpOnly cookie management)
- CORS (cross-origin resource sharing)

### Server 2: Next.js Application Server (Port 3000)

**Purpose**: Main application interface and business logic.

**Responsibilities**:
- User interface (React components with TypeScript)
- Server Actions for authentication (login, register, token management)
- Route planning with AI integration (Google Gemini)
- Interactive map visualization (Leaflet.js + OSRM)
- Route storage and retrieval (MongoDB)
- Weather API integration (OpenWeatherMap)
- Authentication proxy (JWT validation and silent refresh via `proxy.ts` — the Next.js 16 replacement for `middleware.ts`)
- Image generation with fallback cascade (Unsplash → Pollinations → Picsum)

**Technologies**:
- Next.js 16 (App Router, Edge Runtime, `proxy.ts`)
- React 19
- TypeScript
- Tailwind CSS (styling)
- Leaflet.js + Leaflet Routing Machine (maps)
- OSRM public demo service (realistic routing)

### Database: MongoDB

**Purpose**: Persistent data storage.

**Collections**:
- `users`: User accounts (username, email, hashed passwords) — managed by the auth server
- `routes`: Saved hiking/cycling routes with full details, weather data, and user notes — managed by the Next.js server

---

## Technologies Used

### Backend
- **Express 5** - Authentication server
- **Node.js** - Runtime environment
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **bcrypt** - Password hashing with salt
- **jsonwebtoken** - JWT implementation
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 16** - React framework with App Router (`proxy.ts` instead of `middleware.ts`)
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### APIs & Services
- **Google Gemini AI** (`gemini-3.1-flash-lite-preview`) - Route generation with natural language processing
- **Leaflet.js** - Interactive maps with OpenStreetMap tiles
- **Leaflet Routing Machine** - Route visualization with turn-by-turn directions
- **OSRM** - Open Source Routing Machine (realistic path calculation)
- **OpenWeatherMap API** - Real-time weather forecasts (`/data/2.5/forecast` 5-day/3-hour endpoint)
- **Unsplash API** - High-quality location images (primary)
- **Pollinations.ai** - AI-generated images (fallback)
- **Picsum.photos** - Placeholder images (final fallback)

### Development Tools
- **ESLint** - Code linting
- **Git** - Version control

---

## Key Features

### 1. User Authentication & Security
- **Registration**: Secure password hashing with bcrypt (10 salt rounds)
- **Login**: JWT-based authentication with httpOnly cookies
- **Server Actions**: Next.js Server Actions handle login/register (server-side cookie setting)
- **Token Architecture**:
  - Access tokens: 15 minutes (HMAC-SHA256 with `JWT_SECRET`)
  - Refresh tokens: 7 days (HMAC-SHA256 with `JWT_REFRESH_SECRET`)
  - Separate secrets for defense in depth
- **Silent Token Refresh**: Automatic token renewal via the Next.js 16 `proxy.ts` (single refresh interceptor)
- **Token Rotation**: New refresh token issued on each refresh
- **Secure Cookies**:
  - httpOnly (JavaScript cannot access - XSS protection)
  - `sameSite=none` in production (cross-domain support for Vercel)
  - `secure` in production (HTTPS only)
- **Client-side JWT Decoding**: `proxy.ts` decodes tokens (no signature verification on the client)
- **Server-side JWT Verification**: Auth server fully verifies signatures with secrets

### 2. AI-Powered Route Planning
- **Input Parameters**:
  - Location (Country/Region/City)
  - Trip type (Hiking/Cycling)
  - Duration (1-30 days)
  - Optional user notes (custom preferences injected into AI prompt)

- **AI Generation**:
  - Routes generated by Google Gemini AI (`gemini-3.1-flash-lite-preview`)
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
- **OSRM Routing**: Uses Open Source Routing Machine (`https://router.project-osrm.org/route/v1`)
- **Route Profiles**:
  - `bike` profile for cycling routes
  - `foot` profile for hiking trails
- **Numbered Waypoints**: Visual markers for major landmarks
- **Zoom to Day**: Click a daily route to zoom to the specific segment

### 4. Weather Forecasting
- **3-Day Forecast**: Three upcoming days from OpenWeatherMap's 5-day/3-hour endpoint (midday sample preferred)
- **Per-Route Weather**: Forecast for the route starting point
- **Detailed Information**:
  - Temperature (current, high, low)
  - Weather conditions
  - Humidity
  - Wind speed
- **Shown only after route approval** (per spec — the approval page itself does not show weather)

### 5. Route Management
- **Save Routes**: Store generated routes in MongoDB with auto-generated titles
- **Route History**: View all previously saved routes with filter options
- **Filtering**: Filter by trip type (all/trek/bicycle) and sort by various criteria
- **Route Details**: Full route information with fresh weather data on each view
- **Interactive Cards**: Click to view detailed route information with maps

### 6. AI-Generated Images with Smart Fallback
- **Primary Source**: Unsplash API for high-quality, location-specific photographs
- **AI Fallback**: Pollinations.ai for AI-generated images if Unsplash fails
- **Final Fallback**: Picsum.photos for deterministic placeholder images
- **Deterministic**: Same location → same image (consistent experience)
- **Location-Specific**: Images characteristic of the country/region

---

## Installation Guide

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **API Keys** (see Environment Configuration)

### Step 1: Clone the Repository

```bash
git clone [YOUR_GITHUB_URL]
cd afeka_webdevelopment_26a_final_project
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

## Environment Configuration

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
2. Sign in with a Google account
3. Click "Create API Key"
4. Copy the key to `GEMINI_API_KEY`

#### 2. OpenWeatherMap API Key (Required)
1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Go to "API keys"
4. Generate a new key
5. Copy to `OPENWEATHERMAP_API_KEY`

#### 3. Unsplash API Key (Optional, Recommended)
1. Visit https://unsplash.com/developers
2. Create a developer account
3. Create a new application
4. Copy the Access Key to `UNSPLASH_ACCESS_KEY`
5. Without this, the app falls back to Pollinations.ai and Picsum

#### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
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
2. Create a free account
3. Create a cluster (free tier available)
4. Get the connection string
5. Replace `<password>` with your database user password
6. Use the connection string in `MONGODB_URI`

---

## Running the Application

### Step 1: Start MongoDB

**If using local MongoDB:**
```bash
# macOS:
brew services start mongodb-community

# Ubuntu/Linux:
sudo systemctl start mongodb
```

**If using MongoDB Atlas:** No action needed (cloud-hosted).

### Step 2: Start the Auth Server

```bash
cd auth-server
npm run dev
```

Expected output:
```
==================================================
Connected to MongoDB
   Database: localhost
==================================================
Auth Server Running
==================================================
   Port:        4000
   Environment: development
   Health:      http://localhost:4000/health
   API Base:    http://localhost:4000/auth
==================================================
Endpoints:
   POST /auth/register  - Register new user
   POST /auth/login     - Login user
   POST /auth/refresh   - Refresh access token
   GET  /auth/verify    - Verify token
   POST /auth/logout    - Logout user
==================================================
Security Features:
   bcrypt password hashing with salt
   JWT authentication
   httpOnly cookies for refresh tokens
   CORS protection
==================================================

Waiting for requests...
```

### Step 3: Start the Next.js Client

```bash
cd client
npm run dev
```

Expected output:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
- Ready in ~2s
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### Creating a Test User

The app does not ship with seeded users. Register a new account from `/register` and then log in through `/login`.

---

## Project Structure

```
afeka_webdevelopment_26a_final_project/
│
├── auth-server/                      # Express.js Authentication Server
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.ts     # register, login, refreshToken, verifyToken, logout
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts     # `protect` middleware for Bearer JWTs
│   │   ├── models/
│   │   │   └── User.ts               # Mongoose user schema + bcrypt pre-save hook
│   │   ├── routes/
│   │   │   └── authRoutes.ts         # /auth/register | /login | /refresh | /verify | /logout
│   │   ├── utils/
│   │   │   └── tokenUtils.ts         # JWT generation + verification + cookie options
│   │   └── index.ts                  # Express entry point + inline MongoDB connection
│   ├── .env                          # Environment variables (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── client/                           # Next.js 16 Application
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── page.tsx              # Homepage (hero: "Afeka Trips Route 2026")
│   │   │   ├── layout.tsx            # Root layout + metadata
│   │   │   ├── auth/
│   │   │   │   └── actions.ts        # Auth Server Actions (login/register/logout/getCurrentUser)
│   │   │   ├── planning/
│   │   │   │   ├── page.tsx          # Route planning page
│   │   │   │   └── actions.ts        # generateRoutePlan, saveRoute
│   │   │   ├── history/
│   │   │   │   ├── page.tsx          # Routes history list + filter/sort
│   │   │   │   ├── actions.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Route detail page (fresh weather per view)
│   │   │   │       └── RouteDetailClient.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── error.tsx             # App Router error boundary
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation with getCurrentUser()
│   │   │   ├── RouteMap.tsx          # Leaflet map + leaflet-routing-machine + OSRM
│   │   │   └── ImageWithFallback.tsx # Image with 3-tier fallback
│   │   │
│   │   ├── lib/
│   │   │   ├── gemini.ts             # AI route generation + defensive JSON parsing
│   │   │   ├── weather.ts            # OpenWeatherMap /forecast integration
│   │   │   ├── images.ts             # Unsplash → Pollinations → Picsum cascade
│   │   │   ├── db.ts                 # Mongoose connection (cached on global for serverless)
│   │   │   └── models/
│   │   │       └── Route.ts          # Mongoose route schema (nested sub-schemas)
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # Shared TypeScript types
│   │   │
│   │   └── proxy.ts                  # Next.js 16 proxy (renamed from middleware.ts)
│   │
│   ├── .env.local                    # Environment variables (gitignored)
│   ├── package.json
│   ├── next.config.ts
│   └── tailwind.config.ts
│
└── README.md                         # This file
```

---

## API Documentation

### Auth Server Endpoints

All auth server responses follow the shape `{ success, message, data? }`.

#### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "accessToken": "jwt-token"
  }
}
```

**Cookies set by auth server:** `refreshToken` (httpOnly, 7 days).

#### POST `/auth/login`
Authenticate a user and receive JWT tokens.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "accessToken": "jwt-token"
  }
}
```

**Cookies set by auth server:** `refreshToken` (httpOnly, 7 days).
The `accessToken` is returned in the JSON body and is then stored as an httpOnly cookie by the Next.js Server Action (`loginAction`).

#### POST `/auth/refresh`
Refresh an access token using the refresh token cookie.

**Request:** `refreshToken` in httpOnly cookie (no body).

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

**Cookies set by auth server:** new rotated `refreshToken` (httpOnly, 7 days).

#### GET `/auth/verify`
Verify that an access token is valid. Protected — requires `Authorization: Bearer <accessToken>` header (enforced by the `protect` middleware).

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string"
    }
  }
}
```

#### POST `/auth/logout`
Logout the user and clear the refresh token cookie.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Client Server Actions

#### Authentication Actions (`client/src/app/auth/actions.ts`)

##### `loginAction(email, password)`
Login user and set httpOnly cookies (Server Action).

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

**Side effects:** sets httpOnly cookies for `accessToken` and forwards `refreshToken` from the auth server response.

##### `registerAction(username, email, password)`
Register a new user and set httpOnly cookies (Server Action). Same return shape as `loginAction`.

##### `getCurrentUser()`
Get the current authenticated user (Server Action). Reads the `accessToken` httpOnly cookie, verifies it against the auth server, and returns `User | null`.

##### `logoutAction()`
Logout the user and clear cookies (Server Action).

#### Route Planning Actions (`client/src/app/planning/actions.ts`)

##### `generateRoutePlan(formData)`
Generate a new route using AI.

**Parameters:** `location`, `tripType ∈ {trek, bicycle}`, `durationDays (1-30)`, `userNotes (optional)`.

**Returns:** `RouteGenerationResult` with routes, weather, image, and auto-generated title.

##### `saveRoute(routePlan, userId, username)`
Save a generated route to the database.

**Returns:** `{ success: boolean, routeId?: string }`.

---

## Security Implementation

### JWT Architecture

**Token Types:**
1. **Access Token** (15 minutes)
   - Used for API authentication
   - Signed with `JWT_SECRET` using HMAC-SHA256
   - Stored in httpOnly cookie (set by the Next.js Server Action)
   - Short-lived for security

2. **Refresh Token** (7 days)
   - Used only to obtain new access tokens
   - Signed with `JWT_REFRESH_SECRET` (separate secret for defense in depth)
   - Stored in httpOnly cookie (set by the auth server)
   - Rotated on each use (one-time use tokens)

### JWT Structure

```
HEADER.PAYLOAD.SIGNATURE

Header:    {"alg":"HS256","typ":"JWT"}          (Base64 encoded)
Payload:   {"userId":"...","username":"...","email":"...","iat":...,"exp":...}
Signature: HMACSHA256(header + "." + payload, SECRET)
```

JWTs are **signed, not encrypted**. Anyone can decode and read the payload (it is Base64), but only a party with the secret can produce a valid signature.

### Authentication Flow

**Login Flow:**
1. User submits credentials on the login page.
2. `loginAction()` Server Action calls the auth server `/auth/login`.
3. Auth server validates the password with bcrypt.
4. Auth server generates `accessToken` + `refreshToken`.
5. Auth server sets `refreshToken` as an httpOnly cookie and returns `accessToken` in the JSON body.
6. `loginAction()` forwards the `refreshToken` cookie into the browser response and sets `accessToken` as its own httpOnly cookie.
7. User is redirected to the homepage.

**Protected Route Access:**
1. User navigates to a protected route (e.g., `/planning`).
2. `proxy.ts` (Next.js 16 edge proxy) intercepts the request.
3. Proxy reads `accessToken` from the httpOnly cookie (server-side).
4. Proxy decodes the token and checks the expiration.
5. If valid → allow access. If expired → trigger silent refresh (below).

**Silent Refresh** (automatic, every ~15 minutes):
1. Access token expires.
2. `proxy.ts` detects expiration.
3. Proxy calls auth server `/auth/refresh` with the `refreshToken` cookie.
4. Auth server verifies the refresh token signature server-side.
5. Auth server generates a new `accessToken` + rotated `refreshToken`.
6. Proxy sets the new `accessToken` cookie on the response and forwards the rotated `refreshToken`.
7. User continues seamlessly.

**User State in Navbar:**
1. Navbar calls `getCurrentUser()` Server Action.
2. Server Action reads `accessToken` from the httpOnly cookie.
3. Server Action calls auth server `/auth/verify`.
4. Returns user info or null.
5. Navbar displays the username or a login button.

### Single Refresh Interceptor Pattern

All token refresh logic is centralized in **one** place — `proxy.ts`.

- Proxy: handles all token refresh.
- Server Actions: only validate tokens, never refresh.
- Clean separation of concerns.

### Why Two Different Secrets?

**Defense in depth:**
- If `JWT_SECRET` is compromised → attacker can forge access tokens.
- The attacker still cannot forge refresh tokens (they need `JWT_REFRESH_SECRET`).
- Limits the blast radius of a secret compromise.
- Access tokens rotate every 15 minutes; refresh tokens every 7 days.

### Security Best Practices Implemented

- Password hashing with bcrypt (10 salt rounds)
- httpOnly cookies (JavaScript cannot access tokens — XSS protection)
- `sameSite=none` cookies in production with `secure` flag (cross-domain + CSRF protection)
- Secure cookies (HTTPS only in production)
- Token rotation — new refresh token on each refresh
- Short-lived access tokens (15 minutes)
- Separate signing secrets for access and refresh tokens
- Client-side decoding only in `proxy.ts` — no signature verification on the client
- Server-side full JWT signature verification on the auth server
- Cookie management inside Server Actions so cookies can be set httpOnly
- Single refresh interceptor in `proxy.ts`
- Optimistic Navbar to prevent jitter during token expiration

---

## Known Issues

### 1. Very Long Trips (Multi-Day Routes)
- For trips of ~10+ days, the Gemini response may become too long and get truncated before completing the JSON.
- The system attempts to repair truncated JSON and removes incomplete days.
- As a result, users may receive fewer days than requested (e.g., 10–11 instead of 12).
- A more compact prompt is used for long trips, but the exact day count cannot be guaranteed.
- **Mitigation:** users can retry generation or choose a shorter trip duration.

### 2. Images (Country / Route Photos)
- **Primary option (optional):** Unsplash provides real photographs but requires `UNSPLASH_ACCESS_KEY`.
- **Fallback:** Pollinations generates AI-based images that may look generic or not match the location precisely.
- If image loading fails, the UI falls back to Picsum — random placeholders that are not location-specific.
- **Mitigation:** configure an Unsplash API key for accurate, realistic images.

### 3. Non-Deterministic LLM Output (Route Validation)
- Gemini is non-deterministic — even with `responseMimeType: 'application/json'` and an explicit schema in the prompt, it occasionally omits a required field on a landmark (most commonly the `name` field on a `majorLandmarks` entry), which then fails the client-side validation in `validateRouteData()` (`client/src/lib/gemini.ts`).
- Symptom: the user sees a "Failed to generate a valid route…" message and the Vercel logs show `Route N: Landmark missing name`.
- **Mitigation:** `generateRoutePlan()` (`client/src/app/planning/actions.ts`) retries generation up to 3 times on validation failure before surfacing an error. In practice this resolves the issue silently on the second attempt; the user-visible error only appears if all 3 attempts fail in a row.
- Lowering `temperature` or adding function-calling / strict structured-output would reduce the frequency further, but the underlying non-determinism is a property of the LLM, not the code.

---

## License

This project is submitted as coursework for Web Platform Development, Afeka College of Engineering, 2026.
