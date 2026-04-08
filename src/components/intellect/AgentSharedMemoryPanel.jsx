import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Database, Lock, Users, Eye, Clock, Tag } from "lucide-react";
import { toast } from "sonner";

const TYPE_COLORS = {
  fact: "#06b6d4",
  context: "#8b5cf6",
  result: "#10b981",
  instruction: "#f59e0b",
  secret: "#ef4444"
};

const ACCESS_ICONS = {
  all_agents: Users,
  admin_only: Lock,
  specific_agents: Eye
};

export default function AgentSharedMemoryPanel({ orgId, onClose }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    key: "", value: "", memory_type: "fact",
    access_level: "all_agents", ttl_hours: 0, tags: ""
  });

  useEffect(() => { if (orgId) loadMemories(); }, [orgId]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AgentSharedMemory.filter({ organization_id: orgId }, '-created_date', 50);
      // Filter expired
      const now = new Date();
      setMemories(data.filter(m => !m.expires_at || new Date(m.expires_at) > now));
    } catch { toast.error("Could not load memories"); }
    setLoading(false);
  };

  const saveMemory = async () => {
    if (!form.key.trim() || !form.value.trim()) return;
    try {
      await base44.entities.AgentSharedMemory.create({
        organization_id: orgId,
        key: form.key.trim(),
        value: form.value.trim(),
        memory_type: form.memory_type,
        access_level: form.access_level,
        ttl_hours: Number(form.ttl_hours),
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        ...(form.ttl_hours > 0 && {
          expires_at: new Date(Date.now() + form.ttl_hours * 3600000).toISOString()
        })
      });
      setForm({ key: "", value: "", memory_type: "fact", access_level: "all_agents", ttl_hours: 0, tags: "" });
      setShowForm(false);
      toast.success("Memory saved");
      loadMemories();
    } catch { toast.error("Failed to save"); }
  };

  const deleteMemory = async (id) => {
    await base44.entities.AgentSharedMemory.delete(id);
    setMemories(prev => prev.filter(m => m.id !== id));
    toast.success("Deleted");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(5,10,25,0.98)", border: "1px solid rgba(139,92,246,0.35)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase" style={{ color: "#a78bfa" }}>
            Shared Agent Memory
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
            {memories.length} entries
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button onClick={() => setShowForm(p => !p)} whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold"
            style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
            <Plus className="w-3 h-3" /> Add
          </motion.button>
          <button onClick={onClose} className="p-1 rounded hover:bg-red-500/20" style={{ color: "#64748b" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-b" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
            <div className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Key</p>
                  <input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
                    placeholder="e.g. company_name"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none focus:border-violet-500 placeholder-slate-600" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Type</p>
                    <select value={form.memory_type} onChange={e => setForm(p => ({ ...p, memory_type: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none">
                      {["fact","context","result","instruction","secret"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Access</p>
                    <select value={form.access_level} onChange={e => setForm(p => ({ ...p, access_level: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none">
                      <option value="all_agents">All agents</option>
                      <option value="admin_only">Admin only</option>
                      <option value="specific_agents">Specific</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Value</p>
                <textarea value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  placeholder="Memory content..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none resize-none focus:border-violet-500 placeholder-slate-600" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Tags (comma)</p>
                  <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                    placeholder="tag1, tag2"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none placeholder-slate-600" />
                </div>
                <div className="w-28">
                  <p className="text-[9px] font-mono text-slate-500 mb-1 uppercase tracking-wider">TTL (hours)</p>
                  <input type="number" value={form.ttl_hours} onChange={e => setForm(p => ({ ...p, ttl_hours: e.target.value }))}
                    placeholder="0 = forever"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-900/80 border border-slate-700/50 outline-none" />
                </div>
                <div className="flex items-end">
                  <motion.button onClick={saveMemory} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold"
                    style={{ background: "rgba(139,92,246,0.25)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.4)" }}>
                    Save
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <p className="text-center text-xs text-slate-600 py-4 font-mono">Loading...</p>
        ) : memories.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-4 font-mono">No memories yet. Add context for agents to share.</p>
        ) : (
          memories.map(m => {
            const color = TYPE_COLORS[m.memory_type] || "#64748b";
            const AccessIcon = ACCESS_ICONS[m.access_level] || Users;
            return (
              <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="group flex items-start gap-3 p-2.5 rounded-xl"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ background: `${color}15`, color }}>
                    {m.memory_type}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-mono font-bold text-white truncate">{m.key}</p>
                    <AccessIcon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#64748b" }} />
                    {m.expires_at && <Clock className="w-2.5 h-2.5 flex-shrink-0 text-slate-600" />}
                    {m.read_count > 0 && <span className="text-[8px] text-slate-600 font-mono">×{m.read_count}</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{m.value}</p>
                  {m.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.tags.map((t, i) => (
                        <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: "rgba(100,116,139,0.15)", color: "#64748b" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20"
                  style={{ color: "#64748b" }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t text-[9px] font-mono text-slate-600" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
        Memory is injected into every sandboxed agent call — respecting RBAC access levels
      </div>
    </motion.div>
  );
}