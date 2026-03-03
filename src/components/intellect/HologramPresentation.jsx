import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Sparkles, Plus, Trash2, ChevronLeft, ChevronRight,
  Play, Pause, Download, Zap, BarChart3, Brain, Wand2, Image,
  AlignLeft, AlignCenter, Maximize2, Eye, Edit3, Layers, Move,
  TrendingUp, Globe, Shield, Target, CheckCircle, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const SLIDE_TEMPLATES = [
  { id: "title", label: "Title Slide", icon: AlignCenter, gradient: "from-cyan-500/20 to-violet-500/20" },
  { id: "content", label: "Content", icon: AlignLeft, gradient: "from-slate-700/40 to-slate-800/40" },
  { id: "chart", label: "Data Chart", icon: BarChart3, gradient: "from-emerald-500/20 to-cyan-500/20" },
  { id: "split", label: "Split View", icon: Layers, gradient: "from-violet-500/20 to-pink-500/20" },
  { id: "impact", label: "Impact", icon: Target, gradient: "from-amber-500/20 to-red-500/20" },
  { id: "closing", label: "Closing", icon: CheckCircle, gradient: "from-cyan-500/20 to-emerald-500/20" },
];

const HOLOGRAM_THEMES = [
  { id: "nexus", label: "Nexus Blue", primary: "#06b6d4", secondary: "#8b5cf6", bg: "from-slate-950 via-cyan-950/30 to-slate-950" },
  { id: "aurora", label: "Aurora", primary: "#10b981", secondary: "#06b6d4", bg: "from-slate-950 via-emerald-950/30 to-slate-950" },
  { id: "solar", label: "Solar Storm", primary: "#f59e0b", secondary: "#ef4444", bg: "from-slate-950 via-amber-950/20 to-slate-950" },
  { id: "violet", label: "Deep Violet", primary: "#8b5cf6", secondary: "#ec4899", bg: "from-slate-950 via-violet-950/30 to-slate-950" },
];

function SlideRenderer({ slide, theme, isPresenting }) {
  const t = HOLOGRAM_THEMES.find(t => t.id === theme) || HOLOGRAM_THEMES[0];

  const gridLines = (
    <div className="absolute inset-0 pointer-events-none opacity-20"
      style={{ backgroundImage: `linear-gradient(${t.primary}22 1px, transparent 1px), linear-gradient(90deg, ${t.primary}22 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
  );

  const glow = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: t.primary }} />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: t.secondary }} />
    </div>
  );

  return (
    <div className={`w-full h-full bg-gradient-to-br ${t.bg} relative overflow-hidden rounded-xl`}>
      {gridLines}{glow}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 rounded-tl-xl opacity-60" style={{ borderColor: t.primary }} />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 rounded-tr-xl opacity-60" style={{ borderColor: t.primary }} />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 rounded-bl-xl opacity-60" style={{ borderColor: t.primary }} />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 rounded-br-xl opacity-60" style={{ borderColor: t.primary }} />

      <div className="relative z-10 h-full flex flex-col justify-center p-10">
        {slide.type === "title" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-semibold tracking-widest uppercase"
                style={{ borderColor: t.primary + "60", color: t.primary, background: t.primary + "15" }}>
                <Sparkles className="w-3 h-3" />{slide.subtitle || "Fleet Intelligence"}
              </div>
              <h1 className="text-5xl font-black text-white mb-4 leading-tight"
                style={{ textShadow: `0 0 40px ${t.primary}60` }}>{slide.title || "Presentation Title"}</h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">{slide.body || "AI-Powered Strategic Intelligence"}</p>
            </motion.div>
          </div>
        )}

        {slide.type === "content" && (
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold text-white mb-6" style={{ color: t.primary }}>{slide.title}</h2>
            <div className="space-y-3">
              {(slide.bullets || []).map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 + 0.2 }}
                  className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: t.primary }} />
                  <p className="text-slate-200 text-lg">{b}</p>
                </motion.div>
              ))}
            </div>
            {slide.body && <p className="mt-6 text-slate-400 text-base">{slide.body}</p>}
          </motion.div>
        )}

        {slide.type === "chart" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ color: t.primary }}>{slide.title}</h2>
            {slide.chartData && (
              <ResponsiveContainer width="100%" height={220}>
                {slide.chartType === "line" ? (
                  <LineChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="value" stroke={t.primary} strokeWidth={3} dot={{ fill: t.primary, r: 4 }} />
                  </LineChart>
                ) : slide.chartType === "area" ? (
                  <AreaChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" stroke={t.primary} fill={t.primary + "30"} strokeWidth={2} />
                  </AreaChart>
                ) : slide.chartType === "pie" ? (
                  <PieChart>
                    <Pie data={slide.chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}>
                      {slide.chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                  </PieChart>
                ) : (
                  <BarChart data={slide.chartData}>
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${t.primary}40`, borderRadius: 8 }} />
                    <Bar dataKey="value" fill={t.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
            {slide.body && <p className="mt-3 text-slate-400 text-sm">{slide.body}</p>}
          </motion.div>
        )}

        {slide.type === "split" && (
          <div className="grid grid-cols-2 gap-8 h-full items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-white mb-4" style={{ color: t.primary }}>{slide.title}</h2>
              <p className="text-slate-300 text-lg leading-relaxed">{slide.body}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
              className="rounded-xl p-6 border" style={{ background: t.primary + "10", borderColor: t.primary + "30" }}>
              <div className="space-y-3">
                {(slide.stats || []).map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b" style={{ borderColor: t.primary + "20" }}>
                    <span className="text-slate-400 text-sm">{s.label}</span>
                    <span className="font-bold text-lg" style={{ color: t.primary }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {slide.type === "impact" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="text-8xl font-black mb-4" style={{ color: t.primary, textShadow: `0 0 60px ${t.primary}` }}>
              {slide.metric || "94%"}
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">{slide.body}</p>
          </motion.div>
        )}

        {slide.type === "closing" && (
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: t.primary, background: t.primary + "20" }}>
                <CheckCircle className="w-10 h-10" style={{ color: t.primary }} />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">{slide.title || "Thank You"}</h2>
              <p className="text-xl text-slate-300 max-w-xl mx-auto">{slide.body}</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Slide number */}
      <div className="absolute bottom-4 right-6 text-xs font-mono opacity-40" style={{ color: t.primary }}>
        {slide.index != null ? `${String(slide.index + 1).padStart(2, "0")}` : ""}
      </div>
    </div>
  );
}

export default function HologramPresentation({ orgId }) {
  const [slides, setSlides] = useState([
    { id: 1, type: "title", title: "Fleet Intelligence 2026", subtitle: "Strategic Briefing", body: "AI-Powered Operations & Business Intelligence" },
  ]);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState("nexus");
  const [isPresenting, setIsPresenting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editSlide, setEditSlide] = useState(null);

  const currentSlide = slides[current];

  const addSlide = (templateId) => {
    const templates = {
      title: { type: "title", title: "New Title", subtitle: "Subtitle", body: "Description here" },
      content: { type: "content", title: "Key Points", bullets: ["Point one", "Point two", "Point three"], body: "" },
      chart: { type: "chart", title: "Data Overview", chartType: "bar", chartData: [{ label: "Q1", value: 42 }, { label: "Q2", value: 68 }, { label: "Q3", value: 55 }, { label: "Q4", value: 89 }], body: "Quarterly performance" },
      split: { type: "split", title: "Performance", body: "Key metrics overview for this period", stats: [{ label: "Fleet Efficiency", value: "94%" }, { label: "On-Time Delivery", value: "97%" }, { label: "Cost Savings", value: "€2.4M" }] },
      impact: { type: "impact", title: "Efficiency Gained", metric: "94%", body: "Through AI-driven route optimization" },
      closing: { type: "closing", title: "Thank You", body: "Questions & Discussion" },
    };
    const newSlide = { ...templates[templateId], id: Date.now() };
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

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    toast.info("🧠 AI generating presentation...");
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a world-class presentation designer with expertise in business intelligence, data visualization, and strategic communication. Create a compelling holographic presentation about: "${aiPrompt}"

Generate 6-8 slides that tell a compelling story. Use real-looking data and specific metrics.

Return JSON:
{
  "slides": [
    // Title slide
    { "type": "title", "title": "...", "subtitle": "...", "body": "..." },
    // Content slide with bullets
    { "type": "content", "title": "...", "bullets": ["...", "...", "..."], "body": "..." },
    // Chart slide with data
    { "type": "chart", "title": "...", "chartType": "bar|line|area|pie", "chartData": [{"label": "...", "value": 0}], "body": "..." },
    // Split slide with stats
    { "type": "split", "title": "...", "body": "...", "stats": [{"label": "...", "value": "..."}] },
    // Impact slide with big metric
    { "type": "impact", "title": "...", "metric": "...", "body": "..." },
    // Closing
    { "type": "closing", "title": "...", "body": "..." }
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
  };

  const updateCurrentSlide = (updates) => {
    setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...updates } : s));
  };

  const slidesWithIndex = slides.map((s, i) => ({ ...s, index: i }));

  if (isPresenting) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-full max-w-5xl aspect-video">
            <SlideRenderer slide={slidesWithIndex[current]} theme={theme} isPresenting={true} />
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 py-4 bg-black/80 border-t border-white/10">
          <Button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} variant="ghost" className="text-white hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white/60 text-sm">{current + 1} / {slides.length}</span>
          <Button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1} variant="ghost" className="text-white hover:bg-white/10">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button onClick={() => setIsPresenting(false)} variant="ghost" className="text-red-400 hover:bg-red-500/10 ml-4">
            <X className="w-4 h-4 mr-1" />Exit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 flex-shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-sm text-white">Hologram PowerPoint</span>
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/40 text-[10px]">AI-Powered</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme */}
          <div className="flex gap-1">
            {HOLOGRAM_THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} title={t.label}
                className={`w-5 h-5 rounded-full border-2 transition-all ${theme === t.id ? "border-white scale-110" : "border-transparent opacity-50"}`}
                style={{ background: t.primary }} />
            ))}
          </div>
          <Button onClick={() => setIsPresenting(true)} size="sm"
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 border-0 text-xs h-7">
            <Play className="w-3 h-3 mr-1" />Present
          </Button>
        </div>
      </div>

      {/* AI Generator Bar */}
      <div className="px-4 py-2 border-b border-slate-800/50 flex-shrink-0 bg-slate-900/30">
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 flex-1 px-3 py-1.5 bg-slate-800/60 border border-violet-500/30 rounded-lg">
            <Wand2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateWithAI()}
              placeholder="Describe your presentation... e.g. 'Fleet performance Q1 2026 with sustainability focus'"
              className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-600 outline-none" />
          </div>
          <Button onClick={generateWithAI} disabled={generating || !aiPrompt.trim()} size="sm"
            className="bg-violet-600 hover:bg-violet-700 border-0 text-xs h-8 flex-shrink-0">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="ml-1">{generating ? "Generating..." : "AI Generate"}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Slide Panel */}
        <div className="w-40 flex-shrink-0 border-r border-slate-800/50 flex flex-col overflow-y-auto bg-slate-900/30 p-2 gap-1.5">
          {slides.map((slide, idx) => (
            <div key={slide.id} onClick={() => setCurrent(idx)}
              className={`relative group rounded-lg overflow-hidden border cursor-pointer transition-all flex-shrink-0 ${idx === current ? "border-cyan-500/70 ring-1 ring-cyan-500/40" : "border-slate-700/50 hover:border-slate-600"}`}
              style={{ aspectRatio: "16/9" }}>
              <div className="w-full h-full scale-[0.15] origin-top-left" style={{ width: "667%", height: "667%" }}>
                <SlideRenderer slide={{ ...slide, index: idx }} theme={theme} isPresenting={false} />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end">
                <div className="bg-black/60 px-1.5 py-0.5 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">{idx + 1}</span>
                  {slides.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); removeSlide(idx); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Slide */}
          <div className="mt-1">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1 px-1">Add Slide</p>
            {SLIDE_TEMPLATES.map(tmpl => (
              <button key={tmpl.id} onClick={() => addSlide(tmpl.id)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
                <tmpl.icon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <div className="w-full max-w-3xl" style={{ aspectRatio: "16/9" }}>
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.3 }} className="w-full h-full">
                  <SlideRenderer slide={slidesWithIndex[current]} theme={theme} isPresenting={false} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 py-2 border-t border-slate-800/50 flex-shrink-0">
            <Button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-cyan-400 w-4" : "bg-slate-700 hover:bg-slate-500"}`} />
              ))}
            </div>
            <Button onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))} disabled={current === slides.length - 1} size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500">{current + 1} / {slides.length}</span>
          </div>
        </div>

        {/* Edit Panel */}
        <div className="w-56 flex-shrink-0 border-l border-slate-800/50 flex flex-col overflow-y-auto bg-slate-900/30 p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Edit Slide</p>

          {currentSlide && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Title</label>
                <Input value={currentSlide.title || ""} onChange={e => updateCurrentSlide({ title: e.target.value })}
                  className="h-7 text-xs bg-slate-800/60 border-slate-700/50 text-white" />
              </div>

              {currentSlide.type === "title" && (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Subtitle</label>
                  <Input value={currentSlide.subtitle || ""} onChange={e => updateCurrentSlide({ subtitle: e.target.value })}
                    className="h-7 text-xs bg-slate-800/60 border-slate-700/50 text-white" />
                </div>
              )}

              {currentSlide.type === "impact" && (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Big Metric</label>
                  <Input value={currentSlide.metric || ""} onChange={e => updateCurrentSlide({ metric: e.target.value })}
                    className="h-7 text-xs bg-slate-800/60 border-slate-700/50 text-white" placeholder="e.g. 94%" />
                </div>
              )}

              {currentSlide.type === "chart" && (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Chart Type</label>
                  <div className="grid grid-cols-2 gap-1">
                    {["bar", "line", "area", "pie"].map(ct => (
                      <button key={ct} onClick={() => updateCurrentSlide({ chartType: ct })}
                        className={`py-1 rounded text-[10px] capitalize transition-all ${currentSlide.chartType === ct ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"}`}>
                        {ct}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Body Text</label>
                <Textarea value={currentSlide.body || ""} onChange={e => updateCurrentSlide({ body: e.target.value })}
                  className="text-xs bg-slate-800/60 border-slate-700/50 text-white min-h-[60px]" />
              </div>

              {currentSlide.type === "content" && (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Bullets (one per line)</label>
                  <Textarea
                    value={(currentSlide.bullets || []).join("\n")}
                    onChange={e => updateCurrentSlide({ bullets: e.target.value.split("\n").filter(Boolean) })}
                    className="text-xs bg-slate-800/60 border-slate-700/50 text-white min-h-[80px]" />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Slide Type</label>
                <div className="grid grid-cols-2 gap-1">
                  {SLIDE_TEMPLATES.map(tmpl => (
                    <button key={tmpl.id} onClick={() => updateCurrentSlide({ type: tmpl.id })}
                      className={`py-1 rounded text-[10px] capitalize transition-all ${currentSlide.type === tmpl.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "bg-slate-800/60 text-slate-500 hover:text-slate-300"}`}>
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}