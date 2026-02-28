import React, { useState, useRef } from "react";
import { Search, ArrowLeft, ArrowRight, RotateCw, Home, Globe, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  { label: "Google", url: "https://www.google.com/webhp?igu=1" },
  { label: "Maps", url: "https://maps.google.com" },
  { label: "LinkedIn", url: "https://www.linkedin.com" },
  { label: "MarineTraffic", url: "https://www.marinetraffic.com" },
  { label: "FlightAware", url: "https://flightaware.com" },
  { label: "Weather", url: "https://www.windy.com" },
];

export default function WebBrowser() {
  const [url, setUrl] = useState("https://www.google.com/webhp?igu=1");
  const [inputUrl, setInputUrl] = useState("https://www.google.com/webhp?igu=1");
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);
  const historyRef = useRef(["https://www.google.com/webhp?igu=1"]);
  const historyIndexRef = useRef(0);

  const navigate = (target) => {
    let finalUrl = target.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      // treat as search query if no dots or looks like a query
      if (!finalUrl.includes(".") || finalUrl.includes(" ")) {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }
    // Trim history forward
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(finalUrl);
    historyIndexRef.current = historyRef.current.length - 1;
    setUrl(finalUrl);
    setInputUrl(finalUrl);
  };

  const goBack = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = historyRef.current[historyIndexRef.current];
      setUrl(prev);
      setInputUrl(prev);
    }
  };

  const goForward = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const next = historyRef.current[historyIndexRef.current];
      setUrl(next);
      setInputUrl(next);
    }
  };

  const reload = () => {
    setLoading(true);
    const current = url;
    setUrl("");
    setTimeout(() => setUrl(current), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") navigate(inputUrl);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 p-2 bg-slate-900/80 border-b border-cyan-500/20 flex-shrink-0">
        <Button onClick={goBack} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button onClick={goForward} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button onClick={reload} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button onClick={() => navigate("https://www.google.com/webhp?igu=1")} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
          <Home className="w-4 h-4" />
        </Button>

        {/* URL / Search bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg focus-within:border-cyan-500/50">
          <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-slate-500 min-w-0"
            placeholder="Search or enter URL..."
          />
          {inputUrl && (
            <button onClick={() => { setInputUrl(""); }} className="text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Button onClick={() => navigate(inputUrl)} size="icon" variant="ghost" className="h-7 w-7 text-cyan-400 hover:text-cyan-300">
          <Search className="w-4 h-4" />
        </Button>

        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 border-b border-slate-800/50 flex-shrink-0 overflow-x-auto">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.url)}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/60 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/40 hover:border-cyan-500/40 transition-colors whitespace-nowrap"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* iFrame */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="Web Browser"
            onLoad={() => setLoading(false)}
            onLoadStart={() => setLoading(true)}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}