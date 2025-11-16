import { Supplier, Transportation, Country } from '@/types';
import { getDefaultTradePolicyValues } from './tradePolicy';

const DEFAULT_TRANSPORTATION_SEGMENTS: Record<Country, Transportation> = {
  US: {
    segments: [
      { distance: 600, mode: 'Truck' },
    ],
  },
  China: {
    segments: [
      { distance: 11500, mode: 'Ship' },
      { distance: 350, mode: 'Truck' },
    ],
  },
  India: {
    segments: [
      { distance: 13000, mode: 'Ship' },
      { distance: 250, mode: 'Truck' },
    ],
  },
};

export function getDefaultTransportation(country: Country): Transportation {
  const template = DEFAULT_TRANSPORTATION_SEGMENTS[country] ?? {
    segments: [{ distance: 1000, mode: 'Truck' }],
  };
  return {
    segments: template.segments.map(segment => ({ ...segment })),
  };
}

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
  const transportation = getDefaultTransportation(country);
  
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
    transportation,
  };
}



export const MOCK_SUPPLIERS: Supplier[] = [
  // -----------------------------------------------------
  // 🇺🇸 UNITED STATES — BF-BOF (High cost, low risk)
  // -----------------------------------------------------
  createSupplierWithDefaults(
    'us-1',
    'US Steel Corp',
    'US',
    'BF-BOF',
    880, // Base Price USD/ton (US BF-BOF average: $850–930)
    55,  // Conversion cost (US labor + finishing)
    9,   // Reliability (very stable domestic producer)
    28,  // Lead time (US domestic steel: 3–5 weeks)
    2,   // Handoffs (mill → service center)
    400, // Min Order (typical for US coil shipments)
    6    // Brokerage / misc fees per ton
  ),

  // -----------------------------------------------------
  // 🇨🇳 CHINA — BF-BOF (Lowest cost, highest geopolitical risk)
  // -----------------------------------------------------
  createSupplierWithDefaults(
    'china-1',
    'Baoshan Iron & Steel Co.',
    'China',
    'BF-BOF',
    610, // Base Price USD/ton (China BF-BOF: $580–650 range)
    35,  // Conversion cost (low labor + scale)
    6,   // Reliability (good industrial reliability, but risk on trade/tariffs)
    55,  // Lead time (typical 6–10 weeks ocean freight + production time)
    4,   // Handoffs (mill → port → ocean → US port → service center)
    1200,// Min Order (China exports require large MOQ)
    18   // Brokerage, customs, handling, documentation fees per ton
  ),

  // -----------------------------------------------------
  // 🇮🇳 INDIA — Scrap-EAF (mid-cost, medium risk, rising market)
  // -----------------------------------------------------
  createSupplierWithDefaults(
    'india-1',
    'Tata Steel India',
    'India',
    'Scrap-EAF',
    740, // Base Price USD/ton (India EAF: $700–780)
    48,  // Conversion cost (slightly higher than China, lower than US)
    8,   // Reliability (Tata is globally reputable)
    42,  // Lead time (5–7 weeks)
    3,   // Handoffs (mill → port → ocean → service center)
    800, // Min Order (typical India export coils)
    10   // Brokerage + customs fees per ton
  ),
];

