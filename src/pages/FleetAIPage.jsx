import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Sparkles, Brain, Zap, ArrowRight, CheckCircle2, MessageSquare, Globe, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";

export default function FleetAIPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to={createPageUrl("Home")}>
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

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <Sparkles className="w-20 h-20 text-cyan-400" />
            </motion.div>
            
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                FLEET AI
              </span>
            </h1>
            
            <p className="text-2xl text-slate-300 mb-12 leading-relaxed">
              Control your entire fleet through natural language. 
              No complex interfaces. No training required. Just ask.
            </p>

            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("IntellectMode"))}
              className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Try FLEET AI Now
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-cyan-950/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-white text-center mb-20">
            How <span className="text-cyan-400">FLEET AI</span> Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Speak Naturally",
                description: "Ask questions and give commands in plain language - just like talking to a colleague"
              },
              {
                icon: Brain,
                title: "AI Understands",
                description: "Advanced language models interpret your intent and access real-time fleet data"
              },
              {
                icon: Zap,
                title: "Instant Action",
                description: "Commands execute immediately - route optimization, assignments, analytics, and more"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <Icon className="w-12 h-12 text-cyan-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-white text-center mb-20">
            Command Examples
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              "Show me all delayed shipments",
              "Optimize routes for minimal CO2",
              "Which vehicles need maintenance this week?",
              "Assign closest truck to pickup in Copenhagen",
              "Generate cost analysis for last month",
              "What's the average fuel efficiency?"
            ].map((cmd, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/30 hover:border-cyan-500/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <p className="text-white font-medium">"{cmd}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Experience the future of fleet management
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-white text-slate-900 text-xl px-12 py-6 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
          >
            Get Started with FLEET AI
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}