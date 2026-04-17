/**
 * Root Layout - Next.js App Router
 * Wraps all pages in the application with shared UI components.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Navbar from "@/components/Navbar";

// ===========================================
// FONT CONFIGURATION
// ===========================================

/**
 * Font Loading with next/font
 * next/font automatically optimizes fonts and serves them from your own domain.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ===========================================
// METADATA
// ===========================================

/**
 * Page Metadata
 * Automatically generates page title and meta tags for SEO.
 */
export const metadata: Metadata = {
  title: {
    default: "Afeka Trips Route 2026",
    template: "%s | Afeka Trips Route 2026",
  },
  description: "Plan your hiking and cycling adventures with AI-powered route suggestions",
  keywords: ["hiking", "cycling", "trails", "route planning", "outdoor", "adventure", "AI"],
};

// ===========================================
// ROOT LAYOUT COMPONENT
// ===========================================

/**
 * RootLayout Component
 * Provides the root HTML structure and persists the Navbar across all pages.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* Navigation Bar - Persists across all pages */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              © 2026 Afeka Hiking Trails. Web Development Course Project.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
