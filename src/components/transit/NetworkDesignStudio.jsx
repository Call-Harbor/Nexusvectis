import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, TrendingUp, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NetworkDesignStudio({ organizationId }) {
  const [analysis, setAnalysis] = useState(null);

  const generateProposalsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('transitNetworkAI', {
      organization_id: organizationId
    }),
    onSuccess: (response) => {
      setAnalysis(response.data.analysis);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Network Design Studio</h2>
          <p className="text-slate-400">AI-powered network optimization and route planning</p>
        </div>
        <Button
          onClick={() => generateProposalsMutation.mutate()}
          disabled={generateProposalsMutation.isPending}
          className="bg-gradient-to-r from-cyan-500 to-violet-500"
        >
          <Brain className="w-4 h-4 mr-2" />
          {generateProposalsMutation.isPending ? 'Analyzing...' : 'Generate AI Proposals'}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* New Lines */}
          {analysis.new_lines?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Proposed New Lines
              </h3>
              <div className="space-y-3">
                {analysis.new_lines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold">{line.proposed_name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        line.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                        line.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {line.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-3">{line.route_description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Est. Daily Passengers</p>
                        <p className="text-white font-semibold">{line.estimated_passengers_daily?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Monthly Cost</p>
                        <p className="text-white font-semibold">€{line.estimated_cost_monthly?.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Express Routes */}
          {analysis.express_routes?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-400" />
                Express Route Opportunities
              </h3>
              <div className="space-y-3">
                {analysis.express_routes.map((route, i) => (
                  <div key={i} className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <h4 className="text-white font-semibold mb-1">{route.corridor}</h4>
                    <p className="text-sm text-slate-300 mb-2">{route.justification}</p>
                    <p className="text-xs text-violet-400">⚡ Saves {route.time_saving_minutes} min</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Coverage Gaps */}
          {analysis.coverage_gaps?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                Coverage Gaps
              </h3>
              <div className="space-y-3">
                {analysis.coverage_gaps.map((gap, i) => (
                  <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <h4 className="text-white font-semibold mb-1">{gap.area}</h4>
                    <p className="text-sm text-slate-300 mb-2">Population: {gap.population_estimate?.toLocaleString()}</p>
                    <p className="text-xs text-amber-400">→ {gap.solution}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!analysis && !generateProposalsMutation.isPending && (
        <Card className="p-12 bg-slate-800/30 border-slate-700/50 text-center">
          <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Click "Generate AI Proposals" to analyze your network</p>
        </Card>
      )}
    </div>
  );
}