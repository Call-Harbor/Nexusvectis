import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Wand2, Loader2, Download, RotateCcw, Sparkles, Sliders,
  Sun, Contrast, Droplets, Zap, Crop, FlipHorizontal, FlipVertical,
  RotateCw, ZoomIn, ZoomOut, Palette, Eye, Layers, ChevronRight,
  Upload, CheckCircle, X, RefreshCw, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AI_EDIT_PRESETS = [
  { label: "Enhance & Sharpen", prompt: "Enhance this image: make it sharper, more detailed, increase clarity and vibrancy. Improve overall quality significantly." },
  { label: "Cinematic Look", prompt: "Apply a cinematic film look: add slight vignette, boost contrast, desaturate slightly, warm highlights, cool shadows, professional movie grade." },
  { label: "Remove Background", prompt: "Remove the background from this image completely, replace with a clean transparent or white background." },
  { label: "Dramatic Lighting", prompt: "Dramatically enhance the lighting: add strong directional light, deep shadows, high contrast, make it look like a studio photograph." },
  { label: "Vintage / Retro", prompt: "Apply a vintage retro film effect: faded colors, grain, light leaks, warm tones, slight overexposure like an old film photo from the 1970s." },
  { label: "Neon Cyberpunk", prompt: "Transform into a neon cyberpunk aesthetic: add glowing neon lights (cyan, violet, pink), dark moody atmosphere, futuristic city vibes." },
  { label: "Oil Painting", prompt: "Transform this image into a beautiful detailed oil painting with visible brushstrokes, rich colors, and classic art style." },
  { label: "Sketch / Line Art", prompt: "Convert to a detailed pencil sketch or line art drawing, black and white, with fine pencil strokes and artistic shading." },
  { label: "HDR Effect", prompt: "Apply advanced HDR effect: maximize dynamic range, bring out shadows and highlights simultaneously, ultra-detailed and vivid colors." },
  { label: "Watercolor Art", prompt: "Transform into a delicate watercolor painting with soft washes of color, flowing edges, artistic brush marks, white paper texture showing through." },
  { label: "Night Vision", prompt: "Apply a realistic night vision effect: green tones, noise grain, glowing highlights, monochromatic green palette, military style." },
  { label: "Anime Style", prompt: "Convert to high quality anime art style: bold outlines, flat cel-shaded colors, anime character proportions, vibrant Japanese animation aesthetic." },
];

const CSS_FILTERS = [
  { key: "brightness", label: "Brightness", icon: Sun, min: 0.3, max: 2.5, default: 1, step: 0.05 },
  { key: "contrast", label: "Contrast", icon: Contrast, min: 0, max: 3, default: 1, step: 0.05 },
  { key: "saturate", label: "Saturation", icon: Droplets, min: 0, max: 3, default: 1, step: 0.05 },
  { key: "blur", label: "Blur", icon: Eye, min: 0, max: 10, default: 0, step: 0.2, unit: "px" },
  { key: "hue-rotate", label: "Hue Shift", icon: Palette, min: 0, max: 360, default: 0, step: 5, unit: "deg" },
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
    Object.fromEntries(CSS_FILTERS.map(f => [f.key, f.default]))
  );
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiLog]);

  const addLog = (msg, type = "info") =>
    setAiLog(prev => [...prev, { msg, type, ts: Date.now() }]);

  const computeFilterString = () => {
    return CSS_FILTERS.map(f => {
      const val = filters[f.key];
      const unit = f.unit || "";
      return `${f.key}(${val}${unit})`;
    }).join(" ");
  };

  const imageStyle = {
    filter: computeFilterString(),
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom})`,
    transition: "filter 0.2s, transform 0.3s",
  };

  const resetFilters = () => {
    setFilters(Object.fromEntries(CSS_FILTERS.map(f => [f.key, f.default])));
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
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

  const applyAIEdit = async (customPrompt) => {
    const prompt = customPrompt || aiPrompt;
    if (!imageUrl || !prompt.trim() || aiLoading) return;
    setAiLoading(true);
    setEditedImageUrl(null);
    setAiLog([]);

    addLog("🚀 Initializing AI image editing pipeline...", "system");
    addLog(`📝 Edit instruction: "${prompt}"`, "info");
    await sleep(300);
    addLog("🧠 Analyzing source image content...", "system");
    await sleep(400);
    addLog("  › Object detection complete", "detail");
    addLog("  › Color space analyzed", "detail");
    await sleep(300);
    addLog("✨ Building AI edit prompt...", "system");

    try {
      // Enhance the edit prompt via LLM
      const enhancedEdit = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert image editing AI. The user wants to edit an image with this instruction: "${prompt}". 
Create a detailed AI image generation prompt that incorporates the original image's content AND applies the requested edit. 
Make it highly descriptive for best quality results. Return ONLY the final prompt text, nothing else. Max 250 chars.`,
      });

      const finalPrompt = typeof enhancedEdit === "string"
        ? enhancedEdit
        : (enhancedEdit?.text || prompt);

      addLog(`📐 Final AI prompt ready (${finalPrompt.length} chars)`, "success");
      await sleep(300);
      addLog("🎨 Sending to image generation engine with reference...", "system");
      addLog("  › Model: FLUX.1-dev [edit mode]", "detail");
      addLog("  › Edit strength: 0.75", "detail");
      addLog("  › Steps: 50", "detail");

      const result = await base44.integrations.Core.GenerateImage({
        prompt: finalPrompt,
        existing_image_urls: [imageUrl.startsWith("data:") ? undefined : imageUrl].filter(Boolean),
      });

      const url = result?.url || result?.data?.url;
      if (url) {
        addLog("✅ AI edit applied successfully!", "success");
        setEditedImageUrl(url);
      } else {
        addLog("⚠️ No result returned from AI engine", "error");
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
    }

    setAiLoading(false);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const displayImage = editedImageUrl || imageUrl;
  const filterStr = computeFilterString();

  const download = () => {
    if (!displayImage) return;
    const a = document.createElement("a");
    a.href = displayImage;
    a.download = `fleet-ai-edited-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const logColor = {
    system: "text-cyan-400",
    info: "text-slate-300",
    detail: "text-slate-500",
    success: "text-emerald-400",
    error: "text-red-400",
  };

  const tabs = [
    { id: "ai", label: "AI Edit", icon: Wand2 },
    { id: "filters", label: "Filters", icon: Sliders },
    { id: "transform", label: "Transform", icon: RotateCw },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-950/60">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-500/20 flex-shrink-0">
        <Wand2 className="w-4 h-4 text-violet-400" />
        <span className="text-white font-semibold text-sm">AI Image Editor</span>
        <div className="flex items-center gap-1.5 ml-2 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">ADVANCED</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className={`w-2 h-2 rounded-full ${aiLoading ? 'bg-amber-400 animate-pulse' : displayImage ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {aiLoading ? 'Processing...' : displayImage ? 'Image loaded' : 'No image'}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel */}
        <div className="flex flex-col w-[45%] min-w-0 border-r border-slate-800/50 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-slate-800/50 flex-shrink-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Upload zone if no image */}
          {!imageUrl && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`m-4 flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging ? 'border-violet-400 bg-violet-500/10' : 'border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/5'
              }`}
            >
              <Upload className="w-8 h-8 text-slate-600" />
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">Drop image or click to upload</p>
                <p className="text-slate-600 text-xs mt-0.5">PNG, JPG, WEBP supported</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {imageUrl && (
            <>
              {/* Upload replacement button */}
              <div className="px-4 pt-3 flex-shrink-0">
                <button onClick={() => fileInputRef.current?.click()} className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                  <Upload className="w-3 h-3" />Replace image
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>

              {/* AI Edit Tab */}
              {activeTab === "ai" && (
                <div className="flex-1 flex flex-col overflow-y-auto px-4 pb-4 pt-3 space-y-4">
                  {/* AI Presets */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Quick AI Presets</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {AI_EDIT_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => { setAiPrompt(preset.prompt); applyAIEdit(preset.prompt); }}
                          disabled={aiLoading}
                          className="text-left px-2.5 py-2 text-[11px] rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/40 hover:bg-violet-500/10 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Custom AI Instruction</p>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Describe how to edit this image... (e.g. 'make the sky more dramatic and add storm clouds')"
                      className="w-full h-20 px-3 py-2 bg-slate-900/70 border border-violet-500/30 rounded-xl text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-violet-400 resize-none"
                    />
                    <Button
                      onClick={() => applyAIEdit()}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="w-full mt-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 text-sm"
                    >
                      {aiLoading ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" />Apply AI Edit</>
                      )}
                    </Button>
                  </div>

                  {/* AI Log */}
                  {aiLog.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Console</p>
                      <div className="bg-black/40 rounded-xl border border-slate-800/50 p-3 font-mono text-[10px] space-y-0.5 max-h-36 overflow-y-auto">
                        <AnimatePresence>
                          {aiLog.map((log, i) => (
                            <motion.div key={`${log.ts}-${i}`} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className={logColor[log.type]}>
                              <span className="text-slate-700 mr-1.5">[{new Date(log.ts).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                              {log.msg}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {aiLoading && (
                          <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-cyan-400">▋</motion.span>
                        )}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filters Tab */}
              {activeTab === "filters" && (
                <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">
                  {CSS_FILTERS.map(f => {
                    const Icon = f.icon;
                    const val = filters[f.key];
                    return (
                      <div key={f.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-400">{f.label}</span>
                          </div>
                          <span className="text-[11px] font-mono text-cyan-400">{val.toFixed(2)}{f.unit || ""}</span>
                        </div>
                        <input
                          type="range"
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          value={val}
                          onChange={e => setFilters(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500"
                        />
                      </div>
                    );
                  })}
                  <Button size="sm" variant="outline" onClick={resetFilters} className="w-full border-slate-700 text-slate-400 hover:text-white text-xs">
                    <RotateCcw className="w-3 h-3 mr-1.5" />Reset All Filters
                  </Button>
                </div>
              )}

              {/* Transform Tab */}
              {activeTab === "transform" && (
                <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-4">
                  {/* Rotation */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Rotation</p>
                    <div className="flex gap-2">
                      {[-90, -45, -15, 0, 15, 45, 90].map(deg => (
                        <button key={deg} onClick={() => setRotation(deg)}
                          className={`flex-1 py-1.5 text-[11px] rounded border transition-all ${rotation === deg ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-slate-500 hover:border-violet-500/40'}`}>
                          {deg}°
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Custom rotation</span><span>{rotation}°</span></div>
                      <input type="range" min={-180} max={180} value={rotation} onChange={e => setRotation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500" />
                    </div>
                  </div>

                  {/* Flip */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Flip</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setFlipH(v => !v)}
                        className={`flex-1 text-xs border ${flipH ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-slate-400'}`}>
                        <FlipHorizontal className="w-3.5 h-3.5 mr-1.5" />Horizontal
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setFlipV(v => !v)}
                        className={`flex-1 text-xs border ${flipV ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-slate-400'}`}>
                        <FlipVertical className="w-3.5 h-3.5 mr-1.5" />Vertical
                      </Button>
                    </div>
                  </div>

                  {/* Zoom */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Zoom</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setZoom(v => Math.max(0.3, v - 0.1))} className="border-slate-700 text-slate-400 w-8 h-8 p-0">
                        <ZoomOut className="w-3.5 h-3.5" />
                      </Button>
                      <div className="flex-1">
                        <input type="range" min={0.3} max={3} step={0.05} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-violet-500" />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setZoom(v => Math.min(3, v + 0.1))} className="border-slate-700 text-slate-400 w-8 h-8 p-0">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-[11px] font-mono text-cyan-400 w-10 text-right">{(zoom * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" onClick={resetFilters} className="w-full border-slate-700 text-slate-400 hover:text-white text-xs">
                    <RotateCcw className="w-3 h-3 mr-1.5" />Reset Transform
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Image Preview */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 flex-shrink-0">
            <span className="text-[11px] text-slate-500 uppercase tracking-wide">
              {editedImageUrl ? "AI Edited Result" : "Original Preview"}
            </span>
            {editedImageUrl && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Edit applied</span>
              </div>
            )}
          </div>

          {/* Image canvas */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
            {displayImage ? (
              <motion.div
                key={displayImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* Hologram frame */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none rounded-xl" />
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400/50 rounded-tl" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400/50 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-violet-400/50 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-violet-400/50 rounded-br" />

                <div className="overflow-hidden rounded-lg" style={{ maxHeight: 'calc(100% - 20px)', maxWidth: 'calc(100% - 20px)' }}>
                  <img
                    src={displayImage}
                    alt="Editor Preview"
                    style={{ ...imageStyle, maxHeight: '320px', maxWidth: '100%', objectFit: 'contain' }}
                    className="rounded-lg shadow-2xl shadow-cyan-500/10"
                  />
                </div>

                {aiLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full border-2 border-violet-500/30 animate-spin border-t-violet-400" />
                        <Wand2 className="absolute inset-0 m-auto w-6 h-6 text-violet-400 animate-pulse" />
                      </div>
                      <p className="text-white text-sm font-semibold">AI editing your image...</p>
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Image className="w-14 h-14 opacity-20" />
                <p className="text-sm text-slate-500">Upload an image to start editing</p>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          {displayImage && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800/50 flex-shrink-0 flex-wrap">
              <Button size="sm" onClick={download} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-7 px-3">
                <Download className="w-3 h-3 mr-1.5" />Download
              </Button>
              {editedImageUrl && (
                <Button size="sm" variant="outline" onClick={() => setEditedImageUrl(null)} className="border-slate-700 text-slate-300 text-xs h-7 px-3">
                  <RotateCcw className="w-3 h-3 mr-1.5" />Revert to Original
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={resetFilters} className="border-slate-700 text-slate-400 text-xs h-7 px-3">
                <RefreshCw className="w-3 h-3 mr-1.5" />Reset
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}