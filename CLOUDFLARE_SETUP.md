# Cloudflare Workers Setup for FPL API

This document explains how to configure the Cloudflare Workers proxy for GitHub Pages deployment.

## Overview

The FPL Genie application needs to fetch data from the Fantasy Premier League API (`fantasy.premierleague.com`). While local development uses Vite's proxy feature, GitHub Pages is a static hosting service that cannot proxy API requests. To solve this, we use Cloudflare Workers as a proxy/cache layer.

## Architecture

- **Local Development**: Uses Vite's dev proxy (`/api` → `https://fantasy.premierleague.com`)
- **GitHub Pages Production**: Uses Cloudflare Workers (`VITE_CLOUDFLARE_WORKER_URL`)

## Setting up Cloudflare Workers

### 1. Create a Cloudflare Account

If you don't have one already, sign up for a free Cloudflare account at https://dash.cloudflare.com/sign-up

### 2. Create a Worker

1. Navigate to the Workers & Pages section in your Cloudflare dashboard
2. Click "Create Application" → "Create Worker"
3. Name your worker (e.g., `fpl-api-proxy`)
4. Click "Deploy"

### 3. Configure the Worker

Replace the default worker code with the following proxy implementation:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Extract the path after the worker URL
    const fplPath = url.pathname.substring(1); // Remove leading /
    
    // Construct the target FPL API URL
    const targetUrl = `https://fantasy.premierleague.com/api/${fplPath}${url.search}`;
    
    // Clone the request and update headers
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }
    
    try {
      // Fetch from FPL API
      const response = await fetch(modifiedRequest);
      
      // Clone response to modify headers
      const modifiedResponse = new Response(response.body, response);
      
      // Add CORS headers to response
      Object.keys(corsHeaders).forEach(key => {
        modifiedResponse.headers.set(key, corsHeaders[key]);
      });
      
      // Add cache control for static data
      // Note: Different endpoints may benefit from different cache durations:
      // - bootstrap-static: 300-600s (updates infrequently)
      // - fixtures: 60-300s (updates moderately)
      // - event/X/live: 10-30s (updates frequently during matches)
      modifiedResponse.headers.set('Cache-Control', 'public, max-age=300');
      
      return modifiedResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch FPL data' }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
```

### 4. Deploy the Worker

1. Click "Save and Deploy"
2. Copy your worker URL (e.g., `https://fpl-api-proxy.YOUR-USERNAME.workers.dev`)

### 5. Configure GitHub Secrets

Add the Cloudflare Worker URL as a GitHub secret:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VITE_CLOUDFLARE_WORKER_URL`
5. Value: Your worker URL (e.g., `https://fpl-api-proxy.YOUR-USERNAME.workers.dev`)
6. Click "Add secret"

## Testing Your Setup

### Test the Worker

You can test your worker by visiting:
```
https://your-worker-url.workers.dev/bootstrap-static/
```

This should return FPL data (similar to `https://fantasy.premierleague.com/api/bootstrap-static/`)

### Test the Deployment

1. Push changes to your `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. The deployed app will use the Cloudflare Worker to fetch FPL data

## Cloudflare Workers Free Tier

The free tier includes:
- 100,000 requests per day
- 10ms CPU time per request
- More than sufficient for personal use and small to medium-sized user bases

## Troubleshooting

### Worker Returns 502 Error

- Check that your worker code is correct
- Verify the FPL API is accessible (`https://fantasy.premierleague.com/api/bootstrap-static/`)
- Check Cloudflare Workers logs in your dashboard

### CORS Errors

- Ensure your worker includes the CORS headers shown above
- Check browser console for specific CORS error messages

### GitHub Pages Shows Loading Forever

- Verify the `VITE_CLOUDFLARE_WORKER_URL` secret is set correctly
- Check browser console for network errors
- Verify the worker URL is accessible

## Alternative: Self-Hosted Proxy

If you prefer not to use Cloudflare Workers, you can:
1. Set up your own proxy server (Node.js, Python, etc.)
2. Deploy it to a service like Heroku, Railway, or Render
3. Use that URL instead of the Cloudflare Worker URL

## Security Notes

- The FPL API is public and doesn't require authentication
- The worker acts as a simple proxy/cache layer
- No sensitive data is transmitted or stored
- CORS headers allow requests from any origin (appropriate for a public API proxy)
