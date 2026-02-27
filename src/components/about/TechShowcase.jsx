import { motion } from "framer-motion";
import { Cpu, Brain, Zap, Network, Shield, Sparkles } from "lucide-react";

const techStack = [
  {
    title: "Distributed Neural Networks",
    desc: "50+ parallel AI models orchestrating decisions across your fleet in real-time",
    icon: Brain,
    color: "cyan",
    features: ["Real-time predictions", "Sub-millisecond latency", "Self-healing networks"]
  },
  {
    title: "Natural Language Intelligence",
    desc: "FLEET AI understands fleet operations in plain language—no training required",
    icon: Sparkles,
    color: "violet",
    features: ["Danish, English, & more", "Context-aware reasoning", "Multi-turn conversations"]
  },
  {
    title: "Digital Twin Federation",
    desc: "Perfect digital replicas of every vehicle, enabling predictive scenarios before they happen",
    icon: Network,
    color: "fuchsia",
    features: ["Perfect synchronization", "Predictive simulations", "What-if analysis"]
  },
  {
    title: "Quantum-Ready Optimization",
    desc: "Algorithms prepared for quantum computing integration—ready for the next compute era",
    icon: Zap,
    color: "emerald",
    features: ["Hybrid classical-quantum", "Optimization at scale", "Future-proof"]
  },
  {
    title: "Autonomous Swarm Intelligence",
    desc: "Fleets that self-coordinate without human intervention—emergent optimization",
    icon: Cpu,
    color: "amber",
    features: ["Self-organizing", "Adaptive behavior", "Zero intervention"]
  },
  {
    title: "Military-Grade Security",
    desc: "End-to-end encryption, anomaly detection, and autonomous threat response",
    icon: Shield,
    color: "rose",
    features: ["SOC 2 compliant", "Real-time anomaly detection", "Zero-trust architecture"]
  }
];

export default function TechShowcase() {
  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Our Technology <span className="text-cyan-400">Arsenal</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Six core technologies working in perfect harmony to reimagine fleet intelligence
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            const colorMap = {
              cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
              violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
              fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-400",
              emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
              amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
              rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400"
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -15, scale: 1.02 }}
                className={`p-8 rounded-3xl bg-gradient-to-br ${colorMap[tech.color]} border hover:border-opacity-60 transition-all group`}
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <Icon className={`w-12 h-12 ${colorMap[tech.color].split(" ").pop()}`} />
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {tech.title}
                </h3>

                <p className="text-slate-300 mb-6 leading-relaxed">
                  {tech.desc}
                </p>

                <div className="space-y-2">
                  {tech.features.map((feature, fidx) => (
                    <motion.div
                      key={fidx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 + fidx * 0.05 }}
                      className="flex items-center gap-2 text-sm text-slate-400"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${colorMap[tech.color].split(" ").pop()}`} />
                      {feature}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}