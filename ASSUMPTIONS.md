# Assumptions & Calculation Details

This document outlines the key assumptions and calculation methodologies used in the Steel Procurement Decision Tool.

## Steel Production Route CO₂ Emissions

### BF-BOF (Blast Furnace - Basic Oxygen Furnace)
- **Range**: 2.0 - 2.7 t CO₂ per ton of steel
- **Average Used**: 2.35 t CO₂ per ton
- **Notes**: Traditional high-carbon route, most common globally

### Scrap-EAF (Scrap - Electric Arc Furnace)
- **Range**: 0.3 - 0.9 t CO₂ per ton of steel
- **Average Used**: 0.6 t CO₂ per ton
- **Notes**: Depends heavily on grid carbon intensity. Lower emissions but requires quality scrap.

### NG-DRI-EAF (Natural Gas Direct Reduced Iron - Electric Arc Furnace)
- **Range**: 0.8 - 1.2 t CO₂ per ton of steel
- **Average Used**: 1.0 t CO₂ per ton
- **Notes**: Mid-emission route using natural gas for reduction

### H2-DRI (Hydrogen Direct Reduced Iron)
- **Range**: 0.05 - 0.2 t CO₂ per ton of steel
- **Average Used**: 0.125 t CO₂ per ton
- **Notes**: Lowest emission route, requires green hydrogen

## Transportation Emission Factors

All factors are in **grams CO₂ per ton-kilometer**:

| Mode | Emission Factor | Cost Factor (USD/ton-km) | Notes |
|------|----------------|--------------------------|-------|
| Truck | 62 g CO₂/ton-km | ~$0.15 | Short to medium distances, flexible |
| Rail | 21 g CO₂/ton-km | ~$0.05 | Efficient for long distances |
| Ship | 7 g CO₂/ton-km | ~$0.02 | Most efficient, international trade |
| Air | 570 g CO₂/ton-km | ~$1.50 | Fastest but highest emissions |

*Note: Cost factors are approximate and vary by region and market conditions.*

## Country-Level Factors

### United States (US)
- **Cost Score**: 0.00 (normalized, lowest cost baseline)
- **Risk Score**: 0.00 (normalized, lowest risk baseline)
- **Trade Score**: 1.00 (normalized, best trade relations)
- **Volatility**: 0.15 (annualized)
- **Growth**: 0.12 (5-year)

### India
- **Cost Score**: 0.51 (normalized, moderate cost)
- **Risk Score**: 0.31 (normalized, moderate risk)
- **Trade Score**: 0.70 (normalized, good trade relations)
- **Volatility**: 0.22 (annualized)
- **Growth**: 0.18 (5-year)

### China
- **Cost Score**: 1.00 (normalized, highest cost due to tariffs)
- **Risk Score**: 1.00 (normalized, highest risk)
- **Trade Score**: 0.30 (normalized, trade friction)
- **Volatility**: 0.28 (annualized)
- **Growth**: 0.15 (5-year)

*Note: These scores are normalized 0-1 scales where lower is better for cost and risk, higher is better for trade.*

## Calculation Assumptions

### Default Quantity
- All calculations assume **1,000 tons** as the default order quantity
- This can be modified in the calculation utilities if needed

### Green Steel Credits
- Routes classified as "green" (Scrap-EAF, NG-DRI-EAF, H2-DRI) receive a **10% carbon credit**
- Applied to production CO₂ only, not transportation

### Risk Score Weights
The supplier risk score combines:
- **40%** Lead Time (normalized, max 120 days)
- **30%** Supplier Reliability (inverted 1-10 scale)
- **20%** Logistics Complexity (supply chain handoffs, max 10)
- **10%** Country Risk Score

### Final Score Normalization
- **Cost Score**: Inverted (lower cost = higher score, 0-1)
- **Carbon Score**: Inverted (lower carbon = higher score, 0-1)
- **Risk Score**: Inverted (lower risk = higher score, 0-1)
- All normalized relative to the min/max within the supplier set

### Tariff Calculation
Total tariff rate = Import Tariff + Anti-Dumping Duty + Countervailing Duty
Applied to: (Base Price + Conversion Cost) × Quantity

### Tax Credits & Subsidies
- Applied as direct reductions from total cost
- Domestic tax credits: per ton
- Green steel subsidies: per ton (only for green routes)

## Limitations & Considerations

1. **Static Data**: Country factors and emission factors are static. Real-world values fluctuate.

2. **Simplified Transportation**: 
   - Assumes single mode of transport
   - Does not account for multi-modal routes
   - Cost factors are approximate

3. **Currency**: All calculations assume USD. No currency conversion.

4. **Time Sensitivity**: 
   - Prices and tariffs change over time
   - No historical tracking or forecasting

5. **Regional Variations**: 
   - Emission factors vary by region (especially grid intensity for EAF)
   - Transportation costs vary significantly by route

6. **Risk Modeling**: 
   - Simplified risk score
   - Does not account for geopolitical events, natural disasters, or market shocks

7. **Quality Assumptions**: 
   - Assumes all suppliers meet quality requirements
   - No quality scoring or penalties

## Recommended Usage

- Use as a **comparative tool** rather than absolute decision maker
- Update country factors and prices regularly
- Consider additional factors not captured in the model
- Validate results with domain experts
- Adjust weights based on organizational priorities

## Data Sources (Conceptual)

The country factors and emission factors are based on:
- Industry standard emission factors (World Steel Association, IEA)
- Market analysis and trade policy data
- Stock market volatility as proxy for economic stability
- Trade relationship assessments

*Note: Actual implementation should integrate real-time data sources for production use.*

