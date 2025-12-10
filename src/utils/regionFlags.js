// Map of FPL region codes to ISO 3166-1 alpha-2 country codes
// Used with country-flag-icons library
export const REGION_TO_COUNTRY_CODE = {
  10: 'AR', // Argentina
  14: 'AT', // Australia
  21: 'BE', // Belgium
  30: 'BR', // Brazil
  34: 'BG', // Bulgaria
  35: 'BF', // Burkina Faso
  38: 'CM', // Cameroon
  48: 'CO', // Colombia
  50: 'CD', // Democratic Republic of the Congo
  54: 'CI', // Côte d'Ivoire
  57: 'CZ', // Czech Republic
  58: 'DK', // Denmark
  62: 'EC', // Ecuador
  63: 'EG', // Egypt
  73: 'FR', // France
  78: 'GM', // Gambia
  79: 'GE', // Georgia
  80: 'DE', // Germany
  81: 'GH', // Ghana
  83: 'GR', // Greece
  90: 'GW', // Guinea-Bissau
  92: 'HT', // Haiti
  97: "HR", // Croatia
  99: 'IS', // Iceland
  104: 'IE', // Republic of Ireland
  106: 'IT', // Italy
  108: 'JP', // Japan
  114: 'KR', // South Korea
  139: 'MX', // Mexico
  145: 'MA', // Morocco
  152: 'NL', // Netherlands
  154: 'NZ', // New Zealand
  157: 'NG', // Nigeria
  161: 'NO', // Norway
  169: 'PE', // Peru
  172: 'PL', // Poland
  173: 'PT', // Portugal
  189: 'SN', // Senegal
  190: 'RS', // Serbia
  195: 'SI', // Slovenia
  196: 'SK', // Slovakia
  200: 'ES', // Spain
  206: 'SE', // Sweden
  207: 'CH', // Switzerland
  217: 'SE', // Sweden
  218: 'TN', // Tunisia
  219: 'TR', // Turkey
  225: 'UA', // Ukraine
  229: 'US', // United States
  230: 'UY', // Uruguay
  231: 'UZ', // Uzbekistan
  239: 'ZW', // Zimbabwe
  241: 'ENG', // England
  242: 'NIR', // Northern Ireland
  243: 'SCT', // Scotland
  244: 'WLS', // Wales
};

/**
 * Get the country code for a region code
 * @param {number} regionCode - The FPL region code
 * @returns {string|null} ISO country code or null if not found
 */
export const getCountryCode = (regionCode) => {
  return REGION_TO_COUNTRY_CODE[regionCode] || null;
};
