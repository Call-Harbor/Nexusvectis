import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ChevronRight, Users, Shield, Plane, Car, Clock, AlertTriangle, RefreshCw, LogOut, Edit3 } from "lucide-react";

// --- Role definitions ---
const ROLES = [
  { id: "gate_agent", label: "Gate Agent", icon: Plane, color: "#06b6d4", description: "Opdater gate status og boarding" },
  { id: "security_officer", label: "Security Officer", icon: Shield, color: "#f59e0b", description: "Opdater kø og ventetider" },
  { id: "ground_handler", label: "Ground Handler", icon: RefreshCw, color: "#10b981", description: "Baggage og turnaround" },
  { id: "bus_driver", label: "Bus/Transport", icon: Car, color: "#8b5cf6", description: "Landside zoner og transport" },
  { id: "supervisor", label: "Supervisor", icon: Users, color: "#f43f5e", description: "Overblik og alle opdateringer" },
];

function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Medarbejder Portal</h1>
          <p className="text-slate-400 mt-1 text-sm">Vælg din rolle for at starte vagten</p>
        </div>
        <div className="space-y-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onSelect(r)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95"
                style={{ background: `${r.color}10`, borderColor: `${r.color}30` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: r.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Quick stat badge ---
function StatPill({ label, value, color = "#06b6d4", alert = false }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-bold" style={{ color: alert ? "#f43f5e" : color }}>{value}</span>
    </div>
  );
}

// --- Gate Agent Panel ---
function GateAgentPanel({ orgId }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const { data: gates = [] } = useQuery({
    queryKey: ["staff_gates", orgId],
    queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "-created_date", 50),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AirportGate.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff_gates"] }); setEditing(null); }
  });

  const STATUS_OPTIONS = ["open", "occupied", "maintenance", "closed"];
  const STATUS_COLORS = { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Mine Gates</p>
      {gates.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Ingen gates oprettet endnu</p>}
      <div className="space-y-3">
        {gates.map(g => (
          <div key={g.id} className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-white text-lg">{g.gate_code}</p>
                <p className="text-xs text-slate-500">{g.terminal}{g.concourse ? ` · ${g.concourse}` : ""}</p>
              </div>
              <button onClick={() => setEditing(editing?.id === g.id ? null : g)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: `${STATUS_COLORS[g.status] || "#06b6d4"}20`, color: STATUS_COLORS[g.status] || "#06b6d4", border: `1px solid ${STATUS_COLORS[g.status] || "#06b6d4"}40` }}>
                {g.status}
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <StatPill label="Pax venter" value={g.pax_waiting || 0} alert={(g.pax_waiting || 0) > 100} />
              <StatPill label="Boarding" value={g.boarding_active ? "Aktiv" : "Inaktiv"} color={g.boarding_active ? "#10b981" : "#64748b"} />
            </div>

            {/* Inline edit panel */}
            {editing?.id === g.id && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">STATUS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => update.mutate({ id: g.id, status: s })}
                        className="py-2.5 rounded-xl text-sm font-bold capitalize transition-all active:scale-95"
                        style={{ background: g.status === s ? `${STATUS_COLORS[s]}30` : "rgba(30,41,59,0.5)", color: STATUS_COLORS[s], border: `1px solid ${g.status === s ? STATUS_COLORS[s] : "rgba(51,65,85,0.5)"}` }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">PAX VENTER</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 25, 50, 75, 100, 150, 200].map(n => (
                      <button key={n} onClick={() => update.mutate({ id: g.id, pax_waiting: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: g.pax_waiting === n ? "rgba(6,182,212,0.25)" : "rgba(30,41,59,0.5)", color: "#06b6d4", border: `1px solid ${g.pax_waiting === n ? "#06b6d4" : "rgba(51,65,85,0.5)"}` }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">BOARDING</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ val: true, label: "Boarding aktiv" }, { val: false, label: "Boarding inaktiv" }].map(opt => (
                      <button key={String(opt.val)} onClick={() => update.mutate({ id: g.id, boarding_active: opt.val })}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: g.boarding_active === opt.val ? (opt.val ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.2)") : "rgba(30,41,59,0.5)", color: opt.val ? "#10b981" : "#94a3b8", border: `1px solid ${g.boarding_active === opt.val ? (opt.val ? "#10b981" : "#64748b") : "rgba(51,65,85,0.5)"}` }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Security Officer Panel ---
function SecurityPanel({ orgId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: lanes = [] } = useQuery({
    queryKey: ["staff_lanes", orgId],
    queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "-created_date", 30),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.SecurityLane.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff_lanes"] }); setEditing(null); }
  });

  const LANE_STATUSES = ["open", "closed", "degraded"];
  const LANE_COLORS = { open: "#10b981", closed: "#f43f5e", degraded: "#f59e0b" };
  const QUEUE_OPTIONS = [0, 10, 25, 50, 75, 100, 150, 200];
  const WAIT_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 45, 60];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Security Lanes</p>
      {lanes.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Ingen lanes oprettet endnu</p>}
      <div className="space-y-3">
        {lanes.map(l => (
          <div key={l.id} className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-white text-lg">{l.name}</p>
                <p className="text-xs text-slate-500">{l.terminal} · {l.lane_type?.replace(/_/g, " ")}</p>
              </div>
              <button onClick={() => setEditing(editing?.id === l.id ? null : l)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: `${LANE_COLORS[l.status] || "#10b981"}20`, color: LANE_COLORS[l.status] || "#10b981", border: `1px solid ${LANE_COLORS[l.status] || "#10b981"}40` }}>
                {l.status} <Edit3 className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatPill label="Kø" value={`${l.queue_length || 0} pax`} alert={(l.queue_length || 0) > 75} color="#f59e0b" />
              <StatPill label="Ventetid" value={`${l.wait_minutes || 0} min`} alert={(l.wait_minutes || 0) > 20} color={l.wait_minutes > 20 ? "#f43f5e" : "#10b981"} />
            </div>

            {editing?.id === l.id && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">LANE STATUS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {LANE_STATUSES.map(s => (
                      <button key={s} onClick={() => update.mutate({ id: l.id, status: s })}
                        className="py-2.5 rounded-xl text-sm font-bold capitalize transition-all active:scale-95"
                        style={{ background: l.status === s ? `${LANE_COLORS[s]}30` : "rgba(30,41,59,0.5)", color: LANE_COLORS[s], border: `1px solid ${l.status === s ? LANE_COLORS[s] : "rgba(51,65,85,0.5)"}` }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">KØ STØRRELSE (pax)</p>
                  <div className="flex gap-2 flex-wrap">
                    {QUEUE_OPTIONS.map(n => (
                      <button key={n} onClick={() => update.mutate({ id: l.id, queue_length: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: l.queue_length === n ? "rgba(245,158,11,0.25)" : "rgba(30,41,59,0.5)", color: "#f59e0b", border: `1px solid ${l.queue_length === n ? "#f59e0b" : "rgba(51,65,85,0.5)"}` }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">VENTETID (minutter)</p>
                  <div className="flex gap-2 flex-wrap">
                    {WAIT_OPTIONS.map(n => (
                      <button key={n} onClick={() => update.mutate({ id: l.id, wait_minutes: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: l.wait_minutes === n ? "rgba(244,63,94,0.25)" : "rgba(30,41,59,0.5)", color: "#f43f5e", border: `1px solid ${l.wait_minutes === n ? "#f43f5e" : "rgba(51,65,85,0.5)"}` }}>
                        {n} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Landside/Transport Panel ---
function LandsidePanel({ orgId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: zones = [] } = useQuery({
    queryKey: ["staff_landside", orgId],
    queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "-created_date", 50),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.LandsideZone.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff_landside"] }); setEditing(null); }
  });

  const ZONE_COLORS = { open: "#10b981", limited: "#f59e0b", closed: "#f43f5e" };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Landside Zoner</p>
      {zones.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Ingen zoner oprettet endnu</p>}
      <div className="space-y-3">
        {zones.map(z => (
          <div key={z.id} className="rounded-2xl p-4 bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-white text-lg">{z.name}</p>
                <p className="text-xs text-slate-500 capitalize">{z.facility_type?.replace(/_/g, " ")}</p>
              </div>
              <button onClick={() => setEditing(editing?.id === z.id ? null : z)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: `${ZONE_COLORS[z.status] || "#10b981"}20`, color: ZONE_COLORS[z.status] || "#10b981", border: `1px solid ${ZONE_COLORS[z.status] || "#10b981"}40` }}>
                {z.status} <Edit3 className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatPill label="Kø" value={z.queue_count || 0} color="#f59e0b" />
              <StatPill label="Vent" value={`${z.wait_minutes || 0} min`} alert={(z.wait_minutes || 0) > 15} />
              <StatPill label="Belægning" value={`${z.current_occupancy || 0}/${z.capacity || 0}`} color="#8b5cf6" />
            </div>

            {editing?.id === z.id && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">STATUS</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["open", "limited", "closed"].map(s => (
                      <button key={s} onClick={() => update.mutate({ id: z.id, status: s })}
                        className="py-2.5 rounded-xl text-sm font-bold capitalize transition-all active:scale-95"
                        style={{ background: z.status === s ? `${ZONE_COLORS[s]}30` : "rgba(30,41,59,0.5)", color: ZONE_COLORS[s], border: `1px solid ${z.status === s ? ZONE_COLORS[s] : "rgba(51,65,85,0.5)"}` }}>
                        {s === "open" ? "Åben" : s === "limited" ? "Begrænset" : "Lukket"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">KØ ANTAL</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 5, 10, 20, 30, 50].map(n => (
                      <button key={n} onClick={() => update.mutate({ id: z.id, queue_count: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                        style={{ background: z.queue_count === n ? "rgba(245,158,11,0.25)" : "rgba(30,41,59,0.5)", color: "#f59e0b", border: `1px solid ${z.queue_count === n ? "#f59e0b" : "rgba(51,65,85,0.5)"}` }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">VENTETID (min)</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 5, 10, 15, 20, 30].map(n => (
                      <button key={n} onClick={() => update.mutate({ id: z.id, wait_minutes: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                        style={{ background: z.wait_minutes === n ? "rgba(244,63,94,0.25)" : "rgba(30,41,59,0.5)", color: "#f43f5e", border: `1px solid ${z.wait_minutes === n ? "#f43f5e" : "rgba(51,65,85,0.5)"}` }}>
                        {n} min
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2 font-semibold">AKTUEL BELÆGNING</p>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 10, 25, 50, 75, 100, 150, 200].map(n => (
                      <button key={n} onClick={() => update.mutate({ id: z.id, current_occupancy: n })}
                        className="px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                        style={{ background: z.current_occupancy === n ? "rgba(139,92,246,0.25)" : "rgba(30,41,59,0.5)", color: "#8b5cf6", border: `1px solid ${z.current_occupancy === n ? "#8b5cf6" : "rgba(51,65,85,0.5)"}` }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {(z.facility_type === "bus" || z.facility_type === "train") && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2 font-semibold">NÆSTE AFGANG (min)</p>
                    <div className="flex gap-2 flex-wrap">
                      {[0, 5, 10, 15, 20, 30, 45, 60].map(n => (
                        <button key={n} onClick={() => update.mutate({ id: z.id, next_departure_minutes: n })}
                          className="px-3 py-1.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                          style={{ background: z.next_departure_minutes === n ? "rgba(16,185,129,0.25)" : "rgba(30,41,59,0.5)", color: "#10b981", border: `1px solid ${z.next_departure_minutes === n ? "#10b981" : "rgba(51,65,85,0.5)"}` }}>
                          {n} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Supervisor Panel: combined overview ---
function SupervisorPanel({ orgId }) {
  return (
    <div className="space-y-6">
      <GateAgentPanel orgId={orgId} />
      <SecurityPanel orgId={orgId} />
      <LandsidePanel orgId={orgId} />
    </div>
  );
}

// --- Main page ---
export default function StaffPortal() {
  const [role, setRole] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || null)).catch(() => {});
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  if (!role) return <RoleSelector onSelect={setRole} />;

  const RoleIcon = role.icon;
  const panelMap = {
    gate_agent: <GateAgentPanel orgId={orgId} />,
    security_officer: <SecurityPanel orgId={orgId} />,
    ground_handler: <LandsidePanel orgId={orgId} />,
    bus_driver: <LandsidePanel orgId={orgId} />,
    supervisor: <SupervisorPanel orgId={orgId} />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.95)", borderBottom: `1px solid ${role.color}20`, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
            <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{role.label}</p>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{currentTime.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setRole(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-all"
          style={{ border: "1px solid rgba(51,65,85,0.5)" }}>
          <LogOut className="w-3.5 h-3.5" /> Skift rolle
        </button>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 max-w-lg mx-auto">
        <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2 text-xs"
          style={{ background: `${role.color}08`, border: `1px solid ${role.color}20` }}>
          <CheckCircle className="w-3.5 h-3.5" style={{ color: role.color }} />
          <span style={{ color: `${role.color}cc` }}>Tryk på et kort for at opdatere data — ændringer er øjeblikkelige</span>
        </div>
        {panelMap[role.id]}
      </div>
    </div>
  );
}