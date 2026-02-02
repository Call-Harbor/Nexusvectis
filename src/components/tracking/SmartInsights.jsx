import { motion } from "framer-motion";
import { 
  Sparkles, TrendingUp, AlertTriangle, Zap, Clock, Route, Fuel, AlertCircle,
  CheckCircle2, ChevronRight, Gauge, Navigation
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SmartInsights({ vehicle, vehicles = [], aiMode = false }) {
  if (!vehicle) return null;

  // Calculate insights
  const calculateInsights = () => {
    const insights = [];

    // Efficiency insight
    if (vehicle.efficiency_score) {
      if (vehicle.efficiency_score > 85) {
        insights.push({
          id: 'efficiency',
          icon: TrendingUp,
          title: 'Optimal Performance',
          desc: `Score: ${vehicle.efficiency_score}/100`,
          type: 'positive',
          action: 'Keep current route'
        });
      } else if (vehicle.efficiency_score < 60) {
        insights.push({
          id: 'efficiency',
          icon: AlertTriangle,
          title: 'Low Efficiency',
          desc: `Score: ${vehicle.efficiency_score}/100`,
          type: 'warning',
          action: 'Review route optimization'
        });
      }
    }

    // Fuel warning
    if (vehicle.fuel_level !== undefined) {
      if (vehicle.fuel_level < 20) {
        insights.push({
          id: 'fuel',
          icon: AlertCircle,
          title: 'Fuel Critical',
          desc: `${vehicle.fuel_level}% remaining`,
          type: 'critical',
          action: 'Refuel immediately'
        });
      } else if (vehicle.fuel_level < 40) {
        insights.push({
          id: 'fuel',
          icon: Fuel,
          title: 'Low Fuel',
          desc: `${vehicle.fuel_level}% remaining`,
          type: 'warning',
          action: 'Plan refuel stop'
        });
      }
    }

    // Speed anomaly
    if (vehicle.speed > 100) {
      insights.push({
        id: 'speed',
        icon: Gauge,
        title: 'High Speed Detected',
        desc: `${vehicle.speed} km/h`,
        type: 'warning',
        action: 'Reduce speed'
      });
    }

    // ETA prediction
    if (vehicle.eta) {
      const etaDate = new Date(vehicle.eta);
      const now = new Date();
      const hoursUntilEta = (etaDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilEta < 2 && hoursUntilEta > 0) {
        insights.push({
          id: 'eta',
          icon: Clock,
          title: 'ETA Arriving Soon',
          desc: `In ${Math.round(hoursUntilEta * 60)} minutes`,
          type: 'info',
          action: 'Prepare for arrival'
        });
      }
    }

    // Maintenance due
    if (vehicle.next_maintenance) {
      const nextMaint = new Date(vehicle.next_maintenance);
      const now = new Date();
      const daysUntilMaint = (nextMaint - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntilMaint < 7 && daysUntilMaint > 0) {
        insights.push({
          id: 'maintenance',
          icon: AlertTriangle,
          title: 'Maintenance Due Soon',
          desc: `In ${Math.round(daysUntilMaint)} days`,
          type: 'warning',
          action: 'Schedule maintenance'
        });
      }
    }

    // Route efficiency
    if (vehicle.efficiency_score > 80) {
      insights.push({
        id: 'route',
        icon: Route,
        title: 'Optimal Route',
        desc: 'Current path is efficient',
        type: 'positive',
        action: 'Continue route'
      });
    }

    return insights.slice(0, 3); // Show top 3 insights
  };

  const insights = calculateInsights();
  const typeColors = {
    positive: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    critical: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-96 rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-white">AI Insights</h3>
          <span className="ml-auto text-xs text-slate-500">{vehicle.name}</span>
        </div>
      </div>

      {/* Insights List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {insights.length > 0 ? (
          insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${typeColors[insight.type]} space-y-2`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs opacity-75">{insight.desc}</p>
                  </div>
                </div>
                <button className="text-xs font-medium opacity-75 hover:opacity-100 transition-opacity flex items-center gap-1">
                  {insight.action}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-slate-400">All systems optimal</p>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-500">Efficiency</p>
            <p className="text-lg font-bold text-white">{vehicle.efficiency_score || 0}%</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-500">Status</p>
            <Badge className="mt-1 text-xs capitalize">
              {vehicle.status === 'active' ? (
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>
              ) : (
                vehicle.status
              )}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}