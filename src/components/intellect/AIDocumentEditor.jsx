import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import {
  Save, Download, Share2, FileText, Clock, User, Sparkles,
  Bold, Italic, Underline, List, Loader2, X, Cloud, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AIDocumentEditor() {
  const [content, setContent] = useState("<h1>Document Title</h1><p>Start typing...</p>");
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const quillRef = useRef(null);

  useEffect(() => {
    const autoSave = setTimeout(() => {
      saveDocument();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSave);
  }, [content, documentTitle]);

  const saveDocument = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Create a simple text version for file upload
      const plainText = content.replace(/<[^>]*>/g, "").substring(0, 1000);
      
      const blob = new Blob(
        [
          `${documentTitle}\n\n${plainText}`
        ],
        { type: "text/plain" }
      );
      
      const file = new File(
        [blob],
        `${documentTitle.replace(/[^a-z0-9]/gi, "_")}.txt`,
        { type: "text/plain" }
      );

      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      if (uploadResponse?.data?.file_url || uploadResponse?.file_url) {
        setLastSaved(new Date());
        toast.success("📄 Document saved to Nexus Cloud");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAISuggestions = async () => {
    try {
      const plainText = content.replace(/<[^>]*>/g, "").substring(0, 500);
      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `Review this document excerpt and provide 3 brief improvement suggestions:

"${plainText}"

Provide JSON response with suggestions array.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAiSuggestions(suggestions?.suggestions || []);
      setShowAISuggestions(true);
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
  };

  const downloadDocument = () => {
    const element = document.createElement("a");
    const blob = new Blob([content], { type: "text/html" });
    element.href = URL.createObjectURL(blob);
    element.download = `${documentTitle}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("📥 Document downloaded");
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"]
    ]
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="space-y-3">
          {/* Title Input */}
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-transparent hover:border-cyan-500/50 focus:border-cyan-500 text-white outline-none transition-colors"
            placeholder="Document Title"
          />

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Nexus Cloud</span>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="p-6 prose prose-invert max-w-none">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Start typing your document..."
              style={{
                height: "100%",
                backgroundColor: "transparent",
              }}
            />
          </div>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-slate-800 bg-slate-900/60 p-4 max-h-48 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
            </div>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="flex gap-2 p-2 bg-slate-800/50 rounded border border-violet-500/20"
              >
                <span className="text-violet-400 font-bold text-xs flex-shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-xs text-slate-300">{suggestion}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900/60 flex gap-2">
        <Button
          onClick={saveDocument}
          disabled={isSaving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save to Cloud
        </Button>

        <Button
          onClick={downloadDocument}
          variant="outline"
          className="gap-2 text-xs border-slate-700 hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>

        <Button
          onClick={generateAISuggestions}
          variant="outline"
          className="gap-2 text-xs border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Review
        </Button>

        <Button
          variant="outline"
          className="gap-2 text-xs border-slate-700 hover:bg-slate-800 ml-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </Button>
      </div>
    </div>
  );
}