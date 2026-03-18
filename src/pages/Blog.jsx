import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: rawPosts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ status: 'published' }, '-created_date', 50),
  });

  const posts = [...rawPosts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));



  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                alt="NexusVectis Logo" 
                className="h-24 w-auto mx-auto opacity-90"
              />
            </Link>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
              Insights on AI, logistics technology, and building the future of supply chain intelligence
            </p>
          </motion.div>

          {posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mt-8"
            >
              <div className="rounded-3xl bg-white/5 border border-white/10 px-16 py-20 text-center max-w-xl">
                <FileText className="w-14 h-14 text-cyan-400 mx-auto mb-6 opacity-60" />
                <h2 className="text-2xl font-bold text-white mb-3">No posts yet</h2>
                <p className="text-slate-400">We're working on great content. Subscribe to the newsletter below to be the first to know.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
            >
              {posts.map((post, idx) => {
                const colors = ["cyan", "violet", "fuchsia"];
                const color = colors[idx % colors.length];
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="group cursor-pointer"
                  >
                    <Link to={`/BlogPostDetail?id=${post.id}`} className="block h-full">
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
                        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                        <span className={`text-${color}-400 font-medium flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {post.read_time_minutes || '?'} min <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="relative py-32 px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 border border-cyan-500/30 p-16 text-center"
          >
            <FileText className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-5xl font-bold text-white mb-6">
              Never Miss an Update
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Get the latest on AI, logistics tech, and product updates delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-transform">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 z-10 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" 
                  alt="NexusVectis Logo" 
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