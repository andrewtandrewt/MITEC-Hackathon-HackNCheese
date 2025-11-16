'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Supplier } from '@/types';
import { MOCK_SUPPLIERS } from '@/data/mockSuppliers';
import { STEEL_ROUTES, COUNTRY_FACTORS } from '@/data/constants';
import { getDefaultTradePolicyValues } from '@/data/tradePolicy';
import Tooltip from '@/components/Tooltip';

export default function Home() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [hasForecast, setHasForecast] = useState(false);
  const [solarFarmCapacity, setSolarFarmCapacity] = useState<number>(100.0);

  useEffect(() => {
    // Check if forecasted prices are available
    const forecastedPrices = localStorage.getItem('forecastedPrices');
    const useForecast = new URLSearchParams(window.location.search).get('useForecast');
    
    if (forecastedPrices && useForecast === 'true') {
      const prices = JSON.parse(forecastedPrices);
      setHasForecast(true);
      
      // Update suppliers with forecasted prices
      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier => {
          const countryKey = supplier.country as keyof typeof prices;
          if (prices[countryKey]) {
            return { ...supplier, basePrice: prices[countryKey] };
          }
          // For EAF routes, use EAF price
          if (supplier.steelRoute === 'Scrap-EAF' && prices.eaf) {
            return { ...supplier, basePrice: prices.eaf };
          }
          return supplier;
        })
      );
      
      // Clear the query parameter
      window.history.replaceState({}, '', window.location.pathname);
    } else if (forecastedPrices) {
      setHasForecast(true);
    }
  }, []);

  const addSupplier = () => {
    const country: 'US' | 'China' | 'India' = 'US';
    const steelRoute: 'BF-BOF' | 'Scrap-EAF' = 'BF-BOF';
    const tradePolicy = getDefaultTradePolicyValues(country, steelRoute);
    
    const newSupplier: Supplier = {
      id: `supplier-${Date.now()}`,
      name: '',
      country,
      steelRoute,
      basePrice: 0,
      conversionCost: 0,
      tariffRate: tradePolicy.tariffRate,
      antiDumpingDuty: tradePolicy.antiDumpingDuty,
      countervailingDuty: tradePolicy.countervailingDuty,
      domesticTaxCredits: tradePolicy.domesticTaxCredits,
      greenSteelSubsidies: tradePolicy.greenSteelSubsidies,
      supplierReliability: 5,
      leadTime: 30,
      supplyChainHandoffs: 1,
      minOrderCommitment: 0,
      brokerageFees: 0,
    };
    setSuppliers([...suppliers, newSupplier]);
  };

  const removeSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const updateSupplier = (id: string, field: keyof Supplier, value: any) => {
    setSuppliers(suppliers.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, [field]: value };
      
      // Auto-update trade policy values when country or steel route changes
      if (field === 'country' || field === 'steelRoute') {
        const tradePolicy = getDefaultTradePolicyValues(
          updated.country,
          updated.steelRoute
        );
        updated.tariffRate = tradePolicy.tariffRate;
        updated.antiDumpingDuty = tradePolicy.antiDumpingDuty;
        updated.countervailingDuty = tradePolicy.countervailingDuty;
        updated.domesticTaxCredits = tradePolicy.domesticTaxCredits;
        updated.greenSteelSubsidies = tradePolicy.greenSteelSubsidies;
      }
      
      return updated;
    }));
  };

  const saveAndContinue = () => {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('solarFarmCapacity', JSON.stringify(solarFarmCapacity));
    router.push('/transportation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Steel Procurement Decision Tool</h1>
        <p className="text-gray-600 mb-8">Page 1: Supplier Setup</p>

        {hasForecast && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-800 font-semibold">✓ Forecasted prices loaded</p>
                <p className="text-sm text-green-600">Base prices have been updated with forecasted values</p>
              </div>
              <button
                onClick={() => router.push('/forecast')}
                className="text-green-700 hover:text-green-800 underline text-sm"
              >
                Re-run Forecast
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solar Farm Capacity (MW)
                <Tooltip text="The total capacity of the solar farm project in megawatts. Used to calculate total steel tonnage required (approximately 40 tons per MW)." />
              </label>
              <input
                type="number"
                value={solarFarmCapacity}
                onChange={(e) => setSolarFarmCapacity(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Suppliers</h2>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/forecast')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                📊 Forecast Prices
              </button>
              <button
                onClick={addSupplier}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Add Supplier
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {suppliers.map((supplier, index) => (
              <div key={supplier.id} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Supplier {index + 1}</h3>
                  <button
                    onClick={() => removeSupplier(supplier.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                      <Tooltip text="The name or identifier of the steel supplier company" />
                    </label>
                    <input
                      type="text"
                      value={supplier.name}
                      onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                      <Tooltip text="Country of origin for the steel supplier. Affects tariffs, trade policies, and country risk factors." />
                    </label>
                    <select
                      value={supplier.country}
                      onChange={(e) => updateSupplier(supplier.id, 'country', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="US">US</option>
                      <option value="China">China</option>
                      <option value="India">India</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Steel Route
                      <Tooltip text="Production method: BF-BOF (traditional blast furnace, higher emissions) or Scrap-EAF (electric arc furnace using scrap, lower emissions)" />
                    </label>
                    <select
                      value={supplier.steelRoute}
                      onChange={(e) => updateSupplier(supplier.id, 'steelRoute', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      {Object.keys(STEEL_ROUTES).map(route => (
                        <option key={route} value={route}>{route}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (USD/ton)
                      <Tooltip text="The fundamental cost of raw steel per ton before any processing, tariffs, or additional fees. This is the starting point for all cost calculations." />
                    </label>
                    <input
                      type="number"
                      value={supplier.basePrice}
                      onChange={(e) => updateSupplier(supplier.id, 'basePrice', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conversion Cost (USD/ton)
                      <Tooltip text="Additional processing costs per ton for operations like slitting, galvanizing, coating, cutting, or other value-added services. Not all steel comes ready-to-use." />
                    </label>
                    <input
                      type="number"
                      value={supplier.conversionCost}
                      onChange={(e) => updateSupplier(supplier.id, 'conversionCost', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tariff Rate (%)
                      <Tooltip text="Standard import tariff percentage applied by the importing country. Auto-populated from 2024-2025 trade policy data. US: 0% (domestic), China/India: 50% (Section 232 tariff)." />
                    </label>
                    <input
                      type="number"
                      value={supplier.tariffRate}
                      onChange={(e) => updateSupplier(supplier.id, 'tariffRate', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anti-Dumping Duty (%)
                      <Tooltip text="Additional tariff percentage when supplier is found to be selling below fair market value. Auto-populated from 2024-2025 trade policy data. Protects domestic industries from unfair pricing." />
                    </label>
                    <input
                      type="number"
                      value={supplier.antiDumpingDuty}
                      onChange={(e) => updateSupplier(supplier.id, 'antiDumpingDuty', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Countervailing Duty (%)
                      <Tooltip text="Tariff percentage to offset foreign government subsidies. Auto-populated from 2024-2025 trade policy data. Levels the playing field when foreign governments subsidize production." />
                    </label>
                    <input
                      type="number"
                      value={supplier.countervailingDuty}
                      onChange={(e) => updateSupplier(supplier.id, 'countervailingDuty', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domestic Tax Credits (USD/ton)
                      <Tooltip text="Government incentives for sourcing domestically, such as IRA (Inflation Reduction Act) and Buy America provisions. Auto-populated from 2024-2025 trade policy data. Only applies to US suppliers." />
                    </label>
                    <input
                      type="number"
                      value={supplier.domesticTaxCredits}
                      onChange={(e) => updateSupplier(supplier.id, 'domesticTaxCredits', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Green Steel Subsidies (USD/ton)
                      <Tooltip text="Incentives for low-carbon steel production, such as Section 45Q carbon capture credits and IRA green energy incentives. Auto-populated from 2024-2025 trade policy data. Only applies to Scrap-EAF routes." />
                    </label>
                    <input
                      type="number"
                      value={supplier.greenSteelSubsidies}
                      onChange={(e) => updateSupplier(supplier.id, 'greenSteelSubsidies', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Reliability (1-10)
                      <Tooltip text="Measure of supplier's track record and dependability on a scale of 1-10. Higher scores indicate better historical performance, fewer quality issues, and more reliable contract fulfillment. Used in risk calculations." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={supplier.supplierReliability}
                      onChange={(e) => updateSupplier(supplier.id, 'supplierReliability', parseInt(e.target.value) || 5)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Time (days)
                      <Tooltip text="Time from order placement to delivery in days. Longer lead times increase inventory costs, reduce flexibility, and affect production planning. Used in risk score calculations." />
                    </label>
                    <input
                      type="number"
                      value={supplier.leadTime}
                      onChange={(e) => updateSupplier(supplier.id, 'leadTime', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supply Chain Handoffs
                      <Tooltip text="Number of intermediaries or transfer points in the supply chain. More handoffs increase complexity, potential for delays, errors, and points of failure. Used in risk score calculations." />
                    </label>
                    <input
                      type="number"
                      value={supplier.supplyChainHandoffs}
                      onChange={(e) => updateSupplier(supplier.id, 'supplyChainHandoffs', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Order Commitment (tons)
                      <Tooltip text="Minimum quantity required to place an order. Higher minimums reduce flexibility and can lock in capital. Currently captured but not directly used in calculations." />
                    </label>
                    <input
                      type="number"
                      value={supplier.minOrderCommitment}
                      onChange={(e) => updateSupplier(supplier.id, 'minOrderCommitment', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brokerage Fees (USD/ton)
                      <Tooltip text="Fees for customs clearance, documentation, logistics coordination, and other administrative costs. Often overlooked but can be significant. Added directly to total cost." />
                    </label>
                    <input
                      type="number"
                      value={supplier.brokerageFees}
                      onChange={(e) => updateSupplier(supplier.id, 'brokerageFees', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                {supplier.country && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>Country Factors:</strong> Cost Score: {COUNTRY_FACTORS[supplier.country].costScore.toFixed(2)}, 
                      Risk Score: {COUNTRY_FACTORS[supplier.country].riskScore.toFixed(2)}, 
                      Trade Score: {COUNTRY_FACTORS[supplier.country].tradeScore.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveAndContinue}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            Continue to Transportation →
          </button>
        </div>
      </div>
    </div>
  );
}

