import { motion } from "framer-motion";
import { Orbit, TrendingUp, Zap, Satellite, Check, ArrowRight, MapPin, Users, Leaf } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function TransitControlModule() {
  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 4,
  }));

  return (
    <section className="relative py-32 sm:py-48 px-4 sm:px-6 z-10 overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingElements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30"
            style={{ left: `${el.left}%`, top: "-20px" }}
            animate={{ y: [0, window.innerHeight + 40], opacity: [0, 0.5, 0] }}
            transition={{ duration: el.duration, delay: el.delay, repeat: Infinity }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[4rem] bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-blue-500/5 border border-emerald-500/40 overflow-hidden backdrop-blur-xl"
        >
          {/* Animated gradient orbs */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
                x: [0, 100, 0],
              }}
              transition={{ duration: 12, repeat: Infinity }}
              className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.3, 1, 1.3],
                opacity: [0.3, 0.5, 0.3],
                x: [0, -80, 0],
              }}
              transition={{ duration: 14, repeat: Infinity, delay: 2 }}
              className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-cyan-500 to-emerald-500 rounded-full blur-3xl"
            />
          </div>

          <div className="relative px-8 md:px-16 py-16 md:py-24">
            {/* Animated icon */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 20, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-400 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                <Orbit className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
                Transit
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent animate-pulse">
                  Control
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-200 max-w-2xl mb-12 leading-relaxed font-light">
                Transform public transit with real-time passenger analytics, AI-powered demand prediction, and autonomous network optimization
              </p>
            </motion.div>

            {/* Features grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { icon: MapPin, label: "30% Route Efficiency", stat: "Gains" },
                { icon: Users, label: "100% Crowding Accuracy", stat: "Prediction" },
                { icon: Leaf, label: "45% CO₂ Reduction", stat: "Target" },
                { icon: TrendingUp, label: "Real-time Network Optimization", stat: "24/7" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-emerald-400/50 transition-all group cursor-pointer overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                      transition={{ duration: 10, repeat: Infinity }}
                    />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-emerald-200 font-bold text-lg">{item.label}</p>
                        <p className="text-slate-400 text-sm">{item.stat}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Price and CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-8 justify-between bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-3xl p-8 md:p-10"
            >
              <div>
                <p className="text-slate-400 text-sm mb-2">Complete Transit Platform</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    €2,000
                  </span>
                  <span className="text-slate-400 text-lg">/month</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => base44.auth.redirectToLogin(createPageUrl("OrganizationSetup"))}
                className="relative px-10 py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all group flex items-center gap-3 whitespace-nowrap"
              >
                <span>Activate Now</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-white/10"
            >
              {[
                "AI-Powered",
                "Real-time Data",
                "Predictive Analytics",
                "Scalable",
              ].map((badge, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2 text-sm text-emerald-300"
                >
                  <Check className="w-4 h-4" />
                  {badge}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}