import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, Calendar, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Blog() {
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-7xl font-black text-white mb-8">
              <span className="text-cyan-400">Blog</span>
            </h1>
            <p className="text-2xl text-slate-300">
              Insights, updates, and stories from the NexusVectis team
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Introducing FLEET AI", date: "Jan 15, 2026", excerpt: "Control your entire fleet through natural language..." },
              { title: "The Future of Logistics", date: "Jan 10, 2026", excerpt: "How AI is transforming supply chain management..." },
              { title: "Real-time Tracking at Scale", date: "Jan 5, 2026", excerpt: "Building infrastructure for global fleet visibility..." }
            ].map((post, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                <FileText className="w-12 h-12 text-cyan-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <p className="text-slate-400 mb-6">{post.excerpt}</p>
                <button className="text-cyan-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}