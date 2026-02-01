import { motion } from "framer-motion";
import { 
  X, Navigation, Fuel, Compass, Activity, Gauge, 
  TrendingUp, AlertTriangle, CheckCircle2, Clock, MapPin, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors = {
  active: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  idle: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  offline: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

export default function EnhancedVehiclePanel({ vehicle, onClose }) {
  if (!vehicle) return null;

  const getStatusIcon = (status) => {
    if (status === 'active') return <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />;
    if (status === 'idle') return <span className="w-2 h-2 rounded-full bg-amber-400" />;
    return <span className="w-2 h-2 rounded-full bg-rose-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-slate-900/98 backdrop-blur-xl overflow-hidden shadow-2xl"
    >
      {/* Header with gradient */}
      <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white">{vehicle.name}</h2>
              <Badge className={`${statusColors[vehicle.status]} border flex items-center gap-1.5`}>
                {getStatusIcon(vehicle.status)}
                <span className="capitalize text-xs">{vehicle.status}</span>
              </Badge>
            </div>
            <p className="text-xs text-slate-500">ID: {vehicle.id?.slice(0, 12)}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20">
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <Gauge className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vehicle.speed || 0}</p>
            <p className="text-[10px] text-slate-500">km/h</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <Compass className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vehicle.heading || 0}°</p>
            <p className="text-[10px] text-slate-500">Heading</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <Fuel className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vehicle.fuel_level || 0}%</p>
            <p className="text-[10px] text-slate-500">Fuel</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <Activity className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">{vehicle.efficiency_score || 0}</p>
            <p className="text-[10px] text-slate-500">Efficiency</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        <TabsList className="w-full bg-slate-800/50 border-b border-slate-700/50 rounded-none p-1 m-0 justify-start gap-1">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Details
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Position */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Location</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Latitude:</span>
                <span className="text-white font-mono">{vehicle.latitude?.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Longitude:</span>
                <span className="text-white font-mono">{vehicle.longitude?.toFixed(5)}</span>
              </div>
            </div>
          </div>

          {/* Destination */}
          {vehicle.destination && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-white">Destination</span>
              </div>
              <p className="text-sm text-slate-300 p-3 rounded-lg bg-slate-800/50">{vehicle.destination}</p>
              {vehicle.eta && (
                <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2">
                  <Clock className="w-3 h-3" />
                  <span>ETA: {new Date(vehicle.eta).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Cargo */}
          {vehicle.cargo_capacity && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Cargo</span>
                <span className="text-xs text-slate-500">{vehicle.cargo_used || 0} / {vehicle.cargo_capacity} tons</span>
              </div>
              <Progress 
                value={vehicle.cargo_capacity > 0 ? (vehicle.cargo_used / vehicle.cargo_capacity) * 100 : 0}
                className="h-2" 
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-slate-500 text-xs mb-1">Type</p>
              <p className="font-medium text-white capitalize">{vehicle.type}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-slate-500 text-xs mb-1">Driver</p>
              <p className="font-medium text-white">{vehicle.driver || 'N/A'}</p>
            </div>
            {vehicle.callsign && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-500 text-xs mb-1">Callsign</p>
                <p className="font-medium text-white">{vehicle.callsign}</p>
              </div>
            )}
            {vehicle.mmsi && (
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-slate-500 text-xs mb-1">MMSI</p>
                <p className="font-medium text-white">{vehicle.mmsi}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="health" className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {vehicle.last_maintenance && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs text-emerald-300">Last Maintenance</span>
                <span className="text-xs text-white font-mono">{new Date(vehicle.last_maintenance).toLocaleDateString()}</span>
              </div>
            )}
            {vehicle.next_maintenance && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="text-xs text-amber-300">Next Maintenance</span>
                <span className="text-xs text-white font-mono">{new Date(vehicle.next_maintenance).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">All Systems OK</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}