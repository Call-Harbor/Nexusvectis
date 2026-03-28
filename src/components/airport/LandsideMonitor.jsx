import { useState } from "react";
import { Users, Car, Train, Bus, ShoppingBag, CreditCard, Luggage, AlertTriangle, CheckCircle } from "lucide-react";

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

const FACILITIES = [
  { id: "checkin", label: "Check-in", icon: CreditCard, zones: ["Zone A (SK/KL)", "Zone B (LH/BA)", "Zone C (LCC)", "Zone D (Charter)"] },
  { id: "security", label: "Security", icon: ShoppingBag, zones: ["Lane 1-4 (Fast Track)", "Lane 5-10 (Standard)", "Lane 11-14 (Special)"] },
  { id: "immigration", label: "Immigration", icon: Users, zones: ["EU Passport", "Non-EU", "E-Gate (1-8)"] },
  { id: "baggage_reclaim", label: "Baggage Reclaim", icon: Luggage, zones: ["Belt 1-3", "Belt 4-6", "Belt 7-9", "Oversized"] },
  { id: "taxi", label: "Taxi/Rideshare", icon: Car, zones: ["Arrivals Rank", "Departures Drop-off"] },
  { id: "bus", label: "Bus Terminal", icon: Bus, zones: ["Platform 1-4 (City)", "Platform 5-8 (Regional)"] },
  { id: "train", label: "Train Station", icon: Train, zones: ["Track 1 (IC)", "Track 2 (Regional)", "Track 3 (Airport Exp.)"] },
  { id: "parking", label: "Parking", icon: Car, zones: ["P1 Short Stay", "P2 Long Stay", "P3 Express", "P4 Overflow"] },
];

function genLoad(id, idx) {
  const seeds = { checkin: 72, security: 85, immigration: 61, baggage_reclaim: 45, taxi: 90, bus: 55, train: 40, parking: 78 };
  return Math.min(100, (seeds[id] || 60) + (idx * 7 % 25) - 10);
}

function LoadBar({ pct, color }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 85 ? "#f43f5e" : pct > 65 ? "#f59e0b" : color }} />
    </div>
  );
}

export default function LandsideMonitor({ flights = [] }) {
  const [selected, setSelected] = useState("checkin");
  const totalPax = flights.reduce((s, f) => s + (f.pax_total || 0), 0);
  const activeFacility = FACILITIES.find(f => f.id === selected);
  const color = FACILITY_COLORS[selected] || "#06b6d4";

  const alerts = [
    { text: "Security Lane 7 degraded — avg wait 22 min", type: "warning" },
    { text: "Baggage Belt 3 overloaded — SK204 delayed 18 min", type: "critical" },
    { text: "Taxi rank queue: 47 vehicles — surge pricing active", type: "warning" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Aktive passagerer", val: totalPax.toLocaleString(), color: "#06b6d4" },
          { label: "Aktive fly", val: flights.filter(f => !["cancelled", "completed"].includes(f.status)).length, color: "#8b5cf6" },
          { label: "Security avg. ventetid", val: "14 min", color: "#f59e0b" },
          { label: "Landside alerts", val: alerts.length, color: "#f43f5e" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-3 text-center" style={{ border: `1px solid ${k.color}25`, background: `${k.color}08` }}>
            <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${k.color}70` }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="space-y-1.5">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px]"
            style={{ background: a.type === "critical" ? "rgba(244,63,94,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${a.type === "critical" ? "rgba(244,63,94,0.25)" : "rgba(245,158,11,0.25)"}` }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: a.type === "critical" ? "#f43f5e" : "#f59e0b" }} />
            <span style={{ color: a.type === "critical" ? "#f43f5e" : "#f59e0b" }}>{a.text}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Facility selector */}
        <div className="space-y-1.5">
          {FACILITIES.map(f => {
            const Icon = f.icon;
            const load = genLoad(f.id, 0);
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

        {/* Zones detail */}
        <div className="col-span-3 rounded-xl p-4" style={{ border: `1px solid ${color}20`, background: "rgba(0,10,25,0.6)" }}>
          <div className="flex items-center gap-2 mb-4">
            {activeFacility && <activeFacility.icon className="w-4 h-4" style={{ color }} />}
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{activeFacility?.label}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {activeFacility?.zones.map((zone, i) => {
              const load = genLoad(selected, i + 1);
              const status = load > 85 ? "Overbelastet" : load > 65 ? "Travlt" : "Normal";
              const statusColor = load > 85 ? "#f43f5e" : load > 65 ? "#f59e0b" : "#10b981";
              return (
                <div key={zone} className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.6)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-white">{zone}</span>
                    <span className="flex items-center gap-1 text-[8px] font-bold"
                      style={{ color: statusColor }}>
                      {load > 65 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <LoadBar pct={load} color={color} />
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: statusColor }}>{load}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] text-slate-500">
                    <div><span className="block text-[7px] uppercase mb-0.5">Pax</span><span className="font-bold text-white">{Math.round(load * 4.2)}</span></div>
                    <div><span className="block text-[7px] uppercase mb-0.5">Ventetid</span><span className="font-bold" style={{ color: load > 65 ? "#f59e0b" : "#10b981" }}>{Math.round(load * 0.3)} min</span></div>
                    <div><span className="block text-[7px] uppercase mb-0.5">Personal</span><span className="font-bold text-white">{Math.max(2, Math.round(load / 20))}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ground transport flow */}
          {(selected === "taxi" || selected === "bus" || selected === "train") && (
            <div className="mt-4 rounded-xl p-3" style={{ border: "1px solid rgba(6,182,212,0.15)", background: "rgba(6,182,212,0.04)" }}>
              <p className="text-[8px] uppercase tracking-widest text-cyan-400 mb-2">REAL-TIME FLOW</p>
              <div className="flex gap-4 text-[9px]">
                <div><span className="text-slate-500">Næste afgang:</span> <span className="text-white font-bold">4 min</span></div>
                <div><span className="text-slate-500">I kø:</span> <span className="text-white font-bold">{Math.round(genLoad(selected, 2) * 0.6)} pax</span></div>
                <div><span className="text-slate-500">Forsinkelse:</span> <span style={{ color: selected === "taxi" ? "#f59e0b" : "#10b981" }}>{selected === "taxi" ? "12 min" : "On time"}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}