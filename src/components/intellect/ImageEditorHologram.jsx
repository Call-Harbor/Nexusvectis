import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Wand2, Loader2, Download, RotateCcw, Sparkles, Sliders,
  Sun, Contrast, Droplets, Zap, Crop, FlipHorizontal, FlipVertical,
  RotateCw, ZoomIn, ZoomOut, Palette, Eye, Layers, Upload, CheckCircle,
  RefreshCw, Image, Columns2, ClipboardPaste, Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const AI_EDIT_PRESETS = [
  { label: "Enhance & sharpen", prompt: "Enhance this image: sharper, more micro-detail, clarity and controlled vibrancy. Keep geometry and identity." },
  { label: "Cinematic grade", prompt: "Cinematic color grade: subtle vignette, richer contrast, warm highlights, cool shadows, filmic roll-off." },
  { label: "Isolate subject", prompt: "Clean studio isolation: crisp subject separation, neutral or soft gradient background, catalog-ready." },
  { label: "Dramatic light", prompt: "Strong directional light, defined shadows, high dynamic range, studio photography look." },
  { label: "Vintage film", prompt: "1970s print aesthetic: mild grain, warm fade, soft halation, not oversaturated." },
  { label: "Neon / tech", prompt: "Futuristic neon accents (cyan, violet), dark surround, reflective surfaces, tech keynote visual." },
  { label: "Oil painting", prompt: "Oil painting: visible brush energy, rich pigments, museum-style interpretation of the same composition." },
  { label: "Line art", prompt: "High-contrast line art / ink drawing preserving layout and silhouettes." },
  { label: "HDR clarity", prompt: "HDR-style clarity: recover shadow detail, controlled highlights, punchy but natural local contrast." },
  { label: "Watercolor", prompt: "Watercolor wash: soft edges, paper texture, luminous transparent pigments." },
  { label: "Night ops", prompt: "Low-light operational scene: realistic noise, flare, tactical green-tinted monitor glow where relevant." },
  { label: "Anime cel", prompt: "Anime cel shading: clean outlines, flat fills, expressive color, no warped anatomy." },
  { label: "Fleet catalog", prompt: "Commercial fleet catalog shot: vehicle hero, white infinity feel, even light, minimal distractions." },
  { label: "Warehouse doc", prompt: "Documentary warehouse shot: wide angle, readable signage and racking, realistic color, slight perspective correction." },
  { label: "Map overlay style", prompt: "Subtle tactical map overlay aesthetic: soft route lines and waypoints blended into the scene, still photoreal base." },
  { label: "Safety hi-vis", prompt: "Emphasize high-visibility gear and safety markers; realistic PPE colors; no invented people." },
];

const CSS_FILTERS = [
  { key: "brightness", label: "Brightness", icon: Sun, min: 0.3, max: 2.5, default: 1, step: 0.05 },
  { key: "contrast", label: "Contrast", icon: Contrast, min: 0, max: 3, default: 1, step: 0.05 },
  { key: "saturate", label: "Saturation", icon: Droplets, min: 0, max: 3, default: 1, step: 0.05 },
  { key: "blur", label: "Blur", icon: Eye, min: 0, max: 10, default: 0, step: 0.2, unit: "px" },
  { key: "hue-rotate", label: "Hue", icon: Palette, min: 0, max: 360, default: 0, step: 5, unit: "deg" },
  { key: "sepia", label: "Sepia", icon: Layers, min: 0, max: 1, default: 0, step: 0.05 },
  { key: "grayscale", label: "Grayscale", icon: Sliders, min: 0, max: 1, default: 0, step: 0.05 },
  { key: "invert", label: "Invert", icon: FlipHorizontal, min: 0, max: 1, default: 0, step: 0.05 },
];

export default function ImageEditorHologram({ imageUrl: initialImage, onClose }) {
  const [imageUrl, setImageUrl] = useState(initialImage || null);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLog, setAiLog] = useState([]);
  const [activeTab, setActiveTab] = useState("ai");
  const [filters, setFilters] = useState(
    Object.fromEntries(CSS_FILTERS.map((f) => [f.key, f.default])),
  );
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [dropShadowPx, setDropShadowPx] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [cropTop, setCropTop] = useState(0);
  const [cropRight, setCropRight] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [aiStrength, setAiStrength] = useState([0.72]);
  const [inpaintRegion, setInpaintRegion] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);
  const pasteTargetRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiLog]);

  const addLog = (msg, type = "info") =>
    setAiLog((prev) => [...prev, { msg, type, ts: Date.now() }]);

  const computeFilterString = () => {
    const base = CSS_FILTERS.map((f) => {
      const val = filters[f.key];
      const unit = f.unit || "";
      return `${f.key}(${val}${unit})`;
    }).join(" ");
    const ds =
      dropShadowPx > 0
        ? ` drop-shadow(0 6px ${dropShadowPx}px rgba(0,0,0,0.45))`
        : "";
    return base + ds;
  };

  const buildImageStyle = () => {
    const clip = cropEnabled
      ? `inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%)`
      : undefined;
    return {
      filter: computeFilterString(),
      opacity: imageOpacity,
      transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom})`,
      transition: "filter 0.2s, transform 0.3s, opacity 0.2s",
      clipPath: clip,
    };
  };

  const resetFilters = () => {
    setFilters(Object.fromEntries(CSS_FILTERS.map((f) => [f.key, f.default])));
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setImageOpacity(1);
    setDropShadowPx(0);
    setVignette(0);
    setCropTop(0);
    setCropRight(0);
    setCropBottom(0);
    setCropLeft(0);
    setCropEnabled(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
      setEditedImageUrl(null);
      resetFilters();
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
      setEditedImageUrl(null);
      resetFilters();
    };
    reader.readAsDataURL(file);
  };

  const onPaste = (e) => {
    const item = e.clipboardData?.files?.[0];
    if (!item || !item.type.startsWith("image/")) return;
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageUrl(ev.target.result);
      setEditedImageUrl(null);
      resetFilters();
    };
    reader.readAsDataURL(item);
  };

  const applyAIEdit = async (customPrompt) => {
    const prompt = customPrompt || aiPrompt;
    if (!imageUrl || !prompt.trim() || aiLoading) return;
    setAiLoading(true);
    setEditedImageUrl(null);
    setAiLog([]);

    addLog("AI edit pipeline…", "system");
    addLog(`Instruction: "${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}"`, "info");

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(200);

    try {
      addLog("Vision analysis…", "system");
      const imageUrlsForVision = imageUrl ? [imageUrl] : [];

      const imageDescription = await base44.integrations.Core.InvokeLLM({
        prompt: `Describe this image precisely: subject, layout, materials, lighting, and background. No preamble — description only, for image-to-image editing.`,
        file_urls: imageUrlsForVision.length ? imageUrlsForVision : undefined,
      });

      const description =
        typeof imageDescription === "string"
          ? imageDescription
          : imageDescription?.text || "";

      addLog(`Scene: ${description.slice(0, 72)}…`, "detail");

      const strength = aiStrength[0] ?? 0.72;
      const region = inpaintRegion.trim();

      const enhancedEdit = await base44.integrations.Core.InvokeLLM({
        prompt: `Expert image editor. Original scene: "${description.slice(0, 1200)}"

User edit: "${prompt}"
${region ? `Change only this region / aspect: ${region}` : ""}

Write ONE English image-generation prompt: same scene and composition, apply the edit faithfully. Max 380 chars. No quotes.`,
      });

      let finalPrompt =
        typeof enhancedEdit === "string"
          ? enhancedEdit
          : enhancedEdit?.text || prompt;
      finalPrompt = finalPrompt.trim().slice(0, 450);

      addLog(`Edit prompt ready (${finalPrompt.length} chars)`, "success");

      const genPayload = {
        prompt: finalPrompt,
        existing_image_urls: imageUrlsForVision,
        image_strength: strength,
        strength,
        denoising_strength: strength,
      };

      const result = await base44.integrations.Core.GenerateImage(genPayload);

      const url = result?.url || result?.data?.url;
      if (url) {
        addLog("AI edit complete.", "success");
        setEditedImageUrl(url);
      } else {
        addLog("No image URL in response", "error");
      }
    } catch (err) {
      addLog(`Error: ${err.message}`, "error");
    }

    setAiLoading(false);
  };

  const displayImage = editedImageUrl || imageUrl;
  const filterStr = computeFilterString();

  const download = () => {
    if (!displayImage) return;
    const a = document.createElement("a");
    a.href = displayImage;
    a.download = `harbor-intellect-edit-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const useEditedAsSource = () => {
    if (!editedImageUrl) return;
    setImageUrl(editedImageUrl);
    setEditedImageUrl(null);
    resetFilters();
  };

  const logColor = {
    system: "text-cyan-400",
    info: "text-slate-300",
    detail: "text-slate-500",
    success: "text-emerald-400",
    error: "text-red-400",
  };

  return (
    <div
      ref={pasteTargetRef}
      className="flex flex-col h-full min-h-0 bg-slate-950/60 outline-none"
      tabIndex={0}
      onPaste={onPaste}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-500/20 flex-shrink-0">
        <Wand2 className="w-4 h-4 text-violet-400" />
        <span className="text-white font-semibold text-sm">AI Image Studio — Editor</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
          Pro
        </span>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500">
          {editedImageUrl && (
            <label className="flex items-center gap-1 text-slate-400 cursor-pointer">
              <Checkbox checked={splitView} onCheckedChange={(c) => setSplitView(!!c)} />
              Split
            </label>
          )}
          <div
            className={`w-2 h-2 rounded-full ${aiLoading ? "bg-amber-400 animate-pulse" : displayImage ? "bg-emerald-400" : "bg-slate-600"}`}
          />
          {aiLoading ? "AI…" : displayImage ? "Ready" : "No image"}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col w-[46%] min-w-[260px] border-r border-slate-800/50 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
            <TabsList className="grid grid-cols-5 m-2 bg-slate-900/90 border border-slate-800 h-auto flex-wrap gap-0 p-1 rounded-lg">
              {[
                { id: "ai", label: "AI", icon: Wand2 },
                { id: "filters", label: "Color", icon: Sliders },
                { id: "transform", label: "Move", icon: RotateCw },
                { id: "adjust", label: "FX", icon: Zap },
                { id: "crop", label: "Crop", icon: Crop },
              ].map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="text-[10px] px-1 py-1.5 data-[state=active]:bg-violet-600/35 data-[state=active]:text-violet-100"
                >
                  <t.icon className="w-3 h-3 mx-auto mb-0.5 block opacity-80" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {!imageUrl && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mx-3 mb-3 flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/5"
                }`}
              >
                <Upload className="w-8 h-8 text-slate-600" />
                <p className="text-slate-400 text-sm font-medium text-center">Drop, click, or paste (Ctrl+V)</p>
                <p className="text-slate-600 text-xs">PNG, JPG, WebP</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>
            )}

            {imageUrl && (
              <>
                <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => pasteTargetRef.current?.focus()}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    Paste focus
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>

                <TabsContent value="ai" className="px-3 pb-4 space-y-3 mt-0 overflow-y-auto max-h-[55vh]">
                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Strength (preserve original)</Label>
                    <Slider
                      value={aiStrength}
                      onValueChange={setAiStrength}
                      min={0.25}
                      max={0.95}
                      step={0.01}
                      className="mt-2"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      Lower = closer to source; higher = more creative change. Passed as{" "}
                      <code className="text-slate-500">strength</code> /{" "}
                      <code className="text-slate-500">image_strength</code> when supported.
                    </p>
                  </div>

                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Region / mask hint (optional)</Label>
                    <Input
                      value={inpaintRegion}
                      onChange={(e) => setInpaintRegion(e.target.value)}
                      placeholder='e.g. "only the sky" or "left trailer doors"'
                      className="mt-1 h-8 text-xs bg-slate-900 border-slate-700"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Presets</p>
                    <div className="grid grid-cols-2 gap-1 max-h-[220px] overflow-y-auto pr-1">
                      {AI_EDIT_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setAiPrompt(preset.prompt);
                            applyAIEdit(preset.prompt);
                          }}
                          disabled={aiLoading}
                          className="text-left px-2 py-1.5 text-[10px] rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/40 text-slate-300 hover:text-white transition-all disabled:opacity-40"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-violet-400 inline mr-1" />
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Custom instruction</Label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the edit…"
                      className="mt-1 w-full h-20 px-3 py-2 bg-slate-900/70 border border-violet-500/30 rounded-xl text-white text-xs resize-none"
                    />
                    <Button
                      onClick={() => applyAIEdit()}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="w-full mt-2 bg-gradient-to-r from-violet-600 to-cyan-600 border-0 text-sm"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply AI edit
                        </>
                      )}
                    </Button>
                  </div>

                  {aiLog.length > 0 && (
                    <div className="bg-black/40 rounded-xl border border-slate-800/50 p-2 font-mono text-[10px] space-y-0.5 max-h-32 overflow-y-auto">
                      {aiLog.map((log, i) => (
                        <div key={`${log.ts}-${i}`} className={logColor[log.type]}>
                          {log.msg}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="filters" className="px-3 pb-4 space-y-2 mt-0 overflow-y-auto max-h-[55vh]">
                  {CSS_FILTERS.map((f) => {
                    const Icon = f.icon;
                    const val = filters[f.key];
                    return (
                      <div key={f.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-400">{f.label}</span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan-400">
                            {val.toFixed(2)}
                            {f.unit || ""}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          value={val}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, [f.key]: parseFloat(e.target.value) }))
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    );
                  })}
                  <Button size="sm" variant="outline" onClick={resetFilters} className="w-full border-slate-700 text-xs">
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Reset color
                  </Button>
                </TabsContent>

                <TabsContent value="transform" className="px-3 pb-4 space-y-3 mt-0 overflow-y-auto max-h-[55vh]">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 mb-2">Rotation</p>
                    <div className="flex flex-wrap gap-1">
                      {[-90, -45, 0, 45, 90].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setRotation(deg)}
                          className={`px-2 py-1 text-[11px] rounded border ${
                            rotation === deg
                              ? "border-violet-500 bg-violet-500/20 text-violet-300"
                              : "border-slate-700 text-slate-500"
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                      className="w-full mt-2 h-1.5 bg-slate-800 rounded-full accent-violet-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFlipH((v) => !v)}
                      className={`flex-1 text-xs ${flipH ? "border-violet-500 bg-violet-500/20" : ""}`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 mr-1" />
                      H
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFlipV((v) => !v)}
                      className={`flex-1 text-xs ${flipV ? "border-violet-500 bg-violet-500/20" : ""}`}
                    >
                      <FlipVertical className="w-3.5 h-3.5 mr-1" />
                      V
                    </Button>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Zoom</span>
                      <span>{(zoom * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setZoom((v) => Math.max(0.3, v - 0.1))}>
                        <ZoomOut className="w-3.5 h-3.5" />
                      </Button>
                      <input
                        type="range"
                        min={0.3}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-800 rounded-full accent-violet-500"
                      />
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setZoom((v) => Math.min(3, v + 0.1))}>
                        <ZoomIn className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adjust" className="px-3 pb-4 space-y-4 mt-0 overflow-y-auto max-h-[55vh]">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Layer opacity</span>
                      <span>{(imageOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={1}
                      step={0.02}
                      value={imageOpacity}
                      onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-full accent-violet-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Depth shadow</span>
                      <span>{dropShadowPx}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={48}
                      step={1}
                      value={dropShadowPx}
                      onChange={(e) => setDropShadowPx(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-full accent-violet-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Vignette</span>
                      <span>{vignette}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={1}
                      value={vignette}
                      onChange={(e) => setVignette(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-full accent-violet-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600">
                    FX are non-destructive previews (CSS). Download saves the current URL (AI result or original file) —
                    rasterize in an external tool for pixel-perfect export of filters.
                  </p>
                </TabsContent>

                <TabsContent value="crop" className="px-3 pb-4 space-y-3 mt-0 overflow-y-auto max-h-[55vh]">
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <Checkbox checked={cropEnabled} onCheckedChange={(c) => setCropEnabled(!!c)} />
                    Enable clip crop (preview)
                  </label>
                  {["Top", "Right", "Bottom", "Left"].map((label, i) => {
                    const vals = [cropTop, cropRight, cropBottom, cropLeft];
                    const setters = [setCropTop, setCropRight, setCropBottom, setCropLeft];
                    const v = vals[i];
                    const set = setters[i];
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{label}</span>
                          <span>{v}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={v}
                          onChange={(e) => set(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-800 rounded-full accent-cyan-500"
                        />
                      </div>
                    );
                  })}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 flex-shrink-0">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Scan className="w-3 h-3" />
              {editedImageUrl ? (splitView ? "Original · Result" : "Preview") : "Preview"}
            </span>
            {editedImageUrl && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                AI layer
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-3 overflow-auto">
            {displayImage ? (
              <div
                className={`flex gap-3 w-full h-full items-center justify-center ${editedImageUrl && splitView ? "flex-col lg:flex-row" : ""}`}
              >
                {editedImageUrl && splitView && (
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] text-slate-500">Original + adjustments</span>
                    <div className="relative inline-block max-w-full">
                      <div
                        className="absolute inset-0 pointer-events-none rounded-lg z-10"
                        style={{
                          boxShadow:
                            vignette > 0
                              ? `inset 0 0 ${vignette + 20}px ${vignette}px rgba(0,0,0,${Math.min(0.75, vignette / 100)})`
                              : undefined,
                        }}
                      />
                      <img
                        src={imageUrl}
                        alt=""
                        style={{
                          ...buildImageStyle(),
                          maxHeight: "min(340px, 45vh)",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                        className="rounded-lg border border-slate-700/60"
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0 relative">
                  {editedImageUrl && splitView && (
                    <span className="text-[10px] text-slate-500">AI result</span>
                  )}
                  <motion.div
                    key={displayImage}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative inline-block max-w-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none rounded-lg" />
                    <div
                      className="absolute inset-0 pointer-events-none rounded-lg z-10"
                      style={{
                        boxShadow:
                          vignette > 0 && !splitView
                            ? `inset 0 0 ${vignette + 20}px ${vignette}px rgba(0,0,0,${Math.min(0.75, vignette / 100)})`
                            : splitView && editedImageUrl
                              ? `inset 0 0 ${vignette + 20}px ${vignette}px rgba(0,0,0,${Math.min(0.75, vignette / 100)})`
                              : vignette > 0
                                ? `inset 0 0 ${vignette + 20}px ${vignette}px rgba(0,0,0,${Math.min(0.75, vignette / 100)})`
                                : undefined,
                      }}
                    />
                    <img
                      src={editedImageUrl && splitView ? editedImageUrl : displayImage}
                      alt="Edit preview"
                      style={{
                        ...(editedImageUrl && splitView
                          ? {
                              filter: computeFilterString(),
                              opacity: imageOpacity,
                              maxHeight: "min(340px, 45vh)",
                              maxWidth: "100%",
                              objectFit: "contain",
                            }
                          : {
                              ...buildImageStyle(),
                              maxHeight: "min(380px, 55vh)",
                              maxWidth: "100%",
                              objectFit: "contain",
                            }),
                      }}
                      className="rounded-lg shadow-xl shadow-cyan-500/10 border border-slate-700/50"
                    />

                    {aiLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 rounded-lg backdrop-blur-sm z-20">
                        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
                      </div>
                    )}
                  </motion.div>

                  <p className="text-[10px] text-slate-600 font-mono truncate max-w-full">
                    CSS: {filterStr.slice(0, 80)}
                    {filterStr.length > 80 ? "…" : ""}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-600">
                <Image className="w-14 h-14 opacity-20" />
                <p className="text-sm text-slate-500">Upload or paste an image</p>
              </div>
            )}
          </div>

          {displayImage && (
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-800/50 flex-wrap">
              <Button size="sm" onClick={download} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-8">
                <Download className="w-3 h-3 mr-1.5" />
                Download
              </Button>
              {editedImageUrl && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditedImageUrl(null)} className="text-xs h-8 border-slate-700">
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Revert AI
                  </Button>
                  <Button size="sm" variant="outline" onClick={useEditedAsSource} className="text-xs h-8 border-violet-600/50 text-violet-200">
                    <Columns2 className="w-3 h-3 mr-1.5" />
                    Continue from result
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs h-8 border-slate-700">
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Reset FX
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
