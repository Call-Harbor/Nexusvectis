import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  X, Plus, Trash2, Link, FileText, Loader2, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Sparkles, Save, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

const EMOJI_SUGGESTIONS = ["🤖","🧠","⚡","🎯","🔮","🛡️","📊","💡","🔬","🏆","🌐","🔧","💎","🚀","⚙️","🎨","🔍","📈","💰","🌍","🗺️","🤝","📋","✅","🎓"];
const COLOR_OPTIONS = ["#06b6d4","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899","#a78bfa","#22c55e","#3b82f6","#f97316"];

export default function CustomWorkerBuilder({ onClose, onWorkerCreated, editingWorker = null }) {
  const [name, setName] = useState(editingWorker?.name || "");
  const [emoji, setEmoji] = useState(editingWorker?.emoji || "🤖");
  const [color, setColor] = useState(editingWorker?.color || "#06b6d4");
  const [specialty, setSpecialty] = useState(editingWorker?.specialty || "");
  const [systemPrompt, setSystemPrompt] = useState(editingWorker?.system_prompt || "");
  const [sources, setSources] = useState(editingWorker?.training_sources || []);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedSource, setExpandedSource] = useState(null);
  const fileInputRef = useRef(null);

  const quickExtract = async (idx, source) => {
    setSources(prev => prev.map((s, i) => i === idx ? { ...s, status: "extracting" } : s));
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: source.type === "url"
        ? `Give a short, natural text summary (3-5 sentences) of what this page/source is about and what key information it contains: ${source.source}`
        : `Give a short, natural text summary (3-5 sentences) of what this file contains and what the most important information is.`,
        add_context_from_internet: source.type === "url",
        file_urls: source.type === "file" ? [source.source] : undefined,
        model: "gemini_3_flash"
      });
      setSources(prev => prev.map((s, i) => i === idx ? { ...s, status: "done", extracted_content: typeof result === "string" ? result : JSON.stringify(result) } : s));
    } catch {
      setSources(prev => prev.map((s, i) => i === idx ? { ...s, status: "done", extracted_content: "Could not fetch info automatically." } : s));
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http")) { toast.error("Enter a valid URL starting with http"); return; }
    const newSource = { type: "url", label: url, source: url, status: "extracting", extracted_content: "" };
    setSources(prev => {
      const idx = prev.length;
      setTimeout(() => quickExtract(idx, newSource), 0);
      return [...prev, newSource];
    });
    setUrlInput("");
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const newSource = { type: "file", label: file.name, source: file_url, status: "extracting", extracted_content: "" };
        setSources(prev => {
          const idx = prev.length;
          setTimeout(() => quickExtract(idx, newSource), 0);
          return [...prev, newSource];
        });
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    e.target.value = "";
  };

  const removeSource = (idx) => setSources(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        name: name.trim(),
        emoji,
        color,
        specialty: specialty.trim() || "Custom AI Worker",
        system_prompt: systemPrompt.trim(),
        training_sources: sources,
        created_by: user.email,
      };
      let saved;
      if (editingWorker?.id) {
        saved = await base44.entities.CustomAIWorker.update(editingWorker.id, payload);
      } else {
        saved = await base44.entities.CustomAIWorker.create(payload);
      }
      toast.success(`Worker "${name}" ${editingWorker ? "updated" : "created"}!`);
      onWorkerCreated(saved);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
    setSaving(false);
  };

  const statusIcon = (status) => {
    if (status === "extracting") return <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />;
    if (status === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    return <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-[20px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-[680px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "rgba(5,8,22,0.99)", border: "1px solid rgba(6,182,212,0.3)", boxShadow: "0 0 60px rgba(6,182,212,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(6,182,212,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
              {emoji}
            </div>
            <div>
              <h2 className="text-sm font-black font-mono tracking-widest uppercase" style={{ color: "#06b6d4" }}>
                {editingWorker ? "Edit Custom Worker" : "Create Custom AI Worker"}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">Train with URLs & files · Add to worker pool</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400" style={{ color: "#64748b" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Identity */}
          <div className="space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Identity</p>
            <div className="flex gap-3">
              {/* Emoji picker */}
              <div className="flex-shrink-0">
                <p className="text-[9px] text-slate-500 mb-1.5">Icon</p>
                <div className="flex flex-wrap gap-1.5 w-44">
                  {EMOJI_SUGGESTIONS.map(e => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
                      style={{ background: emoji === e ? `${color}25` : "rgba(15,23,42,0.6)", border: emoji === e ? `1px solid ${color}` : "1px solid rgba(100,116,139,0.2)" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + color + specialty */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[9px] text-slate-500 mb-1.5">Worker Name</p>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Supply Chain Expert"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/80 border text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-400"
                    style={{ borderColor: "rgba(100,116,139,0.3)" }} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-1.5">Specialty Tag</p>
                  <input value={specialty} onChange={e => setSpecialty(e.target.value)}
                    placeholder="e.g. Supply chain optimization, procurement, vendor management"
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/80 border text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-400"
                    style={{ borderColor: "rgba(100,116,139,0.3)" }} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 mb-1.5">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{ background: c, boxShadow: color === c ? `0 0 10px ${c}` : "none", transform: color === c ? "scale(1.2)" : "scale(1)", border: color === c ? "2px solid white" : "2px solid transparent" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">System Prompt / Instructions</p>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are an expert in supply chain management. Your role is to analyze procurement data, identify bottlenecks, suggest vendor alternatives, and optimize inventory levels. Always respond in a professional tone with actionable insights..."
              className="w-full px-4 py-3 rounded-xl text-xs bg-slate-900/80 border text-white placeholder-slate-600 outline-none resize-none transition-all focus:border-cyan-400 leading-relaxed font-light"
              style={{ borderColor: "rgba(100,116,139,0.3)", minHeight: 100 }} />
          </div>

          {/* Training Sources */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">Training Sources</p>

            {/* URL input */}
            <div className="flex gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border bg-slate-900/80"
                style={{ borderColor: "rgba(100,116,139,0.3)" }}>
                <Link className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addUrl(); }}
                  placeholder="https://example.com/docs/..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none" />
              </div>
              <button onClick={addUrl}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all"
                style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
                Add URL
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all"
                style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                + File
              </button>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.csv,.xlsx,.xls,.docx,.txt,.json,.md" className="hidden" onChange={handleFileUpload} />
            </div>

            {/* Source list */}
            <div className="space-y-2">
              {sources.length === 0 && (
                <div className="py-4 text-center text-[11px] text-slate-600 rounded-xl border border-dashed" style={{ borderColor: "rgba(100,116,139,0.2)" }}>
                  Add URLs or files to train this worker with domain knowledge
                </div>
              )}
              {sources.map((src, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${src.status === "done" ? "rgba(16,185,129,0.25)" : src.status === "error" ? "rgba(239,68,68,0.25)" : "rgba(100,116,139,0.2)"}` }}>

                  {/* Source header */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-shrink-0">
                      {src.type === "url" ? <Link className="w-3.5 h-3.5 text-cyan-500" /> : <FileText className="w-3.5 h-3.5 text-violet-400" />}
                    </div>
                    <span className="flex-1 text-[11px] text-slate-300 font-mono truncate">{src.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusIcon(src.status)}

                      {(src.extracted_content || src.status === "extracting") && (
                        <button onClick={() => setExpandedSource(expandedSource === idx ? null : idx)}
                          className="p-1 rounded hover:bg-slate-700 transition-all"
                          style={{ color: "#64748b" }}>
                          {expandedSource === idx ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button onClick={() => removeSource(idx)} className="p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-all" style={{ color: "#64748b" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Source preview */}
                  <AnimatePresence>
                    {expandedSource === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t overflow-hidden"
                        style={{ borderColor: "rgba(6,182,212,0.15)" }}
                      >
                        <div className="px-3 py-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                          {src.status === "extracting" ? (
                            <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Fetching info...
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-300 leading-relaxed">{src.extracted_content || "No info available."}</p>
                          )}
                          {src.type === "url" && (
                            <a href={src.source} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-500 hover:underline mt-2 inline-block">Open source ↗</a>
                          )}
                          {src.type === "file" && src.source && (
                            <a href={src.source} target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-400 hover:underline mt-2 inline-block">Open file ↗</a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span style={{ color }}>{emoji}</span>
            <span>{name || "Unnamed Worker"}</span>
            {sources.filter(s => s.status === "done").length > 0 && (
              <span className="px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                {sources.filter(s => s.status === "done").length} sources trained
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono transition-all"
              style={{ color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }}>
              Cancel
            </button>
            <motion.button onClick={handleSave} disabled={saving}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(139,92,246,0.2))", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.4)", boxShadow: "0 0 20px rgba(6,182,212,0.15)" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : editingWorker ? "Update Worker" : "Create Worker"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}