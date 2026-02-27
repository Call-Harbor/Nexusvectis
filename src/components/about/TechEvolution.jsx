import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Cpu, Brain, Zap, Globe, Shield, Sparkles } from "lucide-react";

const techEvolutions = [
  {
    phase: "Foundation (2020-2022)",
    icon: Cpu,
    color: "violet",
    title: "AI-Native Architecture",
    features: [
      "Distributed neural networks for real-time optimization",
      "Natural language processing for fleet commands",
      "Real-time route optimization engine",
      "Digital twin proto-framework"
    ],
    achievement: "40% cost reduction on pilot programs",
    futureGate: true
  },
  {
    phase: "Scale (2023-2024)",
    icon: Brain,
    color: "cyan",
    title: "Intelligent Orchestration",
    features: [
      "50+ parallel AI analyses running simultaneously",
      "Swarm intelligence coordination across fleets",
      "Predictive maintenance with 95% accuracy",
      "Multi-modal transport optimization (truck, ship, air, drone)",
      "Edge computing for sub-millisecond decisions"
    ],
    achievement: "100M+ optimization decisions daily",
    futureGate: true
  },
  {
    phase: "Intelligence (2025)",
    icon: Zap,
    color: "fuchsia",
    title: "Cognitive Federation",
    features: [
      "Graph neural networks for supply chain topology",
      "Autonomous fleet self-organization",
      "AI-to-AI collaboration protocols",
      "Quantum-ready algorithms (classical optimization)",
      "Self-healing logistics networks"
    ],
    achievement: "10,000+ global operators using platform",
    futureGate: true
  },
  {
    phase: "Future (2026+)",
    icon: Sparkles,
    color: "rose",
    title: "Neuro-Symbolic Reasoning",
    features: [
      "Hybrid symbolic-neural decision engines",
      "Multi-agent reinforcement learning fleets",
      "Zero-latency global coordination",
      "Autonomous fleet negotiation systems",
      "Quantum computing integration for complex optimization"
    ],
    achievement: "TBD - Next frontier unlocking",
    futureGate: false
  }
];

const roadmapItems = [
  {
    year: "2026 Q2",
    title: "Autonomous Fleet Negotiation",
    desc: "Fleets autonomously negotiate routes, pricing, and resource allocation without human intervention",
    icon: Globe
  },
  {
    year: "2026 Q3",
    title: "Quantum Optimization Layer",
    desc: "Integration with quantum computers for solving complex global optimization problems",
    icon: Cpu
  },
  {
    year: "2026 Q4",
    title: "Digital Twin Marketplace",
    desc: "Operators can buy/sell digital twin simulations for predictive scenario planning",
    icon: Brain
  },
  {
    year: "2027 H1",
    title: "Multi-Agent Governance",
    desc: "AI agents form emergent governance structures for self-regulating logistics networks",
    icon: Shield
  }
];

export default function TechEvolution() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const current = techEvolutions[currentPhase];
  const Icon = current.icon;

  const colorMap = {
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  };

  return (
    <>
      {/* Tech Evolution Timeline */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Technology <span className="text-cyan-400">Evolution</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From foundation to future—how NexusVectis is building the next generation of logistics intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Phase Selector */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-3">
                {techEvolutions.map((phase, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentPhase(idx)}
                    whileHover={{ x: 10 }}
                    className={`w-full text-left p-6 rounded-2xl border transition-all ${
                      idx === currentPhase
                        ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border-cyan-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${
                      idx === currentPhase ? "text-cyan-400" : "text-slate-400"
                    }`}>
                      {phase.phase}
                    </div>
                    <div className={`text-xl font-bold ${
                      idx === currentPhase ? "text-white" : "text-slate-300"
                    }`}>
                      {phase.title}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Timeline Dots */}
              <div className="flex items-center justify-between gap-2 pt-4">
                <button
                  onClick={() => setCurrentPhase(Math.max(0, currentPhase - 1))}
                  disabled={currentPhase === 0}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <div className="flex gap-2 flex-1 justify-center">
                  {techEvolutions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhase(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentPhase
                          ? "w-8 bg-cyan-400"
                          : "w-2 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPhase(Math.min(techEvolutions.length - 1, currentPhase + 1))}
                  disabled={currentPhase === techEvolutions.length - 1}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            </motion.div>

            {/* Phase Details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              key={currentPhase}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-10 rounded-3xl bg-gradient-to-br ${colorMap[current.color]} border`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <Icon className={`w-12 h-12 ${
                    current.color === 'violet' ? 'text-violet-400' :
                    current.color === 'cyan' ? 'text-cyan-400' :
                    current.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-rose-400'
                  }`} />
                  <h3 className="text-3xl font-bold text-white">{current.title}</h3>
                </div>

                <div className="space-y-3 mb-8">
                  {current.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <Sparkles className={`w-5 h-5 mt-1 flex-shrink-0 ${
                        current.color === 'violet' ? 'text-violet-400' :
                        current.color === 'cyan' ? 'text-cyan-400' :
                        current.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-rose-400'
                      }`} />
                      <span className="text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <div className={`p-6 rounded-2xl bg-white/5 border border-white/10`}>
                  <div className="text-sm text-slate-400 mb-2">Current Achievement</div>
                  <div className={`text-xl font-bold ${
                    current.color === 'violet' ? 'text-violet-400' :
                    current.color === 'cyan' ? 'text-cyan-400' :
                    current.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-rose-400'
                  }`}>
                    {current.achievement}
                  </div>
                </div>
              </motion.div>

              {!current.futureGate && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/40">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-bold text-amber-400 mb-1">Uncharted Territory</div>
                      <p className="text-sm text-slate-300">This is where research meets reality. We're pioneering technologies that don't yet exist in production.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The <span className="text-cyan-400">Future Roadmap</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Where we're heading. Technology that will reshape global logistics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {roadmapItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Icon className="w-10 h-10 text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-cyan-400">{item.year}</div>
                      <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}