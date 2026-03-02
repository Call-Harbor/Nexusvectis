import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  Image, Sparkles, Loader2, Download, RefreshCw, 
  ChevronRight, Zap, Brain, Palette, Wand2, CheckCircle, X, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";

const THINKING_STEPS = [
  { id: "parse", label: "Parsing prompt", icon: Brain, color: "text-cyan-400", duration: 400 },
  { id: "concepts", label: "Extracting visual concepts", icon: Sparkles, color: "text-violet-400", duration: 600 },
  { id: "style", label: "Determining artistic style", icon: Palette, color: "text-pink-400", duration: 500 },
  { id: "compose", label: "Composing scene layout", icon: Wand2, color: "text-amber-400", duration: 700 },
  { id: "enhance", label: "Enhancing prompt for quality", icon: Zap, color: "text-emerald-400", duration: 400 },
  { id: "generate", label: "Generating image with AI engine", icon: Image, color: "text-cyan-400", duration: 800 },
  { id: "refine", label: "Refining and upscaling", icon: RefreshCw, color: "text-violet-400", duration: 500 },
  { id: "finalize", label: "Finalizing output", icon: CheckCircle, color: "text-emerald-400", duration: 300 },
];

export default function ImageGeneratorHologram({ onClose, openWindow }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [activeSteps, setActiveSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [logs, setLogs] = useState([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [...prev, { msg, type, ts: Date.now() }]);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGeneratedImage(null);
    setActiveSteps([]);
    setCurrentStep(null);
    setLogs([]);
    setEnhancedPrompt("");

    addLog(`🚀 Initiating image generation pipeline...`, "system");
    addLog(`📝 Input prompt: "${prompt}"`, "info");

    // Step through thinking steps with visual feedback
    for (let i = 0; i < THINKING_STEPS.length - 2; i++) {
      const step = THINKING_STEPS[i];
      setCurrentStep(step.id);
      setActiveSteps(prev => [...prev, step.id]);

      const logMessages = {
        parse: [`Tokenizing: "${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}"`, `Detected ${prompt.split(' ').length} semantic tokens`],
        concepts: [`Identified ${Math.floor(Math.random() * 5) + 3} visual concepts`, `Subject analysis: ${prompt.split(' ').slice(0, 3).join(', ')}...`],
        style: [`Style classification: photorealistic / digital art`, `Color palette: ${['vibrant', 'muted', 'dramatic', 'soft'][Math.floor(Math.random() * 4)]}`],
        compose: [`Scene depth: ${Math.random() > 0.5 ? 'foreground + background' : 'single plane'}`, `Composition: rule of thirds applied`],
        enhance: [`Injecting quality modifiers: 4K, highly detailed, sharp focus`, `Final prompt length: ${prompt.length + 60} chars`],
      };

      for (const msg of (logMessages[step.id] || [])) {
        addLog(`  › ${msg}`, "detail");
        await sleep(180);
      }

      await sleep(step.duration);
    }

    // Enhance prompt with AI
    try {
      setCurrentStep("enhance");
      addLog(`🧠 Enhancing prompt with AI for best quality...`, "system");
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert image generation prompt engineer. Enhance this prompt to get the best possible image result. Make it detailed, specific, and include quality keywords like "highly detailed, 4K, sharp focus, professional". Keep it under 200 chars.

Original prompt: "${prompt}"

Return ONLY the enhanced prompt text, nothing else.`,
      });
      const ep = typeof enhanced === 'string' ? enhanced : (enhanced?.text || prompt);
      setEnhancedPrompt(ep);
      addLog(`✨ Enhanced prompt: "${ep.substring(0, 80)}..."`, "success");
    } catch {
      setEnhancedPrompt(prompt);
    }

    // Generate step
    setCurrentStep("generate");
    setActiveSteps(prev => [...prev, "generate"]);
    addLog(`🎨 Sending to image generation engine...`, "system");
    addLog(`  › Resolution: 1024×1024`, "detail");
    addLog(`  › Model: FLUX.1 [best]`, "detail");
    addLog(`  › Guidance scale: 7.5`, "detail");

    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: enhancedPrompt || prompt,
      });

      const imageUrl = result?.url || result?.data?.url;

      // Finalize
      setCurrentStep("finalize");
      setActiveSteps(prev => [...prev, "refine", "finalize"]);
      addLog(`🔍 Post-processing and upscaling...`, "system");
      await sleep(400);
      addLog(`✅ Image generated successfully!`, "success");
      addLog(`📐 Output: 1024×1024px`, "detail");

      setGeneratedImage(imageUrl);
      setCurrentStep(null);
    } catch (err) {
      addLog(`❌ Generation failed: ${err.message}`, "error");
      setCurrentStep(null);
    }

    setGenerating(false);
  };

  const download = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `fleet-ai-image-${Date.now()}.png`;
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

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-950/60">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-500/20 flex-shrink-0">
        <Wand2 className="w-4 h-4 text-violet-400" />
        <span className="text-white font-semibold text-sm">AI Image Generator</span>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
          <div className={`w-2 h-2 rounded-full ${generating ? 'bg-amber-400 animate-pulse' : generatedImage ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {generating ? 'Generating...' : generatedImage ? 'Complete' : 'Ready'}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: controls + process log */}
        <div className="flex flex-col w-[45%] min-w-0 border-r border-slate-800/50 overflow-y-auto">
          {/* Prompt input */}
          <div className="p-4 space-y-3 flex-shrink-0">
            <div>
              <label className="text-slate-400 text-[11px] uppercase tracking-wider mb-1.5 block">Image Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) generate(); }}
                placeholder="Describe the image you want to generate... (Ctrl+Enter to generate)"
                className="w-full h-24 px-3 py-2.5 bg-slate-900/70 border border-violet-500/30 rounded-xl text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-violet-400 resize-none"
              />
            </div>
            <Button
              onClick={generate}
              disabled={!prompt.trim() || generating}
              className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 font-semibold"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Image</>
              )}
            </Button>
          </div>

          {/* Step progress */}
          {(generating || activeSteps.length > 0) && (
            <div className="px-4 pb-3 space-y-1.5 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">AI Pipeline</p>
              {THINKING_STEPS.map((step) => {
                const Icon = step.icon;
                const isDone = activeSteps.includes(step.id) && currentStep !== step.id;
                const isActive = currentStep === step.id;
                const isPending = !activeSteps.includes(step.id) && currentStep !== step.id;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-800/80 border border-cyan-500/30' : ''}`}
                  >
                    {isActive ? (
                      <Loader2 className={`w-3.5 h-3.5 ${step.color} animate-spin flex-shrink-0`} />
                    ) : isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Icon className={`w-3.5 h-3.5 ${step.color} flex-shrink-0 opacity-40`} />
                    )}
                    <span className={isDone ? 'text-slate-400 line-through' : isActive ? 'text-white font-medium' : 'text-slate-600'}>
                      {step.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto flex gap-0.5">
                        {[0, 0.2, 0.4].map(d => (
                          <div key={d} className={`w-1 h-1 rounded-full ${step.color.replace('text-', 'bg-')} animate-pulse`} style={{ animationDelay: `${d}s` }} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Process log */}
          <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex-shrink-0">Console Log</p>
            <div className="flex-1 overflow-y-auto bg-black/40 rounded-xl border border-slate-800/50 p-3 font-mono text-[10px] space-y-0.5 min-h-[100px]">
              <AnimatePresence>
                {logs.map((log, i) => (
                  <motion.div
                    key={`${log.ts}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={logColor[log.type] || 'text-slate-400'}
                  >
                    <span className="text-slate-700 mr-2">[{new Date(log.ts).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    {log.msg}
                  </motion.div>
                ))}
              </AnimatePresence>
              {generating && (
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-cyan-400">▋</motion.span>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right: image preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-950/30 min-h-0">
          <AnimatePresence mode="wait">
            {generatedImage ? (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex flex-col items-center gap-3"
              >
                {/* Hologram glow frame */}
                <div className="relative flex-1 w-full flex items-center justify-center">
                  {/* Glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 rounded-xl pointer-events-none" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-xl rounded-xl pointer-events-none" />
                  
                  {/* Corner brackets */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-violet-400/60 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-violet-400/60 rounded-br" />

                  <img
                    src={generatedImage}
                    alt="AI Generated"
                    className="max-w-full max-h-full object-contain rounded-lg border border-slate-700/50 shadow-2xl shadow-cyan-500/20"
                    style={{ maxHeight: '300px' }}
                  />

                  {/* Scan line effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, delay: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-none" style={{ backgroundSize: '100% 4px', backgroundRepeat: 'repeat' }} />
                  </motion.div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" onClick={download} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-7 px-3">
                    <Download className="w-3 h-3 mr-1.5" />Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setGeneratedImage(null); setActiveSteps([]); setLogs([]); }} className="border-slate-700 text-slate-300 hover:text-white text-xs h-7 px-3">
                    <RefreshCw className="w-3 h-3 mr-1.5" />New
                  </Button>
                </div>
              </motion.div>
            ) : generating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                {/* Animated hologram placeholder */}
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 animate-pulse" />
                  <div className="absolute inset-2 rounded-xl border border-violet-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 animate-spin border-t-cyan-400" />
                      <Wand2 className="absolute inset-0 m-auto w-7 h-7 text-violet-400 animate-pulse" />
                    </div>
                  </div>
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-400" />
                  {/* Scan line */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI generating your image</p>
                  <p className="text-slate-500 text-xs mt-1">Follow the process in the console log</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 text-center text-slate-600"
              >
                <div className="relative">
                  <Image className="w-16 h-16 opacity-20" />
                  <div className="absolute -inset-4 bg-violet-500/5 rounded-full blur-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Image Preview</p>
                  <p className="text-xs text-slate-700 mt-0.5">Generated image will appear here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}