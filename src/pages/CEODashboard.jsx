import { useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, FileText, Target, BarChart3, Globe,
  Search, AlertCircle, CheckCircle2, Zap, Sparkles, ArrowRight,
  Shield, Users, DollarSign, Eye, MousePointer, RefreshCw,
  ChevronDown, ChevronRight, Star, Tag, Clock, Award,
  Activity, Layers, Link2, Hash, BookOpen, Crosshair
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment";

// ─── Small helpers ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "cyan", sub }) {
  return (
    <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}-500/15 border border-${color}-500/20 flex-shrink-0`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div>
        <p className={`text-2xl font-black text-${color}-400`}>{value ?? "—"}</p>
        <p className="text-xs text-slate-400">{label}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, color = "cyan", children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 text-${color}-400`} />
          <span className="text-white font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
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
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CEODashboard() {
  const [abTab, setAbTab] = useState("hero_headline");

  // Auth guard — admin only
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: metricsList = [], isLoading: loadingMetrics, refetch } = useQuery({
    queryKey: ["ceo-seoMetrics"],
    queryFn: () => base44.entities.SEOMetrics.list("-created_date", 5),
    enabled: user?.role === "admin",
  });

  const { data: abRecords = [] } = useQuery({
    queryKey: ["ceo-abRecords"],
    queryFn: () => base44.entities.ABTestConversion.list("-created_date", 500),
    enabled: user?.role === "admin",
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["ceo-blogPosts"],
    queryFn: () => base44.entities.BlogPost.list("-published_at", 50),
    enabled: user?.role === "admin",
  });

  const latest = metricsList[0] || null;

  // ── A/B Stats ──────────────────────────────────────────────────────────────
  const abByType = {};
  for (const r of abRecords) {
    const t = r.variant_type;
    if (!abByType[t]) abByType[t] = {};
    const k = String(r.variant_index);
    if (!abByType[t][k]) abByType[t][k] = { value: r.variant_value, impressions: 0, conversions: 0 };
    abByType[t][k].impressions++;
    if (r.converted) abByType[t][k].conversions++;
  }

  const totalImpressions = abRecords.length;
  const totalConversions = abRecords.filter(r => r.converted).length;
  const convRate = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : 0;

  const abTypes = ["hero_headline", "hero_subline", "cta_text", "title", "meta_description"];
  const currentAbData = abByType[abTab] || {};
  const currentVariants = Object.entries(currentAbData)
    .map(([idx, v]) => ({ idx, ...v, rate: v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.rate - a.rate);

  // ── Blog stats ─────────────────────────────────────────────────────────────
  const publishedPosts = posts.filter(p => p.status === "published");
  const needsUpdate = posts.filter(p => p.status === "needs_update");
  const avgSeo = publishedPosts.length
    ? Math.round(publishedPosts.reduce((s, p) => s + (p.seo_score || 0), 0) / publishedPosts.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-black text-white">CEO Intelligence Dashboard</h1>
            </div>
            <p className="text-slate-400 ml-14">Real-time view of what the SEO engine collects, decides and generates</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Top KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="SEO Health Score" value={latest?.home_page_seo_score ? `${latest.home_page_seo_score}/100` : "—"} icon={Target} color="cyan" sub={latest ? moment(latest.created_date).fromNow() : "No analysis yet"} />
          <StatCard label="Total A/B Impressions" value={totalImpressions.toLocaleString()} icon={Eye} color="violet" />
          <StatCard label="Total Conversions" value={totalConversions} icon={MousePointer} color="emerald" sub={`${convRate}% conversion rate`} />
          <StatCard label="Projected Traffic" value={latest?.projected_organic_traffic ? `+${latest.projected_organic_traffic.toLocaleString()}` : "—"} icon={TrendingUp} color="amber" sub="Monthly organic visitors" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* ── A/B Test Live Results ─────────────────────────────────────── */}
          <Section title="A/B Test Live Results" icon={Activity} color="violet" defaultOpen>
            {/* Type Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {abTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setAbTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    abTab === t
                      ? "bg-violet-500/20 border border-violet-500/50 text-violet-300"
                      : "bg-slate-800/60 border border-slate-700/40 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {currentVariants.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No data for this variant type yet.</p>
            ) : (
              <div className="space-y-3">
                {currentVariants.map((v, idx) => {
                  const isWinner = idx === 0 && v.impressions >= 5;
                  const barWidth = v.impressions > 0 ? Math.min(100, (v.rate / 5) * 100) : 0;
                  return (
                    <div key={v.idx} className={`p-4 rounded-xl border transition-all ${isWinner ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900/40 border-slate-700/30"}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isWinner && <Award className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          <p className="text-slate-200 text-sm leading-snug">{v.value}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${isWinner ? "text-emerald-400" : "text-slate-300"}`}>{v.rate}%</p>
                          <p className="text-[10px] text-slate-500">{v.impressions} views / {v.conversions} conv.</p>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWinner ? "bg-emerald-400" : "bg-violet-500/50"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current winners from SEO engine */}
            {latest?.ab_test_winner && Object.keys(latest.ab_test_winner).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Current Winners (promoted by optimizer)
                </p>
                <div className="space-y-1.5">
                  {Object.entries(latest.ab_test_winner).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 capitalize">{type.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-300 max-w-[200px] truncate">{data.value}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">{data.conversion_rate}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── SEO Engine Decisions ──────────────────────────────────────── */}
          <div className="space-y-6">
            <Section title="AI Action Items (Latest Run)" icon={CheckCircle2} color="cyan" defaultOpen>
              {(latest?.home_page_suggestions || []).length === 0
                ? <p className="text-slate-500 text-sm">No analysis run yet.</p>
                : (latest.home_page_suggestions).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-snug">{item}</span>
                  </div>
                ))
              }
            </Section>

            <Section title="CRO Suggestions from SEO Intent" icon={Crosshair} color="amber" defaultOpen={false}>
              {(latest?.conversion_rate_suggestions || []).length === 0
                ? <p className="text-slate-500 text-sm">No suggestions yet.</p>
                : (latest.conversion_rate_suggestions).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-snug">{s}</span>
                  </div>
                ))
              }
            </Section>
          </div>
        </div>

        {/* ── Keyword Intelligence ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Section title="Trending Keywords" icon={TrendingUp} color="cyan" defaultOpen>
            <div className="space-y-2">
              {(latest?.trending_keywords || []).slice(0, 15).map((kw, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Hash className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-300 truncate">{kw.keyword}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                      kw.intent === "commercial" ? "bg-violet-500/20 text-violet-400" :
                      kw.intent === "transactional" ? "bg-emerald-500/20 text-emerald-400" :
                      "bg-slate-700/50 text-slate-400"
                    }`}>{kw.intent}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                    <span>{kw.monthly_searches?.toLocaleString()}/mo</span>
                    <span className={`font-medium ${kw.trend === "rising" ? "text-emerald-400" : kw.trend === "declining" ? "text-red-400" : "text-slate-400"}`}>
                      {kw.trend === "rising" ? "↑" : kw.trend === "declining" ? "↓" : "→"}
                    </span>
                    <span className="text-slate-600">€{kw.cpc_eur} CPC</span>
                  </div>
                </div>
              ))}
              {!latest && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </Section>

          <Section title="Content Gaps (vs Competitors)" icon={Globe} color="amber" defaultOpen>
            <div className="space-y-2">
              {(latest?.content_gaps || []).map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{gap}</span>
                </div>
              ))}
              {!(latest?.content_gaps?.length) && <p className="text-slate-500 text-sm">No gaps identified yet.</p>}
            </div>
          </Section>
        </div>

        {/* ── SERP + Backlinks + Semantic Clusters ─────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <Section title="SERP Feature Opportunities" icon={Search} color="violet" defaultOpen={false}>
            <div className="space-y-3">
              {(latest?.serp_features_opportunities || []).map((opp, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <p className="text-white text-xs font-semibold mb-1">{opp.suggested_title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">{opp.serp_feature?.replace(/_/g, " ")}</Badge>
                    <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-[10px]">{opp.content_format}</Badge>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{opp.keyword}</p>
                </div>
              ))}
              {!(latest?.serp_features_opportunities?.length) && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </Section>

          <Section title="Backlink Opportunities" icon={Link2} color="emerald" defaultOpen={false}>
            <div className="space-y-3">
              {(latest?.backlink_opportunities || []).map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-xs font-semibold">{b.domain}</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">DA ~{b.da_estimate}</Badge>
                  </div>
                  <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-[10px] mb-1">{b.link_type?.replace(/_/g, " ")}</Badge>
                  <p className="text-slate-500 text-xs">{b.approach}</p>
                </div>
              ))}
              {!(latest?.backlink_opportunities?.length) && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </Section>

          <Section title="Semantic Topic Clusters" icon={Layers} color="pink" defaultOpen={false}>
            <div className="space-y-4">
              {(latest?.semantic_clusters || []).map((cluster, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <p className="text-white text-xs font-bold mb-1">{cluster.pillar_title}</p>
                  <p className="text-pink-400 text-[10px] mb-2">{cluster.pillar_keyword}</p>
                  <div className="space-y-1">
                    {(cluster.cluster_posts || []).map((cp, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                        {cp.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!(latest?.semantic_clusters?.length) && <p className="text-slate-500 text-sm">No data yet.</p>}
            </div>
          </Section>
        </div>

        {/* ── Competitor Analysis ───────────────────────────────────────────── */}
        <div className="mb-6">
          <Section title="Competitor Analysis" icon={Target} color="red" defaultOpen={false}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(latest?.competitor_analysis?.competitors || []).map((comp, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <p className="text-white font-bold text-sm mb-3">{comp.name}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Top Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {(comp.top_keywords || []).map((kw, j) => (
                          <Badge key={j} className="bg-slate-700/50 text-slate-300 border-slate-600/30 text-[10px]">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Exploitable Gaps</p>
                      <div className="space-y-1">
                        {(comp.exploitable_gaps || []).map((gap, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-[11px] text-emerald-400">
                            <Zap className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {gap}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!(latest?.competitor_analysis?.competitors?.length) && <p className="text-slate-500 text-sm">No competitor data yet.</p>}
            </div>
          </Section>
        </div>

        {/* ── AI Generated Blog Posts ───────────────────────────────────────── */}
        <div className="mb-6">
          <Section title={`AI-Generated Blog Posts (${posts.length} total · ${needsUpdate.length} need update)`} icon={BookOpen} color="emerald" defaultOpen>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.slice(0, 9).map(post => (
                <div key={post.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`text-[10px] ${
                      post.status === "published" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      post.status === "needs_update" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-slate-700/50 text-slate-400 border-slate-600/30"
                    }`}>{post.status?.replace("_", " ")}</Badge>
                    {post.seo_score && (
                      <span className={`text-xs font-bold ${post.seo_score >= 80 ? "text-emerald-400" : post.seo_score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                        {post.seo_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm font-semibold leading-snug mb-1">{post.title}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {post.primary_keyword && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{post.primary_keyword}</span>}
                    {post.read_time_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes}m</span>}
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="text-slate-500 text-sm col-span-3">No posts generated yet.</p>}
            </div>
          </Section>
        </div>

        {/* ── AI Summary ───────────────────────────────────────────────────── */}
        {latest?.ai_summary && (
          <div className="mb-6">
            <Section title="AI Narrative Summary (Latest Analysis)" icon={Brain} color="cyan" defaultOpen>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{latest.ai_summary}</p>
              <p className="text-slate-600 text-xs mt-3">Generated {moment(latest.created_date).format("MMMM D, YYYY [at] HH:mm")}</p>
            </Section>
          </div>
        )}

        {/* ── Historical runs ───────────────────────────────────────────────── */}
        <Section title="SEO Engine Run History" icon={Clock} color="slate" defaultOpen={false}>
          <div className="space-y-2">
            {metricsList.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 text-sm">
                <div className="flex items-center gap-3">
                  {i === 0 && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">Latest</Badge>}
                  <span className="text-slate-400">{moment(m.created_date).format("MMM D, YYYY HH:mm")}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Score: <span className="text-white font-semibold">{m.home_page_seo_score || "—"}</span></span>
                  <span>Keywords: <span className="text-white font-semibold">{m.trending_keywords?.length || 0}</span></span>
                  <span>Traffic est: <span className="text-emerald-400 font-semibold">{m.projected_organic_traffic?.toLocaleString() || "—"}</span></span>
                </div>
              </div>
            ))}
            {metricsList.length === 0 && <p className="text-slate-500 text-sm">No runs yet.</p>}
          </div>
        </Section>
      </div>
    </div>
  );
}