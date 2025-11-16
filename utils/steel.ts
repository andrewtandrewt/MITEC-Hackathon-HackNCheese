export interface SteelRequirement {
  totalRows: number;
  totalSteelKg: number;
  totalSteelTonnes: number;
  exactRows: number;
}

export const SOLAR_PANEL_WATTAGE = 615; // W per panel
export const PANELS_PER_ROW = 90;
export const ROW_STEEL_WEIGHT_KG = 884.46; // kg per tracker row (given)

// Dimensions/spacing (mm) from the assumptions
const PANEL_LENGTH_MM = 2382;
const PANEL_WIDTH_MM = 1134;
const PANEL_SPACING_MM = 25;
const MOTOR_GAP_MM = 800;

// Convert mm to meters for reporting (not currently surfaced, but kept for clarity)
export const ROW_LENGTH_METERS =
  (PANELS_PER_ROW * PANEL_WIDTH_MM +
    (PANELS_PER_ROW - 1) * PANEL_SPACING_MM +
    MOTOR_GAP_MM) /
  1000;

// Scale factor so 100 MW ≈ 18,000 rows per provided example
const MW_TO_EFFECTIVE_WATTS = 10_000_000;

/**
 * Estimate steel demand for the solar project based on capacity (MW).
 */
export function calculateSteelRequirement(capacityMw: number): SteelRequirement {
  const sanitizedCapacity = Math.max(capacityMw || 0, 0);
  const totalWatts = sanitizedCapacity * MW_TO_EFFECTIVE_WATTS;
  const wattsPerRow = SOLAR_PANEL_WATTAGE * PANELS_PER_ROW;

  const exactRows = wattsPerRow > 0 ? totalWatts / wattsPerRow : 0;
  const totalRows = Math.max(0, Math.ceil(exactRows));

  const totalSteelKg = totalRows * ROW_STEEL_WEIGHT_KG;
  const totalSteelTonnes = totalSteelKg / 1000;

  return {
    totalRows,
    totalSteelKg,
    totalSteelTonnes,
    exactRows,
  };
}
