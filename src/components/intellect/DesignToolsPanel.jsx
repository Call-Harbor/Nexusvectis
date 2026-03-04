import React, { useState, useEffect } from "react";
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
  const [localChartData, setLocalChartData] = useState(slide?.chartData || []);

  useEffect(() => {
    setLocalChartData(slide?.chartData || []);
  }, [slide?.id]);

  const updateChartPoint = (i, field, value) => {
    const newData = localChartData.map((pt, idx) =>
      idx === i ? { ...pt, [field]: field === "value" ? Number(value) : value } : pt
    );
    setLocalChartData(newData);
    onUpdate({ chartData: newData });
  };

  const addChartPoint = () => {
    const newData = [...localChartData, { label: `Item ${localChartData.length + 1}`, value: 50 }];
    setLocalChartData(newData);
    onUpdate({ chartData: newData });
  };

  const removeChartPoint = (i) => {
    const newData = localChartData.filter((_, idx) => idx !== i);
    setLocalChartData(newData);
    onUpdate({ chartData: newData });
  };

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
                className="text-xs bg-slate-800/60 border-slate-700 resize-none min-h-[80px] text-white"
                placeholder="• First point&#10;• Second point&#10;• Third point"
              />
            </div>
          )}

          {slide?.type === "split" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stats/Tabel</label>
                <button
                  onClick={() => onUpdate({ stats: [...(slide?.stats || []), { label: "Nyt felt", value: "0", delta: "" }] })}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/70 hover:bg-cyan-600 text-white flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />Tilføj
                </button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(slide?.stats || []).map((stat, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      value={stat.label}
                      onChange={(e) => {
                        const s = [...slide.stats];
                        s[i] = { ...s[i], label: e.target.value };
                        onUpdate({ stats: s });
                      }}
                      className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 flex-1 text-white outline-none focus:border-cyan-500"
                      placeholder="Label"
                    />
                    <input
                      value={stat.value}
                      onChange={(e) => {
                        const s = [...slide.stats];
                        s[i] = { ...s[i], value: e.target.value };
                        onUpdate({ stats: s });
                      }}
                      className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 w-16 text-white outline-none focus:border-cyan-500"
                      placeholder="Værdi"
                    />
                    <input
                      value={stat.delta || ""}
                      onChange={(e) => {
                        const s = [...slide.stats];
                        s[i] = { ...s[i], delta: e.target.value };
                        onUpdate({ stats: s });
                      }}
                      className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 w-14 text-white outline-none focus:border-cyan-500"
                      placeholder="+5%"
                    />
                    <button
                      onClick={() => onUpdate({ stats: slide.stats.filter((_, idx) => idx !== i) })}
                      className="text-slate-600 hover:text-red-400 p-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide?.type === "impact" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-metrics</label>
                <button
                  onClick={() => onUpdate({ submetrics: [...(slide?.submetrics || []), { label: "Nyt", value: "0" }] })}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/70 hover:bg-cyan-600 text-white flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />Tilføj
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(slide?.submetrics || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      value={m.label}
                      onChange={(e) => {
                        const s = [...slide.submetrics];
                        s[i] = { ...s[i], label: e.target.value };
                        onUpdate({ submetrics: s });
                      }}
                      className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 flex-1 text-white outline-none focus:border-cyan-500"
                      placeholder="Label"
                    />
                    <input
                      value={m.value}
                      onChange={(e) => {
                        const s = [...slide.submetrics];
                        s[i] = { ...s[i], value: e.target.value };
                        onUpdate({ submetrics: s });
                      }}
                      className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 w-16 text-white outline-none focus:border-cyan-500"
                      placeholder="Værdi"
                    />
                    <button
                      onClick={() => onUpdate({ submetrics: slide.submetrics.filter((_, idx) => idx !== i) })}
                      className="text-slate-600 hover:text-red-400 p-1 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide?.type === "timeline" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Events</label>
                <button
                  onClick={() => onUpdate({ events: [...(slide?.events || []), { period: "Q?", title: "Nyt event", description: "" }] })}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/70 hover:bg-cyan-600 text-white flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" />Tilføj
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(slide?.events || []).map((ev, i) => (
                  <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700 p-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <input
                        value={ev.period}
                        onChange={(e) => {
                          const s = [...slide.events];
                          s[i] = { ...s[i], period: e.target.value };
                          onUpdate({ events: s });
                        }}
                        className="h-6 text-xs bg-slate-900 border border-slate-700 rounded px-2 w-14 text-white outline-none focus:border-cyan-500"
                        placeholder="Q1"
                      />
                      <input
                        value={ev.title}
                        onChange={(e) => {
                          const s = [...slide.events];
                          s[i] = { ...s[i], title: e.target.value };
                          onUpdate({ events: s });
                        }}
                        className="h-6 text-xs bg-slate-900 border border-slate-700 rounded px-2 flex-1 text-white outline-none focus:border-cyan-500"
                        placeholder="Titel"
                      />
                      <button
                        onClick={() => onUpdate({ events: slide.events.filter((_, idx) => idx !== i) })}
                        className="text-slate-600 hover:text-red-400 p-0.5 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      value={ev.description}
                      onChange={(e) => {
                        const s = [...slide.events];
                        s[i] = { ...s[i], description: e.target.value };
                        onUpdate({ events: s });
                      }}
                      className="h-6 text-xs bg-slate-900 border border-slate-700 rounded px-2 w-full text-white outline-none focus:border-cyan-500"
                      placeholder="Beskrivelse..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {slide?.type === "comparison" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kolonner</label>
              {(slide?.columns || []).map((col, ci) => (
                <div key={ci} className="mb-3 rounded-lg bg-slate-800/60 border border-slate-700 p-2">
                  <input
                    value={col.label}
                    onChange={(e) => {
                      const cols = [...slide.columns];
                      cols[ci] = { ...cols[ci], label: e.target.value };
                      onUpdate({ columns: cols });
                    }}
                    className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 w-full text-white outline-none focus:border-cyan-500 mb-1.5"
                    placeholder="Kolonne navn"
                  />
                  <div className="space-y-1">
                    {(col.items || []).map((item, ii) => (
                      <div key={ii} className="flex gap-1">
                        <input
                          value={item}
                          onChange={(e) => {
                            const cols = [...slide.columns];
                            cols[ci] = { ...cols[ci], items: col.items.map((it, idx) => idx === ii ? e.target.value : it) };
                            onUpdate({ columns: cols });
                          }}
                          className="h-6 text-xs bg-slate-900 border border-slate-700 rounded px-2 flex-1 text-white outline-none focus:border-cyan-500"
                          placeholder="Punkt..."
                        />
                        <button
                          onClick={() => {
                            const cols = [...slide.columns];
                            cols[ci] = { ...cols[ci], items: col.items.filter((_, idx) => idx !== ii) };
                            onUpdate({ columns: cols });
                          }}
                          className="text-slate-600 hover:text-red-400 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const cols = [...slide.columns];
                        cols[ci] = { ...cols[ci], items: [...(col.items || []), "Nyt punkt"] };
                        onUpdate({ columns: cols });
                      }}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 mt-1"
                    >
                      <Plus className="w-2.5 h-2.5" />Tilføj punkt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {slide?.type === "chart" && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Chart Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {["bar", "line", "area", "pie", "radar"].map((ct) => (
                    <button
                      key={ct}
                      onClick={() => onUpdate({ chartType: ct })}
                      className={`h-6 rounded text-xs capitalize transition-all border px-1 ${
                        slide?.chartType === ct
                          ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {ct}
                    </button>
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
                  <button
                    onClick={addChartPoint}
                    className="h-5 text-[9px] px-1.5 rounded bg-cyan-600/70 hover:bg-cyan-600 text-white flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" />Tilføj
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {localChartData.map((point, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        value={point.label}
                        onChange={(e) => updateChartPoint(i, "label", e.target.value)}
                        className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 flex-1 text-white outline-none focus:border-cyan-500"
                        placeholder="Label"
                      />
                      <input
                        type="number"
                        value={point.value}
                        onChange={(e) => updateChartPoint(i, "value", e.target.value)}
                        className="h-7 text-xs bg-slate-800 border border-slate-700 rounded px-2 w-16 text-white outline-none focus:border-cyan-500"
                        placeholder="Værdi"
                      />
                      <button
                        onClick={() => removeChartPoint(i)}
                        className="text-slate-600 hover:text-red-400 flex-shrink-0 p-1"
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
                <button
                  key={t.id}
                  onClick={() => onUpdate({ type: t.id })}
                  className={`h-7 rounded text-[10px] font-medium transition-all border ${
                    slide?.type === t.id
                      ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
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
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  className={`h-6 rounded text-xs capitalize transition-all border ${
                    slide?.align === align
                      ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Transition Effect</label>
            <div className="space-y-1">
              {TRANSITIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate({ transition: t.id })}
                  className={`w-full h-6 rounded text-xs text-left px-2 transition-all border ${
                    slide?.transition === t.id
                      ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
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
                <button
                  key={anim.type}
                  onClick={() => onAddAnimation({ type: anim.type, duration: anim.duration })}
                  className="h-6 text-[10px] bg-slate-800/60 hover:bg-violet-500/20 border border-slate-700 text-slate-300 hover:text-violet-300 rounded transition-all"
                >
                  {anim.label}
                </button>
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
                <button
                  key={effect.id}
                  onClick={() => onUpdate({ effect: slide?.effect === effect.id ? null : effect.id })}
                  className={`h-6 text-[10px] rounded border transition-all ${
                    slide?.effect === effect.id
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {effect.label}
                </button>
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