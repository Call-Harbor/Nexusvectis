import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { SaveBtn, Card, KPI, Loader, Empty } from "./StaffShared";

const SEV_CFG = [
  { val: "low", label: "Lav", color: "#64748b" },
  { val: "medium", label: "Medium", color: "#f59e0b" },
  { val: "high", label: "Høj 🔶", color: "#f97316" },
  { val: "critical", label: "Kritisk 🚨", color: "#f43f5e" },
];
const TYPE_CFG = [
  { val: "delay", label: "Forsinkelse ✈", emoji: "⏱" },
  { val: "mechanical", label: "Teknisk", emoji: "🔧" },
  { val: "weather", label: "Vejr", emoji: "⛈" },
  { val: "damage", label: "Skade", emoji: "💥" },
  { val: "route_blocked", label: "Blokeret rute", emoji: "🚧" },
  { val: "shortage", label: "Mangel", emoji: "📉" },
  { val: "customs", label: "Told/pas", emoji: "🛂" },
];
const STATUS_CFG = [
  { val: "detected", label: "Detekteret", color: "#f59e0b" },
  { val: "analyzing", label: "Analyseres", color: "#06b6d4" },
  { val: "action_taken", label: "Handling iværksat", color: "#8b5cf6" },
  { val: "resolved", label: "Løst ✓", color: "#10b981" },
  { val: "escalated", label: "Eskaleret 🔺", color: "#f43f5e" },
];

export default function IncidentTab({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ type: "delay", severity: "medium", title: "", description: "", status: "detected" });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["sp_incidents", orgId],
    queryFn: () => base44.entities.Exception.filter({ organization_id: orgId }, "-created_date", 30),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const create = useMutation({
    mutationFn: d => base44.entities.Exception.create({ ...d, organization_id: orgId, detected_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_incidents"] }); logAdd("Incident rapporteret", "success"); setShowNew(false); setForm({ type: "delay", severity: "medium", title: "", description: "", status: "detected" }); }
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.Exception.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_incidents"] }); logAdd("Incident opdateret", "success"); setOpenId(null); }
  });

  if (isLoading) return <Loader />;

  const open = incidents.filter(i => i.status !== "resolved").length;
  const critical = incidents.filter(i => i.severity === "critical" && i.status !== "resolved").length;
  const resolved = incidents.filter(i => i.status === "resolved").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <KPI label="Åbne" value={open} color="#f59e0b" alert={open > 3} />
        <KPI label="Kritiske" value={critical} color="#f43f5e" alert={critical > 0} />
        <KPI label="Løst i dag" value={resolved} color="#10b981" />
      </div>

      <button onClick={() => setShowNew(s => !s)}
        className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
        style={{ background: "rgba(244,63,94,0.08)", border: "2px dashed rgba(244,63,94,0.4)", color: "#f43f5e" }}>
        <AlertTriangle className="w-5 h-5" /> Rapporter incident
      </button>

      {showNew && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: "rgba(244,63,94,0.05)", border: "2px solid rgba(244,63,94,0.25)" }}>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400">🚨 Ny Incident Rapport</p>

          <div>
            <p className="text-xs text-slate-400 mb-2">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_CFG.map(t => (
                <button key={t.val} onPointerDown={e => { e.preventDefault(); setForm(f => ({ ...f, type: t.val })); }}
                  className="h-11 rounded-xl text-xs font-bold active:scale-95 text-left px-3"
                  style={{ background: form.type === t.val ? "rgba(244,63,94,0.2)" : "rgba(20,30,50,0.6)", color: form.type === t.val ? "#f43f5e" : "#64748b", border: `1.5px solid ${form.type === t.val ? "#f43f5e" : "rgba(51,65,85,0.4)"}` }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Alvorlighed</p>
            <div className="grid grid-cols-4 gap-2">
              {SEV_CFG.map(s => (
                <button key={s.val} onPointerDown={e => { e.preventDefault(); setForm(f => ({ ...f, severity: s.val })); }}
                  className="h-11 rounded-xl text-xs font-bold active:scale-95"
                  style={{ background: form.severity === s.val ? `${s.color}25` : "rgba(20,30,50,0.6)", color: s.color, border: `1.5px solid ${form.severity === s.val ? s.color : "rgba(51,65,85,0.4)"}` }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Titel *</p>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Kort beskrivelse af hændelsen..."
              className="w-full h-12 rounded-xl px-4 text-sm text-white placeholder-slate-600 outline-none"
              style={{ background: "rgba(30,41,59,0.8)", border: "1.5px solid rgba(51,65,85,0.5)" }}
            />
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Detaljer</p>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Yderligere detaljer, sted, involverede fly/gate..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none"
              style={{ background: "rgba(30,41,59,0.8)", border: "1.5px solid rgba(51,65,85,0.5)" }}
            />
          </div>

          <SaveBtn onClick={() => create.mutate(form)} loading={create.isPending} color="#f43f5e" label="Rapporter incident" />
        </div>
      )}

      {!incidents.length && !showNew && <Empty text="Ingen incidents rapporteret i dag" />}
      <div className="space-y-2">
        {incidents.map(inc => {
          const isOpen = openId === inc.id;
          const sev = SEV_CFG.find(s => s.val === inc.severity);
          const st = STATUS_CFG.find(s => s.val === inc.status);
          const typeInfo = TYPE_CFG.find(t => t.val === inc.type);
          const sc = st?.color || "#64748b";
          const resolved = inc.status === "resolved";

          return (
            <Card key={inc.id} color={resolved ? "#10b981" : (sev?.color || "#64748b")} isOpen={isOpen}>
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => setOpenId(isOpen ? null : inc.id)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${sev?.color || "#64748b"}15` }}>
                  {typeInfo?.emoji || "⚠"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">{inc.title || typeInfo?.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>
                      {st?.label || inc.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-0.5 text-xs">
                    <span style={{ color: sev?.color }}>{sev?.label} alvorlighed</span>
                    {inc.description && <span className="text-slate-500 truncate">{inc.description.slice(0, 40)}...</span>}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
              </button>

              {isOpen && !resolved && (
                <div className="px-4 pb-5 border-t-2 border-slate-800/60 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Opdater status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_CFG.map(s => (
                      <button key={s.val} onPointerDown={e => { e.preventDefault(); update.mutate({ id: inc.id, status: s.val, ...(s.val === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }); }}
                        className="h-13 rounded-xl text-xs font-bold active:scale-95 transition-all"
                        style={{ background: inc.status === s.val ? `${s.color}30` : "rgba(20,30,50,0.6)", color: s.color, border: `2px solid ${inc.status === s.val ? s.color : "rgba(51,65,85,0.4)"}` }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isOpen && resolved && (
                <div className="px-4 pb-4 border-t-2 border-slate-800/60 pt-3">
                  <p className="text-sm text-emerald-400 text-center font-bold">✓ Incident løst</p>
                  {inc.description && <p className="text-xs text-slate-500 mt-1 text-center">{inc.description}</p>}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}