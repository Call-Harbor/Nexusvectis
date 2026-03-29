import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, ArrowUp, ArrowDown, Clock, AlertTriangle, RefreshCw, CheckCircle, XCircle, Radio } from "lucide-react";
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

function FlightRow({ f, isDep }) {
  const cfg = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
  const delayed = (f.delay_minutes || 0) > 0;
  const time = isDep
    ? (f.actual_departure || f.estimated_departure || f.scheduled_departure)
    : (f.actual_arrival || f.estimated_arrival || f.scheduled_arrival);

  return (
    <div className="grid items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 border border-transparent hover:border-white/5"
      style={{ gridTemplateColumns: "80px 1fr 80px 80px 70px 90px" }}>
      {/* Time */}
      <div>
        <p className="text-sm font-bold text-white font-mono">{time ? moment(time).format("HH:mm") : "--:--"}</p>
        {delayed && (
          <p className="text-[9px] font-bold" style={{ color: "#f59e0b" }}>+{f.delay_minutes}m</p>
        )}
      </div>

      {/* Route */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white font-mono">{f.flight_number}</span>
          <span className="text-[10px] text-slate-400 truncate">{f.airline}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>{isDep ? f.origin : f.destination}</span>
          <span className="text-[9px] text-slate-600">→</span>
          <span className="text-[10px] font-bold text-slate-300">{isDep ? f.destination : f.origin}</span>
        </div>
      </div>

      {/* Gate */}
      <div className="text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gate</p>
        <p className="text-sm font-bold" style={{ color: "#06b6d4" }}>{f.gate || "–"}</p>
      </div>

      {/* Aircraft */}
      <div className="text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">A/C</p>
        <p className="text-xs font-bold text-slate-300">{f.aircraft_type || "–"}</p>
      </div>

      {/* PAX */}
      <div className="text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">PAX</p>
        <p className="text-xs font-bold text-slate-300">{f.pax_total || "–"}</p>
      </div>

      {/* Status */}
      <div className="text-right">
        <span className="text-[9px] px-2 py-1 rounded-lg font-black tracking-wider"
          style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

export default function LiveFlightDashboard({ orgId }) {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [airportIata, setAirportIata] = useState("CPH");
  const [view, setView] = useState("departures"); // departures | arrivals | all

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ["aoc_flights", orgId],
    queryFn: () => orgId ? base44.entities.Flight.filter({ organization_id: orgId }, "-created_date", 200) : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  const departures = flights.filter(f => f.flight_type === "departure" || (!f.flight_type && f.origin && f.destination));
  const arrivals = flights.filter(f => f.flight_type === "arrival");

  // Sort by scheduled time
  const sortByTime = (arr) => [...arr].sort((a, b) => {
    const ta = a.scheduled_departure || a.scheduled_arrival || a.created_date;
    const tb = b.scheduled_departure || b.scheduled_arrival || b.created_date;
    return new Date(ta) - new Date(tb);
  });

  const displayed = view === "departures" ? sortByTime(flights.filter(f => f.origin && f.destination))
    : view === "arrivals" ? sortByTime(arrivals)
    : sortByTime(flights);

  // KPIs
  const onTime = flights.filter(f => f.status === "on_time" || f.status === "scheduled").length;
  const delayed = flights.filter(f => (f.delay_minutes || 0) > 0 || f.status === "delayed").length;
  const boarding = flights.filter(f => f.status === "boarding").length;
  const cancelled = flights.filter(f => f.status === "cancelled").length;
  const avgDelay = delayed > 0 ? Math.round(flights.filter(f => f.delay_minutes > 0).reduce((s, f) => s + f.delay_minutes, 0) / delayed) : 0;

  const runSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    const res = await base44.functions.invoke("liveFlightSync", { airport_iata: airportIata, organization_id: orgId });
    setSyncStatus(res.data);
    setSyncing(false);
    refetch();
    qc.invalidateQueries({ queryKey: ["aoc_flights"] });
  };

  return (
    <div className="space-y-4">
      {/* Sync Bar */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(139,92,246,0.07)", border: "1.5px solid rgba(139,92,246,0.2)" }}>
        <Radio className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <p className="text-xs font-bold text-violet-300 flex-shrink-0">LIVE SYNC</p>
        <input value={airportIata} onChange={e => setAirportIata(e.target.value.toUpperCase())}
          className="w-20 text-center text-sm font-black text-white rounded-xl px-3 py-1.5 font-mono"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139,92,246,0.3)" }} />
        <button onClick={runSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ background: "rgba(139,92,246,0.2)", border: "1.5px solid rgba(139,92,246,0.5)", color: "#a78bfa" }}>
          {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {syncing ? "SYNCING..." : "SYNC NOW"}
        </button>
        {syncStatus && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" />{syncStatus.synced} synced</span>
            <span className="text-slate-500">+{syncStatus.created} new · ✎{syncStatus.updated} updated</span>
            <span className="text-slate-600">{syncStatus.airport} · {moment(syncStatus.timestamp).format("HH:mm:ss")}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase">{flights.length} FLIGHTS LOADED</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "TOTAL FLIGHTS", val: flights.length, color: "#8b5cf6", icon: Plane },
          { label: "ON TIME", val: onTime, color: "#10b981", icon: CheckCircle },
          { label: "DELAYED", val: delayed, color: delayed > 0 ? "#f59e0b" : "#10b981", icon: Clock },
          { label: "BOARDING", val: boarding, color: "#06b6d4", icon: ArrowUp },
          { label: "CANCELLED", val: cancelled, color: cancelled > 0 ? "#f43f5e" : "#64748b", icon: XCircle },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: `${k.color}08`, border: `1.5px solid ${k.color}20` }}>
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: k.color }} />
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-500">{k.label}</p>
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {delayed > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300"><span className="font-black">{delayed} forsinkede fly</span> · Gennemsnitlig forsinkelse: <span className="font-black">{avgDelay} min</span></p>
        </div>
      )}

      {/* Flight Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,8,20,0.8)", border: "1px solid rgba(51,65,85,0.3)" }}>
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
          <div className="flex items-center gap-1">
            {[
              { id: "departures", label: "AFGANGE", icon: ArrowUp },
              { id: "arrivals", label: "ANKOMSTER", icon: ArrowDown },
              { id: "all", label: "ALLE", icon: Plane },
            ].map(v => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button key={v.id} onClick={() => setView(v.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all"
                  style={{ background: active ? "rgba(139,92,246,0.2)" : "transparent", color: active ? "#8b5cf6" : "#475569", border: active ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent" }}>
                  <Icon className="w-3 h-3" />{v.label}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-600 font-mono">{displayed.length} FLY</p>
        </div>

        {/* Column Headers */}
        <div className="grid gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800/40"
          style={{ gridTemplateColumns: "80px 1fr 80px 80px 70px 90px" }}>
          <span>TID</span><span>RUTE</span><span className="text-center">GATE</span>
          <span className="text-center">A/C</span><span className="text-center">PAX</span><span className="text-right">STATUS</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/30 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-600">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Indlæser fly...
            </div>
          )}
          {!isLoading && displayed.length === 0 && (
            <div className="text-center py-12">
              <Plane className="w-8 h-8 mx-auto mb-3 text-slate-700" />
              <p className="text-sm text-slate-600">Ingen fly. Klik "SYNC NOW" for at hente live data.</p>
            </div>
          )}
          {displayed.map(f => (
            <FlightRow key={f.id} f={f} isDep={view !== "arrivals"} />
          ))}
        </div>
      </div>
    </div>
  );
}