import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Leaf, TrendingDown, Route as RouteIcon, Truck, Ship, 
  Plane, Train, Zap, BarChart3, Award, Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function GreenTMS() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list(),
  });

  const totalCO2 = vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0);
  const avgEmissions = vehicles.length > 0 ? totalCO2 / vehicles.length : 0;

  const transportModeEmissions = [
    { name: 'Truck', emissions: vehicles.filter(v => v.type === 'truck').reduce((sum, v) => sum + (v.co2_emissions || 0), 0), color: '#10b981' },
    { name: 'Ship', emissions: vehicles.filter(v => v.type === 'ship').reduce((sum, v) => sum + (v.co2_emissions || 0), 0), color: '#3b82f6' },
    { name: 'Aircraft', emissions: vehicles.filter(v => v.type === 'aircraft').reduce((sum, v) => sum + (v.co2_emissions || 0), 0), color: '#ef4444' },
    { name: 'Train', emissions: vehicles.filter(v => v.type === 'train').reduce((sum, v) => sum + (v.co2_emissions || 0), 0), color: '#8b5cf6' },
  ].filter(t => t.emissions > 0);

  const optimizeRoutes = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze current logistics operations for CO2 optimization:
- Total fleet CO2: ${totalCO2.toFixed(2)} kg
- ${vehicles.length} vehicles across multiple transport modes
- ${routes.length} active routes

Generate green TMS recommendations:
1. Low-emission carrier alternatives for each transport mode
2. Route consolidation opportunities to reduce trips
3. Multimodal routing suggestions (combining train/ship/truck)
4. EU carbon reporting compliance metrics
5. Cost savings from emission reduction

Provide actionable recommendations with estimated CO2 reduction percentages.`,
        response_json_schema: {
          type: "object",
          properties: {
            carrier_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  transport_mode: { type: "string" },
                  current_carrier: { type: "string" },
                  green_alternative: { type: "string" },
                  co2_reduction_percent: { type: "number" },
                  cost_impact: { type: "string" }
                }
              }
            },
            consolidation_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  route_pair: { type: "string" },
                  current_trips: { type: "number" },
                  optimized_trips: { type: "number" },
                  co2_saved_kg: { type: "number" }
                }
              }
            },
            multimodal_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  route_name: { type: "string" },
                  current_mode: { type: "string" },
                  suggested_combination: { type: "string" },
                  co2_reduction_percent: { type: "number" }
                }
              }
            },
            eu_compliance: {
              type: "object",
              properties: {
                total_emissions_reduction_target: { type: "number" },
                current_vs_target_percent: { type: "number" },
                compliance_status: { type: "string" }
              }
            },
            total_savings: {
              type: "object",
              properties: {
                co2_reduction_kg: { type: "number" },
                cost_savings_annual: { type: "number" },
                implementation_timeline: { type: "string" }
              }
            }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setOptimizationResult(data);
      setIsOptimizing(false);
    }
  });

  const handleOptimize = () => {
    setIsOptimizing(true);
    optimizeRoutes.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Green Transport Management
              </h1>
              <p className="text-slate-400">CO2 tracking, multimodal optimization & EU compliance</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Total CO₂</span>
            </div>
            <p className="text-3xl font-bold text-white">{(totalCO2 / 1000).toFixed(1)}t</p>
            <p className="text-xs text-emerald-400 mt-1">Current emissions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-slate-900/50 border border-cyan-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-slate-400">Avg per Vehicle</span>
            </div>
            <p className="text-3xl font-bold text-white">{avgEmissions.toFixed(1)}kg</p>
            <p className="text-xs text-cyan-400 mt-1">CO₂ emissions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-slate-900/50 border border-violet-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <RouteIcon className="w-5 h-5 text-violet-400" />
              <span className="text-sm text-slate-400">Optimized Routes</span>
            </div>
            <p className="text-3xl font-bold text-white">{routes.filter(r => r.ai_optimized).length}</p>
            <p className="text-xs text-violet-400 mt-1">of {routes.length} total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-slate-900/50 border border-amber-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">EU Compliance</span>
            </div>
            <p className="text-3xl font-bold text-white">78%</p>
            <p className="text-xs text-amber-400 mt-1">Target: 85%</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Emissions by Transport Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transportModeEmissions}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="emissions" radius={[4, 4, 0, 0]}>
                      {transportModeEmissions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Fleet Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transportModeEmissions}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="emissions"
                    >
                      {transportModeEmissions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {!optimizationResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Leaf className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">Optimize for Sustainability</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              AI-powered route optimization prioritizing low-emission carriers, consolidation, and multimodal transport
            </p>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {isOptimizing ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing Routes...
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 mr-2" />
                  Generate Green Optimization
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Low-Emission Carrier Alternatives</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleOptimize} disabled={isOptimizing}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationResult.carrier_recommendations?.map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {rec.transport_mode === 'truck' && <Truck className="w-4 h-4 text-emerald-400" />}
                          {rec.transport_mode === 'ship' && <Ship className="w-4 h-4 text-cyan-400" />}
                          {rec.transport_mode === 'aircraft' && <Plane className="w-4 h-4 text-rose-400" />}
                          {rec.transport_mode === 'train' && <Train className="w-4 h-4 text-violet-400" />}
                          <span className="font-medium text-white">{rec.transport_mode}</span>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          -{rec.co2_reduction_percent}% CO₂
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-300">
                        <span className="text-slate-500">Current:</span> {rec.current_carrier} →{' '}
                        <span className="text-emerald-400">{rec.green_alternative}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Cost impact: {rec.cost_impact}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Route Consolidation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizationResult.consolidation_opportunities?.map((opp, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <div className="font-medium text-white mb-1">{opp.route_pair}</div>
                        <div className="text-sm text-slate-300">
                          {opp.current_trips} trips → {opp.optimized_trips} trips
                        </div>
                        <div className="text-xs text-cyan-400 mt-1">
                          Saves {opp.co2_saved_kg}kg CO₂
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Multimodal Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizationResult.multimodal_routes?.map((route, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                        <div className="font-medium text-white mb-1">{route.route_name}</div>
                        <div className="text-sm text-slate-300">
                          {route.current_mode} → {route.suggested_combination}
                        </div>
                        <div className="text-xs text-violet-400 mt-1">
                          -{route.co2_reduction_percent}% emissions
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Impact & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-400">
                      {optimizationResult.total_savings?.co2_reduction_kg || 0}kg
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Total CO₂ Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-cyan-400">
                      €{optimizationResult.total_savings?.cost_savings_annual || 0}k
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Annual Cost Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-violet-400">
                      {optimizationResult.eu_compliance?.current_vs_target_percent || 0}%
                    </div>
                    <div className="text-sm text-slate-400 mt-1">EU Target Progress</div>
                    <Badge 
                      variant="outline" 
                      className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      {optimizationResult.eu_compliance?.compliance_status || 'On Track'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}