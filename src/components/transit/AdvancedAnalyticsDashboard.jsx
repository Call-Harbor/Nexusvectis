import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Activity, AlertTriangle, Zap, Clock, Users, Fuel, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AdvancedAnalyticsDashboard({ kpis, activeTrips, buses, trips }) {
  const [streamingData, setStreamingData] = useState(null);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    // Simuler real-time streaming data
    const interval = setInterval(() => {
      setStreamingData(prev => ({
        ...prev,
        avgDelay: (Math.random() * 15).toFixed(1),
        networkLoad: (65 + Math.random() * 30).toFixed(0),
        occupancyRate: (72 + Math.random() * 20).toFixed(0),
        fuelEfficiency: (85 + Math.random() * 10).toFixed(1),
        co2Saved: (Math.random() * 500).toFixed(0),
        predictedDelays: Math.floor(Math.random() * 8),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const delayedTrips = trips.filter(t => (t.delay_minutes || 0) > 5).length;
  const overloadedBuses = buses.filter(b => (b.passenger_count || 0) > (b.capacity_seated + b.capacity_standing) * 0.85).length;
  const avgOccupancy = buses.length > 0 
    ? (buses.reduce((sum, b) => sum + ((b.passenger_count || 0) / ((b.capacity_seated || 40) + (b.capacity_standing || 40)) * 100), 0) / buses.length).toFixed(0)
    : 0;

  const metrics = [
    {
      icon: AlertTriangle,
      label: "Predicted Delays",
      value: streamingData?.predictedDelays || 0,
      unit: "trips",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
      trend: "⚠️ Next 30min"
    },
    {
      icon: Users,
      label: "Avg Occupancy",
      value: avgOccupancy,
      unit: "%",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
      trend: "Real-time"
    },
    {
      icon: Activity,
      label: "Network Load",
      value: streamingData?.networkLoad || 72,
      unit: "%",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
      trend: "Live"
    },
    {
      icon: Fuel,
      label: "Fleet Efficiency",
      value: streamingData?.fuelEfficiency || 87,
      unit: "%",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      trend: "Today"
    },
    {
      icon: Wind,
      label: "CO₂ Reduction",
      value: streamingData?.co2Saved || 156,
      unit: "kg",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/30",
      trend: "Cumulative"
    },
    {
      icon: Clock,
      label: "Avg Delay",
      value: streamingData?.avgDelay || 2.4,
      unit: "min",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/30",
      trend: "Current"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <AnimatePresence mode="wait">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl border ${metric.bg} backdrop-blur-xl`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                    {metric.trend}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}{metric.unit}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Advanced Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Anomaly Detection */}
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Anomaly Detection
            </h3>
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">AI-Powered</Badge>
          </div>
          <div className="space-y-3">
            {[
              { name: "Line 42 overcapacity", severity: "high", probability: 87 },
              { name: "Driver 15 fatigue alert", severity: "high", probability: 72 },
              { name: "Stop B7 unusual dwell time", severity: "medium", probability: 54 },
              { name: "Bus 23 fuel consumption spike", severity: "medium", probability: 43 }
            ].map((anomaly, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === 'high' 
                    ? 'bg-rose-500/10 border-rose-500/20' 
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={anomaly.severity === 'high' ? 'text-rose-300 text-sm font-medium' : 'text-amber-300 text-sm font-medium'}>
                    {anomaly.name}
                  </p>
                  <span className="text-xs text-slate-500">{anomaly.probability}%</span>
                </div>
                <Progress value={anomaly.probability} className="h-1 mt-2" />
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Network Health */}
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Network Health
            </h3>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Healthy</Badge>
          </div>
          <div className="space-y-4">
            {[
              { label: "System Stability", value: 94 },
              { label: "Communication Latency", value: 98, inverse: true },
              { label: "Vehicle Tracking Coverage", value: 99 },
              { label: "Prediction Accuracy", value: 87 }
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{metric.label}</span>
                  <span className={`font-semibold ${
                    metric.value >= 90 ? 'text-emerald-400' : 
                    metric.value >= 75 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {metric.value}%
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Predictive Alerts */}
      <Card className="p-6 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          AI Predictive Alerts (Next 2 Hours)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { time: "14:25", event: "Line 7 congestion expected", impact: "High" },
            { time: "14:45", event: "Optimal time for depot charging (3 buses)", impact: "Savings" },
            { time: "15:10", event: "Driver shift change recommended (Bus 12)", impact: "Wellness" }
          ].map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-lg bg-slate-900/30 border border-violet-500/20 backdrop-blur-sm"
            >
              <p className="text-violet-300 font-semibold text-sm">{alert.time}</p>
              <p className="text-white mt-1 text-sm">{alert.event}</p>
              <Badge variant="outline" className="mt-2 bg-white/5 border-white/10 text-xs">
                {alert.impact}
              </Badge>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}