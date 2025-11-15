/**
 * Trade Policy Constants - Based on Most Recent Data (2024-2025)
 * 
 * Sources:
 * - US Steel/Aluminum Tariffs: 50% ad valorem (June 2025)
 * - Anti-dumping and countervailing duties vary by country
 * - IRA (Inflation Reduction Act) tax credits
 * - Section 45Q carbon capture credits: $35-50/ton
 * - California cap-and-trade carbon pricing
 */

export interface TradePolicy {
  country: 'US' | 'China' | 'India';
  tariffRate: number; // percentage (0-100)
  antiDumpingDuty: number; // percentage (0-100)
  countervailingDuty: number; // percentage (0-100)
  domesticTaxCredits: number; // USD per ton
  greenSteelSubsidies: number; // USD per ton
}

/**
 * Trade Policy Data - Updated with 2024-2025 rates
 * 
 * US: 
 * - No tariffs (domestic)
 * - IRA tax credits: ~$20-30/ton for domestic production
 * - Section 45Q credits available for green steel: $35-50/ton CO2 captured
 * - California carbon pricing: ~$30-40/ton CO2 (if applicable)
 * 
 * China:
 * - Section 232 tariff: 50% (June 2025)
 * - Anti-dumping: 10-25% (varies by product)
 * - Countervailing: 5-15% (varies by product)
 * - No domestic credits (foreign supplier)
 * 
 * India:
 * - Section 232 tariff: 50% (June 2025)
 * - Anti-dumping: 0-5% (lower than China)
 * - Countervailing: 2-5% (lower than China)
 * - Some green steel incentives: ~$10-20/ton
 */
export const TRADE_POLICY: Record<string, TradePolicy> = {
  US: {
    country: 'US',
    tariffRate: 0, // No tariffs on domestic steel
    antiDumpingDuty: 0, // No anti-dumping on domestic
    countervailingDuty: 0, // No CVD on domestic
    domesticTaxCredits: 25, // IRA and Buy America provisions (~$20-30/ton)
    greenSteelSubsidies: 40, // Section 45Q + IRA green steel incentives (~$35-50/ton CO2)
  },
  China: {
    country: 'China',
    tariffRate: 50, // Section 232 tariff (June 2025)
    antiDumpingDuty: 15, // Average anti-dumping duty (10-25% range)
    countervailingDuty: 10, // Average countervailing duty (5-15% range)
    domesticTaxCredits: 0, // No US tax credits for foreign suppliers
    greenSteelSubsidies: 0, // No US subsidies for foreign suppliers
  },
  India: {
    country: 'India',
    tariffRate: 50, // Section 232 tariff (June 2025)
    antiDumpingDuty: 2, // Lower anti-dumping (0-5% range)
    countervailingDuty: 3, // Lower countervailing duty (2-5% range)
    domesticTaxCredits: 0, // No US tax credits for foreign suppliers
    greenSteelSubsidies: 15, // Some green steel incentives from origin country (~$10-20/ton)
  },
};

/**
 * Get default trade policy for a country
 */
export function getTradePolicy(country: 'US' | 'China' | 'India'): TradePolicy {
  return TRADE_POLICY[country];
}

/**
 * Get default trade policy values for a supplier based on country and steel route
 */
export function getDefaultTradePolicyValues(
  country: 'US' | 'China' | 'India',
  steelRoute: 'BF-BOF' | 'Scrap-EAF'
): {
  tariffRate: number;
  antiDumpingDuty: number;
  countervailingDuty: number;
  domesticTaxCredits: number;
  greenSteelSubsidies: number;
} {
  const policy = getTradePolicy(country);
  
  // Adjust green steel subsidies based on route
  let greenSteelSubsidies = policy.greenSteelSubsidies;
  if (steelRoute === 'BF-BOF') {
    greenSteelSubsidies = 0; // No green subsidies for traditional BF-BOF
  }
  
  // Adjust domestic tax credits - only for US
  let domesticTaxCredits = policy.domesticTaxCredits;
  if (country !== 'US') {
    domesticTaxCredits = 0;
  }
  
  return {
    tariffRate: policy.tariffRate,
    antiDumpingDuty: policy.antiDumpingDuty,
    countervailingDuty: policy.countervailingDuty,
    domesticTaxCredits,
    greenSteelSubsidies,
  };
}

