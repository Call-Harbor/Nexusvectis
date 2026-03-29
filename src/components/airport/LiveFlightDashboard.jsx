import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, ArrowUp, ArrowDown, Clock, AlertTriangle, RefreshCw, CheckCircle, XCircle, Radio, Search, Filter, TrendingDown, Activity } from "lucide-react";
import moment from "moment";
import FlightDetailPanel from "./FlightDetailPanel";

const STATUS_CFG = {
  on_time:   { label: "ON TIME",   color: "#10b981" },
  boarding:  { label: "BOARDING",  color: "#06b6d4" },
  delayed:   { label: "DELAYED",   color: "#f59e0b" },
  cancelled: { label: "CANCELLED", color: "#f43f5e" },
  departed:  { label: "DEPARTED",  color: "#8b5cf6" },
  landed:    { label: "LANDED",    color: "#22d3ee" },
  scheduled: { label: "SCHEDULED", color: "#64748b" },
};

function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.scheduled;
  const pulse = ["boarding", "on_time"].includes(status);
  return (
    <span className="relative flex w-2 h-2 flex-shrink-0">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: cfg.color }} />}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: cfg.color }} />
    </span>
  );
}

function DelayBadge({ minutes }) {
  if (!minutes || minutes <= 0) return null;
  const color = minutes > 60 ? "#f43f5e" : minutes > 30 ? "#f59e0b" : "#eab308";
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      +{minutes}m
    </span>
  );
}

function FlightRow({ f, onClick }) {
  const cfg = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
  const depTime = f.actual_departure || f.estimated_departure || f.scheduled_departure;
  const arrTime = f.actual_arrival || f.estimated_arrival || f.scheduled_arrival;
  const time = depTime || arrTime;
  const isLive = ["boarding", "on_time"].includes(f.status);

  return (
    <div onClick={() => onClick(f)}
      className="grid items-center gap-2 px-3 py-3 cursor-pointer transition-all hover:bg-white/[0.04] border-b border-slate-800/30 last:border-0 group"
      style={{ gridTemplateColumns: "56px 28px 1fr 64px 56px 52px 100px" }}>

      {/* Time */}
      <div>
        <p className="text-sm font-black text-white font-mono leading-none">{time ? moment(time).format("HH:mm") : "--:--"}</p>
        <DelayBadge minutes={f.delay_minutes} />
      </div>

      {/* Live dot */}
      <div className="flex justify-center">
        <StatusDot status={f.status} />
      </div>

      {/* Flight info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white font-mono group-hover:text-violet-300 transition-colors">{f.flight_number}</span>
          <span className="text-[10px] text-slate-500 truncate hidden sm:block">{f.airline}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>{f.origin || "–"}</span>
          <span className="text-[9px] text-slate-700">→</span>
          <span className="text-[10px] font-bold text-slate-400">{f.destination || "–"}</span>
        </div>
      </div>

      {/* Gate */}
      <div className="text-center">
        <p className="text-sm font-black font-mono" style={{ color: f.gate ? "#06b6d4" : "#334155" }}>{f.gate || "–"}</p>
      </div>

      {/* Aircraft */}
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 font-mono">{f.aircraft_type || "–"}</p>
      </div>

      {/* PAX */}
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 font-mono">{f.pax_total || "–"}</p>
      </div>

      {/* Status pill */}
      <div className="text-right">
        <span className="text-[9px] px-2 py-1 rounded-lg font-black tracking-wider"
          style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

function DelayHistogram({ flights }) {
  const buckets = [
    { label: "0–15m", min: 1, max: 15 },
    { label: "15–30m", min: 15, max: 30 },
    { label: "30–60m", min: 30, max: 60 },
    { label: "60–90m", min: 60, max: 90 },
    { label: "90m+", min: 90, max: Infinity },
  ];
  const max = Math.max(...buckets.map(b => flights.filter(f => (f.delay_minutes || 0) > b.min && (f.delay_minutes || 0) <= b.max).length), 1);

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5"><TrendingDown className="w-3 h-3" />FORSINKELSESFORDELING</p>
      <div className="flex items-end gap-2 h-16">
        {buckets.map((b, i) => {
          const count = flights.filter(f => (f.delay_minutes || 0) > b.min && (f.delay_minutes || 0) <= b.max).length;
          const pct = count / max;
          const color = i === 0 ? "#eab308" : i === 1 ? "#f59e0b" : i === 2 ? "#f97316" : "#f43f5e";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold" style={{ color }}>{count}</span>
              <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct * 48, count > 0 ? 4 : 2)}px`, background: count > 0 ? color : "#1e293b" }} />
              <span className="text-[8px] text-slate-600">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AirlineBreakdown({ flights }) {
  const counts = {};
  flights.forEach(f => { if (f.airline) counts[f.airline] = (counts[f.airline] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = flights.length || 1;

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5"><Activity className="w-3 h-3" />TOP FLYSELSKABER</p>
      <div className="space-y-2">
        {sorted.map(([airline, count], i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white font-bold truncate max-w-[120px]">{airline}</span>
              <span className="text-[10px] font-black text-slate-400 font-mono">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, background: `hsl(${260 - i * 20}, 70%, 65%)` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveFlightDashboard({ orgId }) {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [airportIata, setAirportIata] = useState("CPH");
  const [view, setView] = useState("all");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showCharts, setShowCharts] = useState(true);

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ["aoc_flights", orgId],
    queryFn: () => orgId ? base44.entities.Flight.filter({ organization_id: orgId }, "-created_date", 200) : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    let list = [...flights];
    if (view === "departures") list = list.filter(f => f.flight_type === "departure" || f.origin === airportIata);
    if (view === "arrivals") list = list.filter(f => f.flight_type === "arrival" || f.destination === airportIata);
    if (filterStatus !== "all") list = list.filter(f => f.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        (f.flight_number || "").toLowerCase().includes(q) ||
        (f.airline || "").toLowerCase().includes(q) ||
        (f.origin || "").toLowerCase().includes(q) ||
        (f.destination || "").toLowerCase().includes(q) ||
        (f.gate || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const ta = a.scheduled_departure || a.scheduled_arrival || a.created_date;
      const tb = b.scheduled_departure || b.scheduled_arrival || b.created_date;
      return new Date(ta) - new Date(tb);
    });
  }, [flights, view, filterStatus, search, airportIata]);

  // KPIs
  const kpis = useMemo(() => {
    const delayed = flights.filter(f => (f.delay_minutes || 0) > 0 || f.status === "delayed");
    const avgDelay = delayed.length > 0
      ? Math.round(delayed.reduce((s, f) => s + (f.delay_minutes || 0), 0) / delayed.length)
      : 0;
    return {
      total: flights.length,
      onTime: flights.filter(f => f.status === "on_time" || f.status === "scheduled").length,
      delayed: delayed.length,
      boarding: flights.filter(f => f.status === "boarding").length,
      departed: flights.filter(f => f.status === "departed").length,
      landed: flights.filter(f => f.status === "landed").length,
      cancelled: flights.filter(f => f.status === "cancelled").length,
      avgDelay,
      withGate: flights.filter(f => f.gate).length,
      onTimeRate: flights.length > 0 ? Math.round(((flights.length - delayed.length) / flights.length) * 100) : 100,
    };
  }, [flights]);

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
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-2xl" style={{ background: "rgba(139,92,246,0.07)", border: "1.5px solid rgba(139,92,246,0.25)" }}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-violet-300 uppercase">AVIATIONSTACK LIVE</span>
        </div>
        <input value={airportIata} onChange={e => setAirportIata(e.target.value.toUpperCase())}
          maxLength={4}
          className="w-16 text-center text-sm font-black text-white rounded-xl px-2 py-1.5 font-mono uppercase"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(139,92,246,0.4)" }} />
        <button onClick={runSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(139,92,246,0.2)", border: "1.5px solid rgba(139,92,246,0.5)", color: "#a78bfa" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "SYNCER..." : "SYNC NU"}
        </button>
        {syncStatus && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold" style={{ color: "#10b981" }}>
              <CheckCircle className="w-3 h-3" />{syncStatus.synced} synkeret
            </span>
            <span className="text-slate-500">+{syncStatus.created} nye · {syncStatus.updated} opdateret</span>
            <span className="text-slate-600 font-mono">{moment(syncStatus.timestamp).format("HH:mm:ss")}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => setShowCharts(!showCharts)} className="text-[9px] font-black uppercase tracking-widest transition-all"
            style={{ color: showCharts ? "#8b5cf6" : "#475569" }}>
            {showCharts ? "▼ SKJUL ANALYSE" : "▲ VIS ANALYSE"}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] tracking-widest font-black" style={{ color: "#10b981" }}>{flights.length} FLY INDLÆST</span>
          </div>
        </div>
      </div>

      {/* KPI Strip — 8 metrics */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: "TOTAL",     val: kpis.total,       color: "#8b5cf6", sub: null },
          { label: "TIL TIDEN", val: kpis.onTime,      color: "#10b981", sub: `${kpis.onTimeRate}%` },
          { label: "FORSINKET", val: kpis.delayed,     color: kpis.delayed > 0 ? "#f59e0b" : "#10b981", sub: kpis.avgDelay > 0 ? `⌀ ${kpis.avgDelay}m` : null },
          { label: "BOARDING",  val: kpis.boarding,    color: "#06b6d4", sub: null },
          { label: "AFREJST",   val: kpis.departed,    color: "#a78bfa", sub: null },
          { label: "LANDET",    val: kpis.landed,      color: "#22d3ee", sub: null },
          { label: "AFLYST",    val: kpis.cancelled,   color: kpis.cancelled > 0 ? "#f43f5e" : "#334155", sub: null },
          { label: "M/GATE",    val: kpis.withGate,    color: "#f59e0b", sub: `${kpis.total > 0 ? Math.round((kpis.withGate / kpis.total) * 100) : 0}%` },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-3 py-3 flex flex-col"
            style={{ background: `${k.color}08`, border: `1.5px solid ${k.color}18` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-black leading-none" style={{ color: k.color }}>{k.val}</p>
            {k.sub && <p className="text-[9px] mt-1 font-bold" style={{ color: `${k.color}80` }}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {showCharts && kpis.delayed > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <DelayHistogram flights={flights} />
          <AirlineBreakdown flights={flights} />
        </div>
      )}

      {/* Critical delays alert */}
      {flights.filter(f => (f.delay_minutes || 0) > 60).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-black text-red-300">
              {flights.filter(f => (f.delay_minutes || 0) > 60).length} FLY MED KRITISK FORSINKELSE (&gt;60 MIN)
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {flights.filter(f => (f.delay_minutes || 0) > 60).slice(0, 4).map(f => `${f.flight_number} (+${f.delay_minutes}m)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(51,65,85,0.5)" }}>
          {[
            { id: "all", label: "ALLE", Icon: Plane },
            { id: "departures", label: "AFG", Icon: ArrowUp },
            { id: "arrivals", label: "ANK", Icon: ArrowDown },
          ].map(v => {
            const active = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-black tracking-widest uppercase transition-all"
                style={{ background: active ? "rgba(139,92,246,0.2)" : "rgba(0,8,20,0.6)", color: active ? "#8b5cf6" : "#475569", borderRight: "1px solid rgba(51,65,85,0.4)" }}>
                <v.Icon className="w-3 h-3" />{v.label}
              </button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "on_time", "boarding", "delayed", "departed", "landed", "cancelled"].map(s => {
            const active = filterStatus === s;
            const cfg = STATUS_CFG[s];
            const color = cfg?.color || "#64748b";
            const label = cfg?.label || "ALLE";
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all"
                style={{ background: active ? `${color}20` : "rgba(0,8,20,0.6)", color: active ? color : "#334155", border: `1px solid ${active ? color + "40" : "rgba(51,65,85,0.3)"}` }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-xl" style={{ background: "rgba(0,8,20,0.8)", border: "1px solid rgba(51,65,85,0.4)" }}>
          <Search className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg fly, selskab, gate..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-700 outline-none font-mono" />
          {search && <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>}
        </div>

        <p className="text-[9px] text-slate-600 font-mono ml-auto">{filtered.length} FLY</p>
      </div>

      {/* Flight Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(51,65,85,0.35)" }}>
        {/* Column Headers */}
        <div className="grid gap-2 px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800/50"
          style={{ gridTemplateColumns: "56px 28px 1fr 64px 56px 52px 100px" }}>
          <span>TID</span><span></span><span>RUTE</span>
          <span className="text-center">GATE</span>
          <span className="text-center">A/C</span>
          <span className="text-center">PAX</span>
          <span className="text-right">STATUS</span>
        </div>

        {/* Rows */}
        <div className="max-h-[56vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-slate-600 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Indlæser flydata...
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Plane className="w-8 h-8 mx-auto mb-3 text-slate-800" />
              <p className="text-sm text-slate-700 font-bold">
                {flights.length === 0 ? `Ingen fly. Klik "SYNC NU" for at hente live data fra ${airportIata}.` : "Ingen fly matcher filteret."}
              </p>
            </div>
          )}
          {filtered.map(f => (
            <FlightRow key={f.id} f={f} onClick={setSelectedFlight} />
          ))}
        </div>
      </div>

      {/* Flight Detail Panel */}
      {selectedFlight && (
        <FlightDetailPanel flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
      )}
    </div>
  );
}