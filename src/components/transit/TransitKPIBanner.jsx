import { motion } from "framer-motion";
import { Clock, Users, Bus, AlertTriangle, TrendingUp } from "lucide-react";

export default function TransitKPIBanner({ kpis, activeTrips, activeBuses }) {
  const todayKPI = kpis[0] || {};
  const delayedTrips = activeTrips.filter(t => (t.delay_minutes || 0) > 5);

  const stats = [
    {
      label: "On-Time Performance",
      value: (todayKPI.on_time_performance || 92).toFixed(1) + "%",
      icon: Clock,
      color: "emerald",
      target: "Target: 95%"
    },
    {
      label: "Load Factor",
      value: (todayKPI.average_load_factor || 68).toFixed(0) + "%",
      icon: Users,
      color: "cyan",
      target: "Capacity utilization"
    },
    {
      label: "Active Trips",
      value: activeTrips.length,
      icon: Bus,
      color: "violet",
      target: `${delayedTrips.length} delayed`
    },
    {
      label: "Total Delays",
      value: todayKPI.delays_total_minutes || 0,
      icon: AlertTriangle,
      color: "amber",
      target: "minutes today"
    },
    {
      label: "Passengers Today",
      value: (todayKPI.total_passengers || 0).toLocaleString(),
      icon: Users,
      color: "blue",
      target: "total transported"
    },
    {
      label: "CO₂ Efficiency",
      value: (todayKPI.co2_per_passenger_km || 45).toFixed(0),
      icon: TrendingUp,
      color: "emerald",
      target: "g CO₂ per pax·km"
    }
  ];

  const colorClasses = {
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30",
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/30",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/30",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/30",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/30"
  };

  const textColors = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    blue: "text-blue-400"
  };

  const labelColors = {
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    violet: "text-violet-300",
    amber: "text-amber-300",
    blue: "text-blue-300"
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`p-5 rounded-2xl bg-gradient-to-br ${colorClasses[stat.color]} border backdrop-blur-xl`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${textColors[stat.color]}`} />
              <p className={`text-xs ${labelColors[stat.color]} font-semibold`}>{stat.label}</p>
            </div>
            <p className="text-4xl font-black text-white mb-1">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.target}</p>
          </motion.div>
        );
      })}
    </div>
  );
}