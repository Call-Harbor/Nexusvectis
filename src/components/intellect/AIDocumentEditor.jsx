import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import {
  Download, Sparkles, Loader2, X, Cloud,
  FileText, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Link, Undo2, Redo2,
  ChevronDown, Minus, Plus, Wand2, Brain, CheckCircle, Zap, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const modules = {
  toolbar: false,
  history: { delay: 1000, maxStack: 100, userOnly: true },
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block', 'list', 'bullet', 'indent',
  'link', 'align', 'size', 'color', 'background', 'font'
];

const HEADING_OPTIONS = [
  { label: 'Normal text', value: false },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
];

const AI_STEPS = [
  { id: "read", label: "Reading document", icon: BookOpen, color: "text-cyan-400" },
  { id: "analyze", label: "Analyzing structure", icon: Brain, color: "text-violet-400" },
  { id: "review", label: "Generating suggestions", icon: Sparkles, color: "text-pink-400" },
  { id: "finalize", label: "Finalizing review", icon: CheckCircle, color: "text-emerald-400" },
];

const CATEGORY_COLORS = {
  clarity:      { border: 'border-cyan-500/40',    bg: 'bg-cyan-500/10',    text: 'text-cyan-300',    dot: 'bg-cyan-400' },
  structure:    { border: 'border-violet-500/40',  bg: 'bg-violet-500/10',  text: 'text-violet-300',  dot: 'bg-violet-400' },
  tone:         { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   dot: 'bg-amber-400' },
  completeness: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-300', dot: 'bg-emerald-400' },
};

function TBtn({ onClick, active, children, title }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick?.(e); }}
      title={title}
      className={`h-6 px-1.5 rounded text-xs flex items-center justify-center transition-all
        ${active
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
          : 'text-slate-400 hover:bg-slate-700/60 hover:text-white border border-transparent'}`}
    >
      {children}
    </button>
  );
}

function TDivider() {
  return <div className="w-px h-4 bg-slate-700/60 mx-0.5 flex-shrink-0" />;
}

function HeadingDrop({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = HEADING_OPTIONS.find(o => o.value === value) || HEADING_OPTIONS[0];
  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className="h-6 px-2 flex items-center gap-1 rounded text-xs text-slate-400 hover:bg-slate-700/60 hover:text-white border border-transparent hover:border-slate-600/50 transition-all"
      >
        <span className="w-20 truncate text-left">{current.label}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-slate-500" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-8 left-0 z-50 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 py-1 min-w-[140px]"
          >
            {HEADING_OPTIONS.map(opt => (
              <button key={String(opt.value)} onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                  ${value === opt.value ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIDocumentEditor({ initialContent, initialTitle, initialFileUrl, orgId }) {
  const [content, setContent] = useState(initialContent || `<h1>Document Title</h1><p>Start typing your document here...</p>`);
  const [documentTitle, setDocumentTitle] = useState(initialTitle?.replace(/\.[^.]+$/, '') || "Untitled Document");

  // Load from URL if provided
  useEffect(() => {
    if (!initialFileUrl) return;
    fetch(initialFileUrl).then(r => r.text()).then(text => {
      setContent(text);
    }).catch(() => {});
  }, [initialFileUrl]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState(null);
  const [aiDoneSteps, setAiDoneSteps] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selectedFmt, setSelectedFmt] = useState({ heading: false, bold: false, italic: false, underline: false });
  const quillRef = useRef(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
  }, [content]);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(saveDocument, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [content, documentTitle]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const saveDocument = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const htmlContent = `<!DOCTYPE html><html><head><title>${documentTitle}</title></head><body>${content}</body></html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      const fileName = `${documentTitle.replace(/[^a-z0-9\s]/gi, "").trim() || "Untitled"}.html`;
      const file = new File([blob], fileName, { type: "text/html" });
      const res = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = res?.data?.file_url || res?.file_url;
      if (fileUrl && orgId) {
        await base44.entities.FleetDriveFile.create({
          organization_id: orgId,
          name: fileName,
          file_url: fileUrl,
          file_type: "document",
          file_size_bytes: blob.size,
          mime_type: "text/html",
          folder: "Documents",
          source: "document_editor",
          description: `FleetDocs document`,
          tags: ["fleetdocs", "document"],
        });
        toast.success("Saved to Fleet Drive → Documents");
      }
      setLastSaved(new Date());
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAI = async () => {
    setAiLoading(true);
    setAiDoneSteps([]);
    setAiStep(null);
    setAiSuggestions([]);
    setShowAI(true);

    for (let i = 0; i < AI_STEPS.length - 1; i++) {
      setAiStep(AI_STEPS[i].id);
      await sleep(600 + i * 200);
      setAiDoneSteps(prev => [...prev, AI_STEPS[i].id]);
    }
    setAiStep('finalize');

    try {
      const plainText = content.replace(/<[^>]*>/g, '').substring(0, 800);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert writing assistant. Review this document and provide 4 specific, actionable improvement suggestions covering: clarity, structure, tone, and completeness. Document: "${plainText}"`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            }
          }
        }
      });
      setAiSuggestions(result?.suggestions || []);
      setAiDoneSteps(prev => [...prev, 'finalize']);
    } catch {
      toast.error("AI review failed");
    } finally {
      setAiLoading(false);
      setAiStep(null);
    }
  };

  const downloadDocument = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><title>${documentTitle}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}</style></head><body>${content}</body></html>`], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${documentTitle}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const qFmt = (format, value) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    editor.format(format, value);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80" style={{ fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-cyan-500/15 bg-slate-900/70 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase mr-1">FleetDocs</span>
        <input
          type="text"
          value={documentTitle}
          onChange={e => setDocumentTitle(e.target.value)}
          className="bg-transparent border-0 text-white text-sm font-semibold outline-none placeholder:text-slate-600 w-44 hover:bg-slate-800/40 focus:bg-slate-800/40 rounded px-1.5 py-0.5 transition-all"
          placeholder="Untitled document"
        />

        {/* Status dot */}
        <div className="flex items-center gap-1.5 ml-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-pulse' : lastSaved ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <span className="text-[10px] text-slate-500">{isSaving ? 'Saving…' : lastSaved ? 'Saved' : 'Unsaved'}</span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={saveDocument} className="h-6 px-2.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/40 transition-all flex items-center gap-1.5">
            <Cloud className="w-3 h-3" />Save
          </button>
          <button onClick={downloadDocument} className="h-6 px-2.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 border border-transparent hover:border-slate-600/40 transition-all flex items-center gap-1.5">
            <Download className="w-3 h-3" />Export
          </button>
          <button
            onClick={generateAI}
            disabled={aiLoading}
            className="h-6 px-3 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            AI Review
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 bg-slate-900/50 border-b border-slate-800/60 px-3 py-1 flex items-center gap-0.5 flex-wrap">
        <TBtn title="Undo" onClick={() => quillRef.current?.getEditor()?.history.undo()}><Undo2 className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Redo" onClick={() => quillRef.current?.getEditor()?.history.redo()}><Redo2 className="w-3.5 h-3.5" /></TBtn>
        <TDivider />

        <div className="flex items-center gap-0.5">
          <TBtn onClick={() => setZoom(z => Math.max(50, z - 10))}><Minus className="w-3 h-3" /></TBtn>
          <span className="text-[10px] text-slate-500 w-9 text-center font-mono">{zoom}%</span>
          <TBtn onClick={() => setZoom(z => Math.min(200, z + 10))}><Plus className="w-3 h-3" /></TBtn>
        </div>
        <TDivider />

        <HeadingDrop value={selectedFmt.heading} onChange={v => { qFmt('header', v); setSelectedFmt(f => ({ ...f, heading: v })); }} />
        <TDivider />

        <TBtn title="Bold" active={selectedFmt.bold} onClick={() => { qFmt('bold', !selectedFmt.bold); setSelectedFmt(f => ({ ...f, bold: !f.bold })); }}><Bold className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Italic" active={selectedFmt.italic} onClick={() => { qFmt('italic', !selectedFmt.italic); setSelectedFmt(f => ({ ...f, italic: !f.italic })); }}><Italic className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Underline" active={selectedFmt.underline} onClick={() => { qFmt('underline', !selectedFmt.underline); setSelectedFmt(f => ({ ...f, underline: !f.underline })); }}><Underline className="w-3.5 h-3.5" /></TBtn>
        <TDivider />

        <TBtn title="Align left" onClick={() => qFmt('align', false)}><AlignLeft className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Align center" onClick={() => qFmt('align', 'center')}><AlignCenter className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Align right" onClick={() => qFmt('align', 'right')}><AlignRight className="w-3.5 h-3.5" /></TBtn>
        <TDivider />

        <TBtn title="Bullet list" onClick={() => qFmt('list', 'bullet')}><List className="w-3.5 h-3.5" /></TBtn>
        <TBtn title="Numbered list" onClick={() => qFmt('list', 'ordered')}><ListOrdered className="w-3.5 h-3.5" /></TBtn>
        <TDivider />

        <TBtn title="Insert link" onClick={() => { const url = prompt('URL:'); if (url) qFmt('link', url); }}><Link className="w-3.5 h-3.5" /></TBtn>
      </div>

      {/* ── Main area: page + AI panel ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Document page */}
        <div className="flex-1 overflow-auto py-8 px-6 relative" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.04) 0%, transparent 60%), #0a0f1a' }}>
          {/* Ambient glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-b from-cyan-500/6 to-transparent blur-3xl" />

          <div
            className="relative mx-auto bg-white rounded-sm shadow-2xl shadow-black/60 overflow-hidden"
            style={{
              width: `${Math.min(100, zoom)}%`,
              maxWidth: `${(750 * zoom) / 100}px`,
              minHeight: '1050px',
              transform: zoom > 100 ? `scale(${zoom / 100})` : 'none',
              transformOrigin: 'top center',
            }}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-transparent" />

            <div style={{ padding: '64px 80px' }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Start typing…"
                className="doc-editor-neo"
              />
            </div>
          </div>

          {/* Corner brackets around page */}
          <div className="pointer-events-none absolute top-4 left-4 w-6 h-6 border-t border-l border-cyan-500/20" />
          <div className="pointer-events-none absolute top-4 right-4 w-6 h-6 border-t border-r border-cyan-500/20" />
          <div className="pointer-events-none absolute bottom-4 left-4 w-6 h-6 border-b border-l border-violet-500/20" />
          <div className="pointer-events-none absolute bottom-4 right-4 w-6 h-6 border-b border-r border-violet-500/20" />
        </div>

        {/* AI Review Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-shrink-0 flex flex-col border-l border-violet-500/20 bg-slate-900/80 overflow-hidden"
              style={{ minWidth: 0 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-white">AI Review</span>
                </div>
                <button onClick={() => setShowAI(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AI pipeline steps */}
              <div className="px-4 py-3 space-y-2 border-b border-slate-800/40 flex-shrink-0">
                {AI_STEPS.map(step => {
                  const Icon = step.icon;
                  const isDone = aiDoneSteps.includes(step.id);
                  const isActive = aiStep === step.id;
                  return (
                    <motion.div key={step.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: isActive || isDone ? 1 : 0.3, x: 0 }}
                      className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-all ${isActive ? 'bg-slate-800/80 border border-cyan-500/20' : ''}`}
                    >
                      {isActive ? <Loader2 className={`w-3.5 h-3.5 ${step.color} animate-spin flex-shrink-0`} />
                        : isDone ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        : <Icon className={`w-3.5 h-3.5 ${step.color} flex-shrink-0 opacity-30`} />}
                      <span className={isDone ? 'text-slate-500 line-through' : isActive ? 'text-white font-medium' : 'text-slate-600'}>{step.label}</span>
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

              {/* Suggestions */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence>
                  {aiSuggestions.map((s, i) => {
                    const cat = s.category?.toLowerCase() || 'clarity';
                    const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS.clarity;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-xl border ${c.border} ${c.bg}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${c.text}`}>{s.category}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{s.suggestion}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {!aiLoading && aiSuggestions.length === 0 && aiDoneSteps.length === 0 && (
                  <div className="text-center text-slate-600 text-xs py-8">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Review results will appear here
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 bg-slate-900/70 border-t border-slate-800/60 px-4 py-1 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{content.replace(/<[^>]*>/g, '').length} chars</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{zoom}% zoom</span>
          {lastSaved && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>

      <style>{`
        .doc-editor-neo .ql-toolbar { display: none; }
        .doc-editor-neo .ql-container { border: none !important; font-family: 'Georgia', serif; font-size: 13.5px; color: #1a1a1a; }
        .doc-editor-neo .ql-editor { padding: 0; min-height: 900px; line-height: 1.85; }
        .doc-editor-neo .ql-editor h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0 0.4em; color: #111; letter-spacing: -0.02em; }
        .doc-editor-neo .ql-editor h2 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.4em; color: #222; }
        .doc-editor-neo .ql-editor h3 { font-size: 1.2em; font-weight: 600; margin: 0.8em 0 0.3em; color: #333; }
        .doc-editor-neo .ql-editor p { margin: 0.5em 0; }
        .doc-editor-neo .ql-editor blockquote { border-left: 3px solid #c7d2fe; padding-left: 1em; color: #555; font-style: italic; margin: 1em 0; }
        .doc-editor-neo .ql-editor pre { background: #f5f5f5; border-radius: 6px; padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; }
        .doc-editor-neo .ql-editor ul, .doc-editor-neo .ql-editor ol { padding-left: 1.5em; }
        .doc-editor-neo .ql-editor.ql-blank::before { color: #ccc; font-style: normal; }
      `}</style>
    </div>
  );
}