import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Careers() {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <section className="relative pt-32 pb-32 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-black text-white mb-8">
            Join Our <span className="text-cyan-400">Team</span>
          </h1>
          <p className="text-2xl text-slate-300 leading-relaxed">
            Help us build the future of logistics intelligence. We're looking for passionate individuals who want to make an impact.
          </p>
        </div>
      </section>

      <section className="relative py-32 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12">Open Positions</h2>
          
          {[
            { title: "Senior AI Engineer", location: "Copenhagen / Remote", type: "Full-time" },
            { title: "Product Designer", location: "Copenhagen", type: "Full-time" },
            { title: "Customer Success Manager", location: "Remote", type: "Full-time" }
          ].map((job, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="mb-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{job.title}</h3>
                  <div className="flex items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </div>
                  </div>
                </div>
                <button className="bg-cyan-500 text-white px-6 py-3 rounded-xl hover:bg-cyan-600 transition-colors flex items-center gap-2">
                  Apply
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}