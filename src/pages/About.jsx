import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Zap, Target, Users, Globe, Heart, X, Minimize2, TrendingUp, Gauge, Rocket, Shield, Network, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FloatingHologramWindow = ({ id, title, icon: Icon, children, onClose, position, isMinimized, onMinimize, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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
      initial={{ scale: 0.6, opacity: 0, y: 200 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.6, opacity: 0, y: 200 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      style={{ left: pos.x, top: pos.y, zIndex: isFocused ? 9999 : 50, width: 520 }}
      className="fixed"
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0.6 }}
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 blur-xl opacity-30 pointer-events-none"
        />

        <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-cyan-400/50 shadow-2xl overflow-hidden">
          {/* Animated border glow */}
          <motion.div
            animate={{ 
              boxShadow: isHovered 
                ? '0 0 30px rgba(6,182,212,0.8), 0 0 60px rgba(139,92,246,0.4)' 
                : '0 0 15px rgba(6,182,212,0.4), 0 0 30px rgba(139,92,246,0.2)'
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400/60 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400/60 rounded-br-xl" />

          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/5 pointer-events-none" />
          
          {/* Header */}
          <div ref={headerRef} className="relative flex items-center justify-between p-5 border-b border-cyan-400/20 cursor-move touch-none bg-gradient-to-r from-slate-900/60 to-slate-950/40 backdrop-blur-xl group">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/40 to-violet-500/40 border border-cyan-400/30 backdrop-blur-xl"
                animate={{ scale: isHovered ? 1.1 : 1 }}
              >
                <Icon className="w-5 h-5 text-cyan-300" />
              </motion.div>
              <div>
                <span className="text-white font-bold tracking-tight text-base">{title}</span>
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
                </motion.div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onMinimize(id)} 
                className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onClose(id)} 
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative p-6 space-y-4 text-sm text-slate-200 max-h-[500px] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function About() {
  const [activeWindows, setActiveWindows] = useState([
    'company-story', 'mission-vision', 'team', 'milestones', 'values'
  ]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [focusedWindow, setFocusedWindow] = useState(null);

  const hologramSections = [
    {
      id: 'company-story',
      title: "Our Story",
      icon: Globe,
      position: { x: 60, y: 180 },
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">Founded 2018 in Copenhagen. We saw a problem: traditional logistics systems were reactive, not intelligent. We decided to change that.</p>
          
          <div className="space-y-3">
            <motion.div whileHover={{ x: 4 }} className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 border border-cyan-400/30 hover:border-cyan-400/60 transition-colors cursor-pointer">
              <div className="font-semibold text-cyan-300 text-sm mb-1">2018 - The Start</div>
              <p className="text-xs text-slate-300">Predictive maintenance. First customer: 32% downtime reduction.</p>
            </motion.div>
            
            <motion.div whileHover={{ x: 4 }} className="p-3 rounded-xl bg-gradient-to-r from-violet-500/15 to-violet-500/5 border border-violet-400/30 hover:border-violet-400/60 transition-colors cursor-pointer">
              <div className="font-semibold text-violet-300 text-sm mb-1">2019-2021 - Expansion</div>
              <p className="text-xs text-slate-300">Route optimization, demand forecasting. €12M Series A. 500M shipments.</p>
            </motion.div>
            
            <motion.div whileHover={{ x: 4 }} className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-400/30 hover:border-emerald-400/60 transition-colors cursor-pointer">
              <div className="font-semibold text-emerald-300 text-sm mb-1">2024-2025 - Leadership</div>
              <p className="text-xs text-slate-300">#1 AI logistics platform. 50K vehicles. 250+ customers. Global reach.</p>
            </motion.div>
          </div>
        </div>
      )
    },

    {
      id: 'mission-vision',
      title: "Mission & Vision",
      icon: Target,
      position: { x: 620, y: 100 },
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wider">Mission</h3>
            <p className="text-xs leading-relaxed text-slate-300">Revolutionize global logistics with AI intelligence that optimizes operations, reduces costs, and minimizes environmental impact.</p>
          </div>

          <div className="h-px bg-gradient-to-r from-cyan-400/30 via-violet-400/30 to-transparent" />

          <div>
            <h3 className="text-sm font-bold text-violet-300 mb-2 uppercase tracking-wider">Vision</h3>
            <p className="text-xs leading-relaxed text-slate-300">A world where logistics networks operate with perfect efficiency. Where AI coordinates millions of vehicles, predicts failures, and continuously learns.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <motion.div whileHover={{ scale: 1.05 }} className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-center cursor-pointer">
              <div className="text-lg font-bold text-cyan-300">250+</div>
              <div className="text-xs text-slate-400">Team Members</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="p-2 rounded-lg bg-violet-500/10 border border-violet-400/40 text-center cursor-pointer">
              <div className="text-lg font-bold text-violet-300">45</div>
              <div className="text-xs text-slate-400">Countries</div>
            </motion.div>
          </div>
        </div>
      )
    },

    {
      id: 'team',
      title: "Leadership",
      icon: Users,
      position: { x: 1140, y: 300 },
      content: (
        <div className="space-y-3">
          {[
            { name: "Henrik Andersen", role: "CEO/Founder", desc: "PhD Machine Learning. 15y autonomous systems." },
            { name: "Sarah Chen", role: "CTO", desc: "Amazon AI infrastructure leader. Distributed systems." },
            { name: "Marco Rodriguez", role: "VP Operations", desc: "15y European logistics. Former Maersk director." },
            { name: "Natalia Volkov", role: "AI Research Lead", desc: "40+ papers on neural networks. PhD Moscow State." }
          ].map((member, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ x: 4 }}
              className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-600/40 hover:border-cyan-400/40 transition-colors cursor-pointer"
            >
              <div className="font-semibold text-sm text-cyan-300">{member.name}</div>
              <div className="text-xs text-slate-400">{member.role}</div>
              <p className="text-xs text-slate-500 mt-1">{member.desc}</p>
            </motion.div>
          ))}
        </div>
      )
    },

    {
      id: 'values',
      title: "Core Values",
      icon: Heart,
      position: { x: 340, y: 520 },
      content: (
        <div className="space-y-3">
          {[
            { icon: "🧠", title: "Intelligence Driven", color: "cyan" },
            { icon: "💡", title: "Customer Obsessed", color: "violet" },
            { icon: "🌱", title: "Sustainable Impact", color: "emerald" },
            { icon: "♻️", title: "Continuous Learning", color: "blue" },
            { icon: "🔒", title: "Transparent & Secure", color: "pink" }
          ].map((value, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className={`p-3 rounded-lg bg-${value.color}-500/10 border border-${value.color}-400/30 hover:border-${value.color}-400/60 transition-colors cursor-pointer`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{value.icon}</span>
                <div>
                  <div className={`font-semibold text-sm text-${value.color}-300`}>{value.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    },

    {
      id: 'milestones',
      title: "Milestones",
      icon: TrendingUp,
      position: { x: 900, y: 580 },
      content: (
        <div className="space-y-3 text-xs">
          {[
            { year: "2018", title: "Founded", color: "cyan" },
            { year: "2019", title: "Series A: €12M", color: "violet" },
            { year: "2021", title: "500M Shipments", color: "emerald" },
            { year: "2025", title: "#1 AI Platform", color: "blue" }
          ].map((milestone, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ x: 4 }}
              className={`p-3 rounded-lg bg-${milestone.color}-500/10 border border-${milestone.color}-400/30 cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className="font-bold text-lg text-white min-w-12">{milestone.year}</div>
                <div className={`text-${milestone.color}-300 font-semibold`}>{milestone.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      const windowsToShow = [];
      if (scrollPercent > 5) windowsToShow.push('company-story');
      if (scrollPercent > 15) windowsToShow.push('mission-vision');
      if (scrollPercent > 25) windowsToShow.push('team');
      if (scrollPercent > 40) windowsToShow.push('values');
      if (scrollPercent > 55) windowsToShow.push('milestones');
      
      setActiveWindows(windowsToShow);
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
      {/* Enhanced background with multiple layers */}
      <div className="fixed inset-0 z-0">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/20" />
        
        {/* Large floating orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.35, 0.15],
            x: [0, 50, 0],
            y: [0, 50, 0]
          }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          animate={{ 
            scale: [1.1, 0.9, 1.1],
            opacity: [0.15, 0.35, 0.15],
            x: [0, -50, 0],
            y: [0, -50, 0]
          }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }}
        />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Animated scan lines */}
        <motion.div 
          className="absolute inset-0" 
          style={{ backgroundSize: '100% 3px', backgroundImage: 'linear-gradient(0deg, rgba(6,182,212,0.02) 1px, transparent 1px)' }} 
          animate={{ backgroundPosition: ['0 0', '0 10px'] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
        />
      </div>

      {/* Hologram windows */}
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

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero section */}
        <section className="min-h-screen flex items-center justify-center px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1 }} 
            className="text-center max-w-4xl"
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
              className="inline-block mb-8"
            >
              <Sparkles className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]" />
            </motion.div>
            <h1 className="text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              NexusVectis
            </h1>
            <p className="text-2xl text-slate-300 mb-8 font-light tracking-wide">Enterprise AI for Global Logistics Excellence</p>
            <motion.div 
              animate={{ y: [0, 12, 0] }} 
              transition={{ duration: 3, repeat: Infinity }} 
              className="text-cyan-400 text-sm font-medium mt-20 flex items-center justify-center gap-2"
            >
              <span>Scroll to explore our intelligence network</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </section>

        {/* Spacing sections */}
        {hologramSections.map((_, idx) => (
          <section key={idx} className="min-h-screen flex items-center justify-center" />
        ))}

        {/* CTA Section */}
        <section className="min-h-screen flex items-center justify-center px-6 relative">
          <motion.div 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }} 
            className="text-center max-w-3xl relative"
          >
            {/* Glow background */}
            <div className="absolute -inset-12 bg-gradient-to-r from-cyan-500/20 via-transparent to-violet-500/20 blur-3xl -z-10" />

            <h2 className="text-5xl font-black text-white mb-6 drop-shadow-lg">Ready to Transform Logistics?</h2>
            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              Join 250+ enterprise customers using AI to optimize supply chains, reduce costs by 30%, and cut CO₂ emissions by 78%.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 border-0 text-white px-10 py-6 text-lg font-bold rounded-xl shadow-lg shadow-cyan-500/40">
                  Request Demo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="border-cyan-500/60 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 px-10 py-6 text-lg font-bold rounded-xl backdrop-blur-xl">
                  Learn More
                </Button>
              </motion.div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {[
                { number: "2B+", label: "Shipments Processed" },
                { number: "50K+", label: "Vehicles Coordinated" },
                { number: "45", label: "Countries" },
                { number: "250+", label: "Customers" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 backdrop-blur-xl"
                >
                  <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>

      {/* Bottom accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-10" />
    </div>
  );
}