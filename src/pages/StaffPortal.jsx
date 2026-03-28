import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight, Shield, Plane, Car, Clock, LogOut, Edit3, Plus, Minus,
  CheckCircle2, AlertTriangle, Users, RefreshCw, ChevronDown, ChevronUp,
  Activity, Send, Zap, TrendingUp, TrendingDown
} from "lucide-react";

// ─── Role config ────────────────────────────────────────────────
const ROLES = [
  { id: "gate_agent",       label: "Gate Agent",        icon: Plane,     color: "#06b6d4", desc: "Boarding, pax og gate status" },
  { id: "security_officer", label: "Security Officer",  icon: Shield,    color: "#f59e0b", desc: "Kø, ventetid og lane status" },
  { id: "bus_driver",       label: "Transport / Landside", icon: Car,    color: "#8b5cf6", desc: "Zoner, køer og afgangstider" },
  { id: "supervisor",       label: "Supervisor",        icon: Users,     color: "#f43f5e", desc: "Fuldt overblik og alle moduler" },
];

// ─── Shift log (session-only) ────────────────────────────────────
function useShiftLog() {
  const [log, setLog] = useState([]);
  const add = (msg, type = "info") => {
    setLog(l => [{ msg, type, time: new Date() }, ...l].slice(0, 30));
  };
  return { log, add };
}

// ─── Helpers ────────────────────────────────────────────────────
function now() { return new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }); }

function Stepper({ value, onChange, min = 0, max = 999, step = 1, color = "#06b6d4" }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, (value || 0) - step))}
        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.6)" }}>
        <Minus className="w-4 h-4 text-slate-300" />
      </button>
      <span className="w-14 text-center text-xl font-bold" style={{ color }}>{value ?? 0}</span>
      <button onClick={() => onChange(Math.min(max, (value || 0) + step))}
        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(51,65,85,0.6)" }}>
        <Plus className="w-4 h-4 text-slate-300" />
      </button>
    </div>
  );
}

function QuickChips({ options, value, onChange, color = "#06b6d4", format = v => v }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{
            background: value === o ? `${color}30` : "rgba(30,41,59,0.6)",
            color: value === o ? color : "#64748b",
            border: `1px solid ${value === o ? color : "rgba(51,65,85,0.4)"}`
          }}>
          {format(o)}
        </button>
      ))}
    </div>
  );
}

function StatusRow({ label, value, alert, color = "#06b6d4" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold" style={{ color: alert ? "#f43f5e" : color }}>
        {alert && <AlertTriangle className="inline w-3 h-3 mr-1" />}{value}
      </span>
    </div>
  );
}

function SaveBtn({ onClick, loading, label = "Gem ændringer", color = "#06b6d4" }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
      style={{ background: `${color}25`, border: `1px solid ${color}50`, color }}>
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      {loading ? "Gemmer..." : label}
    </button>
  );
}

// ─── GATE AGENT ─────────────────────────────────────────────────
function GateAgentPanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: gates = [] } = useQuery({
    queryKey: ["sp_gates", orgId],
    queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 50),
    enabled: !!orgId, refetchInterval: 15000,
  });
  const { data: flights = [] } = useQuery({
    queryKey: ["sp_flights", orgId],
    queryFn: () => base44.entities.Flight.filter({ organization_id: orgId }, "-created_date", 100),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const flightMap = Object.fromEntries(flights.map(f => [f.id, f]));

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AirportGate.update(id, d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sp_gates"] });
      logAdd(`Gate ${vars.gate_code || vars.id}: opdateret`, "success");
      setOpenId(null);
    }
  });

  const S_COLORS = { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" };
  const S_LABELS = { open: "Åben", occupied: "Optaget", maintenance: "Vedligehold", closed: "Lukket" };

  const openGate = (g) => {
    setOpenId(openId === g.id ? null : g.id);
    if (!drafts[g.id]) setDrafts(d => ({ ...d, [g.id]: { ...g } }));
  };

  const setD = (id, key, val) => setDrafts(d => ({ ...d, [id]: { ...d[id], [key]: val } }));

  const FLIGHT_STATUSES = { boarding: "#10b981", delayed: "#f43f5e", at_gate: "#06b6d4", scheduled: "#8b5cf6", landed: "#f59e0b" };

  return (
    <div className="space-y-3">
      <SectionHeader icon={Plane} label="Gates" count={gates.length} color="#06b6d4" />
      {gates.length === 0 && <EmptyState text="Ingen gates oprettet" />}
      {gates.map(g => {
        const isOpen = openId === g.id;
        const d = drafts[g.id] || g;
        const flight = g.current_flight_id ? flightMap[g.current_flight_id] : null;
        const sc = S_COLORS[g.status] || "#64748b";
        const paxAlert = (g.pax_waiting || 0) > 120;

        return (
          <div key={g.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${isOpen ? sc + "40" : "rgba(51,65,85,0.5)"}`, background: "rgba(2,8,23,0.7)" }}>
            {/* Header row */}
            <button className="w-full flex items-center gap-3 p-4" onClick={() => openGate(g)}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${sc}15`, border: `1px solid ${sc}30` }}>
                <span className="font-black text-sm" style={{ color: sc }}>{g.gate_code}</span>
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">{g.gate_code}</span>
                  {g.terminal && <span className="text-xs text-slate-500">{g.terminal}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{S_LABELS[g.status]}</span>
                  {g.boarding_active && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">Boarding ▶</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  {flight && <span style={{ color: FLIGHT_STATUSES[flight.status] || "#94a3b8" }}>{flight.flight_number} · {flight.origin}→{flight.destination}</span>}
                  <span className={paxAlert ? "text-red-400 font-bold" : ""}>{g.pax_waiting || 0} pax venter</span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Edit panel */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-slate-800/60">
                {/* Status */}
                <div className="pt-4">
                  <Label>Gate Status</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(S_LABELS).map(([s, label]) => (
                      <button key={s} onClick={() => setD(g.id, "status", s)}
                        className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: d.status === s ? `${S_COLORS[s]}25` : "rgba(30,41,59,0.5)", color: S_COLORS[s], border: `1px solid ${d.status === s ? S_COLORS[s] : "rgba(51,65,85,0.4)"}` }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boarding */}
                <div>
                  <Label>Boarding</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[{ v: true, l: "▶ Boarding aktiv", c: "#10b981" }, { v: false, l: "⏸ Boarding inaktiv", c: "#64748b" }].map(opt => (
                      <button key={String(opt.v)} onClick={() => setD(g.id, "boarding_active", opt.v)}
                        className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: d.boarding_active === opt.v ? `${opt.c}25` : "rgba(30,41,59,0.5)", color: opt.c, border: `1px solid ${d.boarding_active === opt.v ? opt.c : "rgba(51,65,85,0.4)"}` }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pax venter */}
                <div>
                  <Label>Pax venter ved gate</Label>
                  <div className="flex items-center justify-between mt-2">
                    <Stepper value={d.pax_waiting || 0} onChange={v => setD(g.id, "pax_waiting", v)} step={5} color="#06b6d4" />
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Hurtigvalg</p>
                      <QuickChips options={[0, 50, 100, 150, 200, 250]} value={d.pax_waiting} onChange={v => setD(g.id, "pax_waiting", v)} color="#06b6d4" />
                    </div>
                  </div>
                </div>

                {/* Pax ombord */}
                {flight && (
                  <div>
                    <Label>Pax ombord (boarding fremskridt)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Stepper value={d.pax_boarded || 0} onChange={v => setD(g.id, "pax_boarded", v)} step={10} color="#10b981" />
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, ((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">{Math.round(((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%</span>
                    </div>
                  </div>
                )}

                <SaveBtn onClick={() => update.mutate({ ...d, gate_code: g.gate_code })} loading={update.isPending} color="#06b6d4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SECURITY OFFICER ────────────────────────────────────────────
function SecurityPanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: lanes = [] } = useQuery({
    queryKey: ["sp_lanes", orgId],
    queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.SecurityLane.update(id, d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sp_lanes"] });
      logAdd(`Lane ${vars.name || vars.id}: opdateret`, "success");
      setOpenId(null);
    }
  });

  const S_COLORS = { open: "#10b981", closed: "#f43f5e", degraded: "#f59e0b" };
  const S_LABELS = { open: "Åben", closed: "Lukket", degraded: "Degraderet" };

  const openLane = (l) => {
    setOpenId(openId === l.id ? null : l.id);
    if (!drafts[l.id]) setDrafts(d => ({ ...d, [l.id]: { ...l } }));
  };
  const setD = (id, key, val) => setDrafts(d => ({ ...d, [id]: { ...d[id], [key]: val } }));

  const totalQueue = lanes.reduce((s, l) => s + (l.queue_length || 0), 0);
  const avgWait = lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0;
  const criticalLanes = lanes.filter(l => l.wait_minutes > 20 || l.status === "degraded");

  return (
    <div className="space-y-3">
      <SectionHeader icon={Shield} label="Security Lanes" count={lanes.length} color="#f59e0b" />

      {/* Summary bar */}
      {lanes.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Total kø" value={totalQueue} unit="pax" alert={totalQueue > 200} color="#f59e0b" />
          <MiniStat label="Avg. ventetid" value={avgWait} unit="min" alert={avgWait > 20} color={avgWait > 20 ? "#f43f5e" : "#10b981"} />
          <MiniStat label="Kritiske" value={criticalLanes.length} unit="lanes" alert={criticalLanes.length > 0} color="#f43f5e" />
        </div>
      )}

      {lanes.length === 0 && <EmptyState text="Ingen security lanes oprettet" />}
      {lanes.map(l => {
        const isOpen = openId === l.id;
        const d = drafts[l.id] || l;
        const sc = S_COLORS[l.status] || "#64748b";
        const staffShortage = (l.staff_assigned || 0) < (l.staff_required || 2);

        return (
          <div key={l.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${isOpen ? sc + "40" : "rgba(51,65,85,0.5)"}`, background: "rgba(2,8,23,0.7)" }}>
            <button className="w-full flex items-center gap-3 p-4" onClick={() => openLane(l)}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${sc}15`, border: `1px solid ${sc}30` }}>
                <Shield className="w-5 h-5" style={{ color: sc }} />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">{l.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{S_LABELS[l.status]}</span>
                  {staffShortage && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400">⚠ Understaffed</span>}
                </div>
                <div className="flex gap-3 mt-1 text-xs">
                  <span className={l.queue_length > 75 ? "text-amber-400 font-bold" : "text-slate-500"}>Kø: {l.queue_length || 0} pax</span>
                  <span className={l.wait_minutes > 20 ? "text-red-400 font-bold" : "text-slate-500"}>Vent: {l.wait_minutes || 0} min</span>
                  <span className="text-slate-500">Staff: {l.staff_assigned || 0}/{l.staff_required || 2}</span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-slate-800/60">
                <div className="pt-4">
                  <Label>Lane Status</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(S_LABELS).map(([s, label]) => (
                      <button key={s} onClick={() => setD(l.id, "status", s)}
                        className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: d.status === s ? `${S_COLORS[s]}25` : "rgba(30,41,59,0.5)", color: S_COLORS[s], border: `1px solid ${d.status === s ? S_COLORS[s] : "rgba(51,65,85,0.4)"}` }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Kø størrelse (pax)</Label>
                    {d.queue_length > 75 && <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Høj belastning</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Stepper value={d.queue_length || 0} onChange={v => setD(l.id, "queue_length", v)} step={5} color="#f59e0b" />
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (d.queue_length || 0) / 2)}%`, background: d.queue_length > 150 ? "#f43f5e" : d.queue_length > 75 ? "#f59e0b" : "#10b981" }} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label>Ventetid (minutter)</Label>
                    {d.wait_minutes > 20 && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Over SLA (20 min)</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Stepper value={d.wait_minutes || 0} onChange={v => setD(l.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                    <QuickChips options={[0, 5, 10, 15, 20, 25, 30, 45]} value={d.wait_minutes} onChange={v => setD(l.id, "wait_minutes", v)} color="#f43f5e" format={v => `${v}m`} />
                  </div>
                </div>

                <div>
                  <Label>Personale til stede / Krævet</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Til stede</p>
                      <Stepper value={d.staff_assigned || 0} onChange={v => setD(l.id, "staff_assigned", v)} step={1} color="#10b981" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Krævet</p>
                      <Stepper value={d.staff_required || 2} onChange={v => setD(l.id, "staff_required", v)} step={1} color="#8b5cf6" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Throughput (pax/time)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Stepper value={d.throughput_per_hour || 180} onChange={v => setD(l.id, "throughput_per_hour", v)} step={10} color="#06b6d4" />
                    <QuickChips options={[120, 150, 180, 200, 240, 300]} value={d.throughput_per_hour} onChange={v => setD(l.id, "throughput_per_hour", v)} color="#06b6d4" />
                  </div>
                </div>

                <SaveBtn onClick={() => update.mutate({ ...d, name: l.name })} loading={update.isPending} color="#f59e0b" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LANDSIDE / TRANSPORT ────────────────────────────────────────
function LandsidePanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: zones = [] } = useQuery({
    queryKey: ["sp_landside", orgId],
    queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.LandsideZone.update(id, d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sp_landside"] });
      logAdd(`Zone ${vars.name || vars.id}: opdateret`, "success");
      setOpenId(null);
    }
  });

  const S_COLORS = { open: "#10b981", limited: "#f59e0b", closed: "#f43f5e" };
  const S_LABELS = { open: "Åben", limited: "Begrænset", closed: "Lukket" };
  const F_ICONS = { taxi: "🚕", bus: "🚌", train: "🚆", parking: "🅿️", checkin: "✈️", security: "🛡️", immigration: "🛂", baggage_reclaim: "🧳" };

  const openZone = (z) => {
    setOpenId(openId === z.id ? null : z.id);
    if (!drafts[z.id]) setDrafts(d => ({ ...d, [z.id]: { ...z } }));
  };
  const setD = (id, key, val) => setDrafts(d => ({ ...d, [id]: { ...d[id], [key]: val } }));

  const occupancyPct = (z) => z.capacity > 0 ? Math.round((z.current_occupancy || 0) / z.capacity * 100) : 0;

  return (
    <div className="space-y-3">
      <SectionHeader icon={Car} label="Landside Zoner" count={zones.length} color="#8b5cf6" />
      {zones.length === 0 && <EmptyState text="Ingen zoner oprettet" />}
      {zones.map(z => {
        const isOpen = openId === z.id;
        const d = drafts[z.id] || z;
        const sc = S_COLORS[z.status] || "#64748b";
        const occ = occupancyPct(z);
        const isTransport = z.facility_type === "bus" || z.facility_type === "train";

        return (
          <div key={z.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${isOpen ? sc + "40" : "rgba(51,65,85,0.5)"}`, background: "rgba(2,8,23,0.7)" }}>
            <button className="w-full flex items-center gap-3 p-4" onClick={() => openZone(z)}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${sc}15`, border: `1px solid ${sc}30` }}>
                {F_ICONS[z.facility_type] || "🏢"}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white">{z.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{S_LABELS[z.status]}</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span>Kø: {z.queue_count || 0}</span>
                  <span className={(z.wait_minutes || 0) > 15 ? "text-amber-400" : ""}>Vent: {z.wait_minutes || 0} min</span>
                  {z.capacity > 0 && <span className={occ > 90 ? "text-red-400 font-bold" : ""}>{z.current_occupancy || 0}/{z.capacity} ({occ}%)</span>}
                  {isTransport && z.next_departure_minutes !== undefined && z.next_departure_minutes !== null && (
                    <span className="text-violet-400">Afgang: {z.next_departure_minutes} min</span>
                  )}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-slate-800/60">
                <div className="pt-4">
                  <Label>Zone Status</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(S_LABELS).map(([s, label]) => (
                      <button key={s} onClick={() => setD(z.id, "status", s)}
                        className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: d.status === s ? `${S_COLORS[s]}25` : "rgba(30,41,59,0.5)", color: S_COLORS[s], border: `1px solid ${d.status === s ? S_COLORS[s] : "rgba(51,65,85,0.4)"}` }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Kø antal</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Stepper value={d.queue_count || 0} onChange={v => setD(z.id, "queue_count", v)} step={1} color="#f59e0b" />
                    <QuickChips options={[0, 5, 10, 20, 30, 50]} value={d.queue_count} onChange={v => setD(z.id, "queue_count", v)} color="#f59e0b" />
                  </div>
                </div>

                <div>
                  <Label>Ventetid (minutter)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Stepper value={d.wait_minutes || 0} onChange={v => setD(z.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                    <QuickChips options={[0, 5, 10, 15, 20, 30]} value={d.wait_minutes} onChange={v => setD(z.id, "wait_minutes", v)} color="#f43f5e" format={v => `${v}m`} />
                  </div>
                </div>

                {z.capacity > 0 && (
                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Aktuel belægning</Label>
                      <span className="text-xs font-bold" style={{ color: occ > 90 ? "#f43f5e" : occ > 70 ? "#f59e0b" : "#10b981" }}>{occ}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Stepper value={d.current_occupancy || 0} onChange={v => setD(z.id, "current_occupancy", v)} step={5} color="#8b5cf6" />
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, occ)}%`, background: occ > 90 ? "#f43f5e" : occ > 70 ? "#f59e0b" : "#8b5cf6" }} />
                      </div>
                    </div>
                  </div>
                )}

                {isTransport && (
                  <div>
                    <Label>Næste afgang (minutter)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Stepper value={d.next_departure_minutes || 0} onChange={v => setD(z.id, "next_departure_minutes", v)} step={1} color="#10b981" />
                      <QuickChips options={[0, 5, 10, 15, 20, 30, 45, 60]} value={d.next_departure_minutes} onChange={v => setD(z.id, "next_departure_minutes", v)} color="#10b981" format={v => `${v}m`} />
                    </div>
                  </div>
                )}

                {isTransport && (
                  <div>
                    <Label>Forsinkelse (minutter)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Stepper value={d.delay_minutes || 0} onChange={v => setD(z.id, "delay_minutes", v)} step={1} color="#f43f5e" />
                      {(d.delay_minutes || 0) > 0 && <span className="text-xs text-red-400 font-bold">⚠ Forsinket</span>}
                    </div>
                  </div>
                )}

                <SaveBtn onClick={() => update.mutate({ ...d, name: z.name })} loading={update.isPending} color="#8b5cf6" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SUPERVISOR ──────────────────────────────────────────────────
function SupervisorPanel({ orgId, logAdd }) {
  const { data: gates = [] } = useQuery({ queryKey: ["sp_gates", orgId], queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 50), enabled: !!orgId, refetchInterval: 15000 });
  const { data: lanes = [] } = useQuery({ queryKey: ["sp_lanes", orgId], queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30), enabled: !!orgId, refetchInterval: 15000 });
  const { data: zones = [] } = useQuery({ queryKey: ["sp_landside", orgId], queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50), enabled: !!orgId, refetchInterval: 20000 });

  const alerts = [
    ...lanes.filter(l => l.wait_minutes > 20).map(l => ({ text: `${l.name}: ventetid ${l.wait_minutes} min (over SLA)`, sev: "critical" })),
    ...lanes.filter(l => l.status === "degraded").map(l => ({ text: `${l.name}: degraderet lane`, sev: "critical" })),
    ...lanes.filter(l => (l.staff_assigned || 0) < (l.staff_required || 2)).map(l => ({ text: `${l.name}: understaffed (${l.staff_assigned || 0}/${l.staff_required || 2})`, sev: "warning" })),
    ...zones.filter(z => z.status === "closed").map(z => ({ text: `Zone "${z.name}" lukket`, sev: "warning" })),
    ...gates.filter(g => (g.pax_waiting || 0) > 120).map(g => ({ text: `Gate ${g.gate_code}: ${g.pax_waiting} pax venter`, sev: "warning" })),
  ];

  return (
    <div className="space-y-6">
      {/* Alert summary */}
      {alerts.length > 0 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {alerts.length} Aktive advarsler</p>
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5" style={{ color: a.sev === "critical" ? "#f43f5e" : "#f59e0b" }}>•</span>
              <span className="text-slate-300">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Åbne gates" value={gates.filter(g => g.status === "open" || g.status === "occupied").length} unit={`/ ${gates.length}`} color="#06b6d4" />
        <MiniStat label="Boarding aktiv" value={gates.filter(g => g.boarding_active).length} unit="gates" color="#10b981" />
        <MiniStat label="Avg. security vent" value={lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0} unit="min" alert={lanes.length && lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length > 20} color="#f59e0b" />
        <MiniStat label="Lukkede zoner" value={zones.filter(z => z.status === "closed").length} unit={`/ ${zones.length}`} alert={zones.filter(z => z.status === "closed").length > 0} color="#f43f5e" />
      </div>

      <GateAgentPanel orgId={orgId} logAdd={logAdd} />
      <SecurityPanel orgId={orgId} logAdd={logAdd} />
      <LandsidePanel orgId={orgId} logAdd={logAdd} />
    </div>
  );
}

// ─── Shift log sidebar ───────────────────────────────────────────
function ShiftLog({ log }) {
  if (log.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(2,8,23,0.5)" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3"><Activity className="w-3.5 h-3.5" /> Vagtlog</p>
      <div className="space-y-1.5">
        {log.slice(0, 10).map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 w-10 flex-shrink-0">{e.time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className={e.type === "success" ? "text-emerald-400" : e.type === "alert" ? "text-amber-400" : "text-slate-400"}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared mini components ──────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, color }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      <span className="ml-auto text-xs text-slate-600">{count} enheder</span>
    </div>
  );
}

function MiniStat({ label, value, unit, color = "#06b6d4", alert = false }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-xl font-black" style={{ color: alert ? "#f43f5e" : color }}>{value} <span className="text-xs font-normal text-slate-500">{unit}</span></p>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="text-slate-600 text-sm text-center py-8">{text}</p>;
}

function Label({ children }) {
  return <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

// ─── Role selector ───────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Medarbejder Portal</h1>
          <p className="text-slate-400 mt-1 text-sm">Vælg din rolle for at starte vagten</p>
        </div>
        <div className="space-y-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onSelect(r)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-98"
                style={{ background: `${r.color}08`, borderColor: `${r.color}25` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: r.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white">{r.label}</p>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function StaffPortal() {
  const [role, setRole] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [time, setTime] = useState(new Date());
  const { log, add: logAdd } = useShiftLog();

  useEffect(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || null)).catch(() => {});
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!role) return <RoleSelector onSelect={r => { setRole(r); logAdd(`Vagt startet som ${r.label}`, "info"); }} />;

  const RoleIcon = role.icon;
  const panelMap = {
    gate_agent: <GateAgentPanel orgId={orgId} logAdd={logAdd} />,
    security_officer: <SecurityPanel orgId={orgId} logAdd={logAdd} />,
    bus_driver: <LandsidePanel orgId={orgId} logAdd={logAdd} />,
    supervisor: <SupervisorPanel orgId={orgId} logAdd={logAdd} />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.96)", borderBottom: `2px solid ${role.color}20`, backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
            <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{role.label}</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
              {log.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px]" style={{ background: `${role.color}20`, color: role.color }}>{log.length} ændringer</span>}
            </p>
          </div>
        </div>
        <button onClick={() => setRole(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-800 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Skift rolle
        </button>
      </div>

      {/* Body */}
      <div className="p-4 pb-20 max-w-lg mx-auto">
        <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2 text-xs"
          style={{ background: `${role.color}06`, border: `1px solid ${role.color}18` }}>
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: role.color }} />
          <span className="text-slate-400">Tryk på et kort → rediger → Gem. Alle ændringer vises live i Airport Ops Center.</span>
        </div>

        {panelMap[role.id]}
        <ShiftLog log={log} />
      </div>
    </div>
  );
}