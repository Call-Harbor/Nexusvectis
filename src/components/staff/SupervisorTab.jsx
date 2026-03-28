import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Zap, RefreshCw, Users } from "lucide-react";
import { KPI, AlertPill, Loader } from "./StaffShared";

const STAFF_STATUS_LABELS = { on_duty: "På vagt", assigned: "Tildelt", on_break: "Pause", off_duty: "Fri" };
const STAFF_STATUS_COLORS = { on_duty: "#10b981", assigned: "#06b6d4", on_break: "#f59e0b", off_duty: "#64748b" };

export default function SupervisorTab({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [redeployFrom, setRedeployFrom] = useState(null);

  const { data: gates = [] } = useQuery({ queryKey: ["sp_gates", orgId], queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 50), enabled: !!orgId, refetchInterval: 15000 });
  const { data: lanes = [] } = useQuery({ queryKey: ["sp_lanes", orgId], queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30), enabled: !!orgId, refetchInterval: 15000 });
  const { data: zones = [] } = useQuery({ queryKey: ["sp_landside", orgId], queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50), enabled: !!orgId, refetchInterval: 20000 });
  const { data: staff = [], isLoading: staffLoading } = useQuery({ queryKey: ["sp_staff", orgId], queryFn: () => base44.entities.AirportStaff.filter({ organization_id: orgId }, "name", 100), enabled: !!orgId, refetchInterval: 20000 });
  const { data: incidents = [] } = useQuery({ queryKey: ["sp_incidents", orgId], queryFn: () => base44.entities.Exception.filter({ organization_id: orgId }, "-created_date", 20), enabled: !!orgId, refetchInterval: 20000 });

  const updateStaff = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AirportStaff.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_staff"] }); logAdd("Personale omfordelt", "success"); }
  });

  const avgWait = lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0;
  const openIncidents = incidents.filter(i => i.status !== "resolved").length;

  const alerts = [
    ...lanes.filter(l => l.wait_minutes > 20).map(l => ({ text: `${l.name}: ${l.wait_minutes} min ventetid (SLA: 20m)`, sev: "critical" })),
    ...lanes.filter(l => (l.staff_assigned || 0) < (l.staff_required || 2)).map(l => ({ text: `${l.name}: understaffed (${l.staff_assigned || 0}/${l.staff_required || 2})`, sev: "critical" })),
    ...gates.filter(g => (g.pax_waiting || 0) > 120).map(g => ({ text: `Gate ${g.gate_code}: ${g.pax_waiting} pax venter`, sev: "warning" })),
    ...zones.filter(z => z.status === "closed").map(z => ({ text: `Zone "${z.name}" er lukket`, sev: "warning" })),
    ...incidents.filter(i => i.severity === "critical" && i.status !== "resolved").map(i => ({ text: `Incident: ${i.title}`, sev: "critical" })),
  ];

  const runAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    const snapshot = {
      gates: gates.map(g => ({ code: g.gate_code, status: g.status, boarding: g.boarding_active, pax: g.pax_waiting })),
      security: lanes.map(l => ({ name: l.name, status: l.status, queue: l.queue_length, wait: l.wait_minutes, staff: l.staff_assigned, required: l.staff_required })),
      landside: zones.map(z => ({ name: z.name, type: z.facility_type, status: z.status, queue: z.queue_count, wait: z.wait_minutes })),
      incidents: incidents.filter(i => i.status !== "resolved").map(i => ({ title: i.title, severity: i.severity, type: i.type })),
      staff: { total: staff.length, on_duty: staff.filter(s => s.status === "on_duty" || s.status === "assigned").length, on_break: staff.filter(s => s.status === "on_break").length },
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en erfaren lufthavn operations supervisor. Analyser følgende operationelle data og giv KONKRETE handlingsanbefalinger på dansk. Vær præcis og specifik. Max 5 anbefalinger.\n\nData:\n${JSON.stringify(snapshot, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_status: { type: "string", enum: ["grøn", "gul", "rød"] },
          summary: { type: "string" },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: { type: "string", enum: ["høj", "medium", "lav"] },
                action: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAiResult(res);
    setAiLoading(false);
    logAdd("AI analyse gennemført", "success");
  };

  const statusColors = { grøn: "#10b981", gul: "#f59e0b", rød: "#f43f5e" };
  const prioColors = { høj: "#f43f5e", medium: "#f59e0b", lav: "#64748b" };

  const freeStaff = staff.filter(s => s.status === "on_duty" && !s.assigned_to);
  const criticalLanes = lanes.filter(l => (l.staff_assigned || 0) < (l.staff_required || 2) || l.wait_minutes > 20);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <KPI label="Aktive gates" value={gates.filter(g => g.status !== "closed").length} unit={`/${gates.length}`} color="#06b6d4" />
        <KPI label="Avg. vent" value={`${avgWait}m`} color={avgWait > 20 ? "#f43f5e" : "#10b981"} alert={avgWait > 20} />
        <KPI label="Incidents" value={openIncidents} color="#f43f5e" alert={openIncidents > 0} />
        <KPI label="På vagt" value={staff.filter(s => s.status === "on_duty" || s.status === "assigned").length} unit={`/${staff.length}`} color="#10b981" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {alerts.length} Aktive advarsler
          </p>
          {alerts.map((a, i) => <AlertPill key={i} {...a} />)}
        </div>
      )}

      {/* AI Advisor */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(139,92,246,0.07)", border: "1.5px solid rgba(139,92,246,0.3)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <p className="text-sm font-bold text-violet-300">AI Operationel Analyse</p>
          </div>
          {aiResult && (
            <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: `${statusColors[aiResult.overall_status] || "#64748b"}20`, color: statusColors[aiResult.overall_status] || "#64748b" }}>
              ● {aiResult.overall_status?.toUpperCase()}
            </span>
          )}
        </div>
        {aiResult && (
          <p className="text-sm text-slate-300 leading-relaxed">{aiResult.summary}</p>
        )}
        {aiResult?.recommendations?.length > 0 && (
          <div className="space-y-2 mt-2">
            {aiResult.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: `${prioColors[r.priority] || "#64748b"}10`, border: `1px solid ${prioColors[r.priority] || "#64748b"}25` }}>
                <span className="text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0 mt-0.5" style={{ background: `${prioColors[r.priority]}20`, color: prioColors[r.priority] || "#64748b" }}>
                  {r.priority?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm text-white font-bold">{r.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={runAI} disabled={aiLoading}
          className="w-full h-13 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
          style={{ background: "rgba(139,92,246,0.2)", border: "1.5px solid rgba(139,92,246,0.5)", color: "#a78bfa" }}>
          {aiLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyserer...</> : <><Zap className="w-4 h-4" />{aiResult ? "Genanalyser nu" : "Kør AI analyse"}</>}
        </button>
      </div>

      {/* Staff redeployment */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(6,182,212,0.06)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <p className="text-sm font-bold text-cyan-300">Personale omfordeling</p>
          {freeStaff.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">{freeStaff.length} ledig</span>}
        </div>

        {criticalLanes.length > 0 && freeStaff.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Kritiske lanes der mangler personale:</p>
            {criticalLanes.slice(0, 3).map(l => (
              <div key={l.id} className="flex items-center justify-between rounded-xl p-3"
                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <div>
                  <p className="text-sm font-bold text-white">{l.name}</p>
                  <p className="text-xs text-red-400">Staff: {l.staff_assigned || 0}/{l.staff_required || 2} · Vent: {l.wait_minutes || 0}m</p>
                </div>
                <button onPointerDown={e => {
                  e.preventDefault();
                  if (freeStaff[0]) {
                    updateStaff.mutate({ id: freeStaff[0].id, status: "assigned", assigned_to: l.name });
                    base44.entities.SecurityLane.update(l.id, { staff_assigned: (l.staff_assigned || 0) + 1 });
                    logAdd(`${freeStaff[0].name} omfordelt til ${l.name}`, "success");
                  }
                }}
                  className="text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all"
                  style={{ background: "rgba(16,185,129,0.2)", border: "1.5px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
                  Send
                </button>
              </div>
            ))}
          </div>
        )}

        {staffLoading && <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 text-slate-600 animate-spin" /></div>}

        {/* Staff list */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          {staff.slice(0, 12).map(s => (
            <div key={s.id} className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${STAFF_STATUS_COLORS[s.status] || "#334155"}25` }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STAFF_STATUS_COLORS[s.status] || "#64748b" }} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{s.name}</p>
                <p className="text-[10px] text-slate-500 capitalize truncate">{s.role?.replace(/_/g, " ")} · {STAFF_STATUS_LABELS[s.status] || s.status}</p>
              </div>
            </div>
          ))}
        </div>
        {staff.length > 12 && <p className="text-xs text-slate-500 text-center">+{staff.length - 12} mere</p>}
      </div>
    </div>
  );
}