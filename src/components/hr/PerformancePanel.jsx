import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, TrendingUp, Plus, Award, ChevronDown, ChevronUp, Save } from "lucide-react";

const statusConfig = {
  draft:     { label: "Kladde",     className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  submitted: { label: "Indsendt",   className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  completed: { label: "Afsluttet", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const COMPETENCIES = [
  { key: "teamwork", label: "Teamwork" },
  { key: "communication", label: "Kommunikation" },
  { key: "initiative", label: "Initiativ" },
  { key: "technical_skills", label: "Tekniske færdigheder" },
  { key: "leadership", label: "Lederskab" },
];

function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} onClick={() => onChange && onChange(i + 1)} type="button">
          <Star
            className={`w-4 h-4 transition-colors ${i < value ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function PerformancePanel({ orgId, employees }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    employee_id: "", review_period: "", review_date: new Date().toISOString().split("T")[0],
    overall_rating: 0, strengths: "", areas_for_improvement: "", development_plan: "",
    manager_comments: "", status: "draft",
    competencies: { teamwork: 0, communication: 0, initiative: 0, technical_skills: 0, leadership: 0 }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    base44.entities.PerformanceReview.filter({ organization_id: orgId }, "-created_date", 50).then(setReviews);
  }, [orgId]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setComp = (k, v) => setForm(prev => ({ ...prev, competencies: { ...prev.competencies, [k]: v } }));

  const handleSave = async () => {
    setSaving(true);
    const emp = employees.find(e => e.id === form.employee_id);
    await base44.entities.PerformanceReview.create({
      ...form,
      organization_id: orgId,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "",
    });
    const updated = await base44.entities.PerformanceReview.filter({ organization_id: orgId }, "-created_date", 50);
    setReviews(updated);
    setShowForm(false);
    setSaving(false);
  };

  const avgRating = reviews.filter(r => r.overall_rating).reduce((s, r, _, a) => s + r.overall_rating / a.length, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Gennemsnitlig bedømmelse</p>
          <StarRating value={Math.round(avgRating)} max={5} />
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{reviews.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Samlede reviews</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{reviews.filter(r => r.status === "completed").length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Afsluttede</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-500 h-9 text-sm">
          <Plus className="w-4 h-4 mr-2" /> Nyt performance review
        </Button>
      </div>

      {/* New review form */}
      {showForm && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Nyt performance review
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Medarbejder</Label>
              <Select value={form.employee_id} onValueChange={v => set("employee_id", v)}>
                <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-9"><SelectValue placeholder="Vælg..." /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Periode</Label>
              <Input value={form.review_period} onChange={e => set("review_period", e.target.value)} placeholder="fx. Q1 2026" className="bg-slate-800/60 border-slate-700 text-white h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Dato</Label>
              <Input type="date" value={form.review_date} onChange={e => set("review_date", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-9" />
            </div>
          </div>

          {/* Competencies */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Kompetencer (1-5)</p>
            <div className="grid grid-cols-2 gap-3">
              {COMPETENCIES.map(c => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{c.label}</span>
                  <StarRating value={form.competencies[c.key]} onChange={v => setComp(c.key, v)} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400">Samlet bedømmelse</Label>
            <div className="flex items-center gap-3">
              <StarRating value={form.overall_rating} onChange={v => set("overall_rating", v)} />
              <span className="text-sm text-amber-400 font-bold">{form.overall_rating}/5</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Styrker</Label>
              <textarea value={form.strengths} onChange={e => set("strengths", e.target.value)} rows={3} className="w-full bg-slate-800/60 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Udviklingsområder</Label>
              <textarea value={form.areas_for_improvement} onChange={e => set("areas_for_improvement", e.target.value)} rows={3} className="w-full bg-slate-800/60 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-400">Lederkommentarer</Label>
              <textarea value={form.manager_comments} onChange={e => set("manager_comments", e.target.value)} rows={2} className="w-full bg-slate-800/60 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-slate-400">Annuller</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-500">
              <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "Gemmer..." : "Gem review"}
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-2">
        {reviews.map(rev => {
          const sc = statusConfig[rev.status] || statusConfig.draft;
          const isExp = expanded === rev.id;
          return (
            <div key={rev.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors" onClick={() => setExpanded(isExp ? null : rev.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{rev.employee_name}</p>
                    <p className="text-xs text-slate-400">{rev.review_period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rev.overall_rating > 0 && <StarRating value={rev.overall_rating} max={5} />}
                  <Badge className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>
              {isExp && (
                <div className="px-4 pb-4 border-t border-slate-800/60 pt-3 space-y-3">
                  {rev.competencies && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Kompetencer</p>
                      <div className="grid grid-cols-2 gap-2">
                        {COMPETENCIES.map(c => (
                          <div key={c.key} className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">{c.label}</span>
                            <StarRating value={rev.competencies[c.key] || 0} max={5} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {rev.strengths && <InfoRow label="Styrker" value={rev.strengths} />}
                  {rev.areas_for_improvement && <InfoRow label="Udviklingsområder" value={rev.areas_for_improvement} />}
                  {rev.manager_comments && <InfoRow label="Lederkommentarer" value={rev.manager_comments} />}
                </div>
              )}
            </div>
          );
        })}
        {reviews.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-700" />
            <p className="text-sm">Ingen performance reviews endnu</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-semibold mb-0.5">{label}</p>
      <p className="text-xs text-slate-300">{value}</p>
    </div>
  );
}