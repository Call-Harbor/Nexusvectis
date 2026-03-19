import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  ArrowLeft, Brain, Cpu, Zap, Target, TrendingUp, Search,
  BarChart3, Link2, Hash, Shield, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Activity,
  FileText, Tag, Clock, Sparkles, GitBranch, Eye,
  XCircle, Filter, Lightbulb, Database, BookOpen, Crosshair
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence as AP } from "framer-motion";

// ── Hologram panel ───────────────────────────────────────────────────────────
function HoloPanel({ children, className = "", color = "cyan" }) {
  const colors = {
    cyan:   { border: "rgba(6,182,212,0.18)",   glow: "rgba(6,182,212,0.05)",   bar: "rgba(6,182,212,0.4)" },
    violet: { border: "rgba(139,92,246,0.18)",  glow: "rgba(139,92,246,0.05)",  bar: "rgba(139,92,246,0.4)" },
    emerald:{ border: "rgba(16,185,129,0.18)",  glow: "rgba(16,185,129,0.05)",  bar: "rgba(16,185,129,0.4)" },
    amber:  { border: "rgba(251,191,36,0.18)",  glow: "rgba(251,191,36,0.05)",  bar: "rgba(251,191,36,0.4)" },
    rose:   { border: "rgba(248,113,113,0.18)", glow: "rgba(248,113,113,0.05)", bar: "rgba(248,113,113,0.4)" },
  };
  const c = colors[color] || colors.cyan;
  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.97),rgba(8,15,30,0.99))', borderColor: c.border, boxShadow: `0 0 40px ${c.glow}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${c.bar},transparent)` }} />
      {children}
    </div>
  );
}

// ── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, color = "cyan", children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = {
    cyan:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose:   "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[color] || "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
  const [textC, bgC, borderC] = c.split(" ");
  return (
    <HoloPanel color={color} className="mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${bgC} border ${borderC}`}><Icon className={`w-4 h-4 ${textC}`} /></div>
          <span className={`font-semibold text-sm ${textC}`}>{title}</span>
          {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full ${bgC} border ${borderC} ${textC} tracking-widest uppercase`}>{badge}</span>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-6 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </HoloPanel>
  );
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, max = 100, color = "#22d3ee", sub }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-xs text-slate-400">{label}</span>
          {sub && <span className="text-[10px] text-slate-600 ml-2">{sub}</span>}
        </div>
        <span className="text-xs font-bold" style={{ color }}>{value}<span className="text-slate-600">/{max}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${color}60,${color})` }} />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-violet-400/60 text-sm tracking-widest uppercase">Dekoder AI-beslutningsproces...</p>
      </div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-violet-500/20">
        <p className="text-violet-300 text-2xl mb-4">Analyse ikke fundet</p>
        <Link to="/Blog" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 justify-center"><ArrowLeft className="w-4 h-4" /> Tilbage til blog</Link>
      </div>
    </div>
  );

  // ── Extract generation data from optimization_history ─────────────────────
  const optHistory = post.optimization_history || [];
  const genRun = optHistory[0] || {}; // first entry = initial generation
  const uniqueAngle = genRun.unique_angle || null;
  const avoidedTopics = genRun.avoided_overlap_topics || genRun.topics_to_avoid_overlap || [];
  const uniqueValue = genRun.unique_value || genRun.unique_value_proposition || null;
  const secondaryKws = post.secondary_keywords || [];
  const internalLinks = post.internal_links || [];
  const suggestions = post.ai_improvement_suggestions || [];

  // ── Content-derived stats ─────────────────────────────────────────────────
  const wordCount = post.word_count || Math.round((post.content || "").replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length);
  const hasTable = (post.content || "").includes("<table");
  const hasFaq = (post.content || "").toLowerCase().includes("faq");
  const headingCount = (post.content || "").match(/<h[1-6]/gi)?.length || 0;
  const contentText = (post.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const primaryKwOccurrences = post.primary_keyword
    ? Math.max(0, contentText.toLowerCase().split(post.primary_keyword.toLowerCase().split(" ")[0]).length - 1)
    : 0;
  const kwDensity = wordCount > 0 ? ((primaryKwOccurrences / wordCount) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden relative">

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <motion.div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "rgba(139,92,246,0.06)" }} animate={{ scale: [1,1.2,1], opacity: [0.4,0.7,0.4] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/3 left-1/5 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: "rgba(6,182,212,0.05)" }} animate={{ scale: [1.1,1,1.1], opacity: [0.3,0.6,0.3] }} transition={{ duration: 12, repeat: Infinity }} />
        <motion.div className="absolute left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.2),transparent)" }} animate={{ top: ["0%","100%"] }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }} />
      </div>

      {/* Header */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-violet-500/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/BlogPostDetail?id=${postId}`} className="flex items-center gap-2 text-violet-400/70 hover:text-violet-300 transition-colors text-sm tracking-wider uppercase">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tilbage til indlæg</span>
          </Link>
          <div className="flex items-center gap-2 text-violet-400/40 text-[10px] tracking-widest uppercase">
            <Brain className="w-3 h-3" /><span>AI Generationsbeslutning</span>
          </div>
          <Link to={createPageUrl("Home")}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e930c62bf3e3832b34edb/bc9d40ccc_FullLogo_Transparent1.png" alt="NexusVectis" className="h-9 w-auto opacity-70 hover:opacity-90 transition-opacity" />
          </Link>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 text-[11px] text-violet-400 tracking-widest uppercase mb-5">
              <Brain className="w-3 h-3" />
              Hvad baserede AI'en indlægget på?
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3"
              style={{ background: "linear-gradient(135deg,#e2f8ff 0%,#a78bfa 60%,#f0abfc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI-generationsbeslutning
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
              Se præcis hvilke data, regler, SEO-signaler og anti-bloat-kriterier AI-motoren brugte til at skrive dette specifikke indlæg.
            </p>
            <p className="text-slate-600 text-xs mt-2 italic">"{post.title}"</p>
          </motion.div>

          {/* ── 1. VALGT EMNE & BEGRUNDELSE ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Section title="Valgt emne & AI-begrundelse" icon={Crosshair} color="violet" defaultOpen>
              <div className="space-y-4">
                {/* Topic */}
                <div className="p-4 rounded-xl border" style={{ background: "rgba(139,92,246,0.07)", borderColor: "rgba(139,92,246,0.2)" }}>
                  <p className="text-[10px] text-violet-400/60 uppercase tracking-widest mb-1">Primært søgeord (emne-ID)</p>
                  <p className="text-violet-200 font-black text-xl">{post.primary_keyword || "—"}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Søgeintention: <span className="text-violet-300 capitalize">{post.search_intent || "informational"}</span>
                    &nbsp;·&nbsp; Konkurrent-gap: <span className={post.competitor_gap ? "text-emerald-400" : "text-slate-500"}>{post.competitor_gap ? "Ja — identificeret hulrum" : "Nej"}</span>
                  </p>
                </div>

                {/* Unique angle */}
                {uniqueAngle && (
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Unik vinkel AI'en valgte</p>
                        <p className="text-cyan-200 text-sm leading-relaxed font-medium">{uniqueAngle}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unique value */}
                {uniqueValue && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest mb-1">Hvad tilbyder dette indlæg unikt</p>
                        <p className="text-emerald-200 text-sm leading-relaxed">{uniqueValue}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search intent explanation */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Hvorfor denne søgeintention?</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {post.search_intent === "commercial"
                      ? "AI-motoren vurderede at søgende i dette segment primært er i overvejelsesfasen — de sammenligner løsninger. Indholdet er derfor struktureret til at præsentere konkrete fordele, sammenligningsdata og ROI-argumenter frem for rent pædagogisk indhold."
                      : post.search_intent === "transactional"
                      ? "Søgende med denne intention er tæt på en beslutning. AI-motoren har instrueret LLM'en til at inkludere direkte CTA'er, demo-tilbud og specifikke produktfeatures."
                      : "Søgende vil forstå et emne i dybden. AI-motoren instruerede LLM'en til at levere ekspertindsigt, konkrete tal, sammenligningstabeller og FAQ-sektioner optimeret til Google Featured Snippets."}
                  </p>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 2. ANTI-BLOAT FILTER ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <Section title="Anti-bloat filter — hvad AI'en bevidst undgik" icon={Filter} color="rose" defaultOpen>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 text-xs text-slate-500 leading-relaxed">
                  <p>Før AI'en begyndte at skrive, evaluerede den op til <span className="text-slate-300">5 kandidatemner</span> og valgte det mest <em className="text-rose-300">semantisk distinkte</em> fra eksisterende indhold. Herunder ses hvilke sub-emner den eksplicit blev instrueret til IKKE at dække, fordi de allerede er behandlet i andre indlæg.</p>
                </div>

                {avoidedTopics.length > 0 ? (
                  <div className="space-y-2">
                    {avoidedTopics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span className="text-rose-200/80 text-sm">{topic}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/20 text-center">
                    <p className="text-slate-500 text-xs">Ingen undgåede emner gemt for dette indlæg (genereret før anti-bloat v2).</p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20 text-[11px] text-slate-600 leading-relaxed">
                  <span className="text-slate-400">Metode:</span> AI-motoren sender de top 5 kandidatemner + titler på alle eksisterende indlæg til en LLM, som vurderer semantisk overlap og returnerer ét valgt emne samt en liste over sub-topics der allerede er dækket.
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 3. SKRIVEMANDAT ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Section title="Skrivemandat — regler AI'en fulgte" icon={BookOpen} color="cyan" defaultOpen>
              <div className="space-y-2">
                {[
                  { rule: "1.800–2.500 ord med genuint nyttigt, specifikt og handlingsorienteret indhold", ok: wordCount >= 1800, value: `${wordCount?.toLocaleString()} ord` },
                  { rule: "Ingen fyld, ingen gentagelser, intet generisk råd", ok: true, value: "Instrueret" },
                  { rule: "Hvert afsnit tilføjer ny information", ok: true, value: "Instrueret" },
                  { rule: "Virkelige logistikscenarier og konkrete tal", ok: true, value: "Instrueret" },
                  { rule: "2025/2026 branchedata med kildehenvisning", ok: true, value: "Instrueret" },
                  { rule: "Mindst én sammenligningtabel (<table>) med specifikke data", ok: hasTable, value: hasTable ? "Inkluderet" : "Mangler" },
                  { rule: "FAQ-sektion med 4 spørgsmål til Featured Snippets", ok: hasFaq, value: hasFaq ? "Inkluderet" : "Mangler" },
                  { rule: "'How NexusVectis Addresses This'-sektion", ok: (post.content||"").toLowerCase().includes("nexusvectis"), value: (post.content||"").toLowerCase().includes("nexusvectis") ? "Inkluderet" : "Mangler" },
                  { rule: "Interne links: /FleetAIPage, /LiveTrackingPage, /AnalyticsPage, /HarborInfo", ok: (post.content||"").includes("FleetAIPage") || (post.content||"").includes("LiveTrackingPage"), value: `${(post.content||"").match(/\/(FleetAIPage|LiveTrackingPage|AnalyticsPage|HarborInfo)/g)?.length || 0} fundet` },
                  { rule: "Closing CTA: 'book a free NexusVectis demo'", ok: (post.content||"").toLowerCase().includes("demo"), value: (post.content||"").toLowerCase().includes("demo") ? "Inkluderet" : "Mangler" },
                  { rule: "Semantisk HTML (H1, H2, H3, table) — ingen markdown", ok: headingCount >= 3, value: `${headingCount} overskrifter` },
                  { rule: "Tone: autoritær ekspert, ikke marketing-copy", ok: true, value: "Instrueret" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/20 text-sm gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {item.ok
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                      <span className="text-slate-400 text-xs leading-relaxed">{item.rule}</span>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${item.ok ? "text-emerald-400" : "text-amber-400"}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ── 4. KEYWORD-STRATEGI ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Section title="Keyword-strategi AI'en instruerede LLM'en med" icon={Hash} color="emerald" defaultOpen>
              <div className="space-y-4">
                {/* Primary */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest mb-1">Primært søgeord</p>
                      <p className="text-emerald-200 font-bold">{post.primary_keyword || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 mb-1">Densitet i indhold</p>
                      <p className={`font-bold text-lg ${parseFloat(kwDensity) >= 0.5 && parseFloat(kwDensity) <= 2.5 ? "text-emerald-400" : "text-amber-400"}`}>{kwDensity}%</p>
                      <p className="text-[10px] text-slate-600">{primaryKwOccurrences}x forekomster</p>
                    </div>
                  </div>
                  <ScoreBar label="Keyword densitet (optimal: 0.5–2.5%)" value={parseFloat(kwDensity)} max={3} color="#34d399" />
                </div>

                {/* Secondary keywords */}
                {secondaryKws.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Sekundære søgeord instrueret ind ({secondaryKws.length} stk.)</p>
                    <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">AI-motoren sendte disse søgeord til LLM'en med instruks om at væve dem naturligt ind i indholdet for at opbygge semantisk autoritet.</p>
                    <div className="flex flex-wrap gap-2">
                      {secondaryKws.map((kw, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-emerald-500/15 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                          <span className="text-emerald-300/80">{kw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </motion.div>

          {/* ── 5. SEO SCORE & READABILITY ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <Section title="SEO & læsbarhedsscore — hvad AI'en målte" icon={TrendingUp} color="violet" defaultOpen={false} badge={`${post.seo_score || "—"}/100`}>
              <div className="space-y-3">
                <ScoreBar label="SEO-score (beregnet af LLM ved generering)" value={post.seo_score || 0} color="#a78bfa" />
                <ScoreBar label="Læsbarhed (Flesch-estimat)" value={post.readability_score || 0} color="#c4b5fd" />
                <ScoreBar label="Ordantal ift. mål (1800–2500)" value={Math.min(100, Math.round((wordCount / 2000) * 100))} color="#a78bfa" sub={`${wordCount?.toLocaleString()} ord`} />
                <ScoreBar label="Overskrift-struktur" value={Math.min(100, headingCount * 12)} color="#c4b5fd" sub={`${headingCount} H-tags`} />

                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-violet-500/15">
                    <p className="text-violet-400 font-black text-xl">{post.seo_score || "—"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">SEO Score</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-violet-500/15">
                    <p className="text-violet-400 font-black text-xl">{post.readability_score || "—"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Læsbarhed</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-violet-500/15">
                    <p className="text-cyan-400 font-black text-xl">{post.read_time_minutes || "—"} min</p>
                    <p className="text-[10px] text-slate-500 mt-1">Læsetid</p>
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 6. AI-MODEL & TEKNISK KONFIGURATION ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Section title="AI-model & teknisk konfiguration" icon={Cpu} color="cyan" defaultOpen={false}>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: "AI-model brugt", value: post.ai_model || "gemini-3-flash" },
                  { label: "AI-genereret", value: post.ai_generated ? "Ja" : "Nej" },
                  { label: "Generationsdato", value: post.published_at ? new Date(post.published_at).toLocaleString("da-DK") : "—" },
                  { label: "Generationsmetode", value: genRun.action?.replace(/_/g, " ") || "high_quality_generation" },
                  { label: "Sidst optimeret", value: post.last_optimized_at ? new Date(post.last_optimized_at).toLocaleString("da-DK") : "—" },
                  { label: "Oprettelsesdato", value: post.created_date ? new Date(post.created_date).toLocaleString("da-DK") : "—" },
                  { label: "Søgeintention", value: post.search_intent || "informational" },
                  { label: "Konkurrent-gap", value: post.competitor_gap ? "Ja — identificeret hul" : "Nej" },
                  { label: "Estimeret trafik", value: `${post.performance_clicks || 0} klik/måned` },
                  { label: "Post-status", value: post.status },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/20 gap-3">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-cyan-300/80 font-mono text-right">{item.value}</span>
                  </div>
                ))}
              </div>

              {optHistory.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Optimeringshistorik ({optHistory.length} kørsler)</p>
                  <div className="space-y-2">
                    {optHistory.map((run, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-amber-500/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-amber-300 text-xs font-semibold">{run.action?.replace(/_/g, " ") || "Optimering"}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{run.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                          {run.seo_score && <span>SEO: <span className="text-emerald-400 font-bold">{run.seo_score}</span></span>}
                          {run.word_count && <span>Ord: <span className="text-slate-300 font-bold">{run.word_count?.toLocaleString()}</span></span>}
                          {run.unique_angle && <span className="col-span-2 text-cyan-400/70 italic">"{run.unique_angle}"</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </motion.div>

          {/* ── 7. AI-FORBEDRINGSSUGGESTIONER ── */}
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
              <Section title="AI-forbedringssuggestioner (ugentlig analyse)" icon={Sparkles} color="violet" defaultOpen={false} badge={`${suggestions.length} forslag`}>
                <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">Genereret af den ugentlige SEO-reoptimiseringsmotor, som gennemgår alle publicerede indlæg og identificerer konkrete forbedringsmuligheder.</p>
                <div className="space-y-3">
                  {suggestions.map((s, i) => {
                    const pColor = s.priority === "high" ? "text-rose-400 border-rose-500/20 bg-rose-500/5" : s.priority === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                    return (
                      <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold ${pColor}`}>{s.priority}</span>
                          <span className="text-[10px] text-violet-400/70 border border-violet-500/20 px-2 py-0.5 rounded-full bg-violet-500/5">{s.type?.replace(/_/g, " ")}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-1">{s.suggestion}</p>
                        {s.impact && <p className="text-[11px] text-violet-400/60 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Forventet impact: {s.impact}</p>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}

          {/* ── 8. KILDEFORKLARING ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <HoloPanel color="violet" className="mt-4">
              <div className="px-5 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-4 h-4 text-violet-400" />
                  <p className="text-violet-400 text-xs font-bold uppercase tracking-widest">Hvordan AI-motoren arbejder</p>
                </div>
                <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                  <p><span className="text-cyan-300">1. SEO Intelligence Engine</span> kører dagligt og analyserer Google-algoritmeopdateringer, konkurrenters nøgleord, søgevolumener og indholdsgab via real-time web-søgning.</p>
                  <p><span className="text-violet-300">2. Emneudvælgelse</span> sker ved at sammenligne op til 5 kandidatemner mod eksisterende indlæg via en LLM-baseret semantisk overlap-analyse (anti-bloat gate).</p>
                  <p><span className="text-emerald-300">3. Indholdsgeneration</span> sker via <strong className="text-white">{post.ai_model || "gemini-3-flash"}</strong> med et detaljeret skrivemandat på over 300 ord, inkl. konkrete strukturkrav, interne links og tone-of-voice regler.</p>
                  <p><span className="text-amber-300">4. Ugentlig reoptimering</span> gennemgår alle publicerede indlæg og genererer de 3 vigtigste forbedringssuggestioner baseret på aktuelle SEO-signaler.</p>
                </div>
              </div>
            </HoloPanel>
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={`/BlogPostDetail?id=${postId}`} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 border border-violet-500/25 hover:border-violet-400/50 px-7 py-3 rounded-xl transition-all hover:bg-violet-500/5 text-sm tracking-wider uppercase">
              <ArrowLeft className="w-4 h-4" />Læs indlægget
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