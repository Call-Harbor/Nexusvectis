import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FrequencyOptimizer({ organizationId }) {
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [optimization, setOptimization] = useState(null);

  const { data: lines = [] } = useQuery({
    queryKey: ['busLines', organizationId],
    queryFn: () => base44.entities.BusLine.filter({ organization_id: organizationId }),
  });

  const optimizeMutation = useMutation({
    mutationFn: (lineId) => base44.functions.invoke('transitFrequencyOptimizer', {
      organization_id: organizationId,
      line_id: lineId
    }),
    onSuccess: (response) => {
      setOptimization(response.data.optimization);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Frequency & Timetable Optimizer</h2>
      </div>

      <div className="flex gap-4">
        <Select value={selectedLineId} onValueChange={setSelectedLineId}>
          <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select line..." />
          </SelectTrigger>
          <SelectContent>
            {lines.map(line => (
              <SelectItem key={line.id} value={line.id}>
                Line {line.line_number} - {line.line_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => selectedLineId && optimizeMutation.mutate(selectedLineId)}
          disabled={!selectedLineId || optimizeMutation.isPending}
          className="bg-gradient-to-r from-cyan-500 to-violet-500"
        >
          <Zap className="w-4 h-4 mr-2" />
          {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Frequency'}
        </Button>
      </div>

      {optimization && (
        <div className="space-y-4">
          {/* Recommended Frequencies */}
          {optimization.recommended_frequencies?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Recommended Frequencies
              </h3>
              <div className="space-y-3">
                {optimization.recommended_frequencies.map((freq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{freq.time_period}</h4>
                        <p className="text-xs text-slate-400">{freq.days}</p>
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-lg px-3">
                        {freq.frequency_minutes} min
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">{freq.justification}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Cost Impact */}
          {optimization.cost_impact && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Cost Impact
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Current</p>
                  <p className="text-2xl font-black text-white">€{(optimization.cost_impact.current_monthly_cost / 1000).toFixed(0)}k</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Optimized</p>
                  <p className="text-2xl font-black text-white">€{(optimization.cost_impact.optimized_monthly_cost / 1000).toFixed(0)}k</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 mb-1">Savings</p>
                  <p className="text-2xl font-black text-emerald-400">€{(optimization.cost_impact.savings / 1000).toFixed(0)}k</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}