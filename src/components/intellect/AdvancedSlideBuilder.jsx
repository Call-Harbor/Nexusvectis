import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Code, Palette, Zap, Database, Save, Play, Download,
  ChevronRight, ChevronLeft, Plus, Trash2, Copy, Settings,
  Eye, EyeOff, Lock, Unlock, AlertCircle, CheckCircle2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SlideRenderer from "./SlideRenderer";
import DesignToolsPanel from "./DesignToolsPanel";
import CodeEditorPanel from "./CodeEditorPanel";
import DataBindingPanel from "./DataBindingPanel";

export default function AdvancedSlideBuilder({ orgId }) {
  const [slides, setSlides] = useState([
    { id: 1, type: "title", title: "Fleet Intelligence", subtitle: "Advanced Builder", body: "Hybrid Visual + Code Editor" }
  ]);
  const [current, setCurrent] = useState(0);
  const [theme, setTheme] = useState("nexus");
  const [activeTab, setActiveTab] = useState("design");
  const [showCode, setShowCode] = useState(false);
  const [codeErrors, setCodeErrors] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [dataBindings, setDataBindings] = useState({});

  const currentSlide = slides[current];
  const slidesWithIndex = slides.map((s, i) => ({ ...s, index: i }));

  const updateSlide = (updates) => {
    setSlides(prev => prev.map((s, i) => i === current ? { ...s, ...updates } : s));
    setDirty(true);
  };

  const validateJSON = (json) => {
    try {
      JSON.parse(json);
      setCodeErrors([]);
      return true;
    } catch (e) {
      setCodeErrors([{ line: 1, message: e.message }]);
      return false;
    }
  };

  const applyCode = (code) => {
    if (!validateJSON(code)) return;
    try {
      const parsed = JSON.parse(code);
      updateSlide(parsed);
      toast.success("Code applied to slide");
    } catch (e) {
      toast.error("Failed to apply code");
    }
  };

  const addAnimationEffect = (effect) => {
    updateSlide({
      animations: [...(currentSlide.animations || []), effect]
    });
    toast.success(`Added ${effect.type} animation`);
  };

  const removeAnimation = (idx) => {
    updateSlide({
      animations: currentSlide.animations?.filter((_, i) => i !== idx)
    });
  };

  const save = () => {
    localStorage.setItem("fleetslide-draft", JSON.stringify({ slides, theme }));
    setDirty(false);
    toast.success("Presentation saved locally");
  };

  return (
    <div className="flex h-full bg-slate-950 text-white">
      {/* Slide sidebar */}
      <div className="w-40 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-900/30 p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-cyan-400">SLIDES</span>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrent(idx)}
              className={`w-full px-2 py-2 rounded-lg text-left text-xs transition-all border ${
                idx === current
                  ? "bg-cyan-500/20 border-cyan-500/50 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              <div className="font-medium truncate">{slide.title || "Untitled"}</div>
              <div className="text-[9px] text-slate-500">{slide.type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top toolbar */}
        <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-cyan-400">Advanced Builder</span>
            {dirty && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">Unsaved</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={save} size="sm" className="h-8 bg-cyan-600/80 hover:bg-cyan-600 border-0 text-xs gap-1">
              <Save className="w-3 h-3" />Save
            </Button>
            <Button onClick={() => setShowCode(!showCode)} size="sm" variant="outline" className="h-8 border-slate-700 text-xs gap-1">
              <Code className="w-3 h-3" />{showCode ? "Design" : "Code"}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0 gap-0">
          {/* Canvas preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 to-black p-6">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <div className="w-full max-w-4xl" style={{ aspectRatio: "16/9" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <SlideRenderer slide={slidesWithIndex[current]} theme={theme} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-slate-500">{current + 1} / {slides.length}</span>
              <Button
                onClick={() => setCurrent(c => Math.min(slides.length - 1, c + 1))}
                disabled={current === slides.length - 1}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right panels */}
          <div className="w-80 border-l border-slate-800 flex flex-col overflow-hidden bg-slate-900/20">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="rounded-none border-b border-slate-800 bg-slate-900/60 h-10">
                <TabsTrigger value="design" className="text-xs gap-1 data-[state=active]:bg-slate-800">
                  <Palette className="w-3 h-3" />Design
                </TabsTrigger>
                <TabsTrigger value="data" className="text-xs gap-1 data-[state=active]:bg-slate-800">
                  <Database className="w-3 h-3" />Data
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs gap-1 data-[state=active]:bg-slate-800">
                  <Code className="w-3 h-3" />Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="flex-1 overflow-y-auto p-3 m-0">
                <DesignToolsPanel
                  slide={currentSlide}
                  onUpdate={updateSlide}
                  onAddAnimation={addAnimationEffect}
                  onRemoveAnimation={removeAnimation}
                  theme={theme}
                  onThemeChange={setTheme}
                />
              </TabsContent>

              <TabsContent value="data" className="flex-1 overflow-y-auto p-3 m-0">
                <DataBindingPanel
                  slide={currentSlide}
                  orgId={orgId}
                  bindings={dataBindings}
                  onBindingsChange={setDataBindings}
                  onApply={(data) => updateSlide(data)}
                />
              </TabsContent>

              <TabsContent value="code" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
                <CodeEditorPanel
                  slide={currentSlide}
                  onApply={applyCode}
                  errors={codeErrors}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}