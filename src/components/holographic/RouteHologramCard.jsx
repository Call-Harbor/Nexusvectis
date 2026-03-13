import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Route, Sparkles, TrendingUp, AlertCircle, Clock, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RouteHologramCard({ route, x, y, index }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // 3D rotation transforms
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const scale = useTransform(mouseY, [-0.5, 0.5], [0.95, 1.05]);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(percentX);
    mouseY.set(percentY);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const efficiency = route.ai_optimized ? 95 + Math.random() * 5 : 70 + Math.random() * 15;
  const reliability = 80 + Math.random() * 20;
  const costOptimization = route.ai_optimized ? 85 + Math.random() * 10 : 60 + Math.random() * 20;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.7, z: -200, rotateY: -30 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        z: 0,
        rotateY: 0,
        y: [0, -10, 0]
      }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { duration: 0.5, type: "spring" },
        z: { duration: 0.8 },
        rotateY: { duration: 0.8 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }}
      exit={{ opacity: 0, scale: 0.7, z: -200, rotateY: 30 }}
      style={{
        position: 'absolute',
        left: x + 180,
        top: y - 200,
        zIndex: 1000 - index,
        pointerEvents: 'auto',
        transformStyle: 'preserve-3d',
        perspective: '1500px',
        rotateX,
        rotateY,
        scale
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="w-96 cursor-pointer"
    >
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
              : '0 20px 40px rgba(6, 182, 212, 0.3)'
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
            <motion.div
              animate={{ y: ['100%', '0%'], opacity: [0, 0.8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.5 }}
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
            />
          </div>

          {/* Animated corner brackets */}
          <motion.div 
            className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-400/80"
            animate={{ borderColor: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 1)', 'rgba(6, 182, 212, 0.8)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transform: 'translateZ(70px)' }}
          />
          <motion.div 
            className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-cyan-400/80"
            animate={{ borderColor: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 1)', 'rgba(6, 182, 212, 0.8)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ transform: 'translateZ(70px)' }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-cyan-400/80"
            animate={{ borderColor: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 1)', 'rgba(6, 182, 212, 0.8)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ transform: 'translateZ(70px)' }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400/80"
            animate={{ borderColor: ['rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 1)', 'rgba(6, 182, 212, 0.8)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            style={{ transform: 'translateZ(70px)' }}
          />

          {/* Header with floating effect */}
          <motion.div 
            className="relative px-6 py-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 border-b-2 border-cyan-400/40"
            style={{ transform: 'translateZ(40px)' }}
          >
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3], x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            />
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
                    animate={{ textShadow: ['0 0 15px rgba(6,182,212,0.6)', '0 0 25px rgba(6,182,212,0.9)', '0 0 15px rgba(6,182,212,0.6)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {route.name}
                  </motion.h3>
                  <p className="text-xs text-cyan-300/70 font-mono">ID: {route.id?.slice(0, 8)}</p>
                </div>
              </div>
              <motion.div 
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-bold tracking-wider border-2",
                  route.status === 'active' && "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
                  route.status === 'planned' && "bg-blue-500/20 text-blue-300 border-blue-400/50",
                  route.status === 'completed' && "bg-slate-500/20 text-slate-300 border-slate-400/50",
                  route.status === 'delayed' && "bg-amber-500/20 text-amber-300 border-amber-400/50"
                )}
                whileHover={{ scale: 1.1, borderWidth: '3px' }}
                style={{ transform: 'translateZ(5px)' }}
              >
                {route.status?.toUpperCase() || 'UNKNOWN'}
              </motion.div>
            </div>
          </motion.div>

          {/* Content with parallax depth */}
          <div className="relative p-6 space-y-4" style={{ transform: 'translateZ(30px)' }}>
            {/* Route path visualization */}
            <motion.div 
              className="flex items-center gap-3"
              style={{ transform: 'translateZ(20px)' }}
            >
              <motion.div 
                className="flex-1 space-y-1"
                whileHover={{ scale: 1.05 }}
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
                →
              </motion.div>
              <motion.div 
                className="flex-1 space-y-1"
                whileHover={{ scale: 1.05 }}
                style={{ transform: 'translateZ(10px)' }}
              >
                <p className="text-xs text-violet-400/70 font-mono tracking-wider">DESTINATION</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  <p className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{route.destination}</p>
                </div>
              </motion.div>
            </motion.div>

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
                className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-2 border-violet-400/50 rounded-lg relative overflow-hidden"
                style={{ transform: 'translateZ(35px)' }}
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

          {/* Animated corner data points */}
          <motion.div 
            className="absolute top-2 left-2 w-2 h-2 bg-cyan-400 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ 
              transform: 'translateZ(90px)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)'
            }}
          />
          <motion.div 
            className="absolute top-2 right-2 w-2 h-2 bg-violet-400 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ 
              transform: 'translateZ(90px)',
              boxShadow: '0 0 10px rgba(139, 92, 246, 0.8)'
            }}
          />
          <motion.div 
            className="absolute bottom-2 left-2 w-2 h-2 bg-emerald-400 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ 
              transform: 'translateZ(90px)',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)'
            }}
          />
          <motion.div 
            className="absolute bottom-2 right-2 w-2 h-2 bg-amber-400 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            style={{ 
              transform: 'translateZ(90px)',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)'
            }}
          />
        </motion.div>

        {/* Holographic projection lines with depth */}
        <motion.div 
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-cyan-400/60 to-transparent"
          style={{ height: isHovered ? '50px' : '40px' }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            boxShadow: [
              '0 0 5px rgba(6, 182, 212, 0.3)',
              '0 0 15px rgba(6, 182, 212, 0.6)',
              '0 0 5px rgba(6, 182, 212, 0.3)'
            ]
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

        {/* Floating holographic particles */}
        {[...Array(5)].map((_, i) => (
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