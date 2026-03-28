import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Plane, Shield, Users, Car, Pencil } from "lucide-react";
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
  { id: "landside", label: "Landside Zones", icon: Car },
];

const LANDSIDE_STATUS_COLOR = { open: "bg-emerald-500/20 text-emerald-400", closed: "bg-rose-500/20 text-rose-400", limited: "bg-amber-500/20 text-amber-400" };
const FACILITY_TYPES = ["checkin","security","immigration","baggage_reclaim","taxi","bus","train","parking"];

export default function AirportInfraManager() {
  const [activeTab, setActiveTab] = useState("gates");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || null)).catch(() => {});
  }, []);

  const { data: gates = [] } = useQuery({
    queryKey: ["infra_gates", orgId],
    queryFn: () => orgId ? base44.entities.AirportGate.filter({ organization_id: orgId }, "-created_date", 50) : [],
    enabled: !!orgId
  });
  const { data: lanes = [] } = useQuery({
    queryKey: ["infra_lanes", orgId],
    queryFn: () => orgId ? base44.entities.SecurityLane.filter({ organization_id: orgId }, "-created_date", 30) : [],
    enabled: !!orgId
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["infra_staff", orgId],
    queryFn: () => orgId ? base44.entities.AirportStaff.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId
  });

  const { data: landsideZones = [] } = useQuery({
    queryKey: ["infra_landside", orgId],
    queryFn: () => orgId ? base44.entities.LandsideZone.filter({ organization_id: orgId }, "-created_date", 100) : [],
    enabled: !!orgId
  });

  const deleteGate = useMutation({ mutationFn: id => base44.entities.AirportGate.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_gates"] }) });
  const deleteLane = useMutation({ mutationFn: id => base44.entities.SecurityLane.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_lanes"] }) });
  const deleteStaff = useMutation({ mutationFn: id => base44.entities.AirportStaff.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_staff"] }) });
  const deleteLandside = useMutation({ mutationFn: id => base44.entities.LandsideZone.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["infra_landside"] }) });

  const updateGate = useMutation({ mutationFn: ({id, ...d}) => base44.entities.AirportGate.update(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["infra_gates"] }); setEditItem(null); } });
  const updateLane = useMutation({ mutationFn: ({id, ...d}) => base44.entities.SecurityLane.update(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["infra_lanes"] }); setEditItem(null); } });
  const updateStaff = useMutation({ mutationFn: ({id, ...d}) => base44.entities.AirportStaff.update(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["infra_staff"] }); setEditItem(null); } });
  const updateLandside = useMutation({ mutationFn: ({id, ...d}) => base44.entities.LandsideZone.update(id, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["infra_landside"] }); setEditItem(null); } });

  return (
    <div className="mt-8 rounded-2xl border border-violet-500/20 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Airport Infrastructure</h2>
          <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 ml-2">
            {gates.length}G · {lanes.length}L · {staff.length}S · {landsideZones.length}Z
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
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setEditItem({...g, _type: "gates"})} className="text-slate-500 hover:text-violet-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteGate.mutate(g.id)} className="text-slate-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
              </div>
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
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setEditItem({...l, _type: "security"})} className="text-slate-500 hover:text-violet-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteLane.mutate(l.id)} className="text-slate-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
              </div>
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
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setEditItem({...s, _type: "staff"})} className="text-slate-500 hover:text-violet-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteStaff.mutate(s.id)} className="text-slate-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Landside Zones */}
      {activeTab === "landside" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {landsideZones.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-4">No landside zones added yet</p>}
          {landsideZones.map(z => (
            <div key={z.id} className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 flex items-start justify-between group">
              <div>
                <p className="font-bold text-white text-sm">{z.name}</p>
                <p className="text-xs text-slate-400 capitalize">{z.facility_type?.replace(/_/g, " ")}</p>
                <Badge className={`mt-1 text-[10px] ${LANDSIDE_STATUS_COLOR[z.status] || ""}`}>{z.status}</Badge>
                <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                  <span>Queue: {z.queue_count || 0}</span>
                  <span>Wait: {z.wait_minutes || 0} min</span>
                </div>
                {z.capacity > 0 && <p className="text-[10px] text-slate-500 mt-0.5">{z.current_occupancy || 0}/{z.capacity} capacity</p>}
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => setEditItem({...z, _type: "landside"})} className="text-slate-500 hover:text-violet-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteLandside.mutate(z.id)} className="text-slate-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
              </div>
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
          queryClient.invalidateQueries({ queryKey: ["infra_landside"] });
        }}
      />

      {editItem && (
        <EditAirportEntityDialog
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(data) => {
            const { _type, ...rest } = data;
            if (_type === "gates") updateGate.mutate(rest);
            else if (_type === "security") updateLane.mutate(rest);
            else if (_type === "staff") updateStaff.mutate(rest);
            else if (_type === "landside") updateLandside.mutate(rest);
          }}
        />
      )}
    </div>
  );
}

function EditAirportEntityDialog({ item, onClose, onSave }) {
  const [form, setForm] = useState({...item});
  const type = item._type;

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {type === "gates" ? `Gate ${item.gate_code}` : type === "security" ? `Lane ${item.name}` : type === "landside" ? `Zone ${item.name}` : item.name}</DialogTitle>
        </DialogHeader>

        {type === "gates" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gate Code</Label><Input value={form.gate_code} onChange={e => set("gate_code", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Terminal</Label><Input value={form.terminal || ""} onChange={e => set("terminal", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Concourse</Label><Input value={form.concourse || ""} onChange={e => set("concourse", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Gate Type</Label>
                <Select value={form.gate_type} onValueChange={v => set("gate_type", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="jetbridge">Jetbridge</SelectItem><SelectItem value="bus_gate">Bus Gate</SelectItem><SelectItem value="remote_stand">Remote Stand</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Aircraft Size</Label>
                <Select value={form.aircraft_size} onValueChange={v => set("aircraft_size", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="any">Any</SelectItem><SelectItem value="narrow">Narrow</SelectItem><SelectItem value="wide">Wide</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="occupied">Occupied</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Pax Waiting</Label><Input type="number" value={form.pax_waiting || 0} onChange={e => set("pax_waiting", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Boarding Active</Label>
                <Select value={form.boarding_active ? "true" : "false"} onValueChange={v => set("boarding_active", v === "true")}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => onSave(form)} className="w-full bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </div>
        )}

        {type === "security" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Terminal</Label><Input value={form.terminal || ""} onChange={e => set("terminal", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Lane Type</Label>
                <Select value={form.lane_type} onValueChange={v => set("lane_type", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="fast_track">Fast Track</SelectItem><SelectItem value="special_assistance">Special Assistance</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="degraded">Degraded</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Queue Length</Label><Input type="number" value={form.queue_length || 0} onChange={e => set("queue_length", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Wait (min)</Label><Input type="number" value={form.wait_minutes || 0} onChange={e => set("wait_minutes", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Throughput/hr</Label><Input type="number" value={form.throughput_per_hour || 180} onChange={e => set("throughput_per_hour", parseInt(e.target.value)||180)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Staff Assigned</Label><Input type="number" value={form.staff_assigned || 0} onChange={e => set("staff_assigned", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Staff Required</Label><Input type="number" value={form.staff_required || 2} onChange={e => set("staff_required", parseInt(e.target.value)||2)} className="bg-slate-800 border-slate-700" /></div>
            </div>
            <Button onClick={() => onSave(form)} className="w-full bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </div>
        )}

        {type === "staff" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Role</Label>
                <Select value={form.role} onValueChange={v => set("role", v)}>
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
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="on_duty">On Duty</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="on_break">On Break</SelectItem><SelectItem value="off_duty">Off Duty</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Terminal</Label><Input value={form.terminal || ""} onChange={e => set("terminal", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Assigned To</Label><Input value={form.assigned_to || ""} onChange={e => set("assigned_to", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
            </div>
            <Button onClick={() => onSave(form)} className="w-full bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </div>
        )}

        {type === "landside" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Facility Type</Label>
                <Select value={form.facility_type} onValueChange={v => set("facility_type", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>{FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="limited">Limited</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Capacity</Label><Input type="number" value={form.capacity || 0} onChange={e => set("capacity", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Current Occupancy</Label><Input type="number" value={form.current_occupancy || 0} onChange={e => set("current_occupancy", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Queue Count</Label><Input type="number" value={form.queue_count || 0} onChange={e => set("queue_count", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Wait (min)</Label><Input type="number" value={form.wait_minutes || 0} onChange={e => set("wait_minutes", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Staff Assigned</Label><Input type="number" value={form.staff_assigned || 0} onChange={e => set("staff_assigned", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Next Departure (min)</Label><Input type="number" value={form.next_departure_minutes || ""} onChange={e => set("next_departure_minutes", parseInt(e.target.value)||null)} className="bg-slate-800 border-slate-700" placeholder="Bus/Train only" /></div>
              <div><Label>Delay (min)</Label><Input type="number" value={form.delay_minutes || 0} onChange={e => set("delay_minutes", parseInt(e.target.value)||0)} className="bg-slate-800 border-slate-700" /></div>
            </div>
            <Button onClick={() => onSave(form)} className="w-full bg-violet-600 hover:bg-violet-700">Save Changes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddAirportEntityDialog({ open, onClose, activeTab, orgId, onSuccess }) {
  const [landsideForm, setLandsideForm] = useState({ name: "", facility_type: "taxi", status: "open", queue_count: 0, wait_minutes: 0, capacity: 100, current_occupancy: 0, staff_assigned: 0, next_departure_minutes: null, delay_minutes: 0 });
  const [gateForm, setGateForm] = useState({ gate_code: "", terminal: "", concourse: "", gate_type: "jetbridge", schengen: true, aircraft_size: "any", status: "open", pax_waiting: 0 });
  const [laneForm, setLaneForm] = useState({ name: "", terminal: "", lane_type: "standard", status: "open", queue_length: 0, wait_minutes: 0, throughput_per_hour: 180, staff_assigned: 2, staff_required: 2 });
  const [staffForm, setStaffForm] = useState({ name: "", role: "gate_agent", status: "on_duty", terminal: "", assigned_to: "" });

  const createLandside = useMutation({ mutationFn: d => base44.entities.LandsideZone.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });
  const createGate = useMutation({ mutationFn: d => base44.entities.AirportGate.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });
  const createLane = useMutation({ mutationFn: d => base44.entities.SecurityLane.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });
  const createStaff = useMutation({ mutationFn: d => base44.entities.AirportStaff.create({ ...d, organization_id: orgId }), onSuccess: () => { onSuccess(); onClose(); } });

  const isPending = createGate.isPending || createLane.isPending || createStaff.isPending || createLandside.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {activeTab === "gates" ? "Gate" : activeTab === "security" ? "Security Lane" : activeTab === "landside" ? "Landside Zone" : "Staff"}</DialogTitle>
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

        {activeTab === "landside" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name *</Label><Input value={landsideForm.name} onChange={e => setLandsideForm({...landsideForm, name: e.target.value})} className="bg-slate-800 border-slate-700" placeholder="Arrivals Taxi Rank" /></div>
              <div><Label>Facility Type</Label>
                <Select value={landsideForm.facility_type} onValueChange={v => setLandsideForm({...landsideForm, facility_type: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>{FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={landsideForm.status} onValueChange={v => setLandsideForm({...landsideForm, status: v})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="limited">Limited</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Capacity</Label><Input type="number" value={landsideForm.capacity} onChange={e => setLandsideForm({...landsideForm, capacity: parseInt(e.target.value)||100})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Current Occupancy</Label><Input type="number" value={landsideForm.current_occupancy} onChange={e => setLandsideForm({...landsideForm, current_occupancy: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Queue Count</Label><Input type="number" value={landsideForm.queue_count} onChange={e => setLandsideForm({...landsideForm, queue_count: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Wait (minutes)</Label><Input type="number" value={landsideForm.wait_minutes} onChange={e => setLandsideForm({...landsideForm, wait_minutes: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Staff Assigned</Label><Input type="number" value={landsideForm.staff_assigned} onChange={e => setLandsideForm({...landsideForm, staff_assigned: parseInt(e.target.value)||0})} className="bg-slate-800 border-slate-700" /></div>
              <div><Label>Next Departure (min)</Label><Input type="number" value={landsideForm.next_departure_minutes || ""} onChange={e => setLandsideForm({...landsideForm, next_departure_minutes: parseInt(e.target.value)||null})} className="bg-slate-800 border-slate-700" placeholder="Only for bus/train" /></div>
            </div>
            <Button onClick={() => createLandside.mutate(landsideForm)} disabled={!landsideForm.name || isPending} className="w-full bg-violet-600 hover:bg-violet-700">
              {isPending ? "Saving..." : "Create Landside Zone"}
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