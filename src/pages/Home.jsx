import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Truck, Globe, Zap, Shield, TrendingUp, Satellite,
  BarChart3, MapPin, Radio, ArrowRight, CheckCircle2, Sparkles, Brain, Orbit
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      title: "Live Fleet Tracking",
      description: "Real-time monitoring of all vehicles with GPS, AIS, and ADS-B integration"
    },
    {
      icon: Zap,
      title: "AI-Powered Optimization",
      description: "Smart route planning and predictive maintenance to maximize efficiency"
    },
    {
      icon: Satellite,
      title: "Multi-Modal Transport",
      description: "Track trucks, ships, aircraft, trains, and drones from one platform"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with audit logging and role-based access control"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into fleet performance, fuel efficiency, and CO2 emissions"
    },
    {
      icon: Radio,
      title: "Global Coverage",
      description: "Worldwide tracking with multiple signal types and automatic failover"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "50ms", label: "Latency" },
    { value: "24/7", label: "Support" },
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
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <motion.img 
            whileHover={{ scale: 1.05 }}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
            alt="NexusVectis Logo" 
            className="h-20 w-auto"
          />
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white transition-transform hover:scale-105">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 z-10">
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
              className="text-7xl md:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight"
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
              className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Real-time tracking meets artificial intelligence. 
              <span className="text-cyan-400"> Monitor</span>,
              <span className="text-violet-400"> optimize</span>, and
              <span className="text-fuchsia-400"> transform</span> your entire fleet with unprecedented precision.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white text-lg px-10 py-6 rounded-2xl font-semibold group transition-transform hover:scale-105">
                  <Brain className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Experience the Platform
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
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

      {/* Features Grid */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Power Your Operations with
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                AI-Driven Intelligence
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Every feature designed to give you unprecedented control and insight
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
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg shadow-cyan-500/20">
                      <Icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl -z-10 group-hover:scale-150 transition-transform" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 z-10">
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
              
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Transform Your Fleet
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Operations Today
                </span>
              </h2>
              <p className="text-2xl text-slate-300 mb-12 font-light">
                Join the future of intelligent logistics management
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to={createPageUrl("Dashboard")}>
                  <Button size="lg" className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold group transition-transform hover:scale-105">
                    Get Started Now
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-10 text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Setup in minutes</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis Logo" 
              className="h-48 w-auto opacity-70"
            />
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Shaping the future of logistics.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}