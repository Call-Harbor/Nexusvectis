import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, TrendingUp, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RealTimeControlAI({ buses }) {
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    const generateInterventions = () => {
      const newInterventions = [];

      buses.forEach(bus => {
        // Short-turn recommendation for delayed buses
        if (bus.delay_minutes > 8) {
          newInterventions.push({
            type: 'short_turn',
            severity: 'high',
            bus: bus.bus_number,
            route: bus.route_id,
            action: 'Short-turn at next major stop to recover schedule',
            impact: `-${Math.round(bus.delay_minutes * 0.6)} min delay recovery`,
            affectedPassengers: Math.round(5 + Math.random() * 10),
            autoExecutable: false
          });
        }

        // Extra trip for overcrowded routes
        const loadPercentage = bus.capacity ? (bus.current_passengers / bus.capacity) * 100 : 0;
        if (loadPercentage > 90) {
          newInterventions.push({
            type: 'extra_trip',
            severity: 'medium',
            bus: 'Available',
            route: bus.route_id,
            action: 'Deploy additional bus on route',
            impact: '+20% capacity for next 2 hours',
            affectedPassengers: Math.round(40 + Math.random() * 30),
            autoExecutable: true
          });
        }

        // Route deviation for roadwork
        if (Math.random() > 0.85) {
          newInterventions.push({
            type: 'route_deviation',
            severity: 'medium',
            bus: bus.bus_number,
            route: bus.route_id,
            action: 'Reroute via alternative street due to roadwork',
            impact: '+2 min travel time, avoid 15 min delay',
            affectedPassengers: Math.round(bus.current_passengers || 0),
            autoExecutable: true
          });
        }
      });

      setInterventions(newInterventions.slice(0, 6));
    };

    generateInterventions();
    const interval = setInterval(generateInterventions, 15000);
    return () => clearInterval(interval);
  }, [buses]);

  const severityColors = {
    critical: 'from-red-500/20 to-red-500/5 border-red-500/30',
    high: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    medium: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  };

  const typeIcons = {
    short_turn: Clock,
    extra_trip: Users,
    route_deviation: MapPin,
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          Real-Time Control AI
        </h3>
        <p className="text-slate-400 mt-1">Proactive interventions to maintain service quality</p>
      </div>

      <AnimatePresence>
        <div className="space-y-3">
          {interventions.map((intervention, idx) => {
            const Icon = typeIcons[intervention.type];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl p-5 bg-gradient-to-br ${severityColors[intervention.severity]} border`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {intervention.severity === 'critical' ? (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      ) : intervention.severity === 'high' ? (
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                      ) : (
                        <Icon className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-bold">{intervention.bus}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-900/50 text-slate-300">
                          Route {intervention.route}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-900/50 text-slate-300 capitalize">
                          {intervention.type.replace('_', ' ')}
                        </span>
                        {intervention.autoExecutable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                            Auto-executable
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 mb-2">{intervention.action}</div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {intervention.impact}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {intervention.affectedPassengers} passengers affected
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {intervention.autoExecutable && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Auto-Apply
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {interventions.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Zap className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p>No active interventions required</p>
          <p className="text-sm">Network operating optimally</p>
        </div>
      )}
    </div>
  );
}