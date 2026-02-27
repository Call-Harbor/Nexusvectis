import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Target, Users, Sparkles, ArrowRight, Award, TrendingUp, Globe, Zap, Shield, Brain, Rocket, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import TechEvolution from "../components/about/TechEvolution";
import MissionVision from "../components/about/MissionVision";
import TechShowcase from "../components/about/TechShowcase";
import Hero3D from "../components/about/Hero3D";

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Sci-Fi Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient - deeper blacks and neons */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-cyan-950/40" />
        
        {/* Massive pulsing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.6, 0.2],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.6, 0.2],
            x: [0, -50, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[90px]"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Holographic grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Scanning lines effect */}
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(6,182,212,0.03)_1px,transparent_2px)]"
          style={{
            backgroundSize: '100% 2px',
          }}
          animate={{ backgroundPosition: ['0 0', '0 20px'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 3D Hero Section */}
      <Hero3D />

      {/* Mission Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8 leading-tight">
                We <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Didn't Compromise</span>
              </h2>
              <div className="space-y-6 text-lg text-slate-200 leading-relaxed font-light">
                <p className="border-l-2 border-cyan-500/50 pl-6">
                  No "AI bolted onto old software." No Python notebooks. We built this from scratch in 3 months with a vision: <span className="text-cyan-400 font-bold">what if logistics had no humans?</span>
                </p>
                <p>
                  Every line of code is optimized for one thing: <span className="text-violet-400 font-semibold">making faster, smarter decisions than any human team ever could</span>. Swarm coordination. Digital twins. Neural routing. All working together. All flawless.
                </p>
                <p className="text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text font-bold text-lg">
                  Your competitors are still hiring dispatchers. You just automated them away.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { value: "50+", label: "Parallel AI Analyses", icon: Brain },
                { value: "100M+", label: "Optimization Decisions", icon: TrendingUp },
                { value: "99.99%", label: "Model Uptime", icon: Zap },
                { value: "10x", label: "Faster Decisions", icon: Rocket }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15, duration: 0.6 }}
                    whileHover={{ scale: 1.1, y: -10 }}
                    className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 border border-cyan-500/40 hover:border-cyan-400/80 text-center backdrop-blur-sm relative overflow-hidden group"
                  >
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}>
                      <Icon className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:text-violet-300 transition-colors" />
                    </motion.div>
                    <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-violet-300 bg-clip-text text-transparent mb-3 group-hover:from-violet-300 group-hover:to-cyan-300 transition-all">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-300 group-hover:text-cyan-300 transition-colors font-semibold">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <div id="mission-vision">
        <MissionVision />
      </div>

      {/* Technology Showcase */}
      <TechShowcase />

      {/* Technology Evolution & Future Roadmap */}
      <TechEvolution />



      {/* Team Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
              Built by <span className="text-cyan-400">Supergeniuses</span>
            </h2>
            <p className="text-lg text-slate-200 leading-relaxed mb-12 max-w-3xl mx-auto font-light">
              We're not logistics experts who hired AI engineers. We're AI researchers who know logistics inside and out. 
              <span className="text-cyan-400 block mt-2 font-semibold">We solved this problem from first principles—on the first try.</span>
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                 { role: "AI Researchers", desc: "PhDs in machine learning, natural language processing, and distributed systems" },
                 { role: "Logistics Operators", desc: "10+ years in dispatch, routing, and warehouse automation" },
                 { role: "Systems Architects", desc: "Built platforms handling billions of events at scale" }
               ].map((team, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.7 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="p-8 rounded-2xl bg-slate-900/60 border border-cyan-500/40 hover:border-cyan-400/80 group relative overflow-hidden backdrop-blur-md"
                >
                  <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ duration: 0.8 }}>
                    <Award className="w-10 h-10 text-cyan-400 mx-auto mb-4 group-hover:text-cyan-300 transition-colors" />
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">{team.role}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{team.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-[3rem] bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-fuchsia-500/10 border border-cyan-500/60 p-20 text-center backdrop-blur-sm relative overflow-hidden"
          >
            {/* Animated light rays */}
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/0 to-violet-500/20 rounded-full blur-3xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10">
              <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
                This is <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">The Future</span>
              </h2>
              <p className="text-lg text-slate-200 mb-12 max-w-2xl mx-auto font-light">
                We've built what will exist in 30 years, today. 
                <span className="block text-cyan-400 font-semibold mt-2">Now we're scaling it globally.</span>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to={createPageUrl("Careers")}>
                  <motion.button 
                    whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)" }}
                    className="bg-white text-black text-lg px-14 py-6 rounded-2xl font-bold inline-flex items-center gap-3 relative overflow-hidden group"
                  >
                    View Open Positions
                    <motion.div whileHover={{ x: 5 }}>
                      <ArrowRight className="w-6 h-6" />
                    </motion.div>
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  whileHover={{ scale: 1.08, boxShadow: "0 0 40px rgba(6, 182, 212, 0.7)" }}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-lg px-14 py-6 rounded-2xl font-bold inline-flex items-center gap-3 hover:shadow-cyan-500/50 transition-shadow"
                >
                  Try NexusVectis
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Sparkles className="w-6 h-6" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-cyan-500/20 z-10 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <motion.img 
                  whileHover={{ scale: 1.1, filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.6))" }}
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                  alt="NexusVectis Logo" 
                  className="h-32 w-auto mb-6 opacity-95"
                />
              </Link>
              <p className="text-slate-300 max-w-md font-light">
                Logistics intelligence from 2056, deployed today.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-cyan-400">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">FLEET AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 text-cyan-400">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("About")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">About</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-cyan-300 transition-colors hover:translate-x-1 inline-block">Blog</Link></li>
              </ul>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent mb-8"
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Building tomorrow, today.</p>
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