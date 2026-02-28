import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Globe, ArrowLeft, ArrowRight, RefreshCw, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEARCH_ENGINES = [
  { name: "Google", url: "https://www.google.com/search?q=", home: "https://www.google.com", icon: "🔍" },
  { name: "Bing", url: "https://www.bing.com/search?q=", home: "https://www.bing.com", icon: "🌐" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", home: "https://duckduckgo.com", icon: "🦆" },
];

const PROXY_BASE = "https://corsproxy.io/?";

export default function HologramBrowser() {
  const [query, setQuery] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [displayUrl, setDisplayUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [engine, setEngine] = useState(SEARCH_ENGINES[2]); // DuckDuckGo works best in iframes
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const iframeRef = useRef(null);

  const navigate = (url) => {
    setIsLoading(true);
    setCurrentUrl(url);
    setDisplayUrl(url);
    const newHistory = [...history.slice(0, historyIdx + 1), url];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const isUrl = /^https?:\/\//i.test(query) || /^www\./i.test(query);
    const url = isUrl
      ? query.startsWith("http") ? query : `https://${query}`
      : `${engine.url}${encodeURIComponent(query)}`;
    navigate(url);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setCurrentUrl(history[newIdx]);
      setDisplayUrl(history[newIdx]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setCurrentUrl(history[newIdx]);
      setDisplayUrl(history[newIdx]);
    }
  };

  const goHome = () => {
    navigate(engine.home);
    setQuery("");
  };

  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80">
      {/* Browser Toolbar */}
      <div className="flex flex-col gap-2 p-3 border-b border-cyan-500/20 bg-slate-900/60">
        {/* Nav controls + address bar */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={goBack}
            disabled={historyIdx <= 0}
            className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={goForward}
            disabled={historyIdx >= history.length - 1}
            className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={refresh}
            disabled={!currentUrl}
            className="h-7 w-7 text-slate-400 hover:text-white disabled:opacity-30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={goHome}
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            <Home className="w-3.5 h-3.5" />
          </Button>

          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={query || displayUrl}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDisplayUrl(e.target.value);
                }}
                onFocus={() => {
                  if (!query) setDisplayUrl(currentUrl);
                }}
                placeholder="Search or enter URL..."
                className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-500 outline-none"
              />
              {(query || displayUrl) && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setDisplayUrl(currentUrl); }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs px-3"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>

        {/* Engine selector */}
        <div className="flex gap-1.5">
          {SEARCH_ENGINES.map((e) => (
            <button
              key={e.name}
              onClick={() => setEngine(e)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                engine.name === e.name
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {e.icon} {e.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {!currentUrl ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
            <div className="text-6xl">🌐</div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-2">Hologram Browser</h3>
              <p className="text-slate-400 text-sm">Search the web or enter a URL above</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {[
                { label: "MarineTraffic", url: "https://www.marinetraffic.com" },
                { label: "Flightradar24", url: "https://www.flightradar24.com" },
                { label: "Freightos", url: "https://freightos.com" },
                { label: "Incoterms Guide", url: "https://iccwbo.org/business-solutions/incoterms-rules" },
              ].map((bookmark) => (
                <button
                  key={bookmark.label}
                  onClick={() => { navigate(bookmark.url); setQuery(bookmark.url); }}
                  className="text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                >
                  🔖 {bookmark.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 animate-pulse z-10" />
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0"
              title="Hologram Browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-navigation"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </>
        )}
      </div>

      {/* Note about iframe restrictions */}
      {currentUrl && (
        <div className="px-3 py-1.5 bg-amber-500/5 border-t border-amber-500/20 text-[10px] text-amber-400/60">
          ⚠️ Some sites block embedding. If blank, try DuckDuckGo or a different site.
        </div>
      )}
    </div>
  );
}