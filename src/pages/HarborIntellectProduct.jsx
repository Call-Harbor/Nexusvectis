import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import {
  Brain, Zap, Network, GitBranch, Activity, FlaskConical,
  Database, Shield, ArrowRight, CheckCircle2, Sparkles, Users,
  Cpu, Clock, TrendingUp, MessageSquare, Play, ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    color: "#06b6d4",
    title: "20+ Specialized AI Workers",
    desc: "Fleet Analyst, Risk Engine, Financial AI, Maintenance Bot, Compliance Guard and more — each a domain expert."
  },
  {
    icon: Network,
    color: "#8b5cf6",
    title: "Parallel Orchestration",
    desc: "Run all workers simultaneously on a single task. Get a full multi-perspective analysis in seconds."
  },
  {
    icon: GitBranch,
    color: "#a78bfa",
    title: "Workflow Version Manager",
    desc: "Save, compare and roll back to any orchestration state. Never lose a working configuration."
  },
  {
    icon: Activity,
    color: "#f59e0b",
    title: "Full Observability",
    desc: "Real-time latency, token usage, and error tracing for every agent call in every workflow."
  },
  {
    icon: Zap,
    color: "#10b981",
    title: "Smart Agent Router",
    desc: "Automatically routes your task to the best-performing worker based on specialty, latency and cost."
  },
  {
    icon: FlaskConical,
    color: "#f97316",
    title: "Agent Eval Suite",
    desc: "Benchmark any agent against golden tasks. Track pass rate, latency and quality scores over time."
  },
  {
    icon: Database,
    color: "#a78bfa",
    title: "Shared Agent Memory",
    desc: "Cross-agent knowledge store with RBAC. Inject facts, context and results into every sandboxed call."
  },
  {
    icon: Shield,
    color: "#06b6d4",
    title: "Isolated Sandbox Execution",
    desc: "Every agent runs in an isolated context with timeout enforcement, token budgeting and auto memory injection."
  },
];

const STEPS = [
  { n: "01", title: "Open the Chat", desc: "Launch H.A.R.B.O.R Intellect from your dashboard." },
  { n: "02", title: "Type your task", desc: "Ask anything — analysis, planning, compliance, forecasting." },
  { n: "03", title: "Orchestrate", desc: "Click ORCHESTRATE to dispatch all relevant workers in parallel." },
  { n: "04", title: "Review & act", desc: "Each worker returns a full analysis. Merge insights and take action." },
];

export default function HarborIntellectProduct() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 400], [0, 80]);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/30 to-cyan-950/20" />
        <motion.div style={{ y: y1 }} className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-violet-500/15 rounded-full blur-3xl" />
        <motion.div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Nav */}
      <motion.header initial={{ y: -80 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
              alt="NexusVectis" className="h-14 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Log In
            </button>
            <button onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:scale-105 transition-transform flex items-center gap-2">
              Launch H.A.R.B.O.R <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/30 mb-8">
            <Brain className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-sm text-violet-300 font-semibold">H.A.R.B.O.R INTELLECT</span>
            <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">MULTI-AGENT AI</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1.05] tracking-tight">
            Your entire AI team,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              working in parallel
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            H.A.R.B.O.R Intellect is a production-grade multi-agent AI system. Dispatch 20+ specialist workers simultaneously — analysis, risk, compliance, maintenance, finance and more — and synthesize their outputs instantly.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="bg-gradient-to-r from-violet-500 via-cyan-500 to-fuchsia-500 text-white text-lg px-10 py-5 rounded-2xl font-bold group hover:scale-105 transition-transform flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              Launch H.A.R.B.O.R Intellect
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/"
              className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-8 py-5 rounded-2xl text-base transition-all">
              Back to Platform
            </Link>
          </motion.div>

          {/* Live badge row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-12">
            {["20+ AI Workers", "Parallel Execution", "Agent Memory", "Sandboxed", "Full Observability"].map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400 font-mono px-3 py-1.5 rounded-full border border-slate-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
              Everything in one
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> command center</span>
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">Built for production. Every component is enterprise-ready.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-6 rounded-2xl border transition-all"
                  style={{ background: `${f.color}08`, borderColor: `${f.color}25` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">From question to multi-agent insight in seconds</p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/8">
                <div className="text-5xl font-black font-mono mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{s.n}</div>
                <h3 className="text-white font-bold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-slate-700 z-10">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent showcase */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-[2.5rem] overflow-hidden border border-violet-500/30 p-12 md:p-16"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))" }}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Meet the <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Workers</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">Each worker is a domain specialist with a unique system prompt and training context</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { emoji: "📊", name: "Fleet Analyst", color: "#06b6d4" },
                { emoji: "⚠️", name: "Risk Engine", color: "#ef4444" },
                { emoji: "💰", name: "Financial AI", color: "#10b981" },
                { emoji: "🔧", name: "Maintenance Bot", color: "#f59e0b" },
                { emoji: "⚖️", name: "Compliance Guard", color: "#8b5cf6" },
                { emoji: "🌱", name: "Sustainability AI", color: "#22c55e" },
                { emoji: "🧠", name: "Strategy AI", color: "#a78bfa" },
                { emoji: "🔍", name: "Data Miner", color: "#06b6d4" },
                { emoji: "🛣️", name: "Route Optimizer", color: "#f97316" },
                { emoji: "👥", name: "Customer Intel", color: "#ec4899" },
                { emoji: "📡", name: "Market Scout", color: "#14b8a6" },
                { emoji: "🛡️", name: "Security AI", color: "#64748b" },
              ].map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-xl flex items-center gap-2.5"
                  style={{ background: `${w.color}10`, border: `1px solid ${w.color}25` }}>
                  <span className="text-xl">{w.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: w.color }}>{w.name}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-6">+ Custom workers you build yourself</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="text-center rounded-[3rem] border border-violet-500/30 p-16 md:p-20 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))" }}>
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
              <Brain className="w-16 h-16 text-violet-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Ready to deploy
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">your AI workforce?</span>
              </h2>
              <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto font-light">
                H.A.R.B.O.R Intellect is available inside the NexusVectis platform. Log in to start your first parallel orchestration.
              </p>
              <button onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-3 mx-auto">
                <Sparkles className="w-6 h-6" />
                Launch H.A.R.B.O.R Intellect
                <ArrowRight className="w-6 h-6" />
              </button>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-slate-400 text-sm">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant access</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No setup required</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom AI workers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 px-6 border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-slate-600 text-sm">© 2026 NexusVectis · H.A.R.B.O.R Intellect</p>
          <Link to="/" className="text-slate-500 hover:text-cyan-400 text-sm transition-colors flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Platform
          </Link>
        </div>
      </footer>
    </div>
  );
}