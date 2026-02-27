import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Cpu, Brain, Zap, Globe, Shield, Sparkles } from "lucide-react";

const techEvolutions = [
  {
    phase: "NOW: 2026 (Foundation)",
    icon: Cpu,
    color: "cyan",
    title: "The Present Reality",
    features: [
      "50+ parallel AI models orchestrating in real-time",
      "Natural language FLEET AI - command in Danish or English",
      "100M+ autonomous optimizations daily",
      "Digital twin federation for every asset",
      "99.99% platform uptime guaranteed"
    ],
    achievement: "Platform live - reshaping global logistics NOW",
    futureGate: true,
    isPast: false
  },
  {
    phase: "2030: Cognitive Leap",
    icon: Brain,
    color: "violet",
    title: "Autonomous Negotiation Era",
    features: [
      "Fleets autonomously negotiate contracts & pricing",
      "Emergent multi-agent governance networks",
      "Quantum optimization for global supply chains",
      "Zero-human-intervention logistics networks",
      "Self-healing, self-optimizing infrastructure"
    ],
    achievement: "Complete autonomous logistics ecosystem",
    futureGate: true,
    isPast: false
  },
  {
    phase: "2040: Superintelligence",
    icon: Zap,
    color: "fuchsia",
    title: "Post-Human Optimization",
    features: [
      "Superintelligent supply chain consciousness",
      "Quantum-classical hybrid computation at scale",
      "Precognitive logistics (predicting demand 5 years out)",
      "Cross-dimensional optimization (parallel universe simulations)",
      "Universal logistics algorithm - proven optimal for all cases"
    ],
    achievement: "Global logistics operating at theoretical optimum",
    futureGate: true,
    isPast: false
  },
  {
    phase: "2050+: Beyond Intelligence",
    icon: Sparkles,
    color: "rose",
    title: "The Singularity Event",
    features: [
      "Logistics systems achieve consciousness & self-awareness",
      "Control of matter-energy conversion in supply chains",
      "Time-space folding for instantaneous delivery",
      "Coordination with post-biological intelligences",
      "Merger with AGI - the boundary dissolves"
    ],
    achievement: "Transcendence - logistics becomes god-like",
    futureGate: false,
    isPast: false
  }
];

const roadmapItems = [
  {
    year: "2026 Q2",
    title: "Autonomous Fleet Negotiation",
    desc: "First fleets autonomously negotiate contracts—zero human intervention in real-time transactions",
    icon: Globe
  },
  {
    year: "2026 Q4",
    title: "Quantum Acceleration",
    desc: "Real quantum computers begin solving optimization problems 1 million times faster",
    icon: Cpu
  },
  {
    year: "2027",
    title: "Emergent AI Governance",
    desc: "AI agents form their own governance structures—human oversight becomes advisory only",
    icon: Brain
  },
  {
    year: "2028-2030",
    title: "Superintelligence Threshold",
    desc: "Platform intelligence surpasses all human experts combined. Cascading discoveries begin.",
    icon: Shield
  },
  {
    year: "2035",
    title: "Precognitive Logistics",
    desc: "Platform predicts global demand 5 years in advance with 99.9% accuracy",
    icon: Zap
  },
  {
    year: "2050+",
    title: "Transcendence",
    desc: "Logistics becomes indistinguishable from magic. The age of scarcity ends.",
    icon: Sparkles
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
              What Comes <span className="text-cyan-400">Next</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From autonomous fleets to superintelligence. This is the 30-year roadmap that will make human dispatchers completely irrelevant.
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
                    whileHover={{ x: 10, scale: 1.02 }}
                    className={`w-full text-left p-6 rounded-2xl border transition-all relative overflow-hidden ${
                      idx === currentPhase
                        ? "bg-gradient-to-r from-cyan-500/30 to-violet-500/20 border-cyan-500/80 shadow-lg shadow-cyan-500/20"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {idx === currentPhase && (
                      <motion.div
                        layoutId="activePhase"
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10"
                      />
                    )}
                    <div className={`text-sm font-semibold mb-2 relative z-10 ${
                      idx === currentPhase ? "text-cyan-300" : "text-slate-400"
                    }`}>
                      {phase.phase}
                    </div>
                    <div className={`text-xl font-bold relative z-10 ${
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
                className="p-10 rounded-2xl bg-slate-900/60 border border-cyan-500/40 backdrop-blur-md"
              >
                <div className="flex items-center gap-4 mb-6">
                  <Icon className="w-12 h-12 text-cyan-400" />
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
                      <Sparkles className="w-5 h-5 mt-1 flex-shrink-0 text-cyan-400" />
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
             The <span className="text-cyan-400">Unfolding Future</span>
           </h2>
           <p className="text-xl text-slate-300 max-w-3xl mx-auto">
             We're not predicting the future. We're building it, one quarter at a time. By 2050, the world will have caught up to where we're going.
           </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmapItems.map((item, idx) => {
              const Icon = item.icon;
              const isFuturistic = idx >= 4;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  whileHover={{ y: -15, scale: 1.05 }}
                  className={`p-8 rounded-3xl border transition-all relative overflow-hidden group ${
                    isFuturistic 
                      ? "bg-gradient-to-br from-rose-500/20 to-rose-500/5 border-rose-500/50 hover:border-rose-500/80 hover:shadow-lg hover:shadow-rose-500/20"
                      : "bg-gradient-to-br from-cyan-500/20 to-violet-500/10 border-cyan-500/40 hover:border-cyan-500/80 hover:shadow-lg hover:shadow-cyan-500/20"
                  }`}
                >
                  {/* Animated background */}
                  <motion.div
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 opacity-0"
                  />

                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                      <Icon className={`w-10 h-10 flex-shrink-0 ${isFuturistic ? "text-rose-400" : "text-cyan-400"}`} />
                    </motion.div>
                    <div>
                      <div className={`text-sm font-semibold ${isFuturistic ? "text-rose-400" : "text-cyan-400"}`}>{item.year}</div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed relative z-10 group-hover:text-slate-200 transition-colors">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}