import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import TransitControlModule from "../components/home/TransitControlModule";
import PortCommandCenterModule from "../components/home/PortCommandCenterModule";
import AirportOpsCenterModule from "../components/home/AirportOpsCenterModule";
import RegulatoryIntellectModule from "../components/home/RegulatoryIntellectModule";
import { 
  Truck, Globe, Zap, Shield, TrendingUp, Satellite,
  BarChart3, MapPin, Radio, ArrowRight, CheckCircle2, Sparkles, Brain, Orbit, Package,
  Network, Cpu, Wifi, GitBranch, Dna, Bug, AlertCircle, Warehouse, Plane, Scale
 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// --- A/B Test Helpers ---
function getOrCreateAnonymousId() {
  const key = 'nv_anon_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

function pickVariant(variants, variantType) {
  if (!variants || variants.length === 0) return null;
  const storedKey = `nv_ab_${variantType}`;
  const stored = localStorage.getItem(storedKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  const index = Math.floor(Math.random() * variants.length);
  const chosen = { index, value: variants[index] };
  localStorage.setItem(storedKey, JSON.stringify(chosen));
  return chosen;
}

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const abTracked = useRef(false);

  // Fetch latest SEOMetrics for A/B variants
  const { data: seoMetricsList = [] } = useQuery({
    queryKey: ['latestSEOMetrics'],
    queryFn: () => base44.entities.SEOMetrics.list('-created_date', 1),
    staleTime: 1000 * 60 * 30,
  });
  const latestSEO = seoMetricsList[0] || null;

  // Live AI-generated blog posts from SEO engine - always fetch latest
  const { data: aiBlogPosts = [] } = useQuery({
    queryKey: ['homeBlogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-published_at', 3),
    staleTime: 1000 * 60 * 5, // Refresh every 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const [abVariants, setAbVariants] = useState({});

  // Run A/B test impression tracking once SEOMetrics are loaded
  useEffect(() => {
    if (!latestSEO || abTracked.current) return;
    abTracked.current = true;

    const anonymousId = getOrCreateAnonymousId();
    const variantsToTest = [
      { type: 'title', variants: latestSEO.title_tag_variants },
      { type: 'meta_description', variants: latestSEO.meta_description_variants },
      { type: 'hero_headline', variants: latestSEO.hero_headline_variants },
      { type: 'hero_subline', variants: latestSEO.hero_subline_variants },
      { type: 'cta_text', variants: latestSEO.cta_text_variants },
    ];

    const chosen = {};
    variantsToTest.forEach(({ type, variants }) => {
      if (!variants || variants.length === 0) return;
      const pick = pickVariant(variants, type);
      if (!pick) return;
      chosen[type] = pick.value;

      // Apply head tags
      if (type === 'title') {
        document.title = pick.value;
      } else if (type === 'meta_description') {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', pick.value);
      }

      // Record impression (fire-and-forget)
      base44.functions.invoke('abTestTracker', {
        action: 'record_impression',
        anonymous_id: anonymousId,
        variant_type: type,
        variant_index: pick.index,
        variant_value: pick.value,
        seo_metrics_id: latestSEO.id,
      }).catch(() => {});
    });

    setAbVariants(chosen);
  }, [latestSEO]);

  // When user logs in / registers, record conversion
  useEffect(() => {
    const checkConversion = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const anonymousId = localStorage.getItem('nv_anon_id');
        if (!anonymousId) return;
        const conversionKey = `nv_converted_${user.email}`;
        if (localStorage.getItem(conversionKey)) return; // already recorded
        await base44.functions.invoke('abTestTracker', {
          action: 'record_conversion',
          anonymous_id: anonymousId,
          user_email: user.email,
        });
        localStorage.setItem(conversionKey, '1');
      } catch (_) {}
    };
    checkConversion();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const features = [
    {
      icon: Globe,
      title: "Transit Control",
      description: "Real-time monitoring of public transit networks, buses, passenger flow and network optimization with AI",
      link: "TransitControl"
    },
    {
      icon: Truck,
      title: "Port Command Center",
      description: "Advanced port operations dashboard with vessel tracking, berth planning, crane scheduling and sustainability insights",
      link: "PortCommandCenter"
    },
    {
      icon: Plane,
      title: "Airport Operations Center",
      description: "Comprehensive airport management with flight tracking, baggage handling, security monitoring and ground handling coordination",
      link: "AirportOpsCenter"
    },
    {
      icon: Globe,
      title: "Live Fleet Monitoring",
      description: "Real-time tracking of vehicles, ships and aircraft with GPS, AIS and ADS-B integration"
    },
    {
      icon: Sparkles,
      title: "FLEET AI Mode",
      description: "AI-powered command system for natural language fleet control and operations"
    },
    {
      icon: Zap,
      title: "Parallel Task Execution",
      description: "Run 50+ parallel AI analyses simultaneously - complete complex operations in seconds without waiting"
    },
    {
      icon: TrendingUp,
      title: "Demand Forecasting",
      description: "Predict transport demand and optimize resource allocation with machine learning"
    },
    {
      icon: BarChart3,
      title: "Fleet Analytics",
      description: "Advanced KPI dashboards with fuel consumption, CO₂ emissions and performance metrics"
    },
    {
      icon: Satellite,
      title: "Warehouse Automation",
      description: "AI-driven warehouse optimization, picking automation and inventory forecasting"
    },
    {
      icon: Brain,
      title: "Predictive Maintenance",
      description: "Predict maintenance needs and reduce downtime with AI anomaly detection"
    },
    {
      icon: MapPin,
      title: "Green TMS",
      description: "Sustainability tracking, carbon footprint analysis and green transport planning"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Audit logging, API access control and compliance management"
    }
  ];

  const stats = [
    { value: "AI", label: "Powered" },
    { value: "Real-time", label: "Tracking" },
    { value: "Multi-modal", label: "Transport" },
    { value: "Global", label: "Coverage" }
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        
        {/* Floating Orbs */}
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Mouse Follow Glow */}
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <motion.img 
            whileHover={{ scale: 1.05 }}
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
            alt="NexusVectis Logo" 
            className="h-12 sm:h-20 w-auto"
          />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to={createPageUrl("HarborInfo")}
              className="hidden sm:flex items-center gap-1.5 text-amber-300 hover:text-amber-200 px-3 py-2 rounded-lg transition-colors text-sm font-semibold border border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-500/10"
            >
              <Zap className="w-3.5 h-3.5" />
              H.A.R.B.O.R.
            </Link>
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Log In
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 sm:px-6 py-2 rounded-lg transition-transform hover:scale-105 flex items-center gap-2 text-sm sm:text-base"
            >
              Get Started
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 backdrop-blur-xl mb-8 shadow-lg shadow-cyan-500/10"
            >
              <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-sm text-white font-medium">Next-Generation Fleet Intelligence Platform</span>
              <Sparkles className="w-4 h-4 text-violet-400" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight"
            >
              {abVariants.hero_headline ? (
                abVariants.hero_headline
              ) : (
                <>
                  AI-Powered Fleet Management
                  <br />
                  <span className="relative inline-block mt-2">
                    <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient">
                      & Logistics Intelligence
                    </span>
                  </span>
                </>
              )}
              {abVariants.hero_headline && (
                <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent" />
              )}
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-2xl -z-10"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2"
            >
              {abVariants.hero_subline
                ? abVariants.hero_subline
                : <>NexusVectis is the next-generation <strong className="text-white font-semibold">fleet management and logistics platform</strong> powered by AI. Control your entire fleet, optimize routes, predict maintenance, and automate your supply chain through natural language with <span className="text-cyan-400 font-semibold">FLEET AI</span> — no complex interfaces required.</>
              }
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 text-white text-lg px-10 py-6 rounded-2xl font-semibold group transition-transform hover:scale-105 flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {abVariants.cta_text || 'Try FLEET AI'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-5xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                  <div className="relative">
                    <div className="text-5xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-3">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FLEET AI Showcase */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-12 md:p-20 overflow-hidden"
          >
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-cyan-400" />
                </motion.div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight px-2">
                      Meet <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">FLEET AI</span>
                    </h2>
                    <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed px-2">
                  Your intelligent co-pilot for fleet operations. Control everything with natural language commands.
                  <br />
                  <span className="text-cyan-400">No complex interfaces. No training required. Just ask.</span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 mt-16">
                {[
                  {
                    icon: Brain,
                    title: "Natural Language Control",
                    description: "\"Route vehicle 47 to Copenhagen warehouse\" - FLEET AI understands and executes instantly",
                    color: "cyan"
                  },
                  {
                    icon: Zap,
                    title: "Parallel Multi-Analysis",
                    description: "\"Analyze entire fleet\" - Run 10+ tasks with 50+ parallel AI analyses simultaneously for complete insights in seconds",
                    color: "violet"
                  },
                  {
                    icon: TrendingUp,
                    title: "Real-Time Intelligence",
                    description: "\"Show maintenance predictions\" - AI forecasts issues before they happen with live data",
                    color: "fuchsia"
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 group"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: idx * 0.5 }}
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-500/5 flex items-center justify-center mb-6 shadow-xl shadow-${item.color}-500/20`}
                      >
                        <Icon className={`w-10 h-10 text-${item.color}-400`} />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-slate-400 leading-relaxed text-lg italic">"{item.description}"</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Orbit className="w-12 h-12 text-cyan-400" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Complete Fleet Intelligence
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Powered by Advanced AI
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
              Beyond FLEET AI - a comprehensive platform with every tool you need for modern logistics
            </p>
            </motion.div>
            </div>
            </section>

            {/* Module Sections */}
            <TransitControlModule />
            <PortCommandCenterModule />
            <AirportOpsCenterModule />

            <RegulatoryIntellectModule />

            {/* Pricing Section */}
            <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-20"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-300 text-sm font-semibold">Usage-Based Pricing</span>
                  </div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
                    Pay Only for What You Use
                    <br />
                    <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                      Transparent Pricing
                    </span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto px-2">
                    Simple, resource-based billing with no hidden fees. Scale up or down at any time.
                  </p>
                </motion.div>

                {/* Regulatory Intellect add-on callout */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/5 border border-violet-500/25 flex flex-col md:flex-row items-center gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">Regulatory Intellect Layer</span>
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-semibold">ADD-ON</span>
                    </div>
                    <p className="text-slate-400 text-sm">Neural compliance engine across all modules — EU road, port, airport, transit, CO₂/ESG. Live rule checks, AI explanations, and auto-repair. Sold as a rule-pack bundle per region/domain.</p>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-2xl font-black text-violet-400">Contact us</div>
                    <div className="text-slate-500 text-xs">Custom pricing</div>
                  </div>
                </motion.div>

                {/* Core Usage Pricing */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-16 rounded-[2.5rem] bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 overflow-hidden"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                        <Package className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Core Platform — Usage-Based</h3>
                        <p className="text-slate-400 text-sm">Billed monthly based on your actual resource usage</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          icon: Truck,
                          label: "Vehicles",
                          price: "€15",
                          unit: "/ vehicle / month",
                          desc: "Each tracked vehicle — trucks, ships, drones, trains, aircraft. Includes GPS, AIS, ADS-B tracking, telemetry, and digital twin.",
                          color: "cyan",
                          examples: ["Cargo truck", "Container ship", "Cargo drone", "Freight aircraft"]
                        },
                        {
                          icon: Warehouse,
                          label: "Resources",
                          price: "€40",
                          unit: "/ resource / month",
                          desc: "Logistics infrastructure — warehouses, fuel depots, ports, charging stations, maintenance hubs.",
                          color: "violet",
                          examples: ["Warehouse", "Fuel depot", "Port terminal", "Charging station"]
                        },
                        {
                          icon: Brain,
                          label: "FLEET AI Commands",
                          price: "€5",
                          unit: "/ 100 commands",
                          desc: "Natural language AI commands via IntellectMode. Each command triggers analysis, routing, or automation.",
                          color: "fuchsia",
                          examples: ["Optimize route", "Predict maintenance", "Analyze fleet", "Reroute vehicle"]
                        },
                        {
                          icon: Network,
                          label: "REST API Calls",
                          price: "€5",
                          unit: "/ 100 API calls",
                          desc: "Direct API integration for external systems, TMS connectors, ERP sync, and custom automations.",
                          color: "emerald",
                          examples: ["GET /vehicles", "POST /routes", "PUT /shipments", "Webhooks"]
                        },
                        {
                          icon: Satellite,
                          label: "Harbor Intelligence API",
                          price: "€0.25",
                          unit: "/ call",
                          desc: "Premium AI inference via H.A.R.B.O.R. — advanced analytics, predictive models, and deep intelligence queries.",
                          color: "amber",
                          badge: "PREMIUM",
                          examples: ["Anomaly detection", "Predictive ETA", "Risk scoring", "Swarm control"]
                        },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-6 rounded-2xl bg-${item.color}-500/5 border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-all group`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/15 border border-${item.color}-500/25 flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 text-${item.color}-400`} />
                              </div>
                              {item.badge && (
                                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">{item.badge}</span>
                              )}
                            </div>
                            <div className="mb-3">
                              <div className={`text-2xl font-black text-${item.color}-400`}>{item.price}</div>
                              <div className="text-slate-500 text-xs">{item.unit}</div>
                            </div>
                            <p className="text-white font-semibold text-sm mb-2">{item.label}</p>
                            <p className="text-slate-400 text-xs leading-relaxed mb-4">{item.desc}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.examples.map((ex, i) => (
                                <span key={i} className={`text-[10px] bg-${item.color}-500/10 text-${item.color}-300/70 border border-${item.color}-500/15 px-2 py-0.5 rounded-full`}>{ex}</span>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Premium Add-on Modules */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-violet-300 text-sm font-semibold">Premium Operations Modules</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      {
                        icon: Plane,
                        title: "Airport Ops Center",
                        price: "€2,000",
                        unit: "/month",
                        color: "from-cyan-500 to-blue-500",
                        borderColor: "border-cyan-500/30",
                        glowColor: "cyan",
                        includes: [
                          "Flight tracking & gate allocation",
                          "Baggage handling & tracking",
                          "Security lane monitoring",
                          "Ground handling coordination",
                          "Passenger flow AI",
                          "Turnaround management",
                          "AI operational advisor",
                          "Airport sustainability reports"
                        ]
                      },
                      {
                        icon: Satellite,
                        title: "Port Command Center",
                        price: "€2,000",
                        unit: "/month",
                        color: "from-blue-500 to-violet-500",
                        borderColor: "border-violet-500/30",
                        glowColor: "violet",
                        includes: [
                          "Vessel queue & berth planning",
                          "Crane scheduling AI",
                          "Container yard tracking",
                          "Port gate management",
                          "Rail slot coordination",
                          "Live AIS vessel data",
                          "Port AI advisor",
                          "CO₂ & sustainability metrics"
                        ]
                      },
                      {
                        icon: Orbit,
                        title: "Transit Control",
                        price: "€2,000",
                        unit: "/month",
                        color: "from-emerald-500 to-cyan-500",
                        borderColor: "border-emerald-500/30",
                        glowColor: "emerald",
                        includes: [
                          "Bus fleet & line management",
                          "Real-time passenger analytics",
                          "Crowding prediction AI",
                          "Demand-responsive transit (DRT)",
                          "Network optimization engine",
                          "Traffic signal priority (TSP)",
                          "Driver app & copilot",
                          "Transit sustainability dashboard"
                        ]
                      }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          className={`relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border ${item.borderColor} hover:shadow-lg hover:shadow-${item.glowColor}-500/10 transition-all`}
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} bg-opacity-20 flex items-center justify-center`} style={{background: 'rgba(255,255,255,0.05)'}}>
                              <Icon className={`w-6 h-6 text-${item.glowColor}-400`} />
                            </div>
                            <div className="text-right">
                              <div className={`text-3xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                                {item.price}
                              </div>
                              <div className="text-xs text-slate-500">{item.unit}</div>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-5">{item.title}</h3>
                          <ul className="space-y-2.5">
                            {item.includes.map((inc, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <CheckCircle2 className={`w-4 h-4 text-${item.glowColor}-400 flex-shrink-0 mt-0.5`} />
                                <span className="text-slate-300 text-sm">{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <p className="text-slate-400 mb-6">Activate premium modules to unlock advanced operations. Cancel anytime after the first 48 hours.</p>
                  <button
                    onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                    className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-lg px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                  >
                    Get Started
                  </button>
                </motion.div>
              </div>
            </section>

      {/* Digital Twin Federation Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Orbit className="w-12 h-12 text-rose-400" />
            </motion.div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold">Advanced Security</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Digital Twin
              <br />
              <span className="bg-gradient-to-r from-rose-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Federation
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-2">
              Run virtual doubles of your entire fleet in parallel with real-time data. Detect anomalies, attacks, and failures before they impact operations.
            </p>
          </motion.div>

          {/* Twin Architecture Overview */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-3xl bg-gradient-to-br from-rose-500/10 to-pink-500/5 border border-rose-500/30 overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-8 -right-8 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-4">Real vs. Simulated</h3>
                <ul className="space-y-4">
                  {[
                    "Live vehicle GPS position",
                    "Predicted route trajectory",
                    "Real sensor telemetry",
                    "Simulated physical model",
                    "Expected vs. actual fuel",
                    "Divergence detection"
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-cyan-400" />
                      <span className="text-slate-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/5 border border-cyan-500/30 overflow-hidden"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"
              />
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-4">Anomaly Detection</h3>
                <ul className="space-y-4">
                  {[
                    "Position divergence > 10km",
                    "Impossible speed patterns",
                    "Replay attack signatures",
                    "Sensor data tampering",
                    "Unauthorized rerouting",
                    "Real-time alerts"
                  ].map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-gradient-to-br from-slate-900/70 to-slate-950/70 border border-slate-700/50 p-10 md:p-14 mb-16 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white text-center mb-10">How Digital Twin Federation Works</h3>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Truck,
                    step: "1",
                    title: "Ingest",
                    description: "Collect real-time data from vehicles, shipments, and resources via GPS, AIS, ADS-B"
                  },
                  {
                    icon: Cpu,
                    step: "2",
                    title: "Simulate",
                    description: "Run physics-based models predicting expected position, fuel, temperature"
                  },
                  {
                    icon: TrendingUp,
                    step: "3",
                    title: "Compare",
                    description: "Calculate divergence between real state and simulated expectation"
                  },
                  {
                    icon: AlertCircle,
                    step: "4",
                    title: "Alert",
                    description: "Trigger security alerts and feed insights to Immunity & Swarm engines"
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 }}
                      className="relative"
                    >
                      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-violet-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                            <span className="text-violet-400 font-bold text-sm">{item.step}</span>
                          </div>
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                      </div>
                      {idx < 3 && (
                        <motion.div
                          animate={{ x: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="hidden md:block absolute top-1/2 -right-8 text-violet-500/40"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Cyber Attack Prevention",
                icon: Shield,
                color: "rose",
                description: "Detect GPS spoofing, data injection, and MITM attacks instantly through divergence analysis"
              },
              {
                title: "Theft Prevention",
                icon: Package,
                color: "cyan",
                description: "Identify unauthorized rerouting and physical asset displacement in real-time"
              },
              {
                title: "Quality Assurance",
                icon: CheckCircle2,
                color: "violet",
                description: "Monitor cold chain compliance, cargo integrity, and safe delivery conditions"
              }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative p-8 rounded-3xl bg-gradient-to-br from-${benefit.color}-500/10 to-${benefit.color}-500/5 border border-${benefit.color}-500/30 overflow-hidden group`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 0.8 }}
                    className={`absolute -top-8 -right-8 w-32 h-32 bg-${benefit.color}-500/20 rounded-full blur-2xl`}
                  />
                  <div className={`w-14 h-14 rounded-2xl bg-${benefit.color}-500/20 border border-${benefit.color}-500/30 flex items-center justify-center mb-5`}>
                    <Icon className={`w-7 h-7 text-${benefit.color}-400`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 px-2">
              Insights &
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Industry Knowledge
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              Expert guides on fleet management, AI logistics, route optimization and supply chain automation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {(aiBlogPosts.length > 0 ? aiBlogPosts : [
              {
                category: "AI Fleet Management",
                title: "How AI Route Optimization Reduces Fuel Costs by 35%",
                excerpt: "Discover how modern fleet management platforms use machine learning to optimize delivery routes, minimize fuel consumption, and cut CO₂ emissions in real-time.",
                read_time_minutes: 5,
                published_at: "2026-03-14",
              },
              {
                category: "Predictive Maintenance",
                title: "Predictive vs. Preventive Maintenance: Which Saves More?",
                excerpt: "An in-depth comparison of predictive maintenance powered by AI anomaly detection vs. traditional scheduled maintenance — with real ROI data from logistics fleets.",
                read_time_minutes: 7,
                published_at: "2026-03-09",
              },
              {
                category: "Supply Chain",
                title: "Real-Time Shipment Tracking: The Complete Guide for 2026",
                excerpt: "Everything you need to know about GPS, AIS, and ADS-B tracking technology for multimodal fleets — trucks, ships, drones and aircraft — in one unified platform.",
                read_time_minutes: 6,
                published_at: "2026-03-03",
              }
            ]).map((post, idx) => {
              const colors = ["cyan", "violet", "fuchsia"];
              const color = colors[idx % colors.length];
              return (
              <motion.div
                key={post.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="group cursor-pointer"
              >
                <Link to={post.id ? `/BlogPostDetail?id=${post.id}` : "/Blog"} className="block h-full">
                  <div className={`p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-${color}-500/40 transition-all h-full flex flex-col`}>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className={`inline-block text-xs font-bold text-${color}-400 bg-${color}-500/10 border border-${color}-500/20 px-3 py-1 rounded-full uppercase tracking-wider`}>
                        {post.category || 'Fleet Intelligence'}
                      </span>
                      {post.ai_generated && (
                        <span className="text-[10px] text-cyan-400/70 border border-cyan-500/20 px-2 py-0.5 rounded-full bg-cyan-500/5">
                          ✦ AI Generated
                        </span>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold text-white mb-3 leading-snug group-hover:text-${color}-400 transition-colors flex-1`}>
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-4">
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      <span className={`text-${color}-400 font-medium flex items-center gap-1`}>
                        {post.read_time_minutes} min read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              to="/Blog"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 px-6 py-3 rounded-xl transition-all hover:bg-cyan-500/5"
            >
              View all articles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 md:p-20 overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0">
              <motion.div
                className="absolute top-0 left-0 w-full h-full"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                style={{
                  backgroundImage: "radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)",
                  backgroundSize: "200% 200%",
                }}
              />
            </div>
            
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight px-2">
                Command Your Fleet
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  With AI Intelligence
                </span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 sm:mb-12 font-light px-2">
                Experience the power of FLEET AI - natural language fleet control
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold group transition-transform hover:scale-105 flex items-center gap-3"
                >
                  <Sparkles className="w-6 h-6 text-cyan-500" />
                  Start with FLEET AI
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-10 text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>AI-Powered Commands</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Natural Language Control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Real-Time Intelligence</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <motion.img 
                whileHover={{ scale: 1.05 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-32 w-auto mb-6 opacity-90"
              />
              <p className="text-slate-400 max-w-md leading-relaxed">
                Next-generation fleet intelligence platform powered by AI. 
                Control your entire logistics operation through natural language.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-cyan-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-cyan-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-cyan-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-cyan-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-8"
          />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Shaping the future of logistics intelligence.</p>
            <div className="flex gap-6 text-slate-400 text-sm">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-cyan-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}