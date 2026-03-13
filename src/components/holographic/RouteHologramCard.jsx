import React from 'react';
import { motion } from 'framer-motion';
import { Route, Sparkles, TrendingUp, AlertCircle, Clock, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RouteHologramCard({ route, x, y, index }) {
  const efficiency = route.ai_optimized ? 95 + Math.random() * 5 : 70 + Math.random() * 15;
  const reliability = 80 + Math.random() * 20;
  const costOptimization = route.ai_optimized ? 85 + Math.random() * 10 : 60 + Math.random() * 20;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
        y: [0, -8, 0]
      }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 },
        rotateY: { duration: 0.6 },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
      exit={{ opacity: 0, scale: 0.7 }}
      style={{
        position: 'absolute',
        left: x + 180,
        top: y - 200,
        zIndex: 1000 - index,
        pointerEvents: 'none',
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      className="w-96"
    >
      {/* Main hologram container */}
      <div className="relative">
        {/* Outer glow rings */}
        <div className="absolute -inset-4">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30 blur-sm"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl border-2 border-violet-400/20 blur-md"
          />
        </div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-2xl rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-2xl">
          {/* Animated scan lines */}
          <motion.div
            animate={{ y: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-32 pointer-events-none"
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400/80" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-400/80" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-400/80" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-400/80" />

          {/* Header */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 border-b-2 border-cyan-400/40">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Route className="w-6 h-6 text-cyan-400" />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-cyan-400 rounded-full blur-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{route.name}</h3>
                  <p className="text-xs text-cyan-300/70 font-mono">ID: {route.id?.slice(0, 8)}</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-md text-xs font-bold tracking-wider border-2",
                route.status === 'active' && "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
                route.status === 'planned' && "bg-blue-500/20 text-blue-300 border-blue-400/50",
                route.status === 'completed' && "bg-slate-500/20 text-slate-300 border-slate-400/50",
                route.status === 'delayed' && "bg-amber-500/20 text-amber-300 border-amber-400/50"
              )}>
                {route.status?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 space-y-4">
            {/* Route path */}
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <p className="text-xs text-cyan-400/70 font-mono tracking-wider">ORIGIN</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm font-bold text-white">{route.origin}</p>
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-cyan-400"
              >
                →
              </motion.div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-violet-400/70 font-mono tracking-wider">DESTINATION</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400" />
                  <p className="text-sm font-bold text-white">{route.destination}</p>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-cyan-400/20">
              <div className="space-y-1 bg-slate-800/50 rounded-lg p-3 border border-cyan-400/30">
                <p className="text-[10px] text-cyan-400/70 font-mono tracking-wider">DISTANCE</p>
                <p className="text-xl font-bold text-cyan-300">{route.distance_km || 0}</p>
                <p className="text-[10px] text-slate-400">kilometers</p>
              </div>
              <div className="space-y-1 bg-slate-800/50 rounded-lg p-3 border border-violet-400/30">
                <p className="text-[10px] text-violet-400/70 font-mono tracking-wider">ETA</p>
                <p className="text-xl font-bold text-violet-300">{route.estimated_duration_hours || 0}</p>
                <p className="text-[10px] text-slate-400">hours</p>
              </div>
              <div className="space-y-1 bg-slate-800/50 rounded-lg p-3 border border-emerald-400/30">
                <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider">WAYPOINTS</p>
                <p className="text-xl font-bold text-emerald-300">{route.waypoints?.length || 0}</p>
                <p className="text-[10px] text-slate-400">stops</p>
              </div>
            </div>

            {/* AI Analysis */}
            {route.ai_optimized && (
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 20px rgba(139, 92, 246, 0.3)', '0 0 30px rgba(139, 92, 246, 0.5)', '0 0 20px rgba(139, 92, 246, 0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-2 border-violet-400/40 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-bold text-violet-300 tracking-wider">AI OPTIMIZATION ACTIVE</span>
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
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400"
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
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-400"
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
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-300">{Math.round(costOptimization)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-amber-400" />
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
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Type:</span>
                <span className="font-bold text-white uppercase">{route.transport_type || 'N/A'}</span>
              </div>
            </div>

            {route.co2_estimate && (
              <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-mono">CO₂ EMISSIONS</span>
                </div>
                <span className="text-sm font-bold text-emerald-300">{route.co2_estimate} kg</span>
              </div>
            )}
          </div>

          {/* Animated border pulse */}
          <motion.div
            animate={{ 
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 border-2 border-cyan-400/40 rounded-2xl pointer-events-none"
          />

          {/* Corner data points */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Holographic projection lines */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-cyan-400/60 to-transparent" />
        <motion.div
          animate={{ scaleY: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
        />
      </div>
    </motion.div>
  );
}