import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Zap, Activity, MapPin, Fuel, Clock, Gauge } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MetricCard = ({ icon: Icon, label, value, unit, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-4 rounded-2xl border border-${color}-500/30 bg-${color}-500/5`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className={`text-${color}-400 text-xs font-bold uppercase`}>{label}</span>
      <Icon className={`w-4 h-4 text-${color}-400`} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className={`text-xs text-${color}-400`}>{unit}</span>
    </div>
    {trend && (
      <div className={`text-xs mt-2 flex items-center gap-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        <TrendingUp className="w-3 h-3" />
        {trend > 0 ? '+' : ''}{trend}% vs last week
      </div>
    )}
  </motion.div>
);

export default function FleetIntelligenceDashboard({ vehicles = [], alerts = [] }) {
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const avgFuelLevel = vehicles.length > 0 
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicles.length)
    : 0;
  const avgEfficiency = vehicles.length > 0
    ? Math.round(vehicles.reduce((sum, v) => sum + (v.efficiency_score || 70), 0) / vehicles.length)
    : 0;
  const criticalAlerts = alerts.filter(a => a.type === 'critical').length;

  // Generate mock chart data
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i}:00`,
    efficiency: 65 + Math.random() * 25,
    fuel_consumption: 40 + Math.random() * 30,
    distance: 120 + Math.random() * 80,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Activity} label="Active Vehicles" value={activeVehicles} unit={`/${vehicles.length}`} color="cyan" trend={12} />
        <MetricCard icon={Fuel} label="Avg Fuel Level" value={avgFuelLevel} unit="%" color="amber" trend={-3} />
        <MetricCard icon={Gauge} label="Fleet Efficiency" value={avgEfficiency} unit="%" color="emerald" trend={8} />
        <MetricCard icon={AlertTriangle} label="Critical Alerts" value={criticalAlerts} unit="active" color="red" trend={-5} />
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Efficiency Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30"
        >
          <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Fleet Efficiency Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '10px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" fillOpacity={1} fill="url(#colorEfficiency)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Fuel Consumption */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30"
        >
          <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Fuel Consumption (L/100km)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '10px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="fuel_consumption" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Distance Covered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30"
      >
        <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Distance Covered Per Hour (km)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '10px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            <Bar dataKey="distance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}