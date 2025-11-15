'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ForecastResult {
  success: boolean;
  total_steel_tons?: number;
  bf_cost_per_ton?: number;
  eaf_cost_per_ton?: number;
  forecasted_scrap_price?: number;
  cost_spread_per_ton?: number;
  total_project_cost_savings?: number;
  emissions_percent_savings?: number;
  cost_percent_savings?: number;
  bf_emissions_per_ton?: number;
  eaf_emissions_per_ton?: number;
  error?: string;
}

export default function ForecastPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mwCapacity: 100.0,
    futureYear: 2027,
    country: 'US',
    carbonTax: 50.0,
    bfAssumptions: {
      iron_ore: 130.0,
      coking_coal: 280.0,
      bf_fluxes: 50.0,
      scrap: 375.0,
      other_costs_bf: 50.0,
    },
    eafAssumptions: {
      electricity: 0.08,
      electrode: 2.5,
      eaf_fluxes: 60.0,
      other_costs_eaf: 40.0,
    },
  });

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleForecast = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/forecast-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Forecasting failed');
      }

      setResult(data);
      
      // Store forecasted prices for use in supplier setup
      const forecastedPrices = {
        US: data.bf_cost_per_ton || 850,
        China: data.bf_cost_per_ton ? data.bf_cost_per_ton * 0.85 : 650,
        India: data.bf_cost_per_ton ? data.bf_cost_per_ton * 0.9 : 720,
        eaf: data.eaf_cost_per_ton,
      };
      
      localStorage.setItem('forecastedPrices', JSON.stringify(forecastedPrices));
      localStorage.setItem('forecastResult', JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'An error occurred during forecasting');
    } finally {
      setLoading(false);
    }
  };

  const useForecastedPrices = () => {
    const forecastedPrices = localStorage.getItem('forecastedPrices');
    if (forecastedPrices) {
      router.push('/?useForecast=true');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Steel Price Forecasting</h1>
        <p className="text-gray-600 mb-8">Forecast future steel prices using SARIMAX model</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Forecasting Parameters</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solar Farm Capacity (MW)
                </label>
                <input
                  type="number"
                  value={formData.mwCapacity}
                  onChange={(e) => updateFormData('mwCapacity', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Future Construction Year
                </label>
                <input
                  type="number"
                  value={formData.futureYear}
                  onChange={(e) => updateFormData('futureYear', parseInt(e.target.value) || 2027)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="US">US</option>
                  <option value="China">China</option>
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                  <option value="Brazil">Brazil</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbon Tax ($/ton CO₂)
                </label>
                <input
                  type="number"
                  value={formData.carbonTax}
                  onChange={(e) => updateFormData('carbonTax', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">BF-BOF Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Iron Ore ($/ton)</label>
                  <input
                    type="number"
                    value={formData.bfAssumptions.iron_ore}
                    onChange={(e) => updateFormData('bfAssumptions.iron_ore', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coking Coal ($/ton)</label>
                  <input
                    type="number"
                    value={formData.bfAssumptions.coking_coal}
                    onChange={(e) => updateFormData('bfAssumptions.coking_coal', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BF Fluxes ($/ton)</label>
                  <input
                    type="number"
                    value={formData.bfAssumptions.bf_fluxes}
                    onChange={(e) => updateFormData('bfAssumptions.bf_fluxes', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scrap ($/ton)</label>
                  <input
                    type="number"
                    value={formData.bfAssumptions.scrap}
                    onChange={(e) => updateFormData('bfAssumptions.scrap', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Costs BF ($/ton)</label>
                  <input
                    type="number"
                    value={formData.bfAssumptions.other_costs_bf}
                    onChange={(e) => updateFormData('bfAssumptions.other_costs_bf', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">EAF Assumptions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electricity ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.eafAssumptions.electricity}
                    onChange={(e) => updateFormData('eafAssumptions.electricity', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Electrode ($/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.eafAssumptions.electrode}
                    onChange={(e) => updateFormData('eafAssumptions.electrode', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EAF Fluxes ($/ton)</label>
                  <input
                    type="number"
                    value={formData.eafAssumptions.eaf_fluxes}
                    onChange={(e) => updateFormData('eafAssumptions.eaf_fluxes', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Costs EAF ($/ton)</label>
                  <input
                    type="number"
                    value={formData.eafAssumptions.other_costs_eaf}
                    onChange={(e) => updateFormData('eafAssumptions.other_costs_eaf', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleForecast}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Forecasting...' : 'Run Forecast'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && result.success && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Forecast Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">BF-BOF Cost (Forecasted)</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${result.bf_cost_per_ton?.toFixed(2)} / ton
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Emissions: {result.bf_emissions_per_ton?.toFixed(2)} t CO₂/ton
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">EAF Cost (Forecasted)</p>
                <p className="text-2xl font-bold text-green-700">
                  ${result.eaf_cost_per_ton?.toFixed(2)} / ton
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Emissions: {result.eaf_emissions_per_ton?.toFixed(2)} t CO₂/ton
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Forecasted Scrap Price</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${result.forecasted_scrap_price?.toFixed(2)} / ton
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Cost Spread (BF - EAF)</p>
                <p className="text-2xl font-bold text-yellow-700">
                  ${result.cost_spread_per_ton?.toFixed(2)} / ton
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {result.cost_percent_savings && result.cost_percent_savings > 0
                    ? `${(result.cost_percent_savings * 100).toFixed(1)}% savings with EAF`
                    : `${Math.abs((result.cost_percent_savings || 0) * 100).toFixed(1)}% more expensive with EAF`}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Project Summary</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Total Steel Required:</strong> {result.total_steel_tons?.toLocaleString()} tons
                </li>
                <li>
                  <strong>Total Projected Savings:</strong> $
                  {result.total_project_cost_savings?.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </li>
                <li>
                  <strong>Emissions Savings:</strong>{' '}
                  {(result.emissions_percent_savings || 0) * 100}% (EAF vs BF)
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={useForecastedPrices}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Use Forecasted Prices in Supplier Setup →
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition text-lg font-semibold"
          >
            ← Back to Supplier Setup
          </button>
        </div>
      </div>
    </div>
  );
}

