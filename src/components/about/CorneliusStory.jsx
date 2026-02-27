import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Globe } from "lucide-react";

const storyStages = [
  {
    year: "2020",
    age: "15 år",
    title: "The Awakening",
    desc: "Cornelio ser hvordan logistics bliver kørt med 20 år gammel teknologi. Han tænker: 'Det her skal revolutioneres.'",
    icon: Sparkles,
    color: "violet",
    achievement: "Lærer AI basics selv",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop"
  },
  {
    year: "2022",
    age: "17 år",
    title: "First Breakthrough",
    desc: "Bygger sin første AI-model til route optimization. Tester den på en lokal transport virksomhed. 40% omkostningsreduktion.",
    icon: Zap,
    color: "cyan",
    achievement: "40% cost reduction på pilot",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=500&fit=crop"
  },
  {
    year: "2023",
    age: "18 år",
    title: "Natural Language Revolution",
    desc: "Udvikler FLEET AI's naturlige sprog-engine. Fleet operatører kan nu give kommandoer i dansk—systemet forstår kompleksitet.",
    icon: Sparkles,
    color: "fuchsia",
    achievement: "1000+ AI commands daily",
    image: "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=500&h=500&fit=crop"
  },
  {
    year: "2024",
    age: "19 år",
    title: "Global Scale",
    desc: "NexusVectis lauches globalt. 50+ lande. Digital twins for alle vehicles. Swarm intelligence orchestration.",
    icon: Globe,
    color: "emerald",
    achievement: "100M+ decisions daily",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
  },
  {
    year: "2025",
    age: "20 år",
    title: "Industry Leadership",
    desc: "Bliver den yngste CEO at revolutionere hele en industri. Fortune 500 virksomheder bruger NexusVectis som backbone.",
    icon: Zap,
    color: "amber",
    achievement: "10,000+ global users",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
  },
  {
    year: "2026",
    age: "21 år",
    title: "The Future is Now",
    desc: "Logistics på verdensplan bliver kørt af hans AI-platform. Hans vision—bygget fra scratch uden legacy baggage—er blevet realitet.",
    icon: Sparkles,
    color: "rose",
    achievement: "1M+ shipments optimized daily",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
  }
];

export default function CorneliusStory() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = storyStages[currentIndex];
  const Icon = current.icon;
  const colorMap = {
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30 text-fuchsia-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
  };

  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            The Story of <span className="text-cyan-400">Cornelio</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            From a teenager's vision to a global revolution. The journey of logistics reimagined.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image & Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <img
                src={current.image}
                alt={current.title}
                className="w-full h-96 rounded-3xl object-cover border border-white/10"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 rounded-b-3xl">
                <div className="text-5xl font-black text-white mb-2">{current.year}</div>
                <div className="text-lg text-cyan-400 font-semibold">Age {current.age}</div>
              </div>
            </motion.div>

            {/* Timeline Dots */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <div className="flex gap-2 flex-1 justify-center flex-wrap">
                {storyStages.map((stage, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "w-8 bg-cyan-400"
                        : "w-2 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentIndex(Math.min(storyStages.length - 1, currentIndex + 1))}
                disabled={currentIndex === storyStages.length - 1}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>

          {/* Story Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`p-10 rounded-3xl bg-gradient-to-br ${colorMap[current.color]} border`}>
                <div className="flex items-center gap-4 mb-6">
                  <Icon className={`w-12 h-12 ${current.color === 'violet' ? 'text-violet-400' : current.color === 'cyan' ? 'text-cyan-400' : current.color === 'fuchsia' ? 'text-fuchsia-400' : current.color === 'emerald' ? 'text-emerald-400' : current.color === 'amber' ? 'text-amber-400' : 'text-rose-400'}`} />
                  <div>
                    <h3 className="text-3xl font-bold text-white">{current.title}</h3>
                  </div>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed mb-8">
                  {current.desc}
                </p>

                <div className={`p-6 rounded-2xl bg-white/5 border border-white/10`}>
                  <div className="text-sm text-slate-400 mb-2">Key Achievement</div>
                  <div className={`text-2xl font-bold ${
                    current.color === 'violet' ? 'text-violet-400' : 
                    current.color === 'cyan' ? 'text-cyan-400' : 
                    current.color === 'fuchsia' ? 'text-fuchsia-400' : 
                    current.color === 'emerald' ? 'text-emerald-400' : 
                    current.color === 'amber' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {current.achievement}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">6 years</div>
                <div className="text-sm text-slate-400">From idea to global impact</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-4xl font-bold text-violet-400 mb-2">21</div>
                <div className="text-sm text-slate-400">Years old today</div>
              </div>
            </div>

            {/* Quote */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
              <p className="text-lg italic text-slate-300">
                "Age is not a limitation—it's an asset. I had no legacy thinking to unlearn. I could build the future because I wasn't constrained by the past."
              </p>
              <p className="text-sm text-cyan-400 font-semibold mt-4">— Cornelio</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}