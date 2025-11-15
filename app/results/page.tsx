'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Supplier, Transportation, CalculationWeights, SupplierResult } from '@/types';
import { calculateFinalScores } from '@/utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<SupplierResult[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transportation, setTransportation] = useState<Transportation | null>(null);
  const [weights, setWeights] = useState<CalculationWeights | null>(null);

  useEffect(() => {
    const suppliersData = localStorage.getItem('suppliers');
    const transportationData = localStorage.getItem('transportation');
    const weightsData = localStorage.getItem('weights');

    if (suppliersData && transportationData && weightsData) {
      const s: Supplier[] = JSON.parse(suppliersData);
      const t: Transportation = JSON.parse(transportationData);
      const w: CalculationWeights = JSON.parse(weightsData);

      setSuppliers(s);
      setTransportation(t);
      setWeights(w);

      const calculatedResults = calculateFinalScores(s, t, w, 1000);
      setResults(calculatedResults);
    }
  }, []);

  if (!transportation || !weights || results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No data available. Please start from the beginning.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Supplier Setup
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const costData = results.map(r => ({
    name: r.supplier.name || `Supplier (${r.supplier.country})`,
    cost: r.totalLandedCost,
  }));

  const carbonData = results.map(r => ({
    name: r.supplier.name || `Supplier (${r.supplier.country})`,
    carbon: r.totalCarbon,
  }));

  // Prepare radar chart data - need to normalize all values to 0-100 scale
  const maxCost = Math.max(...results.map(r => r.totalLandedCost));
  const maxCarbon = Math.max(...results.map(r => r.totalCarbon));
  
  const radarData = [
    {
      category: 'Cost',
      ...results.reduce((acc, r) => {
        const name = r.supplier.name || `Supplier (${r.supplier.country})`;
        acc[name] = (1 - (r.totalLandedCost / maxCost)) * 100;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      category: 'Carbon',
      ...results.reduce((acc, r) => {
        const name = r.supplier.name || `Supplier (${r.supplier.country})`;
        acc[name] = (1 - (r.totalCarbon / maxCarbon)) * 100;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      category: 'Risk',
      ...results.reduce((acc, r) => {
        const name = r.supplier.name || `Supplier (${r.supplier.country})`;
        acc[name] = (1 - r.supplierRiskScore) * 100;
        return acc;
      }, {} as Record<string, number>),
    },
  ];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Steel Procurement Decision Tool</h1>
        <p className="text-gray-600 mb-8">Page 4: Results Dashboard</p>

        {/* Rankings */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Supplier Rankings</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.supplier.id}
                className={`border-2 rounded-lg p-4 ${
                  index === 0
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <h3 className="text-xl font-semibold">
                        {result.supplier.name || `Supplier (${result.supplier.country})`}
                      </h3>
                      {index === 0 && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Final Score</p>
                        <p className="text-lg font-bold text-blue-600">
                          {(result.finalScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="text-lg font-bold">
                          ${result.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Carbon</p>
                        <p className="text-lg font-bold text-green-600">
                          {result.totalCarbon.toFixed(2)} t CO₂
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Risk Score</p>
                        <p className="text-lg font-bold text-red-600">
                          {(result.supplierRiskScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cost Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Total Landed Cost Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
                <Legend />
                <Bar dataKey="cost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Total Carbon Emissions Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carbonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} t CO₂`} />
                <Legend />
                <Bar dataKey="carbon" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Multi-Criteria Comparison (Radar Chart)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Higher values are better. Cost and Carbon are inverted (lower = higher score).
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              {results.map((result, index) => {
                const name = result.supplier.name || `Supplier (${result.supplier.country})`;
                return (
                  <Radar
                    key={result.supplier.id}
                    name={name}
                    dataKey={name}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                  />
                );
              })}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Detailed Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production CO₂</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport CO₂</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CO₂</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.supplier.id}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {result.supplier.name || `Supplier (${result.supplier.country})`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      ${result.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{result.productionCO2.toFixed(2)} t</td>
                    <td className="px-4 py-3 whitespace-nowrap">{result.transportCO2.toFixed(3)} t</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{result.totalCarbon.toFixed(2)} t</td>
                    <td className="px-4 py-3 whitespace-nowrap">{(result.supplierRiskScore * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600">
                      {(result.finalScore * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/weights')}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition text-lg font-semibold"
          >
            ← Back to Weights
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

