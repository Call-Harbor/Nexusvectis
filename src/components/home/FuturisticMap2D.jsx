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
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
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

        {/* World Map Outline - Simplified Continents */}
        <g className="opacity-20 stroke-cyan-400" fill="none" strokeWidth="0.15">
          {/* Europe */}
          <path d="M 45 25 L 48 24 L 50 26 L 52 25 L 54 27 L 52 29 L 50 28 L 48 30 L 46 29 L 45 27 Z" />
          {/* North America */}
          <path d="M 15 20 L 20 18 L 25 20 L 28 25 L 25 30 L 22 32 L 18 30 L 15 25 Z" />
          {/* South America */}
          <path d="M 25 45 L 28 43 L 30 45 L 32 50 L 30 55 L 27 58 L 25 56 L 23 52 L 25 48 Z" />
          {/* Africa */}
          <path d="M 48 38 L 52 36 L 55 38 L 56 42 L 54 48 L 52 52 L 48 50 L 46 45 L 48 40 Z" />
          {/* Asia */}
          <path d="M 60 22 L 68 20 L 75 24 L 78 28 L 75 32 L 70 35 L 65 33 L 62 28 L 60 25 Z" />
          {/* Australia */}
          <path d="M 72 52 L 76 50 L 80 52 L 82 56 L 78 58 L 74 57 L 72 54 Z" />
        </g>

        {/* Grid lines - latitude/longitude */}
        <g className="opacity-10 stroke-cyan-500" strokeWidth="0.08">
          {[...Array(9)].map((_, i) => (
            <line key={`lat-${i}`} x1="0" y1={i * 12.5} x2="100" y2={i * 12.5} />
          ))}
          {[...Array(9)].map((_, i) => (
            <line key={`lng-${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="100" />
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

      {/* Overlay stats */}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 text-xs font-bold">{vehicles.length} Active</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-3 h-3 text-violet-400" />
            <span className="text-violet-300 text-xs font-bold">{routes.length} Routes</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold">{resources.length} Hubs</span>
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

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/40 opacity-40" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-500/40 opacity-40" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-500/40 opacity-40" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/40 opacity-40" />
    </div>
  );
}