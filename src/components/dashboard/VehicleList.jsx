import { motion } from "framer-motion";
import { Truck, Ship, Plane, Train, Radio, Fuel, MapPin, Clock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const vehicleIcons = {
  truck: Truck,
  ship: Ship,
  drone: Plane,
  train: Train,
  aircraft: Plane,
};

const vehicleLabels = {
  truck: "Lastbil",
  ship: "Skib",
  drone: "Drone",
  train: "Tog",
  aircraft: "Fly",
};

const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  maintenance: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const statusLabels = {
  active: "Aktiv",
  idle: "Standby",
  maintenance: "Vedligehold",
  offline: "Offline",
};

export default function VehicleList({ vehicles, onSelectVehicle, selectedId }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Flådeoversigt</h3>
            <p className="text-sm text-slate-500">{vehicles.length} enheder i netværket</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto">
        {vehicles.map((vehicle, index) => {
          const Icon = vehicleIcons[vehicle.type] || Truck;
          return (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectVehicle && onSelectVehicle(vehicle)}
              className={`p-4 cursor-pointer transition-all hover:bg-slate-800/50 ${
                selectedId === vehicle.id ? 'bg-slate-800/70 border-l-2 border-l-cyan-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{vehicle.name}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[vehicle.status]}`}>
                        {statusLabels[vehicle.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span className="text-xs">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{vehicle.destination || 'Ingen destination'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{vehicle.speed || 0} km/t</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Fuel className="w-3 h-3" />
                        <span>Brændstof</span>
                      </div>
                      <span className={`font-medium ${vehicle.fuel_level < 20 ? 'text-rose-400' : vehicle.fuel_level < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {vehicle.fuel_level || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={vehicle.fuel_level || 0} 
                      className="h-1.5 bg-slate-700"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {vehicles.length === 0 && (
          <div className="p-8 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Ingen køretøjer registreret</p>
          </div>
        )}
      </div>
    </div>
  );
}