import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Newspaper, RefreshCw, ExternalLink, TrendingUp, AlertTriangle, Truck, Globe, Zap, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "logistics", label: "Logistics", icon: Truck, color: "cyan" },
  { id: "supply_chain", label: "Supply Chain", icon: Globe, color: "violet" },
  { id: "freight", label: "Freight & Shipping", icon: TrendingUp, color: "emerald" },
  { id: "disruptions", label: "Disruptions", icon: AlertTriangle, color: "amber" },
  { id: "ev_fleet", label: "EV & Fleet Tech", icon: Zap, color: "blue" },
];

const colorMap = {
  cyan: { badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", dot: "bg-cyan-400", border: "border-cyan-500/30", hover: "hover:border-cyan-500/50" },
  violet: { badge: "bg-violet-500/20 text-violet-300 border-violet-500/30", dot: "bg-violet-400", border: "border-violet-500/30", hover: "hover:border-violet-500/50" },
  emerald: { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400", border: "border-emerald-500/30", hover: "hover:border-emerald-500/50" },
  amber: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400", border: "border-amber-500/30", hover: "hover:border-amber-500/50" },
  blue: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", dot: "bg-blue-400", border: "border-blue-500/30", hover: "hover:border-blue-500/50" },
};

export default function NewsIntelligence({ openWindow }) {
  const [activeCategory, setActiveCategory] = useState("logistics");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeError, setIframeError] = useState(false);

  const openArticleUrl = (url) => {
    if (!url) return;
    setIframeError(false);
    setIframeUrl(url);
  };

  const fetchNews = async (category) => {
    setLoading(true);
    setArticles([]);
    const cat = CATEGORIES.find(c => c.id === category);
    const prompt = `Search the web for the 6 most recent and relevant news articles about "${cat.label}" in the context of logistics, transportation, and fleet management. Today is ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.

Return a JSON object with an "articles" array where each article has:
- title: headline of the article
- summary: 2-3 sentence summary of the article content
- source: name of the publication (e.g. FreightWaves, Supply Chain Dive, Bloomberg, Reuters)
- date: publication date (e.g. "Feb 28, 2026")
- sentiment: "positive", "neutral", or "negative"
- impact: brief note on how this impacts fleet/logistics operations (1 sentence)
- url: a plausible URL for the article`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string" },
                source: { type: "string" },
                date: { type: "string" },
                sentiment: { type: "string" },
                impact: { type: "string" },
                url: { type: "string" },
              }
            }
          }
        }
      }
    });
    setArticles(result?.articles || []);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const sentimentColor = (s) => s === "positive" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : s === "negative" ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-slate-400 bg-slate-500/10 border-slate-500/30";

  const cat = CATEGORIES.find(c => c.id === activeCategory);
  const colors = colorMap[cat.color];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950/40 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold">News Intelligence</h3>
          {lastUpdated && <span className="text-slate-500 text-xs">Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <Button onClick={() => fetchNews(activeCategory)} disabled={loading} size="sm" variant="ghost" className="text-slate-400 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 p-3 border-b border-slate-800/50 flex-shrink-0 overflow-x-auto">
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${activeCategory === id ? `${colorMap[color].badge} ${colorMap[color].border}` : "text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* iFrame Viewer */}
      {iframeUrl && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800/50 bg-slate-900/50 flex-shrink-0">
            <button onClick={() => { setIframeUrl(null); setIframeError(false); }} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="text-slate-500 text-xs truncate flex-1">{iframeUrl}</span>
            <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors" title="Open in new tab">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          {iframeError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">Cannot display in hologram</p>
                <p className="text-slate-400 text-sm">This site blocks iframe embedding.</p>
              </div>
              <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-sm font-medium transition-all flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open in new tab
              </a>
            </div>
          ) : (
            <iframe
              src={iframeUrl}
              className="flex-1 w-full border-0"
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                try {
                  const doc = e.target.contentDocument || e.target.contentWindow?.document;
                  if (!doc) setIframeError(true);
                } catch {
                  setIframeError(true);
                }
              }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Article Viewer"
            />
          )}
        </div>
      )}

      {/* Articles */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${iframeUrl ? "hidden" : ""}`}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <Newspaper className="w-5 h-5 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-400 text-sm animate-pulse">Fetching live intelligence...</p>
          </div>
        )}

        {!loading && selectedArticle && (
          <div className="h-full flex flex-col">
            <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to articles
            </button>
            <div className={`flex-1 p-5 rounded-xl bg-slate-900/80 border ${colors.border} space-y-4`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-white font-bold text-base leading-snug flex-1">{selectedArticle.title}</h2>
                <button onClick={() => openArticleUrl(selectedArticle.url)} className="flex-shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all" title="Open in hologram">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">{selectedArticle.source}</span>
                <span className="text-slate-600 text-xs">{selectedArticle.date}</span>
                {selectedArticle.sentiment && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sentimentColor(selectedArticle.sentiment)}`}>
                    {selectedArticle.sentiment === "positive" ? "📈" : selectedArticle.sentiment === "negative" ? "📉" : "➡️"} {selectedArticle.sentiment}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-800/50 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Summary</span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{selectedArticle.summary}</p>
              </div>

              {selectedArticle.impact && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Fleet Impact</span>
                  </div>
                  <p className="text-cyan-100 text-sm leading-relaxed">{selectedArticle.impact}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !selectedArticle && articles.map((article, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-slate-900/60 border ${colors.border} ${colors.hover} transition-all cursor-pointer group`}
            onClick={() => setSelectedArticle(article)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-white font-semibold text-sm leading-snug group-hover:text-cyan-300 transition-colors flex-1">{article.title}</h4>
              <BookOpen className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-0.5 transition-colors" />
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-3">{article.summary}</p>

            {article.impact && (
              <div className="mb-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <p className="text-cyan-300 text-xs"><span className="font-semibold">Fleet Impact:</span> {article.impact}</p>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 text-xs font-medium">{article.source}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 text-xs">{article.date}</span>
              {article.sentiment && (
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sentimentColor(article.sentiment)}`}>
                  {article.sentiment === "positive" ? "📈" : article.sentiment === "negative" ? "📉" : "➡️"} {article.sentiment}
                </span>
              )}
            </div>
          </div>
        ))}

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Newspaper className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 text-sm">No articles found</p>
          </div>
        )}
      </div>
    </div>
  );
}