import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Activity, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FrequencyOptimizer({ routes, buses }) {
  const [optimizations, setOptimizations] = useState([]);

  useEffect(() => {
    // Simulate frequency optimization calculations
    const opts = routes.slice(0, 5).map(route => {
      const currentFreq = route.frequency_minutes || 15;
      const peakLoad = 75 + Math.random() * 20;
      const offPeakLoad = 30 + Math.random() * 20;
      
      const recommendedPeak = peakLoad > 85 ? Math.max(5, currentFreq - 3) : currentFreq;
      const recommendedOffPeak = offPeakLoad < 40 ? currentFreq + 5 : currentFreq;

      return {
        routeNumber: route.route_number,
        routeName: route.route_name,
        currentFrequency: currentFreq,
        peakLoad,
        offPeakLoad,
        recommendedPeak,
        recommendedOffPeak,
        potentialSavings: Math.round((currentFreq - recommendedPeak) * 1.2 * 1000),
        co2Reduction: Math.round((currentFreq - recommendedPeak) * 0.8)
      };
    });
    setOptimizations(opts);
  }, [routes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Frequency & Timetable Optimizer
        </h3>
        <p className="text-slate-400 mt-1">Dynamic frequency recommendations based on real-time demand</p>
      </div>

      <div className="space-y-4">
        {optimizations.map((opt, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-700/50 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-white">Route {opt.routeNumber}</span>
                  <span className="text-sm text-slate-400">• {opt.routeName}</span>
                </div>
                <div className="text-sm text-slate-400">
                  Current frequency: {opt.currentFrequency} min
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-orange-400/60">Peak Load</span>
                </div>
                <div className="text-2xl font-bold text-white">{Math.round(opt.peakLoad)}%</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400/60">Off-Peak Load</span>
                </div>
                <div className="text-2xl font-bold text-white">{Math.round(opt.offPeakLoad)}%</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-400/60">Rec. Peak</span>
                </div>
                <div className="text-2xl font-bold text-white">{opt.recommendedPeak} min</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400/60">Rec. Off-Peak</span>
                </div>
                <div className="text-2xl font-bold text-white">{opt.recommendedOffPeak} min</div>
              </div>
            </div>

            {opt.potentialSavings > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Potential savings: €{opt.potentialSavings.toLocaleString()}/year</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>CO₂ reduction: {opt.co2Reduction} kg/year</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}