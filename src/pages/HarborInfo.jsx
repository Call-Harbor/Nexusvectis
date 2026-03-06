import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Zap, Route, Database, Cpu, Shield, Globe, Activity, 
  ChevronRight, ArrowRight, Layers, Brain, Satellite,
  TrendingUp, AlertTriangle, Wrench, BarChart3, Lock, Server
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ACRONYM = [
  { letter: "H", word: "Holographic", color: "text-cyan-400" },
  { letter: "A", word: "Autonomous", color: "text-violet-400" },
  { letter: "R", word: "Routing", color: "text-emerald-400" },
  { letter: "B", word: "& Base", color: "text-amber-400" },
  { letter: "O", word: "Operations", color: "text-orange-400" },
  { letter: "R", word: "Regulator", color: "text-rose-400" },
];

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Autonomous Intelligence",
    description: "HARBOR processes every query through a 6-step cognitive architecture: Parse → Knowledge Sweep → Context Sweep → Causal Reasoning → Synthesis → Proactive Insight. It surfaces problems you didn't know you had.",
    color: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: Route,
    title: "Holographic Routing Engine",
    description: "Real-time multi-modal route optimization across truck, ship, air, and rail. HARBOR calculates 3D route scenarios, factoring in weather, fuel costs, port congestion, customs delays, and EU regulatory windows simultaneously.",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    icon: Satellite,
    title: "Base Operations Control",
    description: "Orchestrates all depot, port, and warehouse operations. Manages resource allocation, vehicle assignments, maintenance scheduling, and driver compliance across your entire base infrastructure — fully autonomously.",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "Regulatory Compliance Engine",
    description: "Monitors and enforces EU regulations in real time: EC 561/2006 drivers hours, ADR hazmat, cabotage rules, LEZ zones, SOLAS maritime compliance, and IMO 2030/2050 sustainability targets.",
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    description: "Failure prediction curves, demand decomposition, and 90-day fleet performance forecasting. HARBOR quantifies every insight: Best Case / Most Likely / Worst Case with confidence intervals and EUR-denominated impact.",
    color: "from-orange-500/20 to-orange-500/5",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
  },
  {
    icon: Layers,
    title: "Platform Orchestration",
    description: "HARBOR is the central nervous system of NexusVectis. All AI calls — IntellectMode, Fleet AI API, HARBOR Trainer, analytics engines — route through the same core, ensuring consistent intelligence across every interface.",
    color: "from-rose-500/20 to-rose-500/5",
    border: "border-rose-500/30",
    iconColor: "text-rose-400",
  },
];

const EXPERTISE = [
  { icon: Globe, label: "Maritime", desc: "AIS, SOLAS, CII/EEXI, bunker optimization" },
  { icon: Zap, label: "Aviation", desc: "IATA, weight & balance, DGR, slot coordination" },
  { icon: Route, label: "Road", desc: "EU drivers hours, ADR, cabotage, LEZ zones" },
  { icon: Database, label: "Supply Chain", desc: "Network design, TCO, cold chain, reverse logistics" },
  { icon: BarChart3, label: "Finance", desc: "Freight rate forecasting, activity-based costing" },
  { icon: Wrench, label: "Maintenance", desc: "Predictive failure curves, component lifecycle" },
  { icon: AlertTriangle, label: "Risk", desc: "EMV quantification, probability × impact matrix" },
  { icon: Lock, label: "Sustainability", desc: "EU ETS, FuelEU Maritime, IMO 2030/2050, CSRD" },
];

const ARCHITECTURE_STEPS = [
  { step: "01", title: "Parse", desc: "Decode the actual request beneath the stated question", color: "text-cyan-400" },
  { step: "02", title: "Knowledge Sweep", desc: "Query the HARBOR training corpus and domain expertise", color: "text-violet-400" },
  { step: "03", title: "Context Sweep", desc: "Load live fleet, shipment, alert, and route data", color: "text-emerald-400" },
  { step: "04", title: "Causal Reasoning", desc: "Identify root causes — not symptoms", color: "text-amber-400" },
  { step: "05", title: "Synthesize", desc: "Model 1st, 2nd, and 3rd order consequences", color: "text-orange-400" },
  { step: "06", title: "Proact", desc: "Surface critical insights the user didn't ask for", color: "text-rose-400" },
];

export default function HarborInfo() {
  const [hoveredCap, setHoveredCap] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-auto">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              NexusVectis Core Intelligence — Online
            </div>
          </motion.div>

          {/* Acronym display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-end gap-1 text-7xl sm:text-9xl font-black tracking-wider">
              {ACRONYM.map((item, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={item.color}
                  style={{ textShadow: `0 0 40px currentColor` }}
                >
                  {item.letter}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Full name breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-8"
          >
            {ACRONYM.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`font-black text-xl ${item.color}`}>{item.letter}</span>
                <span className="text-slate-300 text-base">{item.word}</span>
                {i < ACRONYM.length - 1 && <span className="text-slate-700 ml-1">·</span>}
              </div>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center text-slate-300 text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            The central artificial intelligence powering every layer of the NexusVectis platform.
            Not a chatbot — a <strong className="text-white">sovereign logistics superintelligence</strong>.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-4"
          >
            <Link
              to={createPageUrl("IntellectMode")}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:opacity-90 transition-opacity"
            >
              <Zap className="w-5 h-5" />
              Open IntellectMode
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Cognitive Architecture */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-3">Cognitive Architecture</h2>
          <p className="text-slate-400 text-lg">Every HARBOR response executes this 6-step reasoning pipeline</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {ARCHITECTURE_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center relative"
            >
              {i < ARCHITECTURE_STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 z-10 text-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
              <p className={`text-3xl font-black mb-2 ${step.color}`}>{step.step}</p>
              <p className="text-white font-bold text-sm mb-1">{step.title}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-3">Core Capabilities</h2>
          <p className="text-slate-400 text-lg">What HARBOR does — and how it does it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredCap(i)}
                onMouseLeave={() => setHoveredCap(null)}
                className={`p-6 rounded-xl border ${cap.border} bg-gradient-to-br ${cap.color} cursor-default transition-all duration-300 ${hoveredCap === i ? 'scale-105 shadow-2xl' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-black/30 border ${cap.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${cap.iconColor}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{cap.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{cap.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Domain Expertise */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-3">Domain Expertise</h2>
          <p className="text-slate-400 text-lg">HARBOR is trained across all major transport and logistics verticals</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {EXPERTISE.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
              >
                <Icon className="w-6 h-6 text-cyan-400 mb-3" />
                <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Response Standards */}
      <section className="max-w-6xl mx-auto px-6 py-8 pb-20">
        <div className="p-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-black mb-4">Response Standards</h2>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                HARBOR maintains the analytical rigor of a McKinsey partner with 30 years of fleet operations experience. Every response is decisive, proactive, and quantified.
              </p>
              <div className="space-y-3">
                {[
                  "Immediate action within 24h",
                  "Medium-term adjustments 1–4 weeks",
                  "Strategic implications 1–6 months",
                  "Confidence levels on all predictions",
                  "Quantified cost/saving claims in EUR",
                  "Best Case / Most Likely / Worst Case scenarios",
                ].map((standard, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-slate-200 text-sm">{standard}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-violet-400" />
                  <span className="text-white font-bold">AI Model</span>
                </div>
                <p className="text-slate-400 text-sm">Mistral Large — state-of-the-art reasoning with 128K context window. Vision model (Pixtral Large) for image analysis.</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-bold">Live Context</span>
                </div>
                <p className="text-slate-400 text-sm">Every HARBOR query is enriched with live fleet status, open alerts, active routes, and shipment data from your organization.</p>
              </div>
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-bold">Knowledge Base</span>
                </div>
                <p className="text-slate-400 text-sm">Continuously trained on your organization's operational data, FAQs, and procedures via HARBOR Trainer.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}