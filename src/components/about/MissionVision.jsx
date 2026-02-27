import { motion } from "framer-motion";
import { Sparkles, Target, Compass, Zap } from "lucide-react";

export default function MissionVision() {
  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Compass className="w-8 h-8 text-cyan-400" />
                <h2 className="text-4xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-2xl text-slate-300 leading-relaxed">
                To liberate global supply chains from the tyranny of legacy systems—and prove that entire industries can be reimagined when you start from first principles.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/30">
              <p className="text-lg text-slate-200 leading-relaxed">
                We're not here to make fleet logistics incrementally better. We're here to make it fundamentally different. 
                Every fleet operator on Earth should have access to intelligence that was previously reserved for Fortune 500 companies with million-dollar budgets.
              </p>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-violet-400" />
                <h2 className="text-4xl font-bold text-white">Our Vision</h2>
              </div>
              <p className="text-2xl text-slate-300 leading-relaxed">
                A world where logistics networks think, adapt, and optimize themselves. Where AI and humans work in perfect synchrony to solve impossible problems.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/30">
              <p className="text-lg text-slate-200 leading-relaxed">
                By 2030, autonomous fleet coordination will be the norm, not the exception. Multi-agent systems will negotiate routes and resources in real-time. 
                Quantum computers will solve optimization problems we can't even imagine today. And NexusVectis will be powering it all.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Core Values Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">What Drives Us</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Radical Innovation", desc: "We don't iterate. We revolutionize." },
              { label: "No Compromises", desc: "Built in 2026, not patched from 1996." },
              { label: "First Principles", desc: "Why? Not 'how did we do it before?'" },
              { label: "Scale with Purpose", desc: "Billions of decisions, all optimized." }
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-cyan-500/30 transition-all"
              >
                <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <h4 className="font-bold text-white mb-2">{value.label}</h4>
                <p className="text-sm text-slate-400">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}