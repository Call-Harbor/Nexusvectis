import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Leaf, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIInsights({ vehicles, routes }) {
  // Calculate insights
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const lowFuelVehicles = vehicles.filter(v => v.fuel_level < 20).length;
  const avgEfficiency = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.efficiency_score || 75), 0) / vehicles.length)
    : 0;
  const totalCO2 = vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0);
  const delayedRoutes = routes.filter(r => r.status === 'delayed').length;

  const insights = [
    {
      icon: TrendingUp,
      title: "Ruteoptimering tilgængelig",
      description: `${Math.max(3, Math.floor(routes.length * 0.3))} ruter kan optimeres for 12% lavere brændstofforbrug`,
      action: "Optimer nu",
      color: "cyan",
    },
    {
      icon: Leaf,
      title: "CO₂-reduktion mulig",
      description: `Skift til elektriske enheder på 2 ruter kan spare ${Math.round(totalCO2 * 0.15)} kg CO₂ månedligt`,
      action: "Se detaljer",
      color: "emerald",
    },
    ...(lowFuelVehicles > 0 ? [{
      icon: AlertTriangle,
      title: "Brændstofalarm",
      description: `${lowFuelVehicles} enheder har under 20% brændstof - koordiner optankning`,
      action: "Planlæg tankning",
      color: "amber",
    }] : []),
    ...(delayedRoutes > 0 ? [{
      icon: Zap,
      title: "Forsinkelseshåndtering",
      description: `${delayedRoutes} forsinkede ruter kan omdirigeres automatisk`,
      action: "Aktiver AI-routing",
      color: "violet",
    }] : []),
  ];

  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  };

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Indsigter</h3>
            <p className="text-sm text-slate-500">Intelligent optimering i realtid</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[insight.color]} border`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{insight.description}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-7 px-0 text-xs hover:bg-transparent"
                  >
                    {insight.action}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Samlet effektivitetsscore</span>
            <span className="font-semibold text-white">{avgEfficiency}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${avgEfficiency}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}