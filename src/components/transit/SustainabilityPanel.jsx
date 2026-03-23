import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Zap, TrendingDown } from 'lucide-react';

export default function SustainabilityPanel() {
  const { data: metrics } = useQuery({
    queryKey: ['sustainability-metrics'],
    queryFn: async () => {
      return await base44.entities.SustainabilityMetric.list('-metric_date', 10);
    }
  });

  const latestMetric = metrics?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sustainability & CO₂ Optimizer</CardTitle>
        <CardDescription>Network-wide emissions tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span className="text-xs text-slate-600 font-semibold">Electric %</span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {latestMetric?.electric_percentage?.toFixed(0) || '—'}%
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Leaf className="w-3 h-3 text-orange-600" />
              <span className="text-xs text-slate-600 font-semibold">CO₂/pass·km</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {latestMetric?.co2_per_passenger_km?.toFixed(2) || '—'}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-slate-600 font-semibold">Potential</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {latestMetric?.potential_co2_reduction || '—'}%
            </div>
          </div>
        </div>

        {latestMetric?.optimization_suggestion && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm font-medium text-amber-900 mb-1">Recommendation</div>
            <div className="text-sm text-amber-800">{latestMetric.optimization_suggestion}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-slate-600 mb-1">Total CO₂ (kg)</div>
            <div className="font-bold text-slate-900">{latestMetric?.total_co2_kg?.toFixed(0) || '—'}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded">
            <div className="text-slate-600 mb-1">Passengers</div>
            <div className="font-bold text-slate-900">{latestMetric?.passengers_transported?.toLocaleString() || '—'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}