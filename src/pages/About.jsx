import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Globe, Target, Users, TrendingUp, Heart, X, Minimize2, ArrowRight, Zap, Database, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const DataHologram = ({ id, title, icon: Icon, children, onClose, position, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
      onFocus(id);
      setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
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

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 350 }}
      style={{ left: pos.x, top: pos.y, zIndex: isFocused ? 9999 : 50, width: 520 }}
      className="fixed"
      onPointerDown={handlePointerDown}
    >
      <div className="relative group">
        {/* Premium glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/50 via-blue-600/40 to-cyan-600/50 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative bg-slate-900/85 backdrop-blur-2xl rounded-xl border border-cyan-500/50 overflow-hidden">
          {/* Animated top accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="relative z-10">
            {/* Header */}
            <div 
              ref={headerRef} 
              className="flex items-center justify-between p-4 border-b border-cyan-500/20 cursor-move bg-gradient-to-r from-slate-900/40 to-slate-950/40 select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/30 border border-cyan-400/50">
                  <Icon className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{title}</div>
                  <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="text-cyan-400 text-xs mt-0.5">● LIVE</div>
                  </motion.div>
                </div>
              </div>
              <button 
                onClick={() => onClose(id)} 
                className="h-7 w-7 rounded hover:bg-red-500/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-3 text-sm text-slate-300 max-h-96 overflow-y-auto scrollbar-hide">
              {children}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function About() {
  const [activeWindows, setActiveWindows] = useState(['capabilities', 'stats', 'platform']);
  const [focusedWindow, setFocusedWindow] = useState(null);

  const windows = [
    {
      id: 'capabilities',
      title: "Our Capabilities",
      icon: Zap,
      position: { x: 80, y: 200 },
      content: (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="text-cyan-400 text-sm mt-0.5">→</div>
              <div>
                <div className="font-semibold text-cyan-300 text-sm">AI-Powered Optimization</div>
                <p className="text-xs text-slate-400 mt-0.5">Real-time route optimization saving 25-40% on fuel costs</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-blue-400 text-sm mt-0.5">→</div>
              <div>
                <div className="font-semibold text-blue-300 text-sm">Predictive Maintenance</div>
                <p className="text-xs text-slate-400 mt-0.5">Predict failures before they happen. Reduce downtime by 60%</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-violet-400 text-sm mt-0.5">→</div>
              <div>
                <div className="font-semibold text-violet-300 text-sm">Demand Forecasting</div>
                <p className="text-xs text-slate-400 mt-0.5">95% accuracy in shipment predictions using neural networks</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-emerald-400 text-sm mt-0.5">→</div>
              <div>
                <div className="font-semibold text-emerald-300 text-sm">Carbon Tracking</div>
                <p className="text-xs text-slate-400 mt-0.5">78% CO₂ reduction through intelligent fleet coordination</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'stats',
      title: "Scale & Performance",
      icon: Database,
      position: { x: 640, y: 120 },
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
              <div className="text-2xl font-black text-cyan-400">2B+</div>
              <p className="text-xs text-slate-400 mt-1">Shipments Processed</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/15 border border-blue-500/30">
              <div className="text-2xl font-black text-blue-400">50K+</div>
              <p className="text-xs text-slate-400 mt-1">Vehicles Coordinated</p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500/15 border border-violet-500/30">
              <div className="text-2xl font-black text-violet-400">250+</div>
              <p className="text-xs text-slate-400 mt-1">Enterprise Customers</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <div className="text-2xl font-black text-emerald-400">45</div>
              <p className="text-xs text-slate-400 mt-1">Countries Active</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>99.99% Uptime SLA</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sub-second response times</span>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'platform',
      title: "Technology Stack",
      icon: Brain,
      position: { x: 1160, y: 280 },
      content: (
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-400 uppercase">AI & ML</div>
            <p className="text-xs text-slate-400">PyTorch, TensorFlow, Custom Neural Networks for logistics prediction</p>
          </div>
          <div className="h-px bg-slate-700/30 my-2" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-400 uppercase">Infrastructure</div>
            <p className="text-xs text-slate-400">Kubernetes, GraphQL, Redis, PostgreSQL. Global CDN deployment</p>
          </div>
          <div className="h-px bg-slate-700/30 my-2" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-violet-400 uppercase">Security</div>
            <p className="text-xs text-slate-400">Military-grade encryption, ISO 27001, SOC 2 Type II certified</p>
          </div>
          <div className="h-px bg-slate-700/30 my-2" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-400 uppercase">Integrations</div>
            <p className="text-xs text-slate-400">SAP, Oracle, Salesforce, 500+ logistics APIs supported</p>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      const show = [];
      if (scrollPercent > 5) show.push('capabilities');
      if (scrollPercent > 15) show.push('stats');
      if (scrollPercent > 25) show.push('platform');
      
      setActiveWindows(show.length > 0 ? show : ['capabilities', 'stats', 'platform']);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative">
      {/* Premium background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/20" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/5 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
          animate={{ y: [0, 40, 0] }} 
          transition={{ duration: 15, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/5 w-[500px] h-[500px] rounded-full blur-[100px] opacity-15"
          animate={{ y: [0, -40, 0] }} 
          transition={{ duration: 18, repeat: Infinity, delay: 2 }}
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
        />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      {/* Windows */}
      <AnimatePresence>
        {activeWindows.map(id => {
          const win = windows.find(w => w.id === id);
          return win ? (
            <DataHologram
              key={id}
              id={id}
              title={win.title}
              icon={win.icon}
              position={win.position}
              onClose={() => setActiveWindows(prev => prev.filter(x => x !== id))}
              isFocused={focusedWindow === id}
              onFocus={setFocusedWindow}
            >
              {win.content}
            </DataHologram>
          ) : null;
        })}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1 }}
            className="text-center max-w-4xl"
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
              className="inline-block mb-8"
            >
              <Sparkles className="w-24 h-24 text-cyan-400" />
            </motion.div>
            
            <h1 className="text-7xl md:text-8xl font-black text-white mb-6 tracking-tight">
              NexusVectis
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Enterprise AI orchestrating the world's most complex logistics networks in real-time
            </p>

            <motion.div 
              animate={{ y: [0, 8, 0] }} 
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center justify-center gap-2 text-cyan-400"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium">System Online • All Networks Operational</span>
            </motion.div>
          </motion.div>
        </section>

        {/* Spacing sections */}
        <section className="h-screen" />
        <section className="h-screen" />
        <section className="h-screen" />

        {/* Story Section */}
        <section className="h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <h2 className="text-5xl font-black text-white mb-8">Built for Extreme Performance</h2>
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30 backdrop-blur-sm">
                <h3 className="font-bold text-lg text-cyan-300 mb-2">Real-Time Intelligence</h3>
                <p className="text-slate-300 leading-relaxed">
                  Process 50,000 vehicles across 45 countries simultaneously. Make optimization decisions in milliseconds. Respond to disruptions before they impact your bottom line.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/30 backdrop-blur-sm">
                <h3 className="font-bold text-lg text-blue-300 mb-2">Predictive Mastery</h3>
                <p className="text-slate-300 leading-relaxed">
                  Our AI learns from every shipment. 95% forecast accuracy. Predict demand surges, vehicle failures, and optimal routes with unprecedented precision.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 border border-violet-500/30 backdrop-blur-sm">
                <h3 className="font-bold text-lg text-violet-300 mb-2">Sustainable Excellence</h3>
                <p className="text-slate-300 leading-relaxed">
                  78% average CO₂ reduction for our customers. Optimize for both profit and planet. Compliance with every emissions regulation, automatically.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="h-screen flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
            className="text-center max-w-2xl"
          >
            <h2 className="text-5xl font-black text-white mb-6">Ready to Compete at Scale?</h2>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
              Join enterprise leaders who've transformed their logistics operations. Average ROI: 180% in year one.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 border-0 text-white px-10 py-3 font-bold rounded-lg text-base shadow-xl shadow-cyan-500/30">
                  Schedule Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800/50 px-10 py-3 font-bold rounded-lg text-base">
                  View Case Studies
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Bottom line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent z-10" />
    </div>
  );
}