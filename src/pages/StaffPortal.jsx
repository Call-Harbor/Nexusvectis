import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight, Shield, Plane, Car, Clock, LogOut,
  CheckCircle2, AlertTriangle, Users, RefreshCw,
  ChevronDown, ChevronUp, Activity, Zap, Plus, Minus,
  TrendingUp, Home
} from "lucide-react";

const ROLES = [
  { id: "gate_agent",       label: "Gate Agent",      icon: Plane,  color: "#06b6d4", desc: "Boarding & gate status" },
  { id: "security_officer", label: "Security",         icon: Shield, color: "#f59e0b", desc: "Kø & ventetider" },
  { id: "bus_driver",       label: "Transport",        icon: Car,    color: "#8b5cf6", desc: "Landside zoner" },
  { id: "supervisor",       label: "Supervisor",       icon: Users,  color: "#f43f5e", desc: "Fuldt overblik" },
];

function useShiftLog() {
  const [log, setLog] = useState([]);
  const add = (msg, type = "info") =>
    setLog(l => [{ msg, type, time: new Date() }, ...l].slice(0, 20));
  return { log, add };
}

// ── Stepper ──────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, step = 1, color = "#06b6d4" }) {
  return (
    <div className="flex items-center gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(51,65,85,0.6)" }}>
      <button
        onPointerDown={e => { e.preventDefault(); onChange(Math.max(min, (value || 0) - step)); }}
        className="w-14 h-14 flex items-center justify-center text-xl font-bold active:bg-slate-700 transition-colors"
        style={{ background: "rgba(30,41,59,0.9)", color: "#94a3b8" }}>
        −
      </button>
      <div className="flex-1 h-14 flex items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{value ?? 0}</span>
      </div>
      <button
        onPointerDown={e => { e.preventDefault(); onChange((value || 0) + step); }}
        className="w-14 h-14 flex items-center justify-center text-xl font-bold active:bg-slate-700 transition-colors"
        style={{ background: "rgba(30,41,59,0.9)", color: "#94a3b8" }}>
        +
      </button>
    </div>
  );
}

// ── Chips row ────────────────────────────────────────────────────
function Chips({ options, value, onChange, color = "#06b6d4", fmt = v => v }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o}
          onPointerDown={e => { e.preventDefault(); onChange(o); }}
          className="h-10 px-4 rounded-xl text-sm font-bold transition-colors active:scale-95"
          style={{
            background: value === o ? `${color}30` : "rgba(30,41,59,0.7)",
            color: value === o ? color : "#64748b",
            border: `1.5px solid ${value === o ? color : "rgba(51,65,85,0.5)"}`
          }}>
          {fmt(o)}
        </button>
      ))}
    </div>
  );
}

// ── Status grid ──────────────────────────────────────────────────
function StatusGrid({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(o => (
        <button key={o.val}
          onPointerDown={e => { e.preventDefault(); onChange(o.val); }}
          className="h-14 rounded-2xl text-sm font-bold transition-all active:scale-95"
          style={{
            background: value === o.val ? `${o.color}25` : "rgba(20,30,50,0.6)",
            color: o.color,
            border: `2px solid ${value === o.val ? o.color : "rgba(51,65,85,0.4)"}`
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Save button ──────────────────────────────────────────────────
function SaveBtn({ onClick, loading, color = "#06b6d4" }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); if (!loading) onClick(); }}
      disabled={loading}
      className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all"
      style={{ background: `${color}20`, border: `2px solid ${color}60`, color }}>
      {loading
        ? <><RefreshCw className="w-5 h-5 animate-spin" /> Gemmer...</>
        : <><CheckCircle2 className="w-5 h-5" /> Gem ændringer</>}
    </button>
  );
}

// ── Field wrapper ────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {hint && <p className="text-xs" style={{ color: hint.color }}>{hint.text}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Section divider ──────────────────────────────────────────────
function Section({ title, color, children }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color }}>
        <span className="w-1 h-3 rounded-full inline-block" style={{ background: color }} />
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Alert pill ───────────────────────────────────────────────────
function AlertPill({ text, sev }) {
  const c = sev === "critical" ? "#f43f5e" : "#f59e0b";
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: `${c}10`, border: `1px solid ${c}30` }}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: c }} />
      <span style={{ color: c }}>{text}</span>
    </div>
  );
}

// ── Mini KPI card ────────────────────────────────────────────────
function KPI({ label, value, unit, color = "#06b6d4", alert }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: `${color}08`, border: `1.5px solid ${color}20` }}>
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color: alert ? "#f43f5e" : color }}>{value}</p>
      {unit && <p className="text-[10px] text-slate-500 mt-0.5">{unit}</p>}
    </div>
  );
}

// ─── GATE AGENT ─────────────────────────────────────────────────
function GateAgentPanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: gates = [], isLoading } = useQuery({
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
      logAdd(`Gate ${vars.gate_code || vars.id} opdateret`, "success");
      setOpenId(null);
    }
  });

  const SC = { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" };
  const SL = { open: "Åben", occupied: "Optaget", maintenance: "Vedligehold", closed: "Lukket" };
  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));

  const toggle = (g) => {
    const next = openId === g.id ? null : g.id;
    setOpenId(next);
    if (next && !drafts[g.id]) setDrafts(d => ({ ...d, [g.id]: { ...g } }));
  };

  if (isLoading) return <Loader />;

  return (
    <Section title="Gates" color="#06b6d4">
      {gates.length === 0 && <Empty text="Ingen gates endnu" />}
      <div className="space-y-2">
        {gates.map(g => {
          const isOpen = openId === g.id;
          const d = drafts[g.id] || g;
          const sc = SC[g.status] || "#64748b";
          const flight = g.current_flight_id ? flightMap[g.current_flight_id] : null;

          return (
            <div key={g.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${isOpen ? sc : "rgba(51,65,85,0.4)"}`, background: "rgba(5,15,35,0.8)" }}>
              {/* Card header — big tap target */}
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(g)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg" style={{ background: `${sc}18`, color: sc }}>
                  {g.gate_code}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{g.gate_code}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{SL[g.status]}</span>
                    {g.boarding_active && <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400">▶ Boarding</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {flight ? `${flight.flight_number} · ${flight.origin}→${flight.destination}` : g.terminal || "Ingen fly tilknyttet"}
                    {(g.pax_waiting || 0) > 0 && <span className={(g.pax_waiting || 0) > 120 ? " text-amber-400 font-bold" : ""}> · {g.pax_waiting} pax venter</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 text-slate-600">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                  <Field label="Gate Status">
                    <StatusGrid
                      value={d.status}
                      onChange={v => setD(g.id, "status", v)}
                      options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))}
                    />
                  </Field>

                  <Field label="Boarding">
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: true, l: "▶ Aktiv", c: "#10b981" }, { v: false, l: "⏸ Inaktiv", c: "#64748b" }].map(o => (
                        <button key={String(o.v)}
                          onPointerDown={e => { e.preventDefault(); setD(g.id, "boarding_active", o.v); }}
                          className="h-14 rounded-2xl text-sm font-bold active:scale-95 transition-all"
                          style={{ background: d.boarding_active === o.v ? `${o.c}25` : "rgba(20,30,50,0.6)", color: o.c, border: `2px solid ${d.boarding_active === o.v ? o.c : "rgba(51,65,85,0.4)"}` }}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Pax venter ved gate"
                    hint={(d.pax_waiting || 0) > 120 ? { text: "⚠ Mange pax", color: "#f59e0b" } : null}>
                    <Stepper value={d.pax_waiting || 0} onChange={v => setD(g.id, "pax_waiting", v)} step={5} color="#06b6d4" />
                    <Chips options={[0, 25, 50, 75, 100, 150, 200]} value={d.pax_waiting} onChange={v => setD(g.id, "pax_waiting", v)} color="#06b6d4" />
                  </Field>

                  {flight && (
                    <Field label="Pax ombord">
                      <Stepper value={d.pax_boarded || 0} onChange={v => setD(g.id, "pax_boarded", v)} step={10} color="#10b981" />
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(100, ((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-center text-slate-500 mt-1">
                        {d.pax_boarded || 0} / {flight.pax_total || "?"} pax ({Math.round(((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%)
                      </p>
                    </Field>
                  )}

                  <SaveBtn onClick={() => update.mutate({ ...d, gate_code: g.gate_code })} loading={update.isPending} color="#06b6d4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── SECURITY ────────────────────────────────────────────────────
function SecurityPanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: lanes = [], isLoading } = useQuery({
    queryKey: ["sp_lanes", orgId],
    queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30),
    enabled: !!orgId, refetchInterval: 15000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.SecurityLane.update(id, d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sp_lanes"] });
      logAdd(`Lane ${vars.name || vars.id} opdateret`, "success");
      setOpenId(null);
    }
  });

  const SC = { open: "#10b981", closed: "#f43f5e", degraded: "#f59e0b" };
  const SL = { open: "Åben", closed: "Lukket", degraded: "Degraderet" };
  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));

  const toggle = (l) => {
    const next = openId === l.id ? null : l.id;
    setOpenId(next);
    if (next && !drafts[l.id]) setDrafts(d => ({ ...d, [l.id]: { ...l } }));
  };

  const totalQueue = lanes.reduce((s, l) => s + (l.queue_length || 0), 0);
  const avgWait = lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0;

  if (isLoading) return <Loader />;

  return (
    <Section title="Security Lanes" color="#f59e0b">
      {lanes.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <KPI label="Total kø" value={totalQueue} unit="pax" color="#f59e0b" alert={totalQueue > 200} />
          <KPI label="Avg. ventetid" value={`${avgWait} min`} color={avgWait > 20 ? "#f43f5e" : "#10b981"} alert={avgWait > 20} />
        </div>
      )}
      {lanes.length === 0 && <Empty text="Ingen security lanes endnu" />}
      <div className="space-y-2">
        {lanes.map(l => {
          const isOpen = openId === l.id;
          const d = drafts[l.id] || l;
          const sc = SC[l.status] || "#64748b";
          const short = (l.staff_assigned || 0) < (l.staff_required || 2);

          return (
            <div key={l.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${isOpen ? sc : "rgba(51,65,85,0.4)"}`, background: "rgba(5,15,35,0.8)" }}>
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(l)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${sc}18` }}>
                  <Shield className="w-6 h-6" style={{ color: sc }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{l.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{SL[l.status]}</span>
                    {short && <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/20 text-red-400">⚠ Understaffed</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs">
                    <span className={(l.queue_length || 0) > 75 ? "text-amber-400 font-bold" : "text-slate-500"}>Kø: {l.queue_length || 0}</span>
                    <span className={(l.wait_minutes || 0) > 20 ? "text-red-400 font-bold" : "text-slate-500"}>Vent: {l.wait_minutes || 0} min</span>
                    <span className="text-slate-500">Staff: {l.staff_assigned || 0}/{l.staff_required || 2}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                  <Field label="Lane Status">
                    <StatusGrid value={d.status} onChange={v => setD(l.id, "status", v)}
                      options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))} />
                  </Field>

                  <Field label="Kø størrelse (pax)"
                    hint={(d.queue_length || 0) > 75 ? { text: "Høj belastning", color: "#f59e0b" } : null}>
                    <Stepper value={d.queue_length || 0} onChange={v => setD(l.id, "queue_length", v)} step={5} color="#f59e0b" />
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (d.queue_length || 0) / 2)}%`, background: (d.queue_length || 0) > 150 ? "#f43f5e" : (d.queue_length || 0) > 75 ? "#f59e0b" : "#10b981" }} />
                    </div>
                    <Chips options={[0, 25, 50, 75, 100, 150]} value={d.queue_length} onChange={v => setD(l.id, "queue_length", v)} color="#f59e0b" />
                  </Field>

                  <Field label="Ventetid (minutter)"
                    hint={(d.wait_minutes || 0) > 20 ? { text: "Over SLA", color: "#f43f5e" } : null}>
                    <Stepper value={d.wait_minutes || 0} onChange={v => setD(l.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                    <Chips options={[0, 5, 10, 15, 20, 25, 30, 45]} value={d.wait_minutes} onChange={v => setD(l.id, "wait_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                  </Field>

                  <Field label="Personale til stede / Krævet">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-2 text-center">Til stede</p>
                        <Stepper value={d.staff_assigned || 0} onChange={v => setD(l.id, "staff_assigned", v)} step={1} color="#10b981" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2 text-center">Krævet</p>
                        <Stepper value={d.staff_required || 2} onChange={v => setD(l.id, "staff_required", v)} step={1} color="#8b5cf6" />
                      </div>
                    </div>
                  </Field>

                  <Field label="Throughput (pax/time)">
                    <Stepper value={d.throughput_per_hour || 180} onChange={v => setD(l.id, "throughput_per_hour", v)} step={10} color="#06b6d4" />
                    <Chips options={[120, 150, 180, 200, 240, 300]} value={d.throughput_per_hour} onChange={v => setD(l.id, "throughput_per_hour", v)} color="#06b6d4" />
                  </Field>

                  <SaveBtn onClick={() => update.mutate({ ...d, name: l.name })} loading={update.isPending} color="#f59e0b" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── LANDSIDE ────────────────────────────────────────────────────
function LandsidePanel({ orgId, logAdd }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["sp_landside", orgId],
    queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50),
    enabled: !!orgId, refetchInterval: 20000,
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.LandsideZone.update(id, d),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sp_landside"] });
      logAdd(`Zone ${vars.name || vars.id} opdateret`, "success");
      setOpenId(null);
    }
  });

  const SC = { open: "#10b981", limited: "#f59e0b", closed: "#f43f5e" };
  const SL = { open: "Åben", limited: "Begrænset", closed: "Lukket" };
  const FI = { taxi: "🚕", bus: "🚌", train: "🚆", parking: "🅿️", checkin: "✈️", security: "🛡️", immigration: "🛂", baggage_reclaim: "🧳" };
  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));

  const toggle = (z) => {
    const next = openId === z.id ? null : z.id;
    setOpenId(next);
    if (next && !drafts[z.id]) setDrafts(d => ({ ...d, [z.id]: { ...z } }));
  };

  if (isLoading) return <Loader />;

  return (
    <Section title="Landside Zoner" color="#8b5cf6">
      {zones.length === 0 && <Empty text="Ingen zoner endnu" />}
      <div className="space-y-2">
        {zones.map(z => {
          const isOpen = openId === z.id;
          const d = drafts[z.id] || z;
          const sc = SC[z.status] || "#64748b";
          const occ = z.capacity > 0 ? Math.round((z.current_occupancy || 0) / z.capacity * 100) : 0;
          const isTransport = z.facility_type === "bus" || z.facility_type === "train";

          return (
            <div key={z.id} className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${isOpen ? sc : "rgba(51,65,85,0.4)"}`, background: "rgba(5,15,35,0.8)" }}>
              <button className="w-full flex items-center gap-4 px-4 py-4" onClick={() => toggle(z)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: `${sc}18` }}>
                  {FI[z.facility_type] || "🏢"}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base">{z.name}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${sc}20`, color: sc }}>{SL[z.status]}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                    <span>Kø: {z.queue_count || 0}</span>
                    <span className={(z.wait_minutes || 0) > 15 ? "text-amber-400" : ""}>Vent: {z.wait_minutes || 0} min</span>
                    {z.capacity > 0 && <span className={occ > 90 ? "text-red-400 font-bold" : ""}>{occ}% belægning</span>}
                    {isTransport && (z.next_departure_minutes !== null && z.next_departure_minutes !== undefined) && (
                      <span className="text-violet-400">Afgang: {z.next_departure_minutes} min</span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                  <Field label="Zone Status">
                    <StatusGrid value={d.status} onChange={v => setD(z.id, "status", v)}
                      options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))} />
                  </Field>

                  <Field label="Kø antal">
                    <Stepper value={d.queue_count || 0} onChange={v => setD(z.id, "queue_count", v)} step={1} color="#f59e0b" />
                    <Chips options={[0, 5, 10, 20, 30, 50]} value={d.queue_count} onChange={v => setD(z.id, "queue_count", v)} color="#f59e0b" />
                  </Field>

                  <Field label="Ventetid (minutter)"
                    hint={(d.wait_minutes || 0) > 15 ? { text: "Høj ventetid", color: "#f59e0b" } : null}>
                    <Stepper value={d.wait_minutes || 0} onChange={v => setD(z.id, "wait_minutes", v)} step={1} color="#f43f5e" />
                    <Chips options={[0, 5, 10, 15, 20, 30]} value={d.wait_minutes} onChange={v => setD(z.id, "wait_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                  </Field>

                  {z.capacity > 0 && (
                    <Field label={`Belægning (max ${z.capacity})`}>
                      <Stepper value={d.current_occupancy || 0} onChange={v => setD(z.id, "current_occupancy", v)} step={5} color="#8b5cf6" />
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, occ)}%`, background: occ > 90 ? "#f43f5e" : occ > 70 ? "#f59e0b" : "#8b5cf6" }} />
                      </div>
                      <p className="text-xs text-center text-slate-500 mt-1">{d.current_occupancy || 0} / {z.capacity} ({occ}%)</p>
                    </Field>
                  )}

                  {isTransport && (
                    <>
                      <Field label="Næste afgang (minutter)">
                        <Stepper value={d.next_departure_minutes || 0} onChange={v => setD(z.id, "next_departure_minutes", v)} step={1} color="#10b981" />
                        <Chips options={[0, 5, 10, 15, 20, 30, 45, 60]} value={d.next_departure_minutes} onChange={v => setD(z.id, "next_departure_minutes", v)} color="#10b981" fmt={v => `${v}m`} />
                      </Field>
                      <Field label="Forsinkelse (minutter)"
                        hint={(d.delay_minutes || 0) > 0 ? { text: "⚠ Forsinket", color: "#f43f5e" } : null}>
                        <Stepper value={d.delay_minutes || 0} onChange={v => setD(z.id, "delay_minutes", v)} step={1} color="#f43f5e" />
                        <Chips options={[0, 5, 10, 15, 20, 30]} value={d.delay_minutes} onChange={v => setD(z.id, "delay_minutes", v)} color="#f43f5e" fmt={v => `${v}m`} />
                      </Field>
                    </>
                  )}

                  <SaveBtn onClick={() => update.mutate({ ...d, name: z.name })} loading={update.isPending} color="#8b5cf6" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── SUPERVISOR ──────────────────────────────────────────────────
function SupervisorPanel({ orgId, logAdd }) {
  const { data: gates = [] } = useQuery({ queryKey: ["sp_gates", orgId], queryFn: () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 50), enabled: !!orgId, refetchInterval: 15000 });
  const { data: lanes = [] } = useQuery({ queryKey: ["sp_lanes", orgId], queryFn: () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30), enabled: !!orgId, refetchInterval: 15000 });
  const { data: zones = [] } = useQuery({ queryKey: ["sp_landside", orgId], queryFn: () => base44.entities.LandsideZone.filter({ organization_id: orgId }, "name", 50), enabled: !!orgId, refetchInterval: 20000 });

  const avgWait = lanes.length ? Math.round(lanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / lanes.length) : 0;
  const alerts = [
    ...lanes.filter(l => l.wait_minutes > 20).map(l => ({ text: `${l.name}: ${l.wait_minutes} min (over SLA)`, sev: "critical" })),
    ...lanes.filter(l => l.status === "degraded").map(l => ({ text: `${l.name}: degraderet`, sev: "critical" })),
    ...lanes.filter(l => (l.staff_assigned || 0) < (l.staff_required || 2)).map(l => ({ text: `${l.name}: understaffed`, sev: "warning" })),
    ...zones.filter(z => z.status === "closed").map(z => ({ text: `Zone "${z.name}" lukket`, sev: "warning" })),
    ...gates.filter(g => (g.pax_waiting || 0) > 120).map(g => ({ text: `Gate ${g.gate_code}: ${g.pax_waiting} pax venter`, sev: "warning" })),
  ];

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {alerts.length} Advarsler
          </p>
          {alerts.map((a, i) => <AlertPill key={i} text={a.text} sev={a.sev} />)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <KPI label="Aktive gates" value={gates.filter(g => g.status !== "closed").length} unit={`/ ${gates.length}`} color="#06b6d4" />
        <KPI label="Avg. security" value={`${avgWait} min`} color={avgWait > 20 ? "#f43f5e" : "#10b981"} alert={avgWait > 20} />
        <KPI label="Boarding aktiv" value={gates.filter(g => g.boarding_active).length} unit="gates" color="#10b981" />
        <KPI label="Lukkede zoner" value={zones.filter(z => z.status === "closed").length} unit={`/ ${zones.length}`} alert={zones.filter(z => z.status === "closed").length > 0} color="#f43f5e" />
      </div>
      <GateAgentPanel orgId={orgId} logAdd={logAdd} />
      <SecurityPanel orgId={orgId} logAdd={logAdd} />
      <LandsidePanel orgId={orgId} logAdd={logAdd} />
    </div>
  );
}

// ─── Shift log ───────────────────────────────────────────────────
function ShiftLog({ log }) {
  if (!log.length) return null;
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(2,8,23,0.5)" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5" /> Vagtlog
      </p>
      <div className="space-y-2">
        {log.slice(0, 8).map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 w-10 flex-shrink-0">{e.time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className={e.type === "success" ? "text-emerald-400" : "text-slate-400"}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 text-slate-600 animate-spin" /></div>;
}
function Empty({ text }) {
  return <p className="text-slate-600 text-sm text-center py-10">{text}</p>;
}

// ─── Role selector ───────────────────────────────────────────────
function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-5 safe-area-inset">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-900/50">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Staff Portal</h1>
          <p className="text-slate-400 mt-2">Vælg din rolle for vagten</p>
        </div>
        <div className="space-y-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onSelect(r)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all active:scale-98"
                style={{ background: `${r.color}10`, border: `2px solid ${r.color}30` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}25` }}>
                  <Icon className="w-7 h-7" style={{ color: r.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-lg">{r.label}</p>
                  <p className="text-sm text-slate-400">{r.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
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
  const panels = {
    gate_agent: <GateAgentPanel orgId={orgId} logAdd={logAdd} />,
    security_officer: <SecurityPanel orgId={orgId} logAdd={logAdd} />,
    bus_driver: <LandsidePanel orgId={orgId} logAdd={logAdd} />,
    supervisor: <SupervisorPanel orgId={orgId} logAdd={logAdd} />,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ WebkitTapHighlightColor: "transparent" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.97)", borderBottom: `3px solid ${role.color}25`, backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
            <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <p className="font-black text-white text-base leading-tight">{role.label}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
              {log.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${role.color}20`, color: role.color }}>
                  {log.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setRole(null)}
          className="h-10 px-4 rounded-xl text-sm font-bold text-slate-400 active:bg-slate-800 transition-colors"
          style={{ border: "1.5px solid rgba(51,65,85,0.5)" }}>
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Hint banner */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm"
          style={{ background: `${role.color}06`, border: `1.5px solid ${role.color}18` }}>
          <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: role.color }} />
          <span className="text-slate-400 text-xs">Tryk på et kort → juster → Gem. Live opdatering til Ops Center.</span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pt-4 pb-24">
        {panels[role.id]}
        <ShiftLog log={log} />
      </div>
    </div>
  );
}