import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Shield, Lock, Key, Eye, CheckCircle2, ArrowRight, Server,
  AlertTriangle, FileCheck, Brain, Network, Activity, Dna,
  Satellite, Globe, Cpu, GitMerge, Zap, Database, Radio
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function SecurityPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/10" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
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
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to={createPageUrl("Home")}>
            <motion.img
              whileHover={{ scale: 1.05 }}
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
              alt="NexusVectis"
              className="h-20 w-auto"
            />
          </Link>
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
            className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Get Started
          </button>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <Shield className="w-20 h-20 text-violet-400" />
            </motion.div>

            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-tight">
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Security
              </span>
            </h1>

            <p className="text-2xl md:text-3xl text-slate-300 mb-8 leading-relaxed">
              Fleet Immune System — Autonomous, Self-Healing, Always-On
            </p>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              NexusVectis doesn't just protect your data — it runs a living, AI-powered immune system across your entire fleet. From GPS spoofing detection to federated learning privacy, security is baked into every layer of the platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Fleet Immune System */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Fleet <span className="text-emerald-400">Immune System</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Modeled after the human immune system — three layered defenses that learn, adapt, and remember every threat.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {[
              {
                icon: Shield,
                color: "amber",
                title: "Innate Defense",
                subtitle: "First response · seconds",
                desc: "Immediate, non-specific response to any anomaly. Offline vehicles are quarantined, low fuel alerts dispatched, and abnormal signals flagged — all within seconds of detection.",
                features: ["GPS spoofing detection", "Abnormal login pattern blocking", "Vehicle quarantine on anomaly", "Real-time fuel & status alerts"]
              },
              {
                icon: Dna,
                color: "violet",
                title: "Adaptive AI Defense",
                subtitle: "Targeted response · minutes",
                desc: "Mistral AI analyzes threat patterns specifically and generates targeted countermeasures. Learns from each attack to improve future response.",
                features: ["Neuro-Symbolic Risk Fusion", "API abuse detection & blocking", "Data manipulation detection", "Cascade risk simulation"]
              },
              {
                icon: Brain,
                color: "cyan",
                title: "Immune Memory",
                subtitle: "Long-term protection · permanent",
                desc: "Every threat cycle is logged to SecurityAudit. Threat profiles are stored and used to accelerate response to recurring attack patterns.",
                features: ["Full SecurityAudit log trail", "Threat pattern fingerprinting", "Cross-org anomaly correlation", "Historical attack profiles"]
              }
            ].map((layer, idx) => {
              const Icon = layer.icon;
              const colorMap = {
                amber: "border-amber-500/30 hover:border-amber-400/60 text-amber-400 bg-amber-500/10",
                violet: "border-violet-500/30 hover:border-violet-400/60 text-violet-400 bg-violet-500/10",
                cyan: "border-cyan-500/30 hover:border-cyan-400/60 text-cyan-400 bg-cyan-500/10",
              };
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ scale: 1.03, y: -6 }}
                  className={`p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border transition-all ${colorMap[layer.color]}`}
                >
                  <Icon className={`w-12 h-12 mb-4 text-${layer.color}-400`} />
                  <h3 className="text-xl font-bold text-white mb-1">{layer.title}</h3>
                  <p className={`text-xs font-mono mb-4 text-${layer.color}-400 uppercase tracking-wider`}>{layer.subtitle}</p>
                  <p className="text-slate-400 mb-6 leading-relaxed text-sm">{layer.desc}</p>
                  <div className="space-y-2">
                    {layer.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 text-${layer.color}-400 flex-shrink-0`} />
                        <span className="text-slate-400 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Autonomous cycle badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mx-auto"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-mono font-bold">AUTONOMOUS IMMUNITY ENGINE · Runs every 10 minutes · No human intervention required</span>
          </motion.div>
        </div>
      </section>

      {/* Core Security Pillars */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Core Security <span className="text-violet-400">Architecture</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Encryption",
                description: "All data encrypted in transit and at rest",
                features: ["TLS 1.3 for all connections", "AES-256 data encryption", "Encrypted API keys (hashed)", "Secure token management"]
              },
              {
                icon: Key,
                title: "Authentication & Access",
                description: "Role-based access control with full audit trail",
                features: ["Role-based access (admin/user)", "API key management per org", "SecurityAudit log for all actions", "Organization-scoped data isolation"]
              },
              {
                icon: Eye,
                title: "Real-Time Monitoring",
                description: "Live threat detection across the full fleet",
                features: ["Neuro-Symbolic Risk Fusion AI", "GPS spoofing & signal anomalies", "API abuse rate monitoring", "Swarm-coordinated threat response"]
              }
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all"
                >
                  <Icon className="w-14 h-14 text-violet-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-3">{pillar.title}</h3>
                  <p className="text-slate-400 mb-6 text-sm leading-relaxed">{pillar.description}</p>
                  <div className="space-y-3">
                    {pillar.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        <span className="text-slate-400 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advanced AI Security Features */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              AI-Powered <span className="text-cyan-400">Cyber Defense</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The Cyber Defense Layer continuously monitors for threats that traditional security tools miss.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Satellite,
                color: "cyan",
                title: "GPS Spoofing Detection",
                desc: "AI monitors position data across the fleet for implausible jumps, impossible speeds, and coordinate inconsistencies — automatically flagging and alerting on spoofed signals in real time."
              },
              {
                icon: Activity,
                color: "violet",
                title: "Abnormal Login Pattern Detection",
                desc: "Machine learning models baseline normal login behavior per user and organization. Logins from new locations, unusual hours, or rapid succession are detected and can trigger automatic lockdown."
              },
              {
                icon: Radio,
                color: "amber",
                title: "API Abuse Detection",
                desc: "All API calls are logged with timestamps, IPs, and response codes. Burst patterns, credential stuffing, and unusual endpoint access are detected and automatically rate-limited or blocked."
              },
              {
                icon: Database,
                color: "emerald",
                title: "Data Manipulation Detection",
                desc: "The system monitors for unexpected bulk changes, deletion spikes, or data consistency violations across vehicles, shipments, and routes — raising alerts and optionally locking affected resources."
              },
              {
                icon: GitMerge,
                color: "violet",
                title: "Federated Learning Privacy",
                desc: "AI models are trained locally per organization twin. Only aggregated model weights — never raw data — are shared across the federation, keeping all operational data GDPR-compliant by design."
              },
              {
                icon: Network,
                color: "cyan",
                title: "Swarm-Coordinated Response",
                desc: "Swarm Intelligence agents coordinate security responses across the fleet mesh. Threats identified by one node automatically propagate defensive postures to neighbouring vehicles and resources."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              const colors = {
                cyan: "border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 bg-cyan-500/5",
                violet: "border-violet-500/20 hover:border-violet-500/50 text-violet-400 bg-violet-500/5",
                amber: "border-amber-500/20 hover:border-amber-500/50 text-amber-400 bg-amber-500/5",
                emerald: "border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 bg-emerald-500/5",
              };
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 2) * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-7 rounded-2xl border transition-all ${colors[item.color]}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${item.color === 'cyan' ? 'bg-cyan-500/15' : item.color === 'violet' ? 'bg-violet-500/15' : item.color === 'amber' ? 'bg-amber-500/15' : 'bg-emerald-500/15'} flex-shrink-0`}>
                      <Icon className={`w-6 h-6 text-${item.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Digital Twin Federation Security */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-8 h-8 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-mono font-bold uppercase tracking-widest">Digital Twin Federation</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Privacy by Architecture, Not Policy
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Every fleet unit has its own digital twin that trains locally on its own data. Federated learning means only model weights — never raw operational data — are shared between twins. This is GDPR compliance through system design, not just documentation.
              </p>
              <div className="space-y-3">
                {[
                  "No raw data leaves the organization boundary",
                  "Aggregate model updates only — GDPR-safe by design",
                  "Each twin operates with full autonomy",
                  "Cascade failures simulated before they happen",
                  "Swarm-twin synergy pre-validates security decisions"
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                { label: "Federated Learning", desc: "Local training · global intelligence", icon: GitMerge, color: "cyan" },
                { label: "What-If Simulation", desc: "Cascade failures pre-simulated by twins", icon: Zap, color: "violet" },
                { label: "EU-GDPR Compliance", desc: "No raw data sharing across nodes", icon: FileCheck, color: "emerald" },
                { label: "Autonomous Self-Healing", desc: "Twins detect & recover without human input", icon: Shield, color: "amber" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className={`p-2 rounded-xl bg-${item.color}-500/15`}>
                      <Icon className={`w-5 h-5 text-${item.color}-400`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Infrastructure & Compliance */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Infrastructure & <span className="text-violet-400">Compliance</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <Server className="w-10 h-10 text-violet-400" />
                <h3 className="text-2xl font-bold text-white">Cloud Infrastructure</h3>
              </div>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                Built on enterprise-grade cloud infrastructure with redundancy and failover. Organization data is fully isolated — no cross-tenant data access possible.
              </p>
              <div className="space-y-2.5">
                {[
                  "Organization-scoped data isolation",
                  "Automated database backups",
                  "DDoS protection and mitigation",
                  "Network segmentation per service",
                  "Secure API key hashing (never stored plain)",
                  "Infrastructure as Code (IaC)"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-amber-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <h3 className="text-2xl font-bold text-white">Autonomous Incident Response</h3>
              </div>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                The Immunity Engine runs every 10 minutes without human intervention — detecting, analyzing, and neutralizing threats autonomously.
              </p>
              <div className="space-y-2.5">
                {[
                  "10-minute autonomous immunity cycle",
                  "Automatic vehicle & resource lockdown",
                  "Mistral AI threat analysis on every cycle",
                  "Automatic suspension of compromised accounts",
                  "Full audit trail in SecurityAudit entity",
                  "Swarm-coordinated multi-node response"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Compliance badges */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { cert: "EU-GDPR", desc: "Federated learning — no raw data sharing. Organization data never crosses boundaries.", icon: Globe },
              { cert: "Audit Logging", desc: "Every action, login, API call, and security event is logged immutably in SecurityAudit.", icon: FileCheck },
              { cert: "Zero-Trust", desc: "Role-based access, scoped API keys, and per-organization data isolation enforced at every layer.", icon: Lock },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-7 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all text-center"
                >
                  <Icon className="w-10 h-10 text-violet-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">{item.cert}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="relative py-24 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30"
          >
            <Shield className="w-14 h-14 text-violet-400 mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">Responsible Disclosure</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              If you discover a security vulnerability in the NexusVectis platform, we encourage responsible disclosure. We take all reports seriously and respond rapidly.
            </p>
            <div className="space-y-4">
               <div>
                 <h3 className="text-white font-semibold mb-1">How to Report</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Email <span className="text-cyan-400">security@harborvision.dev</span> with a description, reproduction steps, potential impact, and any PoC.
                 </p>
               </div>
               <div>
                 <h3 className="text-white font-semibold mb-1">What to Expect</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Acknowledgement within 24 hours. Critical vulnerabilities targeted for resolution within 7 days.
                 </p>
               </div>
               <div>
                 <h3 className="text-white font-semibold mb-1">Scope</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   In-scope: Web app, API, authentication, data isolation, GPS signal integrity. Out-of-scope: Social engineering, physical attacks, DoS against production.
                 </p>
               </div>
               <div>
                 <h3 className="text-white font-semibold mb-1">Company Details</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">
                   H.A.R.B.O.R Vision, Vesterbrogade 123, 1620 København V, Denmark. VAT: 42662215
                 </p>
               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-emerald-500/10 border border-violet-500/30 p-16 md:p-20 text-center"
          >
            <Shield className="w-16 h-16 text-violet-400 mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Security That <span className="text-cyan-400">Never Sleeps</span>
            </h2>
            <p className="text-2xl text-slate-300 mb-12">
              Autonomous immunity running every 10 minutes — no human required
            </p>
            <button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
              className="bg-white text-slate-900 text-xl px-12 py-7 rounded-2xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-3"
            >
              Get Started Securely
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
                  alt="NexusVectis"
                  className="h-32 w-auto mb-6 opacity-90"
                />
              </Link>
              <p className="text-slate-400 max-w-md">
                Next-generation fleet intelligence platform powered by AI
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-violet-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-violet-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-violet-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-violet-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-violet-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-violet-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-violet-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-violet-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Building the future of logistics.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-violet-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-violet-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-violet-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}