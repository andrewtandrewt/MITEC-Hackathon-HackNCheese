# Python Script Integration Guide

This document explains how the Python forecasting and cost calculation scripts are integrated into the Next.js web application.

## 📋 Overview

The app integrates three Python scripts:
1. **price-predictor-api.py** - Forecasts future steel prices using SARIMAX
2. **cost-calculator-api.py** - Calculates landed costs and transport emissions
3. **steel test.py** - (Original script, can be used for testing)

## 🔧 Setup Requirements

### 1. Python Dependencies

Install required Python packages:

```bash
pip install pandas numpy statsmodels
```

### 2. Required Data Files

Place these files in the `PythonScripts/` directory:

- **WPU1012.csv** - Scrap price index data (required for forecasting)
- **country_cost_factors - Sheet1.csv** - Country-specific cost factors (optional, has fallbacks)

### 3. Python Path

Ensure Python is accessible from the command line:
- Windows: Python should be in PATH
- Mac/Linux: Use `python3` if needed (update API routes accordingly)

## 🚀 How It Works

### API Routes

The app exposes two API endpoints:

#### `/api/forecast-price` (POST)
- **Purpose**: Forecasts steel prices using SARIMAX model
- **Input**: 
  ```json
  {
    "mwCapacity": 100.0,
    "futureYear": 2027,
    "country": "US",
    "carbonTax": 50.0,
    "bfAssumptions": { ... },
    "eafAssumptions": { ... }
  }
  ```
- **Output**: Forecasted BF-BOF and EAF costs, scrap prices, savings calculations

#### `/api/calculate-cost` (POST)
- **Purpose**: Calculates landed costs and transport emissions
- **Input**:
  ```json
  {
    "basePrices": {
      "US": 850.0,
      "China": 650.0,
      "India": 720.0
    },
    "totalTons": 10000.0
  }
  ```
- **Output**: Landed costs and emissions for each country

### Workflow

1. **User visits `/forecast` page**
   - Enters forecasting parameters (MW capacity, future year, country, material prices)
   - Clicks "Run Forecast"
   - Frontend calls `/api/forecast-price`
   - API executes Python script with JSON input
   - Python script returns JSON output
   - Results displayed to user

2. **User clicks "Use Forecasted Prices"**
   - Forecasted prices saved to localStorage
   - User redirected to supplier setup page
   - Supplier base prices auto-populated with forecasted values

3. **Supplier Setup Integration**
   - Supplier setup page checks for forecasted prices
   - If available, shows green banner
   - Base prices automatically updated
   - User can still manually edit prices

## 📁 File Structure

```
MITECHack/
├── app/
│   ├── api/
│   │   ├── forecast-price/
│   │   │   └── route.ts          # API endpoint for price forecasting
│   │   └── calculate-cost/
│   │       └── route.ts          # API endpoint for cost calculation
│   ├── forecast/
│   │   └── page.tsx              # Forecasting UI page
│   └── page.tsx                  # Supplier setup (updated with forecast integration)
├── PythonScripts/
│   ├── price-predictor-api.py    # API-friendly price forecasting script
│   ├── cost-calculator-api.py    # API-friendly cost calculation script
│   ├── price-predictor.py        # Original interactive script
│   ├── cost-calculator.py       # Original interactive script
│   └── WPU1012.csv               # Scrap price index data (required)
└── ...
```

## 🔍 API Script Details

### price-predictor-api.py

**Key Features**:
- Accepts JSON input via command line argument
- Outputs JSON (not console text)
- Handles missing CSV files gracefully
- Calculates BF-BOF and EAF costs
- Forecasts scrap prices using SARIMAX

**Input Format**:
```json
{
  "mw_capacity": 100.0,
  "future_year": 2027,
  "country": "US",
  "carbon_tax": 50.0,
  "bf_assumptions": {
    "iron_ore": 130.0,
    "coking_coal": 280.0,
    "bf_fluxes": 50.0,
    "scrap": 375.0,
    "other_costs_bf": 50.0
  },
  "eaf_assumptions": {
    "electricity": 0.08,
    "electrode": 2.5,
    "eaf_fluxes": 60.0,
    "other_costs_eaf": 40.0
  }
}
```

**Output Format**:
```json
{
  "success": true,
  "total_steel_tons": 4000.0,
  "bf_cost_per_ton": 850.50,
  "eaf_cost_per_ton": 720.30,
  "forecasted_scrap_price": 380.25,
  "cost_spread_per_ton": 130.20,
  "total_project_cost_savings": 520800.0,
  "emissions_percent_savings": 0.714,
  "cost_percent_savings": 0.153,
  "bf_emissions_per_ton": 2.1,
  "eaf_emissions_per_ton": 0.6
}
```

### cost-calculator-api.py

**Key Features**:
- Accepts JSON input with base prices and quantity
- Calculates landed costs including tariffs, transport, fees
- Calculates transport emissions
- Outputs structured JSON

**Input Format**:
```json
{
  "base_prices": {
    "US": 850.0,
    "China": 650.0,
    "India": 720.0
  },
  "total_tons": 10000.0
}
```

**Output Format**:
```json
{
  "success": true,
  "total_tons": 10000.0,
  "results": {
    "US": {
      "cost_breakdown": { ... },
      "emis_breakdown": { ... },
      "landed_per_ton": 950.0,
      "total_cost": 9500000.0,
      "kg_per_ton": 124.0,
      "total_kg": 1240000.0
    },
    ...
  }
}
```

## 🐛 Troubleshooting

### Python Script Not Found
- **Error**: `Python script failed: ...`
- **Solution**: Ensure Python is in PATH, or update API routes to use full path

### CSV File Not Found
- **Error**: `Scrap data file (WPU1012.csv) not found`
- **Solution**: Place `WPU1012.csv` in `PythonScripts/` directory

### Import Errors
- **Error**: `ModuleNotFoundError: No module named 'statsmodels'`
- **Solution**: Install Python dependencies: `pip install pandas numpy statsmodels`

### JSON Parse Errors
- **Error**: `Failed to parse Python script output`
- **Solution**: Check Python script output - ensure it only prints JSON (no debug prints)

## 🔄 Extending the Integration

### Adding New Python Scripts

1. Create API-friendly version (accepts JSON, outputs JSON)
2. Create API route in `app/api/[endpoint]/route.ts`
3. Create UI page if needed
4. Update documentation

### Modifying Scripts

- Keep input/output as JSON
- Handle errors gracefully (return `{"success": false, "error": "..."}`)
- Use relative paths for data files
- Add fallbacks for missing files

## 📝 Notes

- Python scripts run in separate processes (spawned via `child_process`)
- Scripts must be synchronous (no async operations)
- Large datasets may require optimization
- Consider caching results for repeated queries
- Production deployment may need Python environment management (virtualenv, Docker)

## 🚀 Production Considerations

For production deployment:

1. **Use Python virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Update API routes to use virtualenv Python**
   ```typescript
   const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');
   ```

3. **Add error handling and timeouts**
   ```typescript
   const timeout = setTimeout(() => {
     pythonProcess.kill();
     resolve(NextResponse.json({ error: 'Timeout' }, { status: 504 }));
   }, 30000);
   ```

4. **Consider using a job queue** (e.g., Bull, BullMQ) for long-running forecasts

5. **Cache forecast results** to avoid repeated calculations

