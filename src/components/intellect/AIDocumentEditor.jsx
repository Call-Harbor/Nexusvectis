import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import {
  Download, Share2, Sparkles, Loader2, X, Cloud, Check,
  FileText, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Image, Link, Undo2, Redo2,
  Type, ChevronDown, Minus, Plus, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FONTS = ['Default', 'Arial', 'Georgia', 'Courier New', 'Verdana', 'Times New Roman'];
const SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
const HEADING_OPTIONS = [
  { label: 'Normal text', value: false },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
  { label: 'Heading 4', value: 4 },
];

const modules = {
  toolbar: false,
  history: { delay: 1000, maxStack: 100, userOnly: true },
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block', 'list', 'bullet', 'indent',
  'link', 'align', 'size', 'color', 'background', 'font'
];

function ToolbarBtn({ onClick, active, children, title, className = '' }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick?.(e); }}
      title={title}
      className={`h-7 px-1.5 rounded text-sm flex items-center justify-center transition-all
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        ${className}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 flex-shrink-0" />;
}

function DropSelect({ value, options, onChange, width = 'w-28' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(v => !v); }}
        className="w-full h-7 flex items-center justify-between gap-1 px-2 rounded text-xs text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
      >
        <span className="truncate">{options.find(o => o.value === value)?.label || value || options[0]?.label}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[140px] max-h-48 overflow-y-auto"
          >
            {options.map(opt => (
              <button key={opt.value} onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors ${value === opt.value ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
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

export default function AIDocumentEditor() {
  const [content, setContent] = useState(`<h1>Document Title</h1><p>Start typing your document here...</p>`);
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showWordCount, setShowWordCount] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedFmt, setSelectedFmt] = useState({ heading: false, bold: false, italic: false, underline: false });
  const quillRef = useRef(null);
  const autoSaveRef = useRef(null);

  // Update word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
  }, [content]);

  // Auto-save debounce
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(saveDocument, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [content, documentTitle]);

  const saveDocument = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const blob = new Blob([`<!DOCTYPE html><html><head><title>${documentTitle}</title></head><body>${content}</body></html>`], { type: "text/html" });
      const file = new File([blob], `${documentTitle.replace(/[^a-z0-9]/gi, "_")}.html`, { type: "text/html" });
      await base44.integrations.Core.UploadFile({ file });
      setLastSaved(new Date());
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAISuggestions = async () => {
    setAiLoading(true);
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
      setShowAISuggestions(true);
    } catch {
      toast.error("AI review failed");
    } finally {
      setAiLoading(false);
    }
  };

  const downloadDocument = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><title>${documentTitle}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}h1,h2,h3{margin-top:1.5em}</style></head><body>${content}</body></html>`], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${documentTitle}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const quillFormat = (format, value) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    editor.format(format, value);
  };

  const CATEGORY_COLORS = {
    clarity: 'bg-blue-50 border-blue-200 text-blue-700',
    structure: 'bg-violet-50 border-violet-200 text-violet-700',
    tone: 'bg-amber-50 border-amber-200 text-amber-700',
    completeness: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  return (
    <div className={`flex flex-col h-full bg-[#f8f9fa] transition-all ${isFocusMode ? 'bg-white' : ''}`}>

      {/* ── Title bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-base font-medium bg-transparent border-0 text-gray-800 outline-none hover:bg-gray-100 focus:bg-gray-100 rounded px-2 py-0.5 transition-all min-w-0 w-52"
              placeholder="Untitled document"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {isSaving && <span className="flex items-center gap-1 text-xs text-gray-500"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
            {lastSaved && !isSaving && <span className="flex items-center gap-1 text-xs text-gray-500"><Cloud className="w-3 h-3 text-gray-400" />Saved</span>}
            <button onClick={() => setIsFocusMode(v => !v)} title="Focus mode"
              className="h-7 px-2 rounded text-xs text-gray-500 hover:bg-gray-100 flex items-center gap-1">
              {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <Button size="sm" onClick={saveDocument} variant="ghost" className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100">
              <Cloud className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" onClick={downloadDocument} variant="ghost" className="h-7 px-2 text-xs text-gray-600 hover:bg-gray-100">
              <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={generateAISuggestions} disabled={aiLoading}
              className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              AI Review
            </Button>
          </div>
        </div>
      </div>

      {/* ── Formatting Toolbar ── */}
      {!isFocusMode && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-0.5 flex-wrap">
          {/* Undo / Redo */}
          <ToolbarBtn title="Undo (Ctrl+Z)" onClick={() => quillRef.current?.getEditor()?.history.undo()}>
            <Undo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Redo" onClick={() => quillRef.current?.getEditor()?.history.redo()}>
            <Redo2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />

          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <ToolbarBtn onClick={() => setZoom(z => Math.max(50, z - 10))}><Minus className="w-3 h-3" /></ToolbarBtn>
            <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
            <ToolbarBtn onClick={() => setZoom(z => Math.min(200, z + 10))}><Plus className="w-3 h-3" /></ToolbarBtn>
          </div>
          <Divider />

          {/* Heading style */}
          <DropSelect
            value={selectedFmt.heading}
            options={HEADING_OPTIONS}
            onChange={v => { quillFormat('header', v); setSelectedFmt(f => ({ ...f, heading: v })); }}
            width="w-32"
          />
          <Divider />

          {/* Bold / Italic / Underline / Strike */}
          <ToolbarBtn title="Bold (Ctrl+B)" active={selectedFmt.bold} onClick={() => { quillFormat('bold', !selectedFmt.bold); setSelectedFmt(f => ({ ...f, bold: !f.bold })); }}>
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Italic (Ctrl+I)" active={selectedFmt.italic} onClick={() => { quillFormat('italic', !selectedFmt.italic); setSelectedFmt(f => ({ ...f, italic: !f.italic })); }}>
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn title="Underline (Ctrl+U)" active={selectedFmt.underline} onClick={() => { quillFormat('underline', !selectedFmt.underline); setSelectedFmt(f => ({ ...f, underline: !f.underline })); }}>
            <Underline className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <Divider />

          {/* Alignment */}
          <ToolbarBtn title="Align left" onClick={() => quillFormat('align', false)}><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align center" onClick={() => quillFormat('align', 'center')}><AlignCenter className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Align right" onClick={() => quillFormat('align', 'right')}><AlignRight className="w-3.5 h-3.5" /></ToolbarBtn>
          <Divider />

          {/* Lists */}
          <ToolbarBtn title="Bullet list" onClick={() => quillFormat('list', 'bullet')}><List className="w-3.5 h-3.5" /></ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => quillFormat('list', 'ordered')}><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
          <Divider />

          {/* Link */}
          <ToolbarBtn title="Insert link" onClick={() => {
            const url = prompt('URL:');
            if (url) quillFormat('link', url);
          }}><Link className="w-3.5 h-3.5" /></ToolbarBtn>
        </div>
      )}

      {/* ── Page Area ── */}
      <div className="flex-1 overflow-auto py-6 px-4" style={{ background: isFocusMode ? '#fff' : '#f0f0f0' }}>
        <div
          className="bg-white shadow-lg mx-auto rounded-sm"
          style={{
            width: `${Math.min(100, zoom)}%`,
            maxWidth: `${(850 * zoom) / 100}px`,
            minHeight: '1100px',
            transform: zoom > 100 ? `scale(${zoom / 100})` : 'none',
            transformOrigin: 'top center',
            padding: '72px 88px',
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Start typing…"
            className="doc-editor"
          />
        </div>
      </div>

      {/* ── AI Suggestions Panel ── */}
      <AnimatePresence>
        {showAISuggestions && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="flex-shrink-0 border-t border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">AI Writing Review</p>
              </div>
              <button onClick={() => setShowAISuggestions(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {aiSuggestions.map((s, i) => {
                const cat = s.category?.toLowerCase() || 'clarity';
                const colorClass = CATEGORY_COLORS[cat] || 'bg-gray-50 border-gray-200 text-gray-700';
                return (
                  <div key={i} className={`p-3 rounded-lg border text-xs leading-relaxed ${colorClass}`}>
                    <p className="font-bold uppercase text-[10px] tracking-wide mb-1 opacity-70">{s.category}</p>
                    <p>{s.suggestion}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-1 flex items-center justify-between text-[11px] text-gray-400">
        <span>{wordCount} words</span>
        <div className="flex items-center gap-3">
          <span>{zoom}% zoom</span>
          {lastSaved && <span>Last saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>

      <style>{`
        .doc-editor .ql-toolbar { display: none; }
        .doc-editor .ql-container { border: none !important; font-family: 'Georgia', serif; font-size: 13px; color: #1a1a1a; }
        .doc-editor .ql-editor { padding: 0; min-height: 900px; line-height: 1.8; }
        .doc-editor .ql-editor h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; color: #111; }
        .doc-editor .ql-editor h2 { font-size: 1.5em; font-weight: 600; margin: 0.75em 0 0.4em; color: #222; }
        .doc-editor .ql-editor h3 { font-size: 1.25em; font-weight: 600; margin: 0.75em 0 0.4em; color: #333; }
        .doc-editor .ql-editor p { margin: 0.4em 0; }
        .doc-editor .ql-editor blockquote { border-left: 3px solid #ddd; padding-left: 1em; color: #666; font-style: italic; margin: 1em 0; }
        .doc-editor .ql-editor pre { background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; }
        .doc-editor .ql-editor ul, .doc-editor .ql-editor ol { padding-left: 1.5em; }
        .doc-editor .ql-editor.ql-blank::before { color: #bbb; font-style: normal; }
      `}</style>
    </div>
  );
}