import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, Scale, AlertCircle, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function TermsOfService() {
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-violet-950/20" />
        <motion.div
          style={{ x: y1, y: y2 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          style={{ x: y2, y: y1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
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
            className="bg-gradient-to-r from-blue-500 to-violet-500 text-white px-6 py-2 rounded-lg hover:scale-105 transition-transform"
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
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-8"
            >
              <Scale className="w-20 h-20 text-blue-400" />
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Terms of Service
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Please read these terms carefully before using NexusVectis.
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
          
          {/* Agreement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Agreement to Terms</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              These Terms of Service ("Terms") govern your access to and use of the NexusVectis platform, including our website, mobile applications, APIs, and all related services (collectively, the "Service").
            </p>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </motion.div>

          {/* Account Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <h2 className="text-3xl font-bold text-white">Account Terms</h2>
            </div>
            
            <div className="space-y-4">
              {[
                "You must be at least 18 years old to use the Service",
                "You must provide accurate and complete information when creating an account",
                "You are responsible for maintaining the security of your account and password",
                "You are responsible for all activities that occur under your account",
                "You may not use the Service for any illegal or unauthorized purpose",
                "You may not transfer your account to another person or entity",
                "One person or legal entity may not maintain more than one free account"
              ].map((term, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300 leading-relaxed">{term}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Service Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <AlertCircle className="w-10 h-10 text-violet-400" />
              <h2 className="text-3xl font-bold text-white">Use of Service</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Service Availability</h3>
                <p className="text-slate-300 leading-relaxed">
                  We strive to provide a reliable service with 99.9% uptime. However, we do not guarantee that the Service will be uninterrupted, timely, secure, or error-free. We reserve the right to modify or discontinue the Service at any time without notice.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">API Usage</h3>
                <p className="text-slate-300 leading-relaxed">
                  API usage is subject to rate limits based on your subscription plan. Excessive API calls that impact service performance may result in temporary throttling or account suspension.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Data Accuracy</h3>
                <p className="text-slate-300 leading-relaxed">
                  While we strive to provide accurate real-time tracking and analytics, we cannot guarantee the accuracy of data from third-party sources (GPS, AIS, ADS-B). You are responsible for verifying critical information.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Prohibited Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
              <h2 className="text-3xl font-bold text-white">Prohibited Activities</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <div className="space-y-3">
              {[
                "Copying, modifying, or creating derivative works of the Service",
                "Reverse engineering or attempting to extract source code",
                "Transmitting viruses, malware, or other malicious code",
                "Attempting to gain unauthorized access to any systems or networks",
                "Interfering with or disrupting the Service or servers",
                "Using the Service to harass, abuse, or harm others",
                "Scraping or harvesting data from the Service",
                "Reselling or redistributing the Service without authorization"
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <p className="text-slate-300 leading-relaxed">{activity}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <DollarSign className="w-10 h-10 text-emerald-400" />
              <h2 className="text-3xl font-bold text-white">Payments & Billing</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Subscription Plans</h3>
                <p className="text-slate-300 leading-relaxed">
                  Our Service is offered through various subscription plans. Pricing is based on the number of vehicles, resources, and usage of AI features. Current pricing is available on our website.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Billing Cycle</h3>
                <p className="text-slate-300 leading-relaxed">
                  Subscriptions are billed monthly in advance. Invoices are generated on the 1st of each month and payment is due within 14 days. Usage-based charges (FLEET AI commands, API calls) are billed in arrears.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Cancellation & Refunds</h3>
                <p className="text-slate-300 leading-relaxed">
                  You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. We do not provide refunds for partial months or unused services.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Late Payments</h3>
                <p className="text-slate-300 leading-relaxed">
                  Overdue invoices may result in service suspension. A late fee of 2% per month may be applied to overdue balances. We reserve the right to suspend or terminate accounts with outstanding payments.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Intellectual Property */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <Scale className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold text-white">Intellectual Property</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              The Service and its original content, features, and functionality are owned by NexusVectis and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">Your Data:</strong> You retain all rights to the data you input into the Service. We claim no intellectual property rights over your data.
              </p>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">Our Platform:</strong> You may not copy, modify, distribute, sell, or lease any part of our Service or software without explicit written permission.
              </p>
            </div>
          </motion.div>

          {/* Limitation of Liability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <h2 className="text-3xl font-bold text-white">Limitation of Liability</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              To the maximum extent permitted by law, NexusVectis shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </motion.div>

          {/* Termination */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
              <h2 className="text-3xl font-bold text-white">Termination</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-6">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Upon termination, your right to use the Service will immediately cease. We will provide you with the ability to export your data for 30 days after termination.
            </p>
          </motion.div>

          {/* Changes to Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <FileText className="w-10 h-10 text-violet-400" />
              <h2 className="text-3xl font-bold text-white">Changes to Terms</h2>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of any material changes by email or through a prominent notice on our Service at least 30 days before the changes take effect.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Your continued use of the Service after the changes take effect constitutes your acceptance of the new Terms.
            </p>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/30"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Questions About These Terms?</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            <div className="space-y-2 text-slate-300">
              <p><strong>Email:</strong> legal@nexusvectis.com</p>
              <p><strong>Address:</strong> NexusVectis, Vesterbrogade 123, 1620 København V, Denmark</p>
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
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-blue-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-blue-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-blue-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-blue-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Careers")} className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-blue-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-blue-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Building the future of logistics.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-blue-400 transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("SecurityPage")} className="hover:text-blue-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}