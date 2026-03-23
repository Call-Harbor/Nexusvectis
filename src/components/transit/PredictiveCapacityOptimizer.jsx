import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingDown, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PredictiveCapacityOptimizer({ buses, trips, lines }) {
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      type: "bus_reallocation",
      from: { bus: "42", line: "7", passengers: 82, capacity: 90 },
      to: { bus: "18", line: "7", available: 45 },
      reason: "Bus 42 approaching overcapacity — Bus 18 has excess capacity on same route",
      impact: "Reduces congestion by 25%",
      confidence: 92,
      savings: "€12.50",
      status: "pending"
    },
    {
      id: 2,
      type: "express_route",
      currentRoute: "Line 5 (37 stops)",
      optimized: "Express Line 5 (24 stops)",
      stops: "Skip 13 low-demand stops",
      reason: "Predictive model shows 60% demand shift to express pattern",
      impact: "12 min faster, 15% cost reduction",
      confidence: 87,
      savings: "€156/day",
      status: "pending"
    },
    {
      id: 3,
      type: "dynamic_frequency",
      line: "Line 42",
      current: "Every 8 minutes",
      recommended: "Every 6 minutes (peak), 10 min (off-peak)",
      reason: "Passenger demand analysis shows clustering during rush hours",
      impact: "Reduce avg wait time 22%, better load distribution",
      confidence: 89,
      savings: "€42/day",
      status: "active"
    }
  ]);

  const handleApply = (id) => {
    setRecommendations(prev => 
      prev.map(r => r.id === id ? {...r, status: 'active'} : r)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-violet-400" />
            Predictive Capacity Optimizer
          </h2>
          <p className="text-slate-400 mt-1">AI-driven real-time capacity rebalancing</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recalculate
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30">
          <p className="text-emerald-300 text-sm font-medium">Potential Daily Savings</p>
          <p className="text-3xl font-bold text-white mt-1">€210</p>
          <p className="text-xs text-slate-500 mt-1">Across all active recommendations</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30">
          <p className="text-cyan-300 text-sm font-medium">Passengers Improved</p>
          <p className="text-3xl font-bold text-white mt-1">3,247</p>
          <p className="text-xs text-slate-500 mt-1">Better wait times & comfort</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30">
          <p className="text-violet-300 text-sm font-medium">Avg AI Confidence</p>
          <p className="text-3xl font-bold text-white mt-1">89%</p>
          <p className="text-xs text-slate-500 mt-1">Based on 24h pattern analysis</p>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-2xl border ${
              rec.status === 'active' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30'
            } transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {rec.type === 'bus_reallocation' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Bus Reallocation</Badge>
                  )}
                  {rec.type === 'express_route' && (
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Express Route</Badge>
                  )}
                  {rec.type === 'dynamic_frequency' && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Dynamic Frequency</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {rec.confidence}% confidence
                  </Badge>
                </div>

                {rec.type === 'bus_reallocation' && (
                  <div className="grid md:grid-cols-3 gap-4 my-3">
                    <div className="p-3 rounded-lg bg-slate-900/30">
                      <p className="text-xs text-slate-500 mb-1">From</p>
                      <p className="text-white font-semibold">Bus {rec.from.bus}</p>
                      <p className="text-xs text-slate-400">Line {rec.from.line}</p>
                      <div className="mt-2">
                        <Progress value={(rec.from.passengers / rec.from.capacity) * 100} className="h-1" />
                        <p className="text-xs text-amber-400 mt-1">{rec.from.passengers}/{rec.from.capacity} pax</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-slate-500 rotate-90" />
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/30">
                      <p className="text-xs text-slate-500 mb-1">To</p>
                      <p className="text-white font-semibold">Bus {rec.to.bus}</p>
                      <p className="text-xs text-slate-400">Line {rec.to.line}</p>
                      <div className="mt-2">
                        <Progress value={((rec.to.available || 0) / 90) * 100} className="h-1" />
                        <p className="text-xs text-emerald-400 mt-1">{rec.to.available} seats available</p>
                      </div>
                    </div>
                  </div>
                )}

                {rec.type === 'express_route' && (
                  <div className="p-3 rounded-lg bg-slate-900/30 my-3">
                    <p className="text-xs text-slate-500 mb-2">Route Optimization</p>
                    <p className="text-white text-sm"><strong>{rec.currentRoute}</strong> → <strong className="text-cyan-400">{rec.optimized}</strong></p>
                    <p className="text-xs text-slate-400 mt-1">{rec.stops}</p>
                  </div>
                )}

                {rec.type === 'dynamic_frequency' && (
                  <div className="p-3 rounded-lg bg-slate-900/30 my-3">
                    <p className="text-xs text-slate-500 mb-2">Frequency Change</p>
                    <p className="text-white text-sm"><strong>{rec.current}</strong> → <strong className="text-violet-400">{rec.recommended}</strong></p>
                  </div>
                )}

                <p className="text-sm text-slate-300 mb-2">{rec.reason}</p>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {rec.impact}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Save {rec.savings}
                  </Badge>
                </div>
              </div>

              <div className="ml-4">
                {rec.status === 'active' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">Active</span>
                  </motion.div>
                ) : (
                  <Button
                    onClick={() => handleApply(rec.id)}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 text-black font-semibold whitespace-nowrap"
                  >
                    Apply Rec.
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Smart Insights */}
      <Card className="p-6 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30">
        <h3 className="text-lg font-bold text-white mb-3">ML Insights</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>✨ <strong>Pattern detected:</strong> Mondays show 18% higher demand on Line 5 between 7-9am. Consider pre-deployment of 2 extra buses.</p>
          <p>✨ <strong>Optimization opportunity:</strong> Bus 23 consistently underutilized on Line 3 — recommend reassignment to Line 42.</p>
          <p>✨ <strong>Energy optimization:</strong> 4 electric buses ready for charging during 14:00-16:00 window (off-peak). Estimated 35% cost savings.</p>
        </div>
      </Card>
    </div>
  );
}