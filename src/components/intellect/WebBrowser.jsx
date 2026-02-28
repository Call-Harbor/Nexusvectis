import React, { useState, useRef } from "react";
import { Search, ExternalLink, Globe, Loader2, ArrowRight, X, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

// Sites known to allow embedding
const EMBEDDABLE_SITES = [
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=-5,48,20,62&layer=mapnik" },
  { label: "Marine Traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:8/centery:56/zoom:6" },
  { label: "Windy", url: "https://embed.windy.com/embed2.html?lat=56&lon=10&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&forecast=12&mouseWheelZoom=true&product=ecmwf&pressure=true&type=map&location=coordinates" },
  { label: "FlightRadar24", url: "https://www.flightradar24.com/simple" },
  { label: "Wolfram Alpha", url: "https://www.wolframalpha.com" },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/Main_Page" },
];

export default function WebBrowser() {
  const [query, setQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [addressBar, setAddressBar] = useState("");
  const iframeRef = useRef(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setAiAnswer(null);
    setIframeUrl(null);
    setIframeError(false);
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

  const loadInFrame = (url) => {
    setIframeError(false);
    setIframeLoading(true);
    setAiAnswer(null);
    setIframeUrl(url);
    setAddressBar(url);
  };

  const handleAddressBar = (e) => {
    e.preventDefault();
    let url = addressBar.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    loadInFrame(url);
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  const openExternal = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const closeFrame = () => {
    setIframeUrl(null);
    setIframeError(false);
    setAddressBar("");
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Address / Search Bar */}
      <form onSubmit={iframeUrl ? handleAddressBar : handleSearch} className="flex items-center gap-2 p-3 bg-slate-900/80 border-b border-cyan-500/20 flex-shrink-0">
        <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <input
          type="text"
          value={iframeUrl ? addressBar : query}
          onChange={(e) => iframeUrl ? setAddressBar(e.target.value) : setQuery(e.target.value)}
          placeholder={iframeUrl ? "Skriv en URL..." : "Søg med AI eller skriv et spørgsmål..."}
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-cyan-500/60 placeholder:text-slate-500"
        />
        {iframeUrl ? (
          <>
            <Button type="submit" size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3">
              {iframeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={closeFrame} className="text-slate-400 hover:text-white px-2">
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={loading || !query.trim()} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
            {query && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { setQuery(""); setAiAnswer(null); }} className="text-slate-400 hover:text-white px-2">
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </form>

      {/* Quick embed sites */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/30 flex-shrink-0 overflow-x-auto">
        <span className="text-slate-500 text-[10px] font-semibold uppercase mr-1 whitespace-nowrap">Sider:</span>
        {EMBEDDABLE_SITES.map((site) => (
          <button key={site.label} onClick={() => loadInFrame(site.url)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors whitespace-nowrap ${iframeUrl === site.url ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/60 text-slate-400 hover:text-cyan-300 border-slate-700/40 hover:border-cyan-500/40 hover:bg-cyan-500/10'}`}>
            {site.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">

        {/* iFrame view */}
        {iframeUrl && (
          <div className="absolute inset-0 flex flex-col">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            )}
            {iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 gap-4 p-6 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <div>
                  <p className="text-white font-medium mb-1">Siden kan ikke vises her</p>
                  <p className="text-slate-400 text-sm mb-4">Denne side tillader ikke indlejring. Du kan åbne den i en ny fane i stedet.</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => openExternal(iframeUrl)} className="bg-cyan-500 hover:bg-cyan-600">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Åbn i ny fane
                    </Button>
                    <Button size="sm" variant="ghost" onClick={closeFrame} className="text-slate-400">
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Tilbage
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={iframeUrl}
              src={iframeUrl}
              className="w-full flex-1 border-0"
              title="Browser"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="geolocation"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        )}

        {/* AI Search Results */}
        {!iframeUrl && loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">AI søger med internetadgang...</p>
          </div>
        )}

        {!iframeUrl && !loading && aiAnswer && (
          <div className="p-4 space-y-4 overflow-auto h-full">
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

            {/* Links — click to load in frame */}
            {aiAnswer.links?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold uppercase">Relevante links</h4>
                {aiAnswer.links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-800/80 transition-colors group">
                    <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{link.title}</p>
                      <p className="text-slate-500 text-[10px] truncate">{link.url}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => loadInFrame(link.url)}
                        className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors">
                        Åbn her
                      </button>
                      <button onClick={() => openExternal(link.url)}
                        className="text-[10px] px-2 py-1 rounded bg-slate-700/60 text-slate-400 hover:text-white border border-slate-600/30 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!iframeUrl && !loading && !aiAnswer && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <Globe className="w-12 h-12 text-cyan-400/40" />
            <div>
              <p className="text-slate-300 font-medium mb-1">AI-drevet webbrowser</p>
              <p className="text-slate-500 text-sm">Søg for AI-svar med links, klik "Åbn her" for at se siden i vinduet, eller vælg en hurtigside ovenfor.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}