import { Supplier } from '@/types';
import { getDefaultTradePolicyValues } from './tradePolicy';

// Helper to create supplier with default trade policy values
function createSupplierWithDefaults(
  id: string,
  name: string,
  country: 'US' | 'China' | 'India',
  steelRoute: 'BF-BOF' | 'Scrap-EAF',
  basePrice: number,
  conversionCost: number,
  supplierReliability: number,
  leadTime: number,
  supplyChainHandoffs: number,
  minOrderCommitment: number,
  brokerageFees: number
): Supplier {
  const tradePolicy = getDefaultTradePolicyValues(country, steelRoute);
  
  return {
    id,
    name,
    country,
    steelRoute,
    basePrice,
    conversionCost,
    tariffRate: tradePolicy.tariffRate,
    antiDumpingDuty: tradePolicy.antiDumpingDuty,
    countervailingDuty: tradePolicy.countervailingDuty,
    domesticTaxCredits: tradePolicy.domesticTaxCredits,
    greenSteelSubsidies: tradePolicy.greenSteelSubsidies,
    supplierReliability,
    leadTime,
    supplyChainHandoffs,
    minOrderCommitment,
    brokerageFees,
  };
}

export const MOCK_SUPPLIERS: Supplier[] = [
  createSupplierWithDefaults(
    'us-1',
    'US Steel Corp',
    'US',
    'BF-BOF',
    850, // USD per ton
    50,
    9,
    30,
    2,
    500,
    5
  ),
  createSupplierWithDefaults(
    'china-1',
    'China Steel Manufacturing',
    'China',
    'BF-BOF',
    650, // USD per ton
    40,
    7,
    60,
    5,
    1000,
    15
  ),
  createSupplierWithDefaults(
    'india-1',
    'Tata Steel India',
    'India',
    'Scrap-EAF',
    720, // USD per ton
    45,
    8,
    45,
    3,
    750,
    8
  ),
];

