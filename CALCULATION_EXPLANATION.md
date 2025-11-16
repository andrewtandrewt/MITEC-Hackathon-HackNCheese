# Complete Explanation: Inputs & Calculations

This document provides a comprehensive explanation of every input field, calculation method, and the business logic behind the Steel Procurement Decision Tool.

---

## 📋 Table of Contents

1. [Supplier Inputs](#supplier-inputs)
2. [Transportation Inputs](#transportation-inputs)
3. [Weight Configuration](#weight-configuration)
4. [Calculation Formulas](#calculation-formulas)
5. [Normalization Logic](#normalization-logic)
6. [Final Scoring System](#final-scoring-system)

---

## 🏭 Supplier Inputs

### Basic Information

#### **Name**
- **Purpose**: Identifier for the supplier
- **Why it matters**: Helps distinguish between multiple suppliers in results
- **Example**: "US Steel Corp", "Tata Steel India"

#### **Country**
- **Purpose**: Determines country-level risk, trade, and cost factors
- **Why it matters**: 
  - Different countries have different tariff structures
  - Geopolitical risk varies by country
  - Trade relationships affect import costs
  - Market stability differs (reflected in country scores)
- **Impact**: Automatically applies country-specific factors (cost score, risk score, trade score)

#### **Steel Production Route**
- **Purpose**: Determines the carbon footprint of steel production
- **Options & Reasoning**:
  - **BF-BOF (Blast Furnace - Basic Oxygen Furnace)**: 
    - Traditional method, highest emissions (2.35 t CO₂/ton average)
    - Most common globally, well-established
  - **Scrap-EAF (Scrap - Electric Arc Furnace)**:
    - Lower emissions (0.6 t CO₂/ton average)
    - Depends on grid carbon intensity
    - Requires quality scrap metal
- **Impact**: Directly affects production CO₂ calculation and green steel eligibility

---

### Cost-Related Inputs

#### **Base Price (USD/ton)**
- **Purpose**: The fundamental cost of raw steel before any processing or additional fees
- **Why it matters**: This is the starting point for all cost calculations
- **Business Context**: 
  - Varies significantly by country (labor costs, energy costs, raw material costs)
  - Can fluctuate with market conditions
  - Often the largest component of total cost
- **Calculation Impact**: Multiplied by quantity, then tariffs are applied

#### **Conversion Cost (USD/ton)**
- **Purpose**: Additional processing costs (slitting, galvanizing, coating, cutting, etc.)
- **Why it matters**: 
  - Not all steel comes ready-to-use
  - Different suppliers offer different levels of processing
  - Can vary based on complexity of requirements
- **Calculation Impact**: Added to base price before tariff calculation

#### **Tariff Rate (%)**
- **Purpose**: Standard import tariff applied by importing country
- **Why it matters**: 
  - Trade policies vary by country pair
  - Can significantly increase cost (e.g., 25% US-China tariffs)
  - Reflects trade relationships and protectionist policies
- **Calculation Impact**: Applied as percentage to (Base Price + Conversion Cost)

#### **Anti-Dumping Duty (%)**
- **Purpose**: Additional tariff when supplier is found to be "dumping" (selling below fair market value)
- **Why it matters**: 
  - Protects domestic industries
  - Can be substantial (often 10-50%)
  - Varies by country and specific case
- **Calculation Impact**: Added to tariff rate

#### **Countervailing Duty (%)**
- **Purpose**: Tariff to offset foreign government subsidies
- **Why it matters**: 
  - Levels playing field when foreign governments subsidize production
  - Common in steel trade disputes
  - Can compound with other duties
- **Calculation Impact**: Added to tariff rate

**Total Tariff Calculation**:
```
Total Tariff Rate = (Tariff Rate + Anti-Dumping Duty + Countervailing Duty) / 100
Tariff Cost = (Base Price + Conversion Cost) × Quantity × Total Tariff Rate
```

**Why combine them**: All three are applied sequentially to the base cost, representing the full trade policy impact.

---

### Incentive & Credit Inputs

#### **Domestic Tax Credits (USD/ton)**
- **Purpose**: Government incentives for sourcing domestically
- **Why it matters**: 
  - Encourages local supply chains
  - Can offset higher base prices
  - Examples: Buy America provisions, IRA credits
- **Calculation Impact**: Directly subtracted from total cost (reduces final cost)

#### **Green Steel Subsidies (USD/ton)**
- **Purpose**: Incentives for low-carbon steel production
- **Why it matters**: 
  - Only applies to green routes (EAF/DRI)
  - Encourages decarbonization
  - Can make green steel competitive despite higher base costs
- **Calculation Impact**: Subtracted from total cost (only if route is green)

#### **Carbon Tax (USD/ton CO₂)**
- **Purpose**: Cost of carbon emissions (if applicable)
- **Why it matters**: 
  - Some jurisdictions tax carbon emissions
  - Can significantly impact high-emission routes
  - Reflects environmental policy
- **Note**: Currently captured in input but not directly used in calculation (could be added as: `Carbon Tax Cost = Total CO₂ × Carbon Tax Rate`)

---

### Risk & Logistics Inputs

#### **Supplier Reliability (1-10)**
- **Purpose**: Measure of supplier's track record and dependability
- **Why it matters**: 
  - Higher reliability = lower risk of delays, quality issues, contract breaches
  - Based on historical performance, certifications, audits
  - Critical for supply chain stability
- **Calculation Impact**: 
  - Inverted in risk calculation (10 = best, 1 = worst)
  - Formula: `Reliability Score = 1 - (Reliability - 1) / 9`
  - Example: Reliability of 9 → Score of 0.11 (low risk)

#### **Lead Time (days)**
- **Purpose**: Time from order to delivery
- **Why it matters**: 
  - Longer lead times = higher inventory costs, less flexibility
  - Affects production planning and cash flow
  - Can indicate supply chain complexity
- **Calculation Impact**: 
  - Normalized: `Lead Time Score = min(Lead Time / 120, 1)`
  - Assumes 120 days is maximum reasonable lead time
  - Higher days = higher risk score

#### **Supply Chain Handoffs**
- **Purpose**: Number of intermediaries in the supply chain
- **Why it matters**: 
  - More handoffs = more points of failure
  - Increases complexity, delays, and potential for errors
  - Each handoff adds cost and risk
- **Calculation Impact**: 
  - Normalized: `Logistics Score = min(Handoffs / 10, 1)`
  - Assumes 10 handoffs is maximum
  - More handoffs = higher risk score

#### **Minimum Order Commitment (tons)**
- **Purpose**: Minimum quantity required to place an order
- **Why it matters**: 
  - Affects inventory management
  - Higher minimums = less flexibility
  - Can lock in capital
- **Note**: Currently captured but not directly used in calculations (could be used for quantity optimization)

#### **Brokerage Fees (USD/ton)**
- **Purpose**: Fees for customs clearance, documentation, logistics coordination
- **Why it matters**: 
  - Adds to total cost
  - Varies by country and complexity
  - Often overlooked but can be significant
- **Calculation Impact**: Added directly to total cost

---

## 🚚 Transportation Inputs

### Distance (km)
- **Purpose**: Total transportation distance from supplier to destination
- **Why it matters**: 
  - Directly affects both cost and carbon emissions
  - Longer distances = higher freight costs and emissions
  - Can vary significantly (e.g., 1000 km domestic vs 10,000 km international)
- **Calculation Impact**: 
  - Cost: `Freight Cost = Distance × Cost per ton-km × Quantity`
  - Carbon: `Transport CO₂ = Distance × Emission Factor × Quantity / 1,000,000`

### Transport Mode
- **Purpose**: Method of transportation
- **Options & Reasoning**:
  - **Truck**: 
    - Most flexible, door-to-door
    - Highest emissions (62 g CO₂/ton-km)
    - Best for short-medium distances
    - Cost: ~$0.15/ton-km
  - **Rail**: 
    - Efficient for long distances
    - Lower emissions (21 g CO₂/ton-km)
    - Requires rail infrastructure
    - Cost: ~$0.05/ton-km
  - **Ship**: 
    - Most efficient for international trade
    - Lowest emissions (7 g CO₂/ton-km)
    - Slowest but cheapest
    - Cost: ~$0.02/ton-km
  - **Air**: 
    - Fastest but most expensive
    - Highest emissions (570 g CO₂/ton-km)
    - Rare for bulk steel, used for urgent small orders
    - Cost: ~$1.50/ton-km

**Why mode matters**: 
- Different modes have 80x difference in emissions (Ship: 7 vs Air: 570)
- Cost differences can be 75x (Ship: $0.02 vs Air: $1.50)
- Choice significantly impacts both cost and carbon footprint

---

## ⚖️ Weight Configuration

### Cost Weight, Carbon Weight, Risk Weight
- **Purpose**: User-defined importance of each factor
- **Why it matters**: 
  - Different organizations have different priorities
  - Some prioritize cost, others prioritize sustainability
  - Risk tolerance varies
- **Constraint**: Must sum to 100% (1.0)
- **Calculation Impact**: 
  - Final Score = (Cost Weight × Cost Score) + (Carbon Weight × Carbon Score) + (Risk Weight × Risk Score)
  - Higher weight = more influence on final recommendation

**Example Scenarios**:
- **Cost-focused**: Cost=70%, Carbon=20%, Risk=10%
- **Sustainability-focused**: Cost=30%, Carbon=50%, Risk=20%
- **Balanced**: Cost=40%, Carbon=30%, Risk=30%

---

## 🧮 Calculation Formulas

### 1. Total Landed Cost

**Formula**:
```
Base Cost = (Base Price + Conversion Cost) × Quantity
Tariff Cost = Base Cost × (Total Tariff Rate)
Freight Cost = Distance × Cost per ton-km × Quantity
Brokerage = Brokerage Fees × Quantity
Tax Credits = Domestic Tax Credits × Quantity
Green Subsidies = Green Steel Subsidies × Quantity (if green route)

Total Landed Cost = Base Cost 
                  + Tariff Cost 
                  + Freight Cost 
                  + Brokerage 
                  - Tax Credits 
                  - Green Subsidies
```

**Step-by-Step Example** (US Supplier, 1000 tons, 5000 km by ship):
1. Base Cost = ($850 + $50) × 1000 = $900,000
2. Tariff Cost = $900,000 × 0% = $0 (no tariffs for domestic)
3. Freight Cost = 5000 × $0.02 × 1000 = $100,000
4. Brokerage = $5 × 1000 = $5,000
5. Tax Credits = $20 × 1000 = $20,000
6. Green Subsidies = $0 (BF-BOF not green)
7. **Total = $900,000 + $0 + $100,000 + $5,000 - $20,000 - $0 = $985,000**

**Why this structure**: 
- Captures all cost components
- Accounts for trade policy (tariffs)
- Includes logistics (freight, brokerage)
- Applies incentives (credits, subsidies)
- Results in true "landed cost" (what you actually pay)

---

### 2. Total Carbon Emissions

**Formula**:
```
Production CO₂ = Steel Route Average CO₂ × Quantity
Transport CO₂ = (Distance × Emission Factor × Quantity) / 1,000,000
Green Steel Credits = 10% of Production CO₂ (if green route)

Total CO₂ = Production CO₂ + Transport CO₂ - Green Steel Credits
```

**Step-by-Step Example** (China Supplier, BF-BOF, 1000 tons, 10,000 km by ship):
1. Production CO₂ = 2.35 t/ton × 1000 = 2,350 t CO₂
2. Transport CO₂ = (10,000 × 7 g/ton-km × 1000) / 1,000,000 = 70 t CO₂
3. Green Credits = 0 (BF-BOF not green)
4. **Total = 2,350 + 70 - 0 = 2,420 t CO₂**

**Why separate production and transport**: 
- Production emissions are fixed per route
- Transport emissions vary by distance and mode
- Allows analysis of each component
- Helps identify optimization opportunities

**Why green steel credits**: 
- Incentivizes low-carbon production
- Reflects policy support for green steel
- Makes green routes more competitive

---

### 3. Supplier Risk Score

**Formula**:
```
Lead Time Score = min(Lead Time / 120, 1)
Reliability Score = 1 - (Reliability - 1) / 9
Logistics Score = min(Supply Chain Handoffs / 10, 1)
Country Risk Score = Country Factors Risk Score

Supplier Risk Score = 0.4 × Lead Time Score
                    + 0.3 × Reliability Score
                    + 0.2 × Logistics Score
                    + 0.1 × Country Risk Score
```

**Step-by-Step Example** (Supplier with 60 days lead time, reliability 7, 3 handoffs, India):
1. Lead Time Score = min(60/120, 1) = 0.5
2. Reliability Score = 1 - (7-1)/9 = 1 - 0.67 = 0.33
3. Logistics Score = min(3/10, 1) = 0.3
4. Country Risk = 0.31 (from India factors)
5. **Risk Score = 0.4×0.5 + 0.3×0.33 + 0.2×0.3 + 0.1×0.31 = 0.2 + 0.099 + 0.06 + 0.031 = 0.39**

**Why these weights**:
- **40% Lead Time**: Most directly impacts operations and inventory costs
- **30% Reliability**: Critical for supply chain stability
- **20% Logistics**: Important but less critical than lead time
- **10% Country Risk**: Background factor, less controllable

**Why normalize each component**: 
- Allows fair comparison across different scales
- Lead time (days) vs Reliability (1-10) vs Handoffs (count) need normalization
- Ensures each component contributes proportionally

---

### 4. Country Score

**Formula**:
```
Cost Component = 1 - Country Cost Score (invert: lower cost = higher score)
Risk Component = 1 - Country Risk Score (invert: lower risk = higher score)
Trade Component = Country Trade Score (higher = better)

Country Score = 0.3 × Cost Component
             + 0.3 × Risk Component
             + 0.4 × Trade Component
```

**Step-by-Step Example** (India):
1. Cost Component = 1 - 0.51 = 0.49
2. Risk Component = 1 - 0.31 = 0.69
3. Trade Component = 0.70
4. **Country Score = 0.3×0.49 + 0.3×0.69 + 0.4×0.70 = 0.147 + 0.207 + 0.28 = 0.634**

**Why these weights**:
- **30% Cost**: Important but can be offset by other factors
- **30% Risk**: Important for stability
- **40% Trade**: Most important - affects tariffs, regulations, ease of doing business

**Why invert cost and risk**: 
- Country factors are scored where higher = worse
- We want higher scores to mean better
- So we invert: `1 - bad_score = good_score`

---

## 📊 Normalization Logic

### Why Normalize?

Different metrics have different scales:
- Cost: $500,000 - $1,500,000 (millions)
- Carbon: 500 - 2,500 t CO₂ (thousands)
- Risk: 0.2 - 0.8 (decimals)

**Problem**: Can't directly compare or weight these without normalization.

**Solution**: Convert all to 0-1 scale where:
- 0 = worst in the set
- 1 = best in the set
- Values in between = proportional position

### Cost Normalization

**Formula**:
```
minCost = minimum cost among all suppliers
maxCost = maximum cost among all suppliers

Cost Score = 1 - (Cost - minCost) / (maxCost - minCost)
```

**Why invert**: Lower cost is better, so we invert to make lower cost = higher score.

**Example** (3 suppliers with costs: $900k, $1,200k, $1,500k):
- Supplier 1 ($900k): Score = 1 - (900-900)/(1500-900) = 1 - 0 = **1.0** (best)
- Supplier 2 ($1,200k): Score = 1 - (1200-900)/(1500-900) = 1 - 0.5 = **0.5**
- Supplier 3 ($1,500k): Score = 1 - (1500-900)/(1500-900) = 1 - 1 = **0.0** (worst)

### Carbon Normalization

**Formula**:
```
minCarbon = minimum carbon among all suppliers
maxCarbon = maximum carbon among all suppliers

Carbon Score = 1 - (Carbon - minCarbon) / (maxCarbon - minCarbon)
```

**Same logic as cost**: Lower carbon = higher score.

### Risk Normalization

**Formula**:
```
Risk Score = 1 - Supplier Risk Score
```

**Why simple**: Risk score is already 0-1 (lower is better), so we just invert it.

**Example**: Risk Score of 0.3 → Final Risk Score = 1 - 0.3 = **0.7** (good)

---

## 🎯 Final Scoring System

### Formula

```
Final Score = (Cost Weight × Cost Score) 
            + (Carbon Weight × Carbon Score) 
            + (Risk Weight × Risk Score)
```

**Where**:
- All scores are normalized 0-1 (higher = better)
- All weights sum to 1.0 (100%)
- Final score is 0-1 (higher = better recommendation)

### Step-by-Step Example

**Supplier A**:
- Cost: $1,000,000 → Cost Score: 0.6 (normalized)
- Carbon: 1,500 t CO₂ → Carbon Score: 0.8 (normalized)
- Risk: 0.3 → Risk Score: 0.7 (inverted)
- Weights: Cost=40%, Carbon=30%, Risk=30%

**Calculation**:
```
Final Score = 0.4 × 0.6 + 0.3 × 0.8 + 0.3 × 0.7
            = 0.24 + 0.24 + 0.21
            = 0.69 (69%)
```

**Supplier B**:
- Cost: $800,000 → Cost Score: 1.0 (best cost)
- Carbon: 2,000 t CO₂ → Carbon Score: 0.5 (worse carbon)
- Risk: 0.5 → Risk Score: 0.5 (worse risk)
- Same weights

**Calculation**:
```
Final Score = 0.4 × 1.0 + 0.3 × 0.5 + 0.3 × 0.5
            = 0.40 + 0.15 + 0.15
            = 0.70 (70%)
```

**Result**: Supplier B wins (0.70 > 0.69) despite worse carbon and risk, because cost is weighted heavily and B has much better cost.

---

## 🔄 How Everything Works Together

### The Complete Flow

1. **User Inputs** → Supplier data, transportation, weights
2. **Calculate Intermediate Values**:
   - Total Landed Cost (for each supplier)
   - Total Carbon (for each supplier)
   - Supplier Risk Score (for each supplier)
   - Country Score (for each supplier)
3. **Normalize**:
   - Normalize costs across all suppliers (0-1)
   - Normalize carbon across all suppliers (0-1)
   - Invert risk scores (0-1)
4. **Weighted Combination**:
   - Multiply each normalized score by its weight
   - Sum to get final score
5. **Rank**:
   - Sort suppliers by final score (descending)
   - Highest score = best recommendation

### Why This Approach Works

1. **Comprehensive**: Captures cost, environmental, and risk factors
2. **Flexible**: User can adjust weights based on priorities
3. **Fair**: Normalization ensures fair comparison
4. **Transparent**: Each component is visible and understandable
5. **Actionable**: Results show which supplier wins and why

---

## 💡 Key Design Decisions

### Why Default Quantity is 1,000 Tons
- Common order size in steel procurement
- Makes calculations easier to understand
- Can be modified in code if needed
- All costs scale linearly with quantity

### Why Green Steel Gets 10% Credit
- Reflects policy support for decarbonization
- Makes green routes more competitive
- Encourages sustainable choices
- Can be adjusted based on actual policy

### Why Risk Weights are 40/30/20/10
- Lead time most directly impacts operations
- Reliability critical for stability
- Logistics important but secondary
- Country risk is background factor
- These can be adjusted based on industry needs

### Why Country Factors are Pre-set
- Based on market data and trade analysis
- Can be overridden per supplier if needed
- Reflects real-world trade relationships
- Updates should come from market analysis

---

## 🎓 Summary

The calculation system is designed to:

1. **Capture Real Costs**: All cost components (base, tariffs, freight, fees, credits)
2. **Measure Environmental Impact**: Production + transport emissions
3. **Assess Risk**: Supplier reliability, lead time, logistics, country factors
4. **Normalize Fairly**: Convert all metrics to comparable 0-1 scales
5. **Weight Flexibly**: Allow user to prioritize cost, carbon, or risk
6. **Recommend Clearly**: Single score that ranks suppliers

The result is a transparent, comprehensive tool that helps manufacturers make informed steel procurement decisions based on their specific priorities.

