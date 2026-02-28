import React, { useState, useRef } from "react";
import { Search, ExternalLink, Globe, Loader2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const QUICK_SEARCHES = [
  { label: "Google", url: "https://www.google.com/search?q=" },
  { label: "Maps", url: "https://www.google.com/maps/search/" },
  { label: "LinkedIn", url: "https://www.linkedin.com/search/results/all/?keywords=" },
  { label: "MarineTraffic", url: "https://www.marinetraffic.com/en/ais/index/ships/range/zoom:4/q:" },
  { label: "FlightAware", url: "https://flightaware.com/live/flight/" },
  { label: "Windy", url: "https://www.windy.com/?gfs," },
];

const EMBEDDABLE_URLS = [
  { label: "Bing Maps", url: "https://www.bing.com/maps?cp=55.68~12.57&lvl=6" },
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309082,51.47612752641776,0.00030577182769775396,51.478569861898606&layer=mapnik" },
  { label: "Marine Traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:8/centery:56/zoom:6" },
  { label: "FlightRadar24", url: "https://www.flightradar24.com" },
  { label: "Windy", url: "https://embed.windy.com/embed2.html?lat=56&lon=10&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&forecast=12&mouseWheelZoom=true&product=ecmwf&pressure=true&type=map&location=coordinates" },
];

export default function WebBrowser() {
  const [query, setQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeEmbed, setActiveEmbed] = useState(null);
  const [embedLoading, setEmbedLoading] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setAiAnswer(null);
    setActiveEmbed(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Answer this query concisely and informatively: "${query}"\n\nProvide: a direct answer, key facts, and 3-5 relevant web links with their full URLs. Format response nicely.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            facts: { type: "array", items: { type: "string" } },
            links: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" } } } }
          }
        }
      });
      setAiAnswer(result);
    } catch (err) {
      setAiAnswer({ answer: "Søgning mislykkedes. Prøv igen.", facts: [], links: [] });
    }
    setLoading(false);
  };

  const openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openQuickSearch = (baseUrl) => {
    if (!query.trim()) {
      window.open(baseUrl.replace(/[=:]$/, ""), "_blank", "noopener,noreferrer");
    } else {
      window.open(baseUrl + encodeURIComponent(query), "_blank", "noopener,noreferrer");
    }
  };

  const loadEmbed = (embed) => {
    setEmbedLoading(true);
    setAiAnswer(null);
    setActiveEmbed(embed);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 p-3 bg-slate-900/80 border-b border-cyan-500/20 flex-shrink-0">
        <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søg med AI eller skriv et spørgsmål..."
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-cyan-500/60 placeholder:text-slate-500"
        />
        <Button type="submit" disabled={loading || !query.trim()} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        {query && (
          <Button type="button" size="sm" variant="ghost" onClick={() => { setQuery(""); setAiAnswer(null); setActiveEmbed(null); }} className="text-slate-400 hover:text-white px-2">
            <X className="w-4 h-4" />
          </Button>
        )}
      </form>

      {/* Quick Search Engines */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 border-b border-slate-800/50 flex-shrink-0 overflow-x-auto">
        <span className="text-slate-500 text-[10px] font-semibold uppercase mr-1 whitespace-nowrap">Åbn i:</span>
        {QUICK_SEARCHES.map((s) => (
          <button key={s.label} onClick={() => openQuickSearch(s.url)}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/60 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/40 hover:border-cyan-500/40 transition-colors whitespace-nowrap flex items-center gap-1">
            {s.label}
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        ))}
      </div>

      {/* Embeddable Maps */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/30 flex-shrink-0 overflow-x-auto">
        <span className="text-slate-500 text-[10px] font-semibold uppercase mr-1 whitespace-nowrap">Live kort:</span>
        {EMBEDDABLE_URLS.map((e) => (
          <button key={e.label} onClick={() => loadEmbed(e)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors whitespace-nowrap ${activeEmbed?.label === e.label ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-cyan-300 border-slate-700/40 hover:border-cyan-500/40 hover:bg-cyan-500/10'}`}>
            {e.label}
          </button>
        ))}
        {activeEmbed && (
          <button onClick={() => { setActiveEmbed(null); setEmbedLoading(false); }} className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
            Luk
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Embedded Map */}
        {activeEmbed && (
          <div className="w-full h-full relative">
            {embedLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            )}
            <iframe
              src={activeEmbed.url}
              className="w-full h-full border-0"
              title={activeEmbed.label}
              onLoad={() => setEmbedLoading(false)}
              allow="geolocation"
            />
          </div>
        )}

        {/* AI Search Results */}
        {!activeEmbed && loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">AI søger med internetadgang...</p>
          </div>
        )}

        {!activeEmbed && !loading && aiAnswer && (
          <div className="p-4 space-y-4">
            {/* Main Answer */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-xs font-semibold uppercase">AI Svar</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{aiAnswer.answer}</p>
            </div>

            {/* Facts */}
            {aiAnswer.facts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold uppercase">Nøglefakta</h4>
                {aiAnswer.facts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300 text-xs leading-relaxed">{fact}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Links */}
            {aiAnswer.links?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold uppercase">Relevante links</h4>
                {aiAnswer.links.map((link, i) => (
                  <button key={i} onClick={() => openExternal(link.url)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-colors text-left group">
                    <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate group-hover:text-cyan-300">{link.title}</p>
                      <p className="text-slate-500 text-[10px] truncate">{link.url}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!activeEmbed && !loading && !aiAnswer && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <Globe className="w-12 h-12 text-cyan-400/40" />
            <div>
              <p className="text-slate-300 font-medium mb-1">AI-drevet søgemaskine</p>
              <p className="text-slate-500 text-sm">Skriv et spørgsmål for AI-svar med links, eller brug genvejene til at åbne et eksternt site — eller vælg et live kort nedenfor.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}