import { motion } from "framer-motion";
import { Bus, Users, Clock, Zap, AlertCircle, Gauge, Fuel } from "lucide-react";

export default function BusCard({ bus, onClick, selected }) {
  const loadPercentage = bus.capacity ? ((bus.current_passengers || 0) / bus.capacity * 100) : 0;
  
  const statusColors = {
    active: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    delayed: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    idle: 'from-slate-500/20 to-slate-500/5 border-slate-500/30',
    maintenance: 'from-red-500/20 to-red-500/5 border-red-500/30',
    offline: 'from-slate-700/20 to-slate-700/5 border-slate-700/30'
  };

  const statusIcons = {
    active: <Zap className="w-4 h-4 text-emerald-400" />,
    delayed: <AlertCircle className="w-4 h-4 text-amber-400" />,
    idle: <Clock className="w-4 h-4 text-slate-400" />,
    maintenance: <AlertCircle className="w-4 h-4 text-red-400" />,
    offline: <AlertCircle className="w-4 h-4 text-slate-500" />
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-5 bg-gradient-to-br ${statusColors[bus.status] || statusColors.idle} border transition-all ${
        selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
            <Bus className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-white text-lg">Bus {bus.bus_number}</div>
            <div className="text-sm text-slate-400">{bus.bus_type?.replace('_', ' ')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/50 border border-slate-700/50">
          {statusIcons[bus.status]}
          <span className="text-xs text-slate-300 capitalize">{bus.status}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Passenger Load */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              <span>Passengers</span>
            </div>
            <span className="text-sm font-semibold text-white">
              {bus.current_passengers || 0}/{bus.capacity}
            </span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${loadPercentage}%` }}
              className={`h-full ${
                loadPercentage > 90 ? 'bg-red-500' : 
                loadPercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Speed & Fuel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
            <Gauge className="w-4 h-4 text-violet-400" />
            <div>
              <div className="text-xs text-slate-400">Speed</div>
              <div className="text-sm font-semibold text-white">{bus.speed || 0} km/h</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
            <Fuel className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs text-slate-400">Fuel</div>
              <div className="text-sm font-semibold text-white">{bus.fuel_level || 0}%</div>
            </div>
          </div>
        </div>

        {/* Delay Info */}
        {bus.delay_minutes !== 0 && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            bus.delay_minutes > 5 ? 'bg-red-500/10 border border-red-500/30' : 
            bus.delay_minutes > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 
            'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <Clock className={`w-4 h-4 ${
              bus.delay_minutes > 5 ? 'text-red-400' : 
              bus.delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <span className="text-sm text-white">
              {bus.delay_minutes > 0 ? '+' : ''}{bus.delay_minutes} min
            </span>
          </div>
        )}

        {/* Registration Plate */}
        {bus.registration_plate && (
          <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700/50">
            {bus.registration_plate}
          </div>
        )}
      </div>
    </motion.div>
  );
}