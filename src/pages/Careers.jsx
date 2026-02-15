import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Briefcase, MapPin, Clock, ArrowRight, Rocket, Users, Zap, Globe, Heart, TrendingUp, Code, Brain } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Careers() {
  const jobs = [
    { 
      title: "Senior AI/ML Engineer", 
      location: "Copenhagen / Remote", 
      type: "Full-time",
      department: "Engineering",
      description: "Build and optimize AI models for FLEET AI natural language processing and predictive analytics"
    },
    { 
      title: "Senior Backend Engineer", 
      location: "Copenhagen / Remote", 
      type: "Full-time",
      department: "Engineering",
      description: "Design scalable systems handling millions of real-time vehicle position updates"
    },
    { 
      title: "Product Designer", 
      location: "Copenhagen", 
      type: "Full-time",
      department: "Design",
      description: "Create intuitive interfaces that simplify complex logistics operations"
    },
    { 
      title: "DevOps Engineer", 
      location: "Remote", 
      type: "Full-time",
      department: "Engineering",
      description: "Maintain 99.9% uptime infrastructure and optimize deployment pipelines"
    },
    { 
      title: "Customer Success Manager", 
      location: "Remote", 
      type: "Full-time",
      department: "Customer Success",
      description: "Help logistics operators maximize value from our AI-powered platform"
    },
    { 
      title: "Solutions Architect", 
      location: "Copenhagen / Remote", 
      type: "Full-time",
      department: "Enterprise",
      description: "Design custom integrations and implementations for enterprise clients"
    },
    { 
      title: "Data Scientist", 
      location: "Remote", 
      type: "Full-time",
      department: "Data",
      description: "Develop predictive models for demand forecasting and route optimization"
    },
    { 
      title: "Technical Writer", 
      location: "Remote", 
      type: "Contract",
      department: "Product",
      description: "Create comprehensive documentation and guides for developers and operators"
    }
  ];

  const perks = [
    { icon: Rocket, title: "Equity Options", desc: "Own part of the future" },
    { icon: Globe, title: "Remote-First", desc: "Work from anywhere" },
    { icon: Heart, title: "Healthcare", desc: "Premium coverage" },
    { icon: TrendingUp, title: "Learning Budget", desc: "€5,000/year for growth" },
    { icon: Zap, title: "Latest Tech", desc: "Top-tier equipment" },
    { icon: Users, title: "Team Events", desc: "Quarterly offsites" }
  ];

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

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Link to={createPageUrl("Landing")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-24 w-auto mx-auto opacity-90"
              />
            </Link>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8">
              Build the Future of <br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Logistics AI
              </span>
            </h1>
            <p className="text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Join a team of operators, engineers, and AI researchers revolutionizing supply chain intelligence
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Why <span className="text-cyan-400">NexusVectis</span>?
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Work on cutting-edge AI that impacts real businesses every day
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Bleeding-Edge AI", desc: "Work with GPT-4, Claude, and custom ML models. Ship production AI features weekly." },
              { icon: Rocket, title: "Massive Impact", desc: "Your code optimizes millions of shipments. See your work change real operations." },
              { icon: Code, title: "Modern Stack", desc: "React, TypeScript, Python, Deno. Best tools, no legacy debt." },
              { icon: Globe, title: "Global Scale", desc: "Build for 50+ countries. Handle billions of data points. Real distributed systems." },
              { icon: Users, title: "Smart Team", desc: "Work with PhDs, ex-FAANG engineers, and logistics veterans." },
              { icon: Zap, title: "Move Fast", desc: "Weekly deploys. No bureaucracy. Ideas to production in days, not months." }
            ].map((why, idx) => {
              const Icon = why.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  <Icon className="w-12 h-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">{why.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{why.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Perks & <span className="text-cyan-400">Benefits</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
                >
                  <Icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2">{perk.title}</h4>
                  <p className="text-slate-400 text-sm">{perk.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Open <span className="text-cyan-400">Positions</span>
            </h2>
            <p className="text-xl text-slate-400">
              {jobs.length} openings across Engineering, Product, and Customer Success
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {jobs.map((job, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-slate-400 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </div>
                          <div className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm">
                            {job.department}
                          </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{job.description}</p>
                      </div>
                    </div>
                  </div>
                  <button className="bg-cyan-500 text-white px-8 py-4 rounded-xl hover:bg-cyan-600 transition-colors flex items-center gap-2 group-hover:scale-105 transition-transform">
                    Apply Now
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-slate-400 text-lg mb-6">
              Don't see the right role? We're always interested in exceptional talent.
            </p>
            <button className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
              Send us your CV anyway →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <Link to={createPageUrl("Landing")}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
              alt="NexusVectis" 
              className="h-24 w-auto mx-auto mb-6 opacity-70"
            />
          </Link>
          <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis ApS. Building the future of logistics.</p>
        </div>
      </footer>
    </div>
  );
}