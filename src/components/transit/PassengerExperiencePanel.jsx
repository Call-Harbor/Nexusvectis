import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingDown, Lightbulb, AlertCircle, Sparkles, CheckCircle2, TrendingUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PassengerExperiencePanel({ organizationId }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const response = await base44.functions.invoke('transitPassengerExperienceAI', {
        organization_id: organizationId
      });
      setIsAnalyzing(false);
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Experience analysis complete');
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
            <Users className="w-10 h-10 text-emerald-400" />
            Passenger Experience AI
          </h2>
          <p className="text-slate-400 text-lg">Identify pain points and improvement opportunities from feedback data</p>
        </div>
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-6 text-base"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Experience'}
        </Button>
      </div>

      {/* Analyzing State */}
      {isAnalyzing && (
        <Card className="p-12 bg-slate-800/50 border-slate-700/50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Users className="w-16 h-16 text-emerald-400" />
            </motion.div>
            <p className="text-white font-semibold text-xl mb-2">Analyzing Passenger Experience...</p>
            <p className="text-slate-400">Processing driver feedback, complaints, and service quality data</p>
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
            {/* Pain Points */}
            {analysis.pain_points?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <TrendingDown className="w-7 h-7 text-rose-400" />
                  Identified Pain Points ({analysis.pain_points.length})
                </h3>
                <div className="space-y-3">
                  {analysis.pain_points.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-bold text-lg">{point.category}</h4>
                          <p className="text-sm text-slate-400">{point.location}</p>
                        </div>
                        <Badge className={`text-sm px-3 py-1 ${
                          point.severity === 'critical' ? 'bg-rose-500/30 text-rose-300 border-rose-400/50' :
                          point.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {point.severity?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-300 mb-3 leading-relaxed">{point.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-rose-400">
                          <MessageSquare className="w-4 h-4" />
                          <span>{point.frequency} reports</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Root Causes */}
            {analysis.root_causes?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <AlertCircle className="w-7 h-7 text-amber-400" />
                  Root Cause Analysis
                </h3>
                <div className="space-y-3">
                  {analysis.root_causes.map((cause, i) => (
                    <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <p className="text-white font-semibold mb-2">{cause.issue}</p>
                      <p className="text-sm text-slate-300 mb-2">{cause.underlying_cause}</p>
                      <p className="text-xs text-amber-400">Affects ~{cause.affected_passengers?.toLocaleString()} passengers</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Wins */}
            {analysis.quick_wins?.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <Lightbulb className="w-7 h-7 text-amber-400" />
                  Quick Wins (Low Effort, High Impact)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {analysis.quick_wins.map((win, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <p className="text-slate-300">{win}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}

            {/* Improvement Actions */}
            {analysis.improvements?.length > 0 && (
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-violet-400" />
                  Improvement Action Plan ({analysis.improvements.length})
                </h3>
                <div className="space-y-4">
                  {analysis.improvements.map((improvement, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, y: -3 }}
                      className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-bold text-lg flex-1">{improvement.action}</h4>
                        <Badge className={`text-sm px-3 py-1 ml-3 ${
                          improvement.priority === 'high' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                          improvement.priority === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {improvement.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-slate-900/50">
                          <p className="text-xs text-slate-400 mb-1">Impact</p>
                          <p className="text-sm text-emerald-400 font-semibold">{improvement.impact}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/50">
                          <p className="text-xs text-slate-400 mb-1">Effort</p>
                          <p className="text-sm text-amber-400 font-semibold">{improvement.effort}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/50">
                          <p className="text-xs text-slate-400 mb-1">Est. Cost</p>
                          <p className="text-sm text-violet-400 font-semibold">€{improvement.estimated_cost?.toLocaleString()}</p>
                        </div>
                      </div>

                      <Button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" size="sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Schedule Implementation
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
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Users className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3">Experience Intelligence Ready</h3>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Analyze driver feedback, passenger complaints, and service quality data to identify concrete improvements
          </p>
        </Card>
      )}
    </div>
  );
}