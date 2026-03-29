import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Ship, RefreshCw, Radio, CheckCircle, AlertTriangle, Search, Activity, TrendingDown, Anchor } from "lucide-react";
import moment from "moment";

const STATUS_CFG = {
  approaching: { label: "APPROACHING", color: "#06b6d4" },
  berthed:     { label: "BERTHED",     color: "#10b981" },
  operations:  { label: "OPERATIONS",  color: "#f59e0b" },
  completed:   { label: "COMPLETED",   color: "#8b5cf6" },
  delayed:     { label: "DELAYED",     color: "#f43f5e" },
  planned:     { label: "PLANNED",     color: "#64748b" },
};

const CLASS_ICON = {
  cargo: "📦", tanker: "🛢️", passenger: "🚢", tug: "⚓", fishing: "🎣",
  highspeed: "💨", pilot: "🚤", unknown: "🚢"
};

function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.planned;
  const pulse = ["approaching", "operations", "berthed"].includes(status);
  return (
    <span className="relative flex w-2 h-2 flex-shrink-0">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: cfg.color }} />}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: cfg.color }} />
    </span>
  );
}

function VesselRow({ v, onClick }) {
  const cfg = STATUS_CFG[v.status] || STATUS_CFG.planned;
  return (
    <div onClick={() => onClick(v)}
      className="grid items-center gap-2 px-3 py-3 cursor-pointer transition-all hover:bg-white/[0.04] border-b border-slate-800/30 last:border-0 group"
      style={{ gridTemplateColumns: "60px 28px 1fr 72px 70px 80px 110px" }}>

      {/* ETA */}
      <div>
        <p className="text-sm font-black text-white font-mono leading-none">
          {v.eta ? moment(v.eta).format("HH:mm") : "--:--"}
        </p>
        <p className="text-[8px] text-slate-600">{v.eta ? moment(v.eta).format("DD/MM") : ""}</p>
      </div>

      {/* Live dot */}
      <div className="flex justify-center"><StatusDot status={v.status} /></div>

      {/* Vessel info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white font-mono group-hover:text-cyan-300 transition-colors">
            {v.vessel_name || v.vessel_id || "–"}
          </span>
          <span className="text-[9px] text-slate-600">{CLASS_ICON[v.vessel_class] || "🚢"}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-slate-500">{v.cargo_profile?.toUpperCase() || "–"}</span>
          {v.agent && <span className="text-[9px] text-slate-700">· {v.agent}</span>}
        </div>
      </div>

      {/* Berth */}
      <div className="text-center">
        <p className="text-sm font-black font-mono" style={{ color: v.berth_id ? "#06b6d4" : "#334155" }}>
          {v.berth_name || "–"}
        </p>
      </div>

      {/* TEU */}
      <div className="text-center">
        <p className="text-xs font-bold font-mono text-slate-400">
          {v.import_teu || v.export_teu ? `${(v.import_teu || 0) + (v.export_teu || 0)} TEU` : "–"}
        </p>
      </div>

      {/* Priority */}
      <div className="text-center">
        {v.priority && v.priority !== "normal" ? (
          <span className="text-[9px] px-2 py-0.5 rounded font-black"
            style={{
              background: v.priority === "critical" ? "rgba(244,63,94,0.15)" : v.priority === "high" ? "rgba(245,158,11,0.15)" : "transparent",
              color: v.priority === "critical" ? "#f43f5e" : v.priority === "high" ? "#f59e0b" : "#64748b",
            }}>
            {v.priority.toUpperCase()}
          </span>
        ) : <span className="text-[9px] text-slate-700">–</span>}
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

function ClassBreakdown({ portCalls, vessels }) {
  const byClass = {};
  portCalls.forEach(pc => {
    const v = vessels.find(v => v.id === pc.vessel_id);
    const cls = v?.vessel_class || "unknown";
    byClass[cls] = (byClass[cls] || 0) + 1;
  });
  const sorted = Object.entries(byClass).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = portCalls.length || 1;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
        <Activity className="w-3 h-3" />SKIBSTYPER
      </p>
      <div className="space-y-2">
        {sorted.map(([cls, count], i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white font-bold capitalize">{CLASS_ICON[cls]} {cls}</span>
              <span className="text-[10px] font-black text-slate-400 font-mono">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(count / total) * 100}%`, background: `hsl(${190 - i * 25}, 70%, 55%)` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TEUHistogram({ portCalls }) {
  const buckets = [
    { label: "0–500", min: 0, max: 500 },
    { label: "500–1k", min: 500, max: 1000 },
    { label: "1k–2k", min: 1000, max: 2000 },
    { label: "2k–5k", min: 2000, max: 5000 },
    { label: "5k+", min: 5000, max: Infinity },
  ];
  const getTotal = pc => (pc.import_teu || 0) + (pc.export_teu || 0);
  const max = Math.max(...buckets.map(b => portCalls.filter(pc => getTotal(pc) > b.min && getTotal(pc) <= b.max).length), 1);
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(0,8,20,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
        <TrendingDown className="w-3 h-3" />TEU FORDELING
      </p>
      <div className="flex items-end gap-2 h-16">
        {buckets.map((b, i) => {
          const count = portCalls.filter(pc => getTotal(pc) > b.min && getTotal(pc) <= b.max).length;
          const pct = count / max;
          const color = ["#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6"][i];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold" style={{ color }}>{count}</span>
              <div className="w-full rounded-t-md" style={{ height: `${Math.max(pct * 48, count > 0 ? 4 : 2)}px`, background: count > 0 ? color : "#1e293b" }} />
              <span className="text-[8px] text-slate-600">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LiveVesselDashboard({ orgId, portCalls = [], vessels = [] }) {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [locodeInput, setLocodeInput] = useState("DKCPH");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showCharts, setShowCharts] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);

  // Enrich port calls with vessel data
  const enriched = useMemo(() => {
    const vesselMap = {};
    vessels.forEach(v => { vesselMap[v.id] = v; });
    return portCalls.map(pc => ({
      ...pc,
      vessel_name: vesselMap[pc.vessel_id]?.name || pc.vessel_id,
      vessel_class: vesselMap[pc.vessel_id]?.vessel_class || "cargo",
    }));
  }, [portCalls, vessels]);

  const filtered = useMemo(() => {
    let list = [...enriched];
    if (filterStatus !== "all") list = list.filter(pc => pc.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(pc =>
        (pc.vessel_name || "").toLowerCase().includes(q) ||
        (pc.agent || "").toLowerCase().includes(q) ||
        (pc.status || "").includes(q) ||
        (pc.cargo_profile || "").includes(q)
      );
    }
    return list.sort((a, b) => new Date(a.eta || a.created_date) - new Date(b.eta || b.created_date));
  }, [enriched, filterStatus, search]);

  const kpis = useMemo(() => {
    const active = portCalls.filter(pc => ["approaching", "berthed", "operations"].includes(pc.status));
    const delayed = portCalls.filter(pc => (pc.delay_minutes || 0) > 30);
    const totalTEU = portCalls.reduce((s, pc) => s + (pc.import_teu || 0) + (pc.export_teu || 0), 0);
    return {
      total: portCalls.length,
      active: active.length,
      planned: portCalls.filter(pc => pc.status === "planned").length,
      delayed: delayed.length,
      berthed: portCalls.filter(pc => pc.status === "berthed").length,
      completed: portCalls.filter(pc => pc.status === "completed").length,
      totalTEU,
      critical: portCalls.filter(pc => pc.priority === "critical").length,
    };
  }, [portCalls]);

  const runSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    const res = await base44.functions.invoke("liveVesselSync", { locode: locodeInput, organization_id: orgId });
    setSyncStatus(res.data);
    setSyncing(false);
    qc.invalidateQueries({ queryKey: ["portCalls"] });
    qc.invalidateQueries({ queryKey: ["vessels_port"] });
  };

  return (
    <div className="space-y-4">
      {/* AIS Sync Bar */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-2xl"
        style={{ background: "rgba(6,182,212,0.07)", border: "1.5px solid rgba(6,182,212,0.25)" }}>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">AIS LIVE</span>
        </div>
        <input value={locodeInput} onChange={e => setLocodeInput(e.target.value.toUpperCase())}
          maxLength={5}
          className="w-20 text-center text-sm font-black text-white rounded-xl px-2 py-1.5 font-mono uppercase"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(6,182,212,0.4)" }}
          title="UN/LOCODE for the port" />
        <button onClick={runSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(6,182,212,0.2)", border: "1.5px solid rgba(6,182,212,0.5)", color: "#22d3ee" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "SYNCER..." : "SYNC AIS"}
        </button>
        {syncStatus && (
          <div className="flex items-center gap-3 text-xs">
            {syncStatus.no_key ? (
              <span className="text-amber-400 font-bold">⚠ Sæt AISHUB_USERNAME i secrets</span>
            ) : syncStatus.error ? (
              <span className="text-red-400 font-bold">✗ {syncStatus.error}</span>
            ) : (
              <>
                <span className="flex items-center gap-1 font-bold" style={{ color: "#10b981" }}>
                  <CheckCircle className="w-3 h-3" />{syncStatus.synced} skibe synket
                </span>
                <span className="text-slate-500">+{syncStatus.vessels_created} nye · {syncStatus.vessels_updated} opdateret</span>
                <span className="text-slate-600 font-mono">{syncStatus.timestamp ? moment(syncStatus.timestamp).format("HH:mm:ss") : ""}</span>
              </>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => setShowCharts(!showCharts)} className="text-[9px] font-black uppercase tracking-widest transition-all"
            style={{ color: showCharts ? "#06b6d4" : "#475569" }}>
            {showCharts ? "▼ SKJUL ANALYSE" : "▲ VIS ANALYSE"}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] tracking-widest font-black" style={{ color: "#06b6d4" }}>{portCalls.length} PORT CALLS</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: "TOTAL",    val: kpis.total,     color: "#06b6d4" },
          { label: "AKTIVE",   val: kpis.active,    color: "#10b981" },
          { label: "PLANLAGT", val: kpis.planned,   color: "#8b5cf6" },
          { label: "FORTØJET", val: kpis.berthed,   color: "#22d3ee" },
          { label: "FORSINKET",val: kpis.delayed,   color: kpis.delayed > 0 ? "#f43f5e" : "#10b981" },
          { label: "AFSLUTTET",val: kpis.completed, color: "#64748b" },
          { label: "TOTAL TEU",val: kpis.totalTEU.toLocaleString(), color: "#f59e0b" },
          { label: "KRITISKE", val: kpis.critical,  color: kpis.critical > 0 ? "#f43f5e" : "#334155" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl px-3 py-3 flex flex-col"
            style={{ background: `${k.color}08`, border: `1.5px solid ${k.color}18` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-black leading-none" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-2 gap-4">
          <TEUHistogram portCalls={portCalls} />
          <ClassBreakdown portCalls={portCalls} vessels={vessels} />
        </div>
      )}

      {/* Critical delay alert */}
      {portCalls.filter(pc => (pc.delay_minutes || 0) > 120).length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
          <p className="text-xs font-black text-red-300">
            {portCalls.filter(pc => (pc.delay_minutes || 0) > 120).length} PORT CALLS MED KRITISK FORSINKELSE (&gt;120 MIN)
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(51,65,85,0.5)" }}>
          {["all", "approaching", "berthed", "operations", "planned", "delayed", "completed"].map(s => {
            const active = filterStatus === s;
            const cfg = STATUS_CFG[s];
            const color = cfg?.color || "#64748b";
            const label = s === "all" ? "ALLE" : cfg?.label || s.toUpperCase();
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1.5 text-[9px] font-black tracking-wider uppercase transition-all"
                style={{
                  background: active ? `${color}20` : "rgba(0,8,20,0.6)",
                  color: active ? color : "#334155",
                  borderRight: "1px solid rgba(51,65,85,0.3)"
                }}>
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-xl" style={{ background: "rgba(0,8,20,0.8)", border: "1px solid rgba(51,65,85,0.4)" }}>
          <Search className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg skib, agent, type..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-700 outline-none font-mono" />
          {search && <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>}
        </div>
        <p className="text-[9px] text-slate-600 font-mono ml-auto">{filtered.length} PORT CALLS</p>
      </div>

      {/* Port Call Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,8,20,0.85)", border: "1px solid rgba(51,65,85,0.35)" }}>
        <div className="grid gap-2 px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-800/50"
          style={{ gridTemplateColumns: "60px 28px 1fr 72px 70px 80px 110px" }}>
          <span>ETA</span><span></span><span>SKIB</span>
          <span className="text-center">KAJ</span>
          <span className="text-center">TEU</span>
          <span className="text-center">PRIORITET</span>
          <span className="text-right">STATUS</span>
        </div>
        <div className="max-h-[56vh] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Ship className="w-8 h-8 mx-auto mb-3 text-slate-800" />
              <p className="text-sm text-slate-700 font-bold">
                {portCalls.length === 0 ? 'Ingen port calls. Klik "SYNC AIS" for live data eller tilføj manuelt.' : "Ingen matcher filteret."}
              </p>
            </div>
          )}
          {filtered.map(pc => (
            <VesselRow key={pc.id} v={pc} onClick={setSelectedCall} />
          ))}
        </div>
      </div>

      {/* Selected call detail panel */}
      {selectedCall && (
        <div className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col" style={{ background: "rgba(0,8,20,0.98)", borderLeft: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div>
              <p className="text-xs font-black tracking-widest text-cyan-400 uppercase">PORT CALL</p>
              <p className="text-lg font-black text-white">{selectedCall.vessel_name || "–"}</p>
            </div>
            <button onClick={() => setSelectedCall(null)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {[
              { label: "STATUS", val: (STATUS_CFG[selectedCall.status]?.label || selectedCall.status || "–").toUpperCase() },
              { label: "ETA", val: selectedCall.eta ? moment(selectedCall.eta).format("DD/MM HH:mm") : "–" },
              { label: "ETD", val: selectedCall.etd ? moment(selectedCall.etd).format("DD/MM HH:mm") : "–" },
              { label: "CARGO", val: selectedCall.cargo_profile?.toUpperCase() || "–" },
              { label: "IMPORT TEU", val: selectedCall.import_teu ?? "–" },
              { label: "EXPORT TEU", val: selectedCall.export_teu ?? "–" },
              { label: "AGENT", val: selectedCall.agent || "–" },
              { label: "FORSINKELSE", val: selectedCall.delay_minutes ? `${selectedCall.delay_minutes} min` : "Ingen" },
              { label: "PRIORITET", val: selectedCall.priority?.toUpperCase() || "NORMAL" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-800/40">
                <p className="text-[9px] uppercase tracking-widest text-slate-600">{row.label}</p>
                <p className="text-sm font-bold text-white">{row.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}