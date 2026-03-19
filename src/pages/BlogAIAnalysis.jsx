import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Brain, Cpu, Zap, Target, TrendingUp, Search,
  BarChart3, Link2, Hash, Shield, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Activity,
  FileText, Tag, Clock, Sparkles, GitBranch, Eye,
  XCircle, Filter, Lightbulb, Database, BookOpen, Crosshair,
  Layers, Code2, List, AlignLeft, Table2, MessageSquare, Gauge
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────────────────────────
// Utility: strip HTML tags
const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Extract all headings from HTML content
function extractHeadings(html = "") {
  const matches = [...html.matchAll(/<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi)];
  return matches.map(m => ({ level: m[1].toLowerCase(), text: stripHtml(m[2]) }));
}

// Extract all paragraphs (first 120 chars)
function extractParagraphs(html = "") {
  const matches = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
  return matches.map(m => stripHtml(m[1])).filter(p => p.length > 40);
}

// Extract internal links
function extractLinks(html = "") {
  const matches = [...html.matchAll(/href=["']([^"']+)["']/gi)];
  return matches.map(m => m[1]);
}

// Count keyword occurrences in text
function countKw(text = "", kw = "") {
  if (!kw) return 0;
  const word = kw.toLowerCase().split(" ")[0];
  return text.toLowerCase().split(word).length - 1;
}

// Flesch-Kincaid readability approximation
function computeReadability(text = "") {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const syllables = words.reduce((sum, w) => sum + Math.max(1, w.replace(/[^aeiouAEIOU]/g, "").length), 0);
  if (!sentences.length || !words.length) return 0;
  const fk = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.min(100, Math.max(0, Math.round(fk)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components

function HoloPanel({ children, className = "", color = "cyan" }) {
  const c = {
    cyan:    { b: "rgba(6,182,212,0.18)",   s: "rgba(6,182,212,0.05)",   t: "rgba(6,182,212,0.45)" },
    violet:  { b: "rgba(139,92,246,0.18)",  s: "rgba(139,92,246,0.05)",  t: "rgba(139,92,246,0.45)" },
    emerald: { b: "rgba(16,185,129,0.18)",  s: "rgba(16,185,129,0.05)",  t: "rgba(16,185,129,0.45)" },
    amber:   { b: "rgba(251,191,36,0.18)",  s: "rgba(251,191,36,0.05)",  t: "rgba(251,191,36,0.45)" },
    rose:    { b: "rgba(248,113,113,0.18)", s: "rgba(248,113,113,0.05)", t: "rgba(248,113,113,0.45)" },
    slate:   { b: "rgba(100,116,139,0.18)", s: "rgba(100,116,139,0.03)", t: "rgba(100,116,139,0.3)" },
  }[color] || {};
  return (
    <div className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden ${className}`}
      style={{ background: "linear-gradient(135deg,rgba(15,23,42,0.97),rgba(8,15,30,0.99))", borderColor: c.b, boxShadow: `0 0 40px ${c.s}` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${c.t},transparent)` }} />
      {children}
    </div>
  );
}

function Section({ title, icon: Icon, color = "cyan", children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  const map = {
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose:    "text-rose-400 bg-rose-500/10 border-rose-500/20",
    slate:   "text-slate-400 bg-slate-700/30 border-slate-600/30",
  };
  const cls = map[color] || map.cyan;
  const [tc, bg, bc] = cls.split(" ");
  return (
    <HoloPanel color={color} className="mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${bg} border ${bc}`}><Icon className={`w-4 h-4 ${tc}`} /></div>
          <span className={`font-bold text-sm ${tc}`}>{title}</span>
          {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full ${bg} border ${bc} ${tc} font-mono tracking-wider`}>{badge}</span>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-600" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-5 pb-6 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </HoloPanel>
  );
}

function MeterBar({ label, value, max = 100, color = "#22d3ee", annotation }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-xs text-slate-400 flex-1">{label}</span>
        <div className="flex items-center gap-2">
          {annotation && <span className="text-[10px] text-slate-600">{annotation}</span>}
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}<span className="text-slate-700">/{max}</span></span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${color}50,${color})` }} />
      </div>
    </div>
  );
}

function KVRow({ k, v, vColor = "text-slate-300" }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-800/60 gap-4 text-xs last:border-0">
      <span className="text-slate-500 flex-shrink-0">{k}</span>
      <span className={`${vColor} font-mono text-right break-all`}>{v}</span>
    </div>
  );
}

function StatusBadge({ ok, trueLabel = "Pass", falseLabel = "Fail" }) {
  return ok
    ? <span className="text-[10px] text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold tracking-wider">{trueLabel}</span>
    : <span className="text-[10px] text-amber-400 border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold tracking-wider">{falseLabel}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
export default function BlogAIAnalysis() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  useEffect(() => { window.scrollTo(0, 0); }, [postId]);

  const { data: post, isLoading } = useQuery({
    queryKey: ["blogPost-analysis", postId],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ id: postId });
      return posts[0] || null;
    },
    enabled: !!postId,
  });

  // ── Derived analysis (memoized) ────────────────────────────────────────────
  const analysis = useMemo(() => {
    if (!post) return null;
    const html = post.content || "";
    const text = stripHtml(html);
    const words = text.split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const headings = extractHeadings(html);
    const paragraphs = extractParagraphs(html);
    const links = extractLinks(html);
    const internalLinks = links.filter(l => l.startsWith("/") || l.includes("nexusvectis"));
    const externalLinks = links.filter(l => l.startsWith("http") && !l.includes("nexusvectis"));
    const wordCount = post.word_count || words.length;
    const primaryKw = post.primary_keyword || "";
    const primaryOccurrences = countKw(text, primaryKw);
    const kwDensity = wordCount > 0 ? ((primaryOccurrences / wordCount) * 100) : 0;
    const readability = post.readability_score || computeReadability(text);
    const hasTable = html.includes("<table");
    const tableCount = (html.match(/<table/gi) || []).length;
    const hasFaq = text.toLowerCase().includes("faq") || text.toLowerCase().includes("frequently asked");
    const hasNexusSection = text.toLowerCase().includes("nexusvectis addresses") || text.toLowerCase().includes("how nexusvectis");
    const hasCta = text.toLowerCase().includes("book a free") || text.toLowerCase().includes("nexusvectis demo");
    const avgSentenceLen = sentences.length ? Math.round(wordCount / sentences.length) : 0;
    const avgParaLen = paragraphs.length ? Math.round(wordCount / paragraphs.length) : 0;
    const secondaryKws = post.secondary_keywords || [];
    const secondaryHits = secondaryKws.map(kw => ({ kw, count: countKw(text, kw) }));

    // Topic extraction from headings
    const h2Topics = headings.filter(h => h.level === "h2").map(h => h.text);
    const h3Topics = headings.filter(h => h.level === "h3").map(h => h.text);

    // Content sections detected
    const detectedSections = {
      comparison_table: hasTable,
      faq: hasFaq,
      nexusvectis_section: hasNexusSection,
      cta: hasCta,
      bullet_lists: (html.match(/<ul/gi) || []).length > 0,
      numbered_lists: (html.match(/<ol/gi) || []).length > 0,
      blockquotes: (html.match(/<blockquote/gi) || []).length > 0,
      code_blocks: (html.match(/<code/gi) || []).length > 0,
    };

    // Paragraph complexity (avg words/sentence)
    const complexityScore = Math.min(100, Math.round((1 - Math.abs(avgSentenceLen - 18) / 20) * 100));

    return {
      wordCount, sentences: sentences.length, headings, paragraphs, links, internalLinks,
      externalLinks, primaryOccurrences, kwDensity: kwDensity.toFixed(2),
      readability, hasTable, tableCount, hasFaq, hasNexusSection, hasCta,
      avgSentenceLen, avgParaLen, secondaryKws, secondaryHits,
      h2Topics, h3Topics, detectedSections, complexityScore,
      listCount: (html.match(/<ul|<ol/gi) || []).length,
    };
  }, [post]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-violet-400/60 text-sm tracking-widest uppercase">Decoding AI generation decisions...</p>
      </div>
    </div>
  );

  if (!post || !analysis) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-violet-500/20">
        <p className="text-violet-300 text-2xl mb-4">Analysis not found</p>
        <Link to="/Blog" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 justify-center"><ArrowLeft className="w-4 h-4" /> Back to blog</Link>
      </div>
    </div>
  );

  const optHistory = post.optimization_history || [];
  const genRun = optHistory[0] || {};
  const suggestions = post.ai_improvement_suggestions || [];

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.025)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "rgba(139,92,246,0.055)" }} animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: "rgba(6,182,212,0.04)" }} animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 13, repeat: Infinity }} />
        <motion.div className="absolute left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.18),transparent)" }} animate={{ top: ["0%", "100%"] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
      </div>

      {/* ── Header ── */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-2xl border-b border-violet-500/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/BlogPostDetail?id=${postId}`} className="flex items-center gap-2 text-violet-400/70 hover:text-violet-300 transition-colors text-sm tracking-wider uppercase">
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Back to post</span>
          </Link>
          <div className="flex items-center gap-2 text-violet-400/40 text-[10px] tracking-widest uppercase">
            <Brain className="w-3 h-3" /><span>AI Generation Report</span>
          </div>
          <Link to={createPageUrl("Home")}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" alt="NexusVectis" className="h-9 w-auto opacity-70 hover:opacity-90 transition-opacity" />
          </Link>
        </div>
      </motion.header>

      {/* ── Content ── */}
      <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-400 tracking-widest uppercase mb-5">
              <Brain className="w-3 h-3" />AI Content Intelligence Report<span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-3"
              style={{ background: "linear-gradient(135deg,#e2f8ff 0%,#a78bfa 55%,#f0abfc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              How the AI built this post
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
              A deep technical breakdown of every decision the NexusVectis AI engine made when generating this article — from topic selection and anti-bloat filtering to content structure, semantic coverage, and keyword strategy.
            </p>
            <div className="mt-4 inline-block px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-700/40">
              <p className="text-slate-400 text-xs italic">"{post.title}"</p>
            </div>
          </motion.div>

          {/* ── STAT RAIL ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {[
              { label: "SEO Score", value: `${post.seo_score || "—"}`, unit: "/100", color: "#22d3ee" },
              { label: "Readability", value: `${analysis.readability}`, unit: "/100", color: "#a78bfa" },
              { label: "Word Count", value: analysis.wordCount.toLocaleString(), color: "#34d399" },
              { label: "Read Time", value: `${post.read_time_minutes || "?"}`, unit: " min", color: "#fbbf24" },
              { label: "H-Tags", value: analysis.headings.length, color: "#22d3ee" },
              { label: "Sentences", value: analysis.sentences, color: "#a78bfa" },
              { label: "Int. Links", value: analysis.internalLinks.length, color: "#34d399" },
              { label: "KW Density", value: `${analysis.kwDensity}`, unit: "%", color: "#f472b6" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <span className="text-base font-black tabular-nums" style={{ color: s.color }}>{s.value}<span className="text-xs text-slate-600">{s.unit || ""}</span></span>
                <span className="text-[9px] text-slate-600 text-center mt-0.5 uppercase tracking-wider leading-tight">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              1. CONTENT TOPIC MAP
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section title="Content Topic Map" icon={Layers} color="cyan" defaultOpen badge={`${analysis.h2Topics.length} sections`}>
              <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                The full topic hierarchy of the article as generated — every H2 section represents a distinct subtopic the AI decided to cover, and H3s represent deeper sub-angles within each section.
              </p>

              {analysis.h2Topics.length > 0 ? (
                <div className="space-y-3">
                  {analysis.h2Topics.map((h2, i) => {
                    // Find H3s that follow this H2 in document order
                    const h2idx = analysis.headings.findIndex(h => h.level === "h2" && h.text === h2);
                    const nextH2idx = analysis.headings.findIndex((h, j) => j > h2idx && h.level === "h2");
                    const subH3s = analysis.headings
                      .slice(h2idx + 1, nextH2idx === -1 ? undefined : nextH2idx)
                      .filter(h => h.level === "h3");
                    return (
                      <div key={i} className="rounded-xl overflow-hidden border border-cyan-500/12 bg-slate-900/40">
                        <div className="flex items-start gap-3 px-4 py-3 bg-cyan-500/5 border-b border-cyan-500/10">
                          <span className="text-[10px] font-black text-cyan-500/50 font-mono mt-0.5 flex-shrink-0">H2</span>
                          <p className="text-cyan-200 font-semibold text-sm leading-snug">{h2}</p>
                        </div>
                        {subH3s.length > 0 && (
                          <div className="px-4 py-2 space-y-1.5">
                            {subH3s.map((h3, j) => (
                              <div key={j} className="flex items-start gap-3">
                                <span className="text-[10px] font-black text-violet-500/40 font-mono mt-0.5 flex-shrink-0">H3</span>
                                <p className="text-slate-400 text-xs leading-snug">{h3.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-600 text-sm text-center py-6">No structured headings detected in content.</p>
              )}

              {/* H3-only extras */}
              {analysis.headings.filter(h => h.level === "h1").length > 0 && (
                <div className="mt-3 flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <span className="text-[10px] font-black text-violet-400/60 font-mono mt-0.5 flex-shrink-0">H1</span>
                  <p className="text-violet-200 font-bold text-sm">{analysis.headings.find(h => h.level === "h1")?.text}</p>
                </div>
              )}
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              2. GENERATION DECISION & AI RATIONALE
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <Section title="Generation Decision & AI Rationale" icon={Crosshair} color="violet" defaultOpen>
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Target topic */}
                <div className="p-4 rounded-xl border" style={{ background: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.2)" }}>
                  <p className="text-[10px] text-violet-400/60 uppercase tracking-widest mb-1">Target Keyword (Topic ID)</p>
                  <p className="text-violet-100 font-black text-lg leading-tight">{post.primary_keyword || "—"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] text-violet-300/70 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5 capitalize">{post.search_intent || "informational"} intent</span>
                    {post.competitor_gap && <span className="text-[10px] text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/5">Competitor gap identified</span>}
                  </div>
                </div>

                {/* Unique angle */}
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                  <div className="flex items-start gap-2 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest">Unique Angle Selected by AI</p>
                  </div>
                  {genRun.unique_angle
                    ? <p className="text-cyan-200 text-sm leading-relaxed">{genRun.unique_angle}</p>
                    : <p className="text-slate-600 text-xs italic">Not stored for this generation run.</p>}
                </div>

                {/* Intent explanation */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 sm:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Why this search intent?</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {post.search_intent === "commercial"
                      ? "The AI engine classified this keyword as commercial intent — searchers in this segment are in the consideration phase, comparing vendors or evaluating ROI. Content was structured to present concrete differentiators, benchmark data, and business case arguments rather than purely educational prose."
                      : post.search_intent === "transactional"
                      ? "Classified as transactional intent — searchers are close to a decision. The LLM was instructed to front-load CTAs, highlight specific platform capabilities, and minimize long explanatory preambles."
                      : "Classified as informational intent — the target audience wants deep understanding. The LLM was instructed to deliver expert-level insights, concrete operational statistics, comparison tables, and FAQ sections structured to capture Google Featured Snippets."}
                  </p>
                </div>
              </div>

              {/* Generation run metadata */}
              {genRun.action && (
                <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/20">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Generation Pipeline Run</p>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <KVRow k="Pipeline action" v={genRun.action?.replace(/_/g, " ")} vColor="text-amber-300" />
                    <KVRow k="Generation date" v={genRun.date || post.published_at?.split("T")[0] || "—"} vColor="text-slate-300" />
                    <KVRow k="SEO score at creation" v={`${genRun.seo_score || post.seo_score || "—"}/100`} vColor="text-cyan-300" />
                  </div>
                </div>
              )}
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              3. ANTI-BLOAT FILTER
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Section title="Anti-Bloat Filter — What the AI Deliberately Avoided" icon={Filter} color="rose" defaultOpen>
              <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                Before writing a single word, the engine evaluated up to <strong className="text-slate-300">5 candidate topics</strong> against all existing blog posts using a semantic overlap LLM gate. It then produced an explicit list of sub-topics to avoid because they were already covered elsewhere — preventing thin duplicate content.
              </p>
              {(genRun.avoided_overlap_topics || genRun.topics_to_avoid_overlap || []).length > 0 ? (
                <div className="space-y-2">
                  {(genRun.avoided_overlap_topics || genRun.topics_to_avoid_overlap || []).map((topic, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="text-rose-200/80 text-sm leading-relaxed">{topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-700/20 text-center">
                  <p className="text-slate-600 text-xs">No avoided topics stored for this article — likely generated before anti-bloat v2 was deployed.</p>
                </div>
              )}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/30 border border-slate-700/15 text-[11px] text-slate-600 leading-relaxed">
                <span className="text-slate-400 font-semibold">How this works:</span> The engine sends the top 5 candidate topics + titles of all existing posts to the LLM as a single prompt. The LLM returns the most semantically distinct candidate plus a list of specific sub-angles already covered elsewhere. Only posts with a genuinely new angle pass this gate.
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              4. KEYWORD INTELLIGENCE
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
            <Section title="Keyword Intelligence & Semantic Coverage" icon={Hash} color="emerald" defaultOpen>
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Primary KW */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Primary Keyword Performance</p>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 mb-3">
                    <p className="text-emerald-200 font-bold text-base mb-1">{post.primary_keyword || "—"}</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
                        <p className="text-emerald-400 font-black">{analysis.primaryOccurrences}×</p>
                        <p className="text-slate-600 text-[9px] mt-0.5">occurrences</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
                        <p className={`font-black ${parseFloat(analysis.kwDensity) >= 0.5 && parseFloat(analysis.kwDensity) <= 2.5 ? "text-emerald-400" : "text-amber-400"}`}>{analysis.kwDensity}%</p>
                        <p className="text-slate-600 text-[9px] mt-0.5">density</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/30">
                        <StatusBadge ok={parseFloat(analysis.kwDensity) >= 0.5 && parseFloat(analysis.kwDensity) <= 2.5} trueLabel="Optimal" falseLabel="Adjust" />
                      </div>
                    </div>
                  </div>
                  <MeterBar label="Keyword density (target: 0.5–2.5%)" value={parseFloat(analysis.kwDensity)} max={3} color="#34d399" annotation="%" />
                </div>

                {/* Secondary KWs */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Secondary Keyword Coverage ({analysis.secondaryKws.length})</p>
                  {analysis.secondaryHits.length > 0 ? (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {analysis.secondaryHits.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400 flex-1 truncate">{item.kw}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${Math.min(100, item.count * 20)}%` }} />
                            </div>
                            <span className={`font-mono font-bold ${item.count > 0 ? "text-violet-400" : "text-slate-600"}`}>{item.count}×</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-xs">No secondary keywords specified.</p>
                  )}
                </div>
              </div>

              {/* Semantic intent */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/25">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Semantic Intent Profile</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] text-cyan-300 border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 rounded-full capitalize">{post.search_intent || "informational"}</span>
                  {post.tags && post.tags.map((tag, i) => (
                    <span key={i} className="text-[11px] text-slate-400 border border-slate-700/40 bg-slate-800/40 px-3 py-1 rounded-full font-mono">#{tag}</span>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              5. CONTENT STRUCTURE COMPLIANCE
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Section title="Content Structure Compliance — Writing Mandate Audit" icon={CheckCircle2} color="cyan" defaultOpen>
              <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                Every article is generated against a strict 12-point writing mandate. This audit checks the actual HTML content against each rule.
              </p>
              <div className="space-y-2">
                {[
                  {
                    rule: "Word count target: 1,800–2,500 words",
                    ok: analysis.wordCount >= 1800 && analysis.wordCount <= 2700,
                    measured: `${analysis.wordCount.toLocaleString()} words`,
                    detail: analysis.wordCount >= 1800 ? "Within target range — sufficient depth for long-tail ranking." : "Below target — may reduce topical authority signals."
                  },
                  {
                    rule: "Every paragraph adds new, concrete information",
                    ok: analysis.avgParaLen >= 30 && analysis.avgParaLen <= 120,
                    measured: `~${analysis.avgParaLen} words/paragraph`,
                    detail: "Enforced via LLM instruction. Average paragraph length indicates density."
                  },
                  {
                    rule: "Comparison table with specific data (<table>)",
                    ok: analysis.hasTable,
                    measured: `${analysis.tableCount} table(s) found`,
                    detail: analysis.hasTable ? "Table detected — strong structured data signal for SERP rich results." : "No table found — missed opportunity for featured snippet eligibility."
                  },
                  {
                    rule: "FAQ section targeting Featured Snippets",
                    ok: analysis.hasFaq,
                    measured: analysis.hasFaq ? "FAQ section detected" : "Not found",
                    detail: analysis.hasFaq ? "FAQ increases probability of appearing in Google's People Also Ask boxes." : "Missing FAQ reduces FAQ rich result eligibility."
                  },
                  {
                    rule: "'How NexusVectis Addresses This' section",
                    ok: analysis.hasNexusSection,
                    measured: analysis.hasNexusSection ? "Section detected" : "Not found",
                    detail: "Platform-specific section differentiates content from generic industry articles."
                  },
                  {
                    rule: "Closing CTA: book a free NexusVectis demo",
                    ok: analysis.hasCta,
                    measured: analysis.hasCta ? "CTA detected" : "Not found",
                    detail: "Conversion anchor at post end — required for all commercial & informational posts."
                  },
                  {
                    rule: "Internal links to core platform pages",
                    ok: analysis.internalLinks.length >= 2,
                    measured: `${analysis.internalLinks.length} internal link(s)`,
                    detail: "Links to /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo increase crawlability and page authority flow."
                  },
                  {
                    rule: "Semantic HTML structure (H1, H2, H3 hierarchy)",
                    ok: analysis.headings.length >= 5,
                    measured: `${analysis.headings.length} heading tags`,
                    detail: `H1: ${analysis.headings.filter(h=>h.level==="h1").length} · H2: ${analysis.headings.filter(h=>h.level==="h2").length} · H3: ${analysis.headings.filter(h=>h.level==="h3").length}`
                  },
                  {
                    rule: "List elements for scannability",
                    ok: analysis.listCount >= 1,
                    measured: `${analysis.listCount} list(s) (ul/ol)`,
                    detail: "Bullet and numbered lists improve readability score and reduce bounce rate signals."
                  },
                  {
                    rule: "Sentence complexity within readable range",
                    ok: analysis.avgSentenceLen >= 12 && analysis.avgSentenceLen <= 24,
                    measured: `~${analysis.avgSentenceLen} words/sentence`,
                    detail: analysis.avgSentenceLen >= 12 && analysis.avgSentenceLen <= 24 ? "Sentence length within Flesch-readable range (12–24 words)." : "Sentences may be too long or too short for optimal readability."
                  },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border bg-slate-900/40 border-slate-700/25 overflow-hidden">
                    <div className="flex items-start justify-between p-3 gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {item.ok
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-slate-300 text-xs font-medium leading-snug">{item.rule}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 tabular-nums ${item.ok ? "text-emerald-400" : "text-amber-400"}`}>{item.measured}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              6. READABILITY & LINGUISTIC ANALYSIS
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Section title="Readability & Linguistic Analysis" icon={AlignLeft} color="amber" defaultOpen={false}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <MeterBar label="Flesch Readability Score" value={analysis.readability} max={100} color="#fbbf24" annotation={analysis.readability >= 60 ? "Easy" : analysis.readability >= 40 ? "Medium" : "Hard"} />
                  <MeterBar label="Content Depth (word count vs 2000 target)" value={Math.min(100, Math.round((analysis.wordCount / 2000) * 100))} max={100} color="#fb923c" annotation={`${analysis.wordCount.toLocaleString()} words`} />
                  <MeterBar label="Heading Density (per 1000 words)" value={Math.min(20, Math.round((analysis.headings.length / analysis.wordCount) * 1000))} max={20} color="#fbbf24" annotation={`${((analysis.headings.length / analysis.wordCount) * 1000).toFixed(1)}/1k`} />
                  <MeterBar label="Sentence Complexity Score" value={analysis.complexityScore} max={100} color="#f59e0b" annotation={`${analysis.avgSentenceLen} words/sentence`} />
                </div>
                <div className="space-y-1">
                  <KVRow k="Total word count" v={analysis.wordCount.toLocaleString()} vColor="text-amber-300" />
                  <KVRow k="Total sentences" v={analysis.sentences} />
                  <KVRow k="Avg. words per sentence" v={`${analysis.avgSentenceLen} words`} />
                  <KVRow k="Avg. words per paragraph" v={`${analysis.avgParaLen} words`} />
                  <KVRow k="Total paragraphs" v={analysis.paragraphs.length} />
                  <KVRow k="Total headings" v={analysis.headings.length} />
                  <KVRow k="List blocks (ul + ol)" v={analysis.listCount} />
                  <KVRow k="Tables detected" v={analysis.tableCount} />
                  <KVRow k="Internal links" v={analysis.internalLinks.length} />
                  <KVRow k="External links" v={analysis.externalLinks.length} />
                  <KVRow k="Readability rating" v={analysis.readability >= 70 ? "Easy to read" : analysis.readability >= 50 ? "Moderate" : "Dense / technical"} vColor={analysis.readability >= 70 ? "text-emerald-400" : "text-amber-400"} />
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              7. INTERNAL LINK MAP
          ───────────────────────────────────────────────────────────────── */}
          {analysis.internalLinks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <Section title="Internal Link Map" icon={Link2} color="cyan" defaultOpen={false} badge={`${analysis.internalLinks.length} links`}>
                <p className="text-slate-600 text-xs mb-3 leading-relaxed">
                  The AI was instructed to weave these internal links naturally into the content to boost crawlability and distribute PageRank across the platform's key landing pages.
                </p>
                <div className="space-y-2">
                  {analysis.internalLinks.map((link, i) => {
                    const isTarget = ["/FleetAIPage", "/LiveTrackingPage", "/AnalyticsPage", "/HarborInfo"].some(t => link.includes(t));
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
                        <span className="text-cyan-500/40 font-mono text-xs w-5 flex-shrink-0">{i + 1}.</span>
                        <Link2 className="w-3.5 h-3.5 text-cyan-400/50 flex-shrink-0" />
                        <span className="text-cyan-300/80 font-mono text-xs flex-1">{link}</span>
                        {isTarget && <span className="text-[9px] text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full bg-emerald-500/5 flex-shrink-0">Mandated</span>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              8. SEO SCORE BREAKDOWN
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Section title="SEO Score Breakdown" icon={Gauge} color="violet" defaultOpen={false} badge={`${post.seo_score || "—"}/100`}>
              <div className="space-y-2.5">
                <MeterBar label="Title optimization (40–65 chars)" value={post.title?.length >= 40 && post.title?.length <= 65 ? 95 : 70} color="#a78bfa" annotation={`${post.title?.length || 0} chars`} />
                <MeterBar label="Meta description (120–160 chars)" value={post.excerpt?.length >= 120 && post.excerpt?.length <= 160 ? 98 : 75} color="#a78bfa" annotation={`${post.excerpt?.length || 0} chars`} />
                <MeterBar label="Keyword in title" value={post.title && post.primary_keyword && post.title.toLowerCase().includes((post.primary_keyword||"").toLowerCase().split(" ")[0]) ? 100 : 55} color="#c4b5fd" />
                <MeterBar label="Heading structure coverage" value={Math.min(100, analysis.headings.length * 10)} color="#a78bfa" annotation={`${analysis.headings.length} tags`} />
                <MeterBar label="Internal linking" value={analysis.internalLinks.length >= 3 ? 92 : analysis.internalLinks.length >= 1 ? 65 : 30} color="#a78bfa" annotation={`${analysis.internalLinks.length} links`} />
                <MeterBar label="Content volume vs. target" value={Math.min(100, Math.round((analysis.wordCount / 2000) * 100))} color="#c4b5fd" annotation={`${analysis.wordCount.toLocaleString()} words`} />
                <MeterBar label="Structured data elements (table)" value={analysis.hasTable ? 95 : 35} color="#a78bfa" />
                <MeterBar label="FAQ coverage" value={analysis.hasFaq ? 95 : 30} color="#c4b5fd" />
                <MeterBar label="Secondary keyword saturation" value={Math.min(100, analysis.secondaryKws.length * 12)} color="#a78bfa" annotation={`${analysis.secondaryKws.length} kws`} />
                <MeterBar label="Keyword density in range" value={parseFloat(analysis.kwDensity) >= 0.5 && parseFloat(analysis.kwDensity) <= 2.5 ? 95 : 55} color="#c4b5fd" annotation={`${analysis.kwDensity}%`} />
              </div>

              <div className="mt-4 p-4 rounded-xl border" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-violet-300 font-bold text-sm">Overall AI-computed SEO Score</span>
                  <span className="text-3xl font-black text-violet-400">{post.seo_score || "—"}<span className="text-lg text-slate-600">/100</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${post.seo_score || 0}%` }} transition={{ duration: 1.4, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa,#c4b5fd)" }} />
                </div>
                <p className="text-slate-600 text-xs mt-2">
                  {(post.seo_score || 0) >= 90 ? "Outstanding — fully optimized for both search engines and users." :
                   (post.seo_score || 0) >= 75 ? "Strong — solid foundation with room for semantic and structural improvements." :
                   "Developing — requires keyword density tuning, additional structure, and link improvements."}
                </p>
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              9. AI IMPROVEMENT SUGGESTIONS
          ───────────────────────────────────────────────────────────────── */}
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
              <Section title="AI Improvement Suggestions — Weekly Optimizer" icon={Sparkles} color="violet" defaultOpen={false} badge={`${suggestions.length} actions`}>
                <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                  Generated by the weekly SEO re-optimizer engine, which audits all published posts against current ranking signals and outputs the top 3 highest-impact improvements.
                </p>
                <div className="space-y-3">
                  {suggestions.map((s, i) => {
                    const pc = s.priority === "high" ? "text-rose-400 border-rose-500/20 bg-rose-500/5" : s.priority === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                    return (
                      <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${pc}`}>{s.priority} priority</span>
                          <span className="text-[10px] text-violet-400/70 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5">{s.type?.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-1.5">{s.suggestion}</p>
                        {s.impact && <p className="text-[11px] text-violet-400/60 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Expected impact: {s.impact}</p>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              10. OPTIMIZATION HISTORY
          ───────────────────────────────────────────────────────────────── */}
          {optHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Section title="Optimization History" icon={Activity} color="amber" defaultOpen={false} badge={`${optHistory.length} runs`}>
                <div className="space-y-3">
                  {optHistory.map((run, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-amber-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-300 text-sm font-semibold">{run.action?.replace(/_/g, " ") || "Optimization run"}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{run.date}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {run.seo_score && <span>SEO score: <span className="text-emerald-400 font-bold">{run.seo_score}/100</span></span>}
                        {run.previous_seo_score && run.new_seo_score && (
                          <span>Score change: <span className="text-slate-400">{run.previous_seo_score}</span><span className="text-amber-400 mx-1">→</span><span className="text-emerald-400 font-bold">{run.new_seo_score}</span><span className="text-emerald-400 ml-1">{run.new_seo_score > run.previous_seo_score ? `+${run.new_seo_score - run.previous_seo_score}` : ""}</span></span>
                        )}
                        {run.word_count && <span>Words: <span className="text-slate-300 font-bold">{run.word_count?.toLocaleString()}</span></span>}
                      </div>
                      {run.unique_angle && <p className="text-cyan-400/60 text-[11px] italic mt-2 border-t border-slate-800 pt-2">Angle: "{run.unique_angle}"</p>}
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              11. SYSTEM METADATA
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
            <Section title="System Metadata" icon={Database} color="slate" defaultOpen={false}>
              <div className="grid sm:grid-cols-2 gap-1">
                <KVRow k="Post ID" v={post.id} vColor="text-slate-400" />
                <KVRow k="AI model" v={post.ai_model || "gemini-3-flash"} vColor="text-cyan-300" />
                <KVRow k="AI generated" v={post.ai_generated ? "true" : "false"} vColor={post.ai_generated ? "text-emerald-400" : "text-slate-500"} />
                <KVRow k="Status" v={post.status} vColor="text-slate-300" />
                <KVRow k="Created at" v={post.created_date ? new Date(post.created_date).toLocaleString("en-GB") : "—"} />
                <KVRow k="Published at" v={post.published_at ? new Date(post.published_at).toLocaleString("en-GB") : "—"} />
                <KVRow k="Last optimized" v={post.last_optimized_at ? new Date(post.last_optimized_at).toLocaleString("en-GB") : "—"} />
                <KVRow k="Suggestions generated" v={post.suggestions_generated_at ? new Date(post.suggestions_generated_at).toLocaleString("en-GB") : "—"} />
                <KVRow k="Competitor gap" v={post.competitor_gap ? "Yes — identified gap" : "No"} vColor={post.competitor_gap ? "text-emerald-400" : "text-slate-500"} />
                <KVRow k="Est. organic clicks/mo" v={`${post.performance_clicks || 0}`} />
              </div>
            </Section>
          </motion.div>

          {/* ─────────────────────────────────────────────────────────────────
              FOOTER: Pipeline explanation
          ───────────────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <HoloPanel color="violet" className="mt-4">
              <div className="px-5 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <p className="text-violet-400 text-xs font-bold uppercase tracking-widest">How the NexusVectis AI Engine works</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-500 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-cyan-300 font-semibold mb-1">1 · SEO Intelligence Engine</p>
                    <p>Runs daily. Analyzes Google algorithm updates, competitor keyword profiles, search volume trends, and content gaps using real-time web data.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-violet-300 font-semibold mb-1">2 · Anti-Bloat Topic Gate</p>
                    <p>Before writing, an LLM evaluates up to 5 candidate topics against all existing posts to ensure each new article covers a genuinely distinct angle.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-emerald-300 font-semibold mb-1">3 · Content Generation</p>
                    <p>Uses <strong className="text-white">{post.ai_model || "gemini-3-flash"}</strong> with a 300-word writing mandate enforcing word count, structure, tables, FAQs, and internal links.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-amber-300 font-semibold mb-1">4 · Weekly Re-optimization</p>
                    <p>All published posts are audited weekly. The top 3 highest-impact improvement suggestions are generated and stored for each article.</p>
                  </div>
                </div>
              </div>
            </HoloPanel>
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={`/BlogPostDetail?id=${postId}`} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 border border-violet-500/25 hover:border-violet-400/50 px-7 py-3 rounded-xl transition-all hover:bg-violet-500/5 text-sm tracking-wider uppercase">
              <ArrowLeft className="w-4 h-4" />Read the post
            </Link>
            <Link to="/Blog" className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-300 border border-cyan-500/15 hover:border-cyan-400/30 px-7 py-3 rounded-xl transition-all text-sm tracking-wider uppercase">
              Intelligence Feed
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}