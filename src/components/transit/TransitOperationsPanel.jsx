import { motion } from "framer-motion";
import { Bus, Network, Users, BarChart3, Activity, Plus, MapPin, Clock, Battery, Fuel, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function TransitOperationsPanel({
  activeBuses,
  drivers,
  lines,
  activeTrips,
  onSelectBus,
  onSelectLine,
  onAssignDriver
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Active Buses Panel */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Bus className="w-6 h-6 text-cyan-400" />
          Active Buses ({activeBuses.length})
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {activeBuses.map((bus, i) => (
            <motion.div
              key={bus.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectBus(bus)}
              className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white font-semibold">{bus.bus_number}</p>
                  <p className="text-xs text-slate-400">
                    {bus.driver_id ? drivers.find(d => d.driver_id === bus.driver_id)?.first_name + ' ' + drivers.find(d => d.driver_id === bus.driver_id)?.last_name || 'Driver assigned' : 'No driver'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignDriver(bus);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  {bus.driver_id ? 'Change' : 'Assign'}
                </Button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">Line {bus.current_line_id || 'Unassigned'}</p>
                <Badge className={
                  (bus.passenger_count || 0) > (bus.capacity_seated + bus.capacity_standing) * 0.9
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }>
                  {bus.passenger_count || 0}/{(bus.capacity_seated || 0) + (bus.capacity_standing || 0)}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  {bus.speed || 0} km/h
                </div>
                {bus.fuel_type === 'electric' ? (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Battery className="w-3 h-3" />
                    {bus.battery_level || 0}%
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-400">
                    <Fuel className="w-3 h-3" />
                    {bus.fuel_level || 0}%
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Lines & Trips Panel */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Network className="w-6 h-6 text-violet-400" />
          Lines Overview ({lines.length})
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {lines.map((line, i) => {
            const lineTrips = activeTrips.filter(t => t.line_id === line.id);
            const lineDelays = lineTrips.reduce((sum, t) => sum + (t.delay_minutes || 0), 0);
            
            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectLine(line)}
                className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/50 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold">Line {line.line_number}</p>
                    <p className="text-xs text-slate-400">{line.line_name}</p>
                  </div>
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                    {lineTrips.length} active
                  </Badge>
                </div>
                {lineDelays > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {lineDelays} min total delay
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {line.directions?.length || 0} directions • {line.daily_trips || 0} daily trips
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Drivers & Crew Panel */}
      <Card className="p-6 bg-slate-800/50 border-slate-700/50 lg:col-span-1">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-400" />
          Active Drivers ({drivers.filter(d => d.status === 'active').length})
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {drivers.filter(d => d.status === 'active').map((driver, i) => {
            const hoursWorked = driver.current_shift?.hours_worked_today || 0;
            const maxHours = 9;
            const isNearLimit = hoursWorked > maxHours * 0.8;

            return (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{driver.first_name} {driver.last_name}</p>
                    <p className="text-xs text-slate-400">#{driver.employee_number}</p>
                  </div>
                  {isNearLimit && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      Near limit
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Hours today:</span>
                    <span className={isNearLimit ? 'text-amber-400 font-semibold' : 'text-white'}>
                      {hoursWorked.toFixed(1)}/{maxHours}h
                    </span>
                  </div>
                  <Progress value={(hoursWorked / maxHours) * 100} className="h-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}