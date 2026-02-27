import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Info, TrendingUp, Shield, Zap, Target, Users, Globe, Brain, Rocket, Heart, X } from "lucide-react";

const HologramWindow = ({ title, icon: Icon, children, delay, position }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 50 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/10 rounded-2xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative border border-cyan-500/40 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 overflow-hidden group hover:border-cyan-400/80 transition-all duration-300">
        {/* Holographic scan lines */}
        <motion.div 
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,182,212,0.03)_1px,transparent_2px)]"
          style={{ backgroundSize: '100% 2px' }}
          animate={{ backgroundPosition: ['0 0', '0 4px'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          pointerEvents="none"
        />

        {/* Corner accent */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50" />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">{title}</h3>
          <motion.div 
            className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-3 text-sm text-slate-300">
          {children}
        </div>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ borderRadius: "16px" }}
        />
      </div>
    </motion.div>
  );
};

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hologramData = [
    {
      title: "NexusVectis Mission",
      icon: Target,
      content: (
        <>
          <p className="text-slate-400">Transforming global logistics through quantum-integrated AI and autonomous fleet operations.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-400">Status: <span className="text-emerald-400">Operational</span></p>
          </div>
        </>
      ),
      delay: 0.1
    },
    {
      title: "Fleet AI Intelligence",
      icon: Brain,
      content: (
        <>
          <p className="text-slate-400">Real-time predictive analytics across 50,000+ vehicles using neural networks and swarm coordination.</p>
          <div className="pt-2 border-t border-cyan-500/20 space-y-1">
            <p className="text-xs"><span className="text-cyan-400">Processing:</span> 2.3M events/sec</p>
            <p className="text-xs"><span className="text-cyan-400">Accuracy:</span> 99.7%</p>
          </div>
        </>
      ),
      delay: 0.2
    },
    {
      title: "Quantum Logistics",
      icon: Zap,
      content: (
        <>
          <p className="text-slate-400">Harness quantum computing for route optimization solving NP-hard problems in milliseconds.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-400">Optimization: <span className="text-emerald-400">+47%</span> efficiency gain</p>
          </div>
        </>
      ),
      delay: 0.3
    },
    {
      title: "Global Network",
      icon: Globe,
      content: (
        <>
          <p className="text-slate-400">Real-time monitoring across 180+ countries with sub-100ms latency edge computing.</p>
          <div className="pt-2 border-t border-cyan-500/20 space-y-1">
            <p className="text-xs"><span className="text-cyan-400">Coverage:</span> 180 countries</p>
            <p className="text-xs"><span className="text-cyan-400">Uptime:</span> 99.99%</p>
          </div>
        </>
      ),
      delay: 0.4
    },
    {
      title: "Autonomous Systems",
      icon: Rocket,
      content: (
        <>
          <p className="text-slate-400">Self-driving trucks, autonomous drones, and fleet coordination without human intervention.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-400">Autonomous Fleet: <span className="text-emerald-400">35,000+</span> vehicles</p>
          </div>
        </>
      ),
      delay: 0.5
    },
    {
      title: "Security & Trust",
      icon: Shield,
      content: (
        <>
          <p className="text-slate-400">Military-grade encryption and blockchain verification for every transaction and movement.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-400">Protection: <span className="text-emerald-400">Zero breaches</span> in 15 years</p>
          </div>
        </>
      ),
      delay: 0.6
    },
    {
      title: "Human-AI Collaboration",
      icon: Users,
      content: (
        <>
          <p className="text-slate-400">Empowering 50,000+ operators and dispatchers with intuitive AI-assisted decision making.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs"><span className="text-cyan-400">Workforce:</span> 50,000+ trained operators</p>
          </div>
        </>
      ),
      delay: 0.7
    },
    {
      title: "Sustainability",
      icon: Heart,
      content: (
        <>
          <p className="text-slate-400">Reducing carbon emissions by 78% through optimized routing and electric fleet transition.</p>
          <div className="pt-2 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-400">CO₂ Reduction: <span className="text-emerald-400">78%</span> vs traditional logistics</p>
          </div>
        </>
      ),
      delay: 0.8
    }
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Sci-Fi Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/40" />
        
        {/* Pulsing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.6, 0.2],
          }}
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

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center z-10 px-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Sparkles className="w-16 h-16 text-cyan-400" />
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent leading-tight">
            NexusVectis
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            The Future of Logistics Intelligence
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              Explore AI
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="text-cyan-400 text-sm">Scroll to discover</div>
        </motion.div>
      </section>

      {/* Hologram Grid */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-black text-center mb-4 text-white"
          >
            Holographic Analysis
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center text-slate-400 mb-20 max-w-2xl mx-auto"
          >
            Real-time intelligence across every dimension of global logistics
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            {hologramData.map((hologram, idx) => (
              <HologramWindow
                key={idx}
                title={hologram.title}
                icon={hologram.icon}
                delay={hologram.delay}
              >
                {hologram.content}
              </HologramWindow>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-center mb-16 text-white"
          >
            By The Numbers
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Global Vehicles", value: "50,000+", delay: 0.1 },
              { label: "Countries Covered", value: "180+", delay: 0.2 },
              { label: "Daily Shipments", value: "2.3M", delay: 0.3 },
              { label: "AI Accuracy", value: "99.7%", delay: 0.4 }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: stat.delay }}
                className="border border-cyan-500/40 bg-slate-900/60 backdrop-blur-xl rounded-xl p-6 text-center hover:border-cyan-400/80 transition-all"
              >
                <div className="text-3xl font-black text-cyan-400 mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-cyan-500/40 bg-gradient-to-br from-slate-900/80 to-slate-950/60 backdrop-blur-xl rounded-2xl p-12 text-center"
          >
            <h2 className="text-3xl font-black mb-4 text-white">Ready to Transform Logistics?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of operators experiencing the future of fleet management
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              Start Free Trial
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}