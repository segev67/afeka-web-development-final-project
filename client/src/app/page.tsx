/**
 * Homepage - Route Planner
 * Main landing page of the application.
 */

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ===========================================
          HERO SECTION
          =========================================== */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-32 px-4 overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Mountain Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L25,60 L50,80 L75,40 L100,70 L100,100 Z" fill="currentColor" />
            <path d="M0,100 L20,70 L40,85 L60,50 L80,75 L100,85 L100,100 Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium">AI-Powered Route Planning</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-white">
              Route Planner
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-emerald-50 leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
            Discover your perfect hiking or cycling adventure with <span className="font-semibold text-white">AI-powered route suggestions</span>, real-time weather forecasts, and interactive maps.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{animationDelay: '0.3s'}}>
            <Link
              href="/planning"
              className="group relative btn bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-4 shadow-2xl font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Planning
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/register"
              className="btn bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-emerald-700 text-lg px-8 py-4 shadow-xl font-semibold rounded-xl transition-all duration-300"
            >
              Create Free Account
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-1">AI</div>
              <div className="text-sm text-emerald-100">Powered Routes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-1">Live</div>
              <div className="text-sm text-emerald-100">Weather Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-1">100%</div>
              <div className="text-sm text-emerald-100">Real Paths</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================
          FEATURES SECTION
          =========================================== */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              Everything You Need for Your Adventure
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Professional-grade tools powered by AI to plan the perfect outdoor experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: AI Route Planning */}
            <Link href="/planning" className="card group text-center cursor-pointer">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">AI-Powered Routes</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Get personalized hiking and cycling routes generated by advanced AI,
                tailored to your preferences and skill level.
              </p>
              <div className="mt-6 inline-flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                Try it now
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Feature 2: Interactive Maps */}
            <Link href="/planning" className="card group text-center cursor-pointer">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Interactive Maps</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Visualize your routes on beautiful, interactive maps with detailed
                waypoints and realistic path rendering.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Try it now
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Feature 3: Weather Forecast */}
            <Link href="/planning" className="card group text-center cursor-pointer">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Weather Forecasts</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Real-time weather data for your route locations, helping you plan
                the perfect time for your adventure.
              </p>
              <div className="mt-6 inline-flex items-center text-amber-600 font-semibold group-hover:translate-x-2 transition-transform">
                Try it now
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================
          HOW IT WORKS SECTION
          =========================================== */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Choose Location</h3>
              <p className="text-gray-600 text-sm">
                Enter your desired country, region, or city
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Select Trip Type</h3>
              <p className="text-gray-600 text-sm">
                Choose between hiking (trek) or cycling
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Set Duration</h3>
              <p className="text-gray-600 text-sm">
                Specify how many days your trip will be
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Get Your Route</h3>
              <p className="text-gray-600 text-sm">
                Review, approve, and save your personalized route
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/planning"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Plan Your Route Now
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================
          TRIP TYPES SECTION
          =========================================== */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Adventure
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hiking Card */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Hiking (Trek)</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Distance: 5-10 km per day</li>
                    <li>• 1-3 circular routes</li>
                    <li>• Start and end at the same point</li>
                    <li>• Perfect for day trips</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cycling Card */}
            <div className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="5.5" cy="17.5" r="3.5" strokeWidth={2} />
                    <circle cx="18.5" cy="17.5" r="3.5" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-3.5 4.5L8 8l-2.5 5M15 6h3m-3 0l3.5 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Cycling</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Distance: 30-70 km per day</li>
                    <li>• Continuous city-to-city routes</li>
                    <li>• Multi-day adventures</li>
                    <li>• Explore more terrain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
