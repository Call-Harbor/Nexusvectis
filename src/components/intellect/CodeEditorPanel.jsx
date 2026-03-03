import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Copy, Download } from "lucide-react";
import { toast } from "sonner";

export default function CodeEditorPanel({ slide, onApply, errors }) {
  const [code, setCode] = useState(() => JSON.stringify(slide, null, 2));
  const editorRef = useRef(null);

  useEffect(() => {
    setCode(JSON.stringify(slide, null, 2));
  }, [slide]);

  const handleApply = () => {
    onApply(code);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(code));
    element.setAttribute("download", "slide.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded");
  };

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* Toolbar */}
      <div className="flex gap-1">
        <Button
          onClick={handleApply}
          size="sm"
          className="flex-1 h-7 bg-cyan-600/80 hover:bg-cyan-600 border-0 text-xs gap-1"
        >
          <CheckCircle2 className="w-3 h-3" />
          Apply
        </Button>
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className="h-7 border-slate-700 text-slate-400 hover:text-white text-xs"
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          onClick={handleDownload}
          size="sm"
          variant="outline"
          className="h-7 border-slate-700 text-slate-400 hover:text-white text-xs"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-3 font-mono text-xs bg-slate-950 text-slate-200 border-none outline-none resize-none"
          spellCheck="false"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, idx) => (
            <div key={idx} className="flex gap-2 p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-mono">{err.message}</div>
                {err.line && <div className="text-[10px] text-red-500/60">Line {err.line}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-slate-600">
        Edit the JSON directly or use the Design tab. Changes apply when you click Apply.
      </div>
    </div>
  );
}