import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Wrench, AlertTriangle, Thermometer, TrendingUp, BarChart3, DollarSign,
  Brain, Cpu, Network, Zap, GitBranch, Activity, Layers, Radar, Target, Workflow
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import PredictiveMaintenance from "@/components/ai/PredictiveMaintenance";
import ExceptionManagement from "@/components/ai/ExceptionManagement";
import ColdChainMonitor from "@/components/shipments/ColdChainMonitor";
import AIChat from "@/components/ai/AIChat";
import AdvancedModelMonitoring from "@/components/intellect/AdvancedModelMonitoring";
import NeuroSymbolicRiskPanel from "@/components/intellect/NeuroSymbolicRiskPanel";
import ParallelTaskProcessor from "@/components/intellect/ParallelTaskProcessor";
import ScenarioPredictionEngine from "@/components/intellect/ScenarioPredictionEngine";

export default function AIOptimization() {
  const [activeTab, setActiveTab] = useState("neural");
  const [loadingKPIs, setLoadingKPIs] = useState(false);
  const [kpiData, setKpiData] = useState(null);
  const [aiMetrics, setAiMetrics] = useState({
    neural_accuracy: 0,
    symbolic_coverage: 0,
    ensemble_confidence: 0,
    active_agents: 0
  });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Vehicle.filter({ organization_id: orgId });
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenance', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Maintenance.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Exception.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments', currentUser?.organization_id, currentUser?.data?.organization_id],
    queryFn: async () => {
      const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
      if (!orgId) return [];
      return base44.entities.Shipment.filter({ organization_id: orgId }, '-created_date');
    },
    enabled: !!(currentUser?.organization_id || currentUser?.data?.organization_id),
  });

  const resolveExceptionMutation = useMutation({
    mutationFn: (id) => base44.entities.Exception.update(id, { status: 'resolved', resolved_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exceptions'] }),
  });

  // Real-time AI metrics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAiMetrics({
        neural_accuracy: 92 + Math.random() * 6,
        symbolic_coverage: 88 + Math.random() * 8,
        ensemble_confidence: 94 + Math.random() * 5,
        active_agents: Math.floor(12 + Math.random() * 8)
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAllKPIs = async () => {
    setLoadingKPIs(true);
    const orgId = currentUser?.organization_id || currentUser?.data?.organization_id;
    
    try {
      const [kpis, fleet, routes, shipments, resources, costs] = await Promise.all([
        base44.functions.invoke('calculateKPIs', { organization_id: orgId, period: 'month' }),
        base44.functions.invoke('getFleetAnalytics', { organization_id: orgId }),
        base44.functions.invoke('getRoutePerformance', { organization_id: orgId }),
        base44.functions.invoke('getShipmentMetrics', { organization_id: orgId }),
        base44.functions.invoke('getResourceUtilization', { organization_id: orgId }),
        base44.functions.invoke('getCostAnalysis', { organization_id: orgId, currency: 'EUR' })
      ]);
      
      setKpiData({
        kpis: kpis.data.kpis,
        fleet: fleet.data.analytics,
        routes: routes.data.performance,
        shipments: shipments.data.metrics,
        resources: resources.data.utilization,
        costs: costs.data.analysis
      });
    } catch (error) {
      console.error('Error loading KPIs:', error);
    } finally {
      setLoadingKPIs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
                <Brain className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Advanced AI Optimization
                </h1>
                <p className="text-slate-400 mt-1">Multi-modal neural systems • Neuro-symbolic reasoning • Parallel intelligence</p>
              </div>
            </div>

            {/* Real-time AI Status */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Neural Accuracy</span>
                </div>
                <div className="text-2xl font-bold text-white">{aiMetrics.neural_accuracy.toFixed(1)}%</div>
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-400">Active Agents</span>
                </div>
                <div className="text-2xl font-bold text-white">{aiMetrics.active_agents}</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50 mb-6 flex-wrap gap-2">
            <TabsTrigger 
              value="neural" 
              className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
            >
              <Brain className="w-4 h-4 mr-2" />
              Neural Networks
            </TabsTrigger>
            <TabsTrigger 
              value="symbolic" 
              className="data-[state=active]:bg-fuchsia-500/20 data-[state=active]:text-fuchsia-400"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Neuro-Symbolic
            </TabsTrigger>
            <TabsTrigger 
              value="parallel" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              <Workflow className="w-4 h-4 mr-2" />
              Parallel Processing
            </TabsTrigger>
            <TabsTrigger 
              value="scenarios" 
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              <Radar className="w-4 h-4 mr-2" />
              Scenario Prediction
            </TabsTrigger>
            <TabsTrigger 
              value="maintenance" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Predictive Maintenance
            </TabsTrigger>
            <TabsTrigger 
              value="exceptions" 
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Exception Management
            </TabsTrigger>
            <TabsTrigger 
              value="coldchain" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
            >
              <Thermometer className="w-4 h-4 mr-2" />
              Cold Chain
            </TabsTrigger>
            <TabsTrigger 
              value="kpis" 
              className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Advanced KPIs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="neural">
            <AdvancedModelMonitoring vehicles={vehicles} />
          </TabsContent>

          <TabsContent value="symbolic">
            <NeuroSymbolicRiskPanel 
              vehicles={vehicles}
              exceptions={exceptions}
              shipments={shipments}
            />
          </TabsContent>

          <TabsContent value="parallel">
            <ParallelTaskProcessor 
              vehicles={vehicles}
              routes={[]}
              shipments={shipments}
            />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioPredictionEngine 
              vehicles={vehicles}
              historicalData={{
                maintenance: maintenanceRecords,
                exceptions: exceptions,
                shipments: shipments
              }}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <PredictiveMaintenance 
              maintenanceRecords={maintenanceRecords}
              vehicles={vehicles}
            />
          </TabsContent>

          <TabsContent value="exceptions">
            <ExceptionManagement 
              exceptions={exceptions}
              onResolve={(id) => resolveExceptionMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="coldchain">
            <ColdChainMonitor shipments={shipments} />
          </TabsContent>

          <TabsContent value="kpis">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">KPI Dashboard</h2>
                  <p className="text-slate-400 mt-1">Comprehensive performance metrics & analytics</p>
                </div>
                <Button 
                  onClick={loadAllKPIs} 
                  disabled={loadingKPIs}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  {loadingKPIs ? 'Loading...' : 'Load All KPIs'}
                </Button>
              </div>

              {kpiData && (
                <>
                  {/* Overall KPIs */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Overall Performance KPIs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Fleet Utilization</div>
                          <div className="text-2xl font-bold text-white mt-1">{kpiData.kpis.fleet_utilization.toFixed(1)}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">On-Time Delivery</div>
                          <div className="text-2xl font-bold text-white mt-1">{kpiData.kpis.on_time_delivery_rate.toFixed(1)}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Efficiency Score</div>
                          <div className="text-2xl font-bold text-white mt-1">{kpiData.kpis.overall_efficiency_score.toFixed(0)}/100</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">AI Optimized Routes</div>
                          <div className="text-2xl font-bold text-white mt-1">{kpiData.kpis.ai_optimized_routes}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fleet Analytics */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Fleet Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Total Fleet</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.fleet.total_fleet_size}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Avg Fuel Level</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.fleet.average_fuel_level}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Cargo Utilization</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.fleet.cargo_utilization}%</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm text-slate-400 mb-2">By Transport Type</h4>
                        <div className="space-y-2">
                          {Object.entries(kpiData.fleet.by_transport_type).map(([type, data]) => (
                            <div key={type} className="flex items-center justify-between p-3 rounded bg-slate-900/30">
                              <span className="text-white capitalize">{type}</span>
                              <div className="flex gap-4 text-sm">
                                <span className="text-slate-400">Count: <span className="text-white">{data.count}</span></span>
                                <span className="text-slate-400">Active: <span className="text-emerald-400">{data.active}</span></span>
                                <span className="text-slate-400">Util: <span className="text-cyan-400">{data.utilization_rate}%</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Route Performance */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Route Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Total Routes</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.routes.total_routes}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Active</div>
                          <div className="text-xl font-bold text-emerald-400 mt-1">{kpiData.routes.by_status.active || 0}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">AI Optimization Rate</div>
                          <div className="text-xl font-bold text-cyan-400 mt-1">{kpiData.routes.ai_optimization_rate}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Avg Distance</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.routes.average_distance_km} km</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Analysis */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        Cost Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Total Costs</div>
                          <div className="text-xl font-bold text-white mt-1">€{kpiData.costs.total_costs.total}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Fuel</div>
                          <div className="text-xl font-bold text-amber-400 mt-1">€{kpiData.costs.total_costs.fuel}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Maintenance</div>
                          <div className="text-xl font-bold text-blue-400 mt-1">€{kpiData.costs.total_costs.maintenance}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Carbon Tax</div>
                          <div className="text-xl font-bold text-red-400 mt-1">€{kpiData.costs.total_costs.carbon_tax}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm text-slate-400 mb-2">Potential Savings</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <div className="text-emerald-400 text-xs">AI Optimization</div>
                            <div className="text-lg font-bold text-white mt-1">€{kpiData.costs.potential_savings.ai_optimization}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <div className="text-emerald-400 text-xs">Predictive Maintenance</div>
                            <div className="text-lg font-bold text-white mt-1">€{kpiData.costs.potential_savings.predictive_maintenance}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <div className="text-emerald-400 text-xs">Fuel Efficiency</div>
                            <div className="text-lg font-bold text-white mt-1">€{kpiData.costs.potential_savings.fuel_efficiency}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shipment Metrics */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Shipment Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Total Shipments</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.shipments.total_shipments}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">In Transit</div>
                          <div className="text-xl font-bold text-cyan-400 mt-1">{kpiData.shipments.by_status.in_transit || 0}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">On-Time Rate</div>
                          <div className="text-xl font-bold text-emerald-400 mt-1">{kpiData.shipments.on_time_rate}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">ETA Confidence</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.shipments.average_eta_confidence}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resource Utilization */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-white">Resource Utilization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Total Resources</div>
                          <div className="text-xl font-bold text-white mt-1">{kpiData.resources.total_resources}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Utilization Rate</div>
                          <div className="text-xl font-bold text-cyan-400 mt-1">{kpiData.resources.overall_utilization_rate}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Operational</div>
                          <div className="text-xl font-bold text-emerald-400 mt-1">{kpiData.resources.operational_rate}%</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900/50">
                          <div className="text-slate-400 text-sm">Near Capacity</div>
                          <div className="text-xl font-bold text-amber-400 mt-1">{kpiData.resources.near_capacity}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!kpiData && !loadingKPIs && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Click "Load All KPIs" to view comprehensive metrics</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chat Assistant */}
      <AIChat />
    </div>
  );
}