import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Car, Train, Bus, ShoppingBag, CreditCard, Luggage, AlertTriangle, CheckCircle, Activity, ArrowRight } from "lucide-react";

const FACILITY_COLORS = {
  checkin: "#06b6d4", security: "#f59e0b", immigration: "#8b5cf6",
  baggage_reclaim: "#10b981", taxi: "#f97316", bus: "#3b82f6",
  train: "#a855f7", parking: "#64748b",
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
  const c = pct > 85 ? "#f43f5e" : pct > 65 ? "#f59e0b" : color;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: c }} />
    </div>
  );
}

export default function LandsideMonitor({ flights = [], orgId }) {
  const [selected, setSelected] = useState("checkin");

  const { data: securityLanes = [] } = useQuery({ queryKey: ["landside_security", orgId], queryFn: () => orgId ? base44.entities.SecurityLane.filter({ organization_id: orgId }, "-wait_minutes", 50) : [], enabled: !!orgId, refetchInterval: 30000 });
  const { data: baggageItems = [] } = useQuery({ queryKey: ["landside_baggage", orgId], queryFn: () => orgId ? base44.entities.BaggageItem.filter({ organization_id: orgId }, "-created_date", 200) : [], enabled: !!orgId, refetchInterval: 30000 });
  const { data: airportStaff = [] } = useQuery({ queryKey: ["landside_staff", orgId], queryFn: () => orgId ? base44.entities.AirportStaff.filter({ organization_id: orgId }, "-created_date", 100) : [], enabled: !!orgId, refetchInterval: 60000 });
  const { data: gates = [] } = useQuery({ queryKey: ["landside_gates", orgId], queryFn: () => orgId ? base44.entities.AirportGate.filter({ organization_id: orgId }, "-created_date", 50) : [], enabled: !!orgId, refetchInterval: 30000 });
  const { data: landsideZones = [] } = useQuery({ queryKey: ["landside_zones", orgId], queryFn: () => orgId ? base44.entities.LandsideZone.filter({ organization_id: orgId }, "-created_date", 100) : [], enabled: !!orgId, refetchInterval: 30000 });

  const activeFlights = flights.filter(f => !["cancelled", "departed", "diverted"].includes(f.status));
  const totalPax = activeFlights.reduce((s, f) => s + (f.pax_total || 0), 0);
  const openLanes = securityLanes.filter(l => l.status === "open");
  const avgSecurityWait = securityLanes.length > 0 ? Math.round(securityLanes.reduce((s, l) => s + (l.wait_minutes || 0), 0) / securityLanes.length) : 0;
  const totalSecurityQueue = securityLanes.reduce((s, l) => s + (l.queue_length || 0), 0);
  const mishandledBags = baggageItems.filter(b => ["mishandled", "delayed"].includes(b.status));
  const staffOnDuty = airportStaff.filter(s => ["on_duty", "assigned"].includes(s.status));
  const occupiedGates = gates.filter(g => g.status === "occupied").length;
  const checkinLoad = gates.length > 0 ? Math.round((occupiedGates / gates.length) * 100) : 0;
  const securityLoad = securityLanes.length > 0 ? Math.min(100, Math.round((totalSecurityQueue / Math.max(1, securityLanes.length * 50)) * 100)) : 0;
  const baggageAtReclaim = baggageItems.filter(b => b.status === "at_reclaim");

  const alerts = [
    ...securityLanes.filter(l => (l.wait_minutes || 0) > 20).map(l => ({ text: `${l.name}: ${l.wait_minutes}min ventetid · ${l.queue_length || 0} pax i kø`, type: "critical" })),
    ...mishandledBags.slice(0, 2).map(b => ({ text: `Bagage ${b.tag_number} mishandled — ${b.current_location || "ukendt placering"}`, type: "critical" })),
    ...securityLanes.filter(l => l.status === "degraded").map(l => ({ text: `${l.name} degraded — kapacitet reduceret`, type: "warning" })),
  ].slice(0, 5);

  const facilityLoads = {
    checkin: checkinLoad,
    security: securityLoad,
    immigration: Math.min(100, activeFlights.filter(f => !f.schengen).length * 8),
    baggage_reclaim: Math.min(100, Math.round((baggageAtReclaim.length / Math.max(1, baggageItems.length)) * 100)),
    taxi: landsideZones.filter(z => z.facility_type === "taxi").reduce((s, z) => s + (z.queue_count || 0), 0) > 10 ? 70 : 30,
    bus: landsideZones.filter(z => z.facility_type === "bus").some(z => z.status !== "open") ? 60 : 20,
    train: landsideZones.filter(z => z.facility_type === "train").some(z => (z.delay_minutes || 0) > 0) ? 50 : 15,
    parking: landsideZones.filter(z => z.facility_type === "parking").reduce((s, z) => s + (z.current_occupancy || 0), 0) / Math.max(1, landsideZones.filter(z => z.facility_type === "parking").reduce((s, z) => s + (z.capacity || 100), 0)) * 100,
  };

  const buildZones = (facilityId) => {
    const lzones = landsideZones.filter(z => z.facility_type === facilityId);
    if (lzones.length > 0) {
      return lzones.map(z => ({
        name: z.name,
        load: z.capacity > 0 ? Math.round((z.current_occupancy || 0) / z.capacity * 100) : 0,
        pax: z.queue_count || 0,
        wait: z.wait_minutes || 0,
        staff: z.staff_assigned || 0,
        status: z.status,
        extra: z.next_departure_minutes != null ? `Næste afgang: ${z.next_departure_minutes}min` : null,
      }));
    }
    if (facilityId === "checkin") {
      const byTerminal = {};
      gates.forEach(g => { const key = g.terminal || "Unknown"; if (!byTerminal[key]) byTerminal[key] = []; byTerminal[key].push(g); });
      return Object.entries(byTerminal).map(([terminal, tGates]) => {
        const occupied = tGates.filter(g => g.status === "occupied").length;
        return { name: `Terminal ${terminal}`, load: tGates.length > 0 ? Math.round((occupied / tGates.length) * 100) : 0, pax: tGates.reduce((s, g) => s + (g.pax_waiting || 0), 0), wait: 0, staff: airportStaff.filter(s => s.role === "gate_agent" && s.terminal === terminal).length };
      });
    }
    if (facilityId === "security") {
      return securityLanes.map(l => ({ name: l.name, load: Math.min(100, ((l.queue_length || 0) / 50) * 100), pax: l.queue_length || 0, wait: l.wait_minutes || 0, staff: l.staff_assigned || 0, status: l.status, type: l.lane_type }));
    }
    if (facilityId === "baggage_reclaim") {
      const byFlight = {};
      baggageItems.filter(b => b.status === "at_reclaim").forEach(b => { if (!byFlight[b.flight_id]) byFlight[b.flight_id] = []; byFlight[b.flight_id].push(b); });
      return Object.entries(byFlight).slice(0, 4).map(([fid, bags]) => {
        const f = flights.find(fl => fl.id === fid);
        return { name: f ? `${f.flight_number} (${f.origin})` : `Fly ${fid.slice(-4)}`, load: Math.min(100, bags.length * 2), pax: bags.length, wait: bags.filter(b => b.status === "mishandled").length, staff: 0 };
      });
    }
    return [];
  };

  const activeFacility = FACILITY_META.find(f => f.id === selected);
  const color = FACILITY_COLORS[selected] || "#06b6d4";
  const zones = buildZones(selected);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Aktive PAX", val: totalPax.toLocaleString(), color: "#06b6d4", sub: `${activeFlights.length} fly` },
          { label: "Sec. Ventetid", val: `${avgSecurityWait}m`, color: avgSecurityWait > 20 ? "#f43f5e" : avgSecurityWait > 10 ? "#f59e0b" : "#10b981", sub: `${openLanes.length}/${securityLanes.length} baner` },
          { label: "Total Kø", val: totalSecurityQueue, color: "#8b5cf6", sub: "sec. pax" },
          { label: "Personale", val: staffOnDuty.length, color: "#10b981", sub: `af ${airportStaff.length}` },
          { label: "Mishandled", val: mishandledBags.length, color: mishandledBags.length > 0 ? "#f43f5e" : "#10b981", sub: "bagage" },
          { label: "Alerts", val: alerts.length, color: alerts.length > 0 ? "#f43f5e" : "#10b981", sub: alerts.length > 0 ? "AKTIVE" : "OK" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.val}</p>
            <p className="text-[8px] mt-0.5" style={{ color: `${k.color}55` }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.25)", background: "rgba(0,8,20,0.9)" }}>
          <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-800/50" style={{ background: "rgba(244,63,94,0.07)" }}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-red-400">LANDSIDE ALERTS — {alerts.length}</span>
          </div>
          <div className="divide-y divide-slate-800/30">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: a.type === "critical" ? "#f43f5e" : "#f59e0b" }} />
                <span className="text-[10px] font-bold" style={{ color: a.type === "critical" ? "#fca5a5" : "#fde68a" }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">Alle landside-faciliteter kører normalt — ingen aktive advarsler</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* Facility selector */}
        <div className="space-y-1.5">
          <p className="text-[8px] uppercase tracking-widest text-slate-600 mb-2">FACILITETER</p>
          {FACILITY_META.map(f => {
            const Icon = f.icon;
            const load = facilityLoads[f.id] || 0;
            const fc = FACILITY_COLORS[f.id];
            const isActive = selected === f.id;
            const loadColor = load > 85 ? "#f43f5e" : load > 65 ? "#f59e0b" : "#10b981";
            return (
              <button key={f.id} onClick={() => setSelected(f.id)}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{ background: isActive ? `${fc}12` : "rgba(0,8,20,0.7)", border: `1.5px solid ${isActive ? fc + "50" : "rgba(30,41,59,0.5)"}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? fc : "#475569" }} />
                  <span className="text-[9px] font-black uppercase tracking-wider flex-1" style={{ color: isActive ? fc : "#64748b" }}>{f.label}</span>
                  <span className="text-[9px] font-black" style={{ color: loadColor }}>{Math.round(load)}%</span>
                </div>
                <LoadBar pct={load} color={fc} />
              </button>
            );
          })}
        </div>

        {/* Zone detail */}
        <div className="col-span-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}25`, background: "rgba(0,8,20,0.95)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50" style={{ background: `${color}06` }}>
            {activeFacility && <activeFacility.icon className="w-4 h-4 flex-shrink-0" style={{ color }} />}
            <p className="text-[10px] font-black uppercase tracking-widest flex-1" style={{ color }}>{activeFacility?.label}</p>
            <span className="text-[8px] text-slate-600">{zones.length} zoner/spor</span>
          </div>

          <div className="p-4">
            {zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-700">
                <Activity className="w-8 h-8 mb-3" />
                <p className="text-sm font-bold text-center">Ingen data for denne facilitet</p>
                <p className="text-xs mt-1 text-slate-600 text-center">Tilføj zoner via Infrastructure-fanen</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {zones.map((zone, i) => {
                  const loadC = zone.load > 85 ? "#f43f5e" : zone.load > 65 ? "#f59e0b" : "#10b981";
                  return (
                    <div key={i} className="rounded-xl p-4" style={{ background: "rgba(0,12,28,0.7)", border: `1px solid ${zone.status === "closed" ? "rgba(244,63,94,0.3)" : zone.status === "limited" ? "rgba(245,158,11,0.25)" : "rgba(30,41,59,0.6)"}` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[11px] font-black text-white">{zone.name}</p>
                          {zone.type && <p className="text-[8px] text-slate-500 capitalize">{zone.type.replace(/_/g, " ")}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: zone.status === "open" ? "#10b981" : zone.status === "limited" ? "#f59e0b" : "#f43f5e" }} />
                          <span className="text-[8px] font-black" style={{ color: loadC }}>{zone.load}%</span>
                        </div>
                      </div>
                      <LoadBar pct={zone.load} color={color} />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center px-1.5 py-1 rounded-lg" style={{ background: "rgba(6,182,212,0.07)" }}>
                          <p className="text-[7px] uppercase text-slate-600">Pax/Kø</p>
                          <p className="text-sm font-black text-cyan-400">{zone.pax}</p>
                        </div>
                        <div className="text-center px-1.5 py-1 rounded-lg" style={{ background: zone.wait > 15 ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.07)" }}>
                          <p className="text-[7px] uppercase text-slate-600">Ventetid</p>
                          <p className="text-sm font-black" style={{ color: zone.wait > 15 ? "#f59e0b" : "#10b981" }}>{zone.wait}m</p>
                        </div>
                        <div className="text-center px-1.5 py-1 rounded-lg" style={{ background: "rgba(100,116,139,0.07)" }}>
                          <p className="text-[7px] uppercase text-slate-600">Personal</p>
                          <p className="text-sm font-black text-slate-300">{zone.staff}</p>
                        </div>
                      </div>
                      {zone.extra && <p className="text-[9px] text-cyan-400 mt-2 font-bold">{zone.extra}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom stats */}
          <div className="border-t border-slate-800/40 px-4 py-3 grid grid-cols-4 gap-2">
            {[
              { label: "Security Baner", val: `${openLanes.length}/${securityLanes.length}`, color: "#06b6d4" },
              { label: "Total Kø", val: `${totalSecurityQueue} pax`, color: "#8b5cf6" },
              { label: "Personale", val: `${staffOnDuty.length} aktive`, color: "#10b981" },
              { label: "Mishandled", val: mishandledBags.length, color: mishandledBags.length > 0 ? "#f43f5e" : "#10b981" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] uppercase tracking-widest text-slate-600">{s.label}</p>
                <p className="text-sm font-black mt-0.5" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}