import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Users, MapPin, Bus, ChevronRight } from "lucide-react";

export default function BusRouteOverview({ routes = [], stops = [], buses = [] }) {
  const [selectedRoute, setSelectedRoute] = useState(null);

  const getRouteStats = (route) => {
    const routeBuses = buses.filter(b => b.route_id === route.id);
    const routeStops = route.stops?.length || 0;
    
    return {
      activeBuses: routeBuses.length,
      totalPassengers: routeBuses.reduce((acc, b) => acc + (b.current_passengers || 0), 0),
      avgDelay: routeBuses.length > 0 
        ? routeBuses.reduce((acc, b) => acc + (b.delay_minutes || 0), 0) / routeBuses.length 
        : 0,
      stopsCount: routeStops
    };
  };

  const routeColors = [
    'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30',
    'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Routes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-4">Active Routes</h2>
        {routes.map((route, idx) => {
          const stats = getRouteStats(route);
          const colorClass = routeColors[idx % routeColors.length];
          
          return (
            <motion.div
              key={route.id}
              whileHover={{ scale: 1.02, x: 4 }}
              onClick={() => setSelectedRoute(route)}
              className={`cursor-pointer rounded-xl p-5 bg-gradient-to-br ${colorClass} border transition-all ${
                selectedRoute?.id === route.id ? 'ring-2 ring-cyan-400' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{route.route_number}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{route.route_name}</div>
                    <div className="text-sm text-slate-400 capitalize">{route.route_type?.replace('_', ' ')}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
                  <Bus className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs text-slate-400">Buses</div>
                    <div className="text-sm font-semibold text-white">{stats.activeBuses}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs text-slate-400">Stops</div>
                    <div className="text-sm font-semibold text-white">{stats.stopsCount}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
                  <Users className="w-4 h-4 text-violet-400" />
                  <div>
                    <div className="text-xs text-slate-400">Passengers</div>
                    <div className="text-sm font-semibold text-white">{stats.totalPassengers}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs text-slate-400">Avg Delay</div>
                    <div className={`text-sm font-semibold ${
                      stats.avgDelay > 5 ? 'text-red-400' : 
                      stats.avgDelay > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {stats.avgDelay > 0 ? '+' : ''}{Math.round(stats.avgDelay)} min
                    </div>
                  </div>
                </div>
              </div>

              {route.total_distance_km && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Distance: {route.total_distance_km} km</span>
                  <span className="text-slate-400">~{route.estimated_duration_minutes} min</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Route Details */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
        {selectedRoute ? (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Route {selectedRoute.route_number}
              </h3>
              <p className="text-slate-400">{selectedRoute.route_name}</p>
            </div>

            {selectedRoute.operating_hours && (
              <div className="mb-6 p-4 rounded-lg bg-slate-800/50">
                <div className="text-sm text-slate-400 mb-1">Operating Hours</div>
                <div className="text-white font-semibold">
                  {selectedRoute.operating_hours.start} - {selectedRoute.operating_hours.end}
                </div>
              </div>
            )}

            {selectedRoute.frequency_minutes && (
              <div className="mb-6 p-4 rounded-lg bg-slate-800/50">
                <div className="text-sm text-slate-400 mb-1">Frequency</div>
                <div className="text-white font-semibold">
                  Every {selectedRoute.frequency_minutes} minutes
                </div>
              </div>
            )}

            {selectedRoute.stops && selectedRoute.stops.length > 0 && (
              <div>
                <div className="text-lg font-semibold text-white mb-3">Stops ({selectedRoute.stops.length})</div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRoute.stops.map((stop, idx) => {
                    const stopDetails = stops.find(s => s.id === stop.stop_id);
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm font-bold">
                          {stop.sequence || idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{stopDetails?.stop_name || 'Unknown Stop'}</div>
                          {stop.travel_time_from_previous && idx > 0 && (
                            <div className="text-xs text-slate-400">+{stop.travel_time_from_previous} min</div>
                          )}
                        </div>
                        {stopDetails?.stop_code && (
                          <div className="text-xs text-slate-500">{stopDetails.stop_code}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Select a route to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}