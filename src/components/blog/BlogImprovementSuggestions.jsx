import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb, ChevronDown, ChevronRight, Link2,
  BarChart2, Type, Search, AlignLeft, MousePointer, Clock, Zap, RefreshCw
} from "lucide-react";
import moment from "moment";

const TYPE_CONFIG = {
  internal_links: { icon: Link2, color: "cyan", label: "Interne links" },
  outdated_data:  { icon: Clock, color: "amber", label: "Forældet data" },
  headings:       { icon: Type, color: "violet", label: "Underoverskrifter" },
  keyword:        { icon: Search, color: "emerald", label: "Søgeord" },
  readability:    { icon: AlignLeft, color: "pink", label: "Læsbarhed" },
  cta:            { icon: MousePointer, color: "orange", label: "CTA" },
};

const PRIORITY_COLORS = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-slate-700/50 text-slate-400 border-slate-600/30",
};

function PostSuggestionCard({ post }) {
  const [open, setOpen] = useState(false);
  const suggestions = post.ai_improvement_suggestions || [];

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-white text-sm font-semibold truncate">{post.title}</p>
            <p className="text-slate-500 text-xs">
              {post.suggestions_generated_at
                ? `Analyseret ${moment(post.suggestions_generated_at).fromNow()}`
                : "Ikke analyseret endnu"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            {suggestions.length} forslag
          </Badge>
          {open
            ? <ChevronDown className="w-4 h-4 text-slate-500" />
            : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </div>
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
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-700/30">
              {suggestions.map((s, i) => {
                const config = TYPE_CONFIG[s.type] || { icon: Zap, color: "slate", label: s.type };
                const Icon = config.icon;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg bg-${config.color}-500/5 border border-${config.color}-500/20`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Icon className={`w-3.5 h-3.5 text-${config.color}-400 flex-shrink-0`} />
                      <span className={`text-xs font-semibold text-${config.color}-400`}>{config.label}</span>
                      <Badge className={`text-[10px] ${PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.low}`}>
                        {s.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">{s.suggestion}</p>
                    {s.impact && (
                      <p className="text-slate-500 text-[11px] mt-1.5 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> {s.impact}
                      </p>
                    )}
                  </div>
                );
              })}
              {suggestions.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-2">Ingen forslag endnu — kør analysen.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BlogImprovementSuggestions() {
  const [running, setRunning] = useState(false);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["blog-improvement-posts"],
    queryFn: () => base44.entities.BlogPost.filter({ status: "published" }, "-suggestions_generated_at", 50),
  });

  const postsWithSuggestions = posts.filter(p => p.ai_improvement_suggestions?.length > 0);
  const postsWithout = posts.filter(p => !p.ai_improvement_suggestions?.length);

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("weeklyBlogAnalyzer", {});
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-white font-semibold text-sm">Ugentlig Blog-analyse</span>
            <p className="text-slate-500 text-xs">AI genererer 3 konkrete forbedringer pr. indlæg</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={running || isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-500/60 disabled:opacity-50 transition-all text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          {running ? "Analyserer..." : "Kør nu"}
        </button>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <p className="text-slate-500 text-sm text-center py-4">Indlæser...</p>
        ) : posts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">Ingen publicerede indlæg endnu.</p>
        ) : (
          <>
            {/* Summary row */}
            <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
              <span><span className="text-white font-bold">{postsWithSuggestions.length}</span> analyserede indlæg</span>
              <span><span className="text-amber-400 font-bold">{postsWithout.length}</span> afventer analyse</span>
              <span><span className="text-emerald-400 font-bold">{postsWithSuggestions.reduce((s, p) => s + (p.ai_improvement_suggestions?.length || 0), 0)}</span> forslag i alt</span>
            </div>

            {/* Posts with suggestions */}
            {postsWithSuggestions.length > 0 && (
              <div className="space-y-2">
                {postsWithSuggestions.map(post => (
                  <PostSuggestionCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Posts without suggestions */}
            {postsWithout.length > 0 && postsWithSuggestions.length > 0 && (
              <p className="text-slate-600 text-xs mt-3 text-center">
                + {postsWithout.length} indlæg uden forslag endnu — kør analysen for at dække dem alle.
              </p>
            )}

            {postsWithSuggestions.length === 0 && (
              <div className="text-center py-6">
                <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Klik "Kør nu" for at analysere alle publicerede blogindlæg.</p>
                <p className="text-slate-600 text-xs mt-1">Kører automatisk hver søndag kl. 08:00.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}