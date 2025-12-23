/**
 * FPL API utility with fallback to static data
 * 
 * In production (GitHub Pages), attempts to fetch from live FPL API.
 * If that fails (CORS/404), falls back to pre-fetched static data.
 */

const FPL_API_BASE = 'https://fantasy.premierleague.com/api';
// Use Vite's BASE_URL to handle subdirectory deployments (e.g., /FPLAICompanion/)
const STATIC_DATA_BASE = `${import.meta.env.BASE_URL}fpl-data`;

// Track if we've already determined that live API doesn't work
let useFallback = false;

/**
 * Fetch from FPL API with automatic fallback to static data
 * @param {string} endpoint - API endpoint (e.g., 'bootstrap-static', 'fixtures')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - JSON response data
 */
export async function fetchFPL(endpoint, options = {}) {
  // In development, use Vite proxy (no fallback needed)
  if (import.meta.env.DEV) {
    const response = await fetch(`/api/${endpoint}/`, options);
    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`);
    }
    return response.json();
  }

  // In production, try live API first (unless we know it doesn't work)
  if (!useFallback) {
    try {
      const response = await fetch(`${FPL_API_BASE}/${endpoint}/`, {
        ...options,
        // Add timeout to fail fast if CORS is blocking
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return response.json();
      }
      
      // If we get a response but it's not OK, fall back
      console.warn(`Live FPL API returned ${response.status}, falling back to static data`);
      useFallback = true;
    } catch (error) {
      console.warn('Live FPL API failed (likely CORS), falling back to static data:', error.message);
      useFallback = true;
    }
  }

  // Fallback: Use static data
  return fetchStaticData(endpoint);
}

/**
 * Fetch from static pre-built data
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - JSON response data
 */
async function fetchStaticData(endpoint) {
  // Map endpoint to static file
  const staticFile = getStaticFilePath(endpoint);
  
  try {
    const response = await fetch(staticFile);
    
    if (!response.ok) {
      throw new Error(`Static data file not found: ${staticFile}`);
    }
    
    const data = await response.json();
    console.log(`✓ Using static data for: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`Failed to load static data for ${endpoint}:`, error);
    throw new Error(`Both live API and static data failed for: ${endpoint}`);
  }
}

/**
 * Map API endpoint to static file path
 * @param {string} endpoint - API endpoint
 * @returns {string} - Path to static JSON file
 */
function getStaticFilePath(endpoint) {
  // Remove leading/trailing slashes and query params
  const cleanEndpoint = endpoint.replace(/^\/|\/$/g, '').split('?')[0];
  
  // Map common endpoints to their static files
  const endpointMap = {
    'bootstrap-static': 'bootstrap-static.json',
    'fixtures': 'fixtures.json',
  };
  
  const filename = endpointMap[cleanEndpoint] || `${cleanEndpoint}.json`;
  return `${STATIC_DATA_BASE}/${filename}`;
}

/**
 * For dynamic endpoints (player details, manager data, etc.)
 * These can't be pre-fetched, so we only try the live API
 * @param {string} endpoint - Full API path (e.g., 'element-summary/123')
 * @returns {Promise<any>} - JSON response data
 */
export async function fetchFPLDynamic(endpoint) {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    const response = await fetch(`/api/${endpoint}/`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`);
    }
    return response.json();
  }

  // In production, try live API
  try {
    const response = await fetch(`${FPL_API_BASE}/${endpoint}/`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`FPL API returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch dynamic endpoint ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Force using static data (useful for testing)
 */
export function forceStaticData() {
  useFallback = true;
}

/**
 * Reset to try live API first
 */
export function resetFallback() {
  useFallback = false;
}
