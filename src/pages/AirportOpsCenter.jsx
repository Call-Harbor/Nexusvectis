import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plane, Shield, Package, Users, AlertTriangle, Cpu, BarChart3, Leaf, Plus, Zap, Map, GitBranch, Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AirportKPIBanner from "@/components/airport/AirportKPIBanner";
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

export default function AirportOpsCenter() {
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

  const qOpts = (key, fn) => ({ queryKey: [key], queryFn: fn, enabled: dataReady, refetchInterval: 30000 });

  const { data: flights = [] } = useQuery(qOpts("flights_airport", () => base44.entities.Flight.list("-scheduled_time", 100)));
  const { data: gates = [] } = useQuery(qOpts("airport_gates", () => base44.entities.AirportGate.list("-created_date", 50)));
  const { data: securityLanes = [] } = useQuery(qOpts("security_lanes", () => base44.entities.SecurityLane.list("-created_date", 30)));
  const { data: tasks = [] } = useQuery(qOpts("gh_tasks", () => base44.entities.GroundHandlingTask.list("-created_date", 200)));
  const { data: bags = [] } = useQuery(qOpts("baggage_items", () => base44.entities.BaggageItem.list("-created_date", 500)));
  const { data: staff = [] } = useQuery(qOpts("airport_staff", () => base44.entities.AirportStaff.list("-created_date", 200)));

  const activeFlights = flights.filter(f => !["scheduled", "completed", "cancelled"].includes(f.status));
  const delayedFlights = flights.filter(f => (f.delay_minutes || 0) > 15);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div className="relative border-b border-cyan-900/40" style={{ background: "linear-gradient(180deg, rgba(0,15,35,0.99) 0%, rgba(0,8,20,0.99) 100%)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)" }} />
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="absolute" width="40" height="40" viewBox="0 0 40 40">
                <polygon points="20,3 35,10 35,30 20,37 5,30 5,10" fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" strokeWidth="1" />
              </svg>
              <Plane className="w-5 h-5 relative z-10" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-[0.25em] uppercase" style={{ color: "#8b5cf6", textShadow: "0 0 20px rgba(139,92,246,0.6)" }}>
                NEXUSVECTIS AIRPORT OPS
              </h1>
              <p className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(139,92,246,0.4)" }}>
                AI-POWERED AIRPORT OPERATIONS COMMAND CENTER
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "ACTIVE FLIGHTS", val: activeFlights.length, color: "#8b5cf6" },
              { label: "DELAYED", val: delayedFlights.length, color: delayedFlights.length > 0 ? "#f43f5e" : "#10b981" },
              { label: "SEC LANES", val: securityLanes.filter(l => l.status === "open").length, color: "#06b6d4" },
              { label: "STAFF ON DUTY", val: staff.filter(s => ["on_duty","assigned"].includes(s.status)).length, color: "#10b981" },
            ].map(k => (
              <div key={k.label} className="text-center">
                <p className="text-[8px] tracking-widest uppercase" style={{ color: "rgba(139,92,246,0.4)" }}>{k.label}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</p>
              </div>
            ))}
            <button onClick={() => setShowAddFlight(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:opacity-80"
              style={{ border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[9px] tracking-widest uppercase">ADD FLIGHT</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded" style={{ border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] tracking-widest uppercase" style={{ color: "#10b981" }}>OPERATIONAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <AirportKPIBanner flights={flights} securityLanes={securityLanes} gates={gates} tasks={tasks} />

      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 px-6 pt-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 mr-1"
              style={{
                color: active ? "#8b5cf6" : "rgba(100,116,139,0.6)",
                borderColor: active ? "#8b5cf6" : "transparent",
                background: active ? "rgba(139,92,246,0.05)" : "transparent",
                textShadow: active ? "0 0 8px rgba(139,92,246,0.4)" : "none",
              }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === "operations" && (
          <div className="space-y-4">
            <FlightBoard flights={flights} gates={gates} onSelect={setSelectedFlight} />
          </div>
        )}

        {activeTab === "ground" && (
          <div className="space-y-4">
            <TurnaroundAI flights={flights} tasks={tasks} />
            <div className="grid grid-cols-2 gap-4">
              <TurnaroundPanel flights={flights} tasks={tasks} />
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(0,10,25,0.6)" }}>
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "#f59e0b" }}>TASK OVERVIEW</h3>
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

        {activeTab === "staff" && (
          <StaffResourcePanel staff={staff} />
        )}

        {activeTab === "ai" && (
          <div className="h-[600px]">
            <AirportAIAdvisor flights={flights} securityLanes={securityLanes} gates={gates} tasks={tasks} bags={bags} />
          </div>
        )}

        {activeTab === "heatmap" && (
          <TerminalHeatmap flights={flights} securityLanes={securityLanes} bags={bags} gates={gates} />
        )}

        {activeTab === "terminal2d" && (
          <Terminal2DLayout flights={flights} gates={gates} securityLanes={securityLanes} bags={bags} />
        )}

        {activeTab === "landside" && (
          <LandsideMonitor flights={flights} orgId={orgId} />
        )}

        {activeTab === "pax_flow" && (
          <PassengerFlowAI flights={flights} securityLanes={securityLanes} staff={staff} />
        )}

        {activeTab === "gate_ai" && (
          <GateAllocationAI gates={gates} flights={flights} />
        )}

        {activeTab === "scenario" && (
          <AirportScenarioEngine flights={flights} gates={gates} securityLanes={securityLanes} />
        )}

        {activeTab === "sustainability" && (
          <AirportSustainability flights={flights} tasks={tasks} />
        )}

        {activeTab === "infra" && (
          <AirportInfraManager />
        )}
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