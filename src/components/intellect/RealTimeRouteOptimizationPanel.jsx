import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingDown, Clock, Leaf, DollarSign, Route } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function RealTimeRouteOptimizationPanel({ orgId, optimizeFor = 'time' }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState(null);

  useEffect(() => {
    const optimizeRoutes = async () => {
      try {
        const response = await base44.functions.invoke('realTimeRouteOptimizer', {
          organization_id: orgId,
          optimize_for: optimizeFor
        });
        setAnalysis(response.data);
      } catch (error) {
        console.error('Route optimization error:', error);
      } finally {
        setLoading(false);
      }
    };
    optimizeRoutes();
  }, [orgId, optimizeFor]);

  if (loading) {
    return <div className="p-6 text-slate-400">Analyzing routes for optimization...</div>;
  }

  if (!analysis) {
    return <div className="p-6 text-slate-400">No route data available</div>;
  }

  const { summary, optimized_routes, opportunities, recommendations } = analysis;

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">TIME SAVED</p>
              <p className="text-2xl font-bold text-cyan-400">{summary.total_time_savings_hours}h</p>
            </div>
            <Clock className="w-8 h-8 text-cyan-500/50" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">COST SAVED</p>
              <p className="text-2xl font-bold text-emerald-400">€{summary.total_cost_savings_euro}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500/50" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">CO2 REDUCED</p>
              <p className="text-2xl font-bold text-lime-400">{summary.total_co2_reduction_kg}kg</p>
            </div>
            <Leaf className="w-8 h-8 text-lime-500/50" />
          </div>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold">ROUTES</p>
              <p className="text-2xl font-bold text-violet-400">{summary.routes_analyzed}</p>
            </div>
            <Route className="w-8 h-8 text-violet-500/50" />
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-cyan-300">💡 AI Recommendations</p>
        {recommendations.map((rec, idx) => (
          <p key={idx} className="text-sm text-slate-300">{rec}</p>
        ))}
      </div>

      {/* Optimized Routes */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Route Optimization Details</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {optimized_routes.map((route, idx) => (
            <motion.div
              key={route.route_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setExpandedRoute(expandedRoute?.route_id === route.route_id ? null : route)}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white">{route.route_name}</p>
                  <p className="text-xs text-slate-400">{route.origin} → {route.destination}</p>
                </div>
                <Badge className={route.real_time_factors.recommended_action === 'ADOPT' ? 
                  'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                }>
                  {route.real_time_factors.recommended_action}
                </Badge>
              </div>

              {expandedRoute?.route_id === route.route_id && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Current Duration</p>
                      <p className="font-semibold text-white">{route.current_metrics.estimated_duration.toFixed(1)}h</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Optimized Duration</p>
                      <p className="font-semibold text-cyan-400">{route.optimized_metrics.estimated_duration.toFixed(1)}h</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">Cost Savings</p>
                      <p className="font-semibold text-emerald-400">€{route.savings.cost_euro}</p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400 mb-1">CO2 Reduction</p>
                      <p className="font-semibold text-lime-400">{route.savings.co2_kg}kg</p>
                    </div>
                  </div>

                  {route.alternative_routes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-2">Alternative Routes:</p>
                      <div className="space-y-1">
                        {route.alternative_routes.map((alt, i) => (
                          <div key={i} className="text-xs p-2 bg-slate-900/50 rounded text-slate-400">
                            <p className="font-medium text-slate-300">{alt.name}</p>
                            <p>{alt.reason} | {alt.duration.toFixed(1)}h | €{alt.cost.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Optimization Opportunities</h3>
          <div className="space-y-2">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <p className="font-semibold text-violet-300">{opp.category}</p>
                <p className="text-sm text-slate-300">{opp.description}</p>
                <p className="text-xs text-violet-400 mt-1">Potential savings: €{opp.potential_savings.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}