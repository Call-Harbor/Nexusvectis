import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Newspaper, TrendingUp, Download, Calendar, ArrowRight, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function Newsroom() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);



  const milestones = [
    { month: "Jan 2026", title: "FLEET AI Engine v1", desc: "Launched core natural language interface with Mistral 7B fine-tuned on logistics data" },
    { month: "Feb 2026", title: "Real-time Fleet Tracking", desc: "Unified GPS, AIS, ADS-B integration deployed across all supported transport modes" },
    { month: "Feb 2026", title: "Predictive AI Suite Live", desc: "ETA prediction, maintenance forecasting, and demand forecasting deployed to production" },
    { month: "Mar 2026", title: "Advanced Command Orchestration", desc: "Multi-step command execution and parallel AI analysis engine launched" }
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-cyan-950/20" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <Newspaper className="w-20 h-20 text-blue-400" />
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Newsroom
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Latest news, press releases, and media resources from NexusVectis
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Press Releases</h2>
            <p className="text-xl text-slate-400">
              Press releases will be available as we hit major milestones and partnerships.
            </p>
          </motion.div>
        </div>
      </section>

{/* Media Kit */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <Download className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Media Kit</h2>
            </div>

            <p className="text-slate-300 mb-8 leading-relaxed">
              Download our press kit with logos, company information, and key facts about NexusVectis.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10">
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Download Logo Pack</span>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10">
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Company Fact Sheet</span>
              </button>
            </div>

            <p className="text-slate-400 text-sm mt-6">
              For media inquiries, please contact: <a href="mailto:press@nexusvectis.com" className="text-blue-400 hover:text-blue-300">press@nexusvectis.com</a>
            </p>
          </motion.div>
        </div>
      </section>


    </div>
  );
}