import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Pencil, Users, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SHIFT_STATUS_COLOR = {
  scheduled: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-slate-500/20 text-slate-400",
  absent: "bg-rose-500/20 text-rose-400",
  swapped: "bg-amber-500/20 text-amber-400",
};

const ROLES = [
  "security_officer","gate_agent","ground_handler","baggage_driver",
  "cleaning_crew","bus_driver","supervisor","dispatcher"
];

const ZONE_TYPES = ["gate","security","landside","baggage","general"];

const today = () => new Date().toISOString().split("T")[0];

export default function AirportStaffManager() {
  const [orgId, setOrgId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today());
  const [showDialog, setShowDialog] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setOrgId(u?.organization_id || null)).catch(() => {});
  }, []);

  const { data: staff = [] } = useQuery({
    queryKey: ["staff_list", orgId],
    queryFn: () => orgId ? base44.entities.AirportStaff.filter({ organization_id: orgId }, "name", 100) : [],
    enabled: !!orgId
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts", orgId, selectedDate],
    queryFn: () => orgId ? base44.entities.AirportShift.filter({ organization_id: orgId, date: selectedDate }, "shift_start", 100) : [],
    enabled: !!orgId
  });

  const deleteShift = useMutation({
    mutationFn: id => base44.entities.AirportShift.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] })
  });

  const updateShift = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.AirportShift.update(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); setEditShift(null); }
  });

  // Stats
  const activeCount = shifts.filter(s => s.status === "active").length;
  const scheduledCount = shifts.filter(s => s.status === "scheduled").length;
  const absentCount = shifts.filter(s => s.status === "absent").length;

  // Group by zone_type
  const byZone = ZONE_TYPES.reduce((acc, z) => {
    acc[z] = shifts.filter(s => s.zone_type === z);
    return acc;
  }, {});

  return (
    <div className="space-y-6 mt-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Staff Roster</h2>
            <p className="text-xs text-slate-400">{shifts.length} shifts scheduled · {staff.length} staff total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white w-40 text-sm"
          />
          <Button onClick={() => setShowDialog(true)} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Shift
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active now</p>
        </div>
        <div className="rounded-xl p-3 bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-2xl font-bold text-blue-400">{scheduledCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Scheduled</p>
        </div>
        <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/20 text-center">
          <p className="text-2xl font-bold text-rose-400">{absentCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Absent</p>
        </div>
      </div>

      {shifts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No shifts for {selectedDate}</p>
          <Button onClick={() => setShowDialog(true)} variant="outline" size="sm" className="mt-3 border-slate-700 text-slate-400 hover:text-white">
            Add first shift
          </Button>
        </div>
      )}

      {/* Shifts by Zone Type */}
      {ZONE_TYPES.filter(z => byZone[z].length > 0).map(zone => (
        <div key={zone}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 capitalize">{zone} Zone</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {byZone[zone].map(s => (
              <div key={s.id} className="rounded-xl p-3 bg-slate-800/50 border border-slate-700/50 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs">
                    {s.staff_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.staff_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{s.staff_role?.replace(/_/g, " ")} · {s.assigned_zone || "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-[10px] text-slate-400">{s.shift_start} – {s.shift_end}</span>
                      <Badge className={`text-[10px] ${SHIFT_STATUS_COLOR[s.status] || ""}`}>{s.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditShift(s)} className="text-slate-500 hover:text-violet-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteShift.mutate(s.id)} className="text-slate-500 hover:text-rose-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Shift Dialog */}
      <ShiftDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        orgId={orgId}
        staff={staff}
        defaultDate={selectedDate}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["shifts"] })}
      />

      {/* Edit Shift Dialog */}
      {editShift && (
        <ShiftDialog
          open={true}
          onClose={() => setEditShift(null)}
          orgId={orgId}
          staff={staff}
          defaultDate={selectedDate}
          editData={editShift}
          onSave={(data) => updateShift.mutate({ id: editShift.id, ...data })}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["shifts"] })}
        />
      )}
    </div>
  );
}

function ShiftDialog({ open, onClose, orgId, staff, defaultDate, editData, onSave, onSuccess }) {
  const [form, setForm] = useState(editData || {
    staff_name: "", staff_role: "gate_agent", date: defaultDate,
    shift_start: "06:00", shift_end: "14:00",
    assigned_zone: "", zone_type: "general", status: "scheduled", notes: ""
  });

  const queryClient = useQueryClient();

  const createShift = useMutation({
    mutationFn: d => base44.entities.AirportShift.create({ ...d, organization_id: orgId }),
    onSuccess: () => { onSuccess?.(); onClose(); }
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStaffSelect = (staffId) => {
    const s = staff.find(x => x.id === staffId);
    if (s) set("staff_name", s.name);
    set("staff_role", s?.role || form.staff_role);
  };

  const handleSave = () => {
    if (onSave) { onSave(form); onClose(); }
    else createShift.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {staff.length > 0 && !editData && (
            <div className="col-span-2">
              <Label>Pick from existing staff</Label>
              <Select onValueChange={handleStaffSelect}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select staff member..." /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role?.replace(/_/g," ")})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2"><Label>Name *</Label><Input value={form.staff_name} onChange={e => set("staff_name", e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Jane Doe" /></div>
          <div><Label>Role</Label>
            <Select value={form.staff_role} onValueChange={v => set("staff_role", v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="swapped">Swapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
          <div><Label>Zone Type</Label>
            <Select value={form.zone_type} onValueChange={v => set("zone_type", v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>{ZONE_TYPES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Shift Start</Label><Input type="time" value={form.shift_start} onChange={e => set("shift_start", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
          <div><Label>Shift End</Label><Input type="time" value={form.shift_end} onChange={e => set("shift_end", e.target.value)} className="bg-slate-800 border-slate-700" /></div>
          <div className="col-span-2"><Label>Assigned Zone/Gate</Label><Input value={form.assigned_zone} onChange={e => set("assigned_zone", e.target.value)} className="bg-slate-800 border-slate-700" placeholder="B14 / Lane 3 / Taxi Rank" /></div>
          <div className="col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => set("notes", e.target.value)} className="bg-slate-800 border-slate-700" placeholder="Optional notes..." /></div>
        </div>
        <Button onClick={handleSave} disabled={!form.staff_name || createShift.isPending} className="w-full bg-violet-600 hover:bg-violet-700 mt-2">
          {createShift.isPending ? "Saving..." : editData ? "Save Changes" : "Create Shift"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}