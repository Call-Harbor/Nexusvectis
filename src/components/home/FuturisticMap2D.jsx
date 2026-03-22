import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const [rotation, setRotation] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.15) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Jarvis background grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Particle field */}
      {Array.from({ length: 100 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-[2px] h-[2px] bg-cyan-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Central globe assembly */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center perspective-1000"
        style={{
          rotateX,
          rotateY,
        }}
      >
        {/* Outer orbital ring */}
        <motion.div
          className="absolute w-[65%] h-[65%]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="url(#gradient1)"
              strokeWidth="0.5"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="gradient1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Mid orbital ring */}
        <motion.div
          className="absolute w-[55%] h-[55%]"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="95"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="0.3"
              strokeDasharray="5,5"
              opacity="0.4"
            />
          </svg>
        </motion.div>

        {/* Globe core */}
        <motion.div
          className="relative w-[45%] h-[45%]"
          animate={{ rotateY: rotation }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glow effect */}
          <div className="absolute inset-[-20%] rounded-full bg-cyan-500/20 blur-3xl" />
          
          {/* Main sphere */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-950/40 via-blue-950/20 to-transparent shadow-[inset_0_0_60px_rgba(6,182,212,0.3),0_0_80px_rgba(6,182,212,0.4)]">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Latitude lines */}
              {[15, 30, 45, 55, 70, 85].map(y => (
                <ellipse
                  key={`lat-${y}`}
                  cx="50"
                  cy="50"
                  rx="48"
                  ry={48 * Math.sin((y - 50) * Math.PI / 100)}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.3)"
                  strokeWidth="0.2"
                  transform={`translate(0, ${y - 50})`}
                />
              ))}
              
              {/* Longitude lines */}
              {[0, 30, 60, 90, 120, 150].map(angle => (
                <ellipse
                  key={`lng-${angle}`}
                  cx="50"
                  cy="50"
                  rx="5"
                  ry="48"
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.3)"
                  strokeWidth="0.2"
                  transform={`rotate(${angle}, 50, 50)`}
                />
              ))}

              {/* Landmass dots */}
              {Array.from({ length: 200 }).map((_, i) => {
                const lat = (Math.random() * 160 - 80) + 50;
                const lng = Math.random() * 100;
                const shouldShow = (
                  (lng > 10 && lng < 35 && lat > 30 && lat < 55) || // N America
                  (lng > 45 && lng < 58 && lat > 35 && lat < 50) || // Europe
                  (lng > 60 && lng < 85 && lat > 30 && lat < 55) || // Asia
                  (lng > 48 && lng < 60 && lat > 55 && lat < 75)    // Africa
                );
                return shouldShow ? (
                  <circle
                    key={`land-${i}`}
                    cx={lng}
                    cy={lat}
                    r="0.3"
                    fill="#06b6d4"
                    opacity="0.7"
                  />
                ) : null;
              })}
            </svg>

            {/* Active nodes */}
            {vehicles.map((vehicle, idx) => {
              const angle = (idx / vehicles.length) * 360;
              const radius = 48;
              return (
                <motion.div
                  key={`node-${idx}`}
                  className="absolute"
                  style={{
                    left: `${50 + radius * Math.cos(angle * Math.PI / 180)}%`,
                    top: `${50 + radius * Math.sin(angle * Math.PI / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <motion.div
                    className="relative w-3 h-3"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.2,
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1)]" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-cyan-400"
                      animate={{
                        scale: [1, 2.5],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: idx * 0.2,
                      }}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Data connection lines */}
          {routes.map((route, idx) => {
            const angle1 = (idx / routes.length) * 360;
            const angle2 = ((idx + 1) / routes.length) * 360;
            return (
              <svg
                key={`connection-${idx}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'translateZ(1px)' }}
              >
                <motion.path
                  d={`M ${50 + 48 * Math.cos(angle1 * Math.PI / 180)} ${50 + 48 * Math.sin(angle1 * Math.PI / 180)} Q 50 50 ${50 + 48 * Math.cos(angle2 * Math.PI / 180)} ${50 + 48 * Math.sin(angle2 * Math.PI / 180)}`}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="0.3"
                  opacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: idx * 0.3 }}
                />
              </svg>
            );
          })}
        </motion.div>

        {/* Scanning circles */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`scan-${i}`}
            className="absolute rounded-full border border-cyan-400/20"
            style={{
              width: `${40 + i * 20}%`,
              height: `${40 + i * 20}%`,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>

      {/* Circular HUD elements */}
      {[
        { angle: 45, distance: 38, label: 'FLEET', value: vehicles.length },
        { angle: 135, distance: 38, label: 'ROUTES', value: routes.length },
        { angle: 225, distance: 38, label: 'HUBS', value: resources.length },
        { angle: 315, distance: 38, label: 'STATUS', value: 'ACTIVE' },
      ].map((item, idx) => (
        <motion.div
          key={`hud-${idx}`}
          className="absolute"
          style={{
            left: `${50 + item.distance * Math.cos(item.angle * Math.PI / 180)}%`,
            top: `${50 + item.distance * Math.sin(item.angle * Math.PI / 180)}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.15 }}
        >
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full border-2 border-cyan-500/40 bg-cyan-950/20 backdrop-blur-sm flex flex-col items-center justify-center"
              whileHover={{ scale: 1.1, borderColor: 'rgba(6, 182, 212, 0.8)' }}
            >
              <div className="text-2xl font-bold text-cyan-400">{item.value}</div>
              <div className="text-[8px] text-cyan-300/60 tracking-widest">{item.label}</div>
            </motion.div>
            
            {/* Connecting line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              <line
                x1="50%"
                y1="50%"
                x2={`${50 - item.distance * Math.cos(item.angle * Math.PI / 180) * 2.5}%`}
                y2={`${50 - item.distance * Math.sin(item.angle * Math.PI / 180) * 2.5}%`}
                stroke="rgba(6, 182, 212, 0.2)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            </svg>
          </div>
        </motion.div>
      ))}

      {/* Corner brackets */}
      {[
        { x: 0, y: 0, rotate: 0 },
        { x: 100, y: 0, rotate: 90 },
        { x: 0, y: 100, rotate: 270 },
        { x: 100, y: 100, rotate: 180 },
      ].map((corner, idx) => (
        <motion.div
          key={`bracket-${idx}`}
          className="absolute w-16 h-16"
          style={{
            left: corner.x === 0 ? '1rem' : 'auto',
            right: corner.x === 100 ? '1rem' : 'auto',
            top: corner.y === 0 ? '1rem' : 'auto',
            bottom: corner.y === 100 ? '1rem' : 'auto',
            transform: `rotate(${corner.rotate}deg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.1 }}
        >
          <svg className="w-full h-full" viewBox="0 0 40 40">
            <path
              d="M 0 8 L 0 0 L 8 0"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              opacity="0.6"
            />
            <circle cx="0" cy="0" r="2" fill="#06b6d4" />
          </svg>
        </motion.div>
      ))}

      {/* Top status bar */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-950/30 border border-cyan-500/40 backdrop-blur-md rounded-full"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-cyan-300 font-mono">SYSTEM ONLINE</span>
          </div>
          <div className="w-px h-4 bg-cyan-500/30" />
          <span className="text-xs text-cyan-400 font-mono">GLOBAL FLEET INTELLIGENCE</span>
        </div>
      </motion.div>

      {/* Bottom info panel */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { label: 'LATENCY', value: '12ms' },
          { label: 'SYNC', value: '99.9%' },
          { label: 'UPTIME', value: '100%' },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className="px-4 py-2 bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-sm rounded"
          >
            <div className="text-[10px] text-cyan-400/60 mb-1">{stat.label}</div>
            <div className="text-sm text-cyan-300 font-mono font-bold">{stat.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Animated scan line */}
      <motion.div
        className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}