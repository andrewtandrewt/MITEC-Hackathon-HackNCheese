import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings

# --- Helper function from the $/ton calculator ---
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

# --- Forecasting function from the SARIMAX script ---
def get_sarima_forecast(data_series, steps):
    """Trains a SARIMA model and returns the predicted mean."""
    warnings.filterwarnings("ignore")
    order = (1, 1, 1)
    seasonal_order = (1, 1, 1, 12)
    
    try:
        model = SARIMAX(data_series,
                        order=order,
                        seasonal_order=seasonal_order,
                        enforce_stationarity=False,
                        enforce_invertibility=False)
        model_fit = model.fit(disp=False)
        forecast = model_fit.get_forecast(steps=steps)
        return forecast.predicted_mean
    except Exception as e:
        print(f"Error during forecasting for {data_series.name}: {e}")
        return None

def run_forecasting_calculator(
    mw_capacity, 
    future_construction_year, 
    scrap_file_path,
    bf_assumptions,
    eaf_assumptions,
    carbon_tax, 
    selected_country
):
    """
    Combines SARIMAX forecasting with $/ton cost calculation
    to compare BF vs. EAF production costs.
    """
    # Load country adjustments
    
    country_factors = pd.read_csv("country_cost_factors - Sheet1.csv")

    # Filter for selected country
    cf = country_factors[country_factors['country'] == selected_country].iloc[0]

    # --- 1. Calculate Steel Tonnage ---
    tons_per_mw = 40.0
    total_steel_tons = mw_capacity * tons_per_mw
    
    print("\n" + "="*50)
    print(f"--- COST & EMISSIONS ANALYSIS FOR {future_construction_year} ---")
    print("="*50)
    print("--- 1. Project Steel Requirement ---")
    print(f"  Solar Farm Capacity: {mw_capacity:,.0f} MW")
    print(f"  Total Steel Required: {total_steel_tons:,.0f} tons")

    # --- 2. Calculate BF-BOF Cost (Based on User's Static Assumptions) ---
    print("\n--- 2. BF-BOF ('New Steel') Cost Scenario ---")
    #now by regions to account for country
    BF_EMISSIONS_PER_TON = 2.1
    bf_cost_materials = (
    (1.37 * bf_assumptions['iron_ore'] * cf.iron_ore) +
    (0.78 * bf_assumptions['coking_coal'] * cf.coal) +
    (0.125 * bf_assumptions['scrap'] * cf.scrap) +
    (0.27 * bf_assumptions['bf_fluxes'] * cf.fluxes)
)

    bf_cost_base = bf_cost_materials + cf.labor_bf
    bf_cost_carbon = 2.1 * cf.carbon_tax

    bf_cost_base = bf_cost_materials + bf_assumptions['other_costs_bf']
    bf_cost_carbon = BF_EMISSIONS_PER_TON * carbon_tax
    bf_cost_total = bf_cost_base + bf_cost_carbon

    print(f"  Using your static assumptions, the BF-BOF cost is:")
    print(f"  ${bf_cost_total:,.2f} / ton")

    # --- 3. Load Scrap Index Data ---
    print(f"\n--- 3. Forecasting EAF ('Green Steel') Cost ---")
    print(f"  Loading scrap index data from {scrap_file_path}...")
    try:
        df_scrap = pd.read_csv(scrap_file_path)
        df_scrap = df_scrap.rename(columns={'WPU1012': 'EAF_Input_Cost_Index'})
        df_scrap['observation_date'] = pd.to_datetime(df_scrap['observation_date'])
        df_scrap = df_scrap.set_index('observation_date').asfreq('MS')
        
        last_known_date = df_scrap.index.max()
        last_known_index = df_scrap['EAF_Input_Cost_Index'].iloc[-1]
        
    except FileNotFoundError as e:
        print(f"Error: The data file '{e.filename}' was not found.")
        return
    except Exception as e:
        print(f"An error occurred loading the data: {e}")
        return

    # --- 4. Calculate Forecast Steps ---
    if future_construction_year <= last_known_date.year:
        print(f"Error: Future year {future_construction_year} is not in the future.")
        return

    forecast_end_date = pd.to_datetime(f'{future_construction_year}-12-01')
    forecast_steps = (forecast_end_date.year - last_known_date.year) * 12 + (forecast_end_date.month - last_known_date.month)
    
    print(f"  Last known scrap data: {last_known_date.strftime('%Y-%m')} (Index: {last_known_index:.2f})")
    print(f"  Forecasting {forecast_steps} months ahead...")

    # --- 5. Run SARIMAX Forecast for Scrap ---
    scrap_forecast_series = get_sarima_forecast(df_scrap['EAF_Input_Cost_Index'], steps=forecast_steps)
    if scrap_forecast_series is None:
        print("Scrap forecasting failed. Aborting.")
        return

    # Extract the average *forecasted* index for the target year
    scrap_preds_year = scrap_forecast_series[scrap_forecast_series.index.year == future_construction_year]
    avg_pred_scrap_index = scrap_preds_year.mean()

    # --- 6. The "Bridge": Convert Forecasted Index to $/ton ---
    print("\n  --- The 'Bridge' Assumption ---")
    base_scrap_price = get_float_input(
        f"  Enter the $/ton scrap price for {last_known_date.strftime('%Y-%m')}", 
        375.0
    )
    price_per_index_point = base_scrap_price / last_known_index
    forecasted_scrap_price = avg_pred_scrap_index * price_per_index_point

    print(f"\n  Forecasted Index for {future_construction_year}: {avg_pred_scrap_index:.2f}")
    print(f"  Base Price per Index Point: ${price_per_index_point:.2f}")
    print(f"  >>> FORECASTED Scrap Price: ${forecasted_scrap_price:,.2f} / ton")

    # --- 7. Calculate Total EAF Cost ---
    EAF_EMISSIONS_PER_TON = 0.6
    eaf_cost_materials = (
    1.1 * forecasted_scrap_price * cf.scrap +
    450 * cf.electricity +
    2.0 * eaf_assumptions['electrode'] +
    0.05 * (eaf_assumptions['eaf_fluxes'] * cf.fluxes)
)
    eaf_cost_base = eaf_cost_materials + cf.labor_eaf
    eaf_cost_carbon = 0.6 * cf.carbon_tax
    eaf_cost_total = eaf_cost_base + eaf_cost_carbon

    print(f"\n  Combining forecast with your other assumptions, the EAF cost is:")
    print(f"  ${eaf_cost_total:,.2f} / ton")

    # --- 8. Final Comparison ---
    cost_spread_per_ton = bf_cost_total - eaf_cost_total
    total_project_cost_savings = cost_spread_per_ton * total_steel_tons
    emissions_percent_savings = (BF_EMISSIONS_PER_TON - EAF_EMISSIONS_PER_TON) / BF_EMISSIONS_PER_TON
    cost_percent_savings = (bf_cost_total - eaf_cost_total) / bf_cost_total

    print("\n" + "="*50)
    print("--- 4. Final Project Cost Analysis ---")
    print("="*50)
    
    print("  --- Cost per Ton Comparison ---")
    print(f"  Static BF-BOF Cost Scenario: ${bf_cost_total:,.2f} / ton")
    print(f"  Forecasted EAF Cost: ${eaf_cost_total:,.2f} / ton")

    print("\n  --- Dollar ($) Impact ---")
    print(f"  Forecasted Cost Spread (BF - EAF): ${cost_spread_per_ton:,.2f} / ton")
    print(f"  TOTAL PROJECTED SAVINGS ({total_steel_tons:,.0f} tons):")
    print(f"  ${total_project_cost_savings:,.2f}")
    
    print("\n  --- Percentage (%) Impact (vs. BF Baseline) ---")
    print(f"  Emissions Savings (EAF vs BF): {emissions_percent_savings:.2%}")
    print(f"  Cost Savings (EAF vs BF): {cost_percent_savings:.2%}")
    print("="*50)

    print("\n--- Interpretation ---")
    if cost_spread_per_ton > 0:
        print(f"  This model forecasts that EAF 'green' steel will be {cost_percent_savings:.2%} CHEAPER")
        print("  than your static BF-BOF cost scenario.")
    else:
        print(f"  This model forecasts that EAF 'green' steel will be {abs(cost_percent_savings):.2%} MORE EXPENSIVE")
        print("  than your static BF-BOF cost scenario.")


# --- Main part of the script ---
if __name__ == "__main__":
    
    print("="*50)
    print("   Hybrid Steel Cost 'Forecasting Calculator'")
    print("="*50)
    print("This tool forecasts EAF scrap costs and compares them")
    print("to your static assumptions for a BF-BOF scenario.")
    print(f"NOTE: Our historical data ends in August 2025.\n")
    selected_country = input("Enter the country (US, China, India, Germany, Brazil): ").strip()

    try:
        # --- 1. Get Project Basics ---
        print("--- 1. Project Basics ---")
        mw_input = get_float_input("Enter the solar farm capacity in MW", 100.0)
        year_input = int(get_float_input("Enter the future construction year (e.g. 2027)", 2027))
        if year_input <= 2025:
            print("Error: Please enter a year *after* 2025.")
            exit()
            
        # --- 2. Get User's Static Assumptions for Costs ---
        print("\n--- 2. Enter Static Price Assumptions ---")
        print("(These will be held constant for the BF scenario)")
        
        bf_assumptions = {
            'iron_ore':       get_float_input("  Price of Iron Ore ($/ton)", 130.0),
            'coking_coal':    get_float_input("  Price of Coking Coal ($/ton)", 280.0),
            'bf_fluxes':      get_float_input("  Price of BF/BOF Fluxes ($/ton)", 50.0),
            'scrap':          get_float_input("  Price of Scrap (for BF coolant) ($/ton)", 375.0),
            'other_costs_bf': get_float_input("  Other Costs (Labor, Maint) for BF ($/ton)", 50.0)
        }
        
        eaf_assumptions = {
            'electricity':    get_float_input("  Price of Electricity ($/kWh)", 0.08),
            'electrode':      get_float_input("  Price of Graphite Electrode ($/kg)", 2.5),
            'eaf_fluxes':     get_float_input("  Price of EAF Fluxes ($/ton)", 60.0),
            'other_costs_eaf':get_float_input("  Other Costs (Labor, Maint) for EAF ($/ton)", 40.0)
        }

        # --- 3. Get Carbon Tax Assumption ---
        print("\n--- 3. Enter Carbon Tax Assumption ---")
        tax_assumption = get_float_input("  Carbon Tax ($ per ton of CO2e)", 50.0)

        # --- 4. Run the analysis ---
        run_forecasting_calculator(
            mw_input, 
            year_input, 
            'WPU1012.csv',  # We only need the scrap file now
            bf_assumptions,
            eaf_assumptions,
            tax_assumption, selected_country
        )
        
    except ValueError:
        print("\nError: Invalid input.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")