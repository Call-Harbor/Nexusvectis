import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, AlertTriangle, Thermometer } from "lucide-react";

const ZONE_COLORS = {
  standard: "#06b6d4", reefer: "#3b82f6", dangerous_goods: "#f43f5e",
  empty: "#334455", customs: "#f59e0b", rail_connection: "#10b981",
};
const STATUS_COLORS = {
  operational: "#10b981", congested: "#f43f5e", maintenance: "#f59e0b", closed: "#334455",
};

export default function PortYardOverview({ yardZones, equipment, orgId }) {
  const { data: containers = [] } = useQuery({
    queryKey: ["portContainers", orgId],
    queryFn: () => base44.entities.PortContainer.filter({ organization_id: orgId }, "-created_date", 200),
    enabled: !!orgId,
  });

  const totalSlots = yardZones.reduce((s, z) => s + (z.total_slots || 0), 0);
  const totalOccupied = yardZones.reduce((s, z) => s + (z.occupied_slots || 0), 0);
  const overallOcc = totalSlots > 0 ? Math.round((totalOccupied / totalSlots) * 100) : 0;

  const reeferContainers = containers.filter(c => c.type === "reefer").length;
  const dgContainers = containers.filter(c => c.type === "dangerous_goods").length;
  const dwellOver5 = containers.filter(c => (c.dwell_days || 0) > 5).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#06b6d4" }}>YARD OVERVIEW</h2>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(100,116,139,0.5)" }}>
          <span>Total occupancy:</span>
          <span className="font-bold" style={{ color: overallOcc > 85 ? "#f43f5e" : overallOcc > 70 ? "#f59e0b" : "#10b981" }}>{overallOcc}%</span>
          <span>({totalOccupied}/{totalSlots} slots)</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Reefer Containers", value: reeferContainers, color: "#3b82f6", icon: Thermometer },
          { label: "Dangerous Goods", value: dgContainers, color: "#f43f5e", icon: AlertTriangle },
          { label: "Dwell > 5 days", value: dwellOver5, color: "#f59e0b", icon: Package },
          { label: "Equipment in Yard", value: equipment.filter(e => e.status === "working").length, color: "#10b981", icon: Package },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl p-4" style={{ border: `1px solid ${item.color}22`, background: `${item.color}08` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <p className="text-[8px] tracking-widest uppercase" style={{ color: `${item.color}88` }}>{item.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Zone Cards */}
      <div className="grid grid-cols-3 gap-3">
        {yardZones.length === 0 && (
          <div className="col-span-3 text-center py-16 rounded-xl" style={{ border: "1px solid rgba(6,182,212,0.1)", color: "rgba(100,116,139,0.4)" }}>
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs tracking-widest uppercase">No yard zones configured</p>
          </div>
        )}
        {yardZones.map(zone => {
          const occ = zone.occupancy_pct || (zone.total_slots > 0 ? Math.round((zone.occupied_slots / zone.total_slots) * 100) : 0);
          const zColor = ZONE_COLORS[zone.type] || "#06b6d4";
          const sColor = STATUS_COLORS[zone.status] || "#94a3b8";
          const reeferUtil = zone.reefer_slots > 0 ? Math.round((zone.reefer_occupied / zone.reefer_slots) * 100) : 0;

          return (
            <div key={zone.id} className="rounded-xl p-4" style={{ border: `1px solid ${zColor}22`, background: `${zColor}05` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: zColor }}>{zone.name}</p>
                  <p className="text-[8px] tracking-widest uppercase mt-0.5" style={{ color: "rgba(100,116,139,0.4)" }}>
                    {zone.type?.replace("_", " ")} · {zone.rows}R × {zone.bays}B × {zone.max_stack_height}H
                  </p>
                </div>
                <span className="text-[7px] font-bold px-2 py-0.5 rounded tracking-widest uppercase"
                  style={{ background: `${sColor}22`, color: sColor, border: `1px solid ${sColor}44` }}>
                  {zone.status}
                </span>
              </div>

              {/* Occupancy Bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(100,116,139,0.4)" }}>OCCUPANCY</p>
                  <p className="text-[9px] font-bold" style={{ color: occ > 85 ? "#f43f5e" : occ > 70 ? "#f59e0b" : zColor }}>{occ}%</p>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${occ}%`, background: occ > 85 ? "#f43f5e" : occ > 70 ? "#f59e0b" : zColor }}
                  />
                </div>
                <p className="text-[7px] mt-1" style={{ color: "rgba(100,116,139,0.4)" }}>{zone.occupied_slots || 0} / {zone.total_slots || 0} slots</p>
              </div>

              {zone.reefer_slots > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[7px] uppercase tracking-widest" style={{ color: "rgba(59,130,246,0.5)" }}>REEFER SLOTS</p>
                    <p className="text-[9px] font-bold" style={{ color: "#3b82f6" }}>{reeferUtil}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${reeferUtil}%`, background: "#3b82f6" }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Equipment Status */}
      {equipment.length > 0 && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase mb-3" style={{ color: "rgba(100,116,139,0.6)" }}>EQUIPMENT STATUS</p>
          <div className="grid grid-cols-6 gap-2">
            {equipment.map(eq => (
              <div key={eq.id} className="rounded-lg p-3 text-center" style={{
                border: `1px solid ${eq.status === "working" ? "#10b981" : eq.status === "breakdown" ? "#f43f5e" : "#334455"}33`,
                background: `${eq.status === "working" ? "#10b981" : eq.status === "breakdown" ? "#f43f5e" : "#334455"}08`
              }}>
                <p className="text-[7px] font-bold uppercase tracking-widest truncate" style={{ color: eq.status === "working" ? "#10b981" : eq.status === "breakdown" ? "#f43f5e" : "#64748b" }}>{eq.name}</p>
                <p className="text-[6px] mt-0.5 uppercase" style={{ color: "rgba(100,116,139,0.4)" }}>{eq.type?.replace("_", " ")}</p>
                {(eq.battery_pct !== undefined && eq.battery_pct !== null) && (
                  <p className="text-[8px] font-bold mt-1" style={{ color: eq.battery_pct < 20 ? "#f43f5e" : "#06b6d4" }}>{eq.battery_pct}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}