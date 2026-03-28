import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Plane, Shield, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GATE_STATUS_COLOR = { open: "bg-emerald-500/20 text-emerald-400", occupied: "bg-cyan-500/20 text-cyan-400", maintenance: "bg-amber-500/20 text-amber-400", closed: "bg-rose-500/20 text-rose-400" };
const LANE_STATUS_COLOR = { open: "bg-emerald-500/20 text-emerald-400", closed: "bg-rose-500/20 text-rose-400", degraded: "bg-amber-500/20 text-amber-400" };
const STAFF_STATUS_COLOR = { on_duty: "bg-emerald-500/20 text-emerald-400", assigned: "bg-cyan-500/20 text-cyan-400", on_break: "bg-amber-500/20 text-amber-400", off_duty: "bg-slate-500/20 text-slate-400" };

const TABS = [
  { id: "gates", label: "Gates", icon: Plane },
  { id: "security", label: "Security Lanes", icon: Shield },
  { id: "staff", label: "Staff", icon: Users },
];

export default function AirportInfraManager() {
  const [activeTab, setActiveTab] = useState("gates");
  const [showDialog, setShowDialog] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const queryClient = useQueryClient();

  useState(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || "__all__")).catch(() => {});
  });

  const { data: gates = [] } = useQuery({ queryKey: ["infra_gates"], queryFn: () => base44.entities.AirportGate.list("-created_date", 50) });
  const { data: lanes = [] } = useQuery({ queryKey: ["infra_lanes"], queryFn: () => base44.entities.SecurityLane.list("-created_date", 30) });
  const { data: staff = [] } = useQuery({ queryKey: ["infra_staff"], queryFn: () => base44.entities.AirportStaff.list("-created_date", 100) });

  const deleteGate = useMutation({ mutationFn: id => base44.entities.AirportGate.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_gates"] }) });
  const deleteLane = useMutation({ mutationFn: id => base44.entities.SecurityLane.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_lanes"] }) });
  const deleteStaff = useMutation({ mutationFn: id => base44.entities.AirportStaff.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_staff"] }) });

  return (
    <div className="mt-8 rounded-2xl border border-violet-500/20 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Airport Infrastructure</h2>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 ml-2">
            {gates.length}G · {lanes.length}L · {staff.length}S
          </Badge>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-800 pb-2">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === t.id ? "bg-violet-500/20 text-violet-300" : "text-slate-500 hover:text-slate-300"}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Gates */}
      {activeTab === "gates" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {gates.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-4">No gates added yet</p>}
          {gates.map(g => (
            <div key={g.id} className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 flex items-start justify-between group">
              <div>
                <p className="font-bold text-white text-sm">{g.gate_code}</p>
                <p className="text-xs text-slate-400">{g.terminal} · {g.gate_type}</p>
                <Badge className={`mt-1 text-[10px] ${GATE_STATUS_COLOR[g.status] || "bg-slate-500/20 text-slate-400"}`}>{g.status}</Badge>
                {g.pax_waiting > 0 && <p className="text-xs text-cyan-400 mt-0.5">{g.pax_waiting} pax waiting</p>}
              </div>
              <button onClick={() => deleteGate.mutate(g.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security Lanes */}
      {activeTab === "security" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {lanes.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-4">No security lanes added yet</p>}
          {lanes.map(l => (
            <div key={l.id} className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 flex items-start justify-between group">
              <div>
                <p className="font-bold text-white text-sm">{l.name}</p>
                <p className="text-xs text-slate-400">{l.terminal} · {l.lane_type}</p>
                <Badge className={`mt-1 text-[10px] ${LANE_STATUS_COLOR[l.status] || ""}`}>{l.status}</Badge>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  <span>Queue: {l.queue_length || 0}</span>
                  <span className={l.wait_minutes > 20 ? "text-red-400" : "text-emerald-400"}>{l.wait_minutes || 0} min</span>
                </div>
              </div>
              <button onClick={() => deleteLane.mutate(l.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Staff */}
      {activeTab === "staff" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {staff.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-4">No staff added yet</p>}
          {staff.map(s => (
            <div key={s.id} className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 flex items-start justify-between group">
              <div>
                <p className="font-bold text-white text-sm">{s.name}</p>
                <p className="text-xs text-slate-400 capitalize">{s.role?.replace(/_/g, " ")}</p>
                <Badge className={`mt-1 text-[10px] ${STAFF_STATUS_COLOR[s.status] || ""}`}>{s.status?.replace(/_/g, " ")}</Badge>
                {s.assigned_to && <p className="text-xs text-cyan-400 mt-0.5">{s.assigned_to}</p>}
              </div>
              <button onClick={() => deleteStaff.mutate(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddAirportEntityDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        activeTab={activeTab}
        orgId={orgId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["infra_gates"] });
          queryClient.invalidateQueries({ queryKey: ["infra_lanes"] });
          queryClient.invalidateQueries({ queryKey: ["infra_staff"] });
        }}
      />
    </div>
  );
}

function AddAirportEntityDialog({ open, onClose, activeTab, orgId, onSuccess }) {
  const [gateForm, setGateForm] = useState({ gate_code: "", terminal: "", concourse: "", gate_type: "jetbridge", schengen: true, aircraft_size: "any", status: "open", pax_waiting: 0 });
  const [laneForm, setLaneForm] = useState({ name: "", terminal: "", lane_type: "standard", status: "open", queue_length: 0, wait_minutes: 0, throughput_per_hour: 180, staff_assigned: 2, staff_required: 2 });
  const [staffForm, setStaffForm] = useState({ name: "", role: "gate_agent", status: "on_duty", terminal: "", assigned_to: "" });

  const createGate = useMutation({ mutationFn: d => base44.entities.AirportGate.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });
  const createLane = useMutation({ mutationFn: d => base44.entities.SecurityLane.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });
  const createStaff = useMutation({ mutationFn: d => base44.entities.AirportStaff.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });

  const isPending = createGate.isPending || createLane.isPending || createStaff.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {activeTab === "gates" ? "Gate" : activeTab === "security" ? "Security Lane" : "Staff"}</DialogTitle>
        </DialogHeader>

        {activeTab === "gates" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gate Code *</Label><Input value={gateForm.gate_code} onChange={e => setGateForm({...gateForm, gate_code: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="B14" /></div>
              <div><Label>Terminal</Label><Input value={gateForm.terminal} onChange={e => setGateForm({...gateForm, terminal: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Terminal 2" /></div>
              <div><Label>Concourse</Label><Input value={gateForm.concourse} onChange={e => setGateForm({...gateForm, concourse: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="B" /></div>
              <div><Label>Gate Type</Label>
                <Select value={gateForm.gate_type} onValueChange={v => setGateForm({...gateForm, gate_type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="jetbridge">Jetbridge</SelectItem><SelectItem value="bus_gate">Bus Gate</SelectItem><SelectItem value="remote_stand">Remote Stand</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Aircraft Size</Label>
                <Select value={gateForm.aircraft_size} onValueChange={v => setGateForm({...gateForm, aircraft_size: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="narrow">Narrow</SelectItem><SelectItem value="wide">Wide</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={gateForm.status} onValueChange={v => setGateForm({...gateForm, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="occupied">Occupied</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => createGate.mutate(gateForm)} disabled={!gateForm.gate_code || isPending} className="w-full bg-violet-600 hover:bg-violet-700">
              {isPending ? "Saving..." : "Create Gate"}
            </Button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={laneForm.name} onChange={e => setLaneForm({...laneForm, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Lane 1" /></div>
              <div><Label>Terminal</Label><Input value={laneForm.terminal} onChange={e => setLaneForm({...laneForm, terminal: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Terminal 1" /></div>
              <div><Label>Lane Type</Label>
                <Select value={laneForm.lane_type} onValueChange={v => setLaneForm({...laneForm, lane_type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="fast_track">Fast Track</SelectItem><SelectItem value="special_assistance">Special Assistance</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={laneForm.status} onValueChange={v => setLaneForm({...laneForm, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="degraded">Degraded</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Throughput/hr</Label><Input type="number" value={laneForm.throughput_per_hour} onChange={e => setLaneForm({...laneForm, throughput_per_hour: parseInt(e.target.value)||180})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Staff Required</Label><Input type="number" value={laneForm.staff_required} onChange={e => setLaneForm({...laneForm, staff_required: parseInt(e.target.value)||2})} className="bg-slate-800 border-slate-700" /></div>
            </div>
            <Button onClick={() => createLane.mutate(laneForm)} disabled={!laneForm.name || isPending} className="w-full bg-violet-600 hover:bg-violet-700">
              {isPending ? "Saving..." : "Create Lane"}
            </Button>
          </div>
        )}

        {activeTab === "staff" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name *</Label><Input value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="John Smith" /></div>
              <div><Label>Role</Label>
                <Select value={staffForm.role} onValueChange={v => setStaffForm({...staffForm, role: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_officer">Security Officer</SelectItem>
                    <SelectItem value="gate_agent">Gate Agent</SelectItem>
                    <SelectItem value="ground_handler">Ground Handler</SelectItem>
                    <SelectItem value="baggage_driver">Baggage Driver</SelectItem>
                    <SelectItem value="cleaning_crew">Cleaning Crew</SelectItem>
                    <SelectItem value="bus_driver">Bus Driver</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={staffForm.status} onValueChange={v => setStaffForm({...staffForm, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="on_duty">On Duty</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="on_break">On Break</SelectItem><SelectItem value="off_duty">Off Duty</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Terminal</Label><Input value={staffForm.terminal} onChange={e => setStaffForm({...staffForm, terminal: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Terminal 2" /></div>
              <div><Label>Assigned To</Label><Input value={staffForm.assigned_to} onChange={e => setStaffForm({...staffForm, assigned_to: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Gate B14 / SK204" /></div>
            </div>
            <Button onClick={() => createStaff.mutate(staffForm)} disabled={!staffForm.name || isPending} className="w-full bg-violet-600 hover:bg-violet-700">
              {isPending ? "Saving..." : "Create Staff"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}