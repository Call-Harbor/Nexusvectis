import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { BarChart3, TrendingUp, PieChart, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to={createPageUrl("Landing")}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis" 
              className="h-20 w-auto"
            />
          </Link>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Get Started
          </button>
        </div>
      </header>

      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <BarChart3 className="w-20 h-20 text-violet-400 mx-auto mb-8" />
          <h1 className="text-7xl font-black text-white mb-8">
            Advanced <span className="text-violet-400">Analytics</span>
          </h1>
          <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Turn your fleet data into actionable insights. AI-powered analytics for smarter decisions.
          </p>
        </div>
      </section>

      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-violet-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: "Performance Metrics", desc: "KPIs, efficiency scores, benchmarks" },
              { icon: PieChart, title: "Cost Analysis", desc: "Fuel, maintenance, operational costs" },
              { icon: BarChart3, title: "Custom Reports", desc: "Build reports tailored to your needs" }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <Icon className="w-12 h-12 text-violet-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-12">
            Make Data-Driven Decisions
          </h2>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-white text-slate-900 text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
          >
            Explore Analytics
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}