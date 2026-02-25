import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Truck, Globe, Zap, Shield, TrendingUp, Satellite,
  BarChart3, MapPin, Radio, ArrowRight, CheckCircle2, Sparkles, Brain, Orbit, Package,
  Network, Cpu, Wifi, GitBranch, Dna, Bug, AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const features = [
    {
      icon: Globe,
      title: "Live Fleet Monitoring",
      description: "Real-time tracking of vehicles, ships and aircraft with GPS, AIS and ADS-B integration"
    },
    {
      icon: Sparkles,
      title: "FLEET AI Mode",
      description: "AI-powered command system for natural language fleet control and operations"
    },
    {
      icon: Zap,
      title: "Route Optimization",
      description: "Intelligent route planning with AI optimization and real-time traffic data"
    },
    {
      icon: TrendingUp,
      title: "Demand Forecasting",
      description: "Predict transport demand and optimize resource allocation with machine learning"
    },
    {
      icon: BarChart3,
      title: "Fleet Analytics",
      description: "Advanced KPI dashboards with fuel consumption, CO₂ emissions and performance metrics"
    },
    {
      icon: Satellite,
      title: "Warehouse Automation",
      description: "AI-driven warehouse optimization, picking automation and inventory forecasting"
    },
    {
      icon: Brain,
      title: "Predictive Maintenance",
      description: "Predict maintenance needs and reduce downtime with AI anomaly detection"
    },
    {
      icon: MapPin,
      title: "Green TMS",
      description: "Sustainability tracking, carbon footprint analysis and green transport planning"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Audit logging, API access control and compliance management"
    }
  ];

  const stats = [
    { value: "AI", label: "Powered" },
    { value: "Real-time", label: "Tracking" },
    { value: "Multi-modal", label: "Transport" },
    { value: "Global", label: "Coverage" }
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        
        {/* Floating Orbs */}
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Mouse Follow Glow */}
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <motion.img 
            whileHover={{ scale: 1.05 }}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
            alt="NexusVectis Logo" 
            className="h-12 sm:h-20 w-auto"
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Log In
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 sm:px-6 py-2 rounded-lg transition-transform hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
            >
              Get Started
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 backdrop-blur-xl mb-8 shadow-lg shadow-cyan-500/10"
            >
              <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-sm text-white font-medium">Next-Generation Fleet Intelligence Platform</span>
              <Sparkles className="w-4 h-4 text-violet-400" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight"
            >
              The Future of
              <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient">
                  Logistics Intelligence
                </span>
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-2xl -z-10"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2"
            >
              Control your entire fleet through natural language with <span className="text-cyan-400 font-semibold">FLEET AI</span>.
              <span className="text-violet-400"> Automate</span>,
              <span className="text-fuchsia-400"> optimize</span>, and
              <span className="text-cyan-400"> command</span> your operations like never before.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white text-lg px-10 py-6 rounded-2xl font-semibold group transition-transform hover:scale-105 flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Try FLEET AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-5xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  <div className="relative">
                    <div className="text-5xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FLEET AI Showcase */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-12 md:p-20 overflow-hidden"
          >
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, delay: 1 }}
                className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
              />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-cyan-400" />
                </motion.div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight px-2">
                      Meet <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">FLEET AI</span>
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed px-2">
                  Your intelligent co-pilot for fleet operations. Control everything with natural language commands.
                  <br />
                  <span className="text-cyan-400">No complex interfaces. No training required. Just ask.</span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 mt-16">
                {[
                  {
                    icon: Brain,
                    title: "Natural Language Control",
                    description: "\"Route vehicle 47 to Copenhagen warehouse\" - FLEET AI understands and executes instantly",
                    color: "cyan"
                  },
                  {
                    icon: Zap,
                    title: "Instant Automation",
                    description: "\"Optimize all routes for fuel efficiency\" - AI analyzes and implements in seconds",
                    color: "violet"
                  },
                  {
                    icon: TrendingUp,
                    title: "Predictive Intelligence",
                    description: "\"Show maintenance predictions\" - AI forecasts issues before they happen",
                    color: "fuchsia"
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 group"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-500/5 flex items-center justify-center mb-6 shadow-xl shadow-${item.color}-500/20`}
                      >
                        <Icon className={`w-10 h-10 text-${item.color}-400`} />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed text-lg italic">"{item.description}"</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Orbit className="w-12 h-12 text-cyan-400" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Complete Fleet Intelligence
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Powered by Advanced AI
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
              Beyond FLEET AI - a comprehensive platform with every tool you need for modern logistics
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  <div className="relative">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20"
                    >
                      <Icon className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-base">{feature.description}</p>
                  </div>
                  
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl -z-10"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              From Last-Mile to
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Global Supply Chains
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
              Versatile logistics solutions designed to scale across any operation size or complexity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Multi-Modal Tracking",
                icon: Globe,
                stats: ["GPS, AIS, ADS-B signals", "Cross-border compliance", "Real-time tracking"],
                description: "Track trucks, ships, and aircraft simultaneously with unified AI control"
              },
              {
                title: "Dynamic Route Planning",
                icon: Truck,
                stats: ["Real-time optimization", "Traffic-aware routing", "ETA predictions"],
                description: "Optimize routes automatically with AI-powered planning and real-time adjustments"
              },
              {
                title: "Predictive Maintenance",
                icon: Package,
                stats: ["Anomaly detection", "Failure forecasting", "Downtime prevention"],
                description: "Prevent breakdowns before they happen with AI-driven maintenance predictions"
              },
              {
                title: "Asset Optimization",
                icon: Radio,
                stats: ["Utilization tracking", "Cost analysis", "Performance metrics"],
                description: "Maximize ROI on your fleet assets with real-time insights and analytics"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-full blur-2xl"
                  />

                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center"
                      >
                        <Icon className="w-8 h-8 text-cyan-400" />
                      </motion.div>
                      <h3 className="text-3xl font-bold text-white">{feature.title}</h3>
                    </div>

                    <p className="text-slate-300 text-lg mb-6 leading-relaxed">{feature.description}</p>

                    <div className="space-y-3">
                      {feature.stats.map((stat, statIdx) => (
                        <motion.div
                          key={statIdx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.2 + statIdx * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-slate-400">{stat}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/10 rounded-full"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-violet-500/10 rounded-full"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              Why Choose
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                NexusVectis
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                value: "80%",
                label: "Faster Operations",
                description: "AI automation reduces manual tasks and speeds up decision-making"
              },
              {
                value: "35%",
                label: "Cost Reduction",
                description: "Optimize routes, fuel consumption, and asset utilization"
              },
              {
                value: "99.9%",
                label: "Uptime Guarantee",
                description: "Enterprise-grade reliability with 24/7 monitoring"
              }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="text-center p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                  className="text-7xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4"
                >
                  {benefit.value}
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.label}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              Built on
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Cutting-Edge Technology
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
              Enterprise infrastructure that scales with your business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe, title: "Multi-Signal Tracking", desc: "GPS, AIS, ADS-B, LoRa" },
              { icon: Brain, title: "Advanced AI Models", desc: "GPT-4, Claude, Mistral" },
              { icon: Shield, title: "Bank-Level Security", desc: "SOC 2, ISO 27001" },
              { icon: Zap, title: "Real-Time Processing", desc: "Sub-second updates" }
            ].map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group"
                >
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                  >
                    <Icon className="w-12 h-12 text-cyan-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">{tech.title}</h3>
                  <p className="text-slate-400 text-sm">{tech.desc}</p>
                  
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-cyan-500/30 p-12 md:p-16 overflow-hidden"
          >
            {/* Animated particles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-8" />
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8 px-2">
                See <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">FLEET AI</span> in Action
              </h2>

              {/* Command Examples */}
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
                {[
                  { cmd: "Show me all delayed shipments", response: "Found 3 delayed shipments. Vehicle 12 is 45min behind schedule..." },
                  { cmd: "Optimize routes for minimal CO2", response: "Analyzed 47 routes. Reduced emissions by 18% through smart routing..." },
                  { cmd: "Which vehicles need maintenance?", response: "Vehicle 8 requires service in 2 days. Predicted brake pad wear..." },
                  { cmd: "Assign closest truck to new order", response: "Vehicle 23 assigned. ETA to pickup: 12 minutes. Route optimized..." }
                ].map((example, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    whileHover={{ scale: 1.03 }}
                    className="text-left p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <p className="text-white font-medium">"{example.cmd}"</p>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 + 0.3, duration: 0.8 }}
                      className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent mb-3"
                    />
                    <p className="text-slate-400 text-sm leading-relaxed">{example.response}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial/Social Proof Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              Transforming Logistics
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Across Industries
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: "10M+",
                label: "Shipments Tracked",
                desc: "Real-time monitoring across global supply chains"
              },
              {
                stat: "500K+",
                label: "AI Commands Daily",
                desc: "Fleet operators automating with natural language"
              },
              {
                stat: "45%",
                label: "Avg. Cost Savings",
                desc: "Through intelligent route and resource optimization"
              }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 group overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
                />
                
                <div className="relative text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.4 }}
                    className="text-6xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4"
                  >
                    {stat.stat}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">{stat.label}</h3>
                  <p className="text-slate-400 leading-relaxed">{stat.desc}</p>
                </div>

                <motion.div
                  className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Swarm Intelligence Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Network className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Bug className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-semibold">Next-Gen Technology</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Swarm Intelligence
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Coordination
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-2">
              Mimicking nature's collective intelligence from ants, bees and bird flocks — 
              each vehicle operates as an autonomous agent coordinating with the fleet via edge computing, with no central brain required.
            </p>
          </motion.div>

          {/* Nature Principles */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Bug,
                color: "emerald",
                title: "Ants & Pheromones",
                description: "Ants find optimal routes by leaving pheromone trails — in NexusVectis this translates to digital signals. Agents share real-time data like traffic and weather via mesh networks, enabling the entire fleet to self-adjust collectively."
              },
              {
                icon: Wifi,
                color: "cyan",
                title: "Emergent Behaviour",
                description: "No single failure paralyses the system — other agents compensate automatically. The result is emergent fleet behaviour: resilience and self-healing without manual intervention."
              },
              {
                icon: Dna,
                color: "violet",
                title: "Genetic Learning",
                description: "The swarm \"evolves\" over time based on past trips via genetic algorithms — becoming smarter for European weather conditions, seasonal variations and demand spikes."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className={`relative p-8 rounded-3xl bg-gradient-to-br from-${item.color}-500/10 to-${item.color}-500/5 border border-${item.color}-500/30 hover:border-${item.color}-400/50 transition-all overflow-hidden group`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 0.8 }}
                    className={`absolute -top-8 -right-8 w-32 h-32 bg-${item.color}-500/20 rounded-full blur-2xl`}
                  />
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/20 border border-${item.color}-500/30 flex items-center justify-center mb-5`}>
                    <Icon className={`w-7 h-7 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Technical Components */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-slate-700/50 p-10 md:p-14 mb-16 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white text-center mb-10">Technical Components</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Cpu,
                    title: "Edge AI on every node",
                    tech: "5G · LoRaWAN · Neural nets",
                    description: "Each vehicle runs lightweight neural networks for local decision-making — e.g. rerouting in traffic chaos — while data syncs with nearby nodes."
                  },
                  {
                    icon: GitBranch,
                    title: "Stigmergy communication",
                    tech: "PSO · ACO · P2P mesh",
                    description: "Indirect environmental signals — updated maps, load data — guide the fleet. Supplemented with direct peer-to-peer messages for complex tasks like load balancing."
                  },
                  {
                    icon: Network,
                    title: "Self-organisation",
                    tech: "Particle Swarm · Ant Colony",
                    description: "Algorithms like PSO and ACO simulate dynamic routes. Nodes autonomously balance sessions under peak load without manual intervention."
                  }
                ].map((comp, idx) => {
                  const Icon = comp.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{comp.title}</p>
                          <p className="text-emerald-400/70 text-[10px] font-mono">{comp.tech}</p>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">{comp.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Impact Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: "30%", label: "Fewer Delays", desc: "Collective route optimisation in traffic chaos reduces delays in simulations" },
              { value: "∞", label: "Scalability", desc: "Eliminates single points of failure — the swarm scales infinitely with the fleet" },
              { value: "0", label: "Central Control Needed", desc: "Agents coordinate autonomously — no central brain that can fail" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 hover:border-emerald-400/40 transition-all"
              >
                <div className="text-5xl font-black bg-gradient-to-br from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
                <p className="text-white font-bold mb-2">{stat.label}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Twin Federation Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Orbit className="w-12 h-12 text-rose-400" />
            </motion.div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold">Advanced Security</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Digital Twin
              <br />
              <span className="bg-gradient-to-r from-rose-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Federation
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-2">
              Run virtual doubles of your entire fleet in parallel with real-time data. Detect anomalies, attacks, and failures before they impact operations.
            </p>
          </motion.div>

          {/* Twin Architecture Overview */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-3xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/30 overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-8 -right-8 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-4">Real vs. Simulated</h3>
                <ul className="space-y-4">
                  {[
                    "Live vehicle GPS position",
                    "Predicted route trajectory",
                    "Real sensor telemetry",
                    "Simulated physical model",
                    "Expected vs. actual fuel",
                    "Divergence detection"
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-cyan-400" />
                      <span className="text-slate-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border border-cyan-500/30 overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-4">Anomaly Detection</h3>
                <ul className="space-y-4">
                  {[
                    "Position divergence > 10km",
                    "Impossible speed patterns",
                    "Replay attack signatures",
                    "Sensor data tampering",
                    "Unauthorized rerouting",
                    "Real-time alerts"
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-slate-700/50 p-10 md:p-14 mb-16 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white text-center mb-10">How Digital Twin Federation Works</h3>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Truck,
                    step: "1",
                    title: "Ingest",
                    description: "Collect real-time data from vehicles, shipments, and resources via GPS, AIS, ADS-B"
                  },
                  {
                    icon: Cpu,
                    step: "2",
                    title: "Simulate",
                    description: "Run physics-based models predicting expected position, fuel, temperature"
                  },
                  {
                    icon: TrendingUp,
                    step: "3",
                    title: "Compare",
                    description: "Calculate divergence between real state and simulated expectation"
                  },
                  {
                    icon: AlertCircle,
                    step: "4",
                    title: "Alert",
                    description: "Trigger security alerts and feed insights to Immunity & Swarm engines"
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 }}
                      className="relative"
                    >
                      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-sm">{item.step}</span>
                          </div>
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                      </div>
                      {idx < 3 && (
                        <motion.div
                          animate={{ x: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="hidden md:block absolute top-1/2 -right-8 text-violet-500/40"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Cyber Attack Prevention",
                icon: Shield,
                color: "rose",
                description: "Detect GPS spoofing, data injection, and MITM attacks instantly through divergence analysis"
              },
              {
                title: "Theft Prevention",
                icon: Package,
                color: "cyan",
                description: "Identify unauthorized rerouting and physical asset displacement in real-time"
              },
              {
                title: "Quality Assurance",
                icon: CheckCircle2,
                color: "violet",
                description: "Monitor cold chain compliance, cargo integrity, and safe delivery conditions"
              }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative p-8 rounded-3xl bg-gradient-to-br from-${benefit.color}-500/10 to-${benefit.color}-500/5 border border-${benefit.color}-500/30 overflow-hidden group`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 0.8 }}
                    className={`absolute -top-8 -right-8 w-32 h-32 bg-${benefit.color}-500/20 rounded-full blur-2xl`}
                  />
                  <div className={`w-14 h-14 rounded-2xl bg-${benefit.color}-500/20 border border-${benefit.color}-500/30 flex items-center justify-center mb-5`}>
                    <Icon className={`w-7 h-7 text-${benefit.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              Simple, Transparent
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
              Scale your fleet operations without breaking the bank
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "€299",
                period: "/month",
                description: "Perfect for small fleets",
                features: [
                  "Up to 10 vehicles",
                  "Real-time GPS tracking",
                  "Basic route optimization",
                  "Email support",
                  "API access"
                ],
                highlighted: false
              },
              {
                name: "Professional",
                price: "€899",
                period: "/month",
                description: "For growing logistics operations",
                features: [
                  "Up to 100 vehicles",
                  "Multi-signal tracking (GPS, AIS, ADS-B)",
                  "Advanced AI route optimization",
                  "Predictive maintenance",
                  "Priority support",
                  "Demand forecasting",
                  "Custom API limits"
                ],
                highlighted: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "pricing",
                description: "For large-scale operations",
                features: [
                  "Unlimited vehicles",
                  "Full platform access",
                  "Dedicated account manager",
                  "Custom integrations",
                  "SLA guarantee (99.9%)",
                  "White-label options",
                  "24/7 phone support"
                ],
                highlighted: false
              }
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ scale: plan.highlighted ? 1.05 : 1.02, y: -10 }}
                className={`relative rounded-3xl p-8 transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-2 border-cyan-500/50 ring-2 ring-cyan-500/10"
                    : "bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-cyan-500/30"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                </div>

                <button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className={`w-full py-3 rounded-xl font-semibold mb-8 transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-lg hover:shadow-cyan-500/50"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  Get Started
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <motion.div
                      key={fIdx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 + fIdx * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-slate-400 mb-4">All plans include a 14-day free trial. No credit card required.</p>
            <Link to={createPageUrl("Contact")} className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Have questions? Contact our sales team →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 md:p-20 overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <motion.div
                className="absolute top-0 left-0 w-full h-full"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                style={{
                  backgroundImage: "radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
                  backgroundSize: "200% 200%",
                }}
              />
            </div>
            
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight px-2">
                Command Your Fleet
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  With AI Intelligence
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 sm:mb-12 font-light px-2">
                Experience the power of FLEET AI - natural language fleet control
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold group transition-transform hover:scale-105 flex items-center gap-3"
                >
                  <Sparkles className="w-6 h-6 text-cyan-500" />
                  Start with FLEET AI
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-10 text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>AI-Powered Commands</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Natural Language Control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Real-Time Intelligence</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-32 w-auto mb-6 opacity-90"
              />
              <p className="text-slate-400 max-w-md leading-relaxed">
                Next-generation fleet intelligence platform powered by AI. 
                Control your entire logistics operation through natural language.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-cyan-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("About")} className="hover:text-cyan-400 transition-colors">About</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-cyan-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-cyan-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-8"
          />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Shaping the future of logistics intelligence.</p>
            <div className="flex gap-6 text-slate-400 text-sm">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-cyan-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}