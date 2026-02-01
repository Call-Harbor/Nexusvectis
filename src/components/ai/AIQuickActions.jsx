import { motion } from "framer-motion";
import { Sparkles, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIQuickActions({ onOptimize, onPredict, onAnalyze }) {
  const actions = [
    {
      icon: TrendingUp,
      label: "Optimize Routes",
      description: "AI will suggest optimal routes",
      onClick: onOptimize,
      color: "from-cyan-500/20 to-cyan-500/5"
    },
    {
      icon: AlertTriangle,
      label: "Predictive Check",
      description: "Check for risks & issues",
      onClick: onPredict,
      color: "from-amber-500/20 to-amber-500/5"
    },
    {
      icon: Zap,
      label: "Analyze Data",
      description: "Deep performance analysis",
      onClick: onAnalyze,
      color: "from-violet-500/20 to-violet-500/5"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -2 }}
            onClick={action.onClick}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.color} border border-slate-700/50 backdrop-blur-xl hover:border-slate-600/50 transition-all text-left`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-xs text-slate-400">{action.description}</p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}