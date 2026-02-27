import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, CheckCircle2, Clock, XCircle, PlayCircle, BookOpen,
  ChevronDown, ChevronUp, Star, MessageSquare, BarChart3, Plus
} from "lucide-react";

const ENROLLMENT_STATUS = {
  requested:   { label: "Requested",   cls: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Clock },
  approved:    { label: "Approved",    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",    icon: CheckCircle2 },
  in_progress: { label: "In Progress", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: PlayCircle },
  completed:   { label: "Completed",   cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   cls: "bg-rose-500/20 text-rose-400 border-rose-500/30",    icon: XCircle },
};

export default function LearningEnrollments({ courses, employees, onRefresh }) {
  const [expanded, setExpanded]     = useState(null);
  const [enrollFilter, setEnrollFilter] = useState("all");
  const [showEnrollForm, setShowEnrollForm] = useState(null); // courseId
  const [enrollEmpId, setEnrollEmpId] = useState("");
  const [saving, setSaving]         = useState(false);

  // Flatten all enrollments with course context
  const allEnrollments = courses.flatMap(c =>
    (c.enrollments || []).map(e => ({ ...e, course: c }))
  );

  const filtered = enrollFilter === "all" ? allEnrollments : allEnrollments.filter(e => e.status === enrollFilter);

  const updateEnrollment = async (course, empId, patch) => {
    const enrollments = (course.enrollments || []).map(e =>
      e.employee_id === empId ? { ...e, ...patch } : e
    );
    await base44.entities.TrainingCourse.update(course.id, { enrollments });
    onRefresh();
  };

  const addEnrollment = async (course) => {
    if (!enrollEmpId) return;
    setSaving(true);
    const emp = employees.find(e => e.id === enrollEmpId);
    const existing = (course.enrollments || []).find(e => e.employee_id === enrollEmpId);
    if (!existing) {
      const enrollments = [...(course.enrollments || []), {
        employee_id: enrollEmpId,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "",
        status: "requested",
        requested_date: new Date().toISOString().split("T")[0],
        progress_pct: 0,
      }];
      await base44.entities.TrainingCourse.update(course.id, { enrollments });
    }
    setShowEnrollForm(null);
    setEnrollEmpId("");
    setSaving(false);
    onRefresh();
  };

  // Stats
  const stats = {
    total: allEnrollments.length,
    completed: allEnrollments.filter(e => e.status === "completed").length,
    in_progress: allEnrollments.filter(e => e.status === "in_progress").length,
    requested: allEnrollments.filter(e => e.status === "requested").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Enrollments", value: stats.total,       color: "text-white" },
          { label: "Completed",         value: stats.completed,   color: "text-emerald-400" },
          { label: "In Progress",       value: stats.in_progress, color: "text-amber-400" },
          { label: "Awaiting Approval", value: stats.requested,   color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select value={enrollFilter} onChange={e => setEnrollFilter(e.target.value)}
          className="bg-slate-900/60 border border-slate-700/60 text-sm text-white rounded-lg px-3 py-2 h-9 focus:outline-none">
          <option value="all">All Statuses</option>
          {Object.entries(ENROLLMENT_STATUS).map(([k, v]) => <option key={k} value={k} className="bg-slate-900">{v.label}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} enrollments</span>
      </div>

      {/* Per-course accordion */}
      <div className="space-y-3">
        {courses.filter(c => c.status !== "archived").map(course => {
          const courseEnrollments = (course.enrollments || []).filter(e =>
            enrollFilter === "all" || e.status === enrollFilter
          );
          if (courseEnrollments.length === 0 && enrollFilter !== "all") return null;
          const isExp = expanded === course.id;

          return (
            <div key={course.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                onClick={() => setExpanded(isExp ? null : course.id)}>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{course.title}</p>
                    <p className="text-xs text-slate-500">{(course.enrollments || []).length} enrolled{course.capacity ? ` / ${course.capacity} spots` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-400 hover:text-emerald-300 px-2"
                    onClick={e => { e.stopPropagation(); setShowEnrollForm(course.id); setEnrollEmpId(""); }}>
                    <Plus className="w-3 h-3 mr-1" /> Enroll
                  </Button>
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {showEnrollForm === course.id && (
                <div className="px-4 pb-3 border-t border-slate-800/60 pt-3 flex gap-2">
                  <Select value={enrollEmpId} onValueChange={setEnrollEmpId}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs flex-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {employees.map(e => <SelectItem key={e.id} value={e.id} className="text-xs">{e.first_name} {e.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => addEnrollment(course)} disabled={!enrollEmpId || saving} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500">Enroll</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowEnrollForm(null)} className="h-8 text-xs text-slate-400">Cancel</Button>
                </div>
              )}

              {isExp && (
                <div className="border-t border-slate-800/60">
                  {courseEnrollments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No enrollments</p>
                  ) : (
                    <div className="divide-y divide-slate-800/40">
                      {courseEnrollments.map((enr, i) => {
                        const sc = ENROLLMENT_STATUS[enr.status] || ENROLLMENT_STATUS.requested;
                        const Icon = sc.icon;
                        return (
                          <div key={i} className="px-4 py-3 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                              {enr.employee_name?.[0] || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white">{enr.employee_name}</p>
                              {enr.status === "in_progress" && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${enr.progress_pct || 0}%` }} />
                                  </div>
                                  <span className="text-[10px] text-slate-500">{enr.progress_pct || 0}%</span>
                                </div>
                              )}
                              {enr.completion_date && <p className="text-[10px] text-emerald-400 mt-0.5">Completed {enr.completion_date}</p>}
                            </div>
                            <Badge className={`text-[9px] flex-shrink-0 ${sc.cls}`}>{sc.label}</Badge>
                            {/* Status actions */}
                            <div className="flex gap-1">
                              {enr.status === "requested" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-blue-400 px-1.5"
                                  onClick={() => updateEnrollment(course, enr.employee_id, { status: "approved", approved_date: new Date().toISOString().split("T")[0] })}>
                                  Approve
                                </Button>
                              )}
                              {enr.status === "approved" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-amber-400 px-1.5"
                                  onClick={() => updateEnrollment(course, enr.employee_id, { status: "in_progress", progress_pct: 0 })}>
                                  Start
                                </Button>
                              )}
                              {enr.status === "in_progress" && (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-emerald-400 px-1.5"
                                  onClick={() => updateEnrollment(course, enr.employee_id, { status: "completed", completion_date: new Date().toISOString().split("T")[0], progress_pct: 100 })}>
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}