import { useMemo } from "react";
import { AlertTriangle, Users, CheckCircle, Shield, Clock } from "lucide-react";
import moment from "moment";

const SLOT_MINUTES = 10;
const SLOTS = 7; // 0–60 min ahead
const SECURITY_LEAD = 60; // pax arrive at security ~60 min before departure
const PAX_PER_LANE_PER_MIN = 12; // ~720 pax/hr per open lane

function getRisk(pax, openLanes) {
  const capacity = openLanes * PAX_PER_LANE_PER_MIN * SLOT_MINUTES;
  const load = pax / Math.max(capacity, 1);
  if (load > 1.2) return "critical";
  if (load > 0.85) return "high";
  if (load > 0.55) return "medium";
  return "low";
}

function getExtraLanesNeeded(pax, openLanes) {
  const capacity = openLanes * PAX_PER_LANE_PER_MIN * SLOT_MINUTES;
  if (pax <= capacity * 0.85) return 0;
  const needed = Math.ceil((pax - capacity * 0.85) / (PAX_PER_LANE_PER_MIN * SLOT_MINUTES));
  return Math.max(0, needed);
}

const RISK_COLOR = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#f43f5e",
};

const RISK_LABEL = {
  low: "NORMAL",
  medium: "FORHØJET",
  high: "HØJ",
  critical: "KRITISK",
};

export default function SecurityPeakTimeline({ flights, securityLanes }) {
  const now = useMemo(() => moment(), []);
  const openLanes = securityLanes.filter(l => l.status === "open").length || 1;
  const totalLanes = securityLanes.length || 1;

  // Build 60-min timeline slots
  const slots = useMemo(() => {
    return Array.from({ length: SLOTS }, (_, i) => {
      const slotStart = moment(now).add(i * SLOT_MINUTES, "minutes");
      const slotEnd = moment(now).add((i + 1) * SLOT_MINUTES, "minutes");
      const label = i === 0 ? "NU" : `+${i * SLOT_MINUTES}m`;

      // Flights whose departure is SECURITY_LEAD to SECURITY_LEAD+SLOT_MINUTES ahead
      // i.e. pax hitting security in this slot = flights departing in [slotStart+60, slotEnd+60]
      const depWindowStart = moment(slotStart).add(SECURITY_LEAD, "minutes");
      const depWindowEnd = moment(slotEnd).add(SECURITY_LEAD, "minutes");

      const slotFlights = flights.filter(f => {
        const dep = f.scheduled_departure || f.estimated_departure || f.scheduled_time;
        if (!dep) return false;
        const t = moment(dep);
        return t.isBetween(depWindowStart, depWindowEnd, null, "[)");
      });

      const pax = slotFlights.reduce((s, f) => s + (f.pax_total || 150), 0);
      const risk = getRisk(pax, openLanes);
      const extraLanes = getExtraLanesNeeded(pax, openLanes);
      const capacityPct = Math.min(200, Math.round((pax / (openLanes * PAX_PER_LANE_PER_MIN * SLOT_MINUTES)) * 100));

      return { label, slotStart, slotFlights, pax, risk, extraLanes, capacityPct };
    });
  }, [flights, openLanes, now]);

  const peakSlot = slots.reduce((best, s) => s.pax > best.pax ? s : best, slots[0]);
  const criticalSlots = slots.filter(s => s.risk === "critical" || s.risk === "high");
  const maxPax = Math.max(...slots.map(s => s.pax), 1);

  // Cumulative staffing recommendations
  const staffingActions = useMemo(() => {
    const actions = [];
    slots.forEach((s, i) => {
      if (s.extraLanes > 0) {
        const openTime = moment(s.slotStart).subtract(15, "minutes"); // open 15 min before spike
        actions.push({
          time: openTime.format("HH:mm"),
          slot: s.label,
          extraLanes: s.extraLanes,
          risk: s.risk,
          pax: s.pax,
          flights: s.slotFlights.length,
        });
      }
    });
    // Deduplicate by rounding to unique times
    const seen = new Set();
    return actions.filter(a => {
      if (seen.has(a.time)) return false;
      seen.add(a.time);
      return true;
    });
  }, [slots]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,8,20,0.85)", border: "1.5px solid rgba(6,182,212,0.2)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1.5px solid rgba(6,182,212,0.3)" }}>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">SIKKERHEDSKONTROL — SPIDSBELASTNING PROGNOSE</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Næste 60 minutter · baseret på planlagte afgange · {openLanes}/{totalLanes} baner åbne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalSlots.length > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl animate-pulse" style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)" }}>
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-[9px] font-black text-red-400">{criticalSlots.length} KRITISKE INTERVALLER</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400">KAPACITET OK</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline bars */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {slots.map((s, i) => {
            const color = RISK_COLOR[s.risk];
            const barH = Math.max((s.pax / maxPax) * 88, s.pax > 0 ? 8 : 3);
            const isCurrentNow = i === 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: 120 }}>
                {/* Lane suggestion badge */}
                {s.extraLanes > 0 && (
                  <div className="mb-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg"
                    style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                    <span className="text-[8px] font-black" style={{ color }}>+{s.extraLanes}B</span>
                  </div>
                )}

                {/* PAX count */}
                {s.pax > 0 && (
                  <span className="text-[8px] font-black font-mono" style={{ color }}>{s.pax}</span>
                )}

                {/* Bar */}
                <div className="relative w-full rounded-t-lg overflow-hidden transition-all"
                  style={{ height: `${barH}px`, background: `${color}22`, border: `1px solid ${color}40` }}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-t-sm"
                    style={{ height: "100%", background: `linear-gradient(180deg, ${color}60 0%, ${color}30 100%)` }} />
                  {isCurrentNow && (
                    <div className="absolute inset-0 animate-pulse" style={{ background: `${color}20` }} />
                  )}
                </div>

                {/* Label */}
                <div className="text-center mt-1">
                  <p className="text-[9px] font-black font-mono" style={{ color: isCurrentNow ? "#06b6d4" : "#475569" }}>{s.label}</p>
                  {s.slotFlights.length > 0 && (
                    <p className="text-[7px] text-slate-700">{s.slotFlights.length} fly</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Capacity baseline line */}
        <div className="relative mt-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: "rgba(16,185,129,0.2)" }} />
            <span className="text-[8px] text-emerald-700 font-mono whitespace-nowrap">KAPACITETSGRÆNSE ({openLanes} baner)</span>
            <div className="flex-1 h-px" style={{ background: "rgba(16,185,129,0.2)" }} />
          </div>
        </div>
      </div>

      {/* Risk legend */}
      <div className="px-5 py-3 border-t border-slate-800/40 flex items-center gap-4 flex-wrap">
        {Object.entries(RISK_LABEL).map(([risk, label]) => (
          <div key={risk} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLOR[risk] }} />
            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: RISK_COLOR[risk] }}>{label}</span>
          </div>
        ))}
        <span className="text-[8px] text-slate-600 ml-2">+2B = åbn 2 ekstra baner</span>
      </div>

      {/* Staffing recommendations */}
      {staffingActions.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-800/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> PROAKTIV BEMANDING — HANDLINGSPLAN
          </p>
          <div className="space-y-2">
            {staffingActions.map((a, i) => {
              const color = RISK_COLOR[a.risk];
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                    <Clock className="w-3 h-3" style={{ color }} />
                    <span className="text-sm font-black font-mono" style={{ color }}>{a.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">
                      Åbn <span style={{ color }}>+{a.extraLanes} ekstra bane{a.extraLanes > 1 ? "r" : ""}</span> inden spidsbelastning ({a.slot})
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Forventet: <span className="font-bold text-slate-400">{a.pax} pax</span> fra <span className="font-bold text-slate-400">{a.flights} fly</span> · risiko: <span className="font-bold" style={{ color }}>{RISK_LABEL[a.risk]}</span>
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex-shrink-0"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {RISK_LABEL[a.risk]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Peak summary footer */}
      <div className="px-5 py-3 border-t border-slate-800/40 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[8px] text-slate-600 uppercase tracking-widest">SPIDSBELASTNING</p>
          <p className="text-base font-black text-white font-mono">{peakSlot.label}</p>
          <p className="text-[9px]" style={{ color: RISK_COLOR[peakSlot.risk] }}>{peakSlot.pax} PAX</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-600 uppercase tracking-widest">MAKS BELÆGNING</p>
          <p className="text-base font-black font-mono" style={{ color: RISK_COLOR[peakSlot.risk] }}>{peakSlot.capacityPct}%</p>
          <p className="text-[9px] text-slate-600">af nuværende kapacitet</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-600 uppercase tracking-widest">TOTAL 60 MIN</p>
          <p className="text-base font-black text-white font-mono">{slots.reduce((s, sl) => s + sl.pax, 0)}</p>
          <p className="text-[9px] text-slate-600">forventede passagerer</p>
        </div>
      </div>
    </div>
  );
}