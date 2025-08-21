// API Configuration for connecting frontend to backend

// Get the API URL from environment variable or use default
// In production (Vercel), this will use the Replit backend URL
// In development (local), this will use the local server
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function to build full API URLs
export function getApiUrl(endpoint: string): string {
  // If we're on Vercel but no API URL is set, use the default Replit URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && !API_BASE_URL) {
    // Default to your Replit backend if environment variable not set
    return `https://45845d41-ab8d-495c-9b87-e1421f960f3e-00-2rkp2ou8sqwql.kirk.replit.dev${endpoint}`;
  }
  
  // If API_BASE_URL is set (production), use it
  // Otherwise, use relative URLs (development)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return endpoint;
}