import { motion } from "framer-motion";
import { Truck, Ship, Plane, Zap, Gauge, Navigation, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeIcons = {
  truck: Truck,
  ship: Ship,
  aircraft: Plane,
  drone: Zap,
  train: Truck,
};

export default function VehicleHologramCard({ vehicle, x, y, index }) {
  const Icon = typeIcons[vehicle.type] || Truck;
  
  const statusColor = vehicle.status === 'active' 
    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    : vehicle.status === 'idle'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : vehicle.status === 'maintenance'
    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    : 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ delay: index * 0.05, type: "spring" }}
      className="absolute pointer-events-auto"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative">
        {/* Holographic glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl" />
        
        {/* Card */}
        <div className="relative w-80 p-4 rounded-2xl backdrop-blur-xl border-2 border-cyan-500/30 bg-slate-900/90 shadow-2xl">
          {/* Scan lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[size:100%_4px] animate-scan" />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{vehicle.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">{vehicle.type}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <Badge variant="outline" className={statusColor}>
                  {vehicle.status}
                </Badge>
              </div>

              {vehicle.speed !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Speed</span>
                  <span className="text-white font-mono ml-auto">{vehicle.speed} km/h</span>
                </div>
              )}

              {vehicle.heading !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Navigation className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Heading</span>
                  <span className="text-white font-mono ml-auto">{vehicle.heading}°</span>
                </div>
              )}

              {vehicle.fuel_level !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <Droplet className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Fuel</span>
                  <span className="text-white font-mono ml-auto">{vehicle.fuel_level}%</span>
                </div>
              )}

              {vehicle.destination && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Destination</span>
                  <span className="text-white">{vehicle.destination}</span>
                </div>
              )}

              {vehicle.latitude && vehicle.longitude && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="text-white font-mono text-[10px]">
                    {vehicle.latitude.toFixed(4)}°, {vehicle.longitude.toFixed(4)}°
                  </span>
                </div>
              )}
            </div>

            {/* Fuel bar */}
            {vehicle.fuel_level !== undefined && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vehicle.fuel_level}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${
                      vehicle.fuel_level > 50 
                        ? 'bg-emerald-500' 
                        : vehicle.fuel_level > 20 
                        ? 'bg-amber-500' 
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}