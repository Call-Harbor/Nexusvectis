import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Globe, Target, Users, TrendingUp, Heart, X, Minimize2, ArrowRight } from "lucide-react";
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
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
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
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{ left: pos.x, top: pos.y, zIndex: isFocused ? 9999 : 50, width: 480 }}
      className="fixed"
      onPointerDown={handlePointerDown}
    >
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600/40 to-blue-600/40 rounded-xl blur-lg opacity-50 pointer-events-none" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-xl border border-cyan-500/40 overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          <div className="relative z-10">
            {/* Header */}
            <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-cyan-500/20 cursor-move bg-gradient-to-r from-slate-900/50 to-slate-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40">
                  <Icon className="w-4 h-4 text-cyan-300" />
                </div>
                <span className="text-white font-semibold text-sm">{title}</span>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </motion.div>
              </div>
              <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onMinimize(id)} 
                  className="h-7 w-7 rounded hover:bg-cyan-500/30 flex items-center justify-center text-cyan-400 transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onClose(id)} 
                  className="h-7 w-7 rounded hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-3 text-sm text-slate-300 max-h-[450px] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function About() {
  const [activeWindows, setActiveWindows] = useState([
    'story', 'mission', 'team', 'values'
  ]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [focusedWindow, setFocusedWindow] = useState(null);

  const windows = [
    {
      id: 'story',
      title: "Our Story",
      icon: Globe,
      position: { x: 100, y: 200 },
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">Founded in Copenhagen 2018, we identified a critical gap: logistics systems were reactive, not intelligent. We built the solution.</p>
          
          <div className="space-y-2 pt-2">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
              <div className="font-semibold text-cyan-300 text-xs mb-1">2018</div>
              <p className="text-xs text-slate-400">Launched predictive maintenance. First client saw 32% downtime reduction.</p>
            </div>
            
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/25">
              <div className="font-semibold text-blue-300 text-xs mb-1">2021</div>
              <p className="text-xs text-slate-400">Series A: €12M. Expanded to route optimization and forecasting.</p>
            </div>
            
            <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/25">
              <div className="font-semibold text-violet-300 text-xs mb-1">2025</div>
              <p className="text-xs text-slate-400">#1 AI logistics platform. 250+ customers. 50K vehicles coordinated.</p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'mission',
      title: "Mission",
      icon: Target,
      position: { x: 620, y: 150 },
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Our Mission</h3>
            <p className="text-xs leading-relaxed text-slate-300">Empower logistics organizations with AI intelligence that optimizes operations, reduces costs, and minimizes environmental impact.</p>
          </div>

          <div className="h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />

          <div>
            <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">Our Vision</h3>
            <p className="text-xs leading-relaxed text-slate-300">A world where supply chains operate with perfect efficiency through autonomous, self-learning AI systems.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-center">
              <div className="text-sm font-bold text-cyan-300">250+</div>
              <div className="text-xs text-slate-400">Team Members</div>
            </div>
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/25 text-center">
              <div className="text-sm font-bold text-violet-300">45</div>
              <div className="text-xs text-slate-400">Countries</div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'team',
      title: "Leadership",
      icon: Users,
      position: { x: 1140, y: 320 },
      content: (
        <div className="space-y-2">
          {[
            { name: "Henrik Andersen", role: "CEO/Founder", desc: "PhD ML, 15y autonomous systems" },
            { name: "Sarah Chen", role: "CTO", desc: "Amazon AI lead, distributed systems" },
            { name: "Marco Rodriguez", role: "VP Ops", desc: "15y logistics, ex-Maersk" },
            { name: "Natalia Volkov", role: "AI Lead", desc: "40+ ML papers, PhD Moscow State" }
          ].map((m, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/40">
              <div className="font-semibold text-cyan-300 text-xs">{m.name}</div>
              <div className="text-xs text-slate-400">{m.role}</div>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>
      )
    },

    {
      id: 'values',
      title: "Values",
      icon: Heart,
      position: { x: 380, y: 520 },
      content: (
        <div className="space-y-2">
          {[
            { title: "Intelligence Driven", color: "cyan" },
            { title: "Customer Obsessed", color: "blue" },
            { title: "Sustainable Impact", color: "emerald" },
            { title: "Continuous Learning", color: "violet" },
            { title: "Transparent & Secure", color: "pink" }
          ].map((v, i) => (
            <div key={i} className={`p-2.5 rounded-lg bg-${v.color}-500/10 border border-${v.color}-500/25`}>
              <div className={`font-semibold text-${v.color}-300 text-xs`}>{v.title}</div>
            </div>
          ))}
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      const show = [];
      if (scrollPercent > 5) show.push('story');
      if (scrollPercent > 15) show.push('mission');
      if (scrollPercent > 30) show.push('team');
      if (scrollPercent > 45) show.push('values');
      
      setActiveWindows(show);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Simplified background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/30" />
        
        {/* Two main floating elements */}
        <motion.div 
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px]"
          animate={{ 
            y: [0, 30, 0],
            opacity: [0.2, 0.4, 0.2]
          }} 
          transition={{ duration: 12, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), transparent)' }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.2, 0.4, 0.2]
          }} 
          transition={{ duration: 14, repeat: Infinity, delay: 2 }}
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent)' }}
        />

        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Windows */}
      <AnimatePresence>
        {activeWindows.map(id => {
          const win = windows.find(w => w.id === id);
          return win ? (
            <FloatingHologramWindow
              key={id}
              id={id}
              title={win.title}
              icon={win.icon}
              position={win.position}
              onClose={() => setActiveWindows(prev => prev.filter(x => x !== id))}
              onMinimize={() => setMinimizedWindows(prev => new Set([...prev, id]))}
              isMinimized={minimizedWindows.has(id)}
              isFocused={focusedWindow === id}
              onFocus={(id) => setFocusedWindow(id)}
            >
              {win.content}
            </FloatingHologramWindow>
          ) : null;
        })}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
              className="inline-block mb-6"
            >
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            <h1 className="text-7xl font-black text-white mb-4 tracking-tight">NexusVectis</h1>
            <p className="text-xl text-slate-400 max-w-2xl">Enterprise AI powering the world's most advanced logistics networks</p>
          </motion.div>
        </section>

        {/* Spacing */}
        <section className="h-screen" />
        <section className="h-screen" />
        <section className="h-screen" />

        {/* CTA */}
        <section className="h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="text-center max-w-2xl"
          >
            <h2 className="text-5xl font-black text-white mb-6">Transforming Global Logistics</h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              250+ enterprises trust NexusVectis to optimize operations, reduce costs by 30%, and cut emissions by 78%.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 text-white px-8 py-3 font-bold rounded-lg">
                  Request Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 font-bold rounded-lg">
                  Learn More
                </Button>
              </motion.div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: "2B+", label: "Shipments" },
                { num: "50K+", label: "Vehicles" },
                { num: "45", label: "Countries" },
                { num: "250+", label: "Customers" }
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-lg bg-slate-900/40 border border-slate-800"
                >
                  <div className="text-2xl font-black text-cyan-400">{s.num}</div>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}