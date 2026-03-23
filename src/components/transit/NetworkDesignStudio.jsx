import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, MapPin, Sparkles, Network, Zap, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function NetworkDesignStudio({ organizationId }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateProposalsMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const response = await base44.functions.invoke('transitNetworkAI', {
        organization_id: organizationId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
      toast.success('Network analysis complete');
    },
    onError: () => {
      setIsAnalyzing(false);
      toast.error('Analysis failed');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Network className="w-10 h-10 text-violet-400" />
            Network Design Studio
          </h2>
          <p className="text-slate-400 text-lg">AI-powered transit network optimization & route planning</p>
        </div>
        <Button
          onClick={() => generateProposalsMutation.mutate()}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-6 py-6 text-base"
        >
          <Brain className="w-5 h-5 mr-2" />
          {isAnalyzing ? 'Analyzing Network...' : 'Generate AI Proposals'}
        </Button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-12 bg-slate-800/50 border-slate-700/50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Brain className="w-16 h-16 text-violet-400" />
            </motion.div>
            <p className="text-white font-semibold text-lg mb-2">Analyzing Transit Network...</p>
            <p className="text-slate-400">Processing passenger flows, network topology, and demand patterns</p>
          </div>
        </Card>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* New Line Proposals */}
            {analysis.new_lines?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                  Proposed New Lines ({analysis.new_lines.length})
                </h3>
                <div className="space-y-4">
                  {analysis.new_lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-bold text-lg">{line.proposed_name}</h4>
                        <Badge className={`text-sm px-3 py-1 ${
                          line.priority === 'high' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          line.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {line.priority?.toUpperCase()} Priority
                        </Badge>
                      </div>
                      <p className="text-slate-300 mb-4 leading-relaxed">{line.route_description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-slate-900/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-cyan-400" />
                            <p className="text-xs text-slate-400">Daily Passengers</p>
                          </div>
                          <p className="text-2xl font-black text-white">{line.estimated_passengers_daily?.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900/50">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-amber-400" />
                            <p className="text-xs text-slate-400">Monthly Cost</p>
                          </div>
                          <p className="text-2xl font-black text-white">€{(line.estimated_cost_monthly / 1000).toFixed(0)}k</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500" size="sm">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve Line
                        </Button>
                        <Button variant="outline" size="sm">
                          Simulate
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Express Route Opportunities */}
            {analysis.express_routes?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Zap className="w-7 h-7 text-violet-400" />
                  Express Route Opportunities ({analysis.express_routes.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.express_routes.map((route, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, y: -3 }}
                      className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/30 hover:border-violet-400/50 transition-all"
                    >
                      <h4 className="text-white font-bold text-lg mb-2">{route.corridor}</h4>
                      <p className="text-slate-300 text-sm mb-3 leading-relaxed">{route.justification}</p>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/50">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span className="text-violet-300 font-semibold">Saves {route.time_saving_minutes} minutes</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Knot Points */}
            {analysis.knot_points?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Network className="w-7 h-7 text-emerald-400" />
                  Recommended Transfer Hubs ({analysis.knot_points.length})
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {analysis.knot_points.map((knot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
                      <h4 className="text-white font-semibold mb-2">{knot.location}</h4>
                      <p className="text-xs text-slate-400 mb-2">
                        {knot.connecting_lines?.length || 0} connecting lines
                      </p>
                      <p className="text-xs text-emerald-300">
                        Est. {knot.transfer_volume_estimate?.toLocaleString()} transfers/day
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Network Restructuring */}
            {analysis.network_restructuring && (
              <Card className="p-6 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/10 border-fuchsia-500/30">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Network className="w-7 h-7 text-fuchsia-400" />
                  Network Restructuring Proposal
                </h3>
                <div className="mb-4">
                  <h4 className="text-white font-semibold text-lg mb-2">{analysis.network_restructuring.concept}</h4>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-xl bg-slate-900/50">
                      <p className="text-xs text-fuchsia-300 mb-2 font-semibold">Backbone Lines (High Frequency)</p>
                      <div className="space-y-1">
                        {analysis.network_restructuring.backbone_lines?.map((line, i) => (
                          <div key={i} className="text-sm text-white">{line}</div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50">
                      <p className="text-xs text-violet-300 mb-2 font-semibold">Feeder Lines (Local Coverage)</p>
                      <div className="space-y-1">
                        {analysis.network_restructuring.feeder_lines?.map((line, i) => (
                          <div key={i} className="text-sm text-white">{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50">
                  <p className="text-xs text-slate-400 mb-2 font-semibold">Benefits:</p>
                  <div className="space-y-1">
                    {analysis.network_restructuring.benefits?.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Coverage Gaps */}
            {analysis.coverage_gaps?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <MapPin className="w-7 h-7 text-amber-400" />
                  Coverage Gaps ({analysis.coverage_gaps.length})
                </h3>
                <div className="space-y-3">
                  {analysis.coverage_gaps.map((gap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-semibold text-lg">{gap.area}</h4>
                          <p className="text-xs text-amber-300">Population: {gap.population_estimate?.toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">{gap.solution}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Create Coverage Plan
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <Card className="p-16 bg-slate-800/30 border-slate-700/50 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3">Network Intelligence Ready</h3>
          <p className="text-slate-400 text-lg mb-6 max-w-2xl mx-auto">
            Click "Generate AI Proposals" to analyze your transit network and receive AI-powered recommendations for:
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            {[
              'New high-demand route proposals',
              'Express route corridors',
              'Transfer hub optimization',
              'Coverage gap solutions'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}