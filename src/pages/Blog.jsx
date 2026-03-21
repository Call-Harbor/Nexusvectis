import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { FileText, Clock, ArrowRight, ChevronDown, Loader2, Cpu, Zap, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 12;

async function fetchPostsPage({ pageParam = 0 }) {
  const posts = await base44.entities.BlogPost.filter(
    { status: 'published' },
    '-published_at',
    100,
    pageParam
  );
  const hasMore = posts.length === 100;
  const actualPosts = posts.slice(0, PAGE_SIZE);
  return { posts: actualPosts, hasMore, nextOffset: pageParam + PAGE_SIZE };
}

const COLORS = [
  { accent: '#22d3ee', glow: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.2)', text: '#67e8f9' },
  { accent: '#a78bfa', glow: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)', text: '#c4b5fd' },
  { accent: '#f0abfc', glow: 'rgba(217,70,239,0.10)', border: 'rgba(217,70,239,0.18)', text: '#f0abfc' },
];

function BlogCard({ post, idx }) {
  const c = COLORS[idx % COLORS.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (idx % PAGE_SIZE) * 0.04 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group cursor-pointer h-full"
    >
      <Link to={`/BlogPostDetail?id=${post.id}`} className="block h-full">
        <div
          className="relative p-7 rounded-2xl h-full flex flex-col overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(8,15,30,0.98) 100%)',
            border: `1px solid ${c.border}`,
            boxShadow: `0 0 0 rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.03)`,
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl-2xl pointer-events-none" style={{ borderColor: c.accent, opacity: 0.5 }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r rounded-br-2xl pointer-events-none" style={{ borderColor: c.accent, opacity: 0.3 }} />

          {/* Top glow bar */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}50, transparent)` }} />

          {/* Category + badge */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className="inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              style={{ color: c.text, background: `${c.glow}`, border: `1px solid ${c.border}` }}
            >
              {post.category || 'Fleet Intelligence'}
            </span>
            {post.word_count >= 1800 && (
              <span className="text-[10px] text-emerald-400/70 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> In-depth
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-lg font-bold mb-3 leading-snug flex-1 transition-all duration-300"
            style={{ color: '#e2f8ff' }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-slate-500 text-sm leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] border-t pt-4 tracking-wider uppercase" style={{ borderColor: `${c.border}`, color: `${c.text}80` }}>
            <span>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
                : ''}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: c.text }}>
              <Clock className="w-3 h-3" />
              {post.read_time_minutes || '?'} min
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Blog() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['blogPosts-infinite'],
    queryFn: fetchPostsPage,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
  });

  const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">

      {/* ── Holographic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'rgba(6,182,212,0.07)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'rgba(139,92,246,0.07)' }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 11, repeat: Infinity }}
        />
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)' }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Link to={createPageUrl("Home")} className="inline-block mb-8">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
                alt="NexusVectis Logo"
                className="h-24 w-auto mx-auto opacity-80"
              />
            </Link>

            {/* System label */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500/50" />
              <div className="flex items-center gap-2 text-[11px] text-cyan-500/60 tracking-widest uppercase px-3 py-1 rounded-full border border-cyan-500/15 bg-cyan-500/5">
                <Activity className="w-3 h-3" />
                <span>Intelligence Feed · Live</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-violet-500/50" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6"
              style={{ background: 'linear-gradient(135deg, #cffafe 0%, #22d3ee 35%, #a78bfa 70%, #f0abfc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Blog
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Insights on AI, logistics technology, and building the future of supply chain intelligence
            </p>
          </motion.div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl border border-cyan-500/10 animate-pulse"
                  style={{ background: 'rgba(6,182,212,0.03)' }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && allPosts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-8"
            >
              <div className="rounded-2xl border border-cyan-500/15 px-16 py-20 text-center max-w-xl"
                style={{ background: 'rgba(6,182,212,0.03)' }}>
                <FileText className="w-12 h-12 text-cyan-400/40 mx-auto mb-5" />
                <h2 className="text-xl font-bold text-cyan-300/80 mb-3">No transmissions yet</h2>
                <p className="text-slate-500 text-sm">Content is being generated. Subscribe below to be first to receive it.</p>
              </div>
            </motion.div>
          )}

          {/* Post grid */}
          {allPosts.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {allPosts.map((post, idx) => (
                <BlogCard key={post.id} post={post} idx={idx} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center mt-14">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-3 px-8 py-4 rounded-xl border text-sm tracking-wider uppercase transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(6,182,212,0.06)',
                  borderColor: 'rgba(6,182,212,0.25)',
                  color: '#67e8f9'
                }}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {isFetchingNextPage ? 'Receiving...' : 'Load more transmissions'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section className="relative py-28 px-6 z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl p-12 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.07) 0%, rgba(139,92,246,0.07) 100%)',
              border: '1px solid rgba(6,182,212,0.2)',
              boxShadow: '0 0 60px rgba(6,182,212,0.06)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)' }} />
            <Cpu className="w-12 h-12 text-cyan-400/50 mx-auto mb-5" />
            <h2 className="text-4xl font-bold mb-4"
              style={{ background: 'linear-gradient(135deg, #e2f8ff, #67e8f9, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Never Miss an Update
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              Get the latest on AI, logistics tech, and product updates delivered to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-3 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none transition-all"
                style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
              />
              <button
                className="px-7 py-3 rounded-xl font-bold text-sm text-slate-950 tracking-wider transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)' }}
              >
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-20 px-6 z-10" style={{ borderTop: '1px solid rgba(6,182,212,0.08)', background: 'rgba(2,6,23,0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link to={createPageUrl("Home")}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
                  alt="NexusVectis Logo"
                  className="h-28 w-auto mb-5 opacity-75"
                />
              </Link>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">Next-generation fleet intelligence platform powered by AI</p>
            </div>
            <div>
              <h4 className="text-cyan-400/80 font-bold mb-4 text-[11px] tracking-widest uppercase">Platform</h4>
              <ul className="space-y-2.5 text-slate-500 text-sm">
                <li><Link to={createPageUrl("FleetAIPage")} className="hover:text-cyan-400 transition-colors">FLEET AI</Link></li>
                <li><Link to={createPageUrl("HarborInfo")} className="hover:text-amber-400 transition-colors">H.A.R.B.O.R. AI</Link></li>
                <li><Link to={createPageUrl("LiveTrackingPage")} className="hover:text-cyan-400 transition-colors">Live Tracking</Link></li>
                <li><Link to={createPageUrl("AnalyticsPage")} className="hover:text-cyan-400 transition-colors">Analytics</Link></li>
                <li><Link to={createPageUrl("IntegrationsPage")} className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-violet-400/80 font-bold mb-4 text-[11px] tracking-widest uppercase">Company</h4>
              <ul className="space-y-2.5 text-slate-500 text-sm">
                <li><Link to={createPageUrl("Newsroom")} className="hover:text-cyan-400 transition-colors">Newsroom</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-cyan-400 transition-colors">Careers</Link></li>
                <li><Link to={createPageUrl("Contact")} className="hover:text-cyan-400 transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl("Blog")} className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)' }} />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-600 text-xs tracking-wide">&copy; 2026 NexusVectis. Shaping the future of logistics intelligence.</p>
            <div className="flex gap-6 text-slate-600 text-xs">
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