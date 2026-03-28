import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, AlertTriangle, Package, Thermometer } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_COLOR = {
  import: "#06b6d4", export: "#8b5cf6", transit: "#f59e0b",
  empty: "#64748b", customs_hold: "#f43f5e"
};

const TYPE_COLOR = {
  dry: "#64748b", reefer: "#06b6d4", open_top: "#f59e0b",
  flat_rack: "#10b981", tank: "#8b5cf6", dangerous_goods: "#f43f5e"
};

const NEXT_MOVE_COLOR = {
  gate_out: "#10b981", rail: "#8b5cf6", vessel: "#06b6d4",
  yard_move: "#f59e0b", none: "#374151"
};

export default function ContainerTracker({ orgId }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: containers = [], isLoading } = useQuery({
    queryKey: ["port_containers", orgId],
    queryFn: () => base44.entities.PortContainer.list("-created_date", 200),
    refetchInterval: 30000,
  });

  const { data: yardZones = [] } = useQuery({
    queryKey: ["yards_tracker"],
    queryFn: () => base44.entities.YardZone.list("-created_date", 30),
  });

  const zoneMap = Object.fromEntries(yardZones.map(z => [z.id, z]));

  const filtered = containers.filter(c => {
    const matchSearch = !search || c.container_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer?.toLowerCase().includes(search.toLowerCase()) ||
      c.destination?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const reeferCount = containers.filter(c => c.type === "reefer").length;
  const dgCount = containers.filter(c => c.type === "dangerous_goods").length;
  const customsHold = containers.filter(c => c.status === "customs_hold").length;
  const longDwell = containers.filter(c => (c.dwell_days || 0) > 5).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Containere", val: containers.length, color: "#06b6d4" },
          { label: "Reefer", val: reeferCount, color: "#8b5cf6" },
          { label: "Farligt gods", val: dgCount, color: "#f43f5e" },
          { label: "Toldhold", val: customsHold, color: customsHold > 0 ? "#f43f5e" : "#10b981" },
          { label: "Lang opbev. (>5d)", val: longDwell, color: longDwell > 10 ? "#f59e0b" : "#10b981" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            className="bg-slate-900 border-slate-700 pl-8 text-[10px] h-8 w-64" placeholder="Søg container ID, kunde, destination..." />
        </div>
        <div className="flex gap-1">
          {["all", "import", "export", "transit", "empty", "customs_hold"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-2 py-1 rounded text-[8px] font-bold uppercase transition-all"
              style={{
                background: filterStatus === s ? `${STATUS_COLOR[s] || "rgba(6,182,212,0.2)"}20` : "rgba(15,23,42,0.5)",
                border: `1px solid ${filterStatus === s ? (STATUS_COLOR[s] || "#06b6d4") + "60" : "rgba(30,41,59,0.6)"}`,
                color: filterStatus === s ? STATUS_COLOR[s] || "#06b6d4" : "#64748b"
              }}>{s === "all" ? "Alle" : s.replace(/_/g, " ")}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "dry", "reefer", "dangerous_goods"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-2 py-1 rounded text-[8px] font-bold uppercase transition-all"
              style={{
                background: filterType === t ? `${TYPE_COLOR[t] || "rgba(139,92,246,0.2)"}20` : "rgba(15,23,42,0.5)",
                border: `1px solid ${filterType === t ? (TYPE_COLOR[t] || "#8b5cf6") + "60" : "rgba(30,41,59,0.6)"}`,
                color: filterType === t ? TYPE_COLOR[t] || "#8b5cf6" : "#64748b"
              }}>{t === "all" ? "Alle typer" : t.replace(/_/g, " ")}</button>
          ))}
        </div>
        <span className="text-[9px] text-slate-500 ml-auto">{filtered.length} / {containers.length}</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(30,41,59,0.8)" }}>
        <div className="grid text-[8px] font-bold uppercase tracking-widest px-4 py-2 border-b border-slate-800"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", color: "#64748b", background: "rgba(15,23,42,0.8)" }}>
          <span>Container ID</span><span>Status</span><span>Type</span><span>Zone</span>
          <span>Position</span><span>Dwell</span><span>Næste move</span><span>Cut-off</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          {isLoading && <div className="text-center py-8 text-slate-600 text-xs">Loader...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-xs">
              {containers.length === 0 ? "Ingen containere registreret" : "Ingen resultater"}
            </div>
          )}
          {filtered.map((c, i) => {
            const zone = zoneMap[c.yard_zone_id];
            const dwell = c.dwell_days || 0;
            const isCutoffSoon = c.cutoff && new Date(c.cutoff) - new Date() < 4 * 3600000;
            const statusColor = STATUS_COLOR[c.status] || "#64748b";
            return (
              <div key={c.id} className="grid px-4 py-2.5 text-[10px] border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", background: i % 2 === 0 ? "rgba(0,5,15,0.3)" : "transparent" }}>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white">{c.container_id}</span>
                  {c.type === "reefer" && <Thermometer className="w-3 h-3 text-cyan-400" />}
                  {c.type === "dangerous_goods" && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase self-center"
                  style={{ background: `${statusColor}15`, color: statusColor }}>{c.status}</span>
                <span className="text-slate-400 capitalize self-center">{c.type?.replace(/_/g, " ")}</span>
                <span className="text-slate-400 self-center">{zone?.name || "—"}</span>
                <span className="font-mono text-slate-300 self-center">{c.yard_position || "—"}</span>
                <span className={`self-center font-semibold ${dwell > 5 ? "text-orange-400" : "text-slate-400"}`}>{dwell > 0 ? `${dwell}d` : "—"}</span>
                <span className="self-center">
                  {c.next_move && c.next_move !== "none" ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold"
                      style={{ background: `${NEXT_MOVE_COLOR[c.next_move] || "#64748b"}15`, color: NEXT_MOVE_COLOR[c.next_move] || "#64748b" }}>
                      {c.next_move?.replace(/_/g, " ")}
                    </span>
                  ) : <span className="text-slate-700">—</span>}
                </span>
                <span className={`self-center text-[9px] ${isCutoffSoon ? "text-red-400 font-bold" : "text-slate-500"}`}>
                  {c.cutoff ? new Date(c.cutoff).toLocaleDateString("da-DK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(NEXT_MOVE_COLOR).filter(([k]) => k !== "none").map(([move, color]) => (
          <div key={move} className="rounded-xl p-3 flex items-center gap-3" style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
            <Package className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <div>
              <p className="text-[8px] uppercase tracking-widest" style={{ color: `${color}70` }}>{move.replace(/_/g, " ")}</p>
              <p className="text-xl font-bold" style={{ color }}>{containers.filter(c => c.next_move === move).length}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}