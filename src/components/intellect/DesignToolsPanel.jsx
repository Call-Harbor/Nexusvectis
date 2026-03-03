import React, { useState } from "react";
import { Sparkles, Zap, Settings, Trash2, Plus, Type, Layout, Palette, Eye } from "lucide-react";
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
    <div className="space-y-4">
      {/* Basic Editing */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Title</label>
        <Input
          value={slide?.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="h-8 text-xs bg-slate-800/60 border-slate-700"
          placeholder="Slide title"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
        <Textarea
          value={slide?.body || ""}
          onChange={(e) => onUpdate({ body: e.target.value })}
          className="text-xs bg-slate-800/60 border-slate-700 resize-none min-h-[60px]"
          placeholder="Slide content"
        />
      </div>

      {/* Animations */}
      <div className="pt-2 border-t border-slate-800">
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
              className="h-7 text-[10px] bg-slate-800/60 hover:bg-violet-500/20 border border-slate-700 text-slate-300 hover:text-violet-300"
            >
              <Zap className="w-2.5 h-2.5 mr-1" />
              {anim.label}
            </Button>
          ))}
        </div>

        {/* Applied animations */}
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

      {/* Effects */}
      <div className="pt-2 border-t border-slate-800">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Visual Effects</label>
        <div className="grid grid-cols-2 gap-1">
          {EFFECTS.map((effect) => (
            <Button
              key={effect.id}
              onClick={() => onUpdate({ effect: slide?.effect === effect.id ? null : effect.id })}
              size="sm"
              className={`h-7 text-[10px] border ${
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

      {/* Layout & Styling */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Layout</label>
        <div className="grid grid-cols-3 gap-1">
          {["left", "center", "right"].map((align) => (
            <Button
              key={align}
              onClick={() => onUpdate({ align })}
              size="sm"
              variant={slide?.align === align ? "default" : "outline"}
              className={`h-7 text-[10px] capitalize ${slide?.align === align ? "bg-cyan-500/20 border-cyan-500" : "border-slate-700"}`}
            >
              {align}
            </Button>
          ))}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Background Opacity</span>
            <Input
              type="number"
              min="0"
              max="100"
              value={slide?.bgOpacity || 100}
              onChange={(e) => onUpdate({ bgOpacity: Number(e.target.value) })}
              className="h-6 w-12 text-xs text-center"
            />
          </div>
        </div>
      </div>

      <Button className="w-full h-8 bg-cyan-600/80 hover:bg-cyan-600 border-0 text-xs gap-2 mt-2">
        <Settings className="w-3 h-3" />
        Advanced Settings
      </Button>
    </div>
  );
}