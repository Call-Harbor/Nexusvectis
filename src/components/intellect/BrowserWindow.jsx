import { useState, useRef } from "react";
import { Globe2, ArrowLeft, ArrowRight, RotateCcw, Home } from "lucide-react";

const SEARCH_ENGINES = [
  { name: "Google", url: "https://www.google.com/webhp?igu=1" },
  { name: "Bing", url: "https://www.bing.com" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com" },
];

export default function BrowserWindow() {
  const [currentUrl, setCurrentUrl] = useState(SEARCH_ENGINES[0].url);
  const [inputUrl, setInputUrl] = useState("");
  const iframeRef = useRef(null);

  const navigate = (url) => {
    setCurrentUrl(url);
    setInputUrl("");
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    let url = inputUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // treat as search query
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
    }
    navigate(url);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900/90 border-b border-cyan-500/20 flex-shrink-0">
        <Globe2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <form onSubmit={handleNavigate} className="flex-1 flex gap-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search or enter URL..."
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs hover:bg-cyan-500/30 transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Search engine shortcuts */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/60 border-b border-white/5 flex-shrink-0">
        {SEARCH_ENGINES.map((engine) => (
          <button
            key={engine.name}
            onClick={() => navigate(engine.url)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              currentUrl === engine.url
                ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            {engine.name}
          </button>
        ))}
        <button
          onClick={() => navigate("https://www.bing.com/maps")}
          className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          Maps
        </button>
        <button
          onClick={() => navigate("https://www.marinetraffic.com")}
          className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          MarineTraffic
        </button>
        <button
          onClick={() => navigate("https://www.flightradar24.com")}
          className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          FlightRadar
        </button>
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={currentUrl}
        className="w-full flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation"
        title="Browser"
      />
    </div>
  );
}