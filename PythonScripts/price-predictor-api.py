"""
API-friendly version of price-predictor.py
Accepts JSON input via command line argument and outputs JSON
"""
import sys
import json
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings

warnings.filterwarnings("ignore")

def get_sarima_forecast(data_series, steps):
    """Trains a SARIMA model and returns the predicted mean."""
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
    """Combines SARIMAX forecasting with $/ton cost calculation."""
    try:
        # Load country adjustments (try multiple possible paths)
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, "country_cost_factors - Sheet1.csv")
        if not os.path.exists(csv_path):
            csv_path = os.path.join(script_dir, "..", "country_cost_factors - Sheet1.csv")
        country_factors = pd.read_csv(csv_path)
        cf = country_factors[country_factors['country'] == selected_country].iloc[0]
    except:
        # Fallback if country factors file doesn't exist
        class CountryFactors:
            iron_ore = 1.0
            coal = 1.0
            scrap = 1.0
            fluxes = 1.0
            labor_bf = 50.0
            labor_eaf = 40.0
            electricity = 1.0
            carbon_tax = 1.0
        cf = CountryFactors()

    # Calculate Steel Tonnage
    tons_per_mw = 40.0
    total_steel_tons = mw_capacity * tons_per_mw

    # Calculate BF-BOF Cost
    BF_EMISSIONS_PER_TON = 2.1
    bf_cost_materials = (
        (1.37 * bf_assumptions['iron_ore'] * cf.iron_ore) +
        (0.78 * bf_assumptions['coking_coal'] * cf.coal) +
        (0.125 * bf_assumptions['scrap'] * cf.scrap) +
        (0.27 * bf_assumptions['bf_fluxes'] * cf.fluxes)
    )

    bf_cost_base = bf_cost_materials + bf_assumptions.get('other_costs_bf', 50.0)
    bf_cost_carbon = BF_EMISSIONS_PER_TON * carbon_tax
    bf_cost_total = bf_cost_base + bf_cost_carbon

    # Load Scrap Index Data
    try:
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if not os.path.isabs(scrap_file_path):
            scrap_file_path = os.path.join(script_dir, scrap_file_path)
        df_scrap = pd.read_csv(scrap_file_path)
        df_scrap = df_scrap.rename(columns={'WPU1012': 'EAF_Input_Cost_Index'})
        df_scrap['observation_date'] = pd.to_datetime(df_scrap['observation_date'])
        df_scrap = df_scrap.set_index('observation_date').asfreq('MS')
        
        last_known_date = df_scrap.index.max()
        last_known_index = df_scrap['EAF_Input_Cost_Index'].iloc[-1]
        
        # Calculate Forecast Steps
        forecast_end_date = pd.to_datetime(f'{future_construction_year}-12-01')
        forecast_steps = (forecast_end_date.year - last_known_date.year) * 12 + (forecast_end_date.month - last_known_date.month)
        
        # Run SARIMAX Forecast
        scrap_forecast_series = get_sarima_forecast(df_scrap['EAF_Input_Cost_Index'], steps=forecast_steps)
        
        if scrap_forecast_series is None:
            # Fallback to last known price
            forecasted_scrap_price = bf_assumptions.get('scrap', 375.0)
        else:
            scrap_preds_year = scrap_forecast_series[scrap_forecast_series.index.year == future_construction_year]
            avg_pred_scrap_index = scrap_preds_year.mean()
            
            # Bridge: Convert Index to $/ton
            base_scrap_price = bf_assumptions.get('scrap', 375.0)
            price_per_index_point = base_scrap_price / last_known_index
            forecasted_scrap_price = avg_pred_scrap_index * price_per_index_point
    except Exception as e:
        # Fallback if forecasting fails
        forecasted_scrap_price = bf_assumptions.get('scrap', 375.0)

    # Calculate Total EAF Cost
    EAF_EMISSIONS_PER_TON = 0.6
    eaf_cost_materials = (
        1.1 * forecasted_scrap_price * cf.scrap +
        450 * eaf_assumptions['electricity'] * cf.electricity +
        2.0 * eaf_assumptions['electrode'] +
        0.05 * (eaf_assumptions['eaf_fluxes'] * cf.fluxes)
    )
    eaf_cost_base = eaf_cost_materials + cf.labor_eaf
    eaf_cost_carbon = EAF_EMISSIONS_PER_TON * carbon_tax
    eaf_cost_total = eaf_cost_base + eaf_cost_carbon

    # Calculate comparisons
    cost_spread_per_ton = bf_cost_total - eaf_cost_total
    total_project_cost_savings = cost_spread_per_ton * total_steel_tons
    emissions_percent_savings = (BF_EMISSIONS_PER_TON - EAF_EMISSIONS_PER_TON) / BF_EMISSIONS_PER_TON
    cost_percent_savings = (bf_cost_total - eaf_cost_total) / bf_cost_total if bf_cost_total > 0 else 0

    return {
        "success": True,
        "total_steel_tons": total_steel_tons,
        "bf_cost_per_ton": float(bf_cost_total),
        "eaf_cost_per_ton": float(eaf_cost_total),
        "forecasted_scrap_price": float(forecasted_scrap_price),
        "cost_spread_per_ton": float(cost_spread_per_ton),
        "total_project_cost_savings": float(total_project_cost_savings),
        "emissions_percent_savings": float(emissions_percent_savings),
        "cost_percent_savings": float(cost_percent_savings),
        "bf_emissions_per_ton": BF_EMISSIONS_PER_TON,
        "eaf_emissions_per_ton": EAF_EMISSIONS_PER_TON,
    }

if __name__ == "__main__":
    try:
        # Read JSON input from command line
        input_json = sys.argv[1] if len(sys.argv) > 1 else '{}'
        data = json.loads(input_json)
        
        result = run_forecasting_calculator(
            data.get('mw_capacity', 100.0),
            data.get('future_year', 2027),
            'WPU1012.csv',
            data.get('bf_assumptions', {}),
            data.get('eaf_assumptions', {}),
            data.get('carbon_tax', 50.0),
            data.get('country', 'US')
        )
        
        # Output JSON
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

