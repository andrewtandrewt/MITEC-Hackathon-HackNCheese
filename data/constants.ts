import { SteelRouteConfig, TransportConfig, CountryFactors } from '@/types';

export const STEEL_ROUTES: Record<string, SteelRouteConfig> = {
  'BF-BOF': {
    route: 'BF-BOF',
    co2Min: 2.0,
    co2Max: 2.7,
    co2Average: 2.35,
  },
  'Scrap-EAF': {
    route: 'Scrap-EAF',
    co2Min: 0.3,
    co2Max: 0.9,
    co2Average: 0.6,
  },
};

export const TRANSPORT_MODES: Record<string, TransportConfig> = {
  Truck: {
    mode: 'Truck',
    co2PerTonKm: 62, // g CO2 per ton-km
    costPerTonKm: 0.15, // USD per ton-km (approximate)
  },
  Rail: {
    mode: 'Rail',
    co2PerTonKm: 21, // g CO2 per ton-km
    costPerTonKm: 0.05, // USD per ton-km (approximate)
  },
  Ship: {
    mode: 'Ship',
    co2PerTonKm: 7, // g CO2 per ton-km
    costPerTonKm: 0.02, // USD per ton-km (approximate)
  },
  Air: {
    mode: 'Air',
    co2PerTonKm: 570, // g CO2 per ton-km
    costPerTonKm: 1.5, // USD per ton-km (approximate)
  },
};

export const COUNTRY_FACTORS: Record<string, CountryFactors> = {
  US: {
    country: 'US',
    costScore: 0.0, // normalized (lowest cost = 0)
    riskScore: 0.0, // normalized (lowest risk = 0)
    tradeScore: 1.0, // normalized (best trade = 1.0)
    volatility: 0.15,
    growth: 0.12,
  },
  India: {
    country: 'India',
    costScore: 0.51, // normalized
    riskScore: 0.31, // normalized
    tradeScore: 0.70, // normalized
    volatility: 0.22,
    growth: 0.18,
  },
  China: {
    country: 'China',
    costScore: 1.0, // normalized (highest cost = 1.0)
    riskScore: 1.0, // normalized (highest risk = 1.0)
    tradeScore: 0.30, // normalized (worst trade = 0.30)
    volatility: 0.28,
    growth: 0.15,
  },
};

