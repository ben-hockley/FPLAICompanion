// Script to fetch FPL API data at build time and save as static JSON files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FPL_API_BASE = 'https://fantasy.premierleague.com/api';
const OUTPUT_DIR = path.join(__dirname, '../public/fpl-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// List of static endpoints to fetch (no dynamic params like player ID or manager ID)
const STATIC_ENDPOINTS = [
  'bootstrap-static',
  'fixtures',
];

async function fetchAndSave(endpoint, filename) {
  try {
    console.log(`Fetching ${endpoint}...`);
    const response = await fetch(`${FPL_API_BASE}/${endpoint}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved ${filename} (${(fs.statSync(filepath).size / 1024).toFixed(2)} KB)`);
    
    return true;
  } catch (error) {
    console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting FPL data fetch...\n');
  
  const results = await Promise.all([
    fetchAndSave('bootstrap-static', 'bootstrap-static.json'),
    fetchAndSave('fixtures', 'fixtures.json'),
  ]);
  
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log(`\nCompleted: ${successCount}/${totalCount} endpoints fetched successfully`);
  
  // Create a metadata file with timestamp
  const metadata = {
    fetchedAt: new Date().toISOString(),
    endpoints: STATIC_ENDPOINTS,
    success: successCount === totalCount
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  if (successCount < totalCount) {
    process.exit(1);
  }
}

main();
