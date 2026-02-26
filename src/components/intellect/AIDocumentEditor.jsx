import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactQuill from "react-quill";
import { base44 } from "@/api/base44Client";
import {
  Download, Share2, Sparkles, Loader2, X, Cloud, Check,
  FileText, MoreVertical
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
    }, 30000);

    return () => clearTimeout(autoSave);
  }, [content, documentTitle]);

  const saveDocument = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const plainText = content.replace(/<[^>]*>/g, "").substring(0, 1000);
      const blob = new Blob([`${documentTitle}\n\n${plainText}`], { type: "text/plain" });
      const file = new File([blob], `${documentTitle.replace(/[^a-z0-9]/gi, "_")}.txt`, { type: "text/plain" });
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      if (uploadResponse?.data?.file_url || uploadResponse?.file_url) {
        setLastSaved(new Date());
        toast.success("Saved to Nexus Cloud");
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
        prompt: `Review this document excerpt and provide 3 brief improvement suggestions: "${plainText}"`,
        response_json_schema: {
          type: "object",
          properties: { suggestions: { type: "array", items: { type: "string" } } }
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
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"]
    ]
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Google Docs style Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="p-4 space-y-2">
          {/* Title */}
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="w-full text-3xl font-normal bg-transparent border-0 text-gray-800 outline-none focus:bg-gray-100 focus:rounded px-2 py-1"
            placeholder="Untitled document"
          />

          {/* Toolbar - Google Docs style */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-2">
            <div className="flex-1 flex items-center gap-0.5">
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-gray-100 text-gray-700">
                <FileText className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-gray-100 text-gray-700">
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              {isSaving && (
                <div className="flex items-center gap-1 text-xs text-gray-600 px-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </div>
              )}
              {lastSaved && !isSaving && (
                <div className="flex items-center gap-1 text-xs text-gray-600 px-2">
                  <Check className="w-3 h-3" />
                  Saved
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => {}} className="h-8 px-2 hover:bg-gray-100 text-blue-600 font-medium">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="ghost" size="icon" size="sm" className="h-8 w-8 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Start typing..."
              style={{
                height: "100%",
                backgroundColor: "transparent",
                border: "none"
              }}
              className="ql-google-docs"
            />
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-gray-200 bg-blue-50 p-4 max-h-48 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">AI Suggestions</h3>
            </div>
            <button onClick={() => setShowAISuggestions(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, idx) => (
              <div key={idx} className="text-sm text-gray-700 p-2 bg-white rounded border border-blue-200">
                {suggestion}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-3 flex gap-2">
        <Button onClick={generateAISuggestions} variant="outline" size="sm" className="gap-1 text-xs border-gray-300 hover:bg-white">
          <Sparkles className="w-3 h-3" />
          AI Review
        </Button>
        <Button onClick={downloadDocument} variant="outline" size="sm" className="gap-1 text-xs border-gray-300 hover:bg-white">
          <Download className="w-3 h-3" />
          Download
        </Button>
      </div>

      <style jsx>{`
        :global(.ql-google-docs .ql-toolbar) {
          border: none;
          padding: 0;
          background: transparent;
        }
        :global(.ql-google-docs .ql-container) {
          border: none;
          font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 14px;
          color: #202124;
        }
        :global(.ql-google-docs .ql-editor) {
          padding: 0;
        }
        :global(.ql-google-docs .ql-editor.ql-blank::before) {
          color: #80868b;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}