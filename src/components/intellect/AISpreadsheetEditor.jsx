import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Download, Plus, Trash2, Sparkles, Loader2, X, Check,
  MoreVertical, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function AISpreadsheetEditor() {
  const [sheetName, setSheetName] = useState("Untitled spreadsheet");
  const [rows, setRows] = useState(Array(20).fill().map(() => Array(6).fill("")));
  const [selectedCell, setSelectedCell] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    const autoSave = setTimeout(() => saveSpreadsheet(), 30000);
    return () => clearTimeout(autoSave);
  }, [rows, sheetName]);

  const updateCell = (rowIdx, colIdx, value) => {
    const newRows = rows.map((row, i) =>
      i === rowIdx ? row.map((cell, j) => (j === colIdx ? value : cell)) : row
    );
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, Array(rows[0]?.length || 6).fill("")]);
  };

  const addColumn = () => {
    setRows(rows.map(row => [...row, ""]));
  };

  const deleteRow = (idx) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx));
  };

  const saveSpreadsheet = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const file = new File([blob], `${sheetName}.csv`, { type: "text/csv" });
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      if (uploadResponse?.data?.file_url || uploadResponse?.file_url) {
        setLastSaved(new Date());
        toast.success("Saved");
      }
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAIAnalysis = async () => {
    try {
      const dataText = rows.slice(0, 5).map(row => row.join(" | ")).join("\n");
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this spreadsheet data: ${dataText}`,
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
      toast.error("Failed to analyze");
    }
  };

  const downloadSpreadsheet = () => {
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const element = document.createElement("a");
    const blob = new Blob([csv], { type: "text/csv" });
    element.href = URL.createObjectURL(blob);
    element.download = `${sheetName}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getColName = (idx) => {
    if (idx < 26) return ALPHABET[idx];
    return ALPHABET[Math.floor(idx / 26) - 1] + ALPHABET[idx % 26];
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Google Sheets style header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="text-2xl font-normal bg-transparent border-0 text-gray-800 outline-none focus:bg-gray-100 focus:rounded px-2 py-1"
              placeholder="Untitled spreadsheet"
            />
            <div className="flex items-center gap-2">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-600" />}
              {lastSaved && !isSaving && <Check className="w-4 h-4 text-gray-600" />}
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-gray-100">
                <Share2 className="w-4 h-4 text-blue-600" />
              </Button>
              <Button variant="ghost" size="icon" size="sm" className="h-8 w-8 hover:bg-gray-100">
                <MoreVertical className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-2 text-gray-700">
            <Button variant="ghost" size="sm" onClick={addRow} className="h-8 px-2 hover:bg-gray-100 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" />
              Row
            </Button>
            <Button variant="ghost" size="sm" onClick={addColumn} className="h-8 px-2 hover:bg-gray-100 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" />
              Col
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={generateAIAnalysis} className="h-8 px-2 hover:bg-blue-50 text-blue-600 text-xs gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI
            </Button>
          </div>
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <div className="border border-gray-200 bg-white rounded">
            <table className="border-collapse text-sm font-normal">
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="w-12 h-6 sticky left-0 bg-gray-50 border-r border-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={`${rowIdx}-${colIdx}`}
                        className={`border-r border-gray-200 min-w-[100px] h-6 ${
                          selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                            ? "bg-blue-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                          onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                          className="w-full h-full bg-transparent text-gray-800 outline-none px-2 text-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 flex items-center gap-2">
              <span>+</span>
              <span>Add row</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {showAIAnalysis && aiAnalysis && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="border-t border-gray-200 bg-blue-50 p-4 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">AI Insights</h3>
            <button onClick={() => setShowAIAnalysis(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            {aiAnalysis.summary && <p>{aiAnalysis.summary}</p>}
            {aiAnalysis.trends?.map((trend, idx) => <p key={idx}>• {trend}</p>)}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-2 flex gap-2">
        <Button onClick={downloadSpreadsheet} variant="ghost" size="sm" className="h-8 px-2 hover:bg-white text-xs">
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      <style jsx>{`
        table { border-collapse: collapse; }
        td { margin: 0; padding: 0; }
        input { border: none; }
      `}</style>
    </div>
  );
}