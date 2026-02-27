import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  X, Save, Award, Target, Plus, Trash2, CheckCircle2, Circle
} from "lucide-react";
import { COMPETENCIES, STATUS_CONFIG, StarRating } from "./PerformancePanel";

const defaultForm = () => ({
  employee_id: "",
  review_period: "",
  review_date: new Date().toISOString().split("T")[0],
  overall_rating: 0,
  strengths: "",
  areas_for_improvement: "",
  development_plan: "",
  manager_comments: "",
  status: "draft",
  competencies: Object.fromEntries(COMPETENCIES.map(c => [c.key, 0])),
  goals: [],
});

export default function PerformanceReviewEditor({ review, orgId, employees, onSave, onClose }) {
  const [form, setForm] = useState(() => review ? {
    ...defaultForm(),
    ...review,
    competencies: { ...Object.fromEntries(COMPETENCIES.map(c => [c.key, 0])), ...(review.competencies || {}) },
    goals: review.goals || [],
  } : defaultForm());
  const [saving, setSaving] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", target_date: "", achieved: false });
  const [showGoalForm, setShowGoalForm] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setComp = (k, v) => setForm(prev => ({ ...prev, competencies: { ...prev.competencies, [k]: v } }));

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    setForm(prev => ({ ...prev, goals: [...prev.goals, { ...newGoal, id: Date.now() }] }));
    setNewGoal({ title: "", description: "", target_date: "", achieved: false });
    setShowGoalForm(false);
  };

  const toggleGoalAchieved = (id) => {
    setForm(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? { ...g, achieved: !g.achieved } : g) }));
  };

  const removeGoal = (id) => {
    setForm(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const handleSave = async () => {
    if (!form.employee_id) return;
    setSaving(true);
    const emp = employees.find(e => e.id === form.employee_id);
    const payload = {
      ...form,
      organization_id: orgId,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "",
    };
    if (review?.id) {
      await base44.entities.PerformanceReview.update(review.id, payload);
    } else {
      await base44.entities.PerformanceReview.create(payload);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            {review ? "Rediger performance review" : "Nyt performance review"}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Basic info */}
          <Section title="Grundoplysninger">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Medarbejder *</Label>
                <Select value={form.employee_id} onValueChange={v => set("employee_id", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9">
                    <SelectValue placeholder="Vælg medarbejder..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Periode</Label>
                <Input value={form.review_period} onChange={e => set("review_period", e.target.value)}
                  placeholder="fx. Q1 2026" className="bg-slate-800/60 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Dato</Label>
                <Input type="date" value={form.review_date} onChange={e => set("review_date", e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Samlet bedømmelse</Label>
                <div className="flex items-center gap-3 h-9">
                  <StarRating value={form.overall_rating} onChange={v => set("overall_rating", v)} size="lg" />
                  <span className="text-sm text-amber-400 font-bold">{form.overall_rating}/5</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Competencies */}
          <Section title="Kompetencevurdering">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPETENCIES.map(c => (
                <div key={c.key} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <StarRating value={form.competencies[c.key] || 0} onChange={v => setComp(c.key, v)} />
                    <span className="text-xs text-slate-500 w-4">{form.competencies[c.key] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Goals */}
          <Section title="Mål & resultater" action={
            <Button size="sm" variant="ghost" onClick={() => setShowGoalForm(true)}
              className="h-7 text-xs text-amber-400 hover:text-amber-300">
              <Plus className="w-3.5 h-3.5 mr-1" /> Tilføj mål
            </Button>
          }>
            {form.goals.length > 0 ? (
              <div className="space-y-2">
                {form.goals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 bg-slate-800/40 rounded-lg px-3 py-2.5">
                    <button onClick={() => toggleGoalAchieved(goal.id)} className="mt-0.5 flex-shrink-0">
                      {goal.achieved
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <Circle className="w-4 h-4 text-slate-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${goal.achieved ? "line-through text-slate-500" : "text-white"}`}>{goal.title}</p>
                      {goal.description && <p className="text-xs text-slate-500 mt-0.5">{goal.description}</p>}
                      {goal.target_date && <p className="text-[10px] text-slate-600 mt-0.5">Deadline: {goal.target_date}</p>}
                    </div>
                    <button onClick={() => removeGoal(goal.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Ingen mål tilføjet endnu</p>
            )}

            {showGoalForm && (
              <div className="mt-3 bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-slate-300">Nyt mål</p>
                <Input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                  placeholder="Måltitel..." className="bg-slate-900/60 border-slate-700 text-white h-8 text-sm" />
                <Input value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Beskrivelse (valgfrit)..." className="bg-slate-900/60 border-slate-700 text-white h-8 text-sm" />
                <div className="flex gap-2 items-center">
                  <Input type="date" value={newGoal.target_date} onChange={e => setNewGoal(p => ({ ...p, target_date: e.target.value }))}
                    className="bg-slate-900/60 border-slate-700 text-white h-8 text-sm flex-1" />
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={newGoal.achieved} onChange={e => setNewGoal(p => ({ ...p, achieved: e.target.checked }))}
                      className="w-3 h-3 accent-emerald-500" />
                    Opnået
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addGoal} className="h-7 text-xs bg-amber-600 hover:bg-amber-500">Tilføj</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowGoalForm(false)} className="h-7 text-xs text-slate-400">Annuller</Button>
                </div>
              </div>
            )}
          </Section>

          {/* Feedback */}
          <Section title="Feedback & plan">
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Styrker" value={form.strengths} onChange={v => set("strengths", v)} rows={3} />
              <Textarea label="Udviklingsområder" value={form.areas_for_improvement} onChange={v => set("areas_for_improvement", v)} rows={3} />
              <div className="col-span-2">
                <Textarea label="Udviklingsplan" value={form.development_plan} onChange={v => set("development_plan", v)} rows={3}
                  placeholder="Beskriv konkrete tiltag og ressourcer til medarbejderens udvikling..." />
              </div>
              <div className="col-span-2">
                <Textarea label="Lederkommentarer" value={form.manager_comments} onChange={v => set("manager_comments", v)} rows={2} />
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 h-9">Annuller</Button>
          <Button onClick={handleSave} disabled={saving || !form.employee_id}
            className="bg-amber-600 hover:bg-amber-500 h-9">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Gemmer..." : review ? "Gem ændringer" : "Opret review"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder}
        className="w-full bg-slate-800/60 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600" />
    </div>
  );
}