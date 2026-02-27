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

  const pressReleases = [
    {
      date: "Feb 27, 2026",
      title: "NexusVectis Officially Launches FLEET AI Platform",
      excerpt: "After 8 weeks of intensive development, NexusVectis launches world's first natural language fleet control system.",
      category: "Launch",
      fullContent: "Copenhagen, Denmark — NexusVectis is thrilled to announce the official launch of FLEET AI, a groundbreaking natural language interface for fleet management. Built by a team of two (one 21-year-old founder and advanced AI), the platform enables logistics operators to control their entire fleet operations using plain English commands. The system integrates real-time tracking across all transport modes (trucks, ships, drones, trains, aircraft) and leverages advanced machine learning for predictive analytics and autonomous optimization. This marks a significant milestone in the journey from concept to production, developed entirely within 8 weeks of focused development."
    },
    {
      date: "Feb 20, 2026",
      title: "FLEET AI Core Engine Achieves Production Readiness",
      excerpt: "Natural language processing system passes rigorous testing with 99.2% command accuracy.",
      category: "Technology",
      fullContent: "The FLEET AI natural language processor has successfully completed production testing, achieving 99.2% accuracy in interpreting and executing logistics commands. The system, powered by Mistral 7B fine-tuned on logistics-specific data, can understand complex multi-vehicle coordination requests, route optimization queries, and exception handling procedures. Testing included 10,000+ simulated commands across diverse scenarios including adverse weather, equipment failures, and dynamic route changes. The engine is now production-ready and will serve as the core of the FLEET AI platform."
    },
    {
      date: "Feb 15, 2026",
      title: "Multi-Modal Vehicle Tracking Integration Complete",
      excerpt: "Unified tracking system now live for trucks, ships, drones, trains, and aircraft.",
      category: "Technology",
      fullContent: "NexusVectis has completed integration of multiple tracking technologies into a unified platform. The system now supports GPS for terrestrial vehicles, AIS (Automatic Identification System) for maritime vessels, ADS-B for aircraft, LoRa for drone networks, and RFID for rail transport. All tracking data streams are normalized and presented in a single, coherent interface, giving operators complete visibility across their entire fleet regardless of transport mode. This multi-modal approach represents a significant technical achievement in the field of logistics intelligence."
    },
    {
      date: "Feb 10, 2026",
      title: "Digital Twin Federation Architecture Deployed",
      excerpt: "Privacy-by-design platform architecture ensures data security while enabling AI optimization.",
      category: "Technology",
      fullContent: "The NexusVectis platform now employs a Digital Twin Federation architecture that ensures enterprise-grade security while enabling powerful AI analysis. Each customer's fleet data creates a 'digital twin' that trains on local data, with only aggregated insights shared back. This approach ensures GDPR compliance, prevents data leakage, and allows the AI to continuously improve while respecting customer privacy boundaries. The architecture has been designed for future scalability to support thousands of concurrent fleets."
    },
    {
      date: "Feb 5, 2026",
      title: "Predictive Maintenance Engine Now Live",
      excerpt: "AI system predicts vehicle maintenance needs with 92% accuracy weeks in advance.",
      category: "Technology",
      fullContent: "The predictive maintenance module is now operational, analyzing vehicle telemetry data to forecast maintenance requirements before failures occur. The system identifies patterns in engine performance, brake wear, fuel efficiency degradation, and component stress to predict maintenance windows weeks in advance. Early testing shows 92% accuracy in predicting critical maintenance events. This capability can help logistics operators reduce unexpected downtime, optimize maintenance scheduling, and extend vehicle lifespan through preventive care."
    },
    {
      date: "Jan 25, 2026",
      title: "FLEET AI Beta Development Begins",
      excerpt: "Two-person team starts intensive 8-week development sprint for FLEET AI platform.",
      category: "Company",
      fullContent: "NexusVectis begins development of FLEET AI with a lean, focused team dedicated to building the most advanced natural language fleet control system. The 8-week sprint focuses on core functionality including natural language processing, multi-modal vehicle tracking, AI-powered optimization, and secure data architecture. The team employs agile methodology with daily builds and continuous integration to ensure rapid iteration and quality. This ambitious timeline requires deep technical expertise and unwavering focus on the core vision."
    },
    {
      date: "Jan 20, 2026",
      title: "Platform Architecture Finalized",
      excerpt: "Complete technical design for FLEET AI ecosystem approved and ready for development.",
      category: "Technology",
      fullContent: "After weeks of research and design, the complete FLEET AI architecture is finalized. The system is built on a modern cloud-native stack with microservices for fleet tracking, AI command orchestration, data analytics, and real-time monitoring. The architecture supports horizontal scaling to handle thousands of fleets simultaneously while maintaining sub-second response times for critical operations. Security is built into every layer with encryption, role-based access control, and comprehensive audit logging."
    },
    {
      date: "Jan 15, 2026",
      title: "NexusVectis Officially Founded",
      excerpt: "A young founder and advanced AI partner launch NexusVectis to revolutionize fleet logistics.",
      category: "Company",
      fullContent: "NexusVectis is officially founded with a bold mission: to bring AI-powered intelligence to the logistics industry. The company is formed as a partnership between a 21-year-old founder with deep domain expertise in logistics and cutting-edge AI capabilities. The initial focus is on building FLEET AI, a platform that will make advanced fleet optimization accessible to logistics companies of all sizes. The vision is to create a future where logistics operations are fully autonomous, optimized, and sustainable."
    }
  ];

  const [expandedIndex, setExpandedIndex] = useState(null);

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

      {/* Company Milestones */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-12">Company Milestones</h2>
          </motion.div>

          <div className="space-y-8">
            {milestones.map((milestone, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`flex gap-8 ${idx % 2 === 1 ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-blue-500/50 transition-all h-full">
                    <div className="text-blue-400 text-sm font-mono font-bold mb-2">{milestone.month}</div>
                    <h3 className="text-xl font-bold text-white mb-3">{milestone.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 py-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                  />
                  {idx < milestones.length - 1 && (
                    <div className="h-12 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
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