import { motion } from "framer-motion";
import { Warehouse, MapPin, Package, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const typeIcons = {
  fuel_depot: Activity,
  warehouse: Warehouse,
  charging_station: Activity,
  maintenance_hub: Activity,
  port: MapPin,
};

export default function ResourceHologramCard({ resource, x, y, index }) {
  const Icon = typeIcons[resource.type] || Package;
  
  const statusColor = resource.status === 'operational' 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : resource.status === 'limited'
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';

  const capacityPercent = resource.capacity ? ((resource.current_level || 0) / resource.capacity * 100).toFixed(0) : 0;

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
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
        
        {/* Card */}
        <div className="relative w-80 p-4 rounded-2xl backdrop-blur-xl border-2 border-amber-500/30 bg-slate-900/90 shadow-2xl">
          {/* Scan lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(251,191,36,0.03)_50%)] bg-[size:100%_4px] animate-scan" />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{resource.name}</h3>
                  <p className="text-xs text-slate-400">{resource.location || 'Unknown Location'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <Badge variant="outline" className={statusColor}>
                  {resource.status || 'Unknown'}
                </Badge>
              </div>

              {resource.capacity && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Capacity</span>
                  <span className="text-white font-mono">
                    {resource.current_level || 0} / {resource.capacity} ({capacityPercent}%)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Type</span>
                <span className="text-white capitalize">{resource.type?.replace(/_/g, ' ')}</span>
              </div>

              {resource.latitude && resource.longitude && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="text-white font-mono">
                    {resource.latitude.toFixed(4)}°, {resource.longitude.toFixed(4)}°
                  </span>
                </div>
              )}
            </div>

            {/* Capacity bar */}
            {resource.capacity && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${capacityPercent}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${
                      capacityPercent > 80 
                        ? 'bg-emerald-500' 
                        : capacityPercent > 50 
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