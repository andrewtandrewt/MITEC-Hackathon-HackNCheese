'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transportation, TransportationSegment } from '@/types';
import { TRANSPORT_MODES } from '@/data/constants';

export default function TransportationPage() {
  const router = useRouter();
  const [transportation, setTransportation] = useState<Transportation>({
    segments: [
      { distance: 1000, mode: 'Ship' },
      { distance: 500, mode: 'Truck' },
    ],
  });

  useEffect(() => {
    const saved = localStorage.getItem('transportation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle legacy format (single mode/distance)
        if (parsed.mode && parsed.distance) {
          setTransportation({
            segments: [{ distance: parsed.distance, mode: parsed.mode }],
          });
        } else if (parsed.segments) {
          setTransportation(parsed);
        }
      } catch (e) {
        // Keep default
      }
    }
  }, []);

  const addSegment = () => {
    setTransportation({
      segments: [
        ...transportation.segments,
        { distance: 0, mode: 'Truck' },
      ],
    });
  };

  const removeSegment = (index: number) => {
    if (transportation.segments.length > 1) {
      setTransportation({
        segments: transportation.segments.filter((_, i) => i !== index),
      });
    }
  };

  const updateSegment = (index: number, field: keyof TransportationSegment, value: any) => {
    setTransportation({
      segments: transportation.segments.map((seg, i) =>
        i === index ? { ...seg, [field]: value } : seg
      ),
    });
  };

  // Calculate totals
  let totalCost = 0;
  let totalCO2 = 0;
  for (const segment of transportation.segments) {
    const transportConfig = TRANSPORT_MODES[segment.mode];
    totalCost += transportConfig.costPerTonKm * segment.distance * 1000; // for 1000 tons
    totalCO2 += (transportConfig.co2PerTonKm * segment.distance * 1000) / 1000000; // t CO2
  }

  const saveAndContinue = () => {
    localStorage.setItem('transportation', JSON.stringify(transportation));
    router.push('/weights');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Steel Procurement Decision Tool</h1>
        <p className="text-gray-600 mb-8">Page 2: Transportation Configuration</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Transportation Details</h2>
            <button
              onClick={addSegment}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Segment
            </button>
          </div>

          <div className="space-y-6">
            {transportation.segments.map((segment, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Segment {index + 1}</h3>
                  {transportation.segments.length > 1 && (
                    <button
                      onClick={() => removeSegment(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      value={segment.distance}
                      onChange={(e) => updateSegment(index, 'distance', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transport Mode
                    </label>
                    <select
                      value={segment.mode}
                      onChange={(e) => updateSegment(index, 'mode', e.target.value)}
                      className="w-full border border-gray-300 rounded px-4 py-2"
                    >
                      {Object.values(TRANSPORT_MODES).map(mode => (
                        <option key={mode.mode} value={mode.mode}>
                          {mode.mode} ({mode.co2PerTonKm} g CO₂/ton-km)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {segment.distance > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Segment Cost:</span>
                        <span className="font-semibold ml-2">
                          ${(TRANSPORT_MODES[segment.mode].costPerTonKm * segment.distance * 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Segment CO₂:</span>
                        <span className="font-semibold ml-2">
                          {((TRANSPORT_MODES[segment.mode].co2PerTonKm * segment.distance * 1000) / 1000000).toFixed(3)} t CO₂
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Freight Cost</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">for 1,000 tons</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transport CO₂</p>
                <p className="text-2xl font-bold text-green-700">
                  {totalCO2.toFixed(3)} t CO₂
                </p>
                <p className="text-xs text-gray-500 mt-1">for 1,000 tons</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Transport Mode Details:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Truck:</strong> 62 g CO₂/ton-km, ~$0.15/ton-km</li>
                <li><strong>Rail:</strong> 21 g CO₂/ton-km, ~$0.05/ton-km</li>
                <li><strong>Ship:</strong> 7 g CO₂/ton-km, ~$0.02/ton-km</li>
                <li><strong>Air:</strong> 570 g CO₂/ton-km, ~$1.50/ton-km</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Add multiple segments for multi-modal transport (e.g., Ship + Truck)
              </p>
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
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            Continue to Weights →
          </button>
        </div>
      </div>
    </div>
  );
}
