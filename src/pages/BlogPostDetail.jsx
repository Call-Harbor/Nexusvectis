import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function BlogPostDetail() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">Post not found</p>
          <Link to="/Blog" className="text-cyan-400 hover:text-cyan-300">← Back to blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/20 to-cyan-950/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-2xl border-b border-white/5"
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/Blog" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <Link to={createPageUrl("Home")}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png"
              alt="NexusVectis"
              className="h-10 w-auto opacity-80"
            />
          </Link>
        </div>
      </motion.header>

      {/* Content */}
      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.category && (
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  {post.category}
                </span>
              )}
              {post.ai_generated && (
                <span className="text-[10px] text-cyan-400/70 border border-cyan-500/20 px-2 py-0.5 rounded-full bg-cyan-500/5">
                  ✦ AI Generated
                </span>
              )}
              {post.primary_keyword && (
                <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {post.primary_keyword}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              {post.title}
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 border-t border-white/5 pt-6">
              {post.published_at && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {post.read_time_minutes && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {post.read_time_minutes} min læsetid
                </span>
              )}
              {post.word_count && (
                <span>{post.word_count} ord</span>
              )}
              {post.seo_score && (
                <span className="text-emerald-400">SEO score: {post.seo_score}/100</span>
              )}
            </div>
          </motion.div>

          {/* Article Body */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="prose-content rounded-3xl bg-white/[0.03] border border-white/10 p-8 sm:p-12"
          >
            <style>{`
              .blog-content h1 { color: white; font-size: 1.75rem; font-weight: 800; margin: 2rem 0 1rem; line-height: 1.3; }
              .blog-content h2 { color: white; font-size: 1.4rem; font-weight: 700; margin: 1.75rem 0 0.75rem; line-height: 1.35; }
              .blog-content h3 { color: #e2e8f0; font-size: 1.15rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
              .blog-content p { margin: 0.9rem 0; color: #cbd5e1; }
              .blog-content ul, .blog-content ol { margin: 1rem 0 1rem 1.5rem; color: #cbd5e1; }
              .blog-content li { margin: 0.4rem 0; }
              .blog-content strong { color: white; font-weight: 600; }
              .blog-content a { color: #22d3ee; text-decoration: underline; }
              .blog-content blockquote { border-left: 3px solid #22d3ee; padding-left: 1rem; margin: 1.5rem 0; color: #94a3b8; font-style: italic; }
              .blog-content code { background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-size: 0.9em; color: #67e8f9; }
              .blog-content pre { background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin: 1.25rem 0; }
            `}</style>
            <div
              className="blog-content"
              style={{ fontSize: '1.05rem', lineHeight: '1.85' }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
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
                <span key={i} className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </motion.div>
          )}

          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Link
              to="/Blog"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 px-6 py-3 rounded-xl transition-all hover:bg-cyan-500/5"
            >
              <ArrowLeft className="w-4 h-4" />
              Alle artikler
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}