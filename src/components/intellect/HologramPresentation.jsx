import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorPlay, Sparkles, ChevronLeft, ChevronRight,
  Play, Pause, Zap, BarChart3, Brain, Wand2,
  AlignLeft, AlignCenter, Layers, Target, CheckCircle, Loader2, X,
  Copy, MoveUp, MoveDown, Timer, Mic, MicOff, RefreshCw,
  Settings, Download, FileText, Lightbulb, TrendingUp, Eye,
  ArrowUp, ArrowDown, Grid, PanelLeft, Maximize, Minimize,
  LayoutDashboard, Clock, Keyboard, ChevronDown, ChevronUp, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DesignToolsPanel from "./DesignToolsPanel";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";

const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const SLIDE_TEMPLATES = [
  { id: "title", label: "Title", icon: AlignCenter },
  { id: "content", label: "Bullets", icon: AlignLeft },
  { id: "chart", label: "Chart", icon: BarChart3 },
  { id: "split", label: "Split", icon: Layers },
  { id: "impact", label: "Impact", icon: Target },
  { id: "comparison", label: "Compare", icon: LayoutDashboard },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "closing", label: "Closing", icon: CheckCircle },
];

const HOLOGRAM_THEMES = [
  { id: "nexus", label: "Nexus Blue", primary: "#06b6d4", secondary: "#8b5cf6", accent: "#0e7490", bg: "from-slate-950 via-cyan-950/30 to-slate-950" },
  { id: "aurora", label: "Aurora", primary: "#10b981", secondary: "#06b6d4", accent: "#065f46", bg: "from-slate-950 via-emerald-950/30 to-slate-950" },
  { id: "solar", label: "Solar Storm", primary: "#f59e0b", secondary: "#ef4444", accent: "#92400e", bg: "from-slate-950 via-amber-950/20 to-slate-950" },
  { id: "violet", label: "Deep Violet", primary: "#8b5cf6", secondary: "#ec4899", accent: "#4c1d95", bg: "from-slate-950 via-violet-950/30 to-slate-950" },
  { id: "crimson", label: "Crimson", primary: "#ef4444", secondary: "#f97316", accent: "#7f1d1d", bg: "from-slate-950 via-red-950/20 to-slate-950" },
  { id: "ice", label: "Ice White", primary: "#e2e8f0", secondary: "#94a3b8", accent: "#334155", bg: "from-slate-900 via-slate-800/50 to-slate-900" },
];

const TRANSITIONS = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "zoom", label: "Zoom" },
  { id: "flip", label: "Flip" },
];

const FONT_SIZES = ["small", "medium", "large"];

const TEMPLATES = [
  { id: "executive", label: "Executive Briefing", icon: "🎯", prompt: "Create an executive briefing presentation with strategic overview, KPIs, financial highlights, risks and roadmap" },
  { id: "fleet", label: "Fleet Performance", icon: "🚛", prompt: "Create a fleet performance review with vehicle metrics, route efficiency, maintenance stats, cost analysis and AI insights" },
  { id: "investor", label: "Investor Pitch", icon: "💼", prompt: "Create an investor pitch deck with problem, solution, market opportunity, business model, traction and team" },
  { id: "sustainability", label: "Sustainability Report", icon: "🌱", prompt: "Create a sustainability report with CO2 metrics, green initiatives, energy efficiency, targets and progress" },
  { id: "qreview", label: "Quarterly Review", icon: "📊", prompt: "Create a quarterly business review with achievements, challenges, financial results, team highlights and next quarter goals" },
  { id: "product", label: "Product Launch", icon: "🚀", prompt: "Create a product launch presentation with problem, features, demo, pricing, roadmap and go-to-market strategy" },
];

function SlideRenderer({ slide, theme, fontSize = "medium", showNotes = false }) {
  const t = HOLOGRAM_THEMES.find(t => t.id === theme) || HOLOGRAM_THEMES[0];
  const fontScale = fontSize === "small" ? 0.85 : fontSize === "large" ? 1.15 : 1;

  const gridLines = (
    <div className="absolute inset-0 pointer-events-none opacity-10"
      style={{ backgroundImage: `linear-gradient(${t.primary}33 1px, transparent 1px), linear-gradient(90deg, ${t.primary}33 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
  );

  const glow = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: t.primary }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: t.secondary }} />
    </div>
  );

  const scanline = (
    <motion.div className="absolute inset-0 pointer-events-none"
      style={{ background: `linear-gradient(transparent 50%, ${t.primary}05 50%)`, backgroundSize: "100% 4px" }} />
  );

  return (
    <div className={`w-full h-full bg-gradient-to-br ${t.bg} relative overflow-hidden rounded-xl border border-opacity-20`}
      style={{ borderColor: t.primary + "30" }}>
      {gridLines}{glow}{scanline}

      {/* Corner accents */}
      {[["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl", ""],
        ["top-0 right-0 border-t-2 border-r-2 rounded-tr-xl", ""],
        ["bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl", ""],
        ["bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl", ""]
      ].map(([cls], i) => (
        <div key={i} className={`absolute w-14 h-14 ${cls} opacity-50`} style={{ borderColor: t.primary }} />
      ))}

      {/* Slide tag */}
      <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-60">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.primary }} />
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.primary }}>FLEET SLIDE</span>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-10 pt-8 pb-6"
        style={{ fontSize: `${fontScale}em` }}>

        {slide.type === "title" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-semibold tracking-widest uppercase"
                style={{ borderColor: t.primary + "60", color: t.primary, background: t.primary + "15" }}>
                <Sparkles className="w-3 h-3" />{slide.subtitle || "Fleet Intelligence"}
              </div>
              <h1 className="text-5xl font-black text-white mb-5 leading-tight"
                style={{ textShadow: `0 0 60px ${t.primary}80` }}>{slide.title || "Presentation Title"}</h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">{slide.body || "AI-Powered Strategic Intelligence"}</p>
              {slide.author && <p className="mt-8 text-sm text-slate-500">{slide.author}</p>}
            </motion.div>
          </div>
        )}

        {slide.type === "content" && (
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold text-white mb-5" style={{ color: t.primary }}>{slide.title}</h2>
            {slide.body && <p className="text-slate-400 text-base mb-4 leading-relaxed">{slide.body}</p>}
            <div className="space-y-2.5">
              {(slide.bullets || []).map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.2 }}
                  className="flex items-start gap-3 group">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                    style={{ background: t.primary + "20", color: t.primary, border: `1px solid ${t.primary}40` }}>
                    {i + 1}
                  </div>
                  <p className="text-slate-200 text-lg leading-snug">{b}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {slide.type === "chart" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white" style={{ color: t.primary }}>{slide.title}</h2>
              {slide.chartInsight && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: t.primary + "15", color: t.primary }}>
                  <TrendingUp className="w-3 h-3" />{slide.chartInsight}
                </div>
              )}
            </div>
            {slide.chartData && (
              <ResponsiveContainer width="100%" height={200}>
                {slide.chartType === "radar" ? (
                  <RadarChart data={slide.chartData}>
                    <PolarGrid stroke={t.primary + "30"} />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Radar dataKey="value" stroke={t.primary} fill={t.primary + "30"} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                  </RadarChart>
                ) : slide.chartType === "line" ? (
                  <LineChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke={t.primary} strokeWidth={3} dot={{ fill: t.primary, r: 4 }} />
                    {slide.chartData[0]?.target !== undefined && (
                      <Line type="monotone" dataKey="target" stroke={t.secondary} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    )}
                  </LineChart>
                ) : slide.chartType === "area" ? (
                  <AreaChart data={slide.chartData}>
                    <defs>
                      <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={t.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" stroke={t.primary} fill="url(#colorGrad)" strokeWidth={2} />
                  </AreaChart>
                ) : slide.chartType === "pie" ? (
                  <PieChart>
                    <Pie data={slide.chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={30}
                      label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {slide.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                ) : (
                  <BarChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Bar dataKey="value" fill={t.primary} radius={[4, 4, 0, 0]} />
                    {slide.chartData[0]?.target !== undefined && (
                      <Bar dataKey="target" fill={t.secondary + "60"} radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
            {slide.body && <p className="mt-2 text-slate-400 text-sm">{slide.body}</p>}
          </motion.div>
        )}

        {slide.type === "split" && (
          <div className="grid grid-cols-2 gap-8 h-full items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-white mb-4" style={{ color: t.primary }}>{slide.title}</h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-4">{slide.body}</p>
              {slide.bullets?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.primary }} />
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="rounded-xl p-5 border space-y-2" style={{ background: t.primary + "08", borderColor: t.primary + "30" }}>
              {(slide.stats || []).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: t.primary + "20" }}>
                  <span className="text-slate-400 text-sm">{s.label}</span>
                  <div className="text-right">
                    <span className="font-black text-xl" style={{ color: t.primary }}>{s.value}</span>
                    {s.delta && <span className={`ml-2 text-xs ${s.delta.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.delta}</span>}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {slide.type === "impact" && (
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: "spring" }} className="text-center">
            <div className="relative inline-block mb-4">
              <div className="text-8xl font-black" style={{ color: t.primary, textShadow: `0 0 80px ${t.primary}, 0 0 40px ${t.primary}80` }}>
                {slide.metric || "94%"}
              </div>
              <div className="absolute inset-0 blur-3xl opacity-30 rounded-full" style={{ background: t.primary }} />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">{slide.body}</p>
            {slide.submetrics?.length > 0 && (
              <div className="flex justify-center gap-8 mt-6">
                {slide.submetrics.map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold" style={{ color: t.secondary }}>{m.value}</div>
                    <div className="text-xs text-slate-500">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {slide.type === "comparison" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-white mb-5" style={{ color: t.primary }}>{slide.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              {(slide.columns || []).map((col, ci) => (
                <div key={ci} className="rounded-xl p-4 border" style={{ background: (ci === 0 ? t.primary : t.secondary) + "10", borderColor: (ci === 0 ? t.primary : t.secondary) + "30" }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: ci === 0 ? t.primary : t.secondary }}>{col.label}</h3>
                  <div className="space-y-2">
                    {(col.items || []).map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ci === 0 ? t.primary : t.secondary }} />
                        {item}
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
            <h2 className="text-2xl font-bold text-white mb-5" style={{ color: t.primary }}>{slide.title}</h2>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 opacity-30" style={{ background: t.primary }} />
              <div className="space-y-4">
                {(slide.events || []).map((ev, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-4 items-start pl-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2"
                      style={{ background: t.primary + "20", borderColor: t.primary, color: t.primary }}>
                      {ev.period || (i + 1)}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="font-semibold text-white text-sm">{ev.title}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{ev.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {slide.type === "closing" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: t.primary, background: t.primary + "20", boxShadow: `0 0 40px ${t.primary}40` }}>
                <CheckCircle className="w-10 h-10" style={{ color: t.primary }} />
              </div>
              <h2 className="text-5xl font-black text-white mb-5" style={{ textShadow: `0 0 40px ${t.primary}60` }}>{slide.title || "Thank You"}</h2>
              <p className="text-xl text-slate-300 max-w-xl mx-auto">{slide.body}</p>
              {slide.contact && <p className="mt-6 text-sm font-mono" style={{ color: t.primary }}>{slide.contact}</p>}
            </motion.div>
          </div>
        )}
      </div>

      {/* Speaker notes indicator */}
      {slide.notes && !showNotes && (
        <div className="absolute bottom-2 left-4 flex items-center gap-1 opacity-30">
          <Mic className="w-3 h-3" style={{ color: t.primary }} />
          <span className="text-[8px]" style={{ color: t.primary }}>Notes</span>
        </div>
      )}

      {/* Slide number */}
      <div className="absolute bottom-3 right-5 text-xs font-mono opacity-30" style={{ color: t.primary }}>
        {slide.index != null ? String(slide.index + 1).padStart(2, "0") : ""}
      </div>
    </div>
  );
}

function PresenterMode({ slides, current, setCurrent, theme, fontSize, onExit }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(8);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const slidesWithIndex = slides.map((s, i) => ({ ...s, index: i }));

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(() => {
        setCurrent(c => c < slides.length - 1 ? c + 1 : c);
      }, autoPlayInterval * 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [autoPlay, autoPlayInterval, slides.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "Space") setCurrent(c => Math.min(slides.length - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent(c => Math.max(0, c - 1));
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const t = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];
  const currentSlide = slidesWithIndex[current];

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      {/* Main slide */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-5xl" style={{ aspectRatio: "16/9" }}>
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="w-full h-full">
                <SlideRenderer slide={currentSlide} theme={theme} fontSize={fontSize} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Presenter sidebar */}
        <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Timer */}
          <div className="rounded-xl p-3 border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Elapsed Time</span>
              <button onClick={() => setRunning(r => !r)} className="text-slate-400 hover:text-white">
                {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-3xl font-mono font-bold" style={{ color: t.primary }}>{fmt(elapsed)}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-600">{current + 1} / {slides.length} slides</span>
              <button onClick={() => { setElapsed(0); setRunning(true); }} className="text-[10px] text-slate-600 hover:text-slate-400">Reset</button>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 flex-1">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-slate-800">
              <Mic className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium">Speaker Notes</span>
            </div>
            <div className="p-3">
              {currentSlide?.notes ? (
                <p className="text-slate-300 text-sm leading-relaxed">{currentSlide.notes}</p>
              ) : (
                <p className="text-slate-600 text-xs italic">No notes for this slide</p>
              )}
            </div>
          </div>

          {/* Next slide preview */}
          {current < slides.length - 1 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Next Slide</p>
              <div className="rounded-lg overflow-hidden border border-slate-800" style={{ aspectRatio: "16/9" }}>
                <SlideRenderer slide={slidesWithIndex[current + 1]} theme={theme} fontSize="small" />
              </div>
            </div>
          )}

          {/* Auto-play */}
          <div className="rounded-xl p-3 border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Auto-advance</span>
              <button onClick={() => setAutoPlay(a => !a)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${autoPlay ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-500"}`}>
                {autoPlay ? "ON" : "OFF"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600">Every</span>
              <input type="number" value={autoPlayInterval} onChange={e => setAutoPlayInterval(Number(e.target.value))} min={3} max={60}
                className="w-12 h-6 bg-slate-800 border border-slate-700 rounded text-xs text-white text-center" />
              <span className="text-[10px] text-slate-600">seconds</span>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="text-[10px] text-slate-600 space-y-0.5 px-1">
            <div className="flex justify-between"><span>Next slide</span><span className="font-mono">→ / Space</span></div>
            <div className="flex justify-between"><span>Prev slide</span><span className="font-mono">←</span></div>
            <div className="flex justify-between"><span>Exit</span><span className="font-mono">Esc</span></div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/90 border-t border-white/10">
        <Button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} variant="ghost" className="text-white hover:bg-white/10">
          <ChevronLeft className="w-5 h-5 mr-1" />Prev
        </Button>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`transition-all rounded-full ${i === current ? "w-6 h-2" : "w-2 h-2"} ${i === current ? "" : "bg-slate-700 hover:bg-slate-500"}`}
              style={i === current ? { background: t.primary } : {}} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs">{current + 1} / {slides.length}</span>
          <Button onClick={onExit} variant="ghost" className="text-red-400 hover:bg-red-500/10">
            <X className="w-4 h-4 mr-1" />Exit
          </Button>
        </div>
        <Button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1} variant="ghost" className="text-white hover:bg-white/10">
          Next<ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function HologramPresentation({ orgId }) {
  const [slides, setSlides] = useState([
    { id: 1, type: "title", title: "Fleet Intelligence 2026", subtitle: "Strategic Briefing", body: "AI-Powered Operations & Business Intelligence", notes: "Welcome everyone. Today we'll walk through our fleet performance and strategic outlook for 2026." },
  ]);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState("nexus");
  const [fontSize, setFontSize] = useState("medium");
  const [transition, setTransition] = useState("fade");
  const [isPresenting, setIsPresenting] = useState(false);
  const [syncKey, setSyncKey] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [rightTab, setRightTab] = useState("edit");
  const [showTemplates, setShowTemplates] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const presenterWindowRef = useRef(null);

  const currentSlide = slides[current];
  const slidesWithIndex = slides.map((s, i) => ({ ...s, index: i }));

  // Timer for presenter mode
  useEffect(() => {
    if (isPresenting && timerRunning) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPresenting, timerRunning]);



  // Load real org data on mount
  useEffect(() => {
    if (!orgId) return;
    const loadOrgData = async () => {
      setLoadingData(true);
      try {
        const [vehicles, routes, shipments, alerts, maintenance, resources] = await Promise.all([
          base44.entities.Vehicle.filter({ organization_id: orgId }, '-updated_date', 50),
          base44.entities.Route.filter({ organization_id: orgId }, '-updated_date', 20),
          base44.entities.Shipment.filter({ organization_id: orgId }, '-updated_date', 30),
          base44.entities.Alert.filter({ organization_id: orgId }, '-created_date', 20),
          base44.entities.Maintenance.filter({ organization_id: orgId }, '-updated_date', 20),
          base44.entities.Resource.filter({ organization_id: orgId }, '-updated_date', 20),
        ]);
        const data = { vehicles, routes, shipments, alerts, maintenance, resources };
        setOrgData(data);
        toast.success(`✅ Loaded live data: ${vehicles.length} vehicles, ${shipments.length} shipments`);
      } catch (e) {
        console.error("Could not load org data", e);
      }
      setLoadingData(false);
    };
    loadOrgData();
  }, [orgId]);

  const addSlide = (templateId) => {
    const defaults = {
      title: { type: "title", title: "New Section", subtitle: "Subtitle", body: "Add your description", notes: "" },
      content: { type: "content", title: "Key Points", bullets: ["First key insight", "Second important point", "Third takeaway"], body: "", notes: "" },
      chart: { type: "chart", title: "Data Overview", chartType: "bar", chartData: [{ label: "Q1", value: 42 }, { label: "Q2", value: 68 }, { label: "Q3", value: 55 }, { label: "Q4", value: 89 }], body: "Quarterly performance trend", chartInsight: "+18% YoY", notes: "" },
      split: { type: "split", title: "Performance Review", body: "Key metrics and highlights for this period", stats: [{ label: "Fleet Efficiency", value: "94%", delta: "+3%" }, { label: "On-Time Delivery", value: "97%", delta: "+1%" }, { label: "Cost Savings", value: "€2.4M", delta: "+12%" }], notes: "" },
      impact: { type: "impact", title: "Efficiency Gained", metric: "94%", body: "Through AI-driven route optimization", submetrics: [{ label: "Routes optimized", value: "1,240" }, { label: "CO2 saved", value: "48t" }], notes: "" },
      comparison: { type: "comparison", title: "Before vs After AI", columns: [{ label: "Before AI", items: ["Manual route planning", "8% late deliveries", "High fuel costs", "Reactive maintenance"] }, { label: "After AI", items: ["Automated optimization", "1% late deliveries", "23% fuel reduction", "Predictive maintenance"] }], notes: "" },
      timeline: { type: "timeline", title: "Roadmap 2026", events: [{ period: "Q1", title: "AI Fleet Integration", description: "Deploy real-time tracking and AI analysis" }, { period: "Q2", title: "Route Optimization", description: "Full autonomous route optimization launch" }, { period: "Q3", title: "Predictive Maintenance", description: "Zero-downtime maintenance program" }, { period: "Q4", title: "Green TMS", description: "Carbon neutral operations achieved" }], notes: "" },
      closing: { type: "closing", title: "Thank You", body: "Questions & Discussion", contact: "fleet@nexusvectis.com", notes: "Open for questions. Key contacts are on the handout." },
    };
    const newSlide = { ...defaults[templateId], id: Date.now() };
    const newSlides = [...slides.slice(0, current + 1), newSlide, ...slides.slice(current + 1)];
    setSlides(newSlides);
    setCurrent(current + 1);
  };

  const removeSlide = (idx) => {
    if (slides.length === 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setCurrent(Math.min(current, next.length - 1));
  };

  const duplicateSlide = (idx) => {
    const dup = { ...slides[idx], id: Date.now() };
    const next = [...slides.slice(0, idx + 1), dup, ...slides.slice(idx + 1)];
    setSlides(next);
    setCurrent(idx + 1);
    toast.success("Slide duplicated");
  };

  const moveSlide = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    [next[idx], next[to]] = [next[to], next[idx]];
    setSlides(next);
    setCurrent(to);
  };

  const updateCurrentSlide = (updates) => {
    setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...updates } : s));
  };

  const saveToFleetDrive = async () => {
    if (!orgId) { toast.error("Ingen organisation fundet"); return; }
    toast.info("💾 Gemmer præsentation...");
    try {
      // Serialize presentation as JSON file
      const data = JSON.stringify({ slides, theme, fontSize, transition, savedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const file = new File([blob], `FleetSlide - ${slides[0]?.title || "Præsentation"} - ${new Date().toLocaleDateString("da-DK")}.fleetslide`, { type: "application/json" });
      const res = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = res?.data?.file_url || res?.file_url;
      if (!fileUrl) throw new Error("Upload fejlede");
      await base44.entities.FleetDriveFile.create({
        organization_id: orgId,
        name: file.name,
        file_url: fileUrl,
        file_type: "other",
        file_size_bytes: blob.size,
        mime_type: "application/json",
        folder: "Presentations",
        source: "uploaded",
        description: `FleetSlide præsentation med ${slides.length} slides`,
        tags: ["presentation", "fleetslide"],
      });
      toast.success(`✅ Gemt til Fleet Drive → Presentations`);
    } catch (e) {
      toast.error("Gem fejlede: " + e.message);
    }
  };

  const openPresenterWindow = () => {
    const data = btoa(JSON.stringify({ slides, theme, fontSize, transition }));
    presenterWindowRef.current = window.open(
      `${window.location.origin}/FleetSlidePresenter?data=${data}`,
      "fleetslide_presenter",
      "width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  // Sync slides between windows
  useEffect(() => {
    if (!isPresenting) return;
    
    const channel = new BroadcastChannel("fleetslide-sync");
    
    // Listen for events from presenter window
    channel.onmessage = (event) => {
      if (event.data.type === "slide-change") {
        setCurrent(event.data.slide);
      } else if (event.data.type === "close") {
        setIsPresenting(false);
        if (presenterWindowRef.current) presenterWindowRef.current.close();
      }
    };
    
    // Send slide changes to presenter window
    channel.postMessage({ type: "slide-change", slide: current });
    
    return () => channel.close();
  }, [isPresenting, current]);

  const generateWithAI = async (customPrompt) => {
    const prompt = customPrompt || aiPrompt;
    if (!prompt.trim()) return;
    setGenerating(true);
    toast.info("🧠 AI generating presentation with live data...");

    // Build a rich data context from real org data
    let dataContext = "";
    if (orgData) {
      const { vehicles, routes, shipments, alerts, maintenance, resources } = orgData;
      const activeV = vehicles.filter(v => v.status === "active").length;
      const idleV = vehicles.filter(v => v.status === "idle").length;
      const maintV = vehicles.filter(v => v.status === "maintenance").length;
      const inTransit = shipments.filter(s => s.status === "in_transit").length;
      const delayed = shipments.filter(s => s.status === "delayed").length;
      const delivered = shipments.filter(s => s.status === "delivered").length;
      const critAlerts = alerts.filter(a => a.type === "critical" && !a.is_resolved).length;
      const pendingMaint = maintenance.filter(m => m.status === "pending").length;
      const avgEfficiency = vehicles.filter(v => v.efficiency_score).length > 0
        ? Math.round(vehicles.reduce((a, v) => a + (v.efficiency_score || 0), 0) / vehicles.filter(v => v.efficiency_score).length)
        : null;
      const vehicleTypes = [...new Set(vehicles.map(v => v.type))];
      const topRoutes = routes.slice(0, 5).map(r => r.name).join(", ");

      dataContext = `
LIVE ORGANIZATION DATA (use these REAL numbers in the presentation):
- Total vehicles: ${vehicles.length} (Active: ${activeV}, Idle: ${idleV}, In Maintenance: ${maintV})
- Vehicle types: ${vehicleTypes.join(", ")}
- Shipments: ${shipments.length} total (In transit: ${inTransit}, Delayed: ${delayed}, Delivered: ${delivered})
- Critical unresolved alerts: ${critAlerts}
- Pending maintenance tasks: ${pendingMaint}
- Average fleet efficiency score: ${avgEfficiency !== null ? avgEfficiency + "%" : "N/A"}
- Active routes: ${routes.length} (Top routes: ${topRoutes || "N/A"})
- Resources/depots: ${resources.length}
- Recent vehicle samples: ${vehicles.slice(0, 5).map(v => `${v.name} (${v.type}, ${v.status}${v.fuel_level ? ", fuel: " + v.fuel_level + "%" : ""})`).join("; ")}

USE THESE EXACT NUMBERS in charts, stats, and metrics. Do not invent data when real data is provided.`;
    }

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class presentation designer. Create a compelling holographic business presentation about: "${prompt}"
${dataContext}

Generate 7-10 slides. Use the REAL organization data above (when available) for all numbers, stats, and charts. Make it professional and impactful.

Available types: title, content, chart, split, impact, comparison, timeline, closing

Return JSON:
{
  "slides": [
    { "type": "title", "title": "...", "subtitle": "...", "body": "...", "author": "Fleet Intelligence Team", "notes": "Speaker note for this slide" },
    { "type": "content", "title": "...", "bullets": ["...", "...", "...", "..."], "body": "...", "notes": "..." },
    { "type": "chart", "title": "...", "chartType": "bar|line|area|pie|radar", "chartData": [{"label": "...", "value": 0}], "body": "...", "chartInsight": "Key insight label", "notes": "..." },
    { "type": "split", "title": "...", "body": "...", "bullets": ["bullet1", "bullet2"], "stats": [{"label": "...", "value": "...", "delta": "+X%"}], "notes": "..." },
    { "type": "impact", "title": "...", "metric": "...", "body": "...", "submetrics": [{"label": "...", "value": "..."}], "notes": "..." },
    { "type": "comparison", "title": "...", "columns": [{"label": "Option A", "items": ["..."]}, {"label": "Option B", "items": ["..."]}], "notes": "..." },
    { "type": "timeline", "title": "...", "events": [{"period": "Q1", "title": "...", "description": "..."}], "notes": "..." },
    { "type": "closing", "title": "...", "body": "...", "contact": "...", "notes": "..." }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            slides: { type: "array", items: { type: "object", additionalProperties: true } }
          }
        }
      });
      if (result?.slides?.length > 0) {
        const generated = result.slides.map((s, i) => ({ ...s, id: Date.now() + i }));
        setSlides(generated);
        setCurrent(0);
        toast.success(`✅ Generated ${generated.length} slides`);
      }
    } catch (e) {
      toast.error("AI generation failed");
    }
    setGenerating(false);
    setAiPrompt("");
    setShowTemplates(false);
  };

  const enhanceSlide = async () => {
    setEnhancing(true);
    toast.info("✨ AI enhancing slide...");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert presentation designer. Improve and enhance this slide content to be more impactful, data-driven, and compelling. Keep the same slide type but make it significantly better.

Current slide: ${JSON.stringify(currentSlide)}

Return the enhanced slide as JSON with the same structure but with:
- More compelling titles and text
- Better bullet points (more specific, actionable)
- Realistic metrics and data where applicable
- Professional speaker notes
- For chart slides: better chart data with realistic numbers
- For split slides: more impactful stats with deltas

Return only the slide JSON object (same fields as input, enhanced values).`,
        response_json_schema: {
          type: "object",
          additionalProperties: true
        }
      });
      if (result) {
        setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...result, id: s.id } : s));
        toast.success("✅ Slide enhanced with AI");
      }
    } catch (e) {
      toast.error("Enhancement failed");
    }
    setEnhancing(false);
  };

  const addAISpeakerNotes = async () => {
    setEnhancing(true);
    toast.info("🎤 Generating speaker notes...");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate professional, detailed speaker notes for this presentation slide. The notes should guide a presenter through 60-90 seconds of speaking, with key talking points, transitions, and engagement tips.

Slide: ${JSON.stringify({ type: currentSlide.type, title: currentSlide.title, body: currentSlide.body, bullets: currentSlide.bullets })}

Return JSON: { "notes": "...speaker notes text..." }`,
        response_json_schema: {
          type: "object",
          properties: { notes: { type: "string" } }
        }
      });
      if (result?.notes) {
        updateCurrentSlide({ notes: result.notes });
        toast.success("✅ Speaker notes added");
      }
    } catch (e) {
      toast.error("Failed to generate notes");
    }
    setEnhancing(false);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const tTheme = HOLOGRAM_THEMES.find(th => th.id === theme) || HOLOGRAM_THEMES[0];

  if (isPresenting) {
    const currentSlide = slidesWithIndex[current];
    const nextSlide = slidesWithIndex[current + 1];
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">Presenter View</span>
            <span className="text-slate-500 text-xs">{current + 1} / {slides.length}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-xl font-mono font-bold" style={{ color: tTheme.primary }}>{fmt(elapsed)}</span>
              <button onClick={() => setTimerRunning(r => !r)} className="text-slate-400 hover:text-white">
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setElapsed(0); setTimerRunning(true); }} className="text-slate-600 hover:text-slate-400 text-[10px]">↺</button>
            </div>
            <Button onClick={() => {
              const channel = new BroadcastChannel("fleetslide-sync");
              channel.postMessage({ type: "close" });
              channel.close();
              setIsPresenting(false); setSyncKey(null); setElapsed(0); setTimerRunning(false); if (presenterWindowRef.current) presenterWindowRef.current.close();
            }}
              size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 text-xs h-7">
              <X className="w-3.5 h-3.5 mr-1" />Afslut
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0 gap-4 p-4">
          {/* Current slide preview */}
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Nuværende slide</p>
            <div className="rounded-xl overflow-hidden border border-cyan-500/30 flex-1" style={{ aspectRatio: "16/9", maxHeight: "60%" }}>
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full">
                  <SlideRenderer slide={currentSlide} theme={theme} fontSize={fontSize} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" />Forrige
              </Button>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === current ? 20 : 6, background: i === current ? tTheme.primary : "#334155" }} />
                ))}
              </div>
              <Button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1} size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                Næste<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Speaker notes */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Speaker Notes</span>
              </div>
              {currentSlide?.notes
                ? <p className="text-slate-200 text-sm leading-relaxed">{currentSlide.notes}</p>
                : <p className="text-slate-600 text-xs italic">Ingen noter for denne slide</p>}
            </div>
          </div>

          {/* Next slide */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Næste slide</p>
            {nextSlide ? (
              <div className="rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:border-slate-500 transition-all"
                style={{ aspectRatio: "16/9" }} onClick={() => setCurrent(c => c + 1)}>
                <SlideRenderer slide={nextSlide} theme={theme} fontSize="small" />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-center text-slate-600 text-xs" style={{ aspectRatio: "16/9" }}>
                Sidste slide
              </div>
            )}

            {/* Slide list */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {slidesWithIndex.map((s, i) => (
                <div key={s.id} onClick={() => setCurrent(i)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${i === current ? "bg-cyan-500/20 border border-cyan-500/40 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
                  <span className="font-mono text-[9px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate">{s.title || s.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-500/20 flex-shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm text-white">FleetSlide</span>
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/40 text-[10px]">AI Studio</Badge>
          <span className="text-slate-600 text-xs">{slides.length} slides</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Font size */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
            {FONT_SIZES.map(f => (
              <button key={f} onClick={() => setFontSize(f)}
                className={`px-1.5 py-0.5 rounded text-[9px] capitalize transition-all ${fontSize === f ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
                {f === "small" ? "S" : f === "medium" ? "M" : "L"}
              </button>
            ))}
          </div>
          {/* Themes */}
          <div className="flex gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
            {HOLOGRAM_THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} title={t.label}
                className={`w-4 h-4 rounded-full border transition-all ${theme === t.id ? "border-white scale-125" : "border-transparent opacity-40 hover:opacity-70"}`}
                style={{ background: t.primary }} />
            ))}
          </div>
          <Button onClick={saveToFleetDrive} size="sm" variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-7 gap-1">
            <Download className="w-3 h-3" />Gem
          </Button>
          <Button onClick={() => { setIsPresenting(true); openPresenterWindow(); }} size="sm"
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 border-0 text-xs h-7 gap-1">
            <Maximize className="w-3 h-3" />Present
          </Button>
        </div>
      </div>

      {/* AI Generator Bar */}
      <div className="px-4 py-2 border-b border-slate-800/50 flex-shrink-0 bg-slate-900/30">
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-violet-500/30 text-violet-400 text-xs hover:bg-slate-800 transition-all flex-shrink-0">
            <Grid className="w-3.5 h-3.5" />Templates
            {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <div className="flex items-center gap-1.5 flex-1 px-3 py-1.5 bg-slate-800/60 border border-violet-500/30 rounded-lg">
            <Wand2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateWithAI()}
              placeholder="Describe your presentation topic... press Enter or click Generate"
              className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-600 outline-none" />
          </div>
          <Button onClick={() => generateWithAI()} disabled={generating || !aiPrompt.trim()} size="sm"
            className="bg-violet-600 hover:bg-violet-700 border-0 text-xs h-8 flex-shrink-0 gap-1">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Generating..." : "AI Generate"}
          </Button>
        </div>
        {/* Template picker */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2">
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => generateWithAI(tmpl.prompt)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 hover:bg-slate-800 transition-all text-left">
                    <span className="text-base">{tmpl.icon}</span>
                    <span className="text-xs text-slate-300">{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Slide panel */}
        <div className="w-36 flex-shrink-0 border-r border-slate-800/50 flex flex-col overflow-y-auto bg-slate-900/20 p-2 gap-1.5">
          {slides.map((slide, idx) => (
            <div key={slide.id} onClick={() => setCurrent(idx)}
              className={`relative group rounded-lg overflow-hidden border cursor-pointer transition-all flex-shrink-0 ${idx === current ? "border-cyan-500/70 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10" : "border-slate-700/40 hover:border-slate-600/60"}`}
              style={{ aspectRatio: "16/9" }}>
              <div className="w-full h-full pointer-events-none" style={{ transform: "scale(0.148)", transformOrigin: "top left", width: "676%", height: "676%" }}>
                <SlideRenderer slide={{ ...slide, index: idx }} theme={theme} />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="flex items-center justify-center gap-0.5 py-1">
                  <button onClick={e => { e.stopPropagation(); moveSlide(idx, -1); }} disabled={idx === 0}
                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30"><ArrowUp className="w-2.5 h-2.5" /></button>
                  <button onClick={e => { e.stopPropagation(); duplicateSlide(idx); }}
                    className="p-0.5 text-white/70 hover:text-white"><Copy className="w-2.5 h-2.5" /></button>
                  <button onClick={e => { e.stopPropagation(); moveSlide(idx, 1); }} disabled={idx === slides.length - 1}
                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30"><ArrowDown className="w-2.5 h-2.5" /></button>
                  {slides.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); removeSlide(idx); }}
                      className="p-0.5 text-red-400 hover:text-red-300"><X className="w-2.5 h-2.5" /></button>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                <span className="text-[8px] text-slate-400">{idx + 1} · {slide.type}</span>
              </div>
            </div>
          ))}

          {/* Add slide */}
          <div className="mt-1 border-t border-slate-800/50 pt-2">
            <p className="text-[8px] text-slate-600 uppercase tracking-wider mb-1.5 px-1">+ Add Slide</p>
            {SLIDE_TEMPLATES.map(tmpl => (
              <button key={tmpl.id} onClick={() => addSlide(tmpl.id)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all">
                <tmpl.icon className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                <span className="truncate">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main preview */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-950">
          <div className="flex-1 flex items-center justify-center p-5 overflow-hidden" style={{ background: "radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)" }}>
            <div className="w-full max-w-3xl shadow-2xl shadow-black/50" style={{ aspectRatio: "16/9" }}>
              <AnimatePresence mode="wait">
                <motion.div key={current}
                  initial={transition === "zoom" ? { opacity: 0, scale: 0.9 } : transition === "flip" ? { opacity: 0, rotateY: 90 } : transition === "slide" ? { opacity: 0, x: 60 } : { opacity: 0 }}
                  animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                  exit={transition === "zoom" ? { opacity: 0, scale: 1.05 } : transition === "flip" ? { opacity: 0, rotateY: -90 } : transition === "slide" ? { opacity: 0, x: -60 } : { opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full h-full">
                  <SlideRenderer slide={slidesWithIndex[current]} theme={theme} fontSize={fontSize} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 py-2 border-t border-slate-800/40 flex-shrink-0 bg-slate-900/30">
            <Button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${i === current ? "bg-cyan-400 w-5" : "bg-slate-700 w-1.5 hover:bg-slate-500"}`} />
              ))}
            </div>
            <Button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-600">{current + 1}/{slides.length}</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 border-l border-slate-800/50 flex flex-col overflow-hidden bg-slate-900/20">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
            <TabsList className="rounded-none border-b border-slate-800 bg-slate-900/60 flex-shrink-0 h-8 px-1 grid w-full grid-cols-3">
              <TabsTrigger value="design" className="text-[10px] h-6 data-[state=active]:bg-slate-800">Design</TabsTrigger>
              <TabsTrigger value="notes" className="text-[10px] h-6 data-[state=active]:bg-slate-800">Notes</TabsTrigger>
              <TabsTrigger value="advanced" className="text-[10px] h-6 data-[state=active]:bg-slate-800">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="flex-1 overflow-hidden p-0 m-0">
              <DesignToolsPanel
                slide={slidesWithIndex[current]}
                onUpdate={updateCurrentSlide}
                onAddAnimation={(anim) => updateCurrentSlide({ animations: [...(currentSlide.animations || []), anim] })}
                onRemoveAnimation={(idx) => updateCurrentSlide({ animations: currentSlide.animations?.filter((_, i) => i !== idx) })}
                theme={theme}
                onThemeChange={setTheme}
              />
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-y-auto p-3 m-0 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-500 font-medium">Speaker Notes</label>
                <Button onClick={addAISpeakerNotes} disabled={enhancing} size="sm" className="h-6 text-[9px] bg-violet-600/70 hover:bg-violet-600 border-0 gap-0.5">
                  {enhancing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}AI
                </Button>
              </div>
              <Textarea
                value={currentSlide?.notes || ""}
                onChange={e => updateCurrentSlide({ notes: e.target.value })}
                placeholder="Add speaker notes for this slide..."
                className="text-xs bg-slate-800/60 border-slate-700/50 text-white resize-none flex-1 min-h-[200px]"
              />
              <p className="text-[9px] text-slate-600">Notes visible in presenter mode</p>
            </TabsContent>

            <TabsContent value="advanced" className="flex-1 overflow-y-auto p-3 m-0 space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 mb-2 block font-medium uppercase tracking-wider">Theme</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {HOLOGRAM_THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${theme === t.id ? "border-white/30 bg-white/5" : "border-slate-700/50 hover:border-slate-600"}`}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.primary }} />
                      <span className="text-[10px] text-slate-300 truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-2 block font-medium uppercase tracking-wider">Transition</label>
                <div className="grid grid-cols-2 gap-1">
                  {TRANSITIONS.map(tr => (
                    <button key={tr.id} onClick={() => setTransition(tr.id)}
                      className={`py-1.5 rounded text-[10px] transition-all ${transition === tr.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"}`}>
                      {tr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-2 block font-medium uppercase tracking-wider">Font Size</label>
                <div className="grid grid-cols-3 gap-1">
                  {FONT_SIZES.map(f => (
                    <button key={f} onClick={() => setFontSize(f)}
                      className={`py-1.5 rounded text-[10px] capitalize transition-all ${fontSize === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/50">
                <label className="text-[10px] text-slate-500 mb-2 block font-medium uppercase tracking-wider">Slide Actions</label>
                <div className="space-y-1">
                  <button onClick={() => duplicateSlide(current)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
                    <Copy className="w-3 h-3" />Duplicate slide
                  </button>
                  <button onClick={() => moveSlide(current, -1)} disabled={current === 0} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-30">
                    <ArrowUp className="w-3 h-3" />Move up
                  </button>
                  <button onClick={() => moveSlide(current, 1)} disabled={current === slides.length - 1} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all disabled:opacity-30">
                    <ArrowDown className="w-3 h-3" />Move down
                  </button>
                  {slides.length > 1 && (
                    <button onClick={() => removeSlide(current)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                      <X className="w-3 h-3" />Delete slide
                    </button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}