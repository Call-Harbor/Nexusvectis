import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, Zap } from 'lucide-react';

export default function CrowdingDashboard() {
  const { data: predictions, isLoading } = useQuery({
    queryKey: ['crowding-predictions'],
    queryFn: async () => {
      const results = await base44.entities.CrowdingPrediction.list('-predicted_at', 20);
      return results;
    }
  });

  const stats = {
    high: predictions?.filter(p => p.crowding_level === 'high').length || 0,
    medium: predictions?.filter(p => p.crowding_level === 'medium').length || 0,
    low: predictions?.filter(p => p.crowding_level === 'low').length || 0,
    atRisk: predictions?.filter(p => p.left_behind_risk).length || 0
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">High Crowding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{stats.high}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Medium Crowding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{stats.medium}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Crowding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.low}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Left Behind Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">{stats.atRisk}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Real-time Crowding Predictions</CardTitle>
          <CardDescription>Next 20 departures</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {predictions?.map((pred) => (
                <div key={pred.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Line {pred.line_id} • Bus {pred.bus_id}</div>
                    <div className="text-xs text-slate-500">{pred.occupancy_percentage.toFixed(0)}% capacity</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pred.crowding_level === 'high' ? 'bg-red-100 text-red-700' :
                    pred.crowding_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {pred.crowding_level.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}