import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lightbulb, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function AIInsightWidget({ entity_type, entity_id, compact = false }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${entity_type} with ID ${entity_id} and provide 2-3 actionable insights for optimization and risk management. Be specific and data-driven.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  action: { type: "string" }
                }
              }
            }
          }
        }
      });
      setInsights(result.insights || []);
    } catch (error) {
      console.error("Error generating insights:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    generateInsights();
  }, [entity_type, entity_id]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">AI Insights</span>
        </div>
        <div className="space-y-2">
          {insights.slice(0, 2).map((insight, i) => (
            <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
              <span className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${
                insight.priority === 'high' ? 'bg-red-400' :
                insight.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
              }`} />
              <span>{insight.title}</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
        </div>
        {loading && <div className="animate-spin"><Zap className="w-4 h-4 text-violet-400" /></div>}
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                insight.priority === 'high' ? 'bg-red-500/20' :
                insight.priority === 'medium' ? 'bg-amber-500/20' : 'bg-blue-500/20'
              }`}>
                {insight.priority === 'high' ? 
                  <AlertCircle className={`w-4 h-4 ${insight.priority === 'high' ? 'text-red-400' :
                  insight.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} /> :
                  <Lightbulb className={`w-4 h-4 ${insight.priority === 'high' ? 'text-red-400' :
                  insight.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'}`} />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                {insight.action && (
                  <p className="text-xs text-violet-300 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {insight.action}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}