import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, X, Save, BookOpen, Monitor, Users, Award, GraduationCap,
  Clock, MapPin, Link, DollarSign, Edit2, Archive, Search, Filter
} from "lucide-react";

const TYPE_CONFIG = {
  course:        { label: "Course",        icon: BookOpen,     cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  workshop:      { label: "Workshop",      icon: Users,        cls: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  elearning:     { label: "E-Learning",    icon: Monitor,      cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  certification: { label: "Certification", icon: Award,        cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  mentoring:     { label: "Mentoring",     icon: Users,        cls: "bg-pink-500/15 text-pink-400 border-pink-500/20" },
  seminar:       { label: "Seminar",       icon: GraduationCap,cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

const FORMAT_LABELS = { in_person: "In Person", online: "Online", hybrid: "Hybrid", self_paced: "Self-paced" };
const DEPARTMENTS = ["Operations", "Logistics", "Fleet", "Finance", "HR", "IT", "Sales", "Management"];

const defaultForm = (orgId) => ({
  organization_id: orgId,
  title: "", description: "", type: "course", category: "",
  provider: "", duration_hours: "", format: "online", status: "active",
  capacity: "", cost_per_person: "", currency: "DKK",
  start_date: "", end_date: "", location: "", url: "",
  target_departments: [], target_skills: [], learning_objectives: [],
  prerequisites: "", tags: [], notes: "", enrollments: []
});

export default function LearningCatalog({ courses, orgId, onRefresh }) {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [newSkill, setNewSkill]     = useState("");
  const [newObjective, setNewObjective] = useState("");

  const openNew = () => { setEditing(null); setForm(defaultForm(orgId)); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(null); };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleDept = (d) => {
    const curr = form.target_departments || [];
    set("target_departments", curr.includes(d) ? curr.filter(x => x !== d) : [...curr, d]);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    set("target_skills", [...(form.target_skills || []), newSkill.trim()]);
    setNewSkill("");
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    set("learning_objectives", [...(form.learning_objectives || []), newObjective.trim()]);
    setNewObjective("");
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    if (editing?.id) {
      await base44.entities.TrainingCourse.update(editing.id, form);
    } else {
      await base44.entities.TrainingCourse.create(form);
    }
    setSaving(false);
    closeForm();
    onRefresh();
  };

  const archiveCourse = async (id) => {
    await base44.entities.TrainingCourse.update(id, { status: "archived" });
    onRefresh();
  };

  const filtered = courses.filter(c => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![c.title, c.description, c.category, c.provider].some(v => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  }).filter(c => c.status !== "archived");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg kurser..." className="pl-9 bg-slate-900/60 border-slate-700/60 text-white h-9" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-900/60 border border-slate-700/60 text-sm text-white rounded-lg px-3 py-2 h-9 focus:outline-none">
          <option value="all">Alle typer</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k} className="bg-slate-900">{v.label}</option>)}
        </select>
        <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-500 h-9 text-sm flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Course
        </Button>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-sm">No courses created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const tc = TYPE_CONFIG[course.type] || TYPE_CONFIG.course;
            const Icon = tc.icon;
            const enrolled = (course.enrollments || []).filter(e => e.status !== "cancelled").length;
            return (
              <div key={course.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/60 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${tc.cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge className={`text-[10px] ${tc.cls}`}>{tc.label}</Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => openEdit(course)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-rose-400" onClick={() => archiveCourse(course.id)}>
                      <Archive className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1 leading-tight">{course.title}</h3>
                {course.description && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{course.description}</p>}

                <div className="space-y-1 text-[11px] text-slate-500">
                  {course.duration_hours && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_hours} timer</div>}
                  {course.format && <div className="flex items-center gap-1"><Monitor className="w-3 h-3" />{FORMAT_LABELS[course.format]}</div>}
                  {course.provider && <div className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.provider}</div>}
                  {course.cost_per_person > 0 && <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{course.cost_per_person} {course.currency}/person</div>}
                </div>

                {course.target_skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {course.target_skills.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">{s}</span>
                    ))}
                    {course.target_skills.length > 3 && <span className="text-[9px] text-slate-600">+{course.target_skills.length - 3}</span>}
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-600">
                  <span><Users className="w-3 h-3 inline mr-0.5" />{enrolled} tilmeldt{course.capacity ? ` / ${course.capacity}` : ""}</span>
                  {course.start_date && <span>{course.start_date}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && form && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                {editing ? "Edit Course" : "New Course"}
              </h2>
              <Button size="icon" variant="ghost" onClick={closeForm} className="h-8 w-8 text-slate-400 hover:text-white"><X className="w-4 h-4" /></Button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-400">Title *</Label>
                  <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Course name..." className="bg-slate-800/60 border-slate-700 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Type</Label>
                  <Select value={form.type} onValueChange={v => set("type", v)}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Format</Label>
                  <Select value={form.format} onValueChange={v => set("format", v)}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      {Object.entries(FORMAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Input value={form.category || ""} onChange={e => set("category", e.target.value)} placeholder="e.g. Leadership, Engineering..." className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Provider</Label>
                  <Input value={form.provider || ""} onChange={e => set("provider", e.target.value)} placeholder="Internal / External provider..." className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Duration (hours)</Label>
                  <Input type="number" value={form.duration_hours || ""} onChange={e => set("duration_hours", Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Price per person</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={form.cost_per_person || ""} onChange={e => set("cost_per_person", Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-white h-9 flex-1" />
                    <Select value={form.currency || "DKK"} onValueChange={v => set("currency", v)}>
                      <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9 w-20"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        {["DKK","EUR","USD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Capacity</Label>
                  <Input type="number" value={form.capacity || ""} onChange={e => set("capacity", Number(e.target.value))} className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Start Date</Label>
                  <Input type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">End Date</Label>
                  <Input type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-400">Link (URL)</Label>
                  <Input value={form.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." className="bg-slate-800/60 border-slate-700 text-white h-9" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-400">Description</Label>
                  <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={3} className="w-full bg-slate-800/60 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              {/* Target skills */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Skills Developed</Label>
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill..." className="bg-slate-800/60 border-slate-700 text-white h-8 text-sm" onKeyDown={e => e.key === "Enter" && addSkill()} />
                  <Button size="sm" onClick={addSkill} className="bg-emerald-600 hover:bg-emerald-500 h-8"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(form.target_skills || []).map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full">
                      {s}<button onClick={() => set("target_skills", form.target_skills.filter((_, idx) => idx !== i))}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Target departments */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Target Departments</Label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(d => {
                    const active = (form.target_departments || []).includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleDept(d)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600"}`}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Learning objectives */}
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Learning Objectives</Label>
                <div className="flex gap-2">
                  <Input value={newObjective} onChange={e => setNewObjective(e.target.value)} placeholder="Add learning objective..." className="bg-slate-800/60 border-slate-700 text-white h-8 text-sm" onKeyDown={e => e.key === "Enter" && addObjective()} />
                  <Button size="sm" onClick={addObjective} className="bg-emerald-600 hover:bg-emerald-500 h-8"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
                <div className="space-y-1">
                  {(form.learning_objectives || []).map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-emerald-500">•</span>
                      <span className="flex-1">{o}</span>
                      <button onClick={() => set("learning_objectives", form.learning_objectives.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-rose-400"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800">
              <Button variant="ghost" onClick={closeForm} className="text-slate-400 h-9">Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title} className="bg-emerald-600 hover:bg-emerald-500 h-9">
                <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : editing ? "Save Changes" : "Create Course"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}