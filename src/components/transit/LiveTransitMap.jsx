import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Bus, AlertTriangle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LiveTransitMap({ organizationId }) {
  const { data: activeBuses = [] } = useQuery({
    queryKey: ['activeBuses', organizationId],
    queryFn: () => base44.entities.Bus.filter({ 
      organization_id: organizationId,
      status: 'in_service'
    }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['busStops', organizationId],
    queryFn: () => base44.entities.BusStop.filter({ organization_id: organizationId }),
  });

  return (
    <div className="relative w-full h-[600px] rounded-2xl bg-slate-900/50 border border-slate-700/50 overflow-hidden">
      {/* Simulated Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Bus Stops */}
      {stops.slice(0, 20).map((stop, i) => (
        <motion.div
          key={stop.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="absolute"
          style={{
            left: `${20 + (i % 8) * 10}%`,
            top: `${20 + Math.floor(i / 8) * 20}%`
          }}
        >
          <div className="relative group">
            <div className="w-3 h-3 rounded-full bg-cyan-500/50 border-2 border-cyan-400 cursor-pointer hover:scale-150 transition-transform" />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Card className="p-2 bg-slate-800 border-slate-700 whitespace-nowrap text-xs">
                <p className="text-white font-semibold">{stop.stop_name}</p>
                {stop.daily_passengers_avg > 0 && (
                  <p className="text-slate-400">{stop.daily_passengers_avg} avg daily</p>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Active Buses */}
      {activeBuses.slice(0, 15).map((bus, i) => (
        <motion.div
          key={bus.id}
          animate={{
            x: [0, Math.random() * 20 - 10, 0],
            y: [0, Math.random() * 20 - 10, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute"
          style={{
            left: `${30 + (i % 5) * 15}%`,
            top: `${25 + Math.floor(i / 5) * 20}%`
          }}
        >
          <div className="relative group">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg cursor-pointer"
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <Card className="p-3 bg-slate-800 border-slate-700 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-4 h-4 text-emerald-400" />
                  <p className="text-white font-semibold">{bus.bus_number}</p>
                </div>
                {bus.current_line_id && (
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-2">
                    Line {bus.current_line_id}
                  </Badge>
                )}
                <div className="text-xs space-y-1">
                  <p className="text-slate-400">Passengers: {bus.passenger_count || 0}</p>
                  <p className="text-slate-400">Speed: {bus.speed || 0} km/h</p>
                  {bus.battery_level && (
                    <p className="text-emerald-400">Battery: {bus.battery_level}%</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4">
        <Card className="p-4 bg-slate-800/90 border-slate-700/50 backdrop-blur-xl">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              <span className="text-white">Active Bus</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500/50 border-2 border-cyan-400" />
              <span className="text-white">Bus Stop</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">{activeBuses.length} buses live</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}