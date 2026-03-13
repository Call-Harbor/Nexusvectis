import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Route, Sparkles, TrendingUp, AlertCircle, Clock, MapPin, Zap, X, Maximize2, Navigation, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function RouteHologramCard({ route, x, y, index, onClose }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 3D rotation transforms
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const scale = useTransform(mouseY, [-0.5, 0.5], [0.95, 1.05]);
  
  // Fetch real-time vehicles on this route
  const { data: routeVehicles = [] } = useQuery({
    queryKey: ['route-vehicles', route.id],
    queryFn: async () => {
      const vehicles = await base44.entities.Vehicle.filter({ route_id: route.id });
      return vehicles;
    },
    refetchInterval: 5000, // Update every 5 seconds
    enabled: !!route.id
  });

  // Fetch route exceptions
  const { data: routeExceptions = [] } = useQuery({
    queryKey: ['route-exceptions', route.id],
    queryFn: async () => {
      const exceptions = await base44.entities.Exception.filter({ 
        route_id: route.id,
        status: { $ne: 'resolved' }
      });
      return exceptions;
    },
    refetchInterval: 10000,
    enabled: !!route.id
  });
  
  const handleMouseMove = (e) => {
    if (!cardRef.current || isExpanded) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(percentX);
    mouseY.set(percentY);
  };
  
  const handleMouseLeave = () => {
    if (!isExpanded) {
      mouseX.set(0);
      mouseY.set(0);
    }
    setIsHovered(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const efficiency = route.ai_optimized ? 95 + Math.random() * 5 : 70 + Math.random() * 15;
  const reliability = 80 + Math.random() * 20;
  const costOptimization = route.ai_optimized ? 85 + Math.random() * 10 : 60 + Math.random() * 20;

  // Calculate real-time progress
  const activeVehicles = routeVehicles.filter(v => v.status === 'active').length;
  const totalProgress = routeVehicles.length > 0
    ? (routeVehicles.reduce((sum, v) => sum + (v.progress || 0), 0) / routeVehicles.length)
    : 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.7, z: -200, rotateY: -30 }}
      animate={{ 
        opacity: 1, 
        scale: isExpanded ? 1.1 : 1, 
        z: isExpanded ? 100 : 0,
        rotateY: 0,
        y: isExpanded ? 0 : [0, -10, 0],
        width: isExpanded ? '600px' : '384px',
        left: isExpanded ? '50%' : x + 180,
        top: isExpanded ? '50%' : y - 200,
        x: isExpanded ? '-50%' : 0,
        y: isExpanded ? '-50%' : [0, -10, 0]
      }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { duration: 0.5, type: "spring" },
        z: { duration: 0.8 },
        rotateY: { duration: 0.8 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        width: { duration: 0.4 },
        left: { duration: 0.4 },
        top: { duration: 0.4 }
      }}
      exit={{ opacity: 0, scale: 0.7, z: -200, rotateY: 30 }}
      style={{
        position: isExpanded ? 'fixed' : 'absolute',
        zIndex: isExpanded ? 10000 : (1000 - index),
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d',
        perspective: '1500px',
        rotateX: isExpanded ? 0 : rotateX,
        rotateY: isExpanded ? 0 : rotateY,
        scale: isExpanded ? 1 : scale
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
    >
      {/* Backdrop blur overlay when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
            style={{ left: 0, top: 0, width: '100vw', height: '100vh' }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Main hologram container with depth layers */}
      <motion.div 
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Dynamic outer glow rings with parallax */}
        <div className="absolute -inset-6" style={{ transform: 'translateZ(-20px)' }}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: isHovered ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 blur-lg"
            style={{
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)'
            }}
          />
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: isHovered ? [0.3, 0.6, 0.3] : [0.1, 0.3, 0.1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl border border-violet-400/30 blur-xl"
          />
        </div>

        {/* Main card with layered depth */}
        <motion.div 
          className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-3xl rounded-2xl overflow-hidden border-2 border-cyan-400/70 shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: isHovered 
              ? '0 30px 60px rgba(6, 182, 212, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)'
              : '0 20px 40px rgba(6, 182, 212, 0.3)',
            maxHeight: isExpanded ? '80vh' : 'auto',
            overflowY: isExpanded ? 'auto' : 'visible'
          }}
        >
          {/* Holographic shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
              opacity: isHovered ? [0, 0.6, 0] : [0, 0, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{ transform: 'translateZ(60px)' }}
          />

          {/* Animated scan lines with depth */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
            <motion.div
              animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-full h-2 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-sm"
            />
          </div>

          {/* Header with controls */}
          <motion.div 
            className="relative px-6 py-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 border-b-2 border-cyan-400/40"
            style={{ transform: 'translateZ(40px)' }}
          >
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  style={{ transform: 'translateZ(10px)' }}
                >
                  <Route className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-cyan-400 rounded-full blur-lg"
                  />
                </motion.div>
                <div>
                  <motion.h3 
                    className="text-lg font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  >
                    {route.name}
                  </motion.h3>
                  <p className="text-xs text-cyan-300/70 font-mono">ID: {route.id?.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div 
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-bold tracking-wider border-2",
                    route.status === 'active' && "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
                    route.status === 'planned' && "bg-blue-500/20 text-blue-300 border-blue-400/50",
                    route.status === 'completed' && "bg-slate-500/20 text-slate-300 border-slate-400/50",
                    route.status === 'delayed' && "bg-amber-500/20 text-amber-300 border-amber-400/50"
                  )}
                  whileHover={{ scale: 1.1 }}
                >
                  {route.status?.toUpperCase() || 'UNKNOWN'}
                </motion.div>

                <motion.button
                  onClick={handleExpand}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  {isExpanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            {/* Real-time status bar */}
            {activeVehicles > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-cyan-400/20"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">{activeVehicles} vehicle{activeVehicles !== 1 ? 's' : ''} active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Progress:</span>
                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      />
                    </div>
                    <span className="text-cyan-400 font-bold">{Math.round(totalProgress)}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Exception alerts */}
            {routeExceptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-amber-400/20"
              >
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{routeExceptions.length} active exception{routeExceptions.length !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Content with parallax depth */}
          <div className="relative p-6 space-y-4" style={{ transform: 'translateZ(30px)' }}>
            {/* Route path visualization */}
            <motion.div 
              className="flex items-center gap-3"
              style={{ transform: 'translateZ(20px)' }}
            >
              <motion.div 
                className="flex-1 space-y-1 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedWaypoint(route.waypoints?.[0])}
                style={{ transform: 'translateZ(10px)' }}
              >
                <p className="text-xs text-cyan-400/70 font-mono tracking-wider">ORIGIN</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <p className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{route.origin}</p>
                </div>
              </motion.div>
              <motion.div
                animate={{ 
                  x: [-5, 5, -5],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
              >
                <Navigation className="w-5 h-5" />
              </motion.div>
              <motion.div 
                className="flex-1 space-y-1 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedWaypoint(route.waypoints?.[route.waypoints.length - 1])}
                style={{ transform: 'translateZ(10px)' }}
              >
                <p className="text-xs text-violet-400/70 font-mono tracking-wider">DESTINATION</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  <p className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{route.destination}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Waypoint details when selected */}
            <AnimatePresence>
              {selectedWaypoint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/60 rounded-lg p-3 border border-cyan-400/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400">WAYPOINT DETAILS</span>
                    <button onClick={() => setSelectedWaypoint(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Name:</span> {selectedWaypoint.name}</p>
                    <p><span className="text-slate-500">Coordinates:</span> {selectedWaypoint.lat?.toFixed(4)}, {selectedWaypoint.lng?.toFixed(4)}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Metrics grid with hover effects */}
            <motion.div 
              className="grid grid-cols-3 gap-3 pt-3 border-t border-cyan-400/20"
              style={{ transform: 'translateZ(25px)' }}
            >
              <motion.div 
                className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-cyan-400/30 relative overflow-hidden"
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(6, 182, 212, 0.6)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                style={{ transform: 'translateZ(15px)' }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <div className="relative z-10">
                  <p className="text-[10px] text-cyan-400/70 font-mono tracking-wider">DISTANCE</p>
                  <motion.p 
                    className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {route.distance_km || 0}
                  </motion.p>
                  <p className="text-[10px] text-slate-400">kilometers</p>
                </div>
              </motion.div>

              <motion.div 
                className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-violet-400/30 relative overflow-hidden"
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(139, 92, 246, 0.6)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                style={{ transform: 'translateZ(15px)' }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <div className="relative z-10">
                  <p className="text-[10px] text-violet-400/70 font-mono tracking-wider">ETA</p>
                  <motion.p 
                    className="text-xl font-bold text-violet-300 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  >
                    {route.estimated_duration_hours || 0}
                  </motion.p>
                  <p className="text-[10px] text-slate-400">hours</p>
                </div>
              </motion.div>

              <motion.div 
                className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-emerald-400/30 relative overflow-hidden"
                whileHover={{ 
                  scale: 1.05, 
                  borderColor: 'rgba(16, 185, 129, 0.6)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                }}
                whileTap={{ scale: 0.95 }}
                style={{ transform: 'translateZ(15px)' }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <div className="relative z-10">
                  <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider">WAYPOINTS</p>
                  <motion.p 
                    className="text-xl font-bold text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  >
                    {route.waypoints?.length || 0}
                  </motion.p>
                  <p className="text-[10px] text-slate-400">stops</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Expanded content: Active vehicles */}
            <AnimatePresence>
              {isExpanded && routeVehicles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-3 border-t border-cyan-400/20"
                >
                  <h4 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">ACTIVE VEHICLES</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {routeVehicles.slice(0, 5).map((vehicle) => (
                      <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-700/40"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-white">{vehicle.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            vehicle.status === 'active' && "bg-emerald-400 animate-pulse",
                            vehicle.status === 'idle' && "bg-amber-400",
                            vehicle.status === 'maintenance' && "bg-red-400"
                          )} />
                          <span className="text-xs text-slate-400">{vehicle.speed || 0} km/h</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expanded content: Exceptions */}
            <AnimatePresence>
              {isExpanded && routeExceptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-3 border-t border-amber-400/20"
                >
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider mb-2">ACTIVE EXCEPTIONS</h4>
                  <div className="space-y-2">
                    {routeExceptions.map((exception) => (
                      <motion.div
                        key={exception.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-amber-500/10 rounded border border-amber-400/30"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-bold text-amber-400">{exception.title}</span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded",
                            exception.severity === 'critical' && "bg-red-500/20 text-red-400",
                            exception.severity === 'high' && "bg-orange-500/20 text-orange-400",
                            exception.severity === 'medium' && "bg-amber-500/20 text-amber-400",
                            exception.severity === 'low' && "bg-blue-500/20 text-blue-400"
                          )}>
                            {exception.severity?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{exception.description}</p>
                        {exception.ai_recommendation && (
                          <div className="mt-2 pt-2 border-t border-amber-400/20">
                            <p className="text-[10px] text-violet-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI: {exception.ai_recommendation}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Analysis with advanced effects */}
            {route.ai_optimized && (
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.3)', 
                    '0 0 40px rgba(139, 92, 246, 0.6)', 
                    '0 0 20px rgba(139, 92, 246, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-2 border-violet-400/50 rounded-lg relative overflow-hidden cursor-pointer"
                style={{ transform: 'translateZ(35px)' }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20"
                  animate={{ 
                    x: ['-100%', '100%'],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    </motion.div>
                    <span className="text-sm font-bold text-violet-300 tracking-wider">AI OPTIMIZATION ACTIVE</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-violet-400/70 font-mono mb-1">EFFICIENCY</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${efficiency}%` }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                          />
                        </div>
                        <span className="text-xs font-bold text-violet-300">{Math.round(efficiency)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-violet-400/70 font-mono mb-1">RELIABILITY</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${reliability}%` }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                          />
                        </div>
                        <span className="text-xs font-bold text-cyan-300">{Math.round(reliability)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-violet-400/70 font-mono mb-1">COST OPT.</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${costOptimization}%` }}
                            transition={{ duration: 1.5, delay: 0.9 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                          />
                        </div>
                        <span className="text-xs font-bold text-emerald-300">{Math.round(costOptimization)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                <span className="text-slate-400">Priority:</span>
                <span className={cn(
                  "font-bold",
                  route.priority === 'critical' && "text-red-400",
                  route.priority === 'high' && "text-orange-400",
                  route.priority === 'normal' && "text-blue-400",
                  route.priority === 'low' && "text-slate-400"
                )}>
                  {route.priority?.toUpperCase() || 'NORMAL'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-slate-400">Type:</span>
                <span className="font-bold text-white uppercase">{route.transport_type || 'N/A'}</span>
              </div>
            </div>

            {route.co2_estimate && (
              <motion.div 
                className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 rounded-lg relative overflow-hidden"
                whileHover={{ 
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)'
                }}
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)' }}
                  />
                  <span className="text-xs text-emerald-400 font-mono">CO₂ EMISSIONS</span>
                </div>
                <motion.span 
                  className="text-sm font-bold text-emerald-300 relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {route.co2_estimate} kg
                </motion.span>
              </motion.div>
            )}
          </div>

          {/* Animated border pulse */}
          <motion.div
            animate={{ 
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.01, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 border-2 border-cyan-400/50 rounded-2xl pointer-events-none"
            style={{ transform: 'translateZ(80px)' }}
          />
        </motion.div>

        {/* Holographic projection lines with depth */}
        {!isExpanded && (
          <>
            <motion.div 
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-cyan-400/60 to-transparent"
              style={{ height: isHovered ? '50px' : '40px' }}
              animate={{ 
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{ 
                scaleX: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            />
          </>
        )}

        {/* Floating holographic particles */}
        {!isExpanded && [...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
            style={{
              left: `${20 + i * 15}%`,
              top: '50%',
              filter: 'blur(1px)'
            }}
            animate={{
              y: [-30, -60, -30],
              x: [0, Math.sin(i * 2) * 15, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}