import { motion } from "framer-motion";
import { useState } from "react";
import { Brain, Zap, Globe, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function Hero3D() {
  const [capabilities] = useState([
    { icon: Brain, label: "Replaces 500 Humans", value: "At 1/100th the cost" },
    { icon: Zap, label: "Optimizes in Real-Time", value: "While your team sleeps" },
    { icon: Globe, label: "Thinks in 40 Languages", value: "But only speaks profit" },
    { icon: Sparkles, label: "Never Gets Sick", value: "Never asks for a raise" }
  ]);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Intense Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* MASSIVE Pulsing Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.8, 0.4],
          x: [0, 100, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-1/3 -left-1/4 w-[800px] h-[800px] bg-cyan-500 rounded-full blur-[150px] opacity-30"
      />
      <motion.div
        animate={{
          scale: [1.3, 0.9, 1.3],
          opacity: [0.3, 0.7, 0.3],
          x: [0, -80, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-1/3 -right-1/4 w-[800px] h-[800px] bg-violet-600 rounded-full blur-[150px] opacity-35"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.6, 0.2],
          rotate: [0, 360, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/3 right-1/3 w-[700px] h-[700px] bg-fuchsia-600 rounded-full blur-[140px] opacity-25"
      />

      {/* Hyper Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .15) 25%, rgba(6, 182, 212, .15) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .15) 75%, rgba(6, 182, 212, .15) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .15) 25%, rgba(6, 182, 212, .15) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .15) 75%, rgba(6, 182, 212, .15) 76%, transparent 77%, transparent)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Animated Scanning Lines */}
      <motion.div
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] opacity-20"
        style={{ backgroundSize: "100% 200px" }}
      />

      {/* Content */}
      <div className="relative z-10 py-48 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Logo & Intro */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center mb-16"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-24 w-auto opacity-90"
              />
            </Link>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, type: "spring", stiffness: 50 }}
            className="text-center mb-20 relative"
          >
            <h1 className="text-8xl md:text-9xl font-black text-white mb-8 leading-tight">
              <span className="block mb-4">We Fired All Your</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Dispatchers
              </span>
            </h1>
            
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-8">
              50+ parallel AI models orchestrating your entire fleet operation in real-time. 
              <span className="block text-cyan-400 font-semibold mt-4">
                One platform. Infinite intelligence.
              </span>
            </p>
          </motion.div>

          {/* Capability Grid */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, type: "spring" }}
            className="grid md:grid-cols-4 gap-6 mb-16"
          >
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.7 + idx * 0.15, type: "spring" }}
                  whileHover={{ y: -25, scale: 1.12, boxShadow: "0 0 60px rgba(6, 182, 212, 0.6)" }}
                  className="p-10 rounded-3xl bg-gradient-to-br from-cyan-500/25 to-violet-500/15 border-2 border-cyan-500/50 hover:border-cyan-400/80 transition-all group cursor-pointer relative overflow-hidden backdrop-blur-sm"
                >
                  {/* Animated background on hover */}
                  <motion.div
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0"
                  />
                  
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="mb-4 relative z-10"
                  >
                    <Icon className="w-10 h-10 text-cyan-400 group-hover:text-violet-400 transition-colors" />
                  </motion.div>
                  <div className="text-sm font-semibold text-cyan-400 mb-2 group-hover:text-violet-400 transition-colors relative z-10">
                    {cap.label}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors relative z-10">
                    {cap.value}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* AI Power Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { number: "100M+", label: "Daily Optimizations", color: "cyan" },
              { number: "50+", label: "Parallel Analyses", color: "violet" },
              { number: "99.99%", label: "Model Accuracy", color: "fuchsia" },
              { number: "10x", label: "Speed Improvement", color: "emerald" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-cyan-500/30 transition-all"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: idx * 0.2 }}
                  className={`text-5xl font-black bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-600 bg-clip-text text-transparent mb-3`}
                >
                  {stat.number}
                </motion.div>
                <div className="text-slate-400 font-medium group-hover:text-slate-200 transition-colors">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex items-center justify-center gap-6 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:shadow-2xl transition-all"
            >
              Explore Capabilities
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:shadow-2xl transition-all"
            >
              View Platform
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}