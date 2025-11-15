# Steel Procurement & Carbon Tradeoff Web App

A comprehensive full-stack web application that helps manufacturers make informed steel procurement decisions by comparing global suppliers (US, China, India) using multi-criteria analysis. The app calculates and weighs cost, carbon footprint, supply chain risk, and country-level market factors to produce a final weighted recommendation.

## 🎯 Features

- **Multi-Supplier Comparison**: Add and compare multiple suppliers from different countries
- **Steel Production Route Analysis**: Support for BF-BOF, Scrap-EAF, NG-DRI-EAF, and H2-DRI routes
- **Comprehensive Cost Calculation**: Includes base price, conversion costs, tariffs, duties, freight, and tax credits
- **Carbon Footprint Analysis**: Calculates production and transportation emissions
- **Risk Assessment**: Evaluates supplier reliability, lead times, logistics complexity, and country risk
- **Customizable Weights**: Adjust importance of cost, carbon, and risk factors
- **Visual Dashboard**: Interactive charts showing cost, carbon, and multi-criteria comparisons

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Charts**: Recharts
- **State Management**: LocalStorage + React State
- **Backend**: Next.js API Routes
- **Python Integration**: SARIMAX forecasting, cost calculations
  - pandas, numpy, statsmodels

## 📦 Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for price forecasting):
   ```bash
   pip install -r PythonScripts/requirements.txt
   ```
   
   Or manually:
   ```bash
   pip install pandas numpy statsmodels
   ```

4. **Place required data files**:
   - `WPU1012.csv` in `PythonScripts/` directory (for price forecasting)
   - `country_cost_factors - Sheet1.csv` in `PythonScripts/` directory (optional, has fallbacks)

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

> **Note**: Python integration is optional. The app works without it, but price forecasting requires Python and the data files.

## 🚀 Usage

### Price Forecasting (Optional)

Before setting up suppliers, you can forecast future steel prices:

1. Click **"📊 Forecast Prices"** button on the Supplier Setup page
2. Enter forecasting parameters:
   - Solar farm capacity (MW)
   - Future construction year
   - Country
   - Material prices (iron ore, coal, scrap, etc.)
   - Carbon tax
3. Click **"Run Forecast"** to get forecasted BF-BOF and EAF costs
4. Click **"Use Forecasted Prices"** to auto-populate supplier base prices

> See [PYTHON_INTEGRATION.md](./PYTHON_INTEGRATION.md) for detailed information about the Python integration.

### Page 1: Supplier Setup
- Add multiple suppliers (US, China, India)
- Configure steel production route, pricing, tariffs, taxes, and supplier metrics
- Each supplier can have different parameters
- Use "Add Supplier" to add more, or "Remove" to delete

### Page 2: Transportation
- Set transportation distance (in km)
- Select transport mode (Truck, Rail, Ship, Air)
- View estimated freight cost and CO₂ emissions

### Page 3: Weights Configuration
- Adjust sliders to set importance weights for:
  - **Cost**: Lower cost = higher score
  - **Carbon**: Lower emissions = higher score
  - **Risk**: Lower risk = higher score
- Weights automatically normalize to sum to 100%

### Page 4: Results Dashboard
- View ranked supplier recommendations
- See detailed cost and carbon comparisons
- Analyze multi-criteria radar chart
- Review comprehensive results table

## 📊 Calculation Methodology

For a **complete detailed explanation** of all inputs, calculations, and business logic, see **[CALCULATION_EXPLANATION.md](./CALCULATION_EXPLANATION.md)**.

### Quick Overview

**Total Landed Cost**:
```
TotalCost = (BasePrice + ConversionCost) × (1 + TariffRate)
          + FreightCost
          + BrokerageFees
          - LocalTaxCredits
          - GreenSteelPremium (if EAF/DRI)
```

**Total Carbon Emissions**:
```
TotalCO2 = ProductionCO2 + TransportCO2 - GreenSteelCredits
```

**Supplier Risk Score**:
```
RiskScore = 0.4 × LeadTimeScore
          + 0.3 × SupplierReliabilityScore
          + 0.2 × LogisticsComplexityScore
          + 0.1 × CountryRiskScore
```

**Final Weighted Score**:
```
FinalScore = w_cost × CostScore
          + w_carbon × CarbonScore
          + w_risk × RiskScore
```

All scores are normalized to 0-1 scale, with higher scores being better.

**📖 For detailed explanations of:**
- Why each input field exists
- How each calculation works step-by-step
- The business logic behind formulas
- Normalization methodology
- Example calculations

**See: [CALCULATION_EXPLANATION.md](./CALCULATION_EXPLANATION.md)**

## 📋 Assumptions & Defaults

### Steel Production Routes
- **BF-BOF**: 2.0-2.7 t CO₂/ton (avg: 2.35)
- **Scrap-EAF**: 0.3-0.9 t CO₂/ton (avg: 0.6)
- **NG-DRI-EAF**: 0.8-1.2 t CO₂/ton (avg: 1.0)
- **H2-DRI**: 0.05-0.2 t CO₂/ton (avg: 0.125)

### Transportation Emission Factors
- **Truck**: 62 g CO₂/ton-km
- **Rail**: 21 g CO₂/ton-km
- **Ship**: 7 g CO₂/ton-km
- **Air**: 570 g CO₂/ton-km

### Country-Level Factors (Default)
- **US**: Cost=0.00, Risk=0.00, Trade=1.00
- **India**: Cost=0.51, Risk=0.31, Trade=0.70
- **China**: Cost=1.00, Risk=1.00, Trade=0.30

*Note: These values can be overridden in the supplier setup page.*

### Default Quantity
All calculations assume a default quantity of **1,000 tons**. This can be modified in the calculation utilities if needed.

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # Page 1: Supplier Setup
│   ├── transportation/
│   │   └── page.tsx          # Page 2: Transportation
│   ├── weights/
│   │   └── page.tsx          # Page 3: Weights Configuration
│   ├── results/
│   │   └── page.tsx          # Page 4: Results Dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── types/
│   └── index.ts              # TypeScript type definitions
├── data/
│   ├── constants.ts          # Steel routes, transport modes, country factors
│   └── mockSuppliers.ts      # Sample supplier data
├── utils/
│   └── calculations.ts       # Core calculation logic
└── README.md                 # This file
```

## 🔧 Customization

### Adding New Steel Routes
Edit `data/constants.ts` to add new routes with their CO₂ emission ranges.

### Modifying Country Factors
Update `COUNTRY_FACTORS` in `data/constants.ts` with new cost, risk, and trade scores.

### Adjusting Calculation Weights
Modify the risk score calculation weights in `utils/calculations.ts`:
```typescript
const riskScore = 
  0.4 * leadTimeScore +
  0.3 * reliabilityScore +
  0.2 * logisticsScore +
  0.1 * countryRiskScore;
```

## 🧪 Testing

To test the application:
1. Start with the default mock suppliers (US, China, India)
2. Modify transportation distance and mode
3. Adjust weights to see how recommendations change
4. Add custom suppliers with different parameters

## 📝 Notes

- Data is stored in browser localStorage between pages
- All calculations are performed client-side
- The app uses normalized scores (0-1) for fair comparison
- Higher final scores indicate better suppliers
- The recommended supplier is highlighted in green on the results page

## 🚧 Future Enhancements

Potential improvements:
- Export results to PDF/CSV
- Save/load supplier configurations
- Historical price tracking
- Real-time market data integration
- Advanced risk modeling
- Multi-currency support
- Batch quantity optimization

## 📄 License

This project is provided as-is for educational and decision-support purposes.

## 🤝 Contributing

Feel free to submit issues or pull requests for improvements.

---

**Built with Next.js, TypeScript, and TailwindCSS**

# MITEC-Hackathon-HackNCheese
