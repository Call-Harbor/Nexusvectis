import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, TrendingDown, Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PassengerExperiencePanel({ organizationId }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('transitPassengerExperienceAI', {
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
          <h2 className="text-3xl font-bold text-white mb-2">Passenger Experience AI</h2>
          <p className="text-slate-400">Identify pain points and improvement opportunities</p>
        </div>
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="bg-gradient-to-r from-cyan-500 to-violet-500"
        >
          <Users className="w-4 h-4 mr-2" />
          {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Experience'}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-6">
          {/* Pain Points */}
          {analysis.pain_points?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                Pain Points
              </h3>
              <div className="space-y-3">
                {analysis.pain_points.map((point, i) => (
                  <div key={i} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{point.category}</h4>
                        <p className="text-xs text-slate-400">{point.location}</p>
                      </div>
                      <Badge className={`${
                        point.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                        point.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {point.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">{point.description}</p>
                    <p className="text-xs text-slate-500 mt-2">Frequency: {point.frequency} reports</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Wins */}
          {analysis.quick_wins?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Quick Wins
              </h3>
              <div className="space-y-2">
                {analysis.quick_wins.map((win, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-sm">{win}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Improvements */}
          {analysis.improvements?.length > 0 && (
            <Card className="p-6 bg-slate-800/50 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-violet-400" />
                Improvement Actions
              </h3>
              <div className="space-y-3">
                {analysis.improvements.map((improvement, i) => (
                  <div key={i} className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold">{improvement.action}</h4>
                      <Badge className={`${
                        improvement.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {improvement.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">Impact: {improvement.impact}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Effort: {improvement.effort}</span>
                      <span className="text-violet-400">Cost: €{improvement.estimated_cost?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}