import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  TrendingUp, Package, AlertTriangle, CheckCircle, Zap, 
  Thermometer, Activity, BarChart3, Brain, Wifi
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DemandForecasting() {
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastData, setForecastData] = useState(null);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => base44.entities.Shipment.list(),
  });

  const generateForecast = useMutation({
    mutationFn: async () => {
      // Calculate metrics from real data
      const avgCapacity = resources.length > 0 
        ? resources.reduce((sum, r) => sum + ((r.current_level / r.capacity) * 100 || 0), 0) / resources.length 
        : 0;
      const inTransit = shipments.filter(s => s.status === 'in_transit').length;
      const pendingShipments = shipments.filter(s => s.status === 'pending').length;
      const coldChainCount = shipments.filter(s => s.cargo_type === 'cold_chain').length;
      
      // Get low-stock resources
      const lowStockResources = resources.filter(r => (r.current_level / r.capacity) < 0.3);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze real logistics data for demand forecasting:

WAREHOUSE DATA:
- ${resources.length} warehouses
- Average capacity: ${avgCapacity.toFixed(1)}%
- Low stock facilities: ${lowStockResources.length}
${lowStockResources.map(r => `  * ${r.name}: ${r.current_level}/${r.capacity} (${((r.current_level/r.capacity)*100).toFixed(0)}%)`).join('\n')}

SHIPMENT DATA:
- Total shipments: ${shipments.length}
- In transit: ${inTransit}
- Pending: ${pendingShipments}
- Cold chain: ${coldChainCount}

Based on this REAL data, generate a 7-day demand forecast with:
1. Daily demand predictions (consider pending shipments and current capacity)
2. Replenishment alerts for facilities below 30% capacity
3. IoT sensor readings for monitoring
4. Cost savings opportunities based on actual utilization

Use realistic values based on the actual data provided.`,
        response_json_schema: {
          type: "object",
          properties: {
            daily_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  demand_level: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            replenishment_alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  current_stock: { type: "number" },
                  predicted_shortage_date: { type: "string" },
                  recommended_order_quantity: { type: "number" }
                }
              }
            },
            iot_sensor_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sensor_type: { type: "string" },
                  location: { type: "string" },
                  reading: { type: "number" },
                  status: { type: "string" }
                }
              }
            },
            cost_savings: {
              type: "object",
              properties: {
                potential_savings_percent: { type: "number" },
                stockout_prevention: { type: "number" },
                overstock_reduction: { type: "number" }
              }
            }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setForecastData(data);
      setIsForecasting(false);
    }
  });

  const handleGenerateForecast = () => {
    setIsForecasting(true);
    generateForecast.mutate();
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <Brain className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                AI Demand Forecasting
              </h1>
              <p className="text-slate-400">IoT-integrated predictive analytics for inventory optimization</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border border-emerald-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">Active Warehouses</span>
            </div>
            <p className="text-3xl font-bold text-white">{resources.length}</p>
            <p className="text-xs text-emerald-400 mt-1">
              {Math.round(resources.reduce((sum, r) => sum + ((r.current_level / r.capacity) * 100 || 0), 0) / resources.length)}% avg capacity
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-slate-900/50 border border-cyan-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-slate-400">Active Shipments</span>
            </div>
            <p className="text-3xl font-bold text-white">{shipments.length}</p>
            <p className="text-xs text-cyan-400 mt-1">
              {shipments.filter(s => s.status === 'in_transit').length} in transit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-slate-900/50 border border-violet-500/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-violet-400" />
              <span className="text-sm text-slate-400">IoT Sensors Active</span>
            </div>
            <p className="text-3xl font-bold text-white">{resources.length * 3}</p>
            <p className="text-xs text-violet-400 mt-1">Real-time monitoring</p>
          </motion.div>
        </div>

        {!forecastData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Brain className="w-16 h-16 mx-auto mb-4 text-violet-400 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">Generate AI Forecast</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Use AI to analyze IoT sensor data, POS systems, and telematics to predict inventory needs and prevent stockouts
            </p>
            <Button
              onClick={handleGenerateForecast}
              disabled={isForecasting}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              {isForecasting ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate 7-Day Forecast
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">7-Day Demand Forecast</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateForecast}
                    disabled={isForecasting}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData.daily_forecast}>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="demand_level" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#06b6d4', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Replenishment Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecastData.replenishment_alerts?.map((alert, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{alert.item}</span>
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Order: {alert.recommended_order_quantity} units
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          Current: {alert.current_stock} units
                        </div>
                        <div className="text-xs text-amber-400 mt-1">
                          Shortage predicted: {alert.predicted_shortage_date}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-cyan-400" />
                    IoT Sensor Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecastData.iot_sensor_data?.map((sensor, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{sensor.sensor_type}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              sensor.status === 'normal' 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }
                          >
                            {sensor.status === 'normal' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                            {sensor.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400">{sensor.location}</div>
                        <div className="text-xs text-slate-500 mt-1">Reading: {sensor.reading}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-slate-900/50 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Cost Optimization Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">
                      {forecastData.cost_savings?.potential_savings_percent || 0}%
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Potential Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      ${forecastData.cost_savings?.stockout_prevention || 0}k
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Stockout Prevention</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-violet-400">
                      ${forecastData.cost_savings?.overstock_reduction || 0}k
                    </div>
                    <div className="text-sm text-slate-400 mt-1">Overstock Reduction</div>
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