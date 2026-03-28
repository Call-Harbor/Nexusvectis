import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Car, Train, Bus, ShoppingBag, CreditCard, Luggage, AlertTriangle, CheckCircle, Plane } from "lucide-react";

const FACILITY_COLORS = {
  checkin: "#06b6d4",
  security: "#f59e0b",
  immigration: "#8b5cf6",
  baggage_reclaim: "#10b981",
  taxi: "#f97316",
  bus: "#3b82f6",
  train: "#a855f7",
  parking: "#64748b",
};

const FACILITY_META = [
  { id: "checkin", label: "Check-in", icon: CreditCard },
  { id: "security", label: "Security", icon: ShoppingBag },
  { id: "immigration", label: "Immigration", icon: Users },
  { id: "baggage_reclaim", label: "Baggage Reclaim", icon: Luggage },
  { id: "taxi", label: "Taxi/Rideshare", icon: Car },
  { id: "bus", label: "Bus Terminal", icon: Bus },
  { id: "train", label: "Train Station", icon: Train },
  { id: "parking", label: "Parking", icon: Car },
];

function LoadBar({ pct, color }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: pct > 85 ? "#f43f5e" : pct > 65 ? "#f59e0b" : color }} />
    </div>
  );
}

export default function LandsideMonitor({ flights = [], orgId }) {
  const [selected, setSelected] = useState("checkin");

  // Real data queries
  const { data: securityLanes = [] } = useQuery({
    queryKey: ["landside_security", orgId],
    queryFn: () => orgId ? base44.entities.SecurityLane.filter({ organization_id: orgId }, "-wait_minutes", 50) : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  const { data: baggageItems = [] } = useQuery({
    queryKey: ["landside_baggage", orgId],
    queryFn: () => orgId ? base44.entities.BaggageItem.filter({ organization_id: orgId }, "-created_date", 200) : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  const { data: airportStaff = [] } = useQuery({
    queryKey: ["landside_staff", orgId],
    queryFn: () => orgId ? base44.entities.AirportStaff.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId,
    refetchInterval: 60000,
  });

  const { data: gates = [] } = useQuery({
    queryKey: ["landside_gates", orgId],
    queryFn: () => orgId ? base44.entities.AirportGate.filter({ organization_id: orgId }, "-created_date", 50) : [],
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  // ---- Derived metrics ----
  const activeFlights = flights.filter(f => !["cancelled", "departed", "diverted"].includes(f.status));
  const totalPax = activeFlights.reduce((s, f) => s + (f.pax_total || 0), 0);

  // Security metrics from real lanes
  const openLanes = securityLanes.filter(l => l.status === "open");
  const degradedLanes = securityLanes.filter(l => l.status === "degraded");
  const avgSecurityWait = securityLanes.length > 0
    ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length)
    : 0;
  const totalSecurityQueue = securityLanes.reduce((s, l) => s + (l.queue_length || 0), 0);

  // Baggage metrics
  const mishandledBags = baggageItems.filter(b => ["mishandled", "delayed"].includes(b.status));
  const atReclaim = baggageItems.filter(b => b.status === "at_reclaim");
  const loadedBags = baggageItems.filter(b => b.status === "loaded");

  // Staff per area
  const staffOnDuty = airportStaff.filter(s => ["on_duty", "assigned"].includes(s.status));
  const staffSecurity = airportStaff.filter(s => s.role === "security_officer");
  const staffGate = airportStaff.filter(s => s.role === "gate_agent");

  // Gate occupancy → check-in load proxy
  const occupiedGates = gates.filter(g => g.status === "occupied").length;
  const checkinLoad = gates.length > 0 ? Math.round((occupiedGates / gates.length) * 100) : 0;

  // Security load from real data
  const securityLoad = securityLanes.length > 0
    ? Math.round((totalSecurityQueue / Math.max(1, securityLanes.length * 50)) * 100)
    : 0;

  // Baggage load
  const baggageLoad = baggageItems.length > 0
    ? Math.round(((atReclaim.length + mishandledBags.length) / Math.max(1, baggageItems.length)) * 100)
    : 0;

  // Dynamic alerts from real data
  const alerts = [
    ...degradedLanes.map(l => ({
      text: `${l.name} degraded — avg wait ${l.wait_minutes || 0} min`,
      type: l.wait_minutes > 20 ? "critical" : "warning"
    })),
    ...mishandledBags.slice(0, 2).map(b => ({
      text: `Bag ${b.tag_number} mishandled — ${b.current_location || "location unknown"}`,
      type: "critical"
    })),
    ...(securityLanes.filter(l => l.wait_minutes > 25).map(l => ({
      text: `${l.name} high wait: ${l.wait_minutes} min — ${l.queue_length || 0} pax in queue`,
      type: "warning"
    }))),
  ].slice(0, 5);

  // Build facility load map from real data
  const facilityLoads = {
    checkin: checkinLoad,
    security: Math.min(100, securityLoad),
    immigration: activeFlights.filter(f => !f.schengen).length > 0
      ? Math.min(100, Math.round(activeFlights.filter(f => !f.schengen).length * 8))
      : 0,
    baggage_reclaim: Math.min(100, baggageLoad),
    taxi: 0,
    bus: 0,
    train: 0,
    parking: 0,
  };

  // Zone data builders
  const buildZones = (facilityId) => {
    if (facilityId === "checkin") {
      // Group gates by terminal
      const byTerminal = {};
      gates.forEach(g => {
        const key = g.terminal || "Unknown";
        if (!byTerminal[key]) byTerminal[key] = [];
        byTerminal[key].push(g);
      });
      if (Object.keys(byTerminal).length === 0) return [];
      return Object.entries(byTerminal).map(([terminal, tGates]) => {
        const occupied = tGates.filter(g => g.status === "occupied").length;
        const paxWaiting = tGates.reduce((s, g) => s + (g.pax_waiting || 0), 0);
        const load = tGates.length > 0 ? Math.round((occupied / tGates.length) * 100) : 0;
        return { name: `Terminal ${terminal}`, load, pax: paxWaiting, wait: 0, staff: staffGate.filter(s => s.terminal === terminal).length };
      });
    }
    if (facilityId === "security") {
      return securityLanes.map(l => ({
        name: l.name,
        load: l.throughput_per_hour > 0 ? Math.min(100, Math.round((l.queue_length || 0) / (l.throughput_per_hour / 60) / 10)) : (l.queue_length > 0 ? 60 : 0),
        pax: l.queue_length || 0,
        wait: l.wait_minutes || 0,
        staff: l.staff_assigned || 0,
        type: l.lane_type,
        status: l.status,
      }));
    }
    if (facilityId === "baggage_reclaim") {
      // Group by flight
      const byFlight = {};
      baggageItems.filter(b => ["at_reclaim", "loaded", "in_transit"].includes(b.status)).forEach(b => {
        const key = b.flight_id || "Unknown";
        if (!byFlight[key]) byFlight[key] = [];
        byFlight[key].push(b);
      });
      return Object.entries(byFlight).slice(0, 4).map(([flightId, bags]) => {
        const flight = flights.find(f => f.id === flightId);
        const mishandled = bags.filter(b => b.status === "mishandled").length;
        const load = Math.min(100, Math.round((bags.length / 100) * 100));
        return { name: flight ? `${flight.flight_number} (${flight.origin || "?"})` : `Flight ${flightId.slice(-4)}`, load, pax: bags.length, wait: mishandled, staff: 0 };
      });
    }
    return [];
  };

  const activeFacility = FACILITY_META.find(f => f.id === selected);
  const color = FACILITY_COLORS[selected] || "#06b6d4";
  const zones = buildZones(selected);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Aktive passagerer", val: totalPax.toLocaleString(), color: "#06b6d4" },
          { label: "Aktive fly", val: activeFlights.length, color: "#8b5cf6" },
          { label: "Security avg. ventetid", val: `${avgSecurityWait} min`, color: avgSecurityWait > 20 ? "#f43f5e" : "#f59e0b" },
          { label: "Landside alerts", val: alerts.length, color: alerts.length > 0 ? "#f43f5e" : "#10b981" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px]"
              style={{ background: a.type === "critical" ? "rgba(244,63,94,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${a.type === "critical" ? "rgba(244,63,94,0.25)" : "rgba(245,158,11,0.25)"}` }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: a.type === "critical" ? "#f43f5e" : "#f59e0b" }} />
              <span style={{ color: a.type === "critical" ? "#f43f5e" : "#f59e0b" }}>{a.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px]" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Alle faciliteter kører normalt — ingen aktive advarsler</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* Facility selector */}
        <div className="space-y-1.5">
          {FACILITY_META.map(f => {
            const Icon = f.icon;
            const load = facilityLoads[f.id] || 0;
            const fc = FACILITY_COLORS[f.id];
            const isActive = selected === f.id;
            return (
              <button key={f.id} onClick={() => setSelected(f.id)}
                className="w-full text-left rounded-lg p-2.5 transition-all"
                style={{ background: isActive ? `${fc}12` : "rgba(15,23,42,0.5)", border: `1px solid ${isActive ? fc + "50" : "rgba(30,41,59,0.6)"}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: fc }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isActive ? fc : "#94a3b8" }}>{f.label}</span>
                  <span className="ml-auto text-[8px] font-bold" style={{ color: load > 85 ? "#f43f5e" : load > 65 ? "#f59e0b" : "#10b981" }}>{load}%</span>
                </div>
                <LoadBar pct={load} color={fc} />
              </button>
            );
          })}
        </div>

        {/* Zone detail */}
        <div className="col-span-3 rounded-xl p-4" style={{ border: `1px solid ${color}20`, background: "rgba(0,10,25,0.6)" }}>
          <div className="flex items-center gap-2 mb-4">
            {activeFacility && <activeFacility.icon className="w-4 h-4" style={{ color }} />}
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{activeFacility?.label}</p>
            <span className="ml-auto text-[8px] text-slate-500">{zones.length} zoner/spor</span>
          </div>

          {zones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-xs">Ingen data for denne facilitet</p>
              <p className="text-slate-600 text-[10px] mt-1">Tilføj {selected === "security" ? "Security Lanes" : selected === "checkin" ? "Gates" : "data"} i Airport Ops Center</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {zones.map((zone, i) => {
                const load = zone.load;
                const statusLabel = load > 85 ? "Overbelastet" : load > 65 ? "Travlt" : "Normal";
                const statusColor = load > 85 ? "#f43f5e" : load > 65 ? "#f59e0b" : "#10b981";
                return (
                  <div key={i} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.6)", border: `1px solid ${zone.status === "degraded" ? "rgba(244,63,94,0.3)" : "rgba(30,41,59,0.6)"}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-white">{zone.name}</span>
                      <span className="flex items-center gap-1 text-[8px] font-bold" style={{ color: statusColor }}>
                        {load > 65 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {zone.status === "degraded" ? "Degraded" : statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1"><LoadBar pct={load} color={color} /></div>
                      <span className="text-[9px] font-bold" style={{ color: statusColor }}>{load}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[8px] text-slate-500">
                      <div><span className="block text-[7px] uppercase mb-0.5">Pax</span><span className="font-bold text-white">{zone.pax}</span></div>
                      <div><span className="block text-[7px] uppercase mb-0.5">{selected === "baggage_reclaim" ? "Mishandled" : "Ventetid"}</span>
                        <span className="font-bold" style={{ color: zone.wait > 15 ? "#f59e0b" : "#10b981" }}>
                          {selected === "baggage_reclaim" ? zone.wait : `${zone.wait} min`}
                        </span>
                      </div>
                      <div><span className="block text-[7px] uppercase mb-0.5">Personal</span><span className="font-bold text-white">{zone.staff}</span></div>
                    </div>
                    {zone.type && <p className="text-[8px] text-slate-600 mt-1 capitalize">{zone.type?.replace(/_/g, " ")}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary stats for facilities without zones */}
          {zones.length === 0 && selected === "security" && securityLanes.length === 0 && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <p className="text-[9px] text-amber-400">Tilføj Security Lanes i AirportOpsCenter → Security & Gates fanen for live data</p>
            </div>
          )}

          {/* Live summary bar */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: "Security lanes", val: securityLanes.length, active: openLanes.length },
              { label: "Total queue", val: totalSecurityQueue, unit: "pax" },
              { label: "Staff on duty", val: staffOnDuty.length, unit: "pers." },
              { label: "Mishandled bags", val: mishandledBags.length, alert: mishandledBags.length > 0 },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.5)" }}>
                <p className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5">{s.label}</p>
                <p className="text-sm font-bold" style={{ color: s.alert ? "#f43f5e" : "#06b6d4" }}>
                  {s.val}{s.unit ? ` ${s.unit}` : ""}
                  {s.active !== undefined && <span className="text-[8px] text-emerald-400 ml-1">({s.active} åbne)</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}