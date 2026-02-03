import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Truck, Globe, Zap, Shield, TrendingUp, Satellite,
  BarChart3, MapPin, Radio, ArrowRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const features = [
    {
      icon: Globe,
      title: "Live Fleet Tracking",
      description: "Real-time monitoring of all vehicles with GPS, AIS, and ADS-B integration"
    },
    {
      icon: Zap,
      title: "AI-Powered Optimization",
      description: "Smart route planning and predictive maintenance to maximize efficiency"
    },
    {
      icon: Satellite,
      title: "Multi-Modal Transport",
      description: "Track trucks, ships, aircraft, trains, and drones from one platform"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with audit logging and role-based access control"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into fleet performance, fuel efficiency, and CO2 emissions"
    },
    {
      icon: Radio,
      title: "Global Coverage",
      description: "Worldwide tracking with multiple signal types and automatic failover"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "50ms", label: "Latency" },
    { value: "24/7", label: "Support" },
    { value: "Global", label: "Coverage" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/1c0bebde9_FullLogo_Transparent.png" 
            alt="NexusVectis Logo" 
            className="h-12 w-auto"
          />
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="text-white">
                Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 mb-8">
              <Satellite className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white">Next-Generation Fleet Intelligence</span>
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Track. Optimize. <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Transform Your Fleet
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most advanced multi-modal transport management platform. 
              Real-time tracking, AI-powered insights, and predictive analytics for modern logistics.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("MapMonitor")} target="_blank">
                <Button size="lg" variant="outline" className="text-white border-slate-700 hover:bg-slate-800 text-lg px-8">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Manage Your Fleet
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built for modern logistics operations with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="p-6 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative rounded-3xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 p-12 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Transform Your Logistics?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Join leading companies using NexusVectis to optimize their fleet operations
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={createPageUrl("Dashboard")}>
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2026 NexusVectis. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}