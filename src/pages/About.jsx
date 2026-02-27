import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Target, Users, Sparkles, ArrowRight, Award, TrendingUp, Globe, Zap, Shield, Brain, Rocket, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import TechEvolution from "../components/about/TechEvolution";
import MissionVision from "../components/about/MissionVision";
import TechShowcase from "../components/about/TechShowcase";

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-32 w-auto mx-auto opacity-90"
              />
            </Link>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight">
              The <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Next-Generation
              </span> <br />
              Fleet Intelligence Platform
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 leading-relaxed max-w-5xl mx-auto">
              NexusVectis is a brand-new platform built from the ground up with AI at its core. 
              Not an upgrade. Not a plug-in. A completely reimagined approach to fleet operations powered by distributed AI orchestration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                Built <span className="text-cyan-400">From Scratch</span>
              </h2>
              <div className="space-y-6 text-xl text-slate-300 leading-relaxed">
                <p>
                  We started with a blank canvas. No legacy code. No compromises. Just modern AI architecture built for the challenges fleet operators face today.
                </p>
                <p>
                  Every component—from FLEET AI's natural language engine to our swarm intelligence coordination to digital twin federation—was designed together as one unified system. 
                  This is what a 2026 fleet platform looks like when you build it today.
                </p>
                <p className="text-cyan-400 font-semibold">
                  We're not adding AI to logistics. We're rebuilding logistics with AI as the foundation.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
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
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center"
                  >
                    <Icon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <div className="text-4xl font-black bg-gradient-to-br from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <MissionVision />

      {/* Technology Showcase */}
      <TechShowcase />

      {/* Technology Evolution & Future Roadmap */}
      <TechEvolution />



      {/* Team Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Built by AI and Logistics <span className="text-cyan-400">Pioneers</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed mb-12">
              We're not logistics experts who hired AI engineers. We're AI researchers who know logistics inside and out. 
              This is why NexusVectis thinks differently—we solved this problem from first principles.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                 { role: "AI Researchers", desc: "PhDs in machine learning, natural language processing, and distributed systems" },
                 { role: "Logistics Operators", desc: "10+ years in dispatch, routing, and warehouse automation" },
                 { role: "Systems Architects", desc: "Built platforms handling billions of events at scale" }
               ].map((team, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <Award className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-2">{team.role}</h4>
                  <p className="text-slate-400 text-sm">{team.desc}</p>
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
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 text-center"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              This is Just the Beginning
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              We've reimagined fleet operations from scratch. Now we're scaling it globally. 
              Join us in building the future of logistics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to={createPageUrl("Careers")}>
                <button className="bg-white text-slate-900 text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3">
                  View Open Positions
                  <ArrowRight className="w-6 h-6" />
                </button>
              </Link>
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
              >
                Try NexusVectis
                <Sparkles className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                  alt="NexusVectis Logo" 
                  className="h-32 w-auto mb-6 opacity-90"
                />
              </Link>
              <p className="text-slate-400 max-w-md">
                Next-generation fleet intelligence platform powered by AI
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