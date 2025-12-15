// Map of FPL team IDs to their official websites
export const TEAM_WEBSITES = {
  1: 'https://www.arsenal.com', // Arsenal
  2: 'https://www.avfc.co.uk', // Aston Villa
  3: 'https://www.afcb.co.uk', // Burnley
  4: 'https://www.brentfordfc.com', // Bournemouth
  5: 'https://www.brightonandhovealbion.com', // Brighton
  6: 'https://www.chelseafc.com', // Chelsea
  7: 'https://www.cpfc.co.uk', // Crystal Palace
  8: 'https://www.evertonfc.com', // Everton
  9: 'https://www.fulhamfc.com', // Fulham
  10: 'https://www.fulhamfc.com', // Fulham
  11: 'https://www.leedsunited.com', // Leeds United
  12: 'https://www.liverpoolfc.com', // Liverpool
  13: 'https://www.mancity.com', // Man City
  14: 'https://www.manutd.com', // Man Utd
  15: 'https://www.nufc.co.uk', // Newcastle
  16: 'https://www.nottinghamforest.co.uk', // Notts Forest
  17: 'https://www.safc.com', // Sunderland
  18: 'https://www.tottenhamhotspur.com', // Spurs
  19: 'https://www.whufc.com', // West Ham
  20: 'https://www.wolves.co.uk' // Wolves
};

/**
 * Get the official website URL for a team
 * @param {number} teamId - The FPL team ID
 * @returns {string|null} The team's website URL or null if not found
 */
export const getTeamWebsite = (teamId) => {
  return TEAM_WEBSITES[teamId] || null;
};
