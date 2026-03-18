import { useState } from "react";
import { base44 } from "@/api/base44Client";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Brain, Zap, TrendingUp, FileText, RefreshCw, CheckCircle2,
  AlertCircle, BarChart3, Globe, Search, ArrowRight, Sparkles,
  Target, Clock, Star, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import moment from "moment";

export default function SEODashboard() {
  const [runningEngine, setRunningEngine] = useState(false);
  const [runningReopt, setRunningReopt] = useState(false);
  const queryClient = useQueryClient();

  // Fetch latest SEO metrics
  const { data: metrics } = useQuery({
    queryKey: ['seoMetrics'],
    queryFn: () => base44.entities.SEOMetrics.list('-created_date', 1),
    select: (data) => data[0] || null,
  });

  // Fetch blog posts
  const { data: posts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => base44.entities.BlogPost.list('-published_at', 20),
  });

  const publishedPosts = posts.filter(p => p.status === 'published');
  const needsUpdatePosts = posts.filter(p => p.status === 'needs_update');
  const avgSeoScore = publishedPosts.length
    ? Math.round(publishedPosts.reduce((sum, p) => sum + (p.seo_score || 0), 0) / publishedPosts.length)
    : 0;

  const runIntelligenceEngine = async () => {
    setRunningEngine(true);
    try {
      const res = await base44.functions.invoke('seoIntelligenceEngine', {});
      const data = res.data;
      toast.success(`SEO Engine complete! Score: ${data.seo_health_score}/100 — Generated: "${data.new_post_generated}"`);
      queryClient.invalidateQueries({ queryKey: ['seoMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    } catch (e) {
      toast.error('Engine failed: ' + e.message);
    }
    setRunningEngine(false);
  };

  const runReoptimizer = async () => {
    setRunningReopt(true);
    try {
      const res = await base44.functions.invoke('seoPostReoptimizer', {});
      const data = res.data;
      toast.success(`Re-optimized ${data.posts_reoptimized} posts${data.bonus_post_generated ? ` + generated "${data.bonus_post_generated}"` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    } catch (e) {
      toast.error('Re-optimizer failed: ' + e.message);
    }
    setRunningReopt(false);
  };

  const statusColor = {
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    needs_update: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    archived: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <AdminLayout currentPage="SEODashboard">
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">SEO Intelligence Dashboard</h1>
            </div>
            <p className="text-slate-400">Autonomous AI-powered SEO optimization engine</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={runReoptimizer}
              disabled={runningReopt}
              variant="outline"
              className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
            >
              {runningReopt ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Re-optimizing...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Re-optimize Posts</>
              )}
            </Button>
            <Button
              onClick={runIntelligenceEngine}
              disabled={runningEngine}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold"
            >
              {runningEngine ? (
                <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Running Engine...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Run SEO Engine</>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "SEO Health Score", value: metrics?.home_page_seo_score ? `${metrics.home_page_seo_score}/100` : '—', icon: Target, color: "cyan" },
            { label: "Published Posts", value: publishedPosts.length, icon: FileText, color: "emerald" },
            { label: "Avg Post Score", value: avgSeoScore ? `${avgSeoScore}/100` : '—', icon: BarChart3, color: "violet" },
            { label: "Posts Needing Update", value: needsUpdatePosts.length, icon: AlertCircle, color: needsUpdatePosts.length > 0 ? "amber" : "emerald" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Latest SEO Report */}
          <div className="lg:col-span-1 space-y-6">
            {metrics && (
              <>
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Trending Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(metrics.trending_keywords || []).slice(0, 8).map((kw, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300 truncate max-w-[160px]">{kw.keyword}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            kw.trend === 'rising' ? 'bg-emerald-500/20 text-emerald-400' :
                            kw.trend === 'declining' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {kw.trend === 'rising' ? '↑' : kw.trend === 'declining' ? '↓' : '→'}
                          </span>
                          <span className="text-xs text-slate-500">{kw.monthly_searches?.toLocaleString()}/mo</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-violet-400" />
                      Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(metrics.home_page_suggestions || []).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300 leading-snug">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      Content Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(metrics.content_gaps || []).map((gap, idx) => (
                      <div key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        {gap}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {metrics.ai_summary && (
                  <Card className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-cyan-400" />
                        AI Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm leading-relaxed">{metrics.ai_summary}</p>
                      <p className="text-slate-500 text-xs mt-2">Last analysis: {moment(metrics.created_date).fromNow()}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!metrics && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="py-12 text-center">
                  <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No SEO analysis yet.</p>
                  <p className="text-slate-500 text-sm mt-1">Click "Run SEO Engine" to start.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Blog Posts */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    AI-Generated Blog Posts ({posts.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No posts yet — run the SEO Engine to generate the first one.</p>
                  </div>
                )}
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`text-[10px] ${statusColor[post.status] || statusColor.draft}`}>
                            {post.status?.replace('_', ' ')}
                          </Badge>
                          {post.ai_generated && (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px]">
                              <Brain className="w-2.5 h-2.5 mr-1" /> AI
                            </Badge>
                          )}
                          {post.competitor_gap && (
                            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                              Gap
                            </Badge>
                          )}
                        </div>
                        <p className="text-white font-semibold text-sm leading-snug mb-1">{post.title}</p>
                        <p className="text-slate-400 text-xs truncate mb-2">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {post.primary_keyword && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />{post.primary_keyword}
                            </span>
                          )}
                          {post.read_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{post.read_time_minutes} min
                            </span>
                          )}
                          {post.word_count && (
                            <span>{post.word_count.toLocaleString()} words</span>
                          )}
                          {post.published_at && (
                            <span>{moment(post.published_at).format('MMM D, YYYY')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {post.seo_score && (
                          <div className={`text-lg font-bold ${
                            post.seo_score >= 80 ? 'text-emerald-400' :
                            post.seo_score >= 60 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {post.seo_score}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500">SEO score</span>
                        {post.last_optimized_at && (
                          <span className="text-[10px] text-slate-600">{moment(post.last_optimized_at).fromNow()}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Topics */}
            {metrics?.recommended_blog_topics?.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    AI-Recommended Topics Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metrics.recommended_blog_topics
                    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
                    .map((topic, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/30">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium mb-1">{topic.title}</p>
                          <p className="text-slate-500 text-xs">{topic.primary_keyword} · {topic.monthly_searches?.toLocaleString()}/mo · Difficulty: {topic.difficulty}/10</p>
                          <p className="text-cyan-400/70 text-xs mt-1 italic">{topic.why_now}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-amber-400 font-bold text-sm">{topic.priority_score || '—'}</div>
                          <div className="text-slate-500 text-[10px]">priority</div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}