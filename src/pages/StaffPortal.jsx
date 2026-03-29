import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, Plane, Car, Clock, LogOut, Users, Zap,
  ChevronRight, Activity, AlertTriangle, Wrench
} from "lucide-react";
import GateAgentTab from "@/components/staff/GateAgentTab";
import TerminalMapBuilder from "@/components/staff/TerminalMapBuilder";
import { Map } from "lucide-react";
import SecurityTab from "@/components/staff/SecurityTab";
import LandsideTab from "@/components/staff/LandsideTab";
import GroundHandlingTab from "@/components/staff/GroundHandlingTab";
import IncidentTab from "@/components/staff/IncidentTab";
import SupervisorTab from "@/components/staff/SupervisorTab";

const ROLES = [
  {
    id: "gate_agent", label: "Gate Agent", icon: Plane, color: "#06b6d4", desc: "Gates, boarding & fly status",
    tabs: [
      { id: "gates", label: "Gates", icon: Plane },
      { id: "ground", label: "Handling", icon: Wrench },
      { id: "incidents", label: "Incidents", icon: AlertTriangle },
    ]
  },
  {
    id: "security_officer", label: "Security", icon: Shield, color: "#f59e0b", desc: "Lanes, kø & ventetider",
    tabs: [
      { id: "security", label: "Lanes", icon: Shield },
      { id: "incidents", label: "Incidents", icon: AlertTriangle },
    ]
  },
  {
    id: "bus_driver", label: "Transport", icon: Car, color: "#8b5cf6", desc: "Landside zoner & afgange",
    tabs: [
      { id: "landside", label: "Zoner", icon: Car },
      { id: "incidents", label: "Incidents", icon: AlertTriangle },
    ]
  },
  {
    id: "supervisor", label: "Supervisor", icon: Users, color: "#f43f5e", desc: "Fuldt overblik & AI analyse",
    tabs: [
      { id: "supervisor", label: "Overblik", icon: Zap },
      { id: "map", label: "Kortoverblik", icon: Map },
      { id: "gates", label: "Gates", icon: Plane },
      { id: "security", label: "Security", icon: Shield },
      { id: "landside", label: "Landside", icon: Car },
      { id: "ground", label: "Handling", icon: Wrench },
      { id: "incidents", label: "Incidents", icon: AlertTriangle },
    ]
  },
];

function useShiftLog() {
  const [log, setLog] = useState([]);
  const add = (msg, type = "info") =>
    setLog(l => [{ msg, type, time: new Date() }, ...l].slice(0, 30));
  return { log, add };
}

function ShiftLog({ log }) {
  if (!log.length) return null;
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ border: "1px solid rgba(30,41,59,0.8)", background: "rgba(2,8,23,0.5)" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5" /> Vagtlog ({log.length})
      </p>
      <div className="space-y-2">
        {log.slice(0, 8).map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 w-10 flex-shrink-0">{e.time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className={e.type === "success" ? "text-emerald-400" : e.type === "alert" ? "text-amber-400" : "text-slate-400"}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-5">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-900/50">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Staff Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Vælg din rolle for vagten</p>
        </div>
        <div className="space-y-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.id} onClick={() => onSelect(r)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl active:scale-98 transition-all"
                style={{ background: `${r.color}10`, border: `2px solid ${r.color}30` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}25` }}>
                  <Icon className="w-7 h-7" style={{ color: r.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-lg">{r.label}</p>
                  <p className="text-sm text-slate-400">{r.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TAB_PANELS = {
  gates: (props) => <GateAgentTab {...props} />,
  security: (props) => <SecurityTab {...props} />,
  landside: (props) => <LandsideTab {...props} />,
  ground: (props) => <GroundHandlingTab {...props} />,
  incidents: (props) => <IncidentTab {...props} />,
  supervisor: (props) => <SupervisorTab {...props} />,
  map: ({ orgId }) => <TerminalMapBuilder orgId={orgId} />,
};

export default function StaffPortal() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [time, setTime] = useState(new Date());
  const { log, add: logAdd } = useShiftLog();

  useEffect(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || null)).catch(() => {});
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const selectRole = (r) => {
    setRole(r);
    setActiveTab(r.tabs[0].id);
    logAdd(`Vagt startet som ${r.label}`, "info");
  };

  if (!role) return <RoleSelector onSelect={selectRole} />;

  const RoleIcon = role.icon;
  const CurrentPanel = TAB_PANELS[activeTab];

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ WebkitTapHighlightColor: "transparent" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(2,6,23,0.97)", borderBottom: `3px solid ${role.color}25`, backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
            <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
          </div>
          <div>
            <p className="font-black text-white text-base leading-tight">{role.label}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {time.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
              {log.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${role.color}20`, color: role.color }}>
                  {log.length}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setRole(null)}
          className="w-10 h-10 rounded-xl flex items-center justify-center active:bg-slate-800 transition-colors"
          style={{ border: "1.5px solid rgba(51,65,85,0.5)" }}>
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[61px] z-10 flex gap-1 px-4 py-2 overflow-x-auto scrollbar-none"
        style={{ background: "rgba(2,6,23,0.95)", borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
        {role.tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isActive ? `${role.color}20` : "transparent",
                color: isActive ? role.color : "#64748b",
                border: `1.5px solid ${isActive ? role.color + "50" : "transparent"}`
              }}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {CurrentPanel && <CurrentPanel orgId={orgId} logAdd={logAdd} />}
        <ShiftLog log={log} />
      </div>
    </div>
  );
}