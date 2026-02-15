import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Sparkles, Brain, Zap, ArrowRight, CheckCircle2, MessageSquare, Globe, TrendingUp, Target, BarChart3, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function FleetAIPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
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
          <Link to={createPageUrl("Home")}>
            <motion.img 
              whileHover={{ scale: 1.05 }}
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis" 
              className="h-20 w-auto"
            />
          </Link>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Get Started
          </button>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                FLEET AI
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-300 mb-8 leading-relaxed">
              The world's first natural language interface for fleet operations
            </p>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              No complex interfaces. No training required. Just speak naturally and watch AI transform your commands into instant action across your entire fleet.
            </p>

            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Try FLEET AI Now
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              How <span className="text-cyan-400">FLEET AI</span> Works
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Three simple steps to transform your fleet operations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Speak Naturally",
                description: "Type or speak your command in plain language. \"Route vehicle 47 to Copenhagen warehouse\" or \"Show delayed shipments\"",
                color: "cyan"
              },
              {
                icon: Brain,
                title: "AI Understands",
                description: "Advanced language models interpret intent, access real-time data, and determine the optimal action to take",
                color: "violet"
              },
              {
                icon: Zap,
                title: "Instant Execution",
                description: "Commands execute immediately. Routes optimized, assignments made, analytics generated - all in seconds",
                color: "fuchsia"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${feature.color}-500/20 to-${feature.color}-500/5 flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-10 h-10 text-${feature.color}-400`} />
                  </motion.div>
                  <div className="text-4xl font-black text-cyan-400 mb-4">{idx + 1}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-lg">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Command Examples */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Real Command <span className="text-cyan-400">Examples</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              See how natural language transforms into powerful fleet actions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              { cmd: "Show me all delayed shipments", response: "Found 3 delayed shipments. Vehicle 12 is 45min behind schedule due to traffic..." },
              { cmd: "Optimize routes for minimal CO2", response: "Analyzed 47 routes. Reduced emissions by 18% through smart consolidation..." },
              { cmd: "Which vehicles need maintenance this week?", response: "Vehicle 8 requires service in 2 days. Predicted brake pad wear at 82%..." },
              { cmd: "Assign closest truck to pickup in Copenhagen", response: "Vehicle 23 assigned. ETA to pickup: 12 minutes. Route optimized for fuel..." },
              { cmd: "Generate cost analysis for last month", response: "Total operating cost: €127,450. Fuel efficiency improved 8% vs previous month..." },
              { cmd: "What's the average delivery time to Stockholm?", response: "Average: 4.2 hours. 94% on-time delivery rate. Fastest route via E4..." }
            ].map((example, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                  <p className="text-white font-medium">"{example.cmd}"</p>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.8 }}
                  className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent mb-3"
                />
                <p className="text-slate-400 text-sm leading-relaxed">{example.response}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Why Choose <span className="text-cyan-400">FLEET AI</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { value: "90%", label: "Faster Decisions", desc: "Make fleet decisions in seconds, not minutes" },
              { value: "Zero", label: "Training Required", desc: "No manuals, no courses - just natural conversation" },
              { value: "24/7", label: "Always Available", desc: "AI never sleeps, always ready to assist" }
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
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                  className="text-7xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4"
                >
                  {benefit.value}
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.label}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Perfect For <span className="text-cyan-400">Every Role</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                role: "Fleet Managers",
                icon: Target,
                tasks: ["Route optimization", "Resource allocation", "Performance monitoring"],
                example: "\"Reassign vehicles to balance workload across regions\""
              },
              {
                role: "Dispatchers",
                icon: Rocket,
                tasks: ["Real-time assignments", "Exception handling", "Driver communication"],
                example: "\"Find available driver near postal code 2100\""
              },
              {
                role: "Operations Teams",
                icon: BarChart3,
                tasks: ["Cost analysis", "Efficiency reports", "KPI tracking"],
                example: "\"Show fuel consumption trends this quarter\""
              },
              {
                role: "Executives",
                icon: TrendingUp,
                tasks: ["Strategic insights", "Performance summaries", "Cost optimization"],
                example: "\"What's our average delivery cost per shipment?\""
              }
            ].map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <Icon className="w-12 h-12 text-cyan-400" />
                    <h3 className="text-3xl font-bold text-white">{useCase.role}</h3>
                  </div>
                  <div className="space-y-3 mb-6">
                    {useCase.tasks.map((task, taskIdx) => (
                      <div key={taskIdx} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-slate-400">{task}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-cyan-500/30">
                    <p className="text-cyan-400 italic text-sm">{useCase.example}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 md:p-20 text-center"
          >
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Experience the Future of <span className="text-cyan-400">Fleet Control</span>
            </h2>
            <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Join thousands of fleet operators using FLEET AI to transform their operations
            </p>
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6 text-cyan-500" />
              Start with FLEET AI
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                  alt="NexusVectis" 
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
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-8" />
          <p className="text-slate-500 text-sm text-center">&copy; 2026 NexusVectis ApS. Building the future of logistics.</p>
        </div>
      </footer>
    </div>
  );
}