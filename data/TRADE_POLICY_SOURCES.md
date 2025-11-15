# Trade Policy Data Sources (2024-2025)

This document outlines the sources and rationale for the hardcoded trade policy values in `tradePolicy.ts`.

## 📋 Data Sources

### Tariff Rates

**US Steel/Aluminum Tariffs (Section 232)**
- **Rate**: 50% ad valorem (as of June 2025)
- **Source**: White House Executive Order, June 4, 2025
- **Applies to**: All countries except certain trade partners
- **Note**: This is a significant increase from previous 25% rate

**US Domestic Steel**
- **Rate**: 0% (no tariffs on domestic production)

### Anti-Dumping Duties

**China**
- **Rate**: 15% (average, range 10-25%)
- **Source**: US Department of Commerce determinations
- **Note**: Varies by specific product and exporter

**India**
- **Rate**: 2% (average, range 0-5%)
- **Source**: US Department of Commerce determinations
- **Note**: Generally lower than China due to different trade relationships

**US**
- **Rate**: 0% (no anti-dumping on domestic)

### Countervailing Duties

**China**
- **Rate**: 10% (average, range 5-15%)
- **Source**: US Department of Commerce countervailing duty investigations
- **Rationale**: Addresses foreign government subsidies

**India**
- **Rate**: 3% (average, range 2-5%)
- **Source**: US Department of Commerce countervailing duty investigations
- **Note**: Lower than China due to different subsidy structures

**US**
- **Rate**: 0% (no CVD on domestic)

### Domestic Tax Credits

**US Domestic Production**
- **Rate**: $25/ton (estimated)
- **Sources**:
  - Inflation Reduction Act (IRA) provisions
  - Buy America/Buy American provisions
  - Section 45Q tax credits for carbon capture
- **Note**: Actual credits vary by project, location, and eligibility

**Foreign Suppliers**
- **Rate**: $0/ton (no US tax credits for foreign suppliers)

### Green Steel Subsidies

**US Green Steel (EAF/DRI routes)**
- **Rate**: $40/ton (estimated)
- **Sources**:
  - Section 45Q tax credits: $35-50/ton CO2 captured
  - IRA green energy incentives
  - State-level green steel programs
- **Adjustments**:
  - BF-BOF: $0 (no green subsidies)
  - Scrap-EAF: $40/ton
  - NG-DRI-EAF: $40/ton
  - H2-DRI: $60/ton (1.5x multiplier for hydrogen-based)

**India Green Steel**
- **Rate**: $15/ton (estimated)
- **Source**: Origin country green steel incentives
- **Note**: Lower than US due to different policy frameworks

**China Green Steel**
- **Rate**: $0/ton
- **Note**: Limited green steel subsidies for exports

### Carbon Tax

**US (California Cap-and-Trade)**
- **Rate**: $35/ton CO2 (estimated)
- **Source**: California Air Resources Board cap-and-trade program
- **Note**: 
  - Only applies in California or if company operates there
  - Rates fluctuate with market
  - National average would be lower (most states don't have carbon pricing)

**India**
- **Rate**: $25/ton CO2 (estimated)
- **Source**: Origin country carbon pricing mechanisms
- **Note**: Varies by state and policy

**China**
- **Rate**: $0/ton CO2
- **Note**: Limited carbon pricing for exports

## 🔄 Updates and Maintenance

### When to Update

These values should be updated when:
1. **New trade policies are enacted** (e.g., tariff changes)
2. **Tax credit programs change** (e.g., IRA amendments)
3. **Carbon pricing mechanisms change** (e.g., cap-and-trade price adjustments)
4. **New anti-dumping or countervailing duty determinations** are finalized

### Recommended Update Frequency

- **Quarterly**: Review and update if significant policy changes occur
- **Annually**: Comprehensive review of all values
- **As needed**: When major policy announcements are made

### Data Verification

Before updating values, verify against:
- US Department of Commerce trade determinations
- US International Trade Commission (USITC) reports
- IRS tax credit guidance
- State environmental agency cap-and-trade data
- White House executive orders and trade policy announcements

## 📝 Notes

1. **Averages vs. Specific Rates**: Many values are averages or estimates. Actual rates may vary by:
   - Specific product type
   - Exporter identity
   - Project location
   - Eligibility criteria

2. **State Variations**: Carbon taxes and some incentives vary by state. The values represent reasonable averages.

3. **Policy Uncertainty**: Trade policies can change quickly. These values represent the most recent available data as of 2024-2025.

4. **User Override**: All values can be manually adjusted in the UI if users have more specific information.

## 🔗 Key Resources

- [US Department of Commerce - Trade Enforcement](https://www.trade.gov/)
- [US International Trade Commission](https://www.usitc.gov/)
- [IRS - Tax Credits](https://www.irs.gov/)
- [California Air Resources Board - Cap-and-Trade](https://ww2.arb.ca.gov/)
- [White House - Trade Policy](https://www.whitehouse.gov/)

