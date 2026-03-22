import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Zap, Globe, Activity } from "lucide-react";

export default function FuturisticMap2D({ vehicles = [], routes = [], resources = [] }) {
  const [rotation, setRotation] = useState(0);
  const [dataPoints, setDataPoints] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.3) % 360);
    }, 50);
    
    // Generate random floating data points
    const points = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
    setDataPoints(points);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0e1a]">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f172a_0%,_#020617_100%)]" />
      
      {/* Animated stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-[2px] h-[2px] bg-cyan-400/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Central globe container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Orbital rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border border-cyan-500/20"
            style={{
              width: `${40 + i * 15}%`,
              height: `${40 + i * 15}%`,
              transform: `rotateX(75deg) rotateZ(${i * 45}deg)`,
            }}
            animate={{
              rotateZ: [i * 45, i * 45 + 360],
            }}
            transition={{
              duration: 20 - i * 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Main globe sphere */}
        <motion.div
          className="relative"
          style={{
            width: '35%',
            height: '35%',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: rotation,
          }}
        >
          {/* Globe glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-violet-500/30 blur-2xl" />
          
          {/* Globe mesh */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.5)]">
            {/* Latitude lines */}
            {[20, 35, 50, 65, 80].map((percent) => (
              <div
                key={`lat-${percent}`}
                className="absolute left-0 right-0 border-t border-cyan-500/20"
                style={{ top: `${percent}%` }}
              />
            ))}
            
            {/* Longitude lines */}
            {[0, 30, 60, 90, 120, 150].map((deg) => (
              <div
                key={`lng-${deg}`}
                className="absolute inset-0 border-l border-cyan-500/20"
                style={{
                  transform: `rotateY(${deg}deg)`,
                  borderRadius: '50%',
                }}
              />
            ))}

            {/* Continents as dots pattern */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* North America */}
              {Array.from({ length: 30 }).map((_, i) => (
                <circle
                  key={`na-${i}`}
                  cx={15 + Math.random() * 15}
                  cy={20 + Math.random() * 20}
                  r="0.4"
                  fill="#06b6d4"
                  opacity="0.6"
                />
              ))}
              {/* Europe */}
              {Array.from({ length: 20 }).map((_, i) => (
                <circle
                  key={`eu-${i}`}
                  cx={48 + Math.random() * 8}
                  cy={22 + Math.random() * 10}
                  r="0.4"
                  fill="#06b6d4"
                  opacity="0.6"
                />
              ))}
              {/* Asia */}
              {Array.from({ length: 40 }).map((_, i) => (
                <circle
                  key={`as-${i}`}
                  cx={60 + Math.random() * 20}
                  cy={20 + Math.random() * 20}
                  r="0.4"
                  fill="#06b6d4"
                  opacity="0.6"
                />
              ))}
            </svg>
          </div>

          {/* Active location pulses */}
          {vehicles.map((vehicle, idx) => {
            const angle = (idx / vehicles.length) * 360;
            const radius = 45;
            return (
              <motion.div
                key={`pulse-${idx}`}
                className="absolute w-2 h-2 -ml-1 -mt-1"
                style={{
                  left: `${50 + radius * Math.cos(angle * Math.PI / 180)}%`,
                  top: `${50 + radius * Math.sin(angle * Math.PI / 180)}%`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: idx * 0.2,
                }}
              >
                <div className="w-full h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)]" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Connection lines from center */}
        {routes.map((route, idx) => {
          const angle = (idx / routes.length) * 360;
          return (
            <motion.div
              key={`line-${idx}`}
              className="absolute w-[1px] bg-gradient-to-t from-cyan-500/50 to-transparent origin-bottom"
              style={{
                height: '30%',
                left: '50%',
                bottom: '50%',
                transform: `rotate(${angle}deg)`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: idx * 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Floating HUD panels */}
      {dataPoints.slice(0, 8).map((point, idx) => (
        <motion.div
          key={`panel-${point.id}`}
          className="absolute px-3 py-2 bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md rounded"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [-20, -40, -60],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: point.duration,
            repeat: Infinity,
            delay: point.delay,
          }}
        >
          <div className="text-[10px] text-cyan-400 font-mono">
            {['789.4', '152.68', '903.25', '268', '743.06', '921', '85', '65'][idx]}
          </div>
        </motion.div>
      ))}

      {/* Floating data icons */}
      {[
        { Icon: Globe, x: 15, y: 20, rotate: -15 },
        { Icon: Activity, x: 75, y: 25, rotate: 10 },
        { Icon: TrendingUp, x: 20, y: 70, rotate: -20 },
        { Icon: Zap, x: 80, y: 65, rotate: 15 },
      ].map((item, idx) => (
        <motion.div
          key={`icon-${idx}`}
          className="absolute"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [item.rotate - 5, item.rotate + 5, item.rotate - 5],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4 + idx,
            repeat: Infinity,
          }}
        >
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
            <item.Icon className="w-5 h-5 text-cyan-400/60" />
          </div>
        </motion.div>
      ))}

      {/* Corner HUD elements */}
      {[
        { corner: 'top-left', text: 'SYSTEM ACTIVE', x: 6, y: 6 },
        { corner: 'top-right', text: 'LIVE FEED', x: 'auto', y: 6, right: 6 },
        { corner: 'bottom-left', text: 'ENCRYPTED', x: 6, y: 'auto', bottom: 6 },
        { corner: 'bottom-right', text: 'GLOBAL SYNC', x: 'auto', y: 'auto', right: 6, bottom: 6 },
      ].map((corner, idx) => (
        <motion.div
          key={`corner-${idx}`}
          className="absolute"
          style={{
            left: corner.x !== 'auto' ? `${corner.x}%` : undefined,
            right: corner.right ? `${corner.right}%` : undefined,
            top: corner.y !== 'auto' ? `${corner.y}%` : undefined,
            bottom: corner.bottom ? `${corner.bottom}%` : undefined,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.2 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-300 font-mono tracking-wider">{corner.text}</span>
          </div>
        </motion.div>
      ))}

      {/* Stats overlay */}
      <div className="absolute top-6 left-6 space-y-2">
        {[
          { label: 'ACTIVE FLEET', value: vehicles.length, color: 'cyan' },
          { label: 'OPTIMIZED ROUTES', value: routes.length, color: 'violet' },
          { label: 'GLOBAL HUBS', value: resources.length, color: 'emerald' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            className={`px-4 py-2 bg-${stat.color}-950/40 border border-${stat.color}-500/40 backdrop-blur-md rounded-lg`}
          >
            <div className="flex items-baseline gap-3">
              <span className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
    </div>
  );
}