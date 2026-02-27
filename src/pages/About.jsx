import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, TrendingUp, Shield, Zap, Target, Users, Globe, Brain, Rocket, Heart, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingHologramWindow = ({ id, title, icon: Icon, children, onClose, position, isMinimized, onMinimize, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
      onFocus(id);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        zIndex: isFocused ? 9999 : 50,
        width: '480px'
      }}
      className="fixed resize overflow-auto"
      onPointerDown={handlePointerDown}
    >
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/40 overflow-hidden flex flex-col relative group h-fit">
        {/* Hologram effects */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-500/20 pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" style={{ animationDuration: '3s' }} />
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/50 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/50 rounded-br-2xl" />
        
        <div className="relative flex flex-col">
          {/* Header */}
          <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-cyan-500/30 cursor-move touch-none bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                <Icon className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-white font-semibold tracking-wide text-sm">{title}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onMinimize(id)}
                className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onClose(id)}
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3 text-sm text-slate-300 max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function About() {
  const [activeWindows, setActiveWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [focusedWindow, setFocusedWindow] = useState(null);
  const scrollContainerRef = useRef(null);

  const hologramSections = [
    {
      id: 'mission',
      title: "NexusVectis Mission",
      icon: Target,
      position: { x: 100, y: 150 },
      content: (
        <>
          <p className="text-slate-300">Transforming global logistics through quantum-integrated AI and autonomous fleet operations.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Status:</span>
              <span className="text-emerald-400 font-semibold">Operational</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Uptime:</span>
              <span className="text-emerald-400 font-semibold">99.99%</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'ai',
      title: "Fleet AI Intelligence",
      icon: Brain,
      position: { x: 600, y: 200 },
      content: (
        <>
          <p className="text-slate-300">Real-time predictive analytics across 50,000+ vehicles using neural networks and swarm coordination.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Processing:</span>
              <span className="text-emerald-400 font-semibold">2.3M events/sec</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Accuracy:</span>
              <span className="text-emerald-400 font-semibold">99.7%</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'quantum',
      title: "Quantum Logistics",
      icon: Zap,
      position: { x: 1100, y: 300 },
      content: (
        <>
          <p className="text-slate-300">Harness quantum computing for route optimization solving NP-hard problems in milliseconds.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Efficiency Gain:</span>
              <span className="text-emerald-400 font-semibold">+47%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Speed:</span>
              <span className="text-emerald-400 font-semibold">3.2ms</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'network',
      title: "Global Network",
      icon: Globe,
      position: { x: 350, y: 500 },
      content: (
        <>
          <p className="text-slate-300">Real-time monitoring across 180+ countries with sub-100ms latency edge computing.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Coverage:</span>
              <span className="text-emerald-400 font-semibold">180 countries</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Latency:</span>
              <span className="text-emerald-400 font-semibold">&lt;100ms</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'autonomous',
      title: "Autonomous Systems",
      icon: Rocket,
      position: { x: 850, y: 600 },
      content: (
        <>
          <p className="text-slate-300">Self-driving trucks, autonomous drones, and fleet coordination without human intervention.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Fleet Size:</span>
              <span className="text-emerald-400 font-semibold">35,000+</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Autonomy:</span>
              <span className="text-emerald-400 font-semibold">100%</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'security',
      title: "Security & Trust",
      icon: Shield,
      position: { x: 1300, y: 450 },
      content: (
        <>
          <p className="text-slate-300">Military-grade encryption and blockchain verification for every transaction and movement.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Encryption:</span>
              <span className="text-emerald-400 font-semibold">AES-256</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Breaches:</span>
              <span className="text-emerald-400 font-semibold">Zero</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'humans',
      title: "Human-AI Collaboration",
      icon: Users,
      position: { x: 550, y: 800 },
      content: (
        <>
          <p className="text-slate-300">Empowering 50,000+ operators and dispatchers with intuitive AI-assisted decision making.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Operators:</span>
              <span className="text-emerald-400 font-semibold">50,000+</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">Training:</span>
              <span className="text-emerald-400 font-semibold">AI-Enhanced</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'sustainability',
      title: "Sustainability",
      icon: Heart,
      position: { x: 1150, y: 900 },
      content: (
        <>
          <p className="text-slate-300">Reducing carbon emissions by 78% through optimized routing and electric fleet transition.</p>
          <div className="pt-3 border-t border-cyan-500/20 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">CO₂ Reduction:</span>
              <span className="text-emerald-400 font-semibold">78%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400">EV Fleet:</span>
              <span className="text-emerald-400 font-semibold">25,000+</span>
            </div>
          </div>
        </>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      // Spawn windows based on scroll progress
      const newWindows = hologramSections.filter((_, idx) => {
        const threshold = (idx + 1) * (100 / (hologramSections.length + 1));
        return scrollPercent >= threshold;
      });

      setActiveWindows(newWindows.map(w => w.id));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCloseWindow = (id) => {
    setActiveWindows(prev => prev.filter(wid => wid !== id));
  };

  const handleMinimizeWindow = (id) => {
    setMinimizedWindows(prev => new Set([...prev, id]));
  };

  const handleFocusWindow = (id) => {
    setFocusedWindow(id);
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Sci-Fi Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/40" />
        
        {/* Pulsing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Scan lines */}
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,182,212,0.03)_1px,transparent_2px)]"
          style={{ backgroundSize: '100% 2px' }}
          animate={{ backgroundPosition: ['0 0', '0 20px'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating Windows */}
      <AnimatePresence>
        {activeWindows.map(windowId => {
          const hologram = hologramSections.find(h => h.id === windowId);
          if (!hologram) return null;
          
          return (
            <FloatingHologramWindow
              key={windowId}
              id={windowId}
              title={hologram.title}
              icon={hologram.icon}
              position={hologram.position}
              onClose={handleCloseWindow}
              onMinimize={handleMinimizeWindow}
              isMinimized={minimizedWindows.has(windowId)}
              isFocused={focusedWindow === windowId}
              onFocus={handleFocusWindow}
            >
              {hologram.content}
            </FloatingHologramWindow>
          );
        })}
      </AnimatePresence>

      {/* Content Sections - trigger window spawning */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center max-w-4xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            
            <h1 className="text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight">
              NexusVectis
            </h1>
            
            <p className="text-2xl text-slate-300 mb-8">
              The Future of Logistics Intelligence
            </p>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-cyan-400 text-sm mt-20"
            >
              Scroll to initialize hologram analysis →
            </motion.div>
          </motion.div>
        </section>

        {/* Spacer sections to trigger window spawning */}
        {hologramSections.map((_, idx) => (
          <section key={idx} className="min-h-screen flex items-center justify-center" />
        ))}

        {/* Final Section */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl"
          >
            <h2 className="text-4xl font-black text-white mb-6">
              Experience The Future
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of operators experiencing the most advanced logistics intelligence system ever built.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              Start Free Trial
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}