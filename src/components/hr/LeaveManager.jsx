import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Check, X, Clock, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInBusinessDays, parseISO } from "date-fns";

const typeLabels = {
  annual: "Annual Leave", sick: "Sick Leave", personal: "Personal",
  maternity: "Maternity", paternity: "Paternity", unpaid: "Unpaid", other: "Other"
};

const statusConfig = {
  pending:   { label: "Pending",   className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  approved:  { label: "Approved",  className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected:  { label: "Rejected",  className: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  cancelled: { label: "Cancelled", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

export default function LeaveManager({ orgId, employees }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: ""
  });

  useEffect(() => {
    if (!orgId) return;
    base44.entities.LeaveRequest.filter({ organization_id: orgId }, "-created_date", 100)
      .then(setRequests);
  }, [orgId]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const emp = employees.find(e => e.id === form.employee_id);
    if (!emp) return;
    const days = form.start_date && form.end_date
      ? differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1
      : 1;
    await base44.entities.LeaveRequest.create({
      ...form,
      organization_id: orgId,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_email: emp.email,
      days_requested: days,
      status: "pending"
    });
    const updated = await base44.entities.LeaveRequest.filter({ organization_id: orgId }, "-created_date", 100);
    setRequests(updated);
    setShowForm(false);
    setForm({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
  };

  const updateStatus = async (id, status, rejectionReason = "") => {
    await base44.entities.LeaveRequest.update(id, {
      status,
      approved_by: "HR Manager",
      approved_date: new Date().toISOString().split("T")[0],
      ...(rejectionReason ? { rejection_reason: rejectionReason } : {})
    });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filtered = filterStatus === "all" ? requests : requests.filter(r => r.status === filterStatus);

  const stats = {
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    total_days: requests.filter(r => r.status === "approved").reduce((s, r) => s + (r.days_requested || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Approval",   value: stats.pending,    color: "text-amber-400" },
          { label: "Approved Requests",  value: stats.approved,   color: "text-emerald-400" },
          { label: "Approved Days Total",value: stats.total_days, color: "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-slate-900/60 border border-slate-700/50 rounded-lg p-1">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${filterStatus === s ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              {s === "all" ? "All" : statusConfig[s]?.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="ml-auto bg-cyan-600 hover:bg-cyan-500 h-9 text-sm">
          <Plus className="w-4 h-4 mr-2" /> New Request
          {showForm ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">New Leave Request</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Employee</Label>
              <Select value={form.employee_id} onValueChange={v => set("employee_id", v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Leave Type</Label>
              <Select value={form.leave_type} onValueChange={v => set("leave_type", v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-9" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-400">Reason</Label>
              <Input value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="Optional reason..." className="bg-slate-800/60 border-slate-700 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500">Submit Request</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-700" />
            <p className="text-sm">No leave requests</p>
          </div>
        ) : filtered.map(req => {
          const sc = statusConfig[req.status] || statusConfig.pending;
          return (
            <div key={req.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{req.employee_name}</p>
                    <p className="text-xs text-slate-400">
                      {typeLabels[req.leave_type]} · {req.days_requested} day{req.days_requested !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                  {req.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-emerald-400 hover:bg-emerald-500/10" onClick={() => updateStatus(req.id, "approved")}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-rose-400 hover:bg-rose-500/10" onClick={() => updateStatus(req.id, "rejected")}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.start_date} → {req.end_date}</span>
                {req.reason && <span className="truncate max-w-[200px]">{req.reason}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}