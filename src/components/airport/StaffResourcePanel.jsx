import { useMemo, useState } from "react";
import { Users, Clock, CheckCircle, AlertTriangle, Coffee, Zap } from "lucide-react";

const ROLE_COLOR = {
  security_officer: "#06b6d4",
  gate_agent: "#8b5cf6",
  ground_handler: "#f59e0b",
  baggage_driver: "#f97316",
  cleaning_crew: "#10b981",
  bus_driver: "#64748b",
  supervisor: "#f43f5e",
  dispatcher: "#ec4899",
};

const STATUS_COLOR = {
  on_duty: "#10b981",
  on_break: "#f59e0b",
  off_duty: "#475569",
  assigned: "#06b6d4",
};

const STATUS_ICON = {
  on_duty: CheckCircle,
  on_break: Coffee,
  off_duty: Clock,
  assigned: Zap,
};

export default function StaffResourcePanel({ staff }) {
  const [view, setView] = useState("overview");

  const roleGroups = useMemo(() => staff.reduce((acc, s) => {
    if (!acc[s.role]) acc[s.role] = [];
    acc[s.role].push(s);
    return acc;
  }, {}), [staff]);

  const statusCounts = useMemo(() => ({
    on_duty: staff.filter(s => s.status === "on_duty").length,
    assigned: staff.filter(s => s.status === "assigned").length,
    on_break: staff.filter(s => s.status === "on_break").length,
    off_duty: staff.filter(s => s.status === "off_duty").length,
  }), [staff]);

  const utilization = staff.length > 0
    ? Math.round(((statusCounts.on_duty + statusCounts.assigned) / staff.length) * 100)
    : 0;

  const criticalRoles = Object.entries(roleGroups)
    .filter(([, members]) => members.filter(m => m.status === "on_duty" || m.status === "assigned").length === 0)
    .map(([role]) => role);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(0,8,20,0.95)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/60" style={{ background: "rgba(0,12,28,0.9)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-400">STAFF & RESOURCES</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {["overview", "by_role", "assignments"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all"
                style={{ background: view === v ? "rgba(16,185,129,0.2)" : "transparent", color: view === v ? "#10b981" : "#334155", border: `1px solid ${view === v ? "rgba(16,185,129,0.4)" : "rgba(30,41,59,0.6)"}` }}>
                {v === "overview" ? "OVERVIEW" : v === "by_role" ? "ROLES" : "ASSIGNED"}
              </button>
            ))}
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-1 rounded-xl p-2.5 flex flex-col items-center justify-center"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-0.5">UTILIZATION</p>
            <p className="text-2xl font-black" style={{ color: utilization > 70 ? "#10b981" : utilization > 40 ? "#f59e0b" : "#f43f5e" }}>{utilization}%</p>
            <div className="w-full h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${utilization}%`, background: utilization > 70 ? "#10b981" : "#f59e0b" }} />
            </div>
          </div>
          {Object.entries(statusCounts).map(([status, count]) => {
            const color = STATUS_COLOR[status];
            const Icon = STATUS_ICON[status] || CheckCircle;
            return (
              <div key={status} className="rounded-xl p-2.5 text-center"
                style={{ background: `${color}09`, border: `1px solid ${color}20` }}>
                <Icon className="w-3 h-3 mx-auto mb-1" style={{ color }} />
                <p className="text-lg font-black leading-none" style={{ color }}>{count}</p>
                <p className="text-[7px] uppercase tracking-widest mt-0.5" style={{ color: `${color}60` }}>{status.replace(/_/g, " ")}</p>
              </div>
            );
          })}
        </div>

        {criticalRoles.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <p className="text-[9px] text-red-300 font-bold">
              No active crew: {criticalRoles.map(r => r.replace(/_/g, " ")).join(" · ")}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto">
        {staff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-700">
            <Users className="w-8 h-8 mb-3" />
            <p className="text-sm font-bold">No staff records</p>
          </div>
        )}

        {/* Overview: all staff as chips grouped by status */}
        {view === "overview" && (
          <div className="space-y-3">
            {Object.entries(statusCounts).filter(([, count]) => count > 0).map(([status, count]) => {
              const color = STATUS_COLOR[status];
              const members = staff.filter(s => s.status === status);
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{status.replace(/_/g, " ")} — {count}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(m => {
                      const rc = ROLE_COLOR[m.role] || "#64748b";
                      return (
                        <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px]"
                          style={{ background: `${rc}10`, border: `1px solid ${rc}20`, color: "#e2e8f0" }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: rc }} />
                          <span className="font-bold">{m.name}</span>
                          {m.assigned_to && <span className="text-[8px] text-slate-500">· {m.assigned_to}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* By role */}
        {view === "by_role" && (
          <div className="space-y-3">
            {Object.entries(roleGroups).map(([role, members]) => {
              const color = ROLE_COLOR[role] || "#64748b";
              const active = members.filter(m => m.status === "on_duty" || m.status === "assigned").length;
              const utilPct = members.length > 0 ? Math.round((active / members.length) * 100) : 0;
              return (
                <div key={role} className="rounded-xl p-3" style={{ background: `${color}07`, border: `1px solid ${color}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <p className="text-[10px] font-black capitalize" style={{ color }}>{role.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400">{active}/{members.length} active</span>
                      <span className="text-[9px] font-black" style={{ color }}>{utilPct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 mb-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${utilPct}%`, background: color }} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {members.map(m => {
                      const sc = STATUS_COLOR[m.status] || "#475569";
                      return (
                        <span key={m.id} className="text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}25` }}>
                          {m.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assignments */}
        {view === "assignments" && (
          <div className="space-y-1.5">
            {staff.filter(s => s.assigned_to).length === 0 && (
              <p className="text-slate-600 text-xs text-center py-6">No assigned staff</p>
            )}
            {staff.filter(s => s.assigned_to).map(s => {
              const rc = ROLE_COLOR[s.role] || "#64748b";
              const sc = STATUS_COLOR[s.status] || "#475569";
              return (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(0,8,20,0.7)", border: "1px solid rgba(30,41,59,0.6)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${rc}15` }}>
                    <span className="text-[8px] font-black" style={{ color: rc }}>{s.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white">{s.name}</p>
                    <p className="text-[9px] capitalize" style={{ color: rc }}>{s.role?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-300">{s.assigned_to}</p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: `${sc}15`, color: sc }}>{s.status?.replace(/_/g, " ")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}