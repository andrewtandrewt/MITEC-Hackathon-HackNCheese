import {
  Supplier,
  Transportation,
  CalculationWeights,
  SupplierResult,
  SteelRouteConfig,
  TransportConfig,
  CountryFactors,
} from '@/types';
import { STEEL_ROUTES, TRANSPORT_MODES, COUNTRY_FACTORS } from '@/data/constants';

function getSegmentsForSupplier(
  supplier: Supplier,
  fallbackTransportation?: Transportation
) {
  if (supplier.transportation?.segments?.length) {
    return supplier.transportation.segments;
  }
  if (fallbackTransportation?.segments?.length) {
    return fallbackTransportation.segments;
  }
  return [];
}

/**
 * Calculate total landed cost for a supplier
 */
export function calculateTotalLandedCost(
  supplier: Supplier,
  quantity: number = 1000,
  fallbackTransportation?: Transportation
): { totalCost: number; freightCost: number } {
  // Calculate freight cost for all transportation segments
  let freightCost = 0;
  const segments = getSegmentsForSupplier(supplier, fallbackTransportation);
  for (const segment of segments) {
    const transportConfig = TRANSPORT_MODES[segment.mode];
    freightCost += transportConfig.costPerTonKm * segment.distance * quantity;
  }

  const totalTariffRate = (supplier.tariffRate + supplier.antiDumpingDuty + supplier.countervailingDuty) / 100;
  
  const baseCost = (supplier.basePrice + supplier.conversionCost) * quantity;
  const tariffCost = baseCost * totalTariffRate;
  const brokerageFees = supplier.brokerageFees * quantity;
  
  // Green steel premium (negative if EAF route)
  const isGreenSteel = supplier.steelRoute === 'Scrap-EAF';
  const greenSteelPremium = isGreenSteel ? supplier.greenSteelSubsidies * quantity : 0;

  const totalCost = baseCost
    + tariffCost
    + freightCost
    + brokerageFees
    - supplier.domesticTaxCredits * quantity
    - greenSteelPremium;

  return { totalCost, freightCost };
}

/**
 * Calculate total carbon emissions
 */
export function calculateTotalCarbon(
  supplier: Supplier,
  quantity: number = 1000,
  fallbackTransportation?: Transportation
): { totalCO2: number; productionCO2: number; transportCO2: number } {
  const steelRoute = STEEL_ROUTES[supplier.steelRoute];
  const productionCO2 = steelRoute.co2Average * quantity; // t CO2

  // Calculate transport CO2 for all transportation segments
  let transportCO2 = 0;
  const segments = getSegmentsForSupplier(supplier, fallbackTransportation);
  for (const segment of segments) {
    const transportConfig = TRANSPORT_MODES[segment.mode];
    // Convert g CO2 to t CO2: divide by 1,000,000
    transportCO2 += (transportConfig.co2PerTonKm * segment.distance * quantity) / 1000000; // t CO2
  }

  // Green steel credits (if applicable)
  const isGreenSteel = supplier.steelRoute === 'Scrap-EAF';
  const greenSteelCredits = isGreenSteel ? 0.1 * productionCO2 : 0; // 10% credit for green steel

  const totalCO2 = productionCO2 + transportCO2 - greenSteelCredits;

  return { totalCO2, productionCO2, transportCO2 };
}

/**
 * Calculate supplier risk score (0-1, lower is better)
 */
export function calculateSupplierRiskScore(supplier: Supplier): number {
  // Normalize lead time (0-1, higher = worse)
  // Assume max lead time is 120 days
  const leadTimeScore = Math.min(supplier.leadTime / 120, 1);

  // Normalize supplier reliability (0-1, higher = worse, so invert)
  const reliabilityScore = 1 - (supplier.supplierReliability - 1) / 9; // 1-10 scale to 0-1

  // Normalize logistics complexity (0-1, higher = worse)
  // Assume max handoffs is 10
  const logisticsScore = Math.min(supplier.supplyChainHandoffs / 10, 1);

  // Get country risk score
  const countryFactors = COUNTRY_FACTORS[supplier.country];
  const countryRiskScore = countryFactors.riskScore;

  // Weighted combination
  const riskScore = 
    0.4 * leadTimeScore +
    0.3 * reliabilityScore +
    0.2 * logisticsScore +
    0.1 * countryRiskScore;

  return Math.min(Math.max(riskScore, 0), 1); // Clamp to 0-1
}

/**
 * Calculate country score (0-1, higher is better)
 */
export function calculateCountryScore(supplier: Supplier): number {
  const countryFactors = COUNTRY_FACTORS[supplier.country];
  
  // Combine cost, risk, and trade scores (invert cost and risk since lower is better)
  const costComponent = 1 - countryFactors.costScore; // invert: lower cost = higher score
  const riskComponent = 1 - countryFactors.riskScore; // invert: lower risk = higher score
  const tradeComponent = countryFactors.tradeScore;

  // Weighted average
  const countryScore = 
    0.3 * costComponent +
    0.3 * riskComponent +
    0.4 * tradeComponent;

  return Math.min(Math.max(countryScore, 0), 1); // Clamp to 0-1
}

/**
 * Normalize cost to 0-1 score (lower cost = higher score)
 */
function normalizeCost(cost: number, allCosts: number[]): number {
  const minCost = Math.min(...allCosts);
  const maxCost = Math.max(...allCosts);
  if (maxCost === minCost) return 1;
  return 1 - (cost - minCost) / (maxCost - minCost); // invert: lower cost = higher score
}

/**
 * Normalize carbon to 0-1 score (lower carbon = higher score)
 */
function normalizeCarbon(carbon: number, allCarbons: number[]): number {
  const minCarbon = Math.min(...allCarbons);
  const maxCarbon = Math.max(...allCarbons);
  if (maxCarbon === minCarbon) return 1;
  return 1 - (carbon - minCarbon) / (maxCarbon - minCarbon); // invert: lower carbon = higher score
}

/**
 * Calculate final weighted score for all suppliers
 */
export function calculateFinalScores(
  suppliers: Supplier[],
  weights: CalculationWeights,
  quantity: number = 1000,
  fallbackTransportation?: Transportation
): SupplierResult[] {
  // Calculate all intermediate values
  const intermediateResults = suppliers.map(supplier => {
    const { totalCost, freightCost } = calculateTotalLandedCost(
      supplier,
      quantity,
      fallbackTransportation
    );
    const { totalCO2, productionCO2, transportCO2 } = calculateTotalCarbon(
      supplier,
      quantity,
      fallbackTransportation
    );
    const supplierRiskScore = calculateSupplierRiskScore(supplier);
    const countryScore = calculateCountryScore(supplier);

    return {
      supplier,
      totalLandedCost: totalCost,
      totalCarbon: totalCO2,
      supplierRiskScore,
      countryScore,
      freightCost,
      transportCO2,
      productionCO2,
    };
  });

  // Extract arrays for normalization
  const allCosts = intermediateResults.map(r => r.totalLandedCost);
  const allCarbons = intermediateResults.map(r => r.totalCarbon);
  const allRiskScores = intermediateResults.map(r => r.supplierRiskScore);

  // Calculate normalized scores and final weighted scores
  const results: SupplierResult[] = intermediateResults.map(result => {
    const costScore = normalizeCost(result.totalLandedCost, allCosts);
    const carbonScore = normalizeCarbon(result.totalCarbon, allCarbons);
    const riskScore = 1 - result.supplierRiskScore; // invert: lower risk = higher score

    const finalScore = 
      weights.cost * costScore +
      weights.carbon * carbonScore +
      weights.risk * riskScore;

    return {
      ...result,
      finalScore,
    };
  });

  // Sort by final score (descending)
  return results.sort((a, b) => b.finalScore - a.finalScore);
}

