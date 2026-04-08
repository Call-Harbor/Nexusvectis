import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Save, RotateCcw, Copy, Trash2, X, ChevronRight, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "harbor_workflow_versions";

function loadVersions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveVersions(versions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.slice(0, 50)));
}

export default function WorkflowVersionManager({ currentTasks, currentOptions, onLoadVersion, onClose }) {
  const [versions, setVersions] = useState(loadVersions);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);
  const [compareId, setCompareId] = useState(null);

  const saveVersion = () => {
    if (!saveName.trim() || currentTasks.length === 0) return;
    const version = {
      id: `v_${Date.now()}`,
      name: saveName.trim(),
      timestamp: Date.now(),
      tasks: currentTasks,
      options: currentOptions,
      taskCount: currentTasks.length,
    };
    const updated = [version, ...versions];
    setVersions(updated);
    saveVersions(updated);
    setSaveName("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteVersion = (id) => {
    const updated = versions.filter(v => v.id !== id);
    setVersions(updated);
    saveVersions(updated);
  };

  const compareVersion = versions.find(v => v.id === compareId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(8,12,28,0.98)", border: "1px solid rgba(139,92,246,0.25)", maxHeight: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.02)" }}>
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <h3 className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#a78bfa" }}>Workflow Versions</h3>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
            {versions.length} saved
          </span>
        </div>
        <button onClick={onClose} style={{ color: "#64748b" }} className="hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save current */}
      <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">
          Save current workflow ({currentTasks.length} tasks)
        </p>
        <div className="flex gap-2">
          <input value={saveName} onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveVersion()}
            placeholder="Version name (e.g. 'v2 fleet analysis')"
            className="flex-1 px-3 py-1.5 rounded-lg text-xs text-white outline-none font-mono"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139,92,246,0.2)" }} />
          <motion.button onClick={saveVersion}
            disabled={!saveName.trim() || currentTasks.length === 0}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40"
            style={{ background: saved ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.15)", color: saved ? "#10b981" : "#a78bfa", border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)"}` }}>
            {saved ? <><CheckCircle2 className="w-3 h-3" /> Saved!</> : <><Save className="w-3 h-3" /> Save</>}
          </motion.button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {versions.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-500">No saved versions yet — save your first workflow above</div>
        )}
        {versions.map((v, i) => (
          <motion.div key={v.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="group p-3 rounded-xl"
            style={{ background: compareId === v.id ? "rgba(139,92,246,0.1)" : "rgba(15,23,42,0.6)", border: `1px solid ${compareId === v.id ? "rgba(139,92,246,0.4)" : "rgba(100,116,139,0.12)"}` }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{v.name}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                    {v.taskCount} tasks
                  </span>
                  {v.options?.mode && (
                    <span className="text-[8px] font-mono text-slate-600">{v.options.mode}</span>
                  )}
                </div>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {new Date(v.timestamp).toLocaleString("da-DK", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  {v.options?.budget && ` • budget: ${v.options.budget.toLocaleString()}`}
                </p>

                {/* Compare view */}
                {compareId === v.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 space-y-1">
                    {v.tasks.map((t, ti) => (
                      <div key={ti} className="text-[9px] font-mono text-slate-400 pl-2 border-l" style={{ borderColor: "rgba(139,92,246,0.3)" }}>
                        <span style={{ color: "#a78bfa" }}>Task {ti + 1}:</span> {t.prompt?.slice(0, 60) || "(empty)"}
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => setCompareId(compareId === v.id ? null : v.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-violet-500/20"
                  style={{ color: compareId === v.id ? "#a78bfa" : "#64748b" }}
                  title="Compare / view details">
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${compareId === v.id ? "rotate-90" : ""}`} />
                </button>
                <button onClick={() => onLoadVersion(v)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500/20"
                  style={{ color: "#64748b" }} title="Load this version">
                  <RotateCcw className="w-3.5 h-3.5 hover:text-cyan-400" />
                </button>
                <button onClick={() => deleteVersion(v.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                  style={{ color: "#64748b" }} title="Delete version">
                  <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}