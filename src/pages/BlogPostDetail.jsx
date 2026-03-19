import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Clock, Calendar, Tag, Cpu, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function BlogPostDetail() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  useEffect(() => { window.scrollTo(0, 0); }, [postId]);

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost', postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0] || null;
    },
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400/60 text-sm tracking-widest uppercase">Loading Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-cyan-500/20">
          <p className="text-cyan-300 text-2xl mb-4">Signal Lost</p>
          <Link to="/Blog" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">

      {/* ── Holographic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
        {/* Glow orbs */}
        <motion.div
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 11, repeat: Infinity }}
        />
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-cyan-500/10"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/Blog" className="flex items-center gap-2 text-cyan-500/70 hover:text-cyan-400 transition-colors text-sm tracking-wider uppercase">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Intelligence Feed</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2 text-cyan-400/40 text-[10px] tracking-widest uppercase">
            <Cpu className="w-3 h-3" />
            <span>NexusVectis · AI Content</span>
          </div>
          <Link to={createPageUrl("Home")}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
              alt="NexusVectis"
              className="h-9 w-auto opacity-70 hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>
      </motion.header>

      {/* ── Content ── */}
      <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">

          {/* Meta header panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-cyan-500/15 backdrop-blur-xl"
            style={{ boxShadow: '0 0 40px rgba(6,182,212,0.06)' }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-500/30 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-500/30 rounded-br-2xl pointer-events-none" />

            <div className="flex flex-wrap items-center gap-2 mb-5">
              {post.category && (
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-3 py-1 rounded-full uppercase tracking-widest">
                  {post.category}
                </span>
              )}
              {post.ai_generated && (
                <span className="text-[10px] text-violet-400/80 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> AI Generated
                </span>
              )}
              {post.primary_keyword && (
                <span className="text-[11px] text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {post.primary_keyword}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-5"
              style={{ background: 'linear-gradient(135deg, #e2f8ff 0%, #67e8f9 40%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {post.title}
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-5">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-5 text-[11px] text-cyan-500/50 border-t border-cyan-500/10 pt-5 tracking-wider uppercase">
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {post.read_time_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {post.read_time_minutes} min read
                </span>
              )}
              {post.word_count && (
                <span>{post.word_count.toLocaleString()} words</span>
              )}
              {post.seo_score && (
                <span className="text-emerald-400/60">SEO {post.seo_score}/100</span>
              )}
            </div>
          </motion.div>

          {/* Article Body — hologram panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="relative rounded-2xl border border-cyan-500/12 backdrop-blur-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(8,15,30,0.98) 100%)',
              boxShadow: '0 0 60px rgba(6,182,212,0.05), inset 0 1px 0 rgba(6,182,212,0.08)'
            }}
          >
            {/* Top glow bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

            <div className="p-8 sm:p-12">
              <style>{`
                .blog-content h1 {
                  background: linear-gradient(135deg, #cffafe, #22d3ee);
                  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                  font-size: 1.7rem; font-weight: 800; margin: 2.5rem 0 1rem; line-height: 1.25;
                }
                .blog-content h2 {
                  background: linear-gradient(135deg, #e0f2fe, #67e8f9, #a78bfa);
                  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                  font-size: 1.35rem; font-weight: 700; margin: 2rem 0 0.75rem; line-height: 1.3;
                  padding-bottom: 0.5rem;
                  border-bottom: 1px solid rgba(6,182,212,0.12);
                }
                .blog-content h3 {
                  color: #93c5fd;
                  font-size: 1.1rem; font-weight: 600; margin: 1.75rem 0 0.5rem;
                }
                .blog-content p { margin: 1rem 0; color: #94a3b8; line-height: 1.9; }
                .blog-content ul, .blog-content ol { margin: 1rem 0 1rem 1.5rem; color: #94a3b8; }
                .blog-content li { margin: 0.5rem 0; line-height: 1.75; }
                .blog-content li::marker { color: #22d3ee; }
                .blog-content strong { color: #e2f8ff; font-weight: 700; }
                .blog-content em { color: #c4b5fd; font-style: italic; }
                .blog-content a { color: #22d3ee; text-decoration: none; border-bottom: 1px solid rgba(34,211,238,0.3); transition: border-color 0.2s; }
                .blog-content a:hover { border-bottom-color: rgba(34,211,238,0.8); }
                .blog-content blockquote {
                  border-left: 2px solid rgba(6,182,212,0.4);
                  margin: 1.5rem 0; padding: 0.75rem 1.25rem;
                  background: rgba(6,182,212,0.05);
                  border-radius: 0 0.5rem 0.5rem 0;
                  color: #7dd3fc; font-style: italic;
                }
                .blog-content code {
                  background: rgba(6,182,212,0.08);
                  border: 1px solid rgba(6,182,212,0.15);
                  padding: 0.15rem 0.45rem; border-radius: 0.3rem;
                  font-size: 0.875em; color: #67e8f9;
                }
                .blog-content pre {
                  background: rgba(6,182,212,0.04);
                  border: 1px solid rgba(6,182,212,0.1);
                  padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin: 1.5rem 0;
                }
                .blog-content table {
                  width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem;
                }
                .blog-content th {
                  background: rgba(6,182,212,0.12);
                  color: #22d3ee; font-weight: 700; text-align: left;
                  padding: 0.75rem 1rem; border: 1px solid rgba(6,182,212,0.15);
                  text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em;
                }
                .blog-content td {
                  padding: 0.65rem 1rem; color: #94a3b8;
                  border: 1px solid rgba(6,182,212,0.08);
                }
                .blog-content tr:nth-child(even) td { background: rgba(6,182,212,0.03); }
                .blog-content tr:hover td { background: rgba(6,182,212,0.06); }
                .blog-content hr {
                  border: none; height: 1px;
                  background: linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent);
                  margin: 2rem 0;
                }
              `}</style>
              <div
                className="blog-content"
                style={{ fontSize: '1.05rem', lineHeight: '1.85' }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Bottom glow bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {post.tags.map((tag, i) => (
                <span key={i} className="text-[11px] text-cyan-500/60 bg-cyan-500/5 border border-cyan-500/15 px-3 py-1 rounded-full tracking-wide">
                  #{tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* Back CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Link
              to="/Blog"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 border border-cyan-500/25 hover:border-cyan-400/50 px-7 py-3 rounded-xl transition-all hover:bg-cyan-500/5 text-sm tracking-wider uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Intelligence Feed
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}