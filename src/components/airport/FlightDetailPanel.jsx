import { X, Plane, Clock, Users, AlertTriangle, CheckCircle, Radio, MapPin, Zap } from "lucide-react";
import moment from "moment";

const STATUS_CFG = {
  on_time:   { label: "ON TIME",   color: "#10b981" },
  boarding:  { label: "BOARDING",  color: "#06b6d4" },
  delayed:   { label: "DELAYED",   color: "#f59e0b" },
  cancelled: { label: "CANCELLED", color: "#f43f5e" },
  departed:  { label: "DEPARTED",  color: "#8b5cf6" },
  landed:    { label: "LANDED",    color: "#22d3ee" },
  scheduled: { label: "SCHEDULED", color: "#64748b" },
};

function TimelineBar({ f }) {
  const sched = f.scheduled_departure || f.scheduled_arrival;
  const actual = f.actual_departure || f.actual_arrival || f.estimated_departure || f.estimated_arrival;
  const delay = f.delay_minutes || 0;

  const steps = [
    { label: "SCH", time: f.scheduled_departure || f.scheduled_arrival, done: true },
    { label: "EST", time: f.estimated_departure || f.estimated_arrival, done: !!actual },
    { label: "ACT", time: f.actual_departure || f.actual_arrival, done: !!(f.actual_departure || f.actual_arrival) },
  ].filter(s => s.time);

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">TIMELINE</p>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-slate-700" />}
            <div className="text-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
                style={{ background: s.done ? "rgba(16,185,129,0.15)" : "rgba(51,65,85,0.3)", border: `1.5px solid ${s.done ? "#10b981" : "#334155"}` }}>
                <span className="text-[8px] font-black text-white">{s.label}</span>
              </div>
              <p className="text-[9px] font-mono text-slate-400">{moment(s.time).format("HH:mm")}</p>
            </div>
          </div>
        ))}
        {delay > 0 && (
          <div className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-black text-amber-400">+{delay}m</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlightDetailPanel({ flight, onClose }) {
  if (!flight) return null;
  const cfg = STATUS_CFG[flight.status] || STATUS_CFG.scheduled;

  const fields = [
    { label: "AIRLINE", val: flight.airline },
     { label: "FLIGHT #", val: flight.flight_number },
     { label: "GATE", val: flight.gate },
     { label: "AIRCRAFT", val: flight.aircraft_type },
     { label: "PASSENGERS", val: flight.pax_total },
     { label: "DELAY", val: flight.delay_minutes ? `${flight.delay_minutes} min` : "None" },
     { label: "ORIGIN", val: flight.origin },
     { label: "DESTINATION", val: flight.destination },
    { label: "SCH DEP", val: flight.scheduled_departure ? moment(flight.scheduled_departure).format("HH:mm DD/MM") : null },
    { label: "SCH ARR", val: flight.scheduled_arrival ? moment(flight.scheduled_arrival).format("HH:mm DD/MM") : null },
    { label: "EST DEP", val: flight.estimated_departure ? moment(flight.estimated_departure).format("HH:mm DD/MM") : null },
    { label: "EST ARR", val: flight.estimated_arrival ? moment(flight.estimated_arrival).format("HH:mm DD/MM") : null },
    { label: "ACT DEP", val: flight.actual_departure ? moment(flight.actual_departure).format("HH:mm DD/MM") : null },
    { label: "ACT ARR", val: flight.actual_arrival ? moment(flight.actual_arrival).format("HH:mm DD/MM") : null },
  ].filter(f => f.val);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(0,10,28,0.98) 0%, rgba(0,5,15,0.99) 100%)", border: "1.5px solid rgba(139,92,246,0.3)", boxShadow: "0 0 60px rgba(139,92,246,0.15)" }}>
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }} />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${cfg.color}15`, border: `2px solid ${cfg.color}40` }}>
                  <Plane className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white font-mono">{flight.flight_number}</p>
                  <p className="text-sm text-slate-400">{flight.airline}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-lg font-black font-mono" style={{ color: "#8b5cf6" }}>{flight.origin}</span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-px bg-slate-700" />
                  <Plane className="w-3 h-3 text-slate-600" />
                  <div className="w-12 h-px bg-slate-700" />
                </div>
                <span className="text-lg font-black font-mono text-white">{flight.destination}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-[10px] px-3 py-1.5 rounded-xl font-black tracking-wider"
                style={{ background: `${cfg.color}18`, color: cfg.color, border: `1.5px solid ${cfg.color}30` }}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-6 py-3 border-t border-slate-800/50">
          <TimelineBar f={flight} />
        </div>

        {/* Fields Grid */}
        <div className="px-6 py-4 border-t border-slate-800/50">
          <div className="grid grid-cols-3 gap-3">
            {fields.map((f, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.3)" }}>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">{f.label}</p>
                <p className="text-sm font-bold text-white font-mono">{f.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gate info */}
        {flight.gate && (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(6,182,212,0.08)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
              <MapPin className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">GATE</p>
                 <p className="text-lg font-black font-mono" style={{ color: "#06b6d4" }}>{flight.gate}</p>
                </div>
                {flight.pax_total && (
                 <div className="ml-4">
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest">PASSENGERS</p>
                  <p className="text-lg font-black font-mono text-white">{flight.pax_total}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}