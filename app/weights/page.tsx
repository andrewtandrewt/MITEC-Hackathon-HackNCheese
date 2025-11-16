'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalculationWeights } from '@/types';
import Tooltip from '@/components/Tooltip';

export default function WeightsPage() {
  const router = useRouter();
  const [weights, setWeights] = useState<CalculationWeights>({
    cost: 0.4,
    carbon: 0.3,
    risk: 0.3,
  });

  useEffect(() => {
    const saved = localStorage.getItem('weights');
    if (saved) {
      setWeights(JSON.parse(saved));
    }
  }, []);

  const updateWeight = (key: keyof CalculationWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    
    // Normalize to ensure sum = 1.0
    const sum = newWeights.cost + newWeights.carbon + newWeights.risk;
    if (sum > 0) {
      newWeights.cost = newWeights.cost / sum;
      newWeights.carbon = newWeights.carbon / sum;
      newWeights.risk = newWeights.risk / sum;
    }
    
    setWeights(newWeights);
  };

  const handleSliderChange = (key: keyof CalculationWeights, value: number) => {
    const currentSum = weights.cost + weights.carbon + weights.risk;
    const otherSum = currentSum - weights[key];
    const newValue = Math.max(0, Math.min(1, value));
    
    // If other weights sum to 0, distribute evenly
    if (otherSum === 0) {
      const remaining = 1 - newValue;
      setWeights({
        [key]: newValue,
        cost: key === 'cost' ? newValue : remaining / 2,
        carbon: key === 'carbon' ? newValue : remaining / 2,
        risk: key === 'risk' ? newValue : remaining / 2,
      });
    } else {
      // Scale other weights proportionally
      const scale = (1 - newValue) / otherSum;
      setWeights({
        [key]: newValue,
        cost: key === 'cost' ? newValue : weights.cost * scale,
        carbon: key === 'carbon' ? newValue : weights.carbon * scale,
        risk: key === 'risk' ? newValue : weights.risk * scale,
      });
    }
  };

  const sum = weights.cost + weights.carbon + weights.risk;
  const isValid = Math.abs(sum - 1.0) < 0.01;

  const saveAndContinue = () => {
    if (!isValid) return;
    localStorage.setItem('weights', JSON.stringify(weights));
    router.push('/results');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Steel Procurement Decision Tool</h1>
        <p className="text-gray-600 mb-8">Page 2: Weight Configuration</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Set Decision Criteria Weights</h2>
          <p className="text-gray-600 mb-6">
            Adjust the sliders to assign importance to each factor. Weights must sum to 100%.
          </p>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-gray-700">
                  Cost Weight
                  <Tooltip text="Importance of total landed cost in the final recommendation. Higher weight means cost is more important. Lower total cost results in a higher score. Weights must sum to 100%." />
                </label>
                <span className="text-2xl font-bold text-blue-600">
                  {(weights.cost * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={weights.cost}
                onChange={(e) => handleSliderChange('cost', parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower total cost = higher score
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-gray-700">
                  Carbon Weight
                  <Tooltip text="Importance of carbon emissions in the final recommendation. Higher weight means environmental impact is more important. Lower total carbon emissions result in a higher score. Weights must sum to 100%." />
                </label>
                <span className="text-2xl font-bold text-green-600">
                  {(weights.carbon * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={weights.carbon}
                onChange={(e) => handleSliderChange('carbon', parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower carbon emissions = higher score
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-gray-700">
                  Risk Weight
                  <Tooltip text="Importance of supply chain risk in the final recommendation. Higher weight means risk factors (lead time, reliability, logistics complexity) are more important. Lower risk results in a higher score. Weights must sum to 100%." />
                </label>
                <span className="text-2xl font-bold text-red-600">
                  {(weights.risk * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={weights.risk}
                onChange={(e) => handleSliderChange('risk', parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower risk = higher score
              </p>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total:</span>
                <span className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {(sum * 100).toFixed(1)}%
                </span>
              </div>
              {!isValid && (
                <p className="text-sm text-red-600 mt-2">
                  Weights must sum to exactly 100%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition text-lg font-semibold"
          >
            ← Back to Suppliers
          </button>
          <button
            onClick={saveAndContinue}
            disabled={!isValid}
            className={`px-6 py-3 rounded-lg transition text-lg font-semibold ${
              isValid
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            View Results →
          </button>
        </div>
      </div>
    </div>
  );
}

