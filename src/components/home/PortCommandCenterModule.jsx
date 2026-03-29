import { motion } from "framer-motion";
import { Satellite, Truck, BarChart3, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function PortCommandCenterModule() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-violet-500/10 border border-blue-500/30 p-12 md:p-20 overflow-hidden"
        >
          <div className="absolute inset-0">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
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
                <Satellite className="w-16 h-16 text-blue-400" />
              </motion.div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight px-2">
                Port <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Command Center</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto px-2">
                Advanced maritime logistics with real-time vessel tracking, berth optimization, crane scheduling and port operations management
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Truck, title: "Vessel Management", desc: "Real-time tracking and vessel queue optimization" },
                { icon: BarChart3, title: "Berth Planning", desc: "AI-powered berth assignment and docking schedules" },
                { icon: TrendingUp, title: "Productivity", desc: "Crane scheduling and cargo handling optimization" }
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
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-400" />
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
                <span className="inline-block text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">€2,000/month</span>
              </motion.div>
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("OrganizationSetup"))}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Activate Port Command Center
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}