import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Save, Download, Plus, Trash2, FileText, Sparkles,
  Loader2, X, Cloud, Check, BarChart3, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AISpreadsheetEditor() {
  const [sheetName, setSheetName] = useState("Sheet 1");
  const [rows, setRows] = useState(
    Array(10).fill().map(() => Array(5).fill(""))
  );
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const sheetContainerRef = useRef(null);

  // Auto-save
  useEffect(() => {
    const autoSave = setTimeout(() => {
      saveSpreadsheet();
    }, 30000);

    return () => clearTimeout(autoSave);
  }, [rows, sheetName]);

  const updateCell = (rowIdx, colIdx, value) => {
    const newRows = rows.map((row, i) =>
      i === rowIdx
        ? row.map((cell, j) => (j === colIdx ? value : cell))
        : row
    );
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, Array(rows[0]?.length || 5).fill("")]);
  };

  const addColumn = () => {
    setRows(rows.map(row => [...row, ""]));
  };

  const deleteRow = (idx) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  const saveSpreadsheet = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Convert to CSV format
      const csv = rows
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const file = new File([blob], `${sheetName}.csv`, { type: "text/csv" });

      const uploadResponse = await base44.integrations.Core.UploadFile({ file });

      if (uploadResponse?.data?.file_url || uploadResponse?.file_url) {
        setLastSaved(new Date());
        toast.success("📊 Spreadsheet saved to Nexus Cloud");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save spreadsheet");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIAnalysis = async () => {
    try {
      // Extract data for analysis
      const dataText = rows
        .slice(0, 5)
        .map(row => row.join(" | "))
        .join("\n");

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this spreadsheet data and provide insights:

${dataText}

Provide JSON with: summary, trends, recommendations array`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            trends: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiAnalysis(analysis);
      setShowAIAnalysis(true);
    } catch (error) {
      toast.error("Failed to generate analysis");
    }
  };

  const downloadSpreadsheet = () => {
    const csv = rows
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const element = document.createElement("a");
    const blob = new Blob([csv], { type: "text/csv" });
    element.href = URL.createObjectURL(blob);
    element.download = `${sheetName}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("📥 Spreadsheet downloaded");
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="space-y-3">
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="text-xl font-bold bg-transparent border-0 border-b-2 border-transparent hover:border-cyan-500/50 focus:border-cyan-500 text-white outline-none transition-colors"
            placeholder="Sheet Name"
          />

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

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <div ref={sheetContainerRef} className="p-4">
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-slate-700/30">
                    <td className="w-8 h-8 sticky left-0 bg-slate-800/50 border-r border-slate-700/30 flex items-center justify-center text-slate-500 flex-shrink-0">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={`${rowIdx}-${colIdx}`}
                        className={`p-2 border-r border-slate-700/30 min-w-[100px] h-8 ${
                          selectedCell?.row === rowIdx &&
                          selectedCell?.col === colIdx
                            ? "bg-cyan-500/20 border-cyan-500/50"
                            : "bg-slate-900/20 hover:bg-slate-800/30"
                        }`}
                      >
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            updateCell(rowIdx, colIdx, e.target.value)
                          }
                          onFocus={() =>
                            setSelectedCell({ row: rowIdx, col: colIdx })
                          }
                          className="w-full h-full bg-transparent text-white outline-none text-[11px]"
                        />
                      </td>
                    ))}
                    <td className="p-2 w-8 h-8 flex-shrink-0">
                      <button
                        onClick={() => deleteRow(rowIdx)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {showAIAnalysis && aiAnalysis && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-slate-800 bg-slate-900/60 p-4 max-h-48 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">AI Analysis</h3>
            </div>
            <button
              onClick={() => setShowAIAnalysis(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {aiAnalysis.summary && (
              <div>
                <p className="text-xs text-slate-400 mb-1 font-semibold">Summary</p>
                <p className="text-xs text-slate-300">{aiAnalysis.summary}</p>
              </div>
            )}

            {aiAnalysis.trends && aiAnalysis.trends.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trends
                </p>
                <div className="space-y-1">
                  {aiAnalysis.trends.map((trend, idx) => (
                    <p key={idx} className="text-xs text-slate-300">
                      • {trend}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1 font-semibold">Recommendations</p>
                <div className="space-y-1">
                  {aiAnalysis.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-xs text-slate-300">
                      → {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900/60 flex gap-2 flex-wrap">
        <Button
          onClick={addRow}
          variant="outline"
          className="gap-2 text-xs border-slate-700 hover:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          Row
        </Button>

        <Button
          onClick={addColumn}
          variant="outline"
          className="gap-2 text-xs border-slate-700 hover:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          Column
        </Button>

        <Button
          onClick={saveSpreadsheet}
          disabled={isSaving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Save Cloud
        </Button>

        <Button
          onClick={downloadSpreadsheet}
          variant="outline"
          className="gap-2 text-xs border-slate-700 hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </Button>

        <Button
          onClick={generateAIAnalysis}
          variant="outline"
          className="gap-2 text-xs border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Analyze
        </Button>
      </div>
    </div>
  );
}