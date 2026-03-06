import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Sparkles, Brain, Zap, ArrowRight, CheckCircle2, GitBranch, Network, Cpu, Database, Wifi, Target, TrendingUp, Layers } from "lucide-react";
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
              <Brain className="w-20 h-20 text-violet-400" />
            </motion.div>
            
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-tight">
              How <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">FLEET AI</span> Thinks
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-300 mb-8 leading-relaxed">
              Distributed AI orchestration for real-time fleet intelligence
            </p>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              Understanding the technical architecture behind natural language fleet control. 50+ parallel AI analyses running in real-time, processing thousands of data signals simultaneously.
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

      {/* AI Processing Pipeline */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The <span className="text-cyan-400">Processing Pipeline</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From natural language input to distributed execution across the fleet
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {[
              {
                stage: "1",
                title: "Natural Language Understanding",
                icon: Brain,
                tech: "LLM • Intent Detection",
                description: "Parse user commands and extract intent, parameters, and constraints"
              },
              {
                stage: "2",
                title: "Semantic Analysis",
                icon: Layers,
                tech: "AST • Graph Analysis",
                description: "Build knowledge graphs from fleet context and real-time data"
              },
              {
                stage: "3",
                title: "Plan Generation",
                icon: Target,
                tech: "STRIPS • Graph Planning",
                description: "Generate optimal execution plans with constraint satisfaction"
              },
              {
                stage: "4",
                title: "Parallel Execution",
                icon: Zap,
                tech: "Task Orchestration • 50+ AI",
                description: "Execute 50+ AI analyses simultaneously across the fleet network"
              },
              {
                stage: "5",
                title: "Distributed Results",
                icon: Network,
                tech: "Result Aggregation",
                description: "Collect and synthesize results from parallel AI processors"
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
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-cyan-500/20 hover:border-cyan-500/50 transition-all h-full">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                      <span className="text-cyan-400 font-bold text-sm">{item.stage}</span>
                    </div>
                    <Icon className="w-5 h-5 text-violet-400 mb-3" />
                    <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-xs mb-3">{item.description}</p>
                    <div className="text-[10px] text-cyan-300 font-mono bg-cyan-500/5 px-2 py-1 rounded border border-cyan-500/20">
                      {item.tech}
                    </div>
                  </div>
                  {idx < 4 && (
                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="hidden md:flex absolute top-1/2 -right-6 text-cyan-500/40"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Parallel AI Analysis */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="text-violet-400">50+ Parallel AI Analyses</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Multiple specialized AI models running simultaneously on different aspects of your fleet
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: "Route Optimization", desc: "Multi-objective pathfinding with ML", color: "cyan" },
              { name: "ETA Prediction", desc: "LSTM neural networks + real-time data", color: "violet" },
              { name: "Maintenance Forecast", desc: "Anomaly detection on sensor data", color: "fuchsia" },
              { name: "Cost Analysis", desc: "Dynamic pricing optimization", color: "emerald" },
              { name: "Fuel Consumption", desc: "Physics-based ML models", color: "blue" },
              { name: "Risk Assessment", desc: "Threat detection & prediction", color: "rose" },
              { name: "Load Balancing", desc: "Graph theory algorithms", color: "amber" },
              { name: "Traffic Prediction", desc: "Time-series forecasting", color: "indigo" },
              { name: "Exception Handling", desc: "Anomaly-driven decision trees", color: "teal" },
            ].map((analysis, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-2xl bg-${analysis.color}-500/5 border border-${analysis.color}-500/30 hover:border-${analysis.color}-500/60 transition-all`}
              >
                <Cpu className={`w-5 h-5 text-${analysis.color}-400 mb-3`} />
                <h3 className="text-lg font-semibold text-white mb-2">{analysis.name}</h3>
                <p className="text-slate-400 text-sm">{analysis.desc}</p>
                <motion.div
                  animate={{ width: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, delay: idx * 0.1 }}
                  className={`h-0.5 mt-3 bg-${analysis.color}-500`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Flow Architecture */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Real-Time <span className="text-cyan-400">Data Architecture</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-950/50 border border-cyan-500/20 p-12 max-w-5xl mx-auto overflow-hidden"
          >
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: Wifi,
                  title: "Data Sources",
                  items: ["GPS Signals", "AIS/ADS-B", "Sensor Feeds", "Weather APIs"],
                  color: "cyan"
                },
                {
                  icon: Cpu,
                  title: "Edge Processing",
                  items: ["Stream Processing", "Feature Extraction", "Real-time Aggregation", "Event Streaming"],
                  color: "violet"
                },
                {
                  icon: Database,
                  title: "Central Store",
                  items: ["Time-Series DB", "Vector Store", "Graph DB", "Cache Layer"],
                  color: "fuchsia"
                },
                {
                  icon: Brain,
                  title: "AI Inference",
                  items: ["Model Serving", "Multi-GPU", "Batch Processing", "Real-time Scoring"],
                  color: "emerald"
                }
              ].map((arch, idx) => {
                const Icon = arch.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-${arch.color}-500/20 border border-${arch.color}-500/40 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${arch.color}-400`} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{arch.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {arch.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${arch.color}-400`} />
                          <span className="text-sm text-slate-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mt-8 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
            >
              <p className="text-cyan-300 text-sm text-center font-mono">
                ↓ Continuous Data Flow: Sub-second latency, millions of events/second ↓
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Technical Capabilities */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Technical <span className="text-violet-400">Capabilities</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Multi-Model Ensemble",
                features: [
                  "GPT-4 for natural language understanding",
                  "Mistral for specialized domain reasoning",
                  "Custom LSTM networks for time-series prediction",
                  "Graph neural networks for network optimization"
                ]
              },
              {
                title: "Scalable Inference",
                features: [
                  "Distributed model serving across GPU clusters",
                  "Automatic batching for throughput optimization",
                  "Real-time model updates without downtime",
                  "Sub-100ms inference latency for 90th percentile"
                ]
              },
              {
                title: "Advanced Analytics",
                features: [
                  "Causal inference for root cause analysis",
                  "Counterfactual reasoning for decision support",
                  "Uncertainty quantification in all predictions",
                  "Explainability through attention mechanisms"
                ]
              },
              {
                title: "Enterprise Integration",
                features: [
                  "Real-time data ingestion from 100+ sources",
                  "API-first architecture for custom workflows",
                  "Webhook support for event-driven automation",
                  "Audit logging and compliance tracking"
                ]
              }
            ].map((capability, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-cyan-500/50 transition-all"
              >
                <h3 className="text-2xl font-bold text-white mb-6">{capability.title}</h3>
                <ul className="space-y-4">
                  {capability.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Performance <span className="text-cyan-400">Metrics</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { value: "50+", label: "Parallel AI Analyses", metric: "per command" },
              { value: "<100ms", label: "End-to-End Latency", metric: "p90 response time" },
              { value: "10K+", label: "Requests/sec", metric: "throughput" },
              { value: "99.99%", label: "Availability SLA", metric: "enterprise grade" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                  className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-3"
                >
                  {stat.value}
                </motion.div>
                <h3 className="text-lg font-semibold text-white mb-1">{stat.label}</h3>
                <p className="text-sm text-slate-400">{stat.metric}</p>
              </motion.div>
            ))}
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
              Experience <span className="text-cyan-400">Fleet AI</span> Intelligence
            </h2>
            <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
              See how distributed AI orchestration transforms fleet operations in real-time
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
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-cyan-400 transition-colors">Newsroom</Link></li>
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