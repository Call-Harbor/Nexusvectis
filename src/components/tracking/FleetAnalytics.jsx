import { motion } from "framer-motion";
import { 
  BarChart3, TrendingUp, Fuel, Zap, Leaf, Clock, 
  AlertTriangle, CheckCircle, Activity, Target
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts";
import { Badge } from "@/components/ui/badge";

export default function FleetAnalytics({ vehicles, routes }) {
  // Calculate real metrics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const avgFuel = totalVehicles > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / totalVehicles)
    : 0;
  const avgEfficiency = totalVehicles > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.efficiency_score || 75), 0) / totalVehicles)
    : 0;
  const totalCO2 = vehicles.reduce((sum, v) => sum + (v.co2_emissions || 0), 0);
  
  const typeDistribution = [
    { name: 'Trucks', value: vehicles.filter(v => v.type === 'truck').length, color: '#10b981' },
    { name: 'Ships', value: vehicles.filter(v => v.type === 'ship').length, color: '#3b82f6' },
    { name: 'Drones', value: vehicles.filter(v => v.type === 'drone').length, color: '#f59e0b' },
    { name: 'Trains', value: vehicles.filter(v => v.type === 'train').length, color: '#8b5cf6' },
    { name: 'Aircraft', value: vehicles.filter(v => v.type === 'aircraft').length, color: '#ef4444' },
  ].filter(t => t.value > 0);

  const efficiencyData = [
    { name: 'Mon', efficiency: 82, target: 85 },
    { name: 'Tue', efficiency: 85, target: 85 },
    { name: 'Wed', efficiency: 79, target: 85 },
    { name: 'Thu', efficiency: 88, target: 85 },
    { name: 'Fri', efficiency: 84, target: 85 },
    { name: 'Sat', efficiency: 90, target: 85 },
    { name: 'Sun', efficiency: 92, target: 85 },
  ];

  const fuelConsumption = [
    { name: '00:00', value: 120 },
    { name: '04:00', value: 80 },
    { name: '08:00', value: 200 },
    { name: '12:00', value: 280 },
    { name: '16:00', value: 220 },
    { name: '20:00', value: 150 },
  ];

  const radialData = [
    { name: 'Efficiency', value: avgEfficiency, fill: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              +12%
            </Badge>
          </div>
          <p className="text-3xl font-bold text-white">{activeVehicles}/{totalVehicles}</p>
          <p className="text-sm text-slate-400">Active Units</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="w-5 h-5 text-cyan-400" />
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
              Target: 85%
            </Badge>
          </div>
          <p className="text-3xl font-bold text-white">{avgEfficiency}%</p>
          <p className="text-sm text-slate-400">Fleet Efficiency</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <Fuel className="w-5 h-5 text-amber-400" />
            {avgFuel < 30 && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          </div>
          <p className="text-3xl font-bold text-white">{avgFuel}%</p>
          <p className="text-sm text-slate-400">Avg. Fuel Level</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-rose-500/30"
        >
          <div className="flex items-center justify-between mb-3">
            <Leaf className="w-5 h-5 text-rose-400" />
            <Badge variant="outline" className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs">
              -8% vs last week
            </Badge>
          </div>
          <p className="text-3xl font-bold text-white">{(totalCO2 / 1000).toFixed(1)}t</p>
          <p className="text-sm text-slate-400">CO₂ Emissions</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Efficiency Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-5 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Efficiency Trend</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-slate-400">Target</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData}>
                <defs>
                  <linearGradient id="effGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[70, 100]} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="target" stroke="#64748b" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" fill="url(#effGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fleet Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Fleet Distribution</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {typeDistribution.map((type) => (
              <div key={type.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                <span className="text-xs text-slate-400">{type.name}: {type.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Fuel Consumption Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-5 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Fuel Consumption (24h)</h3>
          </div>
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Total: 1,050 L
          </Badge>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fuelConsumption}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}