import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, AlertTriangle, CheckCircle2, XCircle, Brain, Zap, BookOpen, RefreshCw, Sparkles, ChevronRight, FileText, Link } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

const ALL_CHECKS = {
  port: [
    { id: "p1", entity_name: "MSC GAIA — Berth 7", entity_type: "vessel", status: "compliant", severity: "info", violation_detail: null, legal_basis: "MARPOL Annex VI / ISPS Code", current_value: 0.08, limit_value: 0.1, unit: "% sulphur", repair_suggestion: null },
    { id: "p2", entity_name: "Container Block C4 — HAZMAT", entity_type: "cargo", status: "violation", severity: "critical", violation_detail: "Class 3 flammable liquids placed adjacent to Class 5.1 oxidizers — prohibited segregation under IMDG §7.2.4.", legal_basis: "IMDG Code §7.2.4", current_value: null, limit_value: null, unit: null, repair_suggestion: "Relocate Class 3 containers to Block A7 (minimum 6m separation). AI has identified 12 available slots." },
    { id: "p3", entity_name: "Terminal North — ISPS Access", entity_type: "security_zone", status: "warning", severity: "warning", violation_detail: "3 personnel in restricted zone without updated ISPS credentials (expired within 7 days).", legal_basis: "ISPS Code Part A §11.2", current_value: 3, limit_value: 0, unit: "expired credentials", repair_suggestion: "Flag accounts for renewal. Temporary access suspended pending re-verification." },
    { id: "p4", entity_name: "Route — Truck TK-449", entity_type: "vehicle", status: "warning", severity: "warning", violation_detail: "Driver Klaus Møller approaching 56h weekly limit. Current: 52h 40min.", legal_basis: "EC 561/2006 Art. 6(2)", current_value: 52.7, limit_value: 56, unit: "hours this week", repair_suggestion: "Limit to 3h 20min remaining this week. Schedule handover at Hamburg depot." },
  ],
  airport: [
    { id: "a1", entity_name: "SK903 Turnaround — Gate B12", entity_type: "flight", status: "violation", severity: "critical", violation_detail: "Scheduled ground handling window is 19 minutes — below the 25-minute EASA minimum for A320 aircraft type.", legal_basis: "EASA Ground Ops / Reg. 2021/664", current_value: 19, limit_value: 25, unit: "minutes", repair_suggestion: "Delay pushback by 6 minutes. Gate B12 slot available. Downstream connection SK1240 has 18-minute buffer." },
    { id: "a2", entity_name: "AF8812 CDG→CPH", entity_type: "flight", status: "violation", severity: "critical", violation_detail: "Entry Summary Declaration missing fields: commodity codes (Box 31), net mass (Box 35), DG indicator. ICS2 cut-off in 47 minutes.", legal_basis: "EU ICS2 / UCC Art. 127", current_value: 0, limit_value: 4, unit: "hours before arrival", repair_suggestion: "Auto-fill 6 fields from cargo manifest. 3 fields require shipper confirmation. Automated request sent." },
    { id: "a3", entity_name: "DY4421 Departure 23:52", entity_type: "flight", status: "warning", severity: "warning", violation_detail: "Scheduled departure at 23:52 — within 8 minutes of the 00:00 night curfew. Delay risk if boarding runs late.", legal_basis: "EU 2002/49/EC + Airport Night Noise Regulation", current_value: 23.87, limit_value: 24, unit: "hours (00:00 curfew)", repair_suggestion: "Move boarding start 15 min earlier. Gate staff alerted. Consider slot swap to 23:30 departure." },
    { id: "a4", entity_name: "Ground Staff — Zone 2", entity_type: "staff", status: "compliant", severity: "info", violation_detail: null, legal_basis: "EASA Ground Ops / Working Time Directive", current_value: 7.2, limit_value: 12, unit: "hours on duty", repair_suggestion: null },
  ],
  transit: [
    { id: "t1", entity_name: "Amina Osei — Bus Line 47", entity_type: "driver", status: "warning", severity: "warning", violation_detail: "Night average exceeds 8.0h limit. Current 4-month rolling average: 8.4h. Final night shift this month pushes past threshold.", legal_basis: "Arbejdstidsloven §4 + BEK nr. 1408/2016", current_value: 8.4, limit_value: 8, unit: "hours avg/night", repair_suggestion: "Swap final night trip (23:05–23:45) with Lars Bonde. Lars has 7.6h average with capacity." },
    { id: "t2", entity_name: "School Route 12C — Bus 88", entity_type: "bus", status: "violation", severity: "critical", violation_detail: "Bus 88 assigned to school route 12C but pre-route safety inspection overdue by 3 days.", legal_basis: "Færdselsloven §92 / School Bus Safety BEK", current_value: 3, limit_value: 0, unit: "days overdue inspection", repair_suggestion: "Reassign Route 12C to Bus 91 (inspection completed yesterday). Schedule Bus 88 inspection for today 14:00." },
    { id: "t3", entity_name: "Bus 44 — Route DK-6", entity_type: "bus", status: "compliant", severity: "info", violation_detail: null, legal_basis: "EC 561/2006 / BEK nr. 1408/2016", current_value: 6.2, limit_value: 10, unit: "hours driving today", repair_suggestion: null },
    { id: "t4", entity_name: "Driver Henrik Skov", entity_type: "driver", status: "warning", severity: "warning", violation_detail: "Scheduled continuous driving block of 6h 10min without break — 40 minutes over the 5.5h limit.", legal_basis: "BEK nr. 1408/2016 §7", current_value: 6.17, limit_value: 5.5, unit: "hours continuous", repair_suggestion: "Insert 30-minute break at Aarhus Banegård (stop 14) between 13:15–13:45." },
  ],
};

const STATUS_CONFIG = {
  compliant: { label: "Compliant", dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2, textColor: "text-emerald-400" },
  warning: { label: "Warning", dot: "bg-amber-400 animate-pulse", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertTriangle, textColor: "text-amber-400" },
  violation: { label: "Violation", dot: "bg-red-500 animate-pulse", badge: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle, textColor: "text-red-400" },
};

function CheckRow({ check, onSelect }) {
  const cfg = STATUS_CONFIG[check.status];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(check)}
      className={`w-full text-left p-3.5 rounded-xl border transition-all hover:brightness-125 ${
        check.status === "violation" ? "bg-red-500/5 border-red-500/25" :
        check.status === "warning" ? "bg-amber-500/5 border-amber-500/15" :
        "bg-emerald-500/5 border-emerald-500/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{check.entity_name}</p>
          <p className="text-slate-500 text-xs">{check.entity_type}</p>
          {check.violation_detail && (
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{check.violation_detail}</p>
          )}
        </div>
        <span className={`text-xs font-bold flex-shrink-0 ${cfg.textColor}`}>{cfg.label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

function DetailDrawer({ check, onClose, accentColor, onRepair, repairing, repaired }) {
  if (!check) return null;
  const cfg = STATUS_CONFIG[check.status];
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-slate-950 border-l border-slate-800 z-10 overflow-y-auto rounded-r-xl"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <span className={`text-xs font-bold ${cfg.textColor}`}>{cfg.label.toUpperCase()}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">✕</button>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{check.entity_name}</h3>
        <p className="text-slate-500 text-xs mb-4">{check.entity_type}</p>

        {check.violation_detail && !repaired && (
          <div className={`rounded-xl p-4 mb-4 ${check.status === "violation" ? "bg-red-500/10 border border-red-500/25" : "bg-amber-500/10 border border-amber-500/20"}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400 text-[10px] font-semibold tracking-widest uppercase">Regulatory Intellect</span>
            </div>
            <p className="text-white text-sm leading-relaxed">{check.violation_detail}</p>
          </div>
        )}

        {repaired && (
          <div className="rounded-xl p-4 mb-4 bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-emerald-300 text-sm font-semibold">AI repair applied successfully</p>
            </div>
          </div>
        )}

        {check.current_value !== undefined && check.limit_value && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className={`text-xl font-black mb-0.5 ${check.current_value > check.limit_value ? "text-red-400" : "text-emerald-400"}`}>{check.current_value}</div>
              <div className="text-slate-600 text-[10px]">Current ({check.unit})</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-xl font-black text-slate-300 mb-0.5">{check.limit_value}</div>
              <div className="text-slate-600 text-[10px]">Limit ({check.unit})</div>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3 h-3 text-violet-400" />
            <span className="text-violet-400 text-[10px] font-semibold uppercase tracking-widest">Legal Basis</span>
          </div>
          <p className="text-slate-200 text-xs font-medium">{check.legal_basis}</p>
        </div>

        {check.repair_suggestion && !repaired && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400 text-[10px] font-semibold uppercase tracking-widest">AI Auto-Repair</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">{check.repair_suggestion}</p>
            <button
              onClick={() => onRepair(check.id)}
              disabled={repairing}
              className="mt-3 w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40`, color: accentColor }}
            >
              {repairing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {repairing ? "Applying..." : "Apply Repair"}
            </button>
          </div>
        )}

        <RouterLink to="/RegulatoryIntelligence" className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <FileText className="w-3 h-3" />
          View full Regulatory Cockpit
        </RouterLink>
      </div>
    </motion.div>
  );
}

export default function ComplianceCockpitPanel({ module, accentColor = "#8b5cf6" }) {
  const checks = ALL_CHECKS[module] || [];
  const [selected, setSelected] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [repairedIds, setRepairedIds] = useState(new Set());

  const enriched = checks.map(c => ({ ...c, status: repairedIds.has(c.id) ? "compliant" : c.status }));
  const violations = enriched.filter(c => c.status === "violation").length;
  const warnings = enriched.filter(c => c.status === "warning").length;
  const compliant = enriched.filter(c => c.status === "compliant").length;
  const score = Math.round((compliant / enriched.length) * 100);

  const handleRepair = async (id) => {
    setRepairing(true);
    await new Promise(r => setTimeout(r, 1800));
    setRepairedIds(prev => new Set([...prev, id]));
    setRepairing(false);
  };

  return (
    <div className="relative h-full overflow-hidden">
      <div className="space-y-4">
        {/* Score row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Score", value: `${score}%`, color: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e" },
            { label: "Violations", value: violations, color: "#f43f5e" },
            { label: "Warnings", value: warnings, color: "#f59e0b" },
            { label: "Compliant", value: compliant, color: "#10b981" },
          ].map((k, i) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ background: `${k.color}08`, border: `1px solid ${k.color}20` }}>
              <p className="text-[8px] tracking-widest uppercase mb-1" style={{ color: `${k.color}80` }}>{k.label}</p>
              <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Checks */}
        <div className="space-y-2">
          {enriched.map(check => (
            <CheckRow key={check.id} check={check} onSelect={setSelected} />
          ))}
        </div>

        {/* Link to full cockpit */}
        <RouterLink
          to="/RegulatoryIntelligence"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
          style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25`, color: accentColor }}
        >
          <Scale className="w-3.5 h-3.5" />
          Full Regulatory Cockpit
          <ChevronRight className="w-3.5 h-3.5" />
        </RouterLink>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer
            check={enriched.find(c => c.id === selected.id) || selected}
            onClose={() => setSelected(null)}
            accentColor={accentColor}
            onRepair={handleRepair}
            repairing={repairing}
            repaired={repairedIds.has(selected.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}