import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, TrendingUp, Zap, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function FrequencyOptimizer({ organizationId }) {
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { data: lines = [] } = useQuery({
    queryKey: ['busLines', organizationId],
    queryFn: () => base44.entities.BusLine.filter({ organization_id: organizationId }),
    enabled: !!organizationId,
  });

  const optimizeMutation = useMutation({
    mutationFn: async (lineId) => {
      setIsOptimizing(true);
      const response = await base44.functions.invoke('transitFrequencyOptimizer', {
        organization_id: organizationId,
        line_id: lineId
      });
      setIsOptimizing(false);
      return response.data;
    },
    onSuccess: (data) => {
      setOptimization(data.optimization);
      toast.success(`Optimization complete for Line ${data.line}`);
    },
    onError: () => {
      setIsOptimizing(false);
      toast.error('Optimization failed');
    },
  });

  const selectedLine = lines.find(l => l.id === selectedLineId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Clock className="w-10 h-10 text-cyan-400" />
            Frequency & Timetable Optimizer
          </h2>
          <p className="text-slate-400 text-lg">AI-driven frequency optimization based on demand patterns</p>
        </div>
      </div>

      {/* Line Selection & Control */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50">
        <div className="flex gap-4">
          <Select value={selectedLineId} onValueChange={setSelectedLineId}>
            <SelectTrigger className="w-80 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select bus line to optimize..." />
            </SelectTrigger>
            <SelectContent>
              {lines.map(line => (
                <SelectItem key={line.id} value={line.id}>
                  Line {line.line_number} - {line.line_name} ({line.daily_trips || 0} trips/day)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => selectedLineId && optimizeMutation.mutate(selectedLineId)}
            disabled={!selectedLineId || isOptimizing}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 px-8"
          >
            <Zap className="w-5 h-5 mr-2" />
            {isOptimizing ? 'Optimizing...' : 'Run AI Optimization'}
          </Button>
        </div>

        {selectedLine && !optimization && (
          <div className="mt-4 p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
            <p className="text-white font-semibold mb-2">Line {selectedLine.line_number}: {selectedLine.line_name}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-slate-400">Daily Trips</p>
                <p className="text-white font-bold">{selectedLine.daily_trips || 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Route Length</p>
                <p className="text-white font-bold">{selectedLine.route_length_km || 0} km</p>
              </div>
              <div>
                <p className="text-slate-400">Annual Passengers</p>
                <p className="text-white font-bold">{(selectedLine.annual_passengers || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Optimization Loading */}
      {isOptimizing && (
        <Card className="p-12 bg-slate-800/50 border-slate-700/50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Clock className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <p className="text-white font-semibold text-xl mb-2">Analyzing Frequency Patterns...</p>
            <p className="text-slate-400">Processing trip data, load factors, and delay patterns</p>
          </div>
        </Card>
      )}

      {/* Optimization Results */}
      <AnimatePresence>
        {optimization && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Recommended Frequencies */}
            {optimization.recommended_frequencies?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Clock className="w-7 h-7 text-cyan-400" />
                  Recommended Frequency Schedule
                </h3>
                <div className="space-y-3">
                  {optimization.recommended_frequencies.map((freq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-bold text-lg">{freq.time_period}</h4>
                          <p className="text-sm text-slate-400">{freq.days}</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xl px-4 py-2">
                          {freq.frequency_minutes} min
                        </Badge>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{freq.justification}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bottlenecks Identified */}
            {optimization.bottlenecks?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7 text-rose-400" />
                  Identified Bottlenecks
                </h3>
                <div className="space-y-3">
                  {optimization.bottlenecks.map((bottleneck, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30"
                    >
                      <h4 className="text-white font-semibold mb-2">{bottleneck.location}</h4>
                      <p className="text-sm text-slate-300 mb-2">Impact: {bottleneck.impact}</p>
                      <div className="p-3 rounded-lg bg-slate-900/50 border border-emerald-500/20">
                        <p className="text-xs text-emerald-300 mb-1">Suggested Solution:</p>
                        <p className="text-sm text-white">{bottleneck.solution}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Dynamic Adjustments */}
            {optimization.dynamic_adjustments?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Zap className="w-7 h-7 text-violet-400" />
                  Dynamic Frequency Rules
                </h3>
                <div className="space-y-2">
                  {optimization.dynamic_adjustments.map((adj, i) => (
                    <div key={i} className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-semibold mb-1">Trigger: {adj.trigger}</p>
                          <p className="text-sm text-violet-300">→ {adj.adjustment}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Cost Impact Analysis */}
            {optimization.cost_impact && (
              <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-emerald-400" />
                  Financial Impact Projection
                </h3>
                <div className="grid grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-slate-900/50">
                    <p className="text-xs text-slate-400 mb-2">Current Monthly Cost</p>
                    <p className="text-4xl font-black text-white mb-1">€{(optimization.cost_impact.current_monthly_cost / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-900/50">
                    <p className="text-xs text-slate-400 mb-2">Optimized Cost</p>
                    <p className="text-4xl font-black text-white mb-1">€{(optimization.cost_impact.optimized_monthly_cost / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                    <p className="text-xs text-emerald-300 mb-2">Monthly Savings</p>
                    <p className="text-4xl font-black text-emerald-400">€{(optimization.cost_impact.savings / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-emerald-300 mt-1">
                      {((optimization.cost_impact.savings / optimization.cost_impact.current_monthly_cost) * 100).toFixed(1)}% reduction
                    </p>
                  </div>
                </div>
                
                <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-lg py-6">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Apply Optimized Schedule
                </Button>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!optimization && !isOptimizing && (
        <Card className="p-16 bg-slate-800/30 border-slate-700/50 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3">Frequency Optimization Ready</h3>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select a bus line and run AI optimization to receive data-driven frequency recommendations based on passenger demand, load patterns, and operational constraints
          </p>
        </Card>
      )}
    </div>
  );
}