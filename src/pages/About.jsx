import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Target, Users, Sparkles, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function About() {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-7xl font-black text-white mb-8">
            About <span className="text-cyan-400">NexusVectis</span>
          </h1>
          <p className="text-2xl text-slate-300 leading-relaxed mb-12">
            We're building the future of logistics intelligence. Our mission is to empower every logistics operator with AI-powered tools that were previously only available to the largest corporations.
          </p>
        </div>
      </section>

      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-white text-center mb-20">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: "Innovation First", desc: "Pushing the boundaries of what's possible with AI" },
              { icon: Users, title: "Customer Obsessed", desc: "Your success is our success" },
              { icon: Target, title: "Simplicity", desc: "Complex technology, simple experience" }
            ].map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <Icon className="w-12 h-12 text-cyan-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                  <p className="text-slate-400">{value.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Join Us</h2>
          <p className="text-xl text-slate-400 mb-12">
            We're always looking for talented people to join our mission
          </p>
          <Link to={createPageUrl("Careers")}>
            <button className="bg-white text-slate-900 text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3">
              View Open Positions
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}