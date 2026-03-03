import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Play, Pause, X, Mic, Maximize, Minimize,
  Sparkles, CheckCircle, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";

const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const HOLOGRAM_THEMES = [
  { id: "nexus", primary: "#06b6d4", secondary: "#8b5cf6", bg: "from-slate-950 via-cyan-950/30 to-slate-950" },
  { id: "aurora", primary: "#10b981", secondary: "#06b6d4", bg: "from-slate-950 via-emerald-950/30 to-slate-950" },
  { id: "solar", primary: "#f59e0b", secondary: "#ef4444", bg: "from-slate-950 via-amber-950/20 to-slate-950" },
  { id: "violet", primary: "#8b5cf6", secondary: "#ec4899", bg: "from-slate-950 via-violet-950/30 to-slate-950" },
  { id: "crimson", primary: "#ef4444", secondary: "#f97316", bg: "from-slate-950 via-red-950/20 to-slate-950" },
  { id: "ice", primary: "#e2e8f0", secondary: "#94a3b8", bg: "from-slate-900 via-slate-800/50 to-slate-900" },
];

function SlideRenderer({ slide, theme, fontSize = "medium" }) {
  const t = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];
  const fontScale = fontSize === "small" ? 0.85 : fontSize === "large" ? 1.15 : 1;

  return (
    <div className={`w-full h-full bg-gradient-to-br ${t.bg} relative overflow-hidden`}
      style={{ borderColor: t.primary + "30" }}>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: `linear-gradient(${t.primary}33 1px, transparent 1px), linear-gradient(90deg, ${t.primary}33 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: t.primary }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: t.secondary }} />
      </div>
      {/* Corners */}
      {[["top-0 left-0 border-t-2 border-l-2"], ["top-0 right-0 border-t-2 border-r-2"], ["bottom-0 left-0 border-b-2 border-l-2"], ["bottom-0 right-0 border-b-2 border-r-2"]].map(([cls], i) => (
        <div key={i} className={`absolute w-20 h-20 ${cls} opacity-40`} style={{ borderColor: t.primary }} />
      ))}
      {/* FLEET SLIDE tag */}
      <div className="absolute top-4 left-6 flex items-center gap-2 opacity-50">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: t.primary }} />
        <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: t.primary }}>FLEET SLIDE</span>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-16 pt-12 pb-8"
        style={{ fontSize: `${fontScale}em` }}>

        {slide.type === "title" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-8 text-sm font-semibold tracking-widest uppercase"
                style={{ borderColor: t.primary + "60", color: t.primary, background: t.primary + "15" }}>
                <Sparkles className="w-4 h-4" />{slide.subtitle || "Fleet Intelligence"}
              </div>
              <h1 className="text-7xl font-black text-white mb-6 leading-tight"
                style={{ textShadow: `0 0 80px ${t.primary}80` }}>{slide.title}</h1>
              <p className="text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">{slide.body}</p>
              {slide.author && <p className="mt-10 text-base text-slate-500">{slide.author}</p>}
            </motion.div>
          </div>
        )}

        {slide.type === "content" && (
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-5xl font-bold text-white mb-8" style={{ color: t.primary }}>{slide.title}</h2>
            {slide.body && <p className="text-slate-400 text-xl mb-6 leading-relaxed">{slide.body}</p>}
            <div className="space-y-4">
              {(slide.bullets || []).map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.2 }}
                  className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold"
                    style={{ background: t.primary + "20", color: t.primary, border: `1px solid ${t.primary}40` }}>
                    {i + 1}
                  </div>
                  <p className="text-slate-200 text-2xl leading-snug">{b}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {slide.type === "chart" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-bold" style={{ color: t.primary }}>{slide.title}</h2>
              {slide.chartInsight && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm" style={{ background: t.primary + "15", color: t.primary }}>
                  <TrendingUp className="w-4 h-4" />{slide.chartInsight}
                </div>
              )}
            </div>
            {slide.chartData && (
              <ResponsiveContainer width="100%" height={280}>
                {slide.chartType === "radar" ? (
                  <RadarChart data={slide.chartData}>
                    <PolarGrid stroke={t.primary + "30"} />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 13 }} />
                    <Radar dataKey="value" stroke={t.primary} fill={t.primary + "30"} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                  </RadarChart>
                ) : slide.chartType === "line" ? (
                  <LineChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 13 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 10 }} />
                    <Line type="monotone" dataKey="value" stroke={t.primary} strokeWidth={3} dot={{ fill: t.primary, r: 5 }} />
                  </LineChart>
                ) : slide.chartType === "area" ? (
                  <AreaChart data={slide.chartData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={t.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 13 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 10 }} />
                    <Area type="monotone" dataKey="value" stroke={t.primary} fill="url(#areaGrad)" strokeWidth={3} />
                  </AreaChart>
                ) : slide.chartType === "pie" ? (
                  <PieChart>
                    <Pie data={slide.chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={120} innerRadius={40}
                      label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}>
                      {slide.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 10 }} />
                    <Legend iconType="circle" />
                  </PieChart>
                ) : (
                  <BarChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 13 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 13 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 10 }} />
                    <Bar dataKey="value" fill={t.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
            {slide.body && <p className="mt-3 text-slate-400 text-base">{slide.body}</p>}
          </motion.div>
        )}

        {slide.type === "split" && (
          <div className="grid grid-cols-2 gap-12 h-full items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-4xl font-bold text-white mb-5" style={{ color: t.primary }}>{slide.title}</h2>
              <p className="text-slate-300 text-xl leading-relaxed">{slide.body}</p>
              {slide.bullets?.length > 0 && (
                <div className="space-y-3 mt-5">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-base text-slate-300">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.primary }} />{b}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 border space-y-3" style={{ background: t.primary + "08", borderColor: t.primary + "30" }}>
              {(slide.stats || []).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b last:border-0" style={{ borderColor: t.primary + "20" }}>
                  <span className="text-slate-400 text-base">{s.label}</span>
                  <div className="text-right">
                    <span className="font-black text-3xl" style={{ color: t.primary }}>{s.value}</span>
                    {s.delta && <span className={`ml-2 text-sm ${s.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.delta}</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {slide.type === "impact" && (
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: "spring" }} className="text-center">
            <div className="relative inline-block mb-4">
              <div className="text-[120px] font-black leading-none" style={{ color: t.primary, textShadow: `0 0 100px ${t.primary}, 0 0 60px ${t.primary}80` }}>
                {slide.metric || "94%"}
              </div>
            </div>
            <h2 className="text-5xl font-bold text-white mb-5">{slide.title}</h2>
            <p className="text-2xl text-slate-300 max-w-2xl mx-auto">{slide.body}</p>
            {slide.submetrics?.length > 0 && (
              <div className="flex justify-center gap-12 mt-8">
                {slide.submetrics.map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold" style={{ color: t.secondary }}>{m.value}</div>
                    <div className="text-sm text-slate-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {slide.type === "comparison" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-4xl font-bold text-white mb-6" style={{ color: t.primary }}>{slide.title}</h2>
            <div className="grid grid-cols-2 gap-6">
              {(slide.columns || []).map((col, ci) => (
                <div key={ci} className="rounded-2xl p-6 border" style={{ background: (ci === 0 ? t.primary : t.secondary) + "10", borderColor: (ci === 0 ? t.primary : t.secondary) + "30" }}>
                  <h3 className="font-bold text-lg mb-4" style={{ color: ci === 0 ? t.primary : t.secondary }}>{col.label}</h3>
                  <div className="space-y-3">
                    {(col.items || []).map((item, ii) => (
                      <div key={ii} className="flex items-center gap-3 text-base text-slate-300">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ci === 0 ? t.primary : t.secondary }} />{item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {slide.type === "timeline" && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-4xl font-bold text-white mb-8" style={{ color: t.primary }}>{slide.title}</h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 opacity-30" style={{ background: t.primary }} />
              <div className="space-y-5">
                {(slide.events || []).map((ev, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-6 items-start pl-2">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold border-2"
                      style={{ background: t.primary + "20", borderColor: t.primary, color: t.primary }}>
                      {ev.period || (i + 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xl">{ev.title}</div>
                      <div className="text-slate-400 text-base mt-1">{ev.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {slide.type === "closing" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="w-28 h-28 mx-auto mb-8 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: t.primary, background: t.primary + "20", boxShadow: `0 0 60px ${t.primary}50` }}>
                <CheckCircle className="w-14 h-14" style={{ color: t.primary }} />
              </div>
              <h2 className="text-7xl font-black text-white mb-6" style={{ textShadow: `0 0 60px ${t.primary}60` }}>{slide.title || "Thank You"}</h2>
              <p className="text-2xl text-slate-300 max-w-2xl mx-auto">{slide.body}</p>
              {slide.contact && <p className="mt-8 text-lg font-mono" style={{ color: t.primary }}>{slide.contact}</p>}
            </motion.div>
          </div>
        )}
      </div>

      {slide.notes && (
        <div className="absolute bottom-4 left-6 flex items-center gap-2 opacity-30">
          <Mic className="w-4 h-4" style={{ color: t.primary }} />
          <span className="text-[10px]" style={{ color: t.primary }}>Speaker notes available</span>
        </div>
      )}
      <div className="absolute bottom-4 right-8 text-sm font-mono opacity-30" style={{ color: t.primary }}>
        {slide.index != null ? String(slide.index + 1).padStart(2, "0") : ""}
      </div>
    </div>
  );
}

export default function FleetSlidePresenter() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState("nexus");
  const [fontSize, setFontSize] = useState("medium");
  const [transition, setTransition] = useState("fade");
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySec, setAutoPlaySec] = useState(8);
  const timerRef = useRef(null);
  const autoRef = useRef(null);

  useEffect(() => {
    // Load from localStorage key - check both hash params and search params
    const hashPart = window.location.hash.split("?")[1] || "";
    const hashParams = new URLSearchParams(hashPart);
    const searchParams = new URLSearchParams(window.location.search);
    const key = hashParams.get("key") || hashParams.get("fleetslide") || searchParams.get("fleetslide") || searchParams.get("key");
    if (key) {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        setSlides(parsed.slides || []);
        setTheme(parsed.theme || "nexus");
        setFontSize(parsed.fontSize || "medium");
        setTransition(parsed.transition || "fade");
        localStorage.removeItem(key);
      }
    }
    // Auto request fullscreen
    const tryFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    };
    setTimeout(tryFullscreen, 500);

    document.addEventListener("fullscreenchange", () => {
      setIsFullscreen(!!document.fullscreenElement);
    });
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      autoRef.current = setInterval(() => {
        setCurrent(c => c < slides.length - 1 ? c + 1 : c);
      }, autoPlaySec * 1000);
    } else clearInterval(autoRef.current);
    return () => clearInterval(autoRef.current);
  }, [autoPlay, autoPlaySec, slides.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrent(c => Math.min((slides.length || 1) - 1, c + 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setCurrent(c => Math.max(0, c - 1)); }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "n" || e.key === "N") setShowNotes(s => !s);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const t = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];
  const slidesWithIndex = slides.map((s, i) => ({ ...s, index: i }));
  const currentSlide = slidesWithIndex[current];

  if (!slides.length) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-slate-400">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col select-none" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8" style={{ background: "radial-gradient(ellipse at center, #0a0f1a 0%, #000 100%)" }}>
        <div className="w-full max-w-6xl shadow-2xl shadow-black/80" style={{ aspectRatio: "16/9" }}>
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={transition === "zoom" ? { opacity: 0, scale: 0.9 } : transition === "slide" ? { opacity: 0, x: 80 } : transition === "flip" ? { opacity: 0, rotateY: 90 } : { opacity: 0 }}
              animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
              exit={transition === "zoom" ? { opacity: 0, scale: 1.05 } : transition === "slide" ? { opacity: 0, x: -80 } : transition === "flip" ? { opacity: 0, rotateY: -90 } : { opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full">
              <SlideRenderer slide={currentSlide} theme={theme} fontSize={fontSize} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Speaker notes overlay */}
      <AnimatePresence>
        {showNotes && currentSlide?.notes && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="px-8 py-4 border-t border-white/10 bg-slate-950/95 backdrop-blur">
            <div className="flex items-start gap-3 max-w-5xl mx-auto">
              <Mic className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-slate-300 text-sm leading-relaxed">{currentSlide.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/95 border-t border-white/10 flex-shrink-0">
        {/* Left: nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />Prev
          </button>
          <div className="flex gap-1 px-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="rounded-full transition-all h-1.5"
                style={{ width: i === current ? 20 : 6, background: i === current ? t.primary : "#334155" }} />
            ))}
          </div>
          <button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
            Next<ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-white/30 text-xs ml-1">{current + 1} / {slides.length}</span>
        </div>

        {/* Center: timer + controls */}
        <div className="flex items-center gap-3">
          <button onClick={() => setTimerRunning(r => !r)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-all font-mono">
            {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span style={{ color: t.primary }}>{fmt(elapsed)}</span>
          </button>
          <button onClick={() => setShowNotes(s => !s)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${showNotes ? "text-cyan-400 bg-cyan-500/10" : "text-white/40 hover:text-white/70"}`}>
            <Mic className="w-3 h-3" />Notes
          </button>
          <button onClick={() => setAutoPlay(a => !a)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${autoPlay ? "text-emerald-400 bg-emerald-500/10" : "text-white/40 hover:text-white/70"}`}>
            <Play className="w-3 h-3" />{autoPlay ? `Auto ${autoPlaySec}s` : "Auto"}
          </button>
        </div>

        {/* Right: fullscreen + shortcuts */}
        <div className="flex items-center gap-2">
          <span className="text-white/20 text-[10px] hidden md:flex gap-3">
            <span>← → navigate</span>
            <span>N notes</span>
            <span>F fullscreen</span>
          </span>
          <button onClick={toggleFullscreen}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            {isFullscreen ? "Exit" : "Fullscreen"} (F)
          </button>
          <button onClick={() => window.close()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />Close
          </button>
        </div>
      </div>
    </div>
  );
}