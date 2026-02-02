import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, AlertTriangle, Package, Loader2, Sparkles, 
  BarChart3, Route, Clock, Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InventoryForecast({ resource_id, forecast_days = 30 }) {
  const [forecast, setForecast] = useState(null);

  const forecastMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('inventoryForecast', {
        resource_id,
        forecast_days
      });
      return data;
    },
    onSuccess: (data) => {
      setForecast(data.forecast);
    }
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Package className="w-5 h-5 text-emerald-400" />
          Inventory Forecasting & Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!forecast ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              AI-powered inventory forecasting analyzes trends, predicts demand, and optimizes warehouse operations.
            </p>
            <Button
              onClick={() => forecastMutation.mutate()}
              disabled={forecastMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold"
            >
              {forecastMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Inventory...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate {forecast_days}-Day Forecast
                </>
              )}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
                <TabsTrigger value="optimization">Optimize</TabsTrigger>
                <TabsTrigger value="risks">Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">AI Forecast Summary</h4>
                      <p className="text-sm text-slate-300">{forecast.overall_forecast}</p>
                    </div>
                  </div>
                </div>

                {forecast.seasonal_trends && forecast.seasonal_trends.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Seasonal Trends
                    </h4>
                    <div className="space-y-1">
                      {forecast.seasonal_trends.map((trend, idx) => (
                        <div key={idx} className="text-xs text-slate-400 pl-6">
                          • {trend}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="warehouses" className="space-y-3 mt-4">
                <AnimatePresence>
                  {forecast.warehouse_forecasts?.map((warehouse, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{warehouse.warehouse_name}</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Predicted Utilization: {warehouse.predicted_utilization}%
                          </p>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(warehouse.risk_level)}>
                          {warehouse.risk_level}
                        </Badge>
                      </div>

                      <div className="mb-3 p-2 rounded bg-slate-800/50">
                        <div className="text-xs text-slate-400 mb-1">Recommended Stock Level</div>
                        <div className="text-lg font-bold text-emerald-400">
                          {warehouse.recommended_stock_level} units
                        </div>
                      </div>

                      {warehouse.actions && warehouse.actions.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-400">Actions:</div>
                          {warehouse.actions.map((action, i) => (
                            <div key={i} className="text-xs text-slate-500 pl-4">
                              • {action}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="optimization" className="space-y-4 mt-4">
                {forecast.picking_optimization && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/10 border border-violet-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Route className="w-5 h-5 text-violet-400" />
                      <h4 className="font-semibold text-white">Picking Route Optimization</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-slate-900/50">
                      <span className="text-sm text-slate-400">Efficiency Score</span>
                      <span className="text-xl font-bold text-violet-400">
                        {forecast.picking_optimization.efficiency_score}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-slate-900/50">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400">
                        Time Savings: {forecast.picking_optimization.time_savings_estimate}
                      </span>
                    </div>

                    {forecast.picking_optimization.recommended_routes && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-400">Recommended Routes:</div>
                        {forecast.picking_optimization.recommended_routes.map((route, idx) => (
                          <div key={idx} className="text-xs text-slate-500 pl-4">
                            {idx + 1}. {route}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {forecast.automation_opportunities && forecast.automation_opportunities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Automation Opportunities
                    </h4>
                    <div className="space-y-1">
                      {forecast.automation_opportunities.map((opp, idx) => (
                        <div key={idx} className="text-xs text-slate-400 pl-6 py-1">
                          • {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="risks" className="space-y-3 mt-4">
                {forecast.risk_alerts && forecast.risk_alerts.length > 0 ? (
                  <AnimatePresence>
                    {forecast.risk_alerts.map((alert, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{alert.type}</span>
                              <Badge variant="outline" className="border-current">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{alert.description}</p>
                            <div className="text-xs opacity-75">
                              <strong>Recommendation:</strong> {alert.recommendation}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No critical risks detected</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForecast(null);
                forecastMutation.mutate();
              }}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Regenerate Forecast
            </Button>
          </motion.div>
        )}

        {forecastMutation.isError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            Failed to generate forecast. Please try again.
          </div>
        )}
      </CardContent>
    </Card>
  );
}