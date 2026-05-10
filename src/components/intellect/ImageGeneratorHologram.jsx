import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Image, Sparkles, Loader2, Download, RefreshCw,
  Wand2, CheckCircle, Pencil, History, Sliders, ImagePlus,
  Copy, Trash2, Layers, Ratio, Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const THINKING_STEPS = [
  { id: "parse", label: "Parsing prompt", icon: Sparkles, color: "text-cyan-400", duration: 400 },
  { id: "concepts", label: "Visual concepts", icon: Layers, color: "text-violet-400", duration: 500 },
  { id: "style", label: "Style & composition", icon: Image, color: "text-pink-400", duration: 450 },
  { id: "enhance", label: "Prompt engineering", icon: Wand2, color: "text-amber-400", duration: 500 },
  { id: "generate", label: "Neural render", icon: Sparkles, color: "text-cyan-400", duration: 800 },
  { id: "finalize", label: "Finalize", icon: CheckCircle, color: "text-emerald-400", duration: 300 },
];

/** Pixel sizes sent to GenerateImage (backend may clamp). */
const ASPECT_PRESETS = [
  { id: "1:1", label: "1:1", w: 1024, h: 1024 },
  { id: "16:9", label: "16:9", w: 1280, h: 720 },
  { id: "9:16", label: "9:16", w: 720, h: 1280 },
  { id: "4:3", label: "4:3", w: 1152, h: 864 },
  { id: "3:4", label: "3:4", w: 864, h: 1152 },
  { id: "21:9", label: "21:9", w: 1536, h: 640 },
];

const STYLE_PRESETS = [
  { id: "none", label: "Default", suffix: "" },
  { id: "photo", label: "Photorealistic", suffix: "photorealistic, 8k uhd, sharp focus, professional photography, accurate materials and lighting" },
  { id: "logistics", label: "Fleet / ops", suffix: "commercial fleet photography, logistics yard, crisp documentary style, safety visibility, realistic vehicles and containers" },
  { id: "isometric", label: "Isometric 3D", suffix: "clean isometric 3d render, warehouse and pallets, soft studio lighting, subtle shadows, explainer style" },
  { id: "blueprint", label: "Technical", suffix: "technical illustration, precise linework, labeled diagram aesthetic, white background, CAD-inspired" },
  { id: "cinematic", label: "Cinematic", suffix: "cinematic wide shot, dramatic volumetric light, film grain, moody color grade" },
  { id: "product", label: "Product hero", suffix: "studio product shot, seamless gradient background, softbox lighting, minimal reflections" },
  { id: "illustration", label: "Editorial", suffix: "modern editorial illustration, bold shapes, limited palette, magazine quality" },
];

const QUICK_PROMPTS = [
  "Electric semi-truck at a Nordic logistics hub at golden hour",
  "Isometric cutaway of a cross-dock with conveyor and trailers",
  "Container ship in port with cranes — photorealistic wide angle",
  "Last-mile delivery robot in a European city — clean product style",
  "Supply chain control tower room with wall of live KPI dashboards",
];

function buildGeneratePayload({
  promptText,
  negativePrompt,
  width,
  height,
  seed,
  referenceUrls,
  guidanceScale,
  steps,
}) {
  const payload = {
    prompt: promptText,
    width,
    height,
  };
  if (negativePrompt?.trim()) payload.negative_prompt = negativePrompt.trim();
  if (seed != null && Number.isFinite(seed)) payload.seed = Math.floor(seed);
  if (referenceUrls?.length) payload.existing_image_urls = referenceUrls;
  if (guidanceScale != null) payload.guidance_scale = guidanceScale;
  if (steps != null) payload.num_inference_steps = steps;
  return payload;
}

export default function ImageGeneratorHologram({ onClose, openWindow }) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, low quality, watermark, distorted text, extra fingers, deformed",
  );
  const [aspectId, setAspectId] = useState("1:1");
  const [styleId, setStyleId] = useState("photo");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(28);
  const [seedLocked, setSeedLocked] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2_147_483_647));
  const [variationCount, setVariationCount] = useState(1);
  const [useAiEnhance, setUseAiEnhance] = useState(true);
  const [referenceDataUrl, setReferenceDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [logs, setLogs] = useState([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [history, setHistory] = useState([]);
  const logsEndRef = useRef(null);
  const refFileInput = useRef(null);

  const dims = ASPECT_PRESETS.find((a) => a.id === aspectId) || ASPECT_PRESETS[0];

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, ts: Date.now() }]);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const runThinkingAnimation = async (basePrompt) => {
    for (let i = 0; i < THINKING_STEPS.length - 2; i++) {
      const step = THINKING_STEPS[i];
      setCurrentStep(step.id);
      setActiveSteps((prev) => [...prev, step.id]);
      addLog(`  ▸ ${step.label}`, "detail");
      await sleep(step.duration);
    }
  };

  const randomizeSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 2_147_483_647));
  }, []);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGeneratedImages([]);
    setSelectedIndex(0);
    setActiveSteps([]);
    setCurrentStep(null);
    setLogs([]);
    setEnhancedPrompt("");

    addLog("Initiating generation pipeline…", "system");
    addLog(`Prompt: "${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}"`, "info");
    addLog(`Output: ${dims.w}×${dims.h} (${aspectId})`, "detail");

    await runThinkingAnimation(prompt);

    const styleSuffix = STYLE_PRESETS.find((s) => s.id === styleId)?.suffix || "";
    let promptForModel = prompt.trim();

    setCurrentStep("enhance");
    setActiveSteps((prev) => [...prev, "enhance"]);

    if (useAiEnhance) {
      try {
        addLog("Enhancing prompt with LLM…", "system");
        const enhanced = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert image-generation prompt engineer for professional logistics, fleet, and industrial visuals.

Rewrite the user's idea into ONE dense English prompt under 220 characters. Include: subject, setting, lighting, camera/lens feel, and quality tokens (e.g. highly detailed, sharp). No quotes. No preamble.

User idea: "${promptForModel}"`,
        });
        const ep =
          typeof enhanced === "string"
            ? enhanced
            : enhanced?.text || promptForModel;
        promptForModel = (ep || "").trim().slice(0, 400) || promptForModel;
        setEnhancedPrompt(promptForModel);
        addLog(`Enhanced: "${promptForModel.slice(0, 100)}…"`, "success");
      } catch (e) {
        addLog(`Enhance skipped: ${e.message}`, "detail");
      }
    }

    const fullPrompt = [promptForModel, styleSuffix].filter(Boolean).join(". ");
    const refUrls = referenceDataUrl ? [referenceDataUrl] : [];

    setCurrentStep("generate");
    setActiveSteps((prev) => [...prev, "generate"]);
    addLog("Calling image engine…", "system");

    const baseSeed = seedLocked ? seed : Math.floor(Math.random() * 2_147_483_647);
    if (!seedLocked) setSeed(baseSeed);

    const urls = [];
    const n = Math.min(4, Math.max(1, variationCount));

    try {
      for (let v = 0; v < n; v++) {
        const payload = buildGeneratePayload({
          promptText: n > 1 && v > 0 ? `${fullPrompt} (variation ${v + 1}, alternate composition)` : fullPrompt,
          negativePrompt,
          width: dims.w,
          height: dims.h,
          seed: baseSeed + v,
          referenceUrls: refUrls,
          guidanceScale,
          steps,
        });

        addLog(`  › Variation ${v + 1}/${n} seed=${payload.seed}`, "detail");

        const result = await base44.integrations.Core.GenerateImage(payload);
        const imageUrl = result?.url || result?.data?.url;
        if (imageUrl) urls.push(imageUrl);
        else addLog("Engine returned empty URL", "error");
      }

      setCurrentStep("finalize");
      setActiveSteps((prev) => [...prev, "finalize"]);
      addLog(urls.length ? `Done — ${urls.length} image(s)` : "No images returned", urls.length ? "success" : "error");
      setGeneratedImages(urls);
      if (urls.length) {
        setHistory((prev) => [
          {
            urls,
            prompt: fullPrompt,
            aspect: aspectId,
            ts: Date.now(),
          },
          ...prev,
        ].slice(0, 12));
      }
    } catch (err) {
      addLog(`Generation failed: ${err.message}`, "error");
    }

    setCurrentStep(null);
    setGenerating(false);
  };

  const primaryImage = generatedImages[selectedIndex] || null;

  const download = (url = primaryImage) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `harbor-intellect-gen-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const copyPrompt = () => {
    const t = enhancedPrompt || prompt;
    if (t) navigator.clipboard?.writeText(t);
  };

  const logColor = {
    system: "text-cyan-400",
    info: "text-slate-300",
    detail: "text-slate-500",
    success: "text-emerald-400",
    error: "text-red-400",
  };

  const onRefFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceDataUrl(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-950/60">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-500/20 flex-shrink-0">
        <Wand2 className="w-4 h-4 text-violet-400" />
        <span className="text-white font-semibold text-sm">AI Image Studio</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
          Pro
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
          <div
            className={`w-2 h-2 rounded-full ${generating ? "bg-amber-400 animate-pulse" : primaryImage ? "bg-emerald-400" : "bg-slate-600"}`}
          />
          {generating ? "Rendering…" : primaryImage ? "Ready" : "Idle"}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col w-[48%] min-w-[280px] border-r border-slate-800/50 overflow-y-auto">
          <Tabs defaultValue="create" className="flex flex-col flex-1 min-h-0 p-3">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900/80 border border-slate-800 h-9 p-1">
              <TabsTrigger
                value="create"
                className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200"
              >
                Create
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200"
              >
                Advanced
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200"
              >
                <History className="w-3 h-3 mr-1 inline" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 space-y-3 mt-3 overflow-y-auto">
              <div>
                <Label className="text-slate-400 text-[11px] uppercase tracking-wider">Prompt</Label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) generate();
                  }}
                  placeholder="Describe the scene… (Ctrl+Enter generate)"
                  className="mt-1.5 w-full h-24 px-3 py-2.5 bg-slate-900/70 border border-violet-500/30 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-violet-400 resize-none"
                />
              </div>

              <div>
                <Label className="text-slate-400 text-[11px] uppercase tracking-wider">Quick ideas</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPrompt(q)}
                      className="text-left text-[10px] px-2 py-1 rounded-lg border border-slate-700/80 bg-slate-900/50 text-slate-400 hover:text-white hover:border-violet-500/40 max-w-full"
                    >
                      {q.slice(0, 42)}…
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Ratio className="w-3 h-3" />
                  Aspect ratio
                </Label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {ASPECT_PRESETS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspectId(a.id)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        aspectId === a.id
                          ? "border-violet-500 bg-violet-500/20 text-violet-200"
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-400 text-[11px] uppercase tracking-wider">Visual style</Label>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {STYLE_PRESETS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyleId(s.id)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        styleId === s.id
                          ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-enhance"
                  checked={useAiEnhance}
                  onCheckedChange={(c) => setUseAiEnhance(!!c)}
                />
                <label htmlFor="ai-enhance" className="text-xs text-slate-400 cursor-pointer">
                  LLM prompt enhance
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500 whitespace-nowrap">Variations</Label>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVariationCount(n)}
                    className={`w-8 h-8 text-xs rounded border ${
                      variationCount === n
                        ? "border-violet-500 bg-violet-500/20 text-white"
                        : "border-slate-700 text-slate-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <Button
                onClick={generate}
                disabled={!prompt.trim() || generating}
                className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="flex-1 space-y-3 mt-3 overflow-y-auto">
              <div>
                <Label className="text-slate-400 text-[11px]">Negative prompt</Label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="mt-1 w-full h-20 px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-xl text-white text-xs resize-none"
                />
              </div>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-xs text-violet-300 hover:text-violet-200 py-1">
                  <ChevronDown className="w-4 h-4" />
                  Reference image (img2img / style anchor)
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  <input
                    ref={refFileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onRefFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300"
                    onClick={() => refFileInput.current?.click()}
                  >
                    <ImagePlus className="w-3.5 h-3.5 mr-2" />
                    Upload reference
                  </Button>
                  {referenceDataUrl && (
                    <div className="flex items-center gap-2">
                      <img src={referenceDataUrl} alt="" className="h-14 rounded border border-slate-700 object-cover" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setReferenceDataUrl(null)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-slate-500">Guidance</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value) || 7.5)}
                    className="mt-1 h-8 bg-slate-900 border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Steps</Label>
                  <Input
                    type="number"
                    min={10}
                    max={60}
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value, 10) || 28)}
                    className="mt-1 h-8 bg-slate-900 border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Checkbox
                  id="lock-seed"
                  checked={seedLocked}
                  onCheckedChange={(c) => setSeedLocked(!!c)}
                />
                <label htmlFor="lock-seed" className="text-xs text-slate-400">
                  Lock seed
                </label>
                <Input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                  className="w-36 h-8 bg-slate-900 border-slate-700 text-xs"
                />
                <Button type="button" variant="outline" size="sm" className="h-8 border-slate-600" onClick={randomizeSeed}>
                  <Shuffle className="w-3.5 h-3.5" />
                </Button>
              </div>

              <p className="text-[10px] text-slate-600 leading-relaxed">
                Extra fields (guidance, steps, seed, negative prompt, size) are passed to{" "}
                <code className="text-slate-500">GenerateImage</code> when the integration supports them; unknown fields are
                ignored by the backend.
              </p>
            </TabsContent>

            <TabsContent value="history" className="flex-1 mt-3 space-y-2 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-slate-600 py-8 text-center">No runs yet this session.</p>
              ) : (
                history.map((h, i) => (
                  <button
                    key={`${h.ts}-${i}`}
                    type="button"
                    onClick={() => {
                      setGeneratedImages(h.urls);
                      setSelectedIndex(0);
                      setPrompt(h.prompt.split(".").slice(0, 2).join(". ") || h.prompt);
                    }}
                    className="w-full flex gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-violet-500/40 text-left"
                  >
                    {h.urls[0] && (
                      <img src={h.urls[0]} alt="" className="w-14 h-14 object-cover rounded" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500">{h.aspect} · {new Date(h.ts).toLocaleString()}</p>
                      <p className="text-xs text-slate-400 truncate">{h.prompt}</p>
                    </div>
                  </button>
                ))
              )}
            </TabsContent>
          </Tabs>

          {(generating || activeSteps.length > 0) && (
            <div className="px-3 pb-2 border-t border-slate-800/50 pt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                Pipeline
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {THINKING_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isDone = activeSteps.includes(step.id) && currentStep !== step.id;
                  const isActive = currentStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-[11px] px-2 py-1 rounded ${isActive ? "bg-slate-800/80 border border-cyan-500/30" : ""}`}
                    >
                      {isActive ? (
                        <Loader2 className={`w-3 h-3 ${step.color} animate-spin`} />
                      ) : isDone ? (
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Icon className={`w-3 h-3 ${step.color} opacity-40`} />
                      )}
                      <span className={isDone ? "text-slate-500 line-through" : isActive ? "text-white" : "text-slate-600"}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col px-3 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Log</p>
            <div className="flex-1 overflow-y-auto bg-black/40 rounded-xl border border-slate-800/50 p-2 font-mono text-[10px] space-y-0.5 min-h-[80px] max-h-[160px]">
              {logs.map((log, i) => (
                <div key={`${log.ts}-${i}`} className={logColor[log.type] || "text-slate-400"}>
                  <span className="text-slate-700 mr-1">
                    [{new Date(log.ts).toLocaleTimeString("en", { hour12: false })}]
                  </span>
                  {log.msg}
                </div>
              ))}
              {generating && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-cyan-400"
                >
                  ▋
                </motion.span>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-3 bg-slate-950/30">
          <AnimatePresence mode="wait">
            {generatedImages.length > 0 ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full min-h-0 gap-3"
              >
                {generatedImages.length > 1 && (
                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    {generatedImages.map((u, i) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setSelectedIndex(i)}
                        className={`relative rounded-lg overflow-hidden border-2 w-16 h-16 flex-shrink-0 ${
                          selectedIndex === i ? "border-violet-500" : "border-slate-700 opacity-70"
                        }`}
                      >
                        <img src={u} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="relative flex-1 min-h-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 rounded-xl pointer-events-none" />
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-violet-400/60 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-violet-400/60 rounded-br" />
                  <img
                    src={primaryImage}
                    alt="Generated"
                    className="max-w-full max-h-full object-contain rounded-lg border border-slate-700/50 shadow-2xl shadow-cyan-500/15"
                    style={{ maxHeight: "min(420px, 70vh)" }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap flex-shrink-0">
                  <Button size="sm" onClick={() => download()} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-8">
                    <Download className="w-3 h-3 mr-1.5" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8 border-slate-600" onClick={copyPrompt}>
                    <Copy className="w-3 h-3 mr-1.5" />
                    Copy prompt
                  </Button>
                  {openWindow && primaryImage && (
                    <Button
                      size="sm"
                      onClick={() => openWindow("image_editor", { x: 120, y: 80 }, { imageUrl: primaryImage })}
                      className="bg-violet-600 hover:bg-violet-500 text-xs h-8 border-0"
                    >
                      <Pencil className="w-3 h-3 mr-1.5" />
                      Edit in studio
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setGeneratedImages([]);
                      setActiveSteps([]);
                      setLogs([]);
                    }}
                    className="text-xs h-8 border-slate-700"
                  >
                    <RefreshCw className="w-3 h-3 mr-1.5" />
                    Clear
                  </Button>
                </div>
              </motion.div>
            ) : generating ? (
              <motion.div key="loading" className="flex flex-col items-center justify-center h-full gap-4">
                <div className="relative w-44 h-44">
                  <div className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 animate-spin border-t-cyan-400" />
                    <Wand2 className="absolute inset-0 m-auto w-7 h-7 text-violet-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-white text-sm font-medium">Rendering…</p>
              </motion.div>
            ) : (
              <motion.div key="empty" className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <Image className="w-16 h-16 opacity-20" />
                <p className="text-sm">Output preview</p>
                <p className="text-xs text-slate-700">Use Create tab, then Generate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
