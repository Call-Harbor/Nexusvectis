import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
    cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  };

  const glowClasses = {
    blue: "shadow-blue-500/20",
    cyan: "shadow-cyan-500/20",
    emerald: "shadow-emerald-500/20",
    amber: "shadow-amber-500/20",
    rose: "shadow-rose-500/20",
    violet: "shadow-violet-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-xl p-6 shadow-lg ${glowClasses[color]}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
      
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  );
}