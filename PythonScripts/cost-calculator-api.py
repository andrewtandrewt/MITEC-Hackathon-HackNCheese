"""
API-friendly version of cost-calculator.py
Accepts JSON input via command line argument and outputs JSON
"""
import sys
import json

COUNTRY_CONFIG = {
    "US": {
        "us_import_tariff": 0.00,
        "origin_tax_rate": 0.00,
        "inland_freight_origin_per_ton": 40.0,
        "ocean_freight_per_ton": 0.0,
        "inland_freight_us_per_ton": 40.0,
        "other_costs_per_ton": 20.0,
        "inland_origin_km": 1000.0,
        "ocean_distance_km": 0.0,
        "inland_us_km": 1000.0,
    },
    "China": {
        "us_import_tariff": 0.25,
        "origin_tax_rate": 0.02,
        "inland_freight_origin_per_ton": 30.0,
        "ocean_freight_per_ton": 70.0,
        "inland_freight_us_per_ton": 50.0,
        "other_costs_per_ton": 25.0,
        "inland_origin_km": 300.0,
        "ocean_distance_km": 10000.0,
        "inland_us_km": 1500.0,
    },
    "India": {
        "us_import_tariff": 0.10,
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

TRUCK_KG_CO2_PER_TON_KM = 0.062
SHIP_KG_CO2_PER_TON_KM = 0.010
RAIL_KG_CO2_PER_TON_KM = 0.021

def compute_landed_cost_per_ton(base_price_per_ton, cfg):
    """Compute landed cost per ton in the US."""
    customs_value = base_price_per_ton
    
    import_tariff = customs_value * cfg["us_import_tariff"]
    origin_tax = customs_value * cfg["origin_tax_rate"]
    
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
    
    return {
        "base_price": float(base_price_per_ton),
        "import_tariff": float(import_tariff),
        "origin_tax": float(origin_tax),
        "transport_cost": float(transport_cost),
        "other_costs": float(other_costs),
        "landed_cost_per_ton": float(landed_cost_per_ton),
    }

def compute_transport_emissions_per_ton(cfg):
    """Estimate transport emissions (kg CO2 / ton)."""
    inland_origin = cfg["inland_origin_km"] * TRUCK_KG_CO2_PER_TON_KM
    ocean = cfg["ocean_distance_km"] * SHIP_KG_CO2_PER_TON_KM
    inland_us = cfg["inland_us_km"] * TRUCK_KG_CO2_PER_TON_KM
    
    total_kg_co2_per_ton = inland_origin + ocean + inland_us
    
    return {
        "inland_origin_kg": float(inland_origin),
        "ocean_kg": float(ocean),
        "inland_us_kg": float(inland_us),
        "total_kg_per_ton": float(total_kg_co2_per_ton),
    }

if __name__ == "__main__":
    try:
        # Read JSON input from command line
        input_json = sys.argv[1] if len(sys.argv) > 1 else '{}'
        data = json.loads(input_json)
        
        base_prices = data.get('base_prices', {})
        total_tons = data.get('total_tons', 10000.0)
        
        results = {}
        
        for country in ["US", "China", "India"]:
            if country not in base_prices:
                continue
                
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
                "landed_per_ton": float(landed_per_ton),
                "total_cost": float(total_cost),
                "kg_per_ton": float(kg_per_ton),
                "total_kg": float(total_kg),
            }
        
        # Output JSON
        print(json.dumps({
            "success": True,
            "total_tons": float(total_tons),
            "results": results
        }))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

