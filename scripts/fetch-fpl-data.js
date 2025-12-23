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
    
    return data;
  } catch (error) {
    console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
    return false;
  }
}

async function fetchPlayerSummaries(players) {
  // Filter out unavailable players (status 'u')
  const availablePlayers = players.filter(p => p.status !== 'u');
  
  console.log(`\nFetching player summaries for ${availablePlayers.length} available players (excluded ${players.length - availablePlayers.length} unavailable)...`);
  
  const summaryDir = path.join(OUTPUT_DIR, 'element-summary');
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }
  
  // Rate limit: 50 requests per second = 20ms between requests
  const DELAY_MS = 20;
  const BATCH_SIZE = 10; // Process 10 at a time for progress updates
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < availablePlayers.length; i += BATCH_SIZE) {
    const batch = availablePlayers.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(
      batch.map(async (player) => {
        try {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          
          const response = await fetch(`${FPL_API_BASE}/element-summary/${player.id}/`);
          if (!response.ok) {
            console.warn(`Failed to fetch player ${player.id} (${player.web_name}): ${response.status}`);
            return false;
          }
          
          const data = await response.json();
          const filepath = path.join(summaryDir, `${player.id}.json`);
          fs.writeFileSync(filepath, JSON.stringify(data));
          
          return true;
        } catch (err) {
          console.warn(`Error fetching player ${player.id}: ${err.message}`);
          return false;
        }
      })
    );
    
    const batchSuccess = results.filter(Boolean).length;
    successCount += batchSuccess;
    failCount += results.length - batchSuccess;
    
    process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, availablePlayers.length)}/${availablePlayers.length} players (${successCount} success, ${failCount} failed)`);
  }
  
  console.log(`\n✓ Completed: ${successCount}/${availablePlayers.length} player summaries fetched`);
  return successCount;
}

async function main() {
  console.log('Starting FPL data fetch...\n');
  
  // Fetch bootstrap-static first to get player list
  const bootstrapData = await fetchAndSave('bootstrap-static', 'bootstrap-static.json');
  const fixturesResult = await fetchAndSave('fixtures', 'fixtures.json');
  
  const results = [bootstrapData, fixturesResult].filter(Boolean);
  const successCount = results.length;
  const totalCount = 2;
  
  console.log(`\nCompleted: ${successCount}/${totalCount} main endpoints fetched successfully`);
  
  // Fetch player summaries if bootstrap data was successful
  let playerSummariesCount = 0;
  if (bootstrapData && bootstrapData.elements) {
    playerSummariesCount = await fetchPlayerSummaries(bootstrapData.elements);
  }
  
  // Create a metadata file with timestamp
  const metadata = {
    fetchedAt: new Date().toISOString(),
    endpoints: STATIC_ENDPOINTS,
    success: successCount === totalCount,
    playerSummaries: playerSummariesCount
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
