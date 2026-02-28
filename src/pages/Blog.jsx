import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);



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

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
          >
            {categories.map((cat, idx) => (
              <button
                key={idx}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  idx === 0 
                    ? "bg-cyan-500 text-white" 
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Featured Post */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="relative rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative grid md:grid-cols-2 gap-0">
                <div className="h-[400px] bg-cover bg-center" style={{ backgroundImage: `url(${featuredPost.image})` }} />
                <div className="p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">
                      {featuredPost.category}
                    </span>
                    <span className="text-slate-400 text-sm">FEATURED</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-slate-400 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  <button className="text-cyan-400 font-semibold flex items-center gap-2 group-hover:gap-4 transition-all">
                    Read Full Story
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* All Posts */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-white">Latest Articles</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${post.image})` }}
                />
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-semibold">{post.category}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-slate-500 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{post.date}</span>
                    <button className="text-cyan-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                      Read
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <button className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 text-white font-semibold hover:scale-105 transition-all">
              Load More Articles
            </button>
          </motion.div>
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