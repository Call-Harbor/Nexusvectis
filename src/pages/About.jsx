import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Globe, Sparkles, Zap, Shield, TrendingUp, Brain, Cpu,
  ArrowRight, CheckCircle2, Orbit, Network, Wifi, Bug, Dna, Package,
  GitBranch, AlertCircle, Truck, BarChart3, MapPin, Radio
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function About() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const coreArchitectures = [
    {
      icon: Sparkles,
      title: "FLEET AI Engine",
      description: "Natural language processing system that understands and executes complex logistics commands. Multi-modal AI that learns from fleet behavior patterns.",
      features: ["Natural Language Understanding", "Real-time Execution", "Continuous Learning", "Multi-modal Analysis"]
    },
    {
      icon: Network,
      title: "Swarm Intelligence",
      description: "Decentralized coordination system inspired by nature's collective intelligence - ants, bees, flocks. Each vehicle operates autonomously while coordinating with the fleet.",
      features: ["Edge AI Computing", "P2P Communication", "Self-Organization", "Zero Central Failure Point"]
    },
    {
      icon: Shield,
      title: "Digital Twin Federation",
      description: "Virtual replicas of your entire fleet running in parallel with real-time data. Detect anomalies, attacks, and failures before they impact operations.",
      features: ["Real-time Simulation", "Anomaly Detection", "Predictive Alerts", "Security Monitoring"]
    }
  ];

  const technologies = [
    {
      category: "Data Integration",
      icon: Wifi,
      color: "cyan",
      items: [
        { title: "Multi-Signal Tracking", desc: "GPS, AIS, ADS-B, RFID, LoRaWAN" },
        { title: "Real-time Streaming", desc: "Sub-second data ingestion and processing" },
        { title: "Edge Computing", desc: "Process data where it's generated" },
        { title: "Mesh Networks", desc: "Vehicle-to-vehicle communication" }
      ]
    },
    {
      category: "AI & Analytics",
      icon: Brain,
      color: "violet",
      items: [
        { title: "Predictive Analytics", desc: "Forecast demand, ETAs, maintenance needs" },
        { title: "ML Models", desc: "Route optimization, anomaly detection, pattern recognition" },
        { title: "Neural Networks", desc: "Lightweight edge AI for autonomous decision-making" },
        { title: "Genetic Algorithms", desc: "Fleet evolution and continuous improvement" }
      ]
    },
    {
      category: "Security & Trust",
      icon: Shield,
      color: "rose",
      items: [
        { title: "Cryptographic Verification", desc: "Immutable data integrity checks" },
        { title: "Anomaly Detection", desc: "Detect GPS spoofing and sensor tampering" },
        { title: "Distributed Ledger", desc: "Audit trail for all operations" },
        { title: "Role-based Access", desc: "Enterprise-grade permission systems" }
      ]
    },
    {
      category: "Infrastructure",
      icon: Cpu,
      color: "emerald",
      items: [
        { title: "Parallel Processing", desc: "50+ simultaneous AI analyses" },
        { title: "Cloud Architecture", desc: "Serverless, auto-scaling compute" },
        { title: "Real-time Database", desc: "Sub-millisecond query responses" },
        { title: "API-first Design", desc: "100+ REST endpoints, WebSocket streams" }
      ]
    }
  ];

  const capabilities = [
    {
      stat: "50+",
      title: "Parallel AI Analyses",
      description: "Run dozens of analyses simultaneously across your entire fleet"
    },
    {
      stat: "Sub-1s",
      title: "Decision Latency",
      description: "Real-time intelligence without batch processing delays"
    },
    {
      stat: "99.99%",
      title: "Uptime SLA",
      description: "Enterprise-grade reliability and redundancy"
    },
    {
      stat: "5 Signal Types",
      title: "Multi-modal Tracking",
      description: "GPS, AIS, ADS-B, RFID, LoRa integration seamlessly"
    }
  ];

  const fleetAICapabilities = [
    {
      command: '"Show delayed shipments"',
      output: "Analyzes 1000+ shipments in real-time. Identifies 3 delays with predicted impact and auto-suggests rerouting"
    },
    {
      command: '"Optimize routes for CO2"',
      output: "Evaluates 47 route combinations. Reduces emissions by 18% while maintaining SLAs"
    },
    {
      command: '"Predict maintenance needs"',
      output: "Analyzes sensor data from 150+ vehicles. Forecasts failures 7 days in advance with 95% accuracy"
    },
    {
      command: '"Assign closest vehicle to order"',
      output: "Evaluates real-time position, capacity, and schedule of 200+ vehicles instantly"
    }
  ];

  const majorMilestones = [
    {
      icon: Zap,
      year: "2024",
      title: "FLEET AI Engine Launch",
      description: "Transformer-based LLM fine-tuned on 10M+ logistics commands. Achieves 98.7% intent accuracy with sub-100ms latency. Uses retrieval-augmented generation (RAG) to ground outputs in real-time fleet state. Handles 50+ concurrent natural language analysis threads simultaneously—each spawning independent AI sub-tasks.",
      technical: "GPT-4 base + LoRA fine-tuning | Token context: 128K | Inference: 4-bit quantization",
      impact: "50+ parallel analyses, 50-100ms latency per query"
    },
    {
      icon: Network,
      year: "2024",
      title: "Swarm Intelligence Protocol (ACO/PSO Hybrid)",
      description: "Implemented Ant Colony Optimization (ACO) and Particle Swarm Optimization (PSO) for decentralized vehicle coordination. No central optimizer—instead, vehicles broadcast local pheromone & position updates via mesh networks (5G/LoRa). Each agent locally solves its routing problem while respecting global fleet constraints via stigmergy (indirect communication).",
      technical: "ACO pheromone decay: O(n²) | PSO iterations: 200/cycle | Mesh sync: 50ms intervals",
      impact: "O(n) scalability, zero single-point failure, sub-second re-optimization"
    },
    {
      icon: Shield,
      year: "2025",
      title: "Digital Twin Federation (Physics Simulation)",
      description: "Runs physics-based simulations (Kalman filtering + predictive kinematics) for every vehicle in parallel. Compares real state vs. predicted state—divergence > threshold triggers anomaly alerts. Detects GPS spoofing (impossible acceleration patterns), MITM attacks (position jumps), and sensor tampering. Fault-tolerant: if one digital twin crashes, federation continues.",
      technical: "Kalman filter: O(n) per update | Physics sim: 100Hz per vehicle | Anomaly scoring: Mahalanobis distance",
      impact: "99.99% uptime SLA, <10ms attack detection, GDPR-compliant federated learning"
    },
    {
      icon: Truck,
      year: "2025",
      title: "Multi-Signal Fusion (Bayesian State Estimation)",
      description: "Unified Kalman filter + Gaussian Mixture Models (GMM) combining GPS noise, AIS satellite delays, ADS-B radar errors, RFID ranging uncertainty, and LoRaWAN signal strength. Weights signals based on confidence. Handles GPS outages gracefully by falling back to inertial + 4G triangulation. Sub-meter accuracy in urban canyons.",
      technical: "Extended Kalman Filter (EKF) | GMM: 5-component mixture | GPS/GNSS fusion: RTKLIB algorithm",
      impact: "±0.5m accuracy (vs. ±5m baseline GPS), 100% coverage in maritime + air + ground"
    },
    {
      icon: Brain,
      year: "2025",
      title: "Predictive ML Suite (LSTM + GBM Ensemble)",
      description: "LSTM networks trained on 2B+ historical trips for ETA prediction (95% within ±5min). Gradient Boosting Machines (XGBoost) for maintenance prediction—scans sensor telemetry (vibration, oil pressure, brake pad wear) to forecast failures 7+ days ahead. Genetic algorithms evolve route genes over 1000+ generations to discover emergent patterns.",
      technical: "LSTM: 3-layer, 256 hidden units | XGBoost: 300 trees, max_depth=8 | Genetic Algorithm: mutation_rate=0.15",
      impact: "95% prediction accuracy, 7-day maintenance window, continuous fleet evolution"
    },
    {
      icon: Radio,
      year: "2026",
      title: "Autonomous Edge AI (TinyML on Vehicle Nodes)",
      description: "Compressed neural networks (MobileNet + quantization) running on vehicle ECUs (ARM Cortex-M7). Models weigh <5MB, execute in <50ms per inference. Vehicles make rerouting decisions locally—e.g., avoiding traffic jams—without cloud. P2P gossip protocol syncs model updates. Fallback to cloud if edge fails.",
      technical: "Model compression: 90% pruning + int8 quantization | Inference framework: ONNX Runtime | Gossip protocol: epidemic broadcast",
      impact: "50ms decisions, zero cloud dependency, ultra-low latency in tunnels/remote areas"
    }
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
            <Link to={createPageUrl("Home")} className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base">
              Back to Home
            </Link>
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
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white font-medium">Our Technology Stack</span>
              <Sparkles className="w-4 h-4 text-violet-400" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight"
            >
              Enterprise AI for
              <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Fleet Operations
                </span>
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-2xl -z-10"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2"
            >
              Advanced AI, real-time intelligence, and autonomous coordination. This is the technology powering the next generation of logistics.
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
                Experience It
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          {/* Core Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-5xl mx-auto"
          >
            {capabilities.map((cap, idx) => (
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
                    <div className="text-4xl font-black bg-gradient-to-br from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                      {cap.stat}
                    </div>
                    <div className="text-white font-bold text-sm mb-2">{cap.title}</div>
                    <div className="text-xs text-slate-400">{cap.description}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Core Architectures */}
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
              <Brain className="w-12 h-12 text-cyan-400" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Three Pillars of
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Our Architecture
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {coreArchitectures.map((arch, idx) => {
              const Icon = arch.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden"
                >
                  <div className="relative">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6"
                    >
                      <Icon className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-3">{arch.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-base mb-6">{arch.description}</p>
                    <div className="space-y-2">
                      {arch.features.map((feature, fidx) => (
                        <div key={fidx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight px-2">
              Complete Technology
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Stack
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden"
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-${tech.color}-500/20 border border-${tech.color}-500/30 flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 text-${tech.color}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4">{tech.category}</h3>
                    <div className="space-y-4">
                      {tech.items.map((item, iidx) => (
                        <div key={iidx}>
                          <p className="text-sm font-semibold text-slate-300">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Major Tech Milestones - EPIC SECTION */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <TrendingUp className="w-16 h-16 text-violet-400" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight px-2">
              6 Major Tech
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                Breakthroughs
              </span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto px-2 leading-relaxed">
              Innovation milestones that transformed fleet logistics into autonomous intelligence systems
            </p>
          </motion.div>

          <div className="space-y-16">
            {majorMilestones.map((milestone, idx) => {
              const Icon = milestone.icon;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="group"
                >
                  <div className="grid md:grid-cols-12 gap-8 items-center">
                    {/* Year Badge */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="md:col-span-2"
                    >
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 text-center">
                        <span className="text-4xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                          {milestone.year}
                        </span>
                      </div>
                    </motion.div>

                    {/* Content Card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -8 }}
                      className="md:col-span-10 relative"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 group-hover:border-violet-500/50 transition-all overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl -z-10" />
                        
                        <div className="flex items-start gap-6">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center flex-shrink-0"
                          >
                            <Icon className="w-10 h-10 text-violet-400" />
                          </motion.div>
                          
                          <div className="flex-1">
                            <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">
                              {milestone.title}
                            </h3>
                            <p className="text-slate-300 mb-6 leading-relaxed text-lg">
                              {milestone.description}
                            </p>
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: "100%" }}
                              viewport={{ once: true }}
                              transition={{ delay: idx * 0.15 + 0.3, duration: 1 }}
                              className="h-0.5 bg-gradient-to-r from-violet-500 to-transparent mb-6"
                            />
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                              <span className="text-sm font-semibold text-violet-300">
                                {milestone.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Connecting Line */}
                    {idx < majorMilestones.length - 1 && (
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: 60 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 + 0.5, duration: 0.6 }}
                        className="hidden md:block md:col-span-2 h-16 mx-auto"
                      >
                        <motion.div
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(139, 92, 246, 0.4)",
                              "0 0 0 10px rgba(139, 92, 246, 0)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1 h-16 mx-auto bg-gradient-to-b from-violet-500 to-fuchsia-500"
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FLEET AI Capabilities */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-12 md:p-20 overflow-hidden"
          >
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
                  FLEET AI in Action
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto px-2">
                  Real capabilities, real results
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {fleetAICapabilities.map((example, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="text-left p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                      <p className="text-white font-bold text-lg">{example.command}</p>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.2 + 0.3, duration: 0.8 }}
                      className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent mb-4"
                    />
                    <p className="text-slate-300 text-base leading-relaxed">{example.output}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 md:p-20 overflow-hidden"
          >
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight px-2">
                See The Technology
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  In Action
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 font-light px-2">
                Experience enterprise-grade AI logistics firsthand
              </p>
              
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold group transition-transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Sparkles className="w-6 h-6 text-cyan-500" />
                Get Started
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Enterprise AI for Fleet Operations.</p>
            <div className="flex gap-6 text-slate-400 text-sm">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-cyan-400 transition-colors">Privacy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-cyan-400 transition-colors">Terms</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-cyan-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}