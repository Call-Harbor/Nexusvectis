import { motion } from "framer-motion";
import { Orbit, TrendingUp, Zap, Satellite } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function TransitControlModule() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/30 p-12 md:p-20 overflow-hidden"
        >
          <div className="absolute inset-0">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
            />
          </div>
          <div className="relative z-10">
            <div className="text-center mb-16">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-6"
              >
                <Orbit className="w-16 h-16 text-emerald-400" />
              </motion.div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight px-2">
                Transit <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Control</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto px-2">
                Real-time monitoring and optimization of public transit networks with AI-powered passenger flow prediction and sustainability tracking
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: TrendingUp, title: "Passenger Analytics", desc: "Real-time crowding prediction and demand forecasting" },
                { icon: Zap, title: "Network Optimization", desc: "Dynamic routing and frequency optimization for peak efficiency" },
                { icon: Satellite, title: "Sustainability", desc: "CO₂ tracking and green transport planning" }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <span className="inline-block text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">€2,000/month</span>
              </motion.div>
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("OrganizationSetup"))}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
              >
                Activate Transit Control
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}