import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Zap, Target, Users, Globe, Heart, X, Minimize2, TrendingUp, Gauge, Activity, AlertTriangle, CheckCircle, Rocket, Shield, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FloatingHologramWindow = ({ id, title, icon: Icon, children, onClose, position, isMinimized, onMinimize, isFocused, onFocus }) => {
  const [pos, setPos] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 480, height: 'auto' });
  const [isResizing, setIsResizing] = useState(false);
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
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, y: 150 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.7, opacity: 0, y: 150 }}
      transition={{ type: "spring", damping: 20, stiffness: 350 }}
      style={{ left: pos.x, top: pos.y, zIndex: isFocused ? 9999 : 50, width: size.width }}
      className="fixed"
      onPointerDown={handlePointerDown}
    >
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-xl border border-cyan-500/60 shadow-2xl shadow-cyan-500/30 overflow-hidden flex flex-col relative group h-fit">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/15 via-transparent to-violet-500/15 pointer-events-none" />
        <div className="absolute inset-0 rounded-xl animate-pulse bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-400/40 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-400/40 rounded-br-lg" />
        
        <div className="relative flex flex-col">
          <div ref={headerRef} className="flex items-center justify-between p-4 border-b border-cyan-500/30 cursor-move touch-none bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
                <Icon className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-white font-semibold tracking-wide text-sm">{title}</span>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </motion.div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => onMinimize(id)} className="h-8 w-8 text-cyan-400 hover:text-cyan-300">
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onClose(id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 text-sm text-slate-300 max-w-2xl overflow-y-auto max-h-[600px]">
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
      position: { x: 40, y: 150 },
      content: (
        <div className="space-y-3">
          <p className="text-slate-300 text-sm">Founded in 2018 in Copenhagen, NexusVectis emerged from a simple observation: traditional logistics systems are reactive, not intelligent.</p>
          
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="font-semibold text-cyan-400 mb-1">2018 - The Beginning</div>
              <p>Started with predictive maintenance for truck fleets. First customer saw 32% reduction in downtime.</p>
            </div>
            
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="font-semibold text-violet-400 mb-1">2019-2021 - Rapid Growth</div>
              <p>Expanded to route optimization and demand forecasting. Processed 500M shipments. Series A funding: €12M.</p>
            </div>
            
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-semibold text-emerald-400 mb-1">2022-2024 - Global Expansion</div>
              <p>Operating in 45 countries, coordinating 50,000+ vehicles. 250+ enterprise customers. €500M ARR.</p>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="font-semibold text-blue-400 mb-1">2025 - Market Leadership</div>
              <p>#1 AI logistics platform in Europe. 2B+ shipments processed. Intellect Mode launched for autonomous operations.</p>
            </div>
          </div>
          
          <p className="text-slate-400 text-[11px] pt-2 border-t border-slate-700">Today we power 1 in 4 major European logistics operations with real-time AI intelligence that learns every single day.</p>
        </div>
      )
    },

    {
      id: 'mission-vision',
      title: "Mission & Vision",
      icon: Target,
      position: { x: 560, y: 100 },
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-2">Our Mission</h3>
            <p className="text-slate-300 text-sm">To revolutionize global logistics by empowering organizations with AI-driven intelligence that optimizes operations, reduces costs, and minimizes environmental impact. We believe that autonomous, self-learning systems should be accessible to every logistics enterprise.</p>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <h3 className="text-sm font-semibold text-violet-400 mb-2">Our Vision</h3>
            <p className="text-slate-300 text-sm">A world where logistics networks operate with perfect efficiency - where AI coordinates millions of vehicles, predicts maintenance before failures occur, and continuously learns to serve humanity better. We're building the operating system for the future of supply chains.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="text-xs font-semibold text-cyan-400">250+</div>
              <div className="text-[10px] text-slate-400">Team Members</div>
            </div>
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="text-xs font-semibold text-violet-400">45</div>
              <div className="text-[10px] text-slate-400">Countries</div>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'team',
      title: "Leadership Team",
      icon: Users,
      position: { x: 1080, y: 320 },
      content: (
        <div className="space-y-3">
          <div className="space-y-3 text-xs">
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="font-semibold text-cyan-400">Dr. Henrik Andersen</div>
              <div className="text-slate-400">Founder & CEO</div>
              <p className="text-[10px] text-slate-500 mt-1">PhD Machine Learning from KTH. 15 years in autonomous systems.</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="font-semibold text-violet-400">Sarah Chen</div>
              <div className="text-slate-400">CTO</div>
              <p className="text-[10px] text-slate-500 mt-1">Led AI infrastructure at Amazon. Expert in distributed systems.</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="font-semibold text-emerald-400">Marco Rodriguez</div>
              <div className="text-slate-400">VP Operations</div>
              <p className="text-[10px] text-slate-500 mt-1">15 years in European logistics. Former Maersk director.</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="font-semibold text-blue-400">Natalia Volkov</div>
              <div className="text-slate-400">Head of AI Research</div>
              <p className="text-[10px] text-slate-500 mt-1">40+ published papers on neural networks. PhD Moscow State.</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 border-t border-slate-700 pt-2">35 nationalities • 250+ team members • Distributed across EU hubs</p>
        </div>
      )
    },

    {
      id: 'values',
      title: "Core Values",
      icon: Heart,
      position: { x: 300, y: 480 },
      content: (
        <div className="space-y-2">
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="font-semibold text-cyan-400">Intelligence Driven</div>
              <p className="text-[10px] text-slate-400 mt-1">Data and AI inform every decision. We eliminate guesswork.</p>
            </div>

            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="font-semibold text-violet-400">Customer Obsessed</div>
              <p className="text-[10px] text-slate-400 mt-1">Your success is our success. We solve real logistics problems.</p>
            </div>

            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-semibold text-emerald-400">Sustainable Impact</div>
              <p className="text-[10px] text-slate-400 mt-1">78% CO₂ reduction achieved. Greener supply chains matter.</p>
            </div>

            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="font-semibold text-blue-400">Continuous Learning</div>
              <p className="text-[10px] text-slate-400 mt-1">Your system improves every day with new data.</p>
            </div>

            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="font-semibold text-pink-400">Transparent & Trustworthy</div>
              <p className="text-[10px] text-slate-400 mt-1">Your data is yours. Military-grade security. No selling.</p>
            </div>
          </div>
        </div>
      )
    },

    {
      id: 'milestones',
      title: "Key Milestones",
      icon: TrendingUp,
      position: { x: 820, y: 520 },
      content: (
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-cyan-400">2018</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 text-[9px]">Founded</Badge>
            </div>
            <p className="text-slate-400 text-[10px]">First predictive maintenance system. 32% downtime reduction.</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-violet-400">2019</span>
              <Badge className="bg-violet-500/20 text-violet-400 text-[9px]">Growth</Badge>
            </div>
            <p className="text-slate-400 text-[10px]">Series A: €12M funding. Route optimization launched.</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-emerald-400">2021</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">Scale</Badge>
            </div>
            <p className="text-slate-400 text-[10px]">500M shipments processed. Entered 15 new markets.</p>
          </div>

          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-blue-400">2025</span>
              <Badge className="bg-blue-500/20 text-blue-400 text-[9px]">Today</Badge>
            </div>
            <p className="text-slate-400 text-[10px]">#1 AI logistics platform. 50K vehicles. 250+ customers.</p>
          </div>

          <p className="text-[10px] text-slate-500 border-t border-slate-700 pt-2">2B+ total shipments • 78% CO₂ reduction • €500M ARR</p>
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
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/40" />
        <motion.div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]" animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]" animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,182,212,0.03)_1px,transparent_2px)]" style={{ backgroundSize: '100% 2px' }} animate={{ backgroundPosition: ['0 0', '0 20px'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      </div>

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

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-center max-w-4xl">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="inline-block mb-6">
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            <h1 className="text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight">NexusVectis</h1>
            <p className="text-2xl text-slate-300 mb-8">Enterprise AI for Global Logistics Excellence</p>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-cyan-400 text-sm mt-20">Scroll to explore our story →</motion.div>
          </motion.div>
        </section>

        {hologramSections.map((_, idx) => (
          <section key={idx} className="min-h-screen flex items-center justify-center" />
        ))}

        <section className="min-h-screen flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center max-w-2xl">
            <h2 className="text-4xl font-black text-white mb-6">The NexusVectis Difference</h2>
            <p className="text-xl text-slate-400 mb-12">We're not just another TMS platform. We're building the AI operating system for logistics.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { title: "Real ROI in Months", desc: "30% cost reduction within 6 months, not 2 years" },
                { title: "Built by Logistics People", desc: "Half our team comes from supply chain industry" },
                { title: "AI That Learns Daily", desc: "Your system improves with every shipment" },
                { title: "Transparent & Secure", desc: "You own your data. Military-grade encryption." }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50"
                >
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">{item.title}</h3>
                  <p className="text-slate-300">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50">
              Request Demo
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  );
}