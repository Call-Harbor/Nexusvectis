import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import PortKPIBanner from "@/components/port/PortKPIBanner";
import PortBerthBoard from "@/components/port/PortBerthBoard";
import PortVesselQueue from "@/components/port/PortVesselQueue";
import PortYardOverview from "@/components/port/PortYardOverview";
import PortGateMonitor from "@/components/port/PortGateMonitor";
import PortAIAdvisor from "@/components/port/PortAIAdvisor";
import PortScenarioEngine from "@/components/port/PortScenarioEngine";
import { Ship, Anchor, Cpu, BarChart3, AlertTriangle, Leaf, Settings, Zap, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABS = [
  { id: "berth", label: "BERTH PLAN", icon: Anchor },
  { id: "yard", label: "YARD", icon: BarChart3 },
  { id: "gate", label: "GATE & RAIL", icon: Zap },
  { id: "ai", label: "AI ADVISOR", icon: Cpu },
  { id: "scenario", label: "SCENARIER", icon: AlertTriangle },
  { id: "sustainability", label: "CO₂", icon: Leaf },
];

export default function PortCommandCenter() {
  const [activeTab, setActiveTab] = useState("berth");
  const [orgId, setOrgId] = useState(null);
  const [selectedPortCall, setSelectedPortCall] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [showAddPortCall, setShowAddPortCall] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setOrgId(u?.organization_id || "__all__");
      setDataReady(true);
    }).catch(() => setDataReady(true));
  }, []);

  const buildFilter = (extra = {}) => orgId && orgId !== "__all__" ? { organization_id: orgId, ...extra } : extra;

  const queryClient = useQueryClient();

  const { data: portCalls = [], refetch: refetchPortCalls } = useQuery({
    queryKey: ["portCalls"],
    queryFn: () => base44.entities.PortCall.list("-eta", 50),
    enabled: dataReady,
    refetchInterval: 30000,
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ["vessels_port"],
    queryFn: () => base44.entities.Vessel.list("-created_date", 100),
    enabled: dataReady,
  });

  const { data: berths = [] } = useQuery({
    queryKey: ["berths_mgr"],
    queryFn: () => base44.entities.Berth.list("-created_date", 50),
    enabled: dataReady,
  });

  const { data: cranes = [] } = useQuery({
    queryKey: ["cranes_port"],
    queryFn: () => base44.entities.PortCrane.list("-created_date", 50),
    enabled: dataReady,
  });

  const { data: yardZones = [] } = useQuery({
    queryKey: ["yards_mgr"],
    queryFn: () => base44.entities.YardZone.list("-created_date", 50),
    enabled: dataReady,
  });

  const { data: gates = [] } = useQuery({
    queryKey: ["gates_mgr"],
    queryFn: () => base44.entities.PortGate.list("-created_date", 20),
    enabled: dataReady,
  });

  const { data: railSlots = [] } = useQuery({
    queryKey: ["rails_mgr"],
    queryFn: () => base44.entities.RailSlot.list("-created_date", 30),
    enabled: dataReady,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment_port"],
    queryFn: () => base44.entities.PortEquipment.list("-created_date", 100),
    enabled: dataReady,
  });

  const activeCalls = portCalls.filter(pc => ["approaching", "berthed", "operations"].includes(pc.status));
  const plannedCalls = portCalls.filter(pc => pc.status === "planned");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div className="relative border-b border-cyan-900/40" style={{ background: "linear-gradient(180deg, rgba(0,20,40,0.98) 0%, rgba(0,10,25,0.98) 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="absolute" width="40" height="40" viewBox="0 0 40 40">
                <polygon points="20,3 35,10 35,30 20,37 5,30 5,10" fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1" />
              </svg>
              <Ship className="w-5 h-5 relative z-10" style={{ color: "#06b6d4" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.25em] uppercase" style={{ color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.6)" }}>
                NEXUSVECTIS PORT
              </h1>
              <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>
                AI-DREVET PORT OPERATIONS COMMAND CENTER
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>ACTIVE CALLS</p>
              <p className="text-2xl font-bold" style={{ color: "#06b6d4", textShadow: "0 0 10px rgba(6,182,212,0.5)" }}>{activeCalls.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>PLANNED</p>
              <p className="text-2xl font-bold" style={{ color: "#8b5cf6" }}>{plannedCalls.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(6,182,212,0.4)" }}>CRANES ACTIVE</p>
              <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{cranes.filter(c => c.status === "working").length}</p>
            </div>
            <button
              onClick={() => setShowAddPortCall(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80"
              style={{ border: "1px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.1)" }}
            >
              <Plus className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
              <span className="text-[9px] tracking-widest uppercase" style={{ color: "#06b6d4" }}>NEW PORT CALL</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] tracking-widest uppercase" style={{ color: "#10b981" }}>OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <PortKPIBanner portCalls={portCalls} cranes={cranes} yardZones={yardZones} gates={gates} equipment={equipment} />

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 px-6 pt-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 mr-1"
              style={{
                color: active ? "#06b6d4" : "rgba(100,116,139,0.6)",
                borderColor: active ? "#06b6d4" : "transparent",
                background: active ? "rgba(6,182,212,0.05)" : "transparent",
                textShadow: active ? "0 0 8px rgba(6,182,212,0.4)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === "berth" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <PortBerthBoard
                berths={berths} portCalls={portCalls} vessels={vessels} cranes={cranes}
                onSelectPortCall={setSelectedPortCall}
              />
            </div>
            <div>
              <PortVesselQueue portCalls={portCalls} vessels={vessels} onSelectPortCall={setSelectedPortCall} />
            </div>
          </div>
        )}
        {activeTab === "yard" && (
          <PortYardOverview yardZones={yardZones} equipment={equipment} orgId={orgId} />
        )}
        {activeTab === "gate" && (
          <PortGateMonitor gates={gates} railSlots={railSlots} />
        )}
        {activeTab === "ai" && (
          <PortAIAdvisor portCalls={portCalls} vessels={vessels} cranes={cranes} yardZones={yardZones} gates={gates} orgId={orgId} />
        )}
        {activeTab === "scenario" && (
          <PortScenarioEngine portCalls={portCalls} berths={berths} cranes={cranes} yardZones={yardZones} orgId={orgId} />
        )}
        {activeTab === "sustainability" && (
          <PortSustainability portCalls={portCalls} equipment={equipment} cranes={cranes} />
        )}
      </div>

      <AddPortCallDialog
        open={showAddPortCall}
        onClose={() => setShowAddPortCall(false)}
        vessels={vessels}
        berths={berths}
        orgId={orgId}
        onSuccess={() => queryClient.invalidateQueries({queryKey: ["portCalls"]})}
      />
    </div>
  );
}

function AddPortCallDialog({ open, onClose, vessels, berths, orgId, onSuccess }) {
  const [f, setF] = useState({ vessel_id: "", berth_id: "", eta: "", etd: "", status: "planned", priority: "normal", cargo_profile: "mixed", import_teu: 0, export_teu: 0, agent: "" });
  const create = useMutation({
    mutationFn: d => base44.entities.PortCall.create({ ...d, organization_id: orgId }),
    onSuccess: () => { onSuccess(); onClose(); setF({ vessel_id: "", berth_id: "", eta: "", etd: "", status: "planned", priority: "normal", cargo_profile: "mixed", import_teu: 0, export_teu: 0, agent: "" }); }
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Port Call</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Vessel *</Label>
              <Select value={f.vessel_id} onValueChange={v => setF({...f, vessel_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select vessel..." /></SelectTrigger>
                <SelectContent>{vessels.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Berth</Label>
              <Select value={f.berth_id} onValueChange={v => setF({...f, berth_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select berth..." /></SelectTrigger>
                <SelectContent>{berths.map(b => <SelectItem key={b.id} value={b.id}>{b.name} {b.terminal ? `— ${b.terminal}` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>ETA</Label><Input type="datetime-local" value={f.eta} onChange={e => setF({...f, eta: e.target.value})} className="bg-slate-800 border-slate-700" /></div>
            <div><Label>ETD</Label><Input type="datetime-local" value={f.etd} onChange={e => setF({...f, etd: e.target.value})} className="bg-slate-800 border-slate-700" /></div>
            <div><Label>Status</Label>
              <Select value={f.status} onValueChange={v => setF({...f, status: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="approaching">Approaching</SelectItem>
                  <SelectItem value="berthed">Berthed</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={f.priority} onValueChange={v => setF({...f, priority: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Cargo Profile</Label>
              <Select value={f.cargo_profile} onValueChange={v => setF({...f, cargo_profile: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="transit">Transit</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Import TEU</Label><Input type="number" value={f.import_teu} onChange={e => setF({...f, import_teu: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
            <div><Label>Export TEU</Label><Input type="number" value={f.export_teu} onChange={e => setF({...f, export_teu: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
            <div className="col-span-2"><Label>Shipping Agent</Label><Input value={f.agent} onChange={e => setF({...f, agent: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="e.g. GAC Shipping" /></div>
          </div>
          <button
            onClick={() => create.mutate(f)}
            disabled={!f.vessel_id || !f.eta || create.isPending}
            className="w-full py-2 rounded-lg font-semibold text-sm transition-all"
            style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4", opacity: (!f.vessel_id || !f.eta) ? 0.4 : 1 }}
          >
            {create.isPending ? "Saving..." : "Create Port Call"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PortSustainability({ portCalls, equipment, cranes }) {
  const totalCO2 = portCalls.reduce((s, p) => s + (p.co2_at_berth_kg || 0), 0);
  const electricEq = equipment.filter(e => e.fuel_type === "electric" || e.fuel_type === "hydrogen").length;
  const shorePower = portCalls.filter(p => p.shore_power_connected).length;

  return (
    <div className="space-y-4">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#10b981" }}>BÆREDYGTIGHED & CO₂ OVERBLIK</h2>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "CO₂ Udledning (kg)", value: totalCO2.toLocaleString(), color: "#f43f5e" },
          { label: "Shore Power Aktiv", value: shorePower, color: "#10b981" },
          { label: "El-/Brint Udstyr", value: electricEq, color: "#06b6d4" },
          { label: "Kran Energi kWh", value: cranes.reduce((s, c) => s + (c.energy_kwh_today || 0), 0).toLocaleString(), color: "#f59e0b" },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl p-4" style={{ border: `1px solid ${kpi.color}22`, background: `${kpi.color}08` }}>
            <p className="text-[8px] tracking-widest uppercase mb-2" style={{ color: `${kpi.color}88` }}>{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-6 text-center" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.04)" }}>
        <p className="text-[9px] tracking-widest uppercase mb-2" style={{ color: "rgba(16,185,129,0.5)" }}>AI CO₂ ANBEFALING</p>
        <p className="text-slate-300 text-sm">
          Aktivér shore power på alle kajer med tilgængeligt udstyr. Det estimerede besparingspotentiale er <span style={{ color: "#10b981" }}>38% CO₂-reduktion</span> per anløb. 
          Skift 4 dieseltraktorer til el-traktorer for yderligere <span style={{ color: "#10b981" }}>12 ton CO₂/måned</span> besparelse.
        </p>
      </div>
    </div>
  );
}