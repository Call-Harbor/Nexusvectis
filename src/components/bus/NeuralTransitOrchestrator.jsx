import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Activity, Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NetworkDesignAI from "./NetworkDesignAI";
import FrequencyOptimizer from "./FrequencyOptimizer";
import VehicleDriverAssignment from "./VehicleDriverAssignment";
import RealTimeControlAI from "./RealTimeControlAI";

export default function NeuralTransitOrchestrator({ buses, routes, stops }) {
  const [orchestrationMetrics, setOrchestrationMetrics] = useState({
    networkHealth: 0,
    optimizationScore: 0,
    predictiveAccuracy: 0,
    realTimeAdjustments: 0,
    activeOptimizations: [],
  });

  useEffect(() => {
    // Simulate neural network optimization calculations
    const calculateNetworkHealth = () => {
      const onTimeBuses = buses.filter(b => Math.abs(b.delay_minutes || 0) <= 2).length;
      const health = buses.length > 0 ? (onTimeBuses / buses.length) * 100 : 0;
      
      const activeOptimizations = [];
      
      // Check for overcrowded buses
      buses.forEach(bus => {
        const loadPercentage = bus.capacity ? (bus.current_passengers / bus.capacity) * 100 : 0;
        if (loadPercentage > 85) {
          activeOptimizations.push({
            type: 'capacity',
            severity: 'high',
            bus: bus.bus_number,
            action: 'Deploy additional bus on route',
            impact: '+15% capacity'
          });
        }
      });

      // Check for delayed buses
      buses.forEach(bus => {
        if (bus.delay_minutes > 5) {
          activeOptimizations.push({
            type: 'delay',
            severity: 'medium',
            bus: bus.bus_number,
            action: 'Suggest short-turn to recover schedule',
            impact: '-3 min recovery'
          });
        }
      });

      // Check for low fuel buses
      buses.forEach(bus => {
        if (bus.fuel_level < 20) {
          activeOptimizations.push({
            type: 'fuel',
            severity: bus.fuel_level < 10 ? 'critical' : 'medium',
            bus: bus.bus_number,
            action: 'Reroute to nearest depot',
            impact: 'Prevent breakdown'
          });
        }
      });

      setOrchestrationMetrics({
        networkHealth: Math.round(health),
        optimizationScore: Math.round(85 + Math.random() * 10),
        predictiveAccuracy: Math.round(92 + Math.random() * 5),
        realTimeAdjustments: activeOptimizations.length,
        activeOptimizations: activeOptimizations.slice(0, 5),
      });
    };

    calculateNetworkHealth();
    const interval = setInterval(calculateNetworkHealth, 10000);
    return () => clearInterval(interval);
  }, [buses]);

  const severityColors = {
    critical: 'from-red-500/20 to-red-500/5 border-red-500/30',
    high: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    medium: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    low: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Neural Health Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-2xl border border-slate-700/50 p-8 relative overflow-hidden"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center"
            >
              <Brain className="w-7 h-7 text-violet-400" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Neural Transit Orchestration
              </h2>
              <p className="text-slate-400">AI-powered real-time network optimization</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Activity className="w-8 h-8 text-emerald-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
                  {orchestrationMetrics.networkHealth}%
                </div>
                <div className="text-sm text-emerald-400/60">Network Health</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Brain className="w-8 h-8 text-violet-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
                  {orchestrationMetrics.optimizationScore}%
                </div>
                <div className="text-sm text-violet-400/60">AI Optimization</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-cyan-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {orchestrationMetrics.predictiveAccuracy}%
                </div>
                <div className="text-sm text-cyan-400/60">Prediction Accuracy</div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <div className="relative">
                <Zap className="w-8 h-8 text-amber-400 mb-3" />
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">
                  {orchestrationMetrics.realTimeAdjustments}
                </div>
                <div className="text-sm text-amber-400/60">Active Adjustments</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* AI Engines Tabs */}
      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="realtime" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            Real-Time Control
          </TabsTrigger>
          <TabsTrigger value="network" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            Network Design
          </TabsTrigger>
          <TabsTrigger value="frequency" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Frequency Optimizer
          </TabsTrigger>
          <TabsTrigger value="assignment" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            Vehicle Assignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeControlAI buses={buses} />
        </TabsContent>

        <TabsContent value="network">
          <NetworkDesignAI routes={routes} stops={stops} buses={buses} />
        </TabsContent>

        <TabsContent value="frequency">
          <FrequencyOptimizer routes={routes} buses={buses} />
        </TabsContent>

        <TabsContent value="assignment">
          <VehicleDriverAssignment buses={buses} routes={routes} />
        </TabsContent>
      </Tabs>

      {/* Active AI Optimizations */}
      {orchestrationMetrics.activeOptimizations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-2xl border border-slate-700/50 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                AI Recommendations
              </h3>
              <p className="text-slate-400 text-sm">Real-time network optimizations</p>
            </div>
          </div>

          <div className="space-y-3">
            {orchestrationMetrics.activeOptimizations.map((opt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 4, backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                className={`p-4 rounded-xl bg-gradient-to-br ${severityColors[opt.severity]} transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {opt.severity === 'critical' ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : opt.severity === 'high' ? (
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                      ) : (
                        <Activity className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">Bus {opt.bus}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/50 text-slate-300 capitalize">
                          {opt.type}
                        </span>
                      </div>
                      <div className="text-slate-300 text-sm mb-2">{opt.action}</div>
                      <div className="text-xs text-slate-400">Impact: {opt.impact}</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:from-emerald-500/30 hover:to-teal-500/30 transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}