import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bus, AlertTriangle, TrendingUp, Navigation, Users, Battery, Zap, X, Maximize2, MessageSquare, Radio, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function LiveTransitMap({ organizationId, buses = [], stops = [], onBusClick }) {
  const [hoveredStop, setHoveredStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [mapCenter, setMapCenter] = useState({ x: 50, y: 50 });
  const canvasRef = useRef(null);

  // Draw route lines on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw simplified route lines between stops
    if (stops.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      stops.forEach((stop, i) => {
        const x = (20 + (i % 10) * 8) * canvas.width / 100;
        const y = (20 + Math.floor(i / 10) * 15) * canvas.height / 100;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
  }, [stops]);

  const handleBusClick = (bus) => {
    setSelectedBus(bus);
    if (onBusClick) onBusClick(bus);
  };

  return (
    <div className="relative w-full h-[700px] rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 overflow-hidden">
      {/* Canvas for route lines */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Animated scan lines */}
      <motion.div
        animate={{ y: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none"
      />

      {/* Bus Stops */}
      <AnimatePresence>
        {stops.slice(0, 30).map((stop, i) => {
          const x = 20 + (i % 10) * 8;
          const y = 20 + Math.floor(i / 10) * 15;
          const isHovered = hoveredStop?.id === stop.id;

          return (
            <motion.div
              key={stop.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: i * 0.02 }}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setHoveredStop(stop)}
              onMouseLeave={() => setHoveredStop(null)}
            >
              <motion.div
                whileHover={{ scale: 1.5 }}
                className="relative"
              >
                {/* Stop marker */}
                <div className="w-3 h-3 rounded-full bg-cyan-400/50 border-2 border-cyan-300 shadow-lg shadow-cyan-500/30 cursor-pointer" />
                
                {/* Pulsing ring for high-traffic stops */}
                {(stop.daily_passengers_avg || 0) > 1000 && (
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 w-3 h-3 rounded-full border-2 border-cyan-400"
                  />
                )}

                {/* Stop info on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50"
                    >
                      <Card className="p-3 bg-slate-800/95 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 min-w-[220px]">
                        <p className="text-white font-bold mb-1">{stop.stop_name}</p>
                        <p className="text-xs text-slate-400 mb-2">{stop.stop_type?.replace('_', ' ')}</p>
                        {stop.daily_passengers_avg > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-3 h-3 text-cyan-400" />
                            <span className="text-slate-300">{stop.daily_passengers_avg.toLocaleString()} avg/day</span>
                          </div>
                        )}
                        {stop.facilities && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {stop.facilities.shelter && <Badge className="text-xs bg-slate-700 text-slate-300">Shelter</Badge>}
                            {stop.facilities.realtime_display && <Badge className="text-xs bg-cyan-500/20 text-cyan-400">Live Display</Badge>}
                            {stop.facilities.wheelchair_accessible && <Badge className="text-xs bg-emerald-500/20 text-emerald-400">Accessible</Badge>}
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Active Buses */}
      <AnimatePresence>
        {buses.slice(0, 25).map((bus, i) => {
          const x = 25 + (i % 7) * 12;
          const y = 25 + Math.floor(i / 7) * 18;
          const isSelected = selectedBus?.id === bus.id;
          const isOverloaded = (bus.passenger_count || 0) > (bus.capacity_seated + bus.capacity_standing) * 0.9;

          return (
            <motion.div
              key={bus.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: Math.sin(Date.now() / 2000 + i) * 3,
                y: Math.cos(Date.now() / 2000 + i) * 3,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                scale: { delay: i * 0.03 },
                x: { duration: 4, repeat: Infinity, ease: "linear" },
                y: { duration: 4, repeat: Infinity, ease: "linear" }
              }}
              className="absolute z-20"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => handleBusClick(bus)}
            >
              <motion.div
                whileHover={{ scale: 1.3 }}
                className="relative cursor-pointer"
              >
                {/* Bus marker */}
                <motion.div
                  animate={{ scale: isOverloaded ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 1, repeat: isOverloaded ? Infinity : 0 }}
                  className={`w-4 h-4 rounded-full ${
                    isOverloaded ? 'bg-rose-500' : 'bg-emerald-500'
                  } border-2 border-white shadow-xl ${
                    isOverloaded ? 'shadow-rose-500/50' : 'shadow-emerald-500/50'
                  }`}
                />

                {/* Heading indicator */}
                {bus.heading && (
                  <motion.div
                    style={{ rotate: bus.heading }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full"
                  >
                    <Navigation className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Signal pulse */}
                <motion.div
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-500/50 border-2 border-emerald-400"
                />
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Selected Bus Detail Panel */}
      <AnimatePresence>
        {selectedBus && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 z-50 w-[320px]"
          >
            <Card className="p-5 bg-slate-900/95 border-cyan-500/40 backdrop-blur-xl shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Bus className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedBus.bus_number}</h3>
                    <p className="text-xs text-slate-400">{selectedBus.vehicle_type?.replace('_', ' ')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBus(null)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              {selectedBus.current_line_id && (
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 mb-3">
                  Line {selectedBus.current_line_id}
                </Badge>
              )}

              <div className="space-y-3">
                {/* Passenger Load */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Passenger Load</span>
                    <span className={`text-sm font-bold ${
                      (selectedBus.passenger_count || 0) > (selectedBus.capacity_seated + selectedBus.capacity_standing) * 0.9
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}>
                      {selectedBus.passenger_count || 0}/{(selectedBus.capacity_seated || 0) + (selectedBus.capacity_standing || 0)}
                    </span>
                  </div>
                  <Progress 
                    value={((selectedBus.passenger_count || 0) / ((selectedBus.capacity_seated || 1) + (selectedBus.capacity_standing || 1))) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Battery/Fuel */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {selectedBus.fuel_type === 'electric' ? (
                        <Battery className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs text-slate-400">
                        {selectedBus.fuel_type === 'electric' ? 'Battery' : 'Fuel'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {selectedBus.battery_level || selectedBus.fuel_level || 0}%
                    </span>
                  </div>
                  <Progress value={selectedBus.battery_level || selectedBus.fuel_level || 0} className="h-2" />
                  {selectedBus.battery_range_km && (
                    <p className="text-xs text-slate-500 mt-1">{selectedBus.battery_range_km} km range</p>
                  )}
                </div>

                {/* Speed & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Speed</p>
                    <p className="text-2xl font-bold text-white">{selectedBus.speed || 0}</p>
                    <p className="text-xs text-slate-500">km/h</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Heading</p>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-cyan-400" style={{ transform: `rotate(${selectedBus.heading || 0}deg)` }} />
                      <p className="text-lg font-bold text-white">{selectedBus.heading || 0}°</p>
                    </div>
                  </div>
                </div>

                {/* Driver Info */}
                {selectedBus.driver_id && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <p className="text-xs text-violet-300 mb-1">Assigned Driver</p>
                    <p className="text-white font-medium">Driver #{selectedBus.driver_id}</p>
                  </div>
                )}

                {/* Eco Score */}
                {selectedBus.eco_score > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-300">Eco-Driving Score</span>
                      <span className="text-lg font-bold text-emerald-400">{selectedBus.eco_score}/100</span>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-3 border-t border-slate-700/50">
                  <Button variant="outline" className="w-full mb-2" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Driver
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Track in Detail
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <Card className="p-4 bg-slate-900/95 border-slate-700/50 backdrop-blur-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
                <span className="text-white">Active Bus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-lg" />
                <span className="text-white">Overloaded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400/50 border-2 border-cyan-300" />
                <span className="text-white">Bus Stop</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold text-sm">{buses.length} buses live</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm">{stops.length} stops</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-slate-900/90 border-slate-700/50 backdrop-blur-xl"
          onClick={() => setMapCenter({ x: 50, y: 50 })}
        >
          <TrendingUp className="w-4 h-4 text-cyan-400" />
        </Button>
      </div>
    </div>
  );
}