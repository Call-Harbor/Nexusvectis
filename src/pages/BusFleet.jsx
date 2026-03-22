import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bus, MapPin, Users, Clock, Zap, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import BusMap from "../components/bus/BusMap";
import BusCard from "../components/bus/BusCard";
import BusRouteOverview from "../components/bus/BusRouteOverview";

export default function BusFleet() {
  const [selectedBus, setSelectedBus] = useState(null);
  const [view, setView] = useState("map"); // map, list, routes

  const { data: buses = [], isLoading: loadingBuses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('-updated_date', 100),
    refetchInterval: 5000, // Real-time updates every 5s
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['busRoutes'],
    queryFn: () => base44.entities.BusRoute.list('-route_number', 50),
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops'],
    queryFn: () => base44.entities.BusStop.list('-stop_code', 200),
  });

  const stats = {
    total: buses.length,
    active: buses.filter(b => b.status === 'active').length,
    delayed: buses.filter(b => b.delay_minutes > 5).length,
    avgPassengers: buses.reduce((acc, b) => acc + (b.current_passengers || 0), 0) / (buses.length || 1),
    totalPassengers: buses.reduce((acc, b) => acc + (b.current_passengers || 0), 0),
    capacity: buses.reduce((acc, b) => acc + (b.capacity || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-[120rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Bus Fleet Management
              </h1>
              <p className="text-slate-400">Real-time bus tracking, passenger flow and route optimization</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setView('map')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'map' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Map View
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Bus className="w-4 h-4 inline mr-2" />
                List View
              </button>
              <button
                onClick={() => setView('routes')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'routes' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Routes
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4"
            >
              <Bus className="w-8 h-8 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Buses</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
            >
              <Zap className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.active}</div>
              <div className="text-sm text-slate-400">Active</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4"
            >
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.delayed}</div>
              <div className="text-sm text-slate-400">Delayed</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-xl p-4"
            >
              <Users className="w-8 h-8 text-violet-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalPassengers}</div>
              <div className="text-sm text-slate-400">Passengers Now</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl p-4"
            >
              <TrendingUp className="w-8 h-8 text-fuchsia-400 mb-2" />
              <div className="text-2xl font-bold text-white">{Math.round(stats.avgPassengers)}</div>
              <div className="text-sm text-slate-400">Avg Load</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 rounded-xl p-4"
            >
              <Clock className="w-8 h-8 text-rose-400 mb-2" />
              <div className="text-2xl font-bold text-white">{routes.length}</div>
              <div className="text-sm text-slate-400">Routes</div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        {view === 'map' && (
          <BusMap 
            buses={buses} 
            routes={routes} 
            stops={stops}
            selectedBus={selectedBus}
            onSelectBus={setSelectedBus}
          />
        )}

        {view === 'list' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map(bus => (
              <BusCard 
                key={bus.id} 
                bus={bus}
                onClick={() => setSelectedBus(bus)}
                selected={selectedBus?.id === bus.id}
              />
            ))}
          </div>
        )}

        {view === 'routes' && (
          <BusRouteOverview routes={routes} stops={stops} buses={buses} />
        )}
      </div>
    </div>
  );
}