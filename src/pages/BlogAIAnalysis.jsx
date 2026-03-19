import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Brain, Cpu, Zap, Target, TrendingUp, Search,
  BarChart3, Link2, Hash, Globe, Shield, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Activity, Layers,
  FileText, Tag, Clock, Sparkles, Database, GitBranch, Eye
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Reusable hologram panel ──────────────────────────────────────────────────
function HoloPanel({ children, className = "", color = "cyan", glow = true }) {
  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(8,15,30,0.99) 100%)',
        borderColor: color === "cyan" ? "rgba(6,182,212,0.15)" : color === "violet" ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.15)",
        boxShadow: glow ? `0 0 40px ${color === "cyan" ? "rgba(6,182,212,0.05)" : color === "violet" ? "rgba(139,92,246,0.05)" : "rgba(16,185,129,0.05)"}` : "none"
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color === "cyan" ? "rgba(6,182,212,0.4)" : color === "violet" ? "rgba(139,92,246,0.4)" : "rgba(16,185,129,0.4)"}, transparent)` }} />
      {children}
    </div>
  );
}

// ── Expandable section ───────────────────────────────────────────────────────
function Section({ title, icon: Icon, color = "cyan", children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <HoloPanel color={color} className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${c.bg} border ${c.border}`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
          <span className={`font-semibold text-sm ${c.text}`}>{title}</span>
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.bg} border ${c.border} ${c.text} tracking-widest uppercase`}>{badge}</span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-500" />
          : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </HoloPanel>
  );
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, max = 100, color = "#22d3ee" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
    </div>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────
function Chip({ label, value, color = "cyan" }) {
  const c = { cyan: "#22d3ee", violet: "#a78bfa", emerald: "#34d399", amber: "#fbbf24", rose: "#f87171" };
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 min-w-[80px]">
      <span className="text-lg font-black" style={{ color: c[color] || c.cyan }}>{value}</span>
      <span className="text-[10px] text-slate-500 text-center mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function BlogAIAnalysis() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  useEffect(() => { window.scrollTo(0, 0); }, [postId]);

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost-analysis', postId],
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
          <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-violet-400/60 text-sm tracking-widest uppercase">Decoding AI Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-violet-500/20">
          <p className="text-violet-300 text-2xl mb-4">Analysis Not Found</p>
          <Link to="/Blog" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 justify-center">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived metrics from post data ──
  const wordCount = post.word_count || Math.round((post.content || "").replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length);
  const hasTable = (post.content || "").includes("<table");
  const hasFaq = (post.content || "").toLowerCase().includes("faq") || (post.content || "").toLowerCase().includes("frequently asked");
  const headingCount = (post.content || "").match(/<h[1-6]/gi)?.length || 0;
  const linkCount = (post.content || "").match(/<a /gi)?.length || 0;
  const internalLinks = (post.internal_links || []);
  const secondaryKws = post.secondary_keywords || [];
  const optHistory = post.optimization_history || [];
  const suggestions = post.ai_improvement_suggestions || [];
  const estimatedReadability = post.readability_score || Math.min(100, 45 + Math.round(wordCount / 60));
  const seoScore = post.seo_score || 0;

  // Content structure analysis
  const contentText = (post.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const avgSentenceLen = sentences.length ? Math.round(contentText.split(/\s+/).length / sentences.length) : 0;
  const paragraphCount = (post.content || "").match(/<p/gi)?.length || 0;
  const imageCount = (post.content || "").match(/<img/gi)?.length || 0;

  // Keyword density estimate
  const primaryKwWords = (post.primary_keyword || "").toLowerCase().split(/\s+/);
  const textLower = contentText.toLowerCase();
  const primaryKwOccurrences = primaryKwWords.length > 0
    ? Math.round(textLower.split(primaryKwWords[0]).length - 1)
    : 0;
  const kwDensity = wordCount > 0 ? ((primaryKwOccurrences / wordCount) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">

      {/* ── Holographic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "rgba(139,92,246,0.06)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "rgba(6,182,212,0.05)" }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-violet-500/10"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={`/BlogPostDetail?id=${postId}`}
            className="flex items-center gap-2 text-violet-400/70 hover:text-violet-300 transition-colors text-sm tracking-wider uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tilbage til indlæg</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2 text-violet-400/40 text-[10px] tracking-widest uppercase">
            <Brain className="w-3 h-3" />
            <span>AI Analyse · Dybdegående</span>
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

      {/* ── Main ── */}
      <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Hero title */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-400 tracking-widest uppercase mb-5">
              <Brain className="w-3 h-3" />
              AI-genereret indholdsanalyse
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3"
              style={{ background: "linear-gradient(135deg, #e2f8ff 0%, #a78bfa 60%, #f0abfc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Teknisk AI-analyse
            </h1>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              Komplet SEO-, indholds- og semantisk analyse af dette blogindlæg genereret af NexusVectis AI-motoren
            </p>
            <p className="text-slate-600 text-xs mt-2 italic">"{post.title}"</p>
          </motion.div>

          {/* ── KPI Row ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            <Chip label="SEO Score" value={`${seoScore}/100`} color="cyan" />
            <Chip label="Læsbarhed" value={`${estimatedReadability}/100`} color="violet" />
            <Chip label="Ordcount" value={wordCount.toLocaleString()} color="emerald" />
            <Chip label="Læsetid" value={`${post.read_time_minutes || '?'} min`} color="amber" />
            <Chip label="Overskrifter" value={headingCount} color="cyan" />
            <Chip label="Links" value={linkCount} color="violet" />
            <Chip label="Afsnit" value={paragraphCount} color="emerald" />
            <Chip label="Sætninger" value={sentences.length} color="amber" />
          </motion.div>

          {/* ── 1. Keyword Intelligence ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section title="Keyword Intelligence" icon={Hash} color="cyan" badge="Primær + Sekundær">
              <div className="space-y-5">
                {/* Primary keyword */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Primært søgeord</p>
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cyan-300 font-bold">{post.primary_keyword || "—"}</span>
                      <span className="text-[10px] text-cyan-500/60 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {post.search_intent || "informational"}
                      </span>
                    </div>
                    <ScoreBar label="Keyword Densitet" value={parseFloat(kwDensity)} max={3} color="#22d3ee" />
                    <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
                        <p className="text-cyan-400 font-bold">{primaryKwOccurrences}x</p>
                        <p className="text-[10px] text-slate-500">Forekomster</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
                        <p className="text-cyan-400 font-bold">{kwDensity}%</p>
                        <p className="text-[10px] text-slate-500">Densitet</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
                        <p className={`font-bold ${parseFloat(kwDensity) >= 0.5 && parseFloat(kwDensity) <= 2.5 ? "text-emerald-400" : "text-amber-400"}`}>
                          {parseFloat(kwDensity) >= 0.5 && parseFloat(kwDensity) <= 2.5 ? "Optimal" : "Juster"}
                        </p>
                        <p className="text-[10px] text-slate-500">Status</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary keywords */}
                {secondaryKws.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Sekundære søgeord ({secondaryKws.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {secondaryKws.map((kw, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/30 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span className="text-slate-300">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search intent explanation */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Søgeintention analyse</p>
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cyan-300 text-sm font-semibold capitalize mb-1">{post.search_intent || "Informational"}</p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {post.search_intent === "commercial"
                          ? "Brugeren overvejer et køb eller sammenligner løsninger. Indholdet er målrettet beslutningsfasen med konkrete fordele og sammenligningsdata."
                          : post.search_intent === "transactional"
                          ? "Brugeren er klar til at handle. Indholdet inkluderer direkte CTA'er og konverteringselementer."
                          : "Brugeren søger viden og forståelse. Indholdet er struktureret til at uddanne og informere med dyb faglig indsigt og konkrete eksempler."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 2. SEO Score Breakdown ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Section title="SEO Score Breakdown" icon={TrendingUp} color="violet" badge={`${seoScore}/100`}>
              <div className="space-y-3">
                <ScoreBar label="Titel-optimering" value={post.title && post.title.length >= 40 && post.title.length <= 65 ? 95 : 70} color="#a78bfa" />
                <ScoreBar label="Meta-description" value={post.excerpt && post.excerpt.length >= 120 && post.excerpt.length <= 160 ? 98 : 75} color="#a78bfa" />
                <ScoreBar label="Keyword i titel" value={post.title && post.primary_keyword && post.title.toLowerCase().includes((post.primary_keyword || "").toLowerCase().split(" ")[0]) ? 100 : 60} color="#a78bfa" />
                <ScoreBar label="Indholdsstruktur (H-tags)" value={headingCount >= 6 ? 95 : headingCount >= 3 ? 75 : 50} color="#a78bfa" />
                <ScoreBar label="Interne links" value={internalLinks.length >= 3 ? 90 : internalLinks.length >= 1 ? 65 : 40} color="#a78bfa" />
                <ScoreBar label="Indholdsvolumen" value={wordCount >= 1800 ? 100 : wordCount >= 1000 ? 75 : 50} color="#a78bfa" />
                <ScoreBar label="Tabel/datastruktur" value={hasTable ? 95 : 45} color="#a78bfa" />
                <ScoreBar label="FAQ-sektion" value={hasFaq ? 95 : 40} color="#a78bfa" />
                <ScoreBar label="Semantisk bredde" value={secondaryKws.length >= 5 ? 90 : secondaryKws.length >= 2 ? 65 : 40} color="#a78bfa" />
                <ScoreBar label="Billeder/media" value={imageCount > 0 ? 80 : 35} color="#a78bfa" />

                <div className="mt-4 p-4 rounded-xl border" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-violet-300 font-bold">Samlet SEO Score</span>
                    <span className="text-2xl font-black text-violet-400">{seoScore}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${seoScore}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)" }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    {seoScore >= 90 ? "Fremragende — indholdet er fuldt optimeret til søgemaskinerne." :
                     seoScore >= 75 ? "Godt — stærkt fundament med mulighed for forbedringer i semantik og struktur." :
                     "Under udvikling — kræver yderligere optimering af nøgleord og struktur."}
                  </p>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 3. Indholds-DNA ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section title="Indholds-DNA" icon={GitBranch} color="emerald">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Strukturelle egenskaber</p>
                  {[
                    { label: "Overskrifter (H1-H6)", value: headingCount, icon: Layers, good: headingCount >= 5 },
                    { label: "Afsnit", value: paragraphCount, icon: FileText, good: paragraphCount >= 8 },
                    { label: "Links totalt", value: linkCount, icon: Link2, good: linkCount >= 3 },
                    { label: "Interne links", value: internalLinks.length, icon: Link2, good: internalLinks.length >= 2 },
                    { label: "Billeder", value: imageCount, icon: Eye, good: imageCount >= 1 },
                    { label: "Har tabel", value: hasTable ? "Ja" : "Nej", icon: BarChart3, good: hasTable },
                    { label: "Har FAQ", value: hasFaq ? "Ja" : "Nej", icon: Search, good: hasFaq },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon className="w-3.5 h-3.5 text-slate-600" />
                          {item.label}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-semibold">{item.value}</span>
                          {item.good
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Tekstmekanik</p>
                  {[
                    { label: "Total ordantal", value: wordCount.toLocaleString() },
                    { label: "Sætningsantal", value: sentences.length },
                    { label: "Gns. sætningslængde", value: `${avgSentenceLen} ord` },
                    { label: "Læsbarhedsscore", value: `${estimatedReadability}/100` },
                    { label: "AI-model", value: post.ai_model || "gemini_3_flash" },
                    { label: "Søgeintention", value: post.search_intent || "informational" },
                    { label: "Konkurrent-gap", value: post.competitor_gap ? "Identificeret" : "Nej" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/50">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-emerald-300 font-semibold text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 4. Interne links ── */}
          {internalLinks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Section title="Interne links & linking-strategi" icon={Link2} color="cyan" defaultOpen={false}>
                <div className="space-y-2">
                  {internalLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 text-sm">
                      <span className="text-cyan-500/40 font-mono text-xs w-5">{i + 1}.</span>
                      <Link2 className="w-3.5 h-3.5 text-cyan-400/60 flex-shrink-0" />
                      <span className="text-cyan-300 font-mono text-xs">{link}</span>
                    </div>
                  ))}
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/20">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      <span className="text-cyan-400">Linking-strategi:</span> Interne links er strategisk placeret for at øge sideautoriteten og forbedre crawlability. Hvert link peger på en specifik landingsside eller produktside med høj konverteringsrelevans.
                    </p>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── 5. Optimeringshistorik ── */}
          {optHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <Section title="Optimeringshistorik" icon={Activity} color="amber" defaultOpen={false} badge={`${optHistory.length} kørsler`}>
                <div className="space-y-3">
                  {optHistory.map((run, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-amber-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-300 text-sm font-semibold">{run.action?.replace(/_/g, " ") || "Optimering"}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{run.date}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {run.previous_seo_score && run.new_seo_score && (
                          <span>
                            SEO: <span className="text-slate-400">{run.previous_seo_score}</span>
                            <span className="text-amber-400 mx-1">→</span>
                            <span className="text-emerald-400 font-bold">{run.new_seo_score}</span>
                            {run.new_seo_score > run.previous_seo_score && (
                              <span className="text-emerald-400 ml-1">+{run.new_seo_score - run.previous_seo_score}</span>
                            )}
                          </span>
                        )}
                        {run.word_count && <span>Ord: <span className="text-slate-300 font-semibold">{run.word_count?.toLocaleString()}</span></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── 6. AI-forbedringssuggestioner ── */}
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Section title="AI-forbedringssuggestioner" icon={Sparkles} color="violet" defaultOpen badge={`${suggestions.length} forslag`}>
                <div className="space-y-3">
                  {suggestions.map((s, i) => {
                    const priorityColor = s.priority === "high" ? "text-rose-400 border-rose-500/20 bg-rose-500/5" :
                      s.priority === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                      "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                    return (
                      <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${priorityColor}`}>
                            {s.priority}
                          </span>
                          <span className="text-[10px] text-violet-400/70 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5">
                            {s.type?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-1">{s.suggestion}</p>
                        {s.impact && (
                          <p className="text-[11px] text-violet-400/60 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Forventet impact: {s.impact}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── 7. Tags & Semantisk Profil ── */}
          {post.tags && post.tags.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
              <Section title="Tags & semantisk profil" icon={Tag} color="emerald" defaultOpen={false}>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                    {post.tags.length} semantiske signaltags identificeret af AI-motoren
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] text-emerald-400/70 bg-emerald-500/5 border border-emerald-500/15 px-3 py-1 rounded-full font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      <span className="text-emerald-400">Semantisk analyse:</span> Tags er udvalgt af AI-motoren baseret på co-occurrence og topical authority-signaler. De dækker relaterede søgeforespørgsler inden for samme semantiske klynge og styrker indholdsprofilet på tværs af Long-Tail-nøgleord.
                    </p>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── 8. Teknisk metadata ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
            <Section title="Teknisk metadata" icon={Database} color="cyan" defaultOpen={false}>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: "Post ID", value: post.id },
                  { label: "AI-model", value: post.ai_model || "gemini_3_flash" },
                  { label: "Oprettet", value: post.created_date ? new Date(post.created_date).toLocaleString("da-DK") : "—" },
                  { label: "Publiceret", value: post.published_at ? new Date(post.published_at).toLocaleString("da-DK") : "—" },
                  { label: "Sidst optimeret", value: post.last_optimized_at ? new Date(post.last_optimized_at).toLocaleString("da-DK") : "—" },
                  { label: "Forslag genereret", value: post.suggestions_generated_at ? new Date(post.suggestions_generated_at).toLocaleString("da-DK") : "—" },
                  { label: "AI-genereret", value: post.ai_generated ? "Ja" : "Nej" },
                  { label: "Konkurrent-gap", value: post.competitor_gap ? "Ja — identificeret hulrum" : "Nej" },
                  { label: "Status", value: post.status },
                  { label: "Estimeret trafik", value: `${post.performance_clicks || 0} klik/måned` },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/20 gap-3">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-cyan-300/80 font-mono text-right break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ── 9. Metode-note ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <HoloPanel color="violet" className="mt-4">
              <div className="px-5 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <p className="text-violet-400 text-xs font-bold uppercase tracking-widest">Analysemetode & kildeforklaring</p>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Dette blogindlæg er genereret af NexusVectis's autonome SEO-intelligensmotor, som kombinerer <span className="text-violet-300">store sprogmodeller (LLM)</span>, <span className="text-cyan-300">real-time branchedata</span> og <span className="text-emerald-300">semantisk analyse</span> fra millioner af logistik- og flådemanagementkilder. Indholdet er valideret mod Google's E-E-A-T-principper (Experience, Expertise, Authoritativeness, Trustworthiness) og optimeret til at matche søgeintentionen for primær-nøgleordet. Alle data i denne analyse er beregnet dynamisk ud fra postens faktiske HTML-indhold og gemte metadata.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Google E-E-A-T", "LLM-genereret", "Semantisk SEO", "Branchedata", "Real-time optimering"].map((tag, i) => (
                    <span key={i} className="text-[10px] text-violet-400/60 border border-violet-500/15 px-2 py-0.5 rounded-full bg-violet-500/5">{tag}</span>
                  ))}
                </div>
              </div>
            </HoloPanel>
          </motion.div>

          {/* ── Back CTAs ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`/BlogPostDetail?id=${postId}`}
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 border border-violet-500/25 hover:border-violet-400/50 px-7 py-3 rounded-xl transition-all hover:bg-violet-500/5 text-sm tracking-wider uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage til indlæg
            </Link>
            <Link
              to="/Blog"
              className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-300 border border-cyan-500/15 hover:border-cyan-400/30 px-7 py-3 rounded-xl transition-all text-sm tracking-wider uppercase"
            >
              Intelligence Feed
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}