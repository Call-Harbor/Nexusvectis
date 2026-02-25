import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Target, Users, Sparkles, ArrowRight, Award, TrendingUp, Globe, Zap, Shield, Brain, Rocket, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";

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
              Building the Future of <br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Logistics Intelligence
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 leading-relaxed max-w-5xl mx-auto">
              We're on a mission to democratize AI-powered logistics technology. 
              Every operator, from small fleets to global enterprises, deserves world-class intelligence tools.
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
                Our <span className="text-cyan-400">Mission</span>
              </h2>
              <div className="space-y-6 text-xl text-slate-300 leading-relaxed">
                <p>
                  For decades, advanced fleet intelligence was reserved for Fortune 500 companies with massive IT budgets. 
                  We're changing that.
                </p>
                <p>
                  NexusVectis brings enterprise-grade AI, real-time tracking, and predictive analytics to businesses of all sizes. 
                  Our platform scales from 5 vehicles to 5,000, adapting to your growth.
                </p>
                <p className="text-cyan-400 font-semibold">
                  We believe powerful technology should be accessible, not exclusive.
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
                { value: "10M+", label: "Shipments Tracked", icon: Globe },
                { value: "500K+", label: "AI Commands Daily", icon: Brain },
                { value: "99.9%", label: "Uptime", icon: Zap },
                { value: "45%", label: "Avg. Cost Savings", icon: TrendingUp }
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

      {/* Values Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our <span className="text-cyan-400">Values</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              The principles that guide everything we build
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Sparkles, 
                title: "Innovation First", 
                desc: "We push the boundaries of what's possible with AI. Our FLEET AI represents years of research in natural language understanding and logistics optimization.",
                color: "cyan"
              },
              { 
                icon: Heart, 
                title: "Customer Obsessed", 
                desc: "Your success is our success. We build features based on real operator feedback, not theoretical needs. Every update solves actual problems.",
                color: "violet"
              },
              { 
                icon: Target, 
                title: "Radical Simplicity", 
                desc: "Complex technology should feel simple. We hide advanced algorithms behind intuitive interfaces. If you need a manual, we've failed.",
                color: "fuchsia"
              },
              {
                icon: Shield,
                title: "Security & Trust",
                desc: "Enterprise-grade security is non-negotiable. SOC 2 compliance, end-to-end encryption, and rigorous auditing protect your data.",
                color: "emerald"
              },
              {
                icon: Rocket,
                title: "Move Fast, Stay Reliable",
                desc: "We ship features weekly without compromising stability. 99.9% uptime isn't a target—it's our baseline commitment.",
                color: "amber"
              },
              {
                icon: Globe,
                title: "Global Thinking",
                desc: "Logistics is global. Our platform supports 50+ countries, multiple languages, and diverse transport modes from day one.",
                color: "rose"
              }
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${value.color}-500/20 to-${value.color}-500/5 flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-8 h-8 text-${value.color}-400`} />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">{value.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              Built by Logistics <span className="text-cyan-400">Experts</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed mb-12">
              Our team combines decades of logistics operations experience with cutting-edge AI expertise. 
              We've lived the problems we're solving—from warehouse floors to dispatch centers.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { role: "Operations Veterans", desc: "25+ years combined in logistics" },
                { role: "AI Researchers", desc: "PhDs from leading tech companies" },
                { role: "Engineers", desc: "Built systems handling millions of shipments" }
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
              Join Our Mission
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
              We're always looking for passionate individuals who want to revolutionize logistics
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