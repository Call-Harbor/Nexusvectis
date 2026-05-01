/**
 * Governance Center — Enterprise OS layer
 * One place to see ALL automated decisions, set policies, and control
 * which agents can do what. Business language only.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Shield, X, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle,
  CheckCircle2, Lock, DollarSign, Users, Bot, Settings, Loader2, Save
} from "lucide-react";
import { toast } from "sonner";

const POLICY_TYPES = [
  { key: "budget_limit", label: "Budget Limit", icon: DollarSign, color: "#f59e0b", desc: "Cap maximum cost per AI decision" },
  { key: "approval_required", label: "Human Approval", icon: Users, color: "#06b6d4", desc: "Require sign-off before AI acts" },
  { key: "agent_restriction", label: "Agent Restriction", icon: Bot, color: "#8b5cf6", desc: "Limit which agents can be used" },
  { key: "data_protection", label: "Data Protection", icon: Lock, color: "#10b981", desc: "Control which data agents can access" },
  { key: "compliance_guardrail", label: "Compliance Guardrail", icon: Shield, color: "#ef4444", desc: "Block actions that violate compliance rules" },
];

const ENFORCEMENT_OPTIONS = [
  { key: "block", label: "Block", color: "#ef4444" },
  { key: "warn", label: "Warn only", color: "#f59e0b" },
  { key: "require_approval", label: "Require approval", color: "#06b6d4" },
  { key: "log", label: "Log silently", color: "#64748b" },
];

function PolicyCard({ policy, onToggle, onDelete }) {
  const meta = POLICY_TYPES.find(t => t.key === policy.policy_type) || {};
  const Icon = meta.icon || Shield;
  const enfColor = ENFORCEMENT_OPTIONS.find(e => e.key === policy.enforcement)?.color || "#64748b";

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{ background: `${meta.color || "#64748b"}06`, border: `1px solid ${meta.color || "#64748b"}20` }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
          <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold font-mono" style={{ color: meta.color }}>{policy.name}</p>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${enfColor}15`, color: enfColor }}>
              {policy.enforcement?.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">{policy.description || meta.desc}</p>
          {policy.violation_count > 0 && (
            <p className="text-[9px] font-mono mt-1" style={{ color: "#f59e0b" }}>
              ⚠ Triggered {policy.violation_count} time{policy.violation_count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onToggle(policy)}
            className="p-1 rounded transition-all hover:bg-slate-800">
            {policy.is_active
              ? <ToggleRight className="w-5 h-5" style={{ color: "#10b981" }} />
              : <ToggleLeft className="w-5 h-5 text-slate-600" />}
          </button>
          <button onClick={() => onDelete(policy.id)}
            className="p-1 rounded transition-all hover:bg-red-500/20 hover:text-red-400 text-slate-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NewPolicyForm({ orgId, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: "", policy_type: "budget_limit", enforcement: "warn", description: "", rule: {} });
  const [saving, setSaving] = useState(false);
  const [maxEur, setMaxEur] = useState("");

  const handleSave = async () => {
    if (!form.name || !form.policy_type) return;
    setSaving(true);
    const rule = form.policy_type === "budget_limit" && maxEur ? { max_eur: parseFloat(maxEur) } : {};
    await base44.entities.GovernancePolicy.create({
      organization_id: orgId,
      ...form,
      rule,
      is_active: true,
      violation_count: 0,
    });
    toast.success("Policy created");
    onSaved();
    setSaving(false);
  };

  const meta = POLICY_TYPES.find(t => t.key === form.policy_type) || {};

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)" }}>
      <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#06b6d4" }}>New Governance Policy</p>

      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        placeholder="Policy name..."
        className="w-full px-3 py-2 rounded-lg text-sm text-white bg-black/40 outline-none"
        style={{ border: "1px solid rgba(6,182,212,0.2)" }} />

      <div className="grid grid-cols-2 gap-2">
        {POLICY_TYPES.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setForm(p => ({ ...p, policy_type: t.key }))}
              className="p-2.5 rounded-lg text-left transition-all"
              style={{
                background: form.policy_type === t.key ? `${t.color}15` : "rgba(255,255,255,0.02)",
                border: `1px solid ${form.policy_type === t.key ? t.color + "50" : "rgba(255,255,255,0.06)"}`,
              }}>
              <Icon className="w-3.5 h-3.5 mb-1" style={{ color: form.policy_type === t.key ? t.color : "#475569" }} />
              <p className="text-[10px] font-bold font-mono" style={{ color: form.policy_type === t.key ? t.color : "#64748b" }}>{t.label}</p>
            </button>
          );
        })}
      </div>

      {form.policy_type === "budget_limit" && (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <input type="number" value={maxEur} onChange={e => setMaxEur(e.target.value)}
            placeholder="Max EUR per decision..."
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white bg-black/40 outline-none"
            style={{ border: "1px solid rgba(245,158,11,0.25)" }} />
        </div>
      )}

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">Enforcement</p>
        <div className="flex gap-1.5 flex-wrap">
          {ENFORCEMENT_OPTIONS.map(e => (
            <button key={e.key} onClick={() => setForm(p => ({ ...p, enforcement: e.key }))}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all"
              style={{
                background: form.enforcement === e.key ? `${e.color}15` : "transparent",
                border: `1px solid ${form.enforcement === e.key ? e.color + "40" : "rgba(255,255,255,0.06)"}`,
                color: form.enforcement === e.key ? e.color : "#475569"
              }}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-500 transition-all hover:bg-slate-800">Cancel</button>
        <motion.button onClick={handleSave} disabled={saving || !form.name}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
          style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save Policy
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function GovernanceCenter({ orgId, onClose }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.GovernancePolicy.filter({ organization_id: orgId });
      setPolicies(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const togglePolicy = async (policy) => {
    await base44.entities.GovernancePolicy.update(policy.id, { is_active: !policy.is_active });
    setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, is_active: !p.is_active } : p));
    toast.success(policy.is_active ? "Policy paused" : "Policy activated");
  };

  const deletePolicy = async (id) => {
    await base44.entities.GovernancePolicy.delete(id);
    setPolicies(prev => prev.filter(p => p.id !== id));
    toast.success("Policy deleted");
  };

  const active = policies.filter(p => p.is_active);
  const inactive = policies.filter(p => !p.is_active);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "rgba(1,5,15,0.98)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b" style={{ borderColor: "rgba(6,182,212,0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Shield className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-xs font-black font-mono tracking-widest uppercase" style={{ color: "#10b981" }}>Governance Center</p>
            <p className="text-[9px] text-slate-500 font-mono">{active.length} active {active.length === 1 ? "policy" : "policies"} · Enterprise OS layer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewForm(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
            style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" }}>
            <Plus className="w-3.5 h-3.5" /> New Policy
          </button>
          {onClose && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-all" style={{ color: "#64748b" }}>
            <X className="w-4 h-4" />
          </button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {showNewForm && (
            <NewPolicyForm orgId={orgId} onSaved={() => { setShowNewForm(false); load(); }} onCancel={() => setShowNewForm(false)} />
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#06b6d4" }} /></div>
        ) : (
          <>
            {active.length === 0 && !showNewForm && (
              <div className="text-center py-10">
                <Shield className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-500 text-sm font-mono">No governance policies yet</p>
                <p className="text-slate-700 text-xs mt-1">Add policies to control AI decisions</p>
              </div>
            )}
            {active.length > 0 && (
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2">Active Policies</p>
                <div className="space-y-2">
                  {active.map(p => <PolicyCard key={p.id} policy={p} onToggle={togglePolicy} onDelete={deletePolicy} />)}
                </div>
              </div>
            )}
            {inactive.length > 0 && (
              <div className="mt-4">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-700 mb-2">Paused Policies</p>
                <div className="space-y-2 opacity-50">
                  {inactive.map(p => <PolicyCard key={p.id} policy={p} onToggle={togglePolicy} onDelete={deletePolicy} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}