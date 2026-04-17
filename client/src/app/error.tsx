'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something Went Wrong
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="btn btn-primary flex-1"
            >
              Try Again
            </button>
            <a
              href="/"
              className="btn btn-secondary flex-1"
            >
              Go Home
            </a>
          </div>

          {/* Debug Info (development only) */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-left">
              <p className="text-xs text-gray-500 font-mono">
                Error Digest: {error.digest}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
