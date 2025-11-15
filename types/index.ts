export type SteelProductionRoute = 'BF-BOF' | 'Scrap-EAF';

export type TransportMode = 'Truck' | 'Rail' | 'Ship' | 'Air';

export type Country = 'US' | 'China' | 'India';

export interface SteelRouteConfig {
  route: SteelProductionRoute;
  co2Min: number; // t CO2 per ton
  co2Max: number; // t CO2 per ton
  co2Average: number; // t CO2 per ton
}

export interface TransportConfig {
  mode: TransportMode;
  co2PerTonKm: number; // g CO2 per ton-km
  costPerTonKm: number; // USD per ton-km (approximate)
}

export interface CountryFactors {
  country: Country;
  costScore: number; // 0-1 normalized
  riskScore: number; // 0-1 normalized
  tradeScore: number; // 0-1 normalized (higher = better trade relations)
  volatility: number; // annualized volatility
  growth: number; // 5-year growth
}

export interface Supplier {
  id: string;
  name: string;
  country: Country;
  steelRoute: SteelProductionRoute;
  basePrice: number; // USD per ton
  conversionCost: number; // USD per ton
  tariffRate: number; // percentage (0-100)
  antiDumpingDuty: number; // percentage (0-100)
  countervailingDuty: number; // percentage (0-100)
  domesticTaxCredits: number; // USD per ton
  greenSteelSubsidies: number; // USD per ton
  supplierReliability: number; // 1-10
  leadTime: number; // days
  supplyChainHandoffs: number;
  minOrderCommitment: number; // tons
  brokerageFees: number; // USD per ton
}

export interface TransportationSegment {
  distance: number; // km
  mode: TransportMode;
}

export interface Transportation {
  segments: TransportationSegment[]; // Multiple segments for multi-modal transport
}

export interface CalculationWeights {
  cost: number; // 0-1
  carbon: number; // 0-1
  risk: number; // 0-1
}

export interface SupplierResult {
  supplier: Supplier;
  totalLandedCost: number;
  totalCarbon: number; // t CO2
  supplierRiskScore: number; // 0-1
  countryScore: number; // 0-1
  finalScore: number; // weighted score
  freightCost: number;
  transportCO2: number; // t CO2
  productionCO2: number; // t CO2
}

export interface AppState {
  suppliers: Supplier[];
  transportation: Transportation;
  weights: CalculationWeights;
  results: SupplierResult[];
}

