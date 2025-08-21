// API Configuration for connecting frontend to backend

// Get the API URL from environment variable or use default
// In production (Vercel), this will use the Replit backend URL
// In development (local), this will use the local server
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build full API URLs
export function getApiUrl(endpoint: string): string {
  // If API_BASE_URL is set (production), use it
  // Otherwise, use relative URLs (development)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return endpoint;
}