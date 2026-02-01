import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Navigation, Fuel, Clock, MapPin, Activity, Radio, 
  Thermometer, Battery, Gauge, Compass, Ship, Truck, Plane, Train,
  AlertTriangle, CheckCircle, Wifi, WifiOff, Zap, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const vehicleIcons = { truck: Truck, ship: Ship, drone: Plane, train: Train, aircraft: Plane };

const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  maintenance: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

// Generate mock telemetry data
const generateTelemetryData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}m`,
    speed: Math.floor(Math.random() * 30) + 60,
    fuel: Math.max(0, 100 - i * 2 + Math.random() * 5),
    altitude: Math.floor(Math.random() * 1000) + 9000,
  }));
};

export default function VehicleDetailPanel({ vehicle, onClose, telemetryHistory = [] }) {
  if (!vehicle) return null;
  
  const Icon = vehicleIcons[vehicle.type] || Truck;
  const telemetryData = telemetryHistory.length > 0 ? telemetryHistory : generateTelemetryData();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-96 rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Icon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{vehicle.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={statusColors[vehicle.status]}>
                  {vehicle.status === 'active' && <Radio className="w-3 h-3 mr-1 animate-pulse" />}
                  {vehicle.status}
                </Badge>
                <span className="text-xs text-slate-500">ID: {vehicle.id?.slice(0, 8)}</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live Status Indicators */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <Gauge className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{vehicle.speed || 0}</p>
            <p className="text-[10px] text-slate-500">km/h</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <Compass className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{vehicle.heading || 0}°</p>
            <p className="text-[10px] text-slate-500">Heading</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <Fuel className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{vehicle.fuel_level || 0}%</p>
            <p className="text-[10px] text-slate-500">Fuel</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-800/50">
            <Activity className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{vehicle.efficiency_score || 0}</p>
            <p className="text-[10px] text-slate-500">Score</p>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="p-4">
        <TabsList className="w-full bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Telemetry
          </TabsTrigger>
          <TabsTrigger value="route" className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Route
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Position */}
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Current Position</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Latitude:</span>
                <span className="ml-1 text-white font-mono">{vehicle.latitude?.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-slate-500">Longitude:</span>
                <span className="ml-1 text-white font-mono">{vehicle.longitude?.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Destination</span>
            </div>
            <p className="text-sm text-slate-300">{vehicle.destination || 'No destination set'}</p>
            {vehicle.eta && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>ETA: {vehicle.eta}</span>
              </div>
            )}
          </div>

          {/* Cargo */}
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Cargo Load</span>
              <span className="text-xs text-slate-400">
                {vehicle.cargo_used || 0} / {vehicle.cargo_capacity || 0} tons
              </span>
            </div>
            <Progress 
              value={vehicle.cargo_capacity > 0 ? (vehicle.cargo_used / vehicle.cargo_capacity) * 100 : 0} 
              className="h-2 bg-slate-700" 
            />
          </div>

          {/* Driver/Operator */}
          {vehicle.driver && (
            <div className="p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">{vehicle.driver[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{vehicle.driver}</p>
                  <p className="text-xs text-slate-500">Operator</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="telemetry" className="mt-4 space-y-4">
          {/* Speed Chart */}
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Speed History</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData}>
                  <defs>
                    <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="speed" stroke="#06b6d4" fill="url(#speedGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fuel Chart */}
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white">Fuel Consumption</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData}>
                  <defs>
                    <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="fuel" stroke="#f59e0b" fill="url(#fuelGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">Engine OK</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">GPS Lock</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
              {(vehicle.signal_strength || 0) > 0 ? (
                <>
                  <Wifi className={`w-4 h-4 ${(vehicle.signal_strength || 0) > 50 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-xs text-slate-300">{(vehicle.signal_strength || 0) > 50 ? 'Connected' : 'Weak Signal'}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-slate-500" />
                  <span className="text-xs text-slate-300">No Signal</span>
                </>
              )}
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50 flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">{vehicle.fuel_level > 20 ? 'Battery OK' : 'Low Battery'}</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="route" className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Route Progress</span>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-700" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center z-10">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white">Origin</p>
                    <p className="text-xs text-slate-500">Departed 2h ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center z-10 animate-pulse">
                    <Radio className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white">En Route</p>
                    <p className="text-xs text-slate-500">65% complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center z-10">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{vehicle.destination || 'Destination'}</p>
                    <p className="text-xs text-slate-500">ETA: 1h 30m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distance Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-white">187</p>
              <p className="text-xs text-slate-500">km traveled</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 text-center">
              <p className="text-2xl font-bold text-white">98</p>
              <p className="text-xs text-slate-500">km remaining</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}