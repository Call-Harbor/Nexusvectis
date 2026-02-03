import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, TrendingUp, Route, Zap, AlertTriangle, 
  CheckCircle2, ChevronRight, Loader2, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AIControlPanel({ vehicles = [], onApplyOptimization, aiMode }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Generate AI recommendations
  const generateRecommendations = () => {
    const recs = [];
    
    // Route optimization
    const activeVehicles = vehicles.filter(v => v.status === 'active');
    if (activeVehicles.length > 0) {
      recs.push({
        id: 'route-opt-1',
        type: 'optimization',
        priority: 'high',
        title: 'Route Optimization Available',
        description: `${activeVehicles.length} active vehicles can save ~15% travel time`,
        impact: '+15% efficiency',
        action: 'Optimize Routes',
        icon: Route,
      });
    }

    // Fuel efficiency
    const lowFuelVehicles = vehicles.filter(v => v.fuel_level < 30);
    if (lowFuelVehicles.length > 0) {
      recs.push({
        id: 'fuel-opt-1',
        type: 'alert',
        priority: 'medium',
        title: 'Fuel Optimization Needed',
        description: `${lowFuelVehicles.length} vehicles need fuel - route to nearest stations`,
        impact: 'Prevent delays',
        action: 'View Fuel Stations',
        icon: Zap,
      });
    }

    // Predictive maintenance
    const maintenanceNeeded = vehicles.filter(v => {
      if (!v.next_maintenance) return false;
      const days = Math.floor((new Date(v.next_maintenance) - new Date()) / (1000 * 60 * 60 * 24));
      return days < 14;
    });
    if (maintenanceNeeded.length > 0) {
      recs.push({
        id: 'maint-pred-1',
        type: 'prediction',
        priority: 'medium',
        title: 'Maintenance Window Detected',
        description: `Schedule ${maintenanceNeeded.length} vehicles for upcoming maintenance`,
        impact: 'Prevent breakdowns',
        action: 'Schedule Now',
        icon: AlertTriangle,
      });
    }

    // Clustering optimization
    const clusteredVehicles = vehicles.filter(v => 
      v.latitude && v.longitude && v.status === 'active'
    );
    if (clusteredVehicles.length >= 3) {
      recs.push({
        id: 'cluster-opt-1',
        type: 'optimization',
        priority: 'low',
        title: 'Vehicle Clustering Detected',
        description: 'Consolidate nearby shipments for better efficiency',
        impact: '+8% capacity',
        action: 'View Clusters',
        icon: MapPin,
      });
    }

    return recs;
  };

  const recommendations = generateRecommendations();

  const priorityColors = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  };

  const stats = {
    efficiency: Math.round(vehicles.filter(v => v.efficiency_score).reduce((acc, v) => acc + v.efficiency_score, 0) / vehicles.length) || 0,
    activeOptimizations: recommendations.filter(r => r.type === 'optimization').length,
    predictedIssues: recommendations.filter(r => r.type === 'prediction').length,
  };

  if (!aiMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-violet-500/30 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 p-4 border-b border-violet-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Control Center</h3>
              <p className="text-xs text-slate-400">Real-time optimization</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.efficiency}%</div>
          <div className="text-xs text-slate-400">Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-400">{stats.activeOptimizations}</div>
          <div className="text-xs text-slate-400">Optimizations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.predictedIssues}</div>
          <div className="text-xs text-slate-400">Predictions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {['overview', 'actions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab
                ? "text-white bg-slate-800/50 border-b-2 border-violet-500"
                : "text-slate-400 hover:text-white"
            )}
          >
            {tab === 'overview' ? 'Overview' : 'AI Actions'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {recommendations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">All systems optimal</p>
                </motion.div>
              ) : (
                recommendations.map((rec, idx) => {
                  const colors = priorityColors[rec.priority];
                  const Icon = rec.icon;
                  
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "p-3 rounded-xl border backdrop-blur-sm",
                        colors.bg, colors.border
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
                          <Icon className={cn("w-4 h-4", colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">{rec.title}</h4>
                            <Badge variant="outline" className={cn("text-xs", colors.text)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-medium", colors.text)}>{rec.impact}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn("h-7 text-xs", colors.text)}
                              onClick={() => onApplyOptimization && onApplyOptimization(rec)}
                            >
                              {rec.action}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-4 space-y-2">
            <Button
              className="w-full justify-between bg-violet-500/10 hover:bg-violet-500/20 text-white border border-violet-500/30"
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 2000);
              }}
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Auto-Optimize All Routes
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between bg-slate-800/50 text-white border-slate-700"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Predict Next Issues
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between bg-slate-800/50 text-white border-slate-700"
            >
              <span className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                Generate Smart Routes
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}