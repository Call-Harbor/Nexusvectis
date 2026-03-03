import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Sparkles, Zap, Grid, Plus, X, Copy, Trash2, Save, Share2,
  Play, ChevronLeft, ChevronRight, Eye, Code, Layers, Settings,
  Lock, Unlock, Download, Upload, Loader2, Brain, TrendingUp, Users,
  MessageSquare, Clock, Maximize2, Minimize2, Search, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdvancedFleetSlideBuilder({ onPresentStart }) {
  const [slides, setSlides] = useState([
    { id: 1, type: "title", title: "Fleet Intelligence 2026", subtitle: "Strategic Briefing", body: "AI-Powered Operations" }
  ]);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState("nexus");
  const [activeTab, setActiveTab] = useState("canvas");
  const [isDragMode, setIsDragMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [showComponentLib, setShowComponentLib] = useState(false);
  const [liveDataMode, setLiveDataMode] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);

  // AI-powered slide enhancement
  const enhanceSlideWithAI = async () => {
    const slide = slides[current];
    setAiEnhancing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Du er en ekspert presentationsdesigner. Forbedre denne slide dramatisk med stærkere tekst, bedre struktur og mere påvirkning. Behold samme type.

Slide: ${JSON.stringify(slide)}

Returnér som JSON (samme struktur, forbedret indhold).`,
        response_json_schema: { type: "object", additionalProperties: true }
      });
      if (result) {
        const updated = slides.map((s, i) => i === current ? { ...s, ...result, id: s.id } : s);
        setSlides(updated);
        setRecentChanges([{ type: "enhance", slide: current, time: new Date() }, ...recentChanges.slice(0, 4)]);
        toast.success("✨ Slide enhanced with AI");
      }
    } catch (e) {
      toast.error("Enhancement failed");
    }
    setAiEnhancing(false);
  };

  // Generate slide from template
  const generateFromTemplate = async (template) => {
    setAiEnhancing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a single ${template} slide for a fleet management presentation. Return as JSON with type, title, body, bullets array if applicable.`,
        response_json_schema: { type: "object", additionalProperties: true }
      });
      if (result) {
        const newSlide = { ...result, id: Date.now() };
        const updated = [...slides.slice(0, current + 1), newSlide, ...slides.slice(current + 1)];
        setSlides(updated);
        setCurrent(current + 1);
        toast.success("✅ Slide generated");
      }
    } catch (e) {
      toast.error("Generation failed");
    }
    setAiEnhancing(false);
  };

  const addSlide = (type = "content") => {
    const templates = {
      title: { type: "title", title: "New Section", subtitle: "Subtitle", body: "Description" },
      content: { type: "content", title: "Key Points", bullets: ["Point 1", "Point 2", "Point 3"] },
      chart: { type: "chart", title: "Data", chartType: "bar", chartData: [] },
      impact: { type: "impact", title: "Metric", metric: "95%", body: "Description" }
    };
    const newSlide = { ...templates[type], id: Date.now() };
    const updated = [...slides.slice(0, current + 1), newSlide, ...slides.slice(current + 1)];
    setSlides(updated);
    setCurrent(current + 1);
  };

  const updateCurrentSlide = (updates) => {
    setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...updates } : s));
    setRecentChanges([{ type: "edit", slide: current, time: new Date() }, ...recentChanges.slice(0, 4)]);
  };

  const startPresentation = () => {
    if (onPresentStart) onPresentStart({ slides, theme });
  };

  const currentSlide = slides[current];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 to-slate-900/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-cyan-500/30">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">FleetSlide Studio</span>
            <Badge className="bg-violet-500/20 text-violet-400 text-[10px]">v2.0</Badge>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <span className="text-xs text-slate-400">{slides.length} slides</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Actions */}
          <Button
            onClick={enhanceSlideWithAI}
            disabled={aiEnhancing}
            size="sm"
            className="bg-violet-600/80 hover:bg-violet-600 border-0 gap-1.5 h-8"
          >
            {aiEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI Enhance
          </Button>

          {/* Live Data Toggle */}
          <Button
            onClick={() => setLiveDataMode(!liveDataMode)}
            variant={liveDataMode ? "default" : "outline"}
            size="sm"
            className="border-slate-700 gap-1.5 h-8"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Live Data
          </Button>

          {/* Collaboration */}
          <Button size="sm" variant="outline" className="border-slate-700 gap-1.5 h-8">
            <Users className="w-3.5 h-3.5" />
            Share
          </Button>

          {/* Present Button */}
          <Button
            onClick={startPresentation}
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-90 border-0 gap-1.5 h-8"
          >
            <Play className="w-3.5 h-3.5" />
            Present
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0 gap-3 p-3">
        {/* Left Panel - Slide Thumbnails */}
        <div className="w-40 flex-shrink-0 rounded-xl bg-slate-900/40 border border-slate-800/50 p-3 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Slides</span>
            <Button size="icon" onClick={() => addSlide()} className="h-6 w-6 bg-slate-800 hover:bg-slate-700 border-0">
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-1.5 flex-1">
            {slides.map((slide, idx) => (
              <motion.button
                key={slide.id}
                onClick={() => setCurrent(idx)}
                className={`w-full h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer group relative ${
                  idx === current ? "border-cyan-500/70 ring-1 ring-cyan-500/30" : "border-slate-700 hover:border-slate-600"
                }`}
                whileHover={{ scale: 1.02 }}
              >
                {/* Slide Preview */}
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-xs text-slate-500 overflow-hidden">
                  <span className="truncate">{slide.title || `Slide ${idx + 1}`}</span>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dup = { ...slide, id: Date.now() };
                      setSlides([...slides.slice(0, idx + 1), dup, ...slides.slice(idx + 1)]);
                    }}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlides(slides.filter((_, i) => i !== idx));
                        setCurrent(Math.min(current, slides.length - 2));
                      }}
                      className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="absolute bottom-1 left-1 text-[8px] text-slate-500">{idx + 1}</div>
              </motion.button>
            ))}
          </div>

          {/* Component Library */}
          <div className="pt-2 border-t border-slate-800">
            <Button
              onClick={() => setShowComponentLib(!showComponentLib)}
              size="sm"
              className="w-full bg-slate-800 hover:bg-slate-700 border-0 gap-1.5 h-8 text-xs"
            >
              <Grid className="w-3.5 h-3.5" />
              Components
            </Button>
            <AnimatePresence>
              {showComponentLib && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} className="mt-2 space-y-1">
                  {["content", "chart", "impact", "split"].map((type) => (
                    <button
                      key={type}
                      onClick={() => addSlide(type)}
                      className="w-full text-xs px-2 py-1.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition-all"
                    >
                      + {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center - Canvas & Editor */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          {/* Canvas */}
          <div className="flex-1 rounded-xl bg-slate-900/40 border border-slate-800/50 p-5 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-4xl" style={{ aspectRatio: "16/9" }}>
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/20 p-6 flex flex-col justify-center text-white shadow-2xl"
              >
                {currentSlide?.type === "title" && (
                  <div className="text-center">
                    <h1 className="text-5xl font-black mb-3">{currentSlide.title}</h1>
                    <p className="text-xl text-slate-300">{currentSlide.body}</p>
                  </div>
                )}

                {currentSlide?.type === "content" && (
                  <div>
                    <h2 className="text-4xl font-bold mb-5" style={{ color: "#06b6d4" }}>
                      {currentSlide.title}
                    </h2>
                    <div className="space-y-2">
                      {(currentSlide.bullets || []).map((b, i) => (
                        <div key={i} className="flex items-center gap-3 text-lg">
                          <div className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentSlide?.type === "impact" && (
                  <div className="text-center">
                    <div className="text-7xl font-black mb-4" style={{ color: "#06b6d4" }}>
                      {currentSlide.metric}
                    </div>
                    <h2 className="text-3xl font-bold">{currentSlide.title}</h2>
                    <p className="text-lg text-slate-300 mt-3">{currentSlide.body}</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
            <Button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "bg-cyan-400 w-6" : "bg-slate-700 w-1.5"}`} />
              ))}
            </div>
            <Button onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} disabled={current === slides.length - 1} variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500">{current + 1}/{slides.length}</span>
          </div>
        </div>

        {/* Right Panel - Editor & Settings */}
        <div className="w-80 flex-shrink-0 rounded-xl bg-slate-900/40 border border-slate-800/50 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="rounded-none border-b border-slate-800 bg-slate-900/60 h-9 px-2">
              <TabsTrigger value="canvas" className="text-xs h-7">Canvas</TabsTrigger>
              <TabsTrigger value="design" className="text-xs h-7">Design</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs h-7">AI</TabsTrigger>
              <TabsTrigger value="history" className="text-xs h-7">History</TabsTrigger>
            </TabsList>

            {/* Canvas Editor */}
            <TabsContent value="canvas" className="flex-1 overflow-y-auto p-3 m-0 space-y-3">
              {currentSlide && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Title</label>
                    <Input
                      value={currentSlide.title || ""}
                      onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                      className="h-8 text-xs bg-slate-800/60 border-slate-700/50"
                    />
                  </div>

                  {currentSlide.type === "impact" && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Metric</label>
                      <Input
                        value={currentSlide.metric || ""}
                        onChange={(e) => updateCurrentSlide({ metric: e.target.value })}
                        className="h-8 text-xs bg-slate-800/60 border-slate-700/50"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Body</label>
                    <textarea
                      value={currentSlide.body || ""}
                      onChange={(e) => updateCurrentSlide({ body: e.target.value })}
                      className="w-full text-xs bg-slate-800/60 border border-slate-700/50 rounded p-2 text-white min-h-[60px] resize-none"
                    />
                  </div>

                  {currentSlide.type === "content" && (
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Bullets (one per line)</label>
                      <textarea
                        value={(currentSlide.bullets || []).join("\n")}
                        onChange={(e) => updateCurrentSlide({ bullets: e.target.value.split("\n") })}
                        className="w-full text-xs bg-slate-800/60 border border-slate-700/50 rounded p-2 text-white min-h-[80px] resize-none"
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Design Panel */}
            <TabsContent value="design" className="flex-1 overflow-y-auto p-3 m-0 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-medium">Theme</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["nexus", "aurora", "solar"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-2 rounded text-xs capitalize transition-all ${theme === t ? "bg-cyan-500/20 border border-cyan-500/40" : "bg-slate-800 border border-slate-700"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* AI Panel */}
            <TabsContent value="ai" className="flex-1 overflow-y-auto p-3 m-0 space-y-2">
              <Button onClick={enhanceSlideWithAI} disabled={aiEnhancing} className="w-full bg-violet-600 hover:bg-violet-700 border-0 gap-1 h-8 text-xs" size="sm">
                {aiEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Enhance Slide
              </Button>
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] text-slate-500 uppercase">Quick Templates</p>
                {["KPI Metric", "Comparison", "Timeline"].map((t) => (
                  <button key={t} onClick={() => generateFromTemplate(t)} className="w-full text-xs px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all">
                    Generate {t}
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="flex-1 overflow-y-auto p-3 m-0">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase">Recent Changes</p>
                {recentChanges.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No changes yet</p>
                ) : (
                  recentChanges.map((change, i) => (
                    <div key={i} className="text-xs text-slate-400 p-2 rounded bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-2">
                        {change.type === "enhance" && <Wand2 className="w-3 h-3" />}
                        {change.type === "edit" && <Code className="w-3 h-3" />}
                        <span className="capitalize">{change.type}</span>
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1">Slide {change.slide + 1}</div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}