/**
 * API utility for FPL data fetching
 * 
 * In development: Uses Vite's proxy (/api -> fantasy.premierleague.com)
 * In production (GitHub Pages): Uses Cloudflare Workers endpoint
 */

/**
 * Get the base URL for API requests
 * @returns {string} The base URL for FPL API requests
 */
const getApiBaseUrl = () => {
  // In production (GitHub Pages), use Cloudflare Workers URL if provided
  const cloudflareWorkerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
  
  if (import.meta.env.PROD && cloudflareWorkerUrl) {
    return cloudflareWorkerUrl;
  }
  
  // In development, use the Vite proxy
  return '/api';
};

/**
 * Fetch data from the FPL API
 * @param {string} endpoint - The API endpoint (e.g., 'bootstrap-static/', 'fixtures/')
 * @returns {Promise<Response>} The fetch response
 */
export const fetchFPLApi = async (endpoint) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${endpoint}`;
  
  return fetch(url);
};

export default fetchFPLApi;
