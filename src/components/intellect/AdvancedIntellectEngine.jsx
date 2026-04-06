import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { Brain, Loader2, Sparkles, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';

export const useAdvancedIntellect = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const executeCommand = useCallback(async (commandType, context = {}) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await base44.functions.invoke('advancedIntellectOrchestration', {
        command: { type: commandType },
        context
      });

      if (response.data?.error) {
        setError(response.data.error);
      } else {
        setResults(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeCommand, loading, results, error };
};

const InsightCard = ({ title, icon: Icon, content, color = 'cyan' }) => {
  const colorMap = {
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  };
  const colors = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
        <p className={`text-xs font-bold ${colors.text}`}>{title}</p>
      </div>
      <div className="text-slate-300 text-xs leading-relaxed prose prose-xs prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:text-xs prose-headings:text-slate-200 prose-strong:text-slate-200">
        {typeof content === 'string' ? <ReactMarkdown>{content}</ReactMarkdown> : <p>{String(content)}</p>}
      </div>
    </motion.div>
  );
};

export const AdvancedCommandPanel = ({ onCommand }) => {
  const commands = [
    { id: 'multi_modal_fleet_analysis', label: '🚛 Multi-Modal Fleet DNA', icon: Brain, color: 'cyan', desc: 'Complete fleet health, efficiency patterns & predictive risks' },
    { id: 'neural_route_optimization', label: '🗺️ Neural Route Mastery', icon: TrendingUp, color: 'violet', desc: 'AI-driven route optimization with CO₂ & cost analysis' },
    { id: 'predictive_maintenance_ml', label: '⚠️ Maintenance Prophecy', icon: AlertTriangle, color: 'amber', desc: 'ML-powered failure prediction & maintenance scheduling' },
    { id: 'carbon_footprint_analytics', label: '🌍 Carbon Intelligence', icon: Sparkles, color: 'emerald', desc: 'Real-time CO₂ tracking & sustainability recommendations' },
    { id: 'shipment_intelligence', label: '📦 Shipment IQ', icon: Zap, color: 'cyan', desc: 'ETA precision, delay risk detection & customer impact' },
    { id: 'driver_performance_ai', label: '👤 Driver AI Profiling', icon: TrendingUp, color: 'violet', desc: 'Performance scoring, safety patterns & skill gaps' },
    { id: 'cost_optimization_engine', label: '💰 Financial Autopsy', icon: AlertTriangle, color: 'amber', desc: 'Cost breakdown, ROI on optimizations & savings potential' },
    { id: 'supply_chain_forecast', label: '🔮 Supply Chain Oracle', icon: Sparkles, color: 'emerald', desc: '30/60/90-day demand & inventory forecasting' },
    { id: 'competitive_benchmarking', label: '📊 Benchmark Battle', icon: Zap, color: 'cyan', desc: 'Industry comparison & competitive positioning insights' },
    { id: 'swarm_optimization', label: '🐜 Fleet Swarm Logic', icon: Brain, color: 'violet', desc: 'Multi-vehicle coordination & dynamic fleet optimization' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {commands.map(cmd => (
        <motion.button
          key={cmd.id}
          onClick={() => onCommand(cmd.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-auto flex flex-col items-start gap-1.5 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all group"
          style={{
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-start justify-between w-full">
            <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{cmd.label}</span>
          </div>
          <span className="text-[10px] text-slate-400 leading-tight">{cmd.desc}</span>
        </motion.button>
      ))}
    </div>
  );
};

export const InsightRenderer = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Analyzing...</span>
      </div>
    );
  }

  if (!data) return null;

  const analysis = data.analysis || data.optimizations || data.predictions || data.insights || data.matching || {};

  return (
    <div className="space-y-3">
      {/* Fleet Health Analysis */}
      {analysis.vehicle_health && (
        <InsightCard
          title="Vehicle Health"
          icon={TrendingUp}
          content={analysis.vehicle_health}
          color="cyan"
        />
      )}
      {analysis.alerts && (
        <InsightCard
          title="Alert Analysis"
          icon={AlertTriangle}
          content={analysis.alerts}
          color="amber"
        />
      )}
      {analysis.routes && (
        <InsightCard
          title="Route Optimization"
          icon={Sparkles}
          content={analysis.routes}
          color="violet"
        />
      )}

      {/* Operation Optimizations */}
      {analysis.vehicle_assignment && (
        <InsightCard
          title="Vehicle Assignment"
          icon={TrendingUp}
          content={analysis.vehicle_assignment}
          color="cyan"
        />
      )}
      {analysis.shipment_prioritization && (
        <InsightCard
          title="Shipment Prioritization"
          icon={Zap}
          content={analysis.shipment_prioritization}
          color="violet"
        />
      )}
      {analysis.resource_allocation && (
        <InsightCard
          title="Resource Allocation"
          icon={Sparkles}
          content={analysis.resource_allocation}
          color="emerald"
        />
      )}

      {/* Predictions */}
      {analysis.maintenance && (
        <InsightCard
          title="Maintenance Prediction"
          icon={AlertTriangle}
          content={analysis.maintenance}
          color="amber"
        />
      )}
      {analysis.delays && (
        <InsightCard
          title="Delay Risk Assessment"
          icon={AlertTriangle}
          content={analysis.delays}
          color="amber"
        />
      )}
      {analysis.safety && (
        <InsightCard
          title="Safety Concerns"
          icon={AlertTriangle}
          content={analysis.safety}
          color="amber"
        />
      )}

      {/* General Insights */}
      {analysis.performance && (
        <InsightCard
          title="Performance Insights"
          icon={TrendingUp}
          content={analysis.performance}
          color="cyan"
        />
      )}
      {analysis.cost && (
        <InsightCard
          title="Cost Analysis"
          icon={Zap}
          content={analysis.cost}
          color="violet"
        />
      )}
      {analysis.efficiency && (
        <InsightCard
          title="Efficiency Opportunities"
          icon={Sparkles}
          content={analysis.efficiency}
          color="emerald"
        />
      )}
      {analysis.strategic && (
        <InsightCard
          title="Strategic Recommendations"
          icon={Brain}
          content={analysis.strategic}
          color="violet"
        />
      )}

      {/* Resource Matching */}
      {analysis.drivers && (
        <InsightCard
          title="Driver Matching"
          icon={TrendingUp}
          content={analysis.drivers}
          color="cyan"
        />
      )}
      {analysis.assets && (
        <InsightCard
          title="Asset Allocation"
          icon={Zap}
          content={analysis.assets}
          color="violet"
        />
      )}
    </div>
  );
};