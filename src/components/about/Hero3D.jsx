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

          {/* AI Power Stats - Massive */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid md:grid-cols-4 gap-8 mb-20"
          >
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.7, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 + idx * 0.15, type: "spring" }}
                  whileHover={{ scale: 1.15, y: -30, boxShadow: "0 0 80px rgba(6, 182, 212, 0.9)" }}
                  className="text-center p-12 rounded-3xl bg-gradient-to-br from-cyan-500/35 to-violet-500/20 border-2 border-cyan-500/70 hover:border-cyan-300/100 transition-all relative group"
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.3 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-6"
                  >
                    <Icon className="w-16 h-16 text-cyan-400 group-hover:text-yellow-300" />
                  </motion.div>
                  <div className="text-2xl font-black text-white mb-3 group-hover:text-cyan-300">{cap.label}</div>
                  <div className="text-sm text-slate-300 group-hover:text-slate-100">{cap.value}</div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1 }}
            className="flex items-center justify-center gap-6 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(6, 182, 212, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('mission-vision')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-black text-xl hover:shadow-2xl transition-all tracking-wide"
            >
              See The Future
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(168, 85, 247, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-black text-xl hover:shadow-2xl transition-all tracking-wide"
            >
              Get Demo
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}