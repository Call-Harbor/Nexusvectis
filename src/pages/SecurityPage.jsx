import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Shield, Lock, Key, Eye, CheckCircle2, ArrowRight, Server, AlertTriangle, FileCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function SecurityPage() {
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

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-fuchsia-950/20" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
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
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Get Started
          </button>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 z-10">
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
              <Shield className="w-20 h-20 text-violet-400" />
            </motion.div>
            
            <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-tight">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Security
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-300 mb-8 leading-relaxed">
              Enterprise-grade security built into every layer
            </p>

            <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
              Your data security is our top priority. We employ industry-leading practices to protect your fleet operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Security <span className="text-violet-400">Framework</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Encryption",
                description: "All data encrypted in transit and at rest using industry-standard AES-256",
                features: ["TLS 1.3 for all connections", "AES-256 data encryption", "Encrypted backups", "Key rotation policies"]
              },
              {
                icon: Key,
                title: "Authentication",
                description: "Multi-factor authentication and advanced access controls",
                features: ["MFA support (TOTP, SMS)", "SSO integration", "Role-based access (RBAC)", "Session management"]
              },
              {
                icon: Eye,
                title: "Monitoring",
                description: "24/7 security monitoring and real-time threat detection",
                features: ["Security incident response", "Audit logging", "Anomaly detection", "SIEM integration"]
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
                  <Icon className="w-16 h-16 text-violet-400 mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">{pillar.title}</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">{pillar.description}</p>
                  <div className="space-y-3">
                    {pillar.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                        <span className="text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Compliance & <span className="text-violet-400">Certifications</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { cert: "ISO 27001", desc: "Information Security Management" },
              { cert: "SOC 2 Type II", desc: "Security & Availability" },
              { cert: "GDPR", desc: "EU Data Protection" },
              { cert: "CCPA", desc: "California Privacy Rights" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all text-center"
              >
                <FileCheck className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{item.cert}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Security */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Infrastructure <span className="text-violet-400">Security</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <Server className="w-12 h-12 text-violet-400" />
                <h3 className="text-3xl font-bold text-white">Cloud Infrastructure</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Hosted on enterprise-grade cloud infrastructure with built-in redundancy and failover.
              </p>
              <div className="space-y-3">
                {[
                  "Multi-region data replication",
                  "Automated backups every 6 hours",
                  "99.99% infrastructure uptime SLA",
                  "DDoS protection and mitigation",
                  "Network isolation and segmentation",
                  "Infrastructure as Code (IaC)"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-slate-400">{item}</span>
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
              className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
                <h3 className="text-3xl font-bold text-white">Incident Response</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Dedicated security team with 24/7 monitoring and rapid incident response protocols.
              </p>
              <div className="space-y-3">
                {[
                  "24/7 security operations center",
                  "Incident response team on-call",
                  "Automated threat detection",
                  "Regular penetration testing",
                  "Vulnerability scanning",
                  "Security patch management"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30"
          >
            <Shield className="w-16 h-16 text-violet-400 mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">Responsible Disclosure</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              If you discover a security vulnerability in our platform, we encourage you to report it responsibly. We appreciate the security research community's efforts to keep our platform safe.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">How to Report</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Email security@nexusvectis.com with details of the vulnerability. Please include steps to reproduce, potential impact, and any proof-of-concept code.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">What to Expect</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We will acknowledge your report within 24 hours and provide regular updates on our progress. We aim to resolve critical vulnerabilities within 7 days.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Scope</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  In-scope: Web application vulnerabilities, API security issues, authentication bypasses, data leaks. Out-of-scope: Social engineering, physical attacks, DoS attacks on production systems.
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
            className="rounded-[3rem] bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/30 p-16 md:p-20 text-center"
          >
            <Shield className="w-16 h-16 text-violet-400 mx-auto mb-6" />
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Your Data is <span className="text-violet-400">Protected</span>
            </h2>
            <p className="text-2xl text-slate-300 mb-12">
              Experience enterprise security without the enterprise complexity
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
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-violet-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-violet-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-violet-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("About")} className="hover:text-violet-400 transition-colors">About</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-violet-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-violet-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-violet-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis ApS. Building the future of logistics.</p>
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