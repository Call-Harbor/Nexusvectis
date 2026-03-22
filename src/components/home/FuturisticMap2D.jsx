import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin, Radio, Zap, Navigation } from "lucide-react";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const [pulsePhase, setPulsePhase] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Convert lat/lng to SVG coordinates (simple equirectangular projection)
  const project = (lat, lng) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
      
      {/* Animated scanlines */}
      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 1) 2px, rgba(6, 182, 212, 1) 4px)',
        }}
        animate={{ backgroundPositionY: ['0px', '100px'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[100px]"
        animate={{
          scale: [1.1, 0.9, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* SVG Map Layer */}
      <svg className="relative w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Glow filters */}
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-violet">
            <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* World Map Outline - Better Continents */}
        <g fill="rgba(6, 182, 212, 0.08)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.12">
          {/* North America */}
          <path d="M 18,20 L 22,18 L 26,19 L 28,22 L 30,26 L 28,30 L 25,33 L 22,35 L 19,34 L 17,31 L 16,27 L 17,23 Z" />
          {/* South America */}
          <path d="M 24,42 L 27,40 L 29,42 L 30,46 L 31,52 L 29,56 L 26,58 L 23,56 L 22,52 L 23,46 Z" />
          {/* Europe */}
          <path d="M 47,24 L 50,23 L 52,24 L 54,26 L 53,28 L 51,29 L 49,28 L 47,27 Z" />
          {/* Africa */}
          <path d="M 47,36 L 51,34 L 54,36 L 56,40 L 56,46 L 54,52 L 50,54 L 47,52 L 46,46 L 46,40 Z" />
          {/* Asia */}
          <path d="M 58,20 L 65,18 L 72,20 L 78,24 L 80,28 L 78,32 L 73,35 L 67,34 L 62,30 L 59,26 Z" />
          {/* Australia */}
          <path d="M 75,52 L 79,50 L 82,52 L 83,55 L 81,58 L 77,59 L 74,57 L 73,54 Z" />
        </g>

        {/* Dotted grid - subtle */}
        <g className="opacity-[0.15] stroke-cyan-500" strokeWidth="0.05" strokeDasharray="0.3,1">
          {[...Array(7)].map((_, i) => (
            <line key={`lat-${i}`} x1="10" y1={15 + i * 12} x2="90" y2={15 + i * 12} />
          ))}
          {[...Array(7)].map((_, i) => (
            <line key={`lng-${i}`} x1={15 + i * 12} y1="10" x2={15 + i * 12} y2="90" />
          ))}
        </g>

        {/* Route arcs with animated flow */}
        {routes.map((route, idx) => {
          const waypoints = route.waypoints || [];
          if (waypoints.length < 2) return null;
          
          const colors = ['#06b6d4', '#8b5cf6', '#10b981'];
          const color = colors[idx % colors.length];
          
          return waypoints.slice(0, -1).map((wp, i) => {
            const start = project(wp.lat, wp.lng);
            const end = project(waypoints[i + 1].lat, waypoints[i + 1].lng);
            const mid = {
              x: (start.x + end.x) / 2,
              y: Math.min(start.y, end.y) - 5
            };
            
            return (
              <g key={`route-${idx}-${i}`}>
                <motion.path
                  d={`M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.15"
                  opacity="0.5"
                  filter="url(#glow-cyan)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: idx * 0.3 }}
                />
                {/* Animated flow particle */}
                <motion.circle
                  r="0.3"
                  fill={color}
                  filter="url(#glow-cyan)"
                  animate={{
                    offsetDistance: ['0%', '100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: idx * 0.5,
                    ease: "linear"
                  }}
                >
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={`M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`}
                  />
                </motion.circle>
              </g>
            );
          });
        })}

        {/* Resources - pulsing markers */}
        {resources.map((resource, idx) => {
          const pos = project(resource.latitude, resource.longitude);
          const pulseScale = 1 + 0.3 * Math.sin((pulsePhase + idx * 30) * Math.PI / 180);
          
          return (
            <g key={`resource-${idx}`}>
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={pulseScale * 0.6}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="0.15"
                opacity={0.6}
                filter="url(#glow-violet)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="0.35"
                fill="#fbbf24"
                filter="url(#glow-violet)"
              />
            </g>
          );
        })}

        {/* Vehicles - animated with heading */}
        {vehicles.map((vehicle, idx) => {
          const pos = project(vehicle.latitude, vehicle.longitude);
          const isMoving = vehicle.speed > 0;
          const heading = vehicle.heading || 0;
          
          const statusColor = {
            active: '#06b6d4',
            idle: '#fbbf24',
            maintenance: '#f97316',
            offline: '#64748b'
          }[vehicle.status] || '#06b6d4';
          
          return (
            <g key={`vehicle-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Pulsing ring */}
              <motion.circle
                r="0.8"
                fill="none"
                stroke={statusColor}
                strokeWidth="0.1"
                opacity={isMoving ? 0.6 : 0.3}
                animate={{
                  r: [0.8, 1.4, 0.8],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: idx * 0.2
                }}
              />
              
              {/* Vehicle marker */}
              <motion.g
                animate={isMoving ? {
                  rotate: [0, 360]
                } : {}}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <polygon
                  points="0,-0.5 0.3,0.3 -0.3,0.3"
                  fill={statusColor}
                  filter="url(#glow-cyan)"
                  transform={`rotate(${heading})`}
                />
              </motion.g>
              
              {/* Speed trail for moving vehicles */}
              {isMoving && (
                <motion.line
                  x1="0"
                  y1="0"
                  x2={-Math.sin(heading * Math.PI / 180) * 1.5}
                  y2={Math.cos(heading * Math.PI / 180) * 1.5}
                  stroke={statusColor}
                  strokeWidth="0.08"
                  opacity="0.4"
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}

        {/* Scanning lines effect */}
        <motion.line
          x1="0"
          y1="0"
          x2="100"
          y2="0"
          stroke="url(#scan-gradient)"
          strokeWidth="0.2"
          opacity="0.3"
          animate={{
            y1: [0, 100],
            y2: [0, 100],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <defs>
          <linearGradient id="scan-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Overlay stats - redesigned */}
      <div className="absolute top-6 left-6 space-y-3 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-400/40 backdrop-blur-xl shadow-lg shadow-cyan-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white text-sm font-bold">{vehicles.length}</span>
            <span className="text-cyan-300 text-xs">Vehicles Active</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-violet-500/10 border border-violet-400/40 backdrop-blur-xl shadow-lg shadow-violet-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-white text-sm font-bold">{routes.length}</span>
            <span className="text-violet-300 text-xs">Routes Optimized</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-400/40 backdrop-blur-xl shadow-lg shadow-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-white text-sm font-bold">{resources.length}</span>
            <span className="text-amber-300 text-xs">Global Hubs</span>
          </div>
        </motion.div>
      </div>

      {/* Scanning effect overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Corner UI elements */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg" />
      
      {/* Bottom status bar */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-cyan-500/30 backdrop-blur-xl">
        <Zap className="w-4 h-4 text-cyan-400" />
        <span className="text-cyan-300 text-xs font-mono">LIVE TRACKING</span>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </div>
  );
}