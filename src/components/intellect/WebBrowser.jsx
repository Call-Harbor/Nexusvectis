import React, { useState, useRef } from "react";
import { Search, ExternalLink, Globe, Loader2, ArrowLeft, RefreshCw, X, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const QUICK_SITES = [
  { label: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=-5,48,20,62&layer=mapnik" },
  { label: "Windy", url: "https://embed.windy.com/embed2.html?lat=56&lon=10&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&forecast=12&mouseWheelZoom=true&product=ecmwf&pressure=true&type=map&location=coordinates" },
  { label: "Marine Traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:8/centery:56/zoom:6" },
  { label: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/Main_Page" },
  { label: "Wolfram Alpha", url: "https://www.wolframalpha.com" },
];

export default function WebBrowser() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [addressBar, setAddressBar] = useState("");

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setIframeUrl(null);
    setIframeError(false);
    try {
      const res = await base44.functions.invoke('duckduckgoSearch', { query });
      setResults(res.data);
    } catch (err) {
      setResults({ error: "Søgning mislykkedes." });
    }
    setLoading(false);
  };

  const loadInFrame = (url) => {
    setIframeError(false);
    setIframeLoading(true);
    setResults(null);
    setIframeUrl(url);
    setAddressBar(url);
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    let url = addressBar.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    loadInFrame(url);
  };

  const closeFrame = () => {
    setIframeUrl(null);
    setIframeError(false);
    setAddressBar("");
  };

  const allLinks = results ? [
    ...(results.related_topics || []).map(t => ({ title: t.text, url: t.url, snippet: "" })),
    ...(results.supplement_links || [])
  ] : [];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* Top bar */}
      <form onSubmit={iframeUrl ? handleAddressSubmit : handleSearch}
        className="flex items-center gap-2 p-3 bg-slate-900/80 border-b border-cyan-500/20 flex-shrink-0">
        <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <input
          type="text"
          value={iframeUrl ? addressBar : query}
          onChange={(e) => iframeUrl ? setAddressBar(e.target.value) : setQuery(e.target.value)}
          placeholder={iframeUrl ? "URL..." : "Søg med DuckDuckGo..."}
          className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-cyan-500/60 placeholder:text-slate-500"
        />
        {iframeUrl ? (
          <>
            <Button type="submit" size="sm" className="bg-cyan-500 hover:bg-cyan-600 px-3">
              {iframeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={closeFrame} className="text-slate-400 hover:text-white px-2">
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={loading || !query.trim()} size="sm" className="bg-cyan-500 hover:bg-cyan-600 px-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
            {query && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { setQuery(""); setResults(null); }} className="text-slate-400 hover:text-white px-2">
                <X className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </form>

      {/* Quick sites */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/30 flex-shrink-0 overflow-x-auto">
        <span className="text-slate-500 text-[10px] font-semibold uppercase mr-1 whitespace-nowrap">Hurtig:</span>
        {QUICK_SITES.map((site) => (
          <button key={site.label} onClick={() => loadInFrame(site.url)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors whitespace-nowrap
              ${iframeUrl === site.url
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-cyan-300 border-slate-700/40 hover:border-cyan-500/40 hover:bg-cyan-500/10'}`}>
            {site.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">

        {/* iFrame */}
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
                <p className="text-white font-medium">Siden tillader ikke indlejring</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open(iframeUrl, "_blank", "noopener,noreferrer")} className="bg-cyan-500 hover:bg-cyan-600">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Åbn i ny fane
                  </Button>
                  <Button size="sm" variant="ghost" onClick={closeFrame} className="text-slate-400">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Tilbage
                  </Button>
                </div>
              </div>
            )}
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              className="w-full flex-1 border-0"
              title="Browser"
              onLoad={() => setIframeLoading(false)}
              onError={() => { setIframeLoading(false); setIframeError(true); }}
              allow="geolocation"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        )}

        {/* Loading */}
        {!iframeUrl && loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="flex items-center gap-2">
              <img src="https://duckduckgo.com/favicon.ico" className="w-5 h-5" alt="DDG" />
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
            <p className="text-slate-400 text-sm">Søger med DuckDuckGo...</p>
          </div>
        )}

        {/* Results */}
        {!iframeUrl && !loading && results && (
          <div className="p-4 space-y-4 overflow-auto h-full">

            {/* Instant answer */}
            {results.answer && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200 text-sm">{results.answer}</p>
              </div>
            )}

            {/* Abstract */}
            {results.abstract && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <img src="https://duckduckgo.com/favicon.ico" className="w-4 h-4" alt="" />
                  <span className="text-cyan-400 text-xs font-semibold uppercase">
                    {results.abstract_source || "DuckDuckGo"}
                  </span>
                  {results.abstract_url && (
                    <button onClick={() => loadInFrame(results.abstract_url)} className="ml-auto text-[10px] text-cyan-400 hover:underline">
                      Åbn her →
                    </button>
                  )}
                </div>
                {results.image && (
                  <img src={results.image} alt="" className="w-24 h-24 object-cover rounded-lg float-right ml-3 mb-2" />
                )}
                <p className="text-slate-200 text-sm leading-relaxed">{results.abstract}</p>
              </div>
            )}

            {/* Definition */}
            {results.definition && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <p className="text-slate-400 text-[10px] uppercase mb-1">{results.definition_source}</p>
                <p className="text-slate-200 text-sm">{results.definition}</p>
              </div>
            )}

            {/* Links */}
            {allLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold uppercase flex items-center gap-2">
                  <img src="https://duckduckgo.com/favicon.ico" className="w-3.5 h-3.5" alt="" />
                  Resultater
                </h4>
                {allLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:border-cyan-500/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{link.title}</p>
                      {link.snippet && <p className="text-slate-500 text-[10px] line-clamp-1">{link.snippet}</p>}
                      <p className="text-slate-600 text-[10px] truncate">{link.url}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => loadInFrame(link.url)}
                        className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-colors whitespace-nowrap">
                        Åbn her
                      </button>
                      <button onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                        className="text-[10px] px-1.5 py-1 rounded bg-slate-700/60 text-slate-400 hover:text-white border border-slate-600/30 transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.error && (
              <p className="text-red-400 text-sm text-center mt-8">{results.error}</p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!iframeUrl && !loading && !results && (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <img src="https://duckduckgo.com/favicon.ico" className="w-10 h-10 opacity-50" alt="DuckDuckGo" />
            <div>
              <p className="text-slate-300 font-medium mb-1">DuckDuckGo Browser</p>
              <p className="text-slate-500 text-sm">Søg nedenfor, klik "Åbn her" på et resultat — eller vælg en hurtigside.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}