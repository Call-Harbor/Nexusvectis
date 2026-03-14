import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Truck, Ship, Plane, Zap, Gauge, Navigation, Droplet, X, Maximize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = {
  truck: Truck,
  ship: Ship,
  aircraft: Plane,
  drone: Zap,
  train: Truck,
};

export default function VehicleHologramCard({ vehicle, x, y, index }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const scale = useTransform(mouseY, [-0.5, 0.5], [0.95, 1.05]);
  
  const Icon = typeIcons[vehicle.type] || Truck;
  
  const statusColor = vehicle.status === 'active' 
    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
    : vehicle.status === 'idle'
    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
    : vehicle.status === 'maintenance'
    ? 'bg-orange-500/20 text-orange-300 border-orange-400/50'
    : 'bg-slate-500/20 text-slate-300 border-slate-400/50';

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
        width: isExpanded ? '500px' : '384px',
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

      <motion.div className="relative" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute -inset-6" style={{ transform: 'translateZ(-20px)' }}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: isHovered ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 blur-lg"
            style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }}
          />
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: isHovered ? [0.3, 0.6, 0.3] : [0.1, 0.3, 0.1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl border border-blue-400/30 blur-xl"
          />
        </div>

        <motion.div 
          className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/95 to-slate-900/98 backdrop-blur-3xl rounded-2xl overflow-hidden border-2 border-cyan-400/70 shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: isHovered 
              ? '0 30px 60px rgba(6, 182, 212, 0.5), 0 0 100px rgba(59, 130, 246, 0.3)'
              : '0 20px 40px rgba(6, 182, 212, 0.3)',
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
              opacity: isHovered ? [0, 0.6, 0] : [0, 0, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{ transform: 'translateZ(60px)' }}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
            <motion.div
              animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-full h-2 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-sm"
            />
          </div>

          <motion.div 
            className="relative px-6 py-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-b-2 border-cyan-400/40"
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
                  <Icon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-cyan-400 rounded-full blur-lg"
                  />
                </motion.div>
                <div>
                  <motion.h3 className="text-lg font-bold text-white tracking-wide drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                    {vehicle.name}
                  </motion.h3>
                  <p className="text-xs text-cyan-300/70 font-mono capitalize">{vehicle.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.div 
                  className={cn("px-3 py-1 rounded-md text-xs font-bold tracking-wider border-2", statusColor)}
                  whileHover={{ scale: 1.1 }}
                >
                  {vehicle.status?.toUpperCase()}
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
          </motion.div>

          <div className="relative p-6 space-y-4" style={{ transform: 'translateZ(30px)' }}>
            {vehicle.destination && (
              <motion.div className="flex items-center gap-3" style={{ transform: 'translateZ(20px)' }}>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-cyan-400/70 font-mono tracking-wider">DESTINATION</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <p className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{vehicle.destination}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div className="grid grid-cols-3 gap-3 pt-3 border-t border-cyan-400/20" style={{ transform: 'translateZ(25px)' }}>
              {vehicle.speed !== undefined && (
                <motion.div 
                  className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-cyan-400/30 relative overflow-hidden"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(6, 182, 212, 0.6)', boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' }}
                  style={{ transform: 'translateZ(15px)' }}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] text-cyan-400/70 font-mono tracking-wider">SPEED</p>
                    <motion.p className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                      {vehicle.speed}
                    </motion.p>
                    <p className="text-[10px] text-slate-400">km/h</p>
                  </div>
                </motion.div>
              )}

              {vehicle.heading !== undefined && (
                <motion.div 
                  className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-blue-400/30 relative overflow-hidden"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.6)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
                  style={{ transform: 'translateZ(15px)' }}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] text-blue-400/70 font-mono tracking-wider">HEADING</p>
                    <motion.p className="text-xl font-bold text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                      {vehicle.heading}°
                    </motion.p>
                  </div>
                </motion.div>
              )}

              {vehicle.fuel_level !== undefined && (
                <motion.div 
                  className="space-y-1 bg-slate-800/60 rounded-lg p-3 border border-emerald-400/30 relative overflow-hidden"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(16, 185, 129, 0.6)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
                  style={{ transform: 'translateZ(15px)' }}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] text-emerald-400/70 font-mono tracking-wider">FUEL</p>
                    <motion.p className="text-xl font-bold text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]">
                      {vehicle.fuel_level}%
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {vehicle.fuel_level !== undefined && (
              <div className="mt-3">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${vehicle.fuel_level}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${
                      vehicle.fuel_level > 50 ? 'bg-emerald-500' : vehicle.fuel_level > 20 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ boxShadow: '0 0 10px currentColor' }}
                  />
                </div>
              </div>
            )}

            {vehicle.latitude && vehicle.longitude && (
              <motion.div 
                className="flex items-center justify-between px-4 py-2 bg-cyan-500/10 border border-cyan-400/30 rounded-lg"
                whileHover={{ borderColor: 'rgba(6, 182, 212, 0.5)', backgroundColor: 'rgba(6, 182, 212, 0.15)' }}
                style={{ transform: 'translateZ(20px)' }}
              >
                <span className="text-xs text-cyan-400 font-mono">COORDINATES</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">
                  {vehicle.latitude.toFixed(4)}°, {vehicle.longitude.toFixed(4)}°
                </span>
              </motion.div>
            )}
          </div>

          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.01, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 border-2 border-cyan-400/50 rounded-2xl pointer-events-none"
            style={{ transform: 'translateZ(80px)' }}
          />
        </motion.div>

        {!isExpanded && (
          <>
            <motion.div 
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-cyan-400/60 to-transparent"
              style={{ height: isHovered ? '50px' : '40px' }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{ scaleX: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            />
          </>
        )}

        {!isExpanded && [...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/60"
            style={{ left: `${20 + i * 15}%`, top: '50%', filter: 'blur(1px)' }}
            animate={{
              y: [-30, -60, -30],
              x: [0, Math.sin(i * 2) * 15, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}