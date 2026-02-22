import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { 
  Zap, TrendingUp, AlertTriangle, Activity, Loader2, BarChart3, 
  MapPin, Gauge, Fuel, Clock, Shield, Eye, Brain, Sparkles
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function AdvancedFleetHologram() {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fleetMetrics, setFleetMetrics] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesData, alertsData] = await Promise.all([
          base44.entities.Vehicle.list(),
          base44.entities.Alert.list()
        ]);
        setVehicles(vehiclesData);
        setAlerts(alertsData);
        calculateFleetMetrics(vehiclesData, alertsData);
      } catch (error) {
        console.error('Error fetching fleet data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateFleetMetrics = (vehicleList, alertList) => {
    const avgFuel = vehicleList.reduce((sum, v) => sum + (v.fuel_level || 0), 0) / vehicleList.length;
    const activeVehicles = vehicleList.filter(v => v.status === 'active').length;
    const criticalAlerts = alertList.filter(a => a.type === 'critical').length;
    const efficiency = (activeVehicles / vehicleList.length) * 100;

    setFleetMetrics({
      totalVehicles: vehicleList.length,
      activeVehicles,
      avgFuelLevel: avgFuel.toFixed(1),
      efficiency: efficiency.toFixed(1),
      criticalAlerts,
      healthScore: (100 - (criticalAlerts * 5)).toFixed(0)
    });
  };

  const HologramCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl border-2 border-${color}-500/40 bg-${color}-500/5 backdrop-blur-xl relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/10 to-transparent pointer-events-none`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-5 h-5 text-${color}-400`} />
          {trend && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
        {unit && <p className={`text-xs text-${color}-400 mt-1`}>{unit}</p>}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
            Advanced Fleet Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time holographic fleet analysis</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
          Live
        </Badge>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HologramCard
          title="Fleet Health"
          value={fleetMetrics.healthScore}
          unit="/100"
          icon={Shield}
          color="emerald"
          trend={true}
        />
        <HologramCard
          title="Active Vehicles"
          value={fleetMetrics.activeVehicles}
          unit={`of ${fleetMetrics.totalVehicles}`}
          icon={Activity}
          color="cyan"
        />
        <HologramCard
          title="Avg Fuel Level"
          value={fleetMetrics.avgFuelLevel}
          unit="%"
          icon={Fuel}
          color="amber"
        />
        <HologramCard
          title="Fleet Efficiency"
          value={fleetMetrics.efficiency}
          unit="%"
          icon={Zap}
          color="violet"
          trend={true}
        />
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.slice(0, 6).map((vehicle, idx) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedVehicle(vehicle)}
            className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:border-cyan-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-white">{vehicle.name}</p>
                <p className="text-xs text-slate-400">{vehicle.type}</p>
              </div>
              <Badge className={vehicle.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                {vehicle.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Fuel className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400">{vehicle.fuel_level || 0}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span className="text-slate-400">{vehicle.speed || 0} km/h</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-violet-400" />
                <span className="text-slate-400 truncate">{vehicle.location || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">{vehicle.efficiency_score || 0}/100</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
          <h3 className="font-bold text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Active Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/40">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                <div className="flex-1">
                  <p className="text-sm text-white">{alert.title}</p>
                  <p className="text-xs text-slate-400">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}