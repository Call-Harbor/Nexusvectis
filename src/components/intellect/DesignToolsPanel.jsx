import React, { useState } from "react";
import { Sparkles, Zap, Settings, Trash2, Plus, Type, Layout, Palette, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const ANIMATIONS = [
  { type: "fade", label: "Fade", duration: 0.3 },
  { type: "slide", label: "Slide In", duration: 0.5 },
  { type: "zoom", label: "Zoom", duration: 0.5 },
  { type: "rotate", label: "Rotate", duration: 0.6 },
  { type: "bounce", label: "Bounce", duration: 0.8 },
  { type: "flip", label: "Flip", duration: 0.7 },
];

const EFFECTS = [
  { id: "glow", label: "Glow", class: "shadow-lg shadow-cyan-500/30" },
  { id: "blur", label: "Blur", class: "backdrop-blur-sm" },
  { id: "shine", label: "Shine", class: "animate-pulse" },
  { id: "shadow", label: "Shadow", class: "drop-shadow-2xl" },
];

const TRANSITIONS = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide Left" },
  { id: "zoom", label: "Zoom Out" },
  { id: "flip", label: "Flip" },
  { id: "rotate", label: "Rotate" },
];

const TEXT_COLORS = ["white", "cyan-300", "violet-300", "emerald-300", "amber-300", "red-300"];
const BACKGROUND_COLORS = ["slate-900", "cyan-900/20", "violet-900/20", "emerald-900/20", "slate-800"];

export default function DesignToolsPanel({ slide, onUpdate, onAddAnimation, onRemoveAnimation, theme, onThemeChange }) {
  const [selectedEffect, setSelectedEffect] = useState(null);

  return (
    <div className="h-full overflow-y-auto">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-slate-800 bg-transparent h-8">
          <TabsTrigger value="content" className="text-xs data-[state=active]:bg-slate-800/50">Content</TabsTrigger>
          <TabsTrigger value="style" className="text-xs data-[state=active]:bg-slate-800/50">Style</TabsTrigger>
          <TabsTrigger value="effects" className="text-xs data-[state=active]:bg-slate-800/50">Effects</TabsTrigger>
        </TabsList>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-3 p-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
            <Input
              value={slide?.title || ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="h-8 text-xs bg-slate-800/60 border-slate-700"
              placeholder="Slide title"
            />
          </div>

          {slide?.type === "title" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Subtitle Badge</label>
                <Input
                  value={slide?.subtitle || ""}
                  onChange={(e) => onUpdate({ subtitle: e.target.value })}
                  className="h-8 text-xs bg-slate-800/60 border-slate-700"
                  placeholder="e.g., Strategic Briefing"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Author</label>
                <Input
                  value={slide?.author || ""}
                  onChange={(e) => onUpdate({ author: e.target.value })}
                  className="h-8 text-xs bg-slate-800/60 border-slate-700"
                  placeholder="Your name"
                />
              </div>
            </>
          )}

          {slide?.type === "impact" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Big Metric</label>
              <Input
                value={slide?.metric || ""}
                onChange={(e) => onUpdate({ metric: e.target.value })}
                className="h-8 text-xs bg-slate-800/60 border-slate-700"
                placeholder="e.g., 94%"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Body Text</label>
            <Textarea
              value={slide?.body || ""}
              onChange={(e) => onUpdate({ body: e.target.value })}
              className="text-xs bg-slate-800/60 border-slate-700 resize-none min-h-[70px]"
              placeholder="Main content"
            />
          </div>

          {(slide?.type === "content" || slide?.type === "split") && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Bullets (one per line)</label>
              <Textarea
                value={(slide?.bullets || []).join("\n")}
                onChange={(e) => onUpdate({ bullets: e.target.value.split("\n").filter(b => b.trim()) })}
                className="text-xs bg-slate-800/60 border-slate-700 resize-none min-h-[80px]"
                placeholder="• First point&#10;• Second point&#10;• Third point"
              />
            </div>
          )}

          {slide?.type === "chart" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Chart Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {["bar", "line", "area", "pie", "radar"].map((ct) => (
                    <Button
                      key={ct}
                      onClick={() => onUpdate({ chartType: ct })}
                      size="sm"
                      variant={slide?.chartType === ct ? "default" : "outline"}
                      className="h-6 text-xs capitalize"
                    >
                      {ct}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Chart Insight</label>
                <Input
                  value={slide?.chartInsight || ""}
                  onChange={(e) => onUpdate({ chartInsight: e.target.value })}
                  className="h-8 text-xs bg-slate-800/60 border-slate-700"
                  placeholder="+18% YoY"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chart Data</label>
                  <Button
                    size="sm"
                    onClick={() => {
                      const newData = [...(slide?.chartData || []), { label: `Item ${(slide?.chartData?.length || 0) + 1}`, value: 50 }];
                      onUpdate({ chartData: newData });
                    }}
                    className="h-5 text-[9px] bg-cyan-600/70 hover:bg-cyan-600 border-0 gap-0.5 px-1.5"
                  >
                    <Plus className="w-2.5 h-2.5" />Add
                  </Button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(slide?.chartData || []).map((point, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Input
                        value={point.label}
                        onChange={(e) => {
                          const newData = [...(slide.chartData || [])];
                          newData[i] = { ...newData[i], label: e.target.value };
                          onUpdate({ chartData: newData });
                        }}
                        className="h-6 text-[10px] bg-slate-800/60 border-slate-700 px-1.5 flex-1"
                        placeholder="Label"
                      />
                      <Input
                        type="number"
                        value={point.value}
                        onChange={(e) => {
                          const newData = [...(slide.chartData || [])];
                          newData[i] = { ...newData[i], value: Number(e.target.value) };
                          onUpdate({ chartData: newData });
                        }}
                        className="h-6 text-[10px] bg-slate-800/60 border-slate-700 px-1.5 w-16"
                        placeholder="Val"
                      />
                      <button
                        onClick={() => {
                          const newData = (slide.chartData || []).filter((_, idx) => idx !== i);
                          onUpdate({ chartData: newData });
                        }}
                        className="text-slate-600 hover:text-red-400 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Slide Type</label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: "title", label: "Title" },
                { id: "content", label: "Bullets" },
                { id: "chart", label: "Chart" },
                { id: "split", label: "Split" },
                { id: "impact", label: "Impact" },
                { id: "comparison", label: "Compare" },
                { id: "timeline", label: "Timeline" },
                { id: "closing", label: "Closing" }
              ].map((t) => (
                <Button
                  key={t.id}
                  onClick={() => onUpdate({ type: t.id })}
                  size="sm"
                  variant={slide?.type === t.id ? "default" : "outline"}
                  className="h-6 text-[10px]"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* STYLE TAB */}
        <TabsContent value="style" className="space-y-3 p-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Text Color</label>
            <div className="grid grid-cols-3 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate({ textColor: color })}
                  className={`h-7 rounded border-2 transition-all text-xs font-bold ${
                    slide?.textColor === color
                      ? "border-cyan-400"
                      : "border-slate-700 hover:border-slate-600"
                  } bg-${color} ${color === "white" ? "text-slate-900" : "text-white"}`}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Background</label>
            <div className="grid grid-cols-2 gap-1">
              {BACKGROUND_COLORS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => onUpdate({ bgColor: bg })}
                  className={`h-8 rounded border-2 transition-all ${
                    slide?.bgColor === bg
                      ? "border-cyan-400"
                      : "border-slate-700 hover:border-slate-600"
                  } bg-${bg}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Alignment</label>
            <div className="grid grid-cols-3 gap-1">
              {["left", "center", "right"].map((align) => (
                <Button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  size="sm"
                  variant={slide?.align === align ? "default" : "outline"}
                  className="h-6 text-xs capitalize"
                >
                  {align}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Transition Effect</label>
            <div className="space-y-1">
              {TRANSITIONS.map((t) => (
                <Button
                  key={t.id}
                  onClick={() => onUpdate({ transition: t.id })}
                  size="sm"
                  variant={slide?.transition === t.id ? "default" : "outline"}
                  className="w-full h-6 text-xs justify-start"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              value={slide?.opacity || 100}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">{slide?.opacity || 100}%</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Scale</label>
            <input
              type="range"
              min="50"
              max="150"
              value={slide?.scale || 100}
              onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">{slide?.scale || 100}%</span>
          </div>
        </TabsContent>

        {/* EFFECTS TAB */}
        <TabsContent value="effects" className="space-y-3 p-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Animations</label>
              <Sparkles className="w-3 h-3 text-violet-400" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {ANIMATIONS.map((anim) => (
                <Button
                  key={anim.type}
                  onClick={() => onAddAnimation({ type: anim.type, duration: anim.duration })}
                  size="sm"
                  className="h-6 text-[10px] bg-slate-800/60 hover:bg-violet-500/20 border border-slate-700 text-slate-300 hover:text-violet-300"
                >
                  {anim.label}
                </Button>
              ))}
            </div>

            {slide?.animations?.length > 0 && (
              <div className="mt-2 space-y-1">
                {slide.animations.map((anim, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2 py-1 rounded bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300"
                  >
                    <span>{anim.type} ({anim.duration}s)</span>
                    <button
                      onClick={() => onRemoveAnimation(idx)}
                      className="text-violet-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Visual Effects</label>
            <div className="grid grid-cols-2 gap-1">
              {EFFECTS.map((effect) => (
                <Button
                  key={effect.id}
                  onClick={() => onUpdate({ effect: slide?.effect === effect.id ? null : effect.id })}
                  size="sm"
                  className={`h-6 text-[10px] border ${
                    slide?.effect === effect.id
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {effect.label}
                </Button>
              ))}
            </div>
          </div>

          <Button className="w-full h-8 bg-cyan-600/80 hover:bg-cyan-600 border-0 text-xs gap-2">
            <Settings className="w-3 h-3" />
            Advanced Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}