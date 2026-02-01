import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, 
  Sparkles, 
  TrendingUp, 
  Shield, 
  Zap, 
  Truck,
  Satellite,
  BarChart3,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const features = [
    {
      icon: Satellite,
      title: "Real-Time Tracking",
      description: "Monitor your entire fleet with live GPS tracking and AIS/ADS-B integration across all transport modes"
    },
    {
      icon: Sparkles,
      title: "AI Optimization",
      description: "Predictive maintenance, dynamic routing, and automated exception handling powered by advanced AI"
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Comprehensive insights into fleet performance, efficiency scores, and CO2 emissions tracking"
    },
    {
      icon: Shield,
      title: "Exception Management",
      description: "Automatic detection and resolution of delays, shortages, and route disruptions in real-time"
    },
    {
      icon: Zap,
      title: "Cold Chain Monitoring",
      description: "Real-time temperature and humidity tracking for sensitive cargo with instant alerts"
    },
    {
      icon: BarChart3,
      title: "Performance Insights",
      description: "Detailed reports on fuel consumption, route optimization, and operational efficiency"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "50+", label: "Countries" },
    { value: "10K+", label: "Vehicles Tracked" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-xl">NexusVectis</span>
            </div>
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90">
                Launch Dashboard
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">AI-Powered Logistics Platform</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            The Future of
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Global Logistics
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Real-time tracking, predictive AI, and automated management for your entire fleet. 
            Ships, trucks, drones, aircraft — all unified in one intelligent platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 text-lg px-8 py-6">
                Get Started
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("Fleet")}>
              <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm text-center"
            >
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-slate-400">
            Powerful features built for modern logistics operations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm hover:border-cyan-500/30 transition-all group"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 w-fit mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-center"
        >
          <Truck className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Logistics?
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of companies using NexusVectis to optimize their global supply chain operations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 text-lg px-8 py-6">
                Start Free Trial
                <CheckCircle className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to={createPageUrl("GPSIntegration")}>
              <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6">
                Setup GPS Integration
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="font-bold text-white">NexusVectis</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 NexusVectis. AI-Powered Logistics Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}