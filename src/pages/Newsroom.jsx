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
              <button 
                onClick={async () => {
                  const response = await base44.functions.invoke('downloadLogoPakke', {});
                  const blob = new Blob([response.data], { type: 'text/plain' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'NexusVectis-Logo-Package.txt';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10"
              >
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">Download Logo Pack</span>
              </button>
              <button 
                onClick={async () => {
                  const response = await base44.functions.invoke('generateCompanyFactSheet', {});
                  const blob = new Blob([response.data], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'NexusVectis-Company-Fact-Sheet.pdf';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:bg-white/10"
              >
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
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-blue-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-blue-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-blue-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-blue-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-blue-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-blue-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-blue-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2026 NexusVectis. Shaping the future of logistics intelligence.</p>
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