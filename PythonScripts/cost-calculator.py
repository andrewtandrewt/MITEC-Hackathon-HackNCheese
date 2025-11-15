"""
steel_import_calculator.py

Takes base steel prices (e.g., from your forecasting model) for
US, China, and India and calculates:

  - Landed cost in the US ($/ton and total $)
  - Transport emissions (kg CO2 per ton and total kg)

All tariff / transport numbers below are *assumptions* meant
to be edited with your own values.
"""

# -------------------------------
# Helper: simple numeric input
# -------------------------------
def get_float_input(prompt, default):
    """Asks the user for a float, returning a default if they just press Enter."""
    while True:
        try:
            val_str = input(f"{prompt} (default: {default}): ")
            if not val_str:
                return default
            return float(val_str)
        except ValueError:
            print("Invalid input. Please enter a number.")

# -----------------------------------------
# Assumed per-country cost / distance data
# -----------------------------------------
# NOTE: All of these are *placeholder* assumptions.
# Update them with your own tariff, tax, and logistics data.

COUNTRY_CONFIG = {
    "US": {
        # US-origin steel (no import tariff)
        "us_import_tariff": 0.00,   # fraction of customs value
        "origin_tax_rate": 0.00,    # origin-side export tax / VAT passed through
        # Average logistics in $/ton
        "inland_freight_origin_per_ton": 40.0,   # mill to port / customer
        "ocean_freight_per_ton": 0.0,            # no ocean leg for domestic
        "inland_freight_us_per_ton": 40.0,       # additional trucking / rail
        "other_costs_per_ton": 20.0,             # port-like fees, paperwork, etc.
        # Distances for emissions (km)
        "inland_origin_km": 1000.0,
        "ocean_distance_km": 0.0,
        "inland_us_km": 1000.0,
    },
    "China": {
        "us_import_tariff": 0.25,   # 25% tariff on customs value (placeholder!)
        "origin_tax_rate": 0.02,    # 2% origin-side tax passed through (placeholder)
        "inland_freight_origin_per_ton": 30.0,
        "ocean_freight_per_ton": 70.0,
        "inland_freight_us_per_ton": 50.0,
        "other_costs_per_ton": 25.0,
        "inland_origin_km": 300.0,
        "ocean_distance_km": 10000.0,
        "inland_us_km": 1500.0,
    },
    "India": {
        "us_import_tariff": 0.10,   # 10% tariff on customs value (placeholder!)
        "origin_tax_rate": 0.02,
        "inland_freight_origin_per_ton": 35.0,
        "ocean_freight_per_ton": 80.0,
        "inland_freight_us_per_ton": 50.0,
        "other_costs_per_ton": 25.0,
        "inland_origin_km": 400.0,
        "ocean_distance_km": 13000.0,
        "inland_us_km": 1500.0,
    },
}

# -----------------------------------------
# Emission factors (very rough benchmarks)
# -----------------------------------------
# kg CO2 per ton-km
TRUCK_KG_CO2_PER_TON_KM = 0.062   # 62 g CO2 / ton-km
SHIP_KG_CO2_PER_TON_KM  = 0.010   # 10 g CO2 / ton-km (large container / bulk)
RAIL_KG_CO2_PER_TON_KM  = 0.021   # 21 g CO2 / ton-km (if you want to use it)


def compute_landed_cost_per_ton(base_price_per_ton, cfg):
    """
    Compute landed cost per ton in the US given:
      - base mill price (from your forecasting model)
      - country config (tariffs, logistics)
    """

    customs_value = base_price_per_ton  # simple assumption: FOB = base price

    # Tariffs / taxes (all very simplified)
    import_tariff = customs_value * cfg["us_import_tariff"]
    origin_tax = customs_value * cfg["origin_tax_rate"]

    # Logistics / handling costs
    transport_cost = (
        cfg["inland_freight_origin_per_ton"]
        + cfg["ocean_freight_per_ton"]
        + cfg["inland_freight_us_per_ton"]
    )
    other_costs = cfg["other_costs_per_ton"]

    landed_cost_per_ton = (
        base_price_per_ton
        + import_tariff
        + origin_tax
        + transport_cost
        + other_costs
    )

    breakdown = {
        "base_price": base_price_per_ton,
        "import_tariff": import_tariff,
        "origin_tax": origin_tax,
        "transport_cost": transport_cost,
        "other_costs": other_costs,
        "landed_cost_per_ton": landed_cost_per_ton,
    }
    return breakdown


def compute_transport_emissions_per_ton(cfg):
    """
    Estimate transport emissions (kg CO2 / ton) based on
    simple distance × emission factor for each segment.
    All segments are assumed by TRUCK except the ocean leg.
    """

    inland_origin = cfg["inland_origin_km"] * TRUCK_KG_CO2_PER_TON_KM
    ocean = cfg["ocean_distance_km"] * SHIP_KG_CO2_PER_TON_KM
    inland_us = cfg["inland_us_km"] * TRUCK_KG_CO2_PER_TON_KM

    total_kg_co2_per_ton = inland_origin + ocean + inland_us

    breakdown = {
        "inland_origin_kg": inland_origin,
        "ocean_kg": ocean,
        "inland_us_kg": inland_us,
        "total_kg_per_ton": total_kg_co2_per_ton,
    }
    return breakdown


def run_import_calculator():
    print("=" * 60)
    print("        Steel Import Landed Cost & Emissions Model")
    print("=" * 60)
    print("This script takes your *base steel price per ton* (e.g. from")
    print("your forecasting model) for US, China, and India, then adds:")
    print("  - tariffs & simple taxes")
    print("  - transport & handling costs")
    print("  - transport CO2 emissions estimates\n")

    # Total volume to buy (tons)
    total_tons = get_float_input("Enter total steel quantity (tons)", 10000.0)

    print("\n--- 1. Base steel prices from your forecasting model ---")
    print("Tip: copy these from your SARIMAX / country model outputs.")
    base_prices = {}
    # Default guesses just so it runs if you hit Enter
    base_prices["US"] = get_float_input("  US base steel price ($/ton)", 850.0)
    base_prices["China"] = get_float_input("  China base steel price ($/ton)", 780.0)
    base_prices["India"] = get_float_input("  India base steel price ($/ton)", 800.0)

    print("\n--- 2. Results by country (landed cost & transport emissions) ---\n")

    results = {}

    for country in ["US", "China", "India"]:
        cfg = COUNTRY_CONFIG[country]
        base_price = base_prices[country]

        cost_breakdown = compute_landed_cost_per_ton(base_price, cfg)
        emis_breakdown = compute_transport_emissions_per_ton(cfg)

        landed_per_ton = cost_breakdown["landed_cost_per_ton"]
        total_cost = landed_per_ton * total_tons

        kg_per_ton = emis_breakdown["total_kg_per_ton"]
        total_kg = kg_per_ton * total_tons

        results[country] = {
            "cost_breakdown": cost_breakdown,
            "emis_breakdown": emis_breakdown,
            "landed_per_ton": landed_per_ton,
            "total_cost": total_cost,
            "kg_per_ton": kg_per_ton,
            "total_kg": total_kg,
        }

        print(f"=== {country.upper()} ===")
        print(f"Base mill price:          ${base_price:,.2f} / ton")
        print(f"  + Import tariff:        ${cost_breakdown['import_tariff']:,.2f} / ton")
        print(f"  + Origin tax:           ${cost_breakdown['origin_tax']:,.2f} / ton")
        print(f"  + Transport costs:      ${cost_breakdown['transport_cost']:,.2f} / ton")
        print(f"  + Other costs:          ${cost_breakdown['other_costs']:,.2f} / ton")
        print(f"----------------------------------------------")
        print(f"LANDED COST:              ${landed_per_ton:,.2f} / ton")
        print(f"TOTAL LANDED COST:        ${total_cost:,.2f}  (for {total_tons:,.0f} tons)")
        print()
        print(f"Transport emissions:      {kg_per_ton:,.1f} kg CO2 / ton")
        print(f"TOTAL transport CO2:      {total_kg:,.0f} kg CO2\n")

    # Simple summary / ranking
    print("=" * 60)
    print("Summary: landed $/ton and kg CO2/ton")
    print("=" * 60)
    for c in ["US", "China", "India"]:
        print(
            f"{c:>6}:  ${results[c]['landed_per_ton']:,.2f} / ton"
            f"   |   {results[c]['kg_per_ton']:,.1f} kg CO2 / ton"
        )


if __name__ == "__main__":
    run_import_calculator()
