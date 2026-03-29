import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FlightSyncPanel from "./FlightSyncPanel";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Stepper, Chips, StatusGrid, SaveBtn, Field, Card, Loader, Empty } from "./StaffShared";

const SC = { open: "#10b981", occupied: "#06b6d4", maintenance: "#f59e0b", closed: "#f43f5e" };
const SL = { open: "Åben", occupied: "Optaget", maintenance: "Vedligehold", closed: "Lukket" };

export default function GateAgentTab({ orgId, logAdd }) {
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

  const updateGate = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AirportGate.update(id, d),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["sp_gates"] }); logAdd(`Gate ${v.gate_code} opdateret`, "success"); setOpenId(null); }
  });

  const updateFlight = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.Flight.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sp_flights"] }); logAdd("Fly status opdateret", "success"); }
  });

  const setD = (id, k, v) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [k]: v } }));
  const toggle = (g) => {
    const next = openId === g.id ? null : g.id;
    setOpenId(next);
    if (next && !drafts[g.id]) setDrafts(d => ({ ...d, [g.id]: { ...g } }));
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <FlightSyncPanel orgId={orgId} logAdd={logAdd} />
      {!gates.length && <Empty text="Ingen gates oprettet endnu" />}
      {gates.map(g => {
        const isOpen = openId === g.id;
        const d = drafts[g.id] || g;
        const sc = SC[g.status] || "#64748b";
        const flight = g.current_flight_id ? flightMap[g.current_flight_id] : null;

        return (
          <Card key={g.id} color={sc} isOpen={isOpen}>
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
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {flight ? `${flight.flight_number} · ${flight.origin} → ${flight.destination}` : g.terminal || "Ingen fly"}
                  {(g.pax_waiting || 0) > 0 && <span className={(g.pax_waiting || 0) > 120 ? " text-amber-400 font-bold" : ""}> · {g.pax_waiting} pax</span>}
                </p>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-5 space-y-5 border-t-2 border-slate-800/60 pt-4">
                {/* Gate status */}
                <Field label="Gate Status">
                  <StatusGrid value={d.status} onChange={v => setD(g.id, "status", v)}
                    options={Object.entries(SL).map(([val, label]) => ({ val, label, color: SC[val] }))} />
                </Field>

                {/* Boarding */}
                <Field label="Boarding status">
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: true, l: "▶ Aktiv", c: "#10b981" }, { v: false, l: "⏸ Inaktiv", c: "#64748b" }].map(o => (
                      <button key={String(o.v)} onPointerDown={e => { e.preventDefault(); setD(g.id, "boarding_active", o.v); }}
                        className="h-14 rounded-2xl text-sm font-bold active:scale-95 transition-all"
                        style={{ background: d.boarding_active === o.v ? `${o.c}25` : "rgba(20,30,50,0.6)", color: o.c, border: `2px solid ${d.boarding_active === o.v ? o.c : "rgba(51,65,85,0.4)"}` }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Pax venter */}
                <Field label="Pax venter ved gate" hint={(d.pax_waiting || 0) > 120 ? { text: "⚠ Mange pax", color: "#f59e0b" } : null}>
                  <Stepper value={d.pax_waiting || 0} onChange={v => setD(g.id, "pax_waiting", v)} step={5} color="#06b6d4" />
                  <Chips options={[0, 25, 50, 75, 100, 150, 200]} value={d.pax_waiting} onChange={v => setD(g.id, "pax_waiting", v)} color="#06b6d4" />
                </Field>

                {/* Boarding progress */}
                {flight && (
                  <Field label="Pax ombord">
                    <Stepper value={d.pax_boarded || 0} onChange={v => setD(g.id, "pax_boarded", v)} step={10} color="#10b981" />
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, ((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-1">{d.pax_boarded || 0}/{flight.pax_total || "?"} · {Math.round(((d.pax_boarded || 0) / (flight.pax_total || 200)) * 100)}%</p>
                  </Field>
                )}

                {/* Flight delay quick-update */}
                {flight && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(139,92,246,0.08)", border: "1.5px solid rgba(139,92,246,0.25)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-400">✈ Fly {flight.flight_number} — Hurtigt opdater</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["on_time", "boarding", "delayed", "cancelled", "departed", "landed"].map(s => {
                        const c = { on_time: "#10b981", boarding: "#06b6d4", delayed: "#f59e0b", cancelled: "#f43f5e", departed: "#8b5cf6", landed: "#22d3ee" }[s];
                        const l = { on_time: "Til tiden", boarding: "Boarding", delayed: "Forsinket", cancelled: "Aflyst", departed: "Afrejst", landed: "Landet" }[s];
                        return (
                          <button key={s} onPointerDown={e => { e.preventDefault(); updateFlight.mutate({ id: flight.id, status: s }); }}
                            className="h-11 rounded-xl text-xs font-bold active:scale-95 transition-all"
                            style={{ background: flight.status === s ? `${c}25` : "rgba(20,30,50,0.6)", color: c, border: `1.5px solid ${flight.status === s ? c : "rgba(51,65,85,0.3)"}` }}>
                            {l}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">Forsinkelse (min)</p>
                      <Chips options={[0, 10, 20, 30, 45, 60, 90, 120]} value={flight.delay_minutes} onChange={v => updateFlight.mutate({ id: flight.id, delay_minutes: v })} color="#f59e0b" fmt={v => v === 0 ? "0" : `+${v}m`} />
                    </div>
                  </div>
                )}

                <SaveBtn onClick={() => updateGate.mutate({ ...d, gate_code: g.gate_code })} loading={updateGate.isPending} color="#06b6d4" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}