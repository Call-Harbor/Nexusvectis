import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plane, Shield, Package, Users, AlertTriangle, Cpu, BarChart3, Leaf, Plus, Zap, Map, GitBranch, Car, Activity } from "lucide-react";
import AddonAccessGate from "@/components/shared/AddonAccessGate";
import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AirportKPIBanner from "@/components/airport/AirportKPIBanner";
import OpsAlertTicker from "@/components/airport/OpsAlertTicker";
import NowPanel from "@/components/airport/NowPanel";
import LiveFlightDashboard from "@/components/airport/LiveFlightDashboard";
import FlightBoard from "@/components/airport/FlightBoard";
import TurnaroundPanel from "@/components/airport/TurnaroundPanel";
import SecurityMonitor from "@/components/airport/SecurityMonitor";
import GateMap from "@/components/airport/GateMap";
import BaggageTracker from "@/components/airport/BaggageTracker";
import AirportAIAdvisor from "@/components/airport/AirportAIAdvisor";
import AirportScenarioEngine from "@/components/airport/AirportScenarioEngine";
import StaffResourcePanel from "@/components/airport/StaffResourcePanel";
import PassengerFlowAI from "@/components/airport/PassengerFlowAI";
import GateAllocationAI from "@/components/airport/GateAllocationAI";
import TerminalHeatmap from "@/components/airport/TerminalHeatmap";
import AirportSustainability from "@/components/airport/AirportSustainability";
import SmartBaggageAI from "@/components/airport/SmartBaggageAI";
import TurnaroundAI from "@/components/airport/TurnaroundAI";
import LandsideMonitor from "@/components/airport/LandsideMonitor";
import Terminal2DLayout from "@/components/airport/Terminal2DLayout";
import AirportInfraManager from "@/components/airport/AirportInfraManager";

const TABS = [
  { id: "operations", label: "LIVE OPS", icon: Plane },
  { id: "heatmap", label: "TERMINAL TWIN", icon: Map },
  { id: "terminal2d", label: "2D LAYOUT", icon: Map },
  { id: "landside", label: "LANDSIDE", icon: Car },
  { id: "ground", label: "GROUND HANDLING", icon: Zap },
  { id: "pax_flow", label: "PAX FLOW AI", icon: Users },
  { id: "gate_ai", label: "GATE AI", icon: GitBranch },
  { id: "security", label: "SECURITY & GATES", icon: Shield },
  { id: "baggage", label: "BAGGAGE AI", icon: Package },
  { id: "staff", label: "STAFF", icon: Users },
  { id: "ai", label: "AI CO-PILOT", icon: Cpu },
  { id: "scenario", label: "SCENARIOS", icon: AlertTriangle },
  { id: "sustainability", label: "CO₂ & ENERGY", icon: Leaf },
  { id: "infra", label: "INFRASTRUCTURE", icon: Plus },
];

function AirportOpsCenterContent() {
  const [activeTab, setActiveTab] = useState("operations");
  const [orgId, setOrgId] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showAddFlight, setShowAddFlight] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setOrgId(u?.organization_id || "__all__");
      setDataReady(true);
    }).catch(() => setDataReady(true));
  }, []);

  const qOpts = (key, fn) => ({ queryKey: [key, orgId], queryFn: fn, enabled: dataReady && !!orgId, refetchInterval: 30000 });

  const { data: flights = [] } = useQuery(qOpts("aoc_flights", () => base44.entities.Flight.filter({ organization_id: orgId }, "-created_date", 200)));
  const { data: gates = [] } = useQuery(qOpts("aoc_gates", () => base44.entities.AirportGate.filter({ organization_id: orgId }, "gate_code", 80)));
  const { data: securityLanes = [] } = useQuery(qOpts("aoc_lanes", () => base44.entities.SecurityLane.filter({ organization_id: orgId }, "name", 30)));
  const { data: tasks = [] } = useQuery(qOpts("aoc_tasks", () => base44.entities.GroundHandlingTask.filter({ organization_id: orgId }, "-created_date", 200)));
  const { data: bags = [] } = useQuery(qOpts("aoc_bags", () => base44.entities.BaggageItem.filter({ organization_id: orgId }, "-created_date", 500)));
  const { data: staff = [] } = useQuery(qOpts("aoc_staff", () => base44.entities.AirportStaff.filter({ organization_id: orgId }, "-created_date", 200)));

  const activeFlights = flights.filter(f => !["scheduled", "completed", "cancelled"].includes(f.status));
  const delayedFlights = flights.filter(f => (f.delay_minutes || 0) > 15);

  // Live clock
  const [clock, setClock] = useState(moment().format("HH:mm:ss"));
  useEffect(() => {
    const t = setInterval(() => setClock(moment().format("HH:mm:ss")), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div className="relative border-b border-cyan-900/40" style={{ background: "linear-gradient(180deg, rgba(0,15,35,0.99) 0%, rgba(0,8,20,0.99) 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)" }} />
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg className="absolute" width="40" height="40" viewBox="0 0 40 40">
                <polygon points="20,3 35,10 35,30 20,37 5,30 5,10" fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" strokeWidth="1" />
              </svg>
              <Plane className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase" style={{ color: "#8b5cf6", textShadow: "0 0 20px rgba(139,92,246,0.6)" }}>
                NEXUSVECTIS AIRPORT OPS
              </h1>
              <p className="text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.3em] uppercase hidden sm:block" style={{ color: "rgba(139,92,246,0.4)" }}>
                AI-Powered Airport Operations Command Center
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3 sm:gap-5">
            {[
              { label: "ACTIVE FLIGHTS", val: activeFlights.length, color: "#8b5cf6" },
              { label: "DELAYED", val: delayedFlights.length, color: delayedFlights.length > 0 ? "#f43f5e" : "#10b981" },
              { label: "SEC LANES", val: securityLanes.filter(l => l.status === "open").length, color: "#06b6d4" },
              { label: "STAFF ON DUTY", val: staff.filter(s => ["on_duty","assigned"].includes(s.status)).length, color: "#10b981" },
            ].map(k => (
              <div key={k.label} className="text-center hidden sm:block">
                <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(139,92,246,0.4)" }}>{k.label}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
              </div>
            ))}
            <div className="text-right">
              <p className="text-2xl font-black font-mono" style={{ color: "#06b6d4", textShadow: "0 0 20px rgba(6,182,212,0.4)" }}>{clock}</p>
              <p className="text-[8px] tracking-widest" style={{ color: "rgba(6,182,212,0.4)" }}>{moment().format("ddd DD MMM YYYY", "en").toUpperCase()}</p>
            </div>
            <button onClick={() => setShowAddFlight(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[9px] tracking-widest uppercase">Add Flight</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] tracking-widest uppercase" style={{ color: "#10b981" }}>OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <AirportKPIBanner flights={flights} securityLanes={securityLanes} gates={gates} tasks={tasks} bags={bags} staff={staff} />

      {/* Tabs */}
      <div className="border-b border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="flex px-3 sm:px-6 pt-2 min-w-max">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 mr-1 whitespace-nowrap flex-shrink-0"
              style={{
                color: active ? "#8b5cf6" : "rgba(100,116,139,0.6)",
                borderColor: active ? "#8b5cf6" : "transparent",
                background: active ? "rgba(139,92,246,0.05)" : "transparent",
                textShadow: active ? "0 0 8px rgba(139,92,246,0.4)" : "none",
              }}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === "operations" && (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0 space-y-4">
              <OpsAlertTicker flights={flights} securityLanes={securityLanes} tasks={tasks} gates={gates} bags={bags} />
              <LiveFlightDashboard orgId={orgId} />
            </div>
            <NowPanel flights={flights} securityLanes={securityLanes} gates={gates} />
          </div>
        )}
        {activeTab === "ground" && (
          <div className="space-y-4">
            <TurnaroundAI flights={flights} tasks={tasks} />
            <div className="grid grid-cols-2 gap-4">
              <TurnaroundPanel flights={flights} tasks={tasks} />
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(0,10,25,0.6)" }}>
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "#f59e0b" }}>Task Overview</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["pending","in_progress","completed","delayed","skipped"].map(s => {
                      const count = tasks.filter(t => t.status === s).length;
                      const colors = { pending:"#64748b", in_progress:"#06b6d4", completed:"#10b981", delayed:"#f43f5e", skipped:"#475569" };
                      return (
                        <div key={s} className="text-center p-2 rounded-lg" style={{ background: `${colors[s]}10`, border: `1px solid ${colors[s]}25` }}>
                          <p className="text-[8px] uppercase tracking-widest mb-1" style={{ color: `${colors[s]}88` }}>{s.replace(/_/g," ")}</p>
                          <p className="text-xl font-bold" style={{ color: colors[s] }}>{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "security" && (
          <div className="grid grid-cols-2 gap-4">
            <SecurityMonitor securityLanes={securityLanes} staff={staff} />
            <GateMap gates={gates} flights={flights} />
          </div>
        )}
        {activeTab === "baggage" && (
          <div className="space-y-4">
            <SmartBaggageAI bags={bags} flights={flights} />
            <BaggageTracker bags={bags} flights={flights} />
          </div>
        )}
        {activeTab === "staff" && <StaffResourcePanel staff={staff} />}
        {activeTab === "ai" && (
          <div className="h-[600px]">
            <AirportAIAdvisor flights={flights} securityLanes={securityLanes} gates={gates} tasks={tasks} bags={bags} />
          </div>
        )}
        {activeTab === "heatmap" && <TerminalHeatmap flights={flights} securityLanes={securityLanes} bags={bags} gates={gates} />}
        {activeTab === "terminal2d" && <Terminal2DLayout flights={flights} gates={gates} securityLanes={securityLanes} bags={bags} />}
        {activeTab === "landside" && <LandsideMonitor flights={flights} orgId={orgId} />}
        {activeTab === "pax_flow" && <PassengerFlowAI flights={flights} securityLanes={securityLanes} staff={staff} />}
        {activeTab === "gate_ai" && <GateAllocationAI gates={gates} flights={flights} />}
        {activeTab === "scenario" && <AirportScenarioEngine flights={flights} gates={gates} securityLanes={securityLanes} />}
        {activeTab === "sustainability" && <AirportSustainability flights={flights} tasks={tasks} />}
        {activeTab === "infra" && <AirportInfraManager />}
      </div>

      <AddFlightDialog
        open={showAddFlight}
        onClose={() => setShowAddFlight(false)}
        gates={gates}
        orgId={orgId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["flights_airport"] })}
      />
    </div>
  );
}

export default function AirportOpsCenter() {
  return (
    <AddonAccessGate
      addonKey="addon_airport_ops"
      icon={Plane}
      title="Airport Ops Center"
      description="AI-powered airport operations command center with real-time flights, baggage tracking, security monitoring, and AI Co-Pilot."
      color="#8b5cf6"
    >
      <AirportOpsCenterContent />
    </AddonAccessGate>
  );
}

function AddFlightDialog({ open, onClose, gates, orgId, onSuccess }) {
  const [f, setF] = useState({
    flight_number: "", airline: "", origin: "", destination: "",
    flight_type: "departure", status: "scheduled", priority: "normal",
    scheduled_time: "", gate_id: "", aircraft_type: "", pax_total: 0,
    schengen: true, delay_minutes: 0
  });

  const create = useMutation({
    mutationFn: d => base44.entities.Flight.create({ ...d, organization_id: orgId }),
    onSuccess: () => {
      onSuccess();
      onClose();
      setF({ flight_number: "", airline: "", origin: "", destination: "", flight_type: "departure", status: "scheduled", priority: "normal", scheduled_time: "", gate_id: "", aircraft_type: "", pax_total: 0, schengen: true, delay_minutes: 0 });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Flight</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Flight Number *</Label><Input value={f.flight_number} onChange={e => setF({...f, flight_number: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="SK204" /></div>
             <div><Label>Airline</Label><Input value={f.airline} onChange={e => setF({...f, airline: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="SAS" /></div>
             <div><Label>Origin (IATA)</Label><Input value={f.origin} onChange={e => setF({...f, origin: e.target.value.toUpperCase()})} className="bg-slate-800 border-slate-700" placeholder="CPH" /></div>
             <div><Label>Destination (IATA)</Label><Input value={f.destination} onChange={e => setF({...f, destination: e.target.value.toUpperCase()})} className="bg-slate-800 border-slate-700" placeholder="LHR" /></div>
            <div><Label>Flight Type</Label>
              <Select value={f.flight_type} onValueChange={v => setF({...f, flight_type: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrival">Arrival</SelectItem>
                  <SelectItem value="departure">Departure</SelectItem>
                  <SelectItem value="turnaround">Turnaround</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={f.status} onValueChange={v => setF({...f, status: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="boarding">Boarding</SelectItem>
                  <SelectItem value="at_gate">At Gate</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="departed">Departed</SelectItem>
                  <SelectItem value="landed">Landed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Scheduled Time</Label><Input type="datetime-local" value={f.scheduled_time} onChange={e => setF({...f, scheduled_time: e.target.value})} className="bg-slate-800 border-slate-700" /></div>
            <div><Label>Gate</Label>
              <Select value={f.gate_id} onValueChange={v => setF({...f, gate_id: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select gate..." /></SelectTrigger>
                <SelectContent>{gates.map(g => <SelectItem key={g.id} value={g.id}>{g.gate_code} — {g.terminal}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Aircraft Type</Label><Input value={f.aircraft_type} onChange={e => setF({...f, aircraft_type: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="B737" /></div>
            <div><Label>Total PAX</Label><Input type="number" value={f.pax_total} onChange={e => setF({...f, pax_total: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
            <div><Label>Delay (minutes)</Label><Input type="number" value={f.delay_minutes} onChange={e => setF({...f, delay_minutes: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
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
          </div>
          <button
            onClick={() => create.mutate(f)}
            disabled={!f.flight_number || create.isPending}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#8b5cf6", opacity: !f.flight_number ? 0.4 : 1 }}>
            {create.isPending ? "Saving..." : "Add Flight"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}