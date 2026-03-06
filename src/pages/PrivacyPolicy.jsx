import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Shield, Lock, Eye, UserCheck, ArrowRight, CheckCircle2, Database, Globe, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function PrivacyPolicy() {
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-cyan-950/20" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
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
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Get Started
          </button>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <Shield className="w-20 h-20 text-emerald-400" />
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and protect your data.
            </p>
            
            <p className="text-sm text-slate-500 mt-6">
              Last updated: February 15, 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="relative py-16 px-6 z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-10 h-10 text-emerald-400" />
              <h2 className="text-3xl font-bold text-white">Introduction</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              NexusVectis ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fleet intelligence platform.
            </p>
            <p className="text-slate-300 leading-relaxed">
              By using NexusVectis, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </motion.div>

          {/* Data We Collect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-10 h-10 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Information We Collect</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Account Information
                </h3>
                <p className="text-slate-300 leading-relaxed pl-7">
                  When you create an account, we collect your name, email address, company name, phone number, and billing information. This data is necessary to provide you with access to our platform and support services.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Fleet & Operational Data
                </h3>
                <p className="text-slate-300 leading-relaxed pl-7">
                  We collect data about your vehicles, drivers, routes, shipments, and other operational information you input into the system. This includes GPS coordinates, delivery statuses, vehicle telemetry, and performance metrics.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Usage Information
                </h3>
                <p className="text-slate-300 leading-relaxed pl-7">
                  We automatically collect information about how you use our platform, including pages visited, features used, time spent, and interactions with FLEET AI. We also collect device information, IP addresses, and browser types.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Communication Data
                </h3>
                <p className="text-slate-300 leading-relaxed pl-7">
                  When you contact our support team or communicate with us via email, chat, or phone, we store these communications to provide better service and resolve issues.
                </p>
              </div>
            </div>
          </motion.div>

          {/* How We Use Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <Eye className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">How We Use Your Information</h2>
            </div>
            
            <div className="grid gap-4">
              {[
                "Provide, maintain, and improve our services",
                "Process transactions and send billing notifications",
                "Respond to your requests and provide customer support",
                "Analyze usage patterns to enhance user experience",
                "Train and improve our AI models and algorithms",
                "Send important updates about service changes",
                "Detect and prevent fraud, abuse, and security incidents",
                "Comply with legal obligations and enforce our terms"
              ].map((use, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300 leading-relaxed">{use}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <Lock className="w-10 h-10 text-violet-400" />
              <h2 className="text-3xl font-bold text-white">Data Security</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              We implement industry-standard security measures to protect your data:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "End-to-end encryption for data in transit",
                "AES-256 encryption for data at rest",
                "Regular security audits and penetration testing",
                "Multi-factor authentication (MFA) support",
                "Role-based access control (RBAC)",
                "Automated backup and disaster recovery",
                "24/7 security monitoring and incident response",
                "ISO 27001 and SOC 2 compliance"
              ].map((measure, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300 text-sm leading-relaxed">{measure}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Sharing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <Globe className="w-10 h-10 text-cyan-400" />
              <h2 className="text-3xl font-bold text-white">Data Sharing & Disclosure</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              We do not sell your personal information. We may share your data only in the following circumstances:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">With Service Providers</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We work with trusted third-party service providers who help us operate our platform, process payments, and provide customer support. These providers are bound by strict confidentiality agreements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Legal Compliance</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We may disclose information when required by law, court order, or government request, or to protect our rights, property, or safety.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Business Transfers</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner with advance notice.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Your Rights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <UserCheck className="w-10 h-10 text-emerald-400" />
              <h2 className="text-3xl font-bold text-white">Your Privacy Rights</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              Under GDPR and other privacy regulations, you have the following rights:
            </p>
            <div className="space-y-3">
              {[
                { right: "Access", desc: "Request a copy of your personal data" },
                { right: "Correction", desc: "Update or correct inaccurate information" },
                { right: "Deletion", desc: "Request deletion of your personal data (right to be forgotten)" },
                { right: "Portability", desc: "Receive your data in a machine-readable format" },
                { right: "Restriction", desc: "Limit how we process your data" },
                { right: "Objection", desc: "Object to certain types of processing" },
                { right: "Withdraw Consent", desc: "Revoke consent for data processing at any time" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.right}</h4>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-300 leading-relaxed mt-6">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@harborvision.dev" className="text-emerald-400 hover:text-emerald-300 underline">privacy@harborvision.dev</a>
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Questions About Privacy?</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              If you have any questions or concerns about this Privacy Policy or our data practices, please don't hesitate to contact us.
            </p>
            <div className="space-y-2 text-slate-300">
              <p><strong>Email:</strong> privacy@harborvision.dev</p>
              <p><strong>Address:</strong> H.A.R.B.O.R Vision, Danas Have 65, 2. 26, 4200 Slagelse, Denmark</p>
              <p><strong>VAT Number:</strong> 42662215</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50 mt-20">
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
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-emerald-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-emerald-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-emerald-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-emerald-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-emerald-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-emerald-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-emerald-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Building the future of logistics.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-emerald-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}