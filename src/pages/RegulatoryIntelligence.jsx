import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Brain, Zap, ChevronRight,
  BookOpen, Scale, Truck, Globe, Plane, Satellite, Leaf, RefreshCw,
  FileText, Filter, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const DOMAIN_CONFIG = {
  road_transport: { label: "Road Transport", icon: Truck, color: "cyan" },
  transit: { label: "Transit", icon: Globe, color: "emerald" },
  port: { label: "Port", icon: Satellite, color: "blue" },
  airport: { label: "Airport", icon: Plane, color: "violet" },
  customs: { label: "Customs & eFTI", icon: FileText, color: "amber" },
  environment: { label: "Environment / CO₂", icon: Leaf, color: "green" },
  labor: { label: "Labor & Hours", icon: Scale, color: "rose" },
  safety: { label: "Safety & ISPS", icon: Shield, color: "red" },
};

const STATUS_CONFIG = {
  compliant: { label: "Compliant", color: "emerald", icon: CheckCircle2 },
  warning: { label: "Warning", color: "amber", icon: AlertTriangle },
  violation: { label: "Violation", color: "red", icon: XCircle },
  pending: { label: "Pending", color: "slate", icon: RefreshCw },
};

const RULE_PACKS = [
  {
    id: "eu_road",
    name: "EU Road Transport",
    icon: Truck,
    color: "cyan",
    rules: [
      { id: "EU-561-Art6", title: "Daily Driving Limit", legal_basis: "EC 561/2006 Art. 6", desc: "Maximum 9h daily driving (extendable to 10h twice/week)", limit: 9, unit: "hours", domain: "road_transport", severity: "critical" },
      { id: "EU-561-Art8", title: "Daily Rest Period", legal_basis: "EC 561/2006 Art. 8", desc: "Minimum 11h daily rest (reducible to 9h max 3 times/week)", limit: 11, unit: "hours", domain: "road_transport", severity: "critical" },
      { id: "EU-561-Art4c", title: "Continuous Driving Break", legal_basis: "EC 561/2006 Art. 4(c)", desc: "45-minute break after 4.5 hours continuous driving", limit: 4.5, unit: "hours", domain: "road_transport", severity: "critical" },
      { id: "EU-561-Art6-2", title: "Weekly Driving Limit", legal_basis: "EC 561/2006 Art. 6(2)", desc: "Maximum 56 hours driving per week", limit: 56, unit: "hours", domain: "road_transport", severity: "warning" },
      { id: "EU-96-53", title: "Maximum Vehicle Weight", legal_basis: "EU 96/53/EC", desc: "Max 44t for road trains, 40t for standard articulated lorries", limit: 44, unit: "tons", domain: "road_transport", severity: "critical" },
      { id: "EU-CABOTAGE", title: "Cabotage Limit", legal_basis: "EU 1072/2009 Art. 8", desc: "Max 3 cabotage operations within 7 days after international delivery", limit: 3, unit: "operations", domain: "road_transport", severity: "warning" },
    ]
  },
  {
    id: "dk_bus",
    name: "DK Bus & Transit",
    icon: Globe,
    color: "emerald",
    rules: [
      { id: "DK-BUS-WORK", title: "Bus Driver Working Hours", legal_basis: "BEK nr. 1408/2016", desc: "Max 10h working time per day for bus drivers", limit: 10, unit: "hours", domain: "transit", severity: "critical" },
      { id: "DK-BUS-BREAK", title: "Bus Driver Break Requirement", legal_basis: "BEK nr. 1408/2016 §7", desc: "30-minute break after 5.5 hours of work", limit: 5.5, unit: "hours", domain: "transit", severity: "warning" },
      { id: "DK-SCHOOL", title: "School Bus Safety Zones", legal_basis: "Færdselsloven §92", desc: "School buses must complete safety check within 24h of school route assignment", limit: 24, unit: "hours", domain: "transit", severity: "critical" },
      { id: "DK-BUS-NIGHT", title: "Night Service Limits", legal_basis: "Arbejdstidsloven §4", desc: "Max 8h average over 4 months for night bus workers", limit: 8, unit: "hours", domain: "transit", severity: "warning" },
    ]
  },
  {
    id: "eu_port",
    name: "EU Port & Maritime",
    icon: Satellite,
    color: "blue",
    rules: [
      { id: "ISPS-A11", title: "ISPS Port Security Level", legal_basis: "ISPS Code Part A §11", desc: "All personnel accessing restricted zones must hold ISPS approval", limit: null, unit: null, domain: "port", severity: "critical" },
      { id: "MARPOL-VI", title: "SOx Emission in ECA", legal_basis: "MARPOL Annex VI Reg. 14", desc: "Max 0.1% sulphur content in Emission Control Areas", limit: 0.1, unit: "% sulphur", domain: "port", severity: "critical" },
      { id: "EU-PORTDIR", title: "Port Service Dwell Time", legal_basis: "EU Port Services Regulation 2017/352", desc: "Non-discriminatory access to port services, max turnaround reporting windows", limit: 24, unit: "hours", domain: "port", severity: "warning" },
      { id: "DG-IMDG", title: "Dangerous Goods Segregation", legal_basis: "IMDG Code §7.2", desc: "Hazardous cargo segregation requirements in port yards", limit: null, unit: null, domain: "safety", severity: "critical" },
    ]
  },
  {
    id: "airport_icao",
    name: "Airport & ICAO",
    icon: Plane,
    color: "violet",
    rules: [
      { id: "ICAO-A-CDM", title: "A-CDM TOBT Accuracy", legal_basis: "ICAO Doc 9971 / Eurocontrol A-CDM", desc: "Target Off-Block Time (TOBT) must be updated within 5min of change", limit: 5, unit: "minutes", domain: "airport", severity: "warning" },
      { id: "EASA-GH-MIN", title: "Minimum Ground Handling Time", legal_basis: "EASA Ground Ops / Reg. 2021/664", desc: "Minimum 25 minutes ground handling for short-haul flights", limit: 25, unit: "minutes", domain: "airport", severity: "critical" },
      { id: "AIRPORT-NOISE", title: "Night Noise Curfew", legal_basis: "EU 2002/49/EC + Local regulation", desc: "No departures/arrivals during designated night hours (typically 23:00–06:00)", limit: null, unit: null, domain: "airport", severity: "critical" },
      { id: "ICS2-PRE", title: "ICS2 Pre-loading Data", legal_basis: "EU Customs ICS2 / UCC Art. 127", desc: "Air cargo must submit Entry Summary Declaration minimum 4h before EU arrival", limit: 4, unit: "hours", domain: "customs", severity: "critical" },
    ]
  },
  {
    id: "co2_esg",
    name: "CO₂ & ESG",
    icon: Leaf,
    color: "green",
    rules: [
      { id: "EU-FIT55-TRUCKS", title: "HGV CO₂ Reduction Target", legal_basis: "EU Regulation 2019/1242 (Fit for 55)", desc: "45% CO₂ reduction vs. 2019 baseline for new trucks by 2030", limit: 45, unit: "% reduction", domain: "environment", severity: "warning" },
      { id: "EU-ETS-PORT", title: "Port ETS Reporting", legal_basis: "EU ETS Directive 2023 Amendment", desc: "Ports must report verified GHG emissions annually for vessels >5000GT", limit: null, unit: null, domain: "environment", severity: "warning" },
      { id: "CSRD-SCOPE3", title: "CSRD Scope 3 Logistics", legal_basis: "EU CSRD Directive 2022/2464", desc: "Companies must disclose Scope 3 transport emissions in sustainability reports", limit: null, unit: null, domain: "environment", severity: "info" },
      { id: "CBAM-2026", title: "CBAM Carbon Levy", legal_basis: "EU CBAM Regulation 2023/956", desc: "Carbon border adjustment for imported goods — requires embedded emissions declaration from 2026", limit: null, unit: null, domain: "customs", severity: "warning" },
    ]
  },
];

const MOCK_CHECKS = [
  { id: "c1", domain: "road_transport", entity_type: "driver", entity_name: "Klaus Møller", status: "violation", severity: "critical", violation_detail: "Klaus Møller has driven 10h 45min without a mandatory 45-minute break.", legal_basis: "EC 561/2006 Art. 4(c)", current_value: 10.75, limit_value: 4.5, unit: "hours", repair_suggestion: "Insert 45-minute break at Hamburg depot (next 12 min). Adjust delivery ETA by 1h 02min.", checked_at: new Date(Date.now() - 8e5).toISOString() },
  { id: "c2", domain: "environment", entity_type: "vehicle", entity_name: "Fleet Route DK-41", status: "warning", severity: "warning", violation_detail: "Monthly CO₂ emissions on DK-41 are trending 18% above quarterly ESG target.", legal_basis: "EU CSRD 2022/2464 + internal ESG policy", current_value: 118, limit_value: 100, unit: "% of target", repair_suggestion: "Reroute 3 loads to electric vehicles. Estimated savings: 4.2t CO₂/month.", checked_at: new Date(Date.now() - 2e6).toISOString() },
  { id: "c3", domain: "transit", entity_type: "driver", entity_name: "Amina Osei (Bus 47)", status: "warning", severity: "warning", violation_detail: "Scheduled shift ends at 23:45 — exceeds the average night hours cap over 4-month reference period.", legal_basis: "BEK nr. 1408/2016 + Arbejdstidsloven §4", current_value: 8.4, limit_value: 8, unit: "hours avg", repair_suggestion: "Swap last trip (23:05–23:45) with driver Lars Bonde who has capacity.", checked_at: new Date(Date.now() - 3e6).toISOString() },
  { id: "c4", domain: "customs", entity_type: "flight", entity_name: "AF8812 CDG→CPH", status: "violation", severity: "critical", violation_detail: "Entry Summary Declaration missing fields: commodity codes (Box 31), net mass (Box 35), dangerous goods indicator. Cut-off in 47 minutes.", legal_basis: "EU ICS2 / UCC Art. 127", current_value: 0, limit_value: 4, unit: "hours remaining", repair_suggestion: "Auto-fill from cargo manifest: 6 fields pre-populated. 3 require shipper confirmation. Send automated request now.", checked_at: new Date(Date.now() - 1e5).toISOString() },
  { id: "c5", domain: "port", entity_type: "vessel", entity_name: "MSC GAIA — Berth 7", status: "compliant", severity: "info", violation_detail: null, legal_basis: "ISPS Code / MARPOL Annex VI", current_value: 0.08, limit_value: 0.1, unit: "% sulphur", repair_suggestion: null, checked_at: new Date(Date.now() - 5e6).toISOString() },
  { id: "c6", domain: "airport", entity_type: "flight", entity_name: "SK903 Turnaround", status: "warning", severity: "warning", violation_detail: "Scheduled ground handling window is 19 minutes — below the 25-minute EASA minimum for this aircraft type (A320).", legal_basis: "EASA Ground Ops / Reg. 2021/664", current_value: 19, limit_value: 25, unit: "minutes", repair_suggestion: "Delay pushback by 6 minutes. Gate B12 slot available. Downstream connection SK1240 has 18-minute buffer.", checked_at: new Date(Date.now() - 9e5).toISOString() },
];

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status];
  const colors = { compliant: "bg-emerald-400", warning: "bg-amber-400 animate-pulse", violation: "bg-red-500 animate-pulse", pending: "bg-slate-500" };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}

function ComplianceCard({ check, onClick }) {
  const cfg = STATUS_CONFIG[check.status];
  const domainCfg = DOMAIN_CONFIG[check.domain];
  const Icon = domainCfg?.icon || Shield;
  const StatusIcon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(check)}
      className={`cursor-pointer p-4 rounded-xl border transition-all ${
        check.status === "violation" ? "bg-red-500/5 border-red-500/30 hover:border-red-500/60" :
        check.status === "warning" ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
        "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          check.status === "violation" ? "bg-red-500/15" : check.status === "warning" ? "bg-amber-500/15" : "bg-emerald-500/15"
        }`}>
          <Icon className={`w-4.5 h-4.5 ${check.status === "violation" ? "text-red-400" : check.status === "warning" ? "text-amber-400" : "text-emerald-400"}`} style={{width:18,height:18}} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <StatusDot status={check.status} />
            <span className="text-white font-semibold text-sm truncate">{check.entity_name}</span>
            <Badge className={`ml-auto text-[10px] px-1.5 py-0 ${
              check.status === "violation" ? "bg-red-500/20 text-red-300 border-red-500/30" :
              check.status === "warning" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
              "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}>{cfg.label}</Badge>
          </div>
          <p className="text-slate-400 text-xs mb-1">{check.entity_type} · {domainCfg?.label}</p>
          {check.violation_detail && (
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{check.violation_detail}</p>
          )}
          <p className="text-slate-600 text-[10px] mt-1">{check.legal_basis}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

function DetailPanel({ check, onClose, onRepair, repairing }) {
  const cfg = STATUS_CONFIG[check.status];
  const domainCfg = DOMAIN_CONFIG[check.domain];
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-950 border-l border-slate-800 z-50 overflow-y-auto shadow-2xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <StatusDot status={check.status} />
            <span className={`text-sm font-bold ${check.status === "violation" ? "text-red-400" : check.status === "warning" ? "text-amber-400" : "text-emerald-400"}`}>{cfg.label.toUpperCase()}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-sm">✕ Close</button>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">{check.entity_name}</h2>
        <p className="text-slate-400 text-sm mb-5">{check.entity_type} · {domainCfg?.label} · {moment(check.checked_at).fromNow()}</p>

        {/* Violation Detail */}
        {check.violation_detail && (
          <div className={`rounded-xl p-4 mb-5 ${check.status === "violation" ? "bg-red-500/10 border border-red-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-semibold">REGULATORY INTELLECT ANALYSIS</span>
            </div>
            <p className="text-white text-sm leading-relaxed">{check.violation_detail}</p>
          </div>
        )}

        {/* Metrics */}
        {check.current_value !== undefined && check.limit_value && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className={`text-2xl font-black mb-1 ${check.current_value > check.limit_value ? "text-red-400" : "text-emerald-400"}`}>{check.current_value}</div>
              <div className="text-slate-500 text-xs">Current ({check.unit})</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-slate-300 mb-1">{check.limit_value}</div>
              <div className="text-slate-500 text-xs">Limit ({check.unit})</div>
            </div>
          </div>
        )}

        {/* Legal Basis */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-xs font-semibold">LEGAL BASIS</span>
          </div>
          <p className="text-slate-200 text-sm font-medium">{check.legal_basis}</p>
        </div>

        {/* Repair Suggestion */}
        {check.repair_suggestion && (
          <div className="bg-cyan-500/5 border border-cyan-500/25 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-semibold">AI AUTO-REPAIR SUGGESTION</span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{check.repair_suggestion}</p>
            <button
              onClick={() => onRepair(check)}
              disabled={repairing}
              className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {repairing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {repairing ? "Applying repair..." : "Apply AI Repair"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function RegulatoryIntelligence() {
  const [activeTab, setActiveTab] = useState("cockpit");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [repairedIds, setRepairedIds] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ["reg-me"], queryFn: () => base44.auth.me() });

  const { data: savedChecks = [], refetch: refetchChecks } = useQuery({
    queryKey: ["compliance-checks"],
    queryFn: () => base44.entities.ComplianceCheck.filter({ module: "cross_module" }),
  });

  const repairedEntityIds = new Set(savedChecks.filter(c => c.auto_repaired).map(c => c.entity_id));

  const checks = MOCK_CHECKS.map(c => ({ ...c, status: repairedEntityIds.has(c.id) ? "compliant" : c.status }));
  const filteredChecks = domainFilter === "all" ? checks : checks.filter(c => c.domain === domainFilter);

  const stats = useMemo(() => ({
    violations: checks.filter(c => c.status === "violation").length,
    warnings: checks.filter(c => c.status === "warning").length,
    compliant: checks.filter(c => c.status === "compliant").length,
    total: checks.length,
    score: Math.round((checks.filter(c => c.status === "compliant").length / checks.length) * 100),
  }), [checks]);

  const handleRepair = async (check) => {
    setRepairing(true);
    const orgId = currentUser?.email || "system";

    try {
      // === DRIVER violations: send OrbitMessage + email ===
      if (check.entity_type === "driver") {
        // Find driver by name match
        const allDrivers = await base44.entities.Driver.list();
        const nameParts = check.entity_name.replace(/\s*\(.*\)/, "").trim().toLowerCase().split(" ");
        const driver = allDrivers.find(d =>
          nameParts.some(p => (d.first_name + " " + d.last_name).toLowerCase().includes(p))
        );

        const msgText = `🚨 REGULATORY ALERT — ${check.legal_basis}\n\n${check.violation_detail}\n\nAI-anbefalet handling: ${check.repair_suggestion}\n\nVenligst bekræft modtagelse og følg instrukserne.`;

        // Send OrbitMessage
        await base44.entities.OrbitMessage.create({
          organization_id: orgId,
          sender_email: currentUser?.email || "system@nexusvectis.com",
          sender_name: "Regulatory Intellect AI",
          sender_role: "coordinator",
          recipient_email: driver?.email || "operations@nexusvectis.com",
          message: msgText,
          message_type: "alert",
          vehicle_id: driver?.current_vehicle_id || undefined,
        });

        // Send email
        if (driver?.email) {
          await base44.integrations.Core.SendEmail({
            to: driver.email,
            subject: `⚠️ Compliance Alert: ${check.entity_name} — ${check.legal_basis}`,
            body: msgText,
            from_name: "NexusVectis Regulatory Intellect",
          });
        }

        // Create system Alert
        await base44.entities.Alert.create({
          organization_id: orgId,
          title: `AI Repair Applied: ${check.entity_name}`,
          message: `Regulatory violation resolved via AI Repair. ${check.repair_suggestion}`,
          type: "info",
          category: "system",
        });
      }

      // === FLIGHT violations: update Flight record + Alert ===
      else if (check.entity_type === "flight") {
        const allFlights = await base44.entities.Flight.list();
        const flightNumber = check.entity_name.split(" ")[0]; // e.g. "AF8812"
        const flight = allFlights.find(f =>
          f.flight_number === flightNumber ||
          (f.flight_number || "").includes(flightNumber) ||
          check.entity_name.toLowerCase().includes((f.flight_number || "").toLowerCase())
        );

        if (flight) {
          // For ground handling violations: extend scheduled time
          if (check.id === "c6") {
            const newEta = flight.scheduled_departure
              ? new Date(new Date(flight.scheduled_departure).getTime() + 6 * 60000).toISOString()
              : undefined;
            await base44.entities.Flight.update(flight.id, {
              status: "delayed",
              ...(newEta ? { scheduled_departure: newEta } : {}),
            });
          }
          // For customs/ICS2 violations: flag the flight
          if (check.id === "c4") {
            await base44.entities.Flight.update(flight.id, {
              status: "on_hold",
            });
          }
        }

        await base44.entities.Alert.create({
          organization_id: orgId,
          title: `AI Repair: ${check.entity_name}`,
          message: check.repair_suggestion,
          type: check.severity === "critical" ? "critical" : "warning",
          category: "system",
        });

        // Email ops team
        await base44.integrations.Core.SendEmail({
          to: currentUser?.email || "ops@nexusvectis.com",
          subject: `✈️ Flight Compliance Fix Applied: ${check.entity_name}`,
          body: `AI Repair applied for ${check.entity_name}\n\nViolation: ${check.violation_detail}\n\nAction taken: ${check.repair_suggestion}\n\nLegal basis: ${check.legal_basis}`,
          from_name: "NexusVectis Regulatory Intellect",
        });
      }

      // === VEHICLE/ROUTE/VESSEL: create Alert + notify ops ===
      else {
        await base44.entities.Alert.create({
          organization_id: orgId,
          title: `Compliance Action Required: ${check.entity_name}`,
          message: `${check.violation_detail}\n\nAI Suggestion: ${check.repair_suggestion}`,
          type: check.severity === "critical" ? "critical" : "warning",
          category: "route",
        });

        await base44.integrations.Core.SendEmail({
          to: currentUser?.email || "ops@nexusvectis.com",
          subject: `🔧 Compliance Action: ${check.entity_name} — ${check.legal_basis}`,
          body: `Violation detected: ${check.violation_detail}\n\nAI recommended action: ${check.repair_suggestion}\n\nPlease action immediately.`,
          from_name: "NexusVectis Regulatory Intellect",
        });
      }

      // Save repair to DB
      await base44.entities.ComplianceCheck.create({
        organization_id: orgId,
        entity_id: check.id,
        entity_name: check.entity_name,
        entity_type: check.entity_type,
        domain: check.domain,
        module: "cross_module",
        status: "compliant",
        severity: check.severity,
        auto_repaired: true,
        repair_suggestion: check.repair_suggestion,
        checked_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        legal_basis: check.legal_basis,
      });

      await refetchChecks();
    } finally {
      setRepairing(false);
      setSelectedCheck(null);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are NexusVectis Regulatory Intellect. Generate a concise monthly compliance executive summary for a logistics & transport company.
      
Current status: ${stats.violations} violations, ${stats.warnings} warnings, ${stats.compliant} compliant checks. Score: ${stats.score}%.

Active issues:
${checks.filter(c => c.status !== "compliant").map(c => `- [${c.status.toUpperCase()}] ${c.entity_name}: ${c.violation_detail} (${c.legal_basis})`).join("\n")}

Write a professional 3-paragraph regulatory story suitable for management and regulatory authorities. Include: summary of status, key risks and their legal implications, and recommended immediate actions. Be specific and cite regulations.`,
    });
    setAiReport(result);
    setGenerating(false);
  };

  const tabs = ["cockpit", "rule_packs", "report"];

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Regulatory Intellect Layer</h1>
                  <p className="text-slate-500 text-xs">Neural compliance engine · All modules · Real-time</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Regulatory Graph Active
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-900/60 border border-slate-800 rounded-lg p-1 w-fit">
            {[["cockpit", "Compliance Cockpit"], ["rule_packs", "Rule Packs"], ["report", "Regulatory Story"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* COCKPIT */}
          {activeTab === "cockpit" && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Compliance Score", value: `${stats.score}%`, color: stats.score >= 80 ? "emerald" : stats.score >= 60 ? "amber" : "red", sub: `${stats.compliant}/${stats.total} checks` },
                  { label: "Violations", value: stats.violations, color: "red", sub: "Immediate action required" },
                  { label: "Warnings", value: stats.warnings, color: "amber", sub: "Monitor & prepare" },
                  { label: "Compliant", value: stats.compliant, color: "emerald", sub: "No action needed" },
                ].map((kpi, i) => (
                  <Card key={i} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-slate-400 text-xs mb-1">{kpi.label}</p>
                      <p className={`text-3xl font-black text-${kpi.color}-400`}>{kpi.value}</p>
                      <p className="text-slate-600 text-xs mt-0.5">{kpi.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Domain filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => setDomainFilter("all")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${domainFilter === "all" ? "bg-violet-600 border-violet-600 text-white" : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"}`}>
                  <Filter className="w-3 h-3" /> All domains
                </button>
                {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const count = checks.filter(c => c.domain === key).length;
                  if (!count) return null;
                  return (
                    <button key={key} onClick={() => setDomainFilter(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${domainFilter === key ? `bg-${cfg.color}-600 border-${cfg.color}-600 text-white` : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"}`}>
                      <Icon className="w-3 h-3" /> {cfg.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Checks list */}
              <div className="space-y-3">
                {filteredChecks.map(check => (
                  <ComplianceCard key={check.id} check={check} onClick={setSelectedCheck} />
                ))}
                {filteredChecks.length === 0 && (
                  <div className="text-center py-16 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500/40" />
                    <p>No issues in this domain</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* RULE PACKS */}
          {activeTab === "rule_packs" && (
            <div className="space-y-6">
              {RULE_PACKS.map(pack => {
                const Icon = pack.icon;
                return (
                  <Card key={pack.id} className="bg-slate-900/60 border-slate-800 overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className={`w-9 h-9 rounded-lg bg-${pack.color}-500/15 border border-${pack.color}-500/30 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${pack.color}-400`} />
                        </div>
                        {pack.name}
                        <Badge className={`ml-auto bg-${pack.color}-500/15 text-${pack.color}-300 border-${pack.color}-500/25 text-xs`}>{pack.rules.length} rules</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-800/60">
                        {pack.rules.map(rule => (
                          <div key={rule.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${rule.severity === "critical" ? "bg-red-500" : rule.severity === "warning" ? "bg-amber-400" : "bg-slate-500"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white text-sm font-semibold">{rule.title}</span>
                                {rule.limit && <span className="text-slate-400 text-xs">Limit: <strong className="text-slate-200">{rule.limit} {rule.unit}</strong></span>}
                              </div>
                              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{rule.desc}</p>
                            </div>
                            <span className="text-slate-600 text-[10px] flex-shrink-0 font-mono mt-1">{rule.legal_basis}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* REGULATORY STORY */}
          {activeTab === "report" && (
            <div>
              <Card className="bg-slate-900/60 border-slate-800 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">AI Regulatory Story</h3>
                      <p className="text-slate-400 text-xs">Monthly compliance narrative for management & authorities</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? "Generating regulatory story..." : "Generate This Month's Regulatory Story"}
                  </button>
                </CardContent>
              </Card>

              {aiReport && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-slate-900/60 border-violet-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400" />
                        Compliance Executive Summary · {moment().format("MMMM YYYY")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-slate-200 leading-relaxed whitespace-pre-line">{aiReport}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail side panel */}
      <AnimatePresence>
        {selectedCheck && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setSelectedCheck(null)} />
            <DetailPanel check={selectedCheck} onClose={() => setSelectedCheck(null)} onRepair={handleRepair} repairing={repairing} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}