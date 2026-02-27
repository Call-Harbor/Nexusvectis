import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Plus, Award, Search, Star, ChevronDown, ChevronUp,
  Filter, History, Users, Target, ClipboardList, CheckCircle2,
  Clock, Edit2, Eye, BarChart3
} from "lucide-react";
import PerformanceReviewEditor from "./PerformanceReviewEditor";
import PerformanceReviewDetail from "./PerformanceReviewDetail";

export const COMPETENCIES = [
  { key: "teamwork",        label: "Teamwork" },
  { key: "communication",   label: "Kommunikation" },
  { key: "initiative",      label: "Initiativ" },
  { key: "technical_skills",label: "Tekniske færdigheder" },
  { key: "leadership",      label: "Lederskab" },
  { key: "problem_solving", label: "Problemløsning" },
];

export const STATUS_CONFIG = {
  draft:     { label: "Kladde",     cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  submitted: { label: "Indsendt",   cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  completed: { label: "Afsluttet", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  archived:  { label: "Arkiveret", cls: "bg-slate-700/40 text-slate-500 border-slate-600/30" },
};

export function StarRating({ value = 0, onChange, max = 5, size = "sm" }) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange?.(i + 1)} disabled={!onChange}
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`${sz} transition-colors ${i < value ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
        </button>
      ))}
    </div>
  );
}

const VIEW_MODES = [
  { key: "overview",  label: "Oversigt",   icon: BarChart3 },
  { key: "list",      label: "Alle reviews", icon: ClipboardList },
  { key: "history",   label: "Historik",   icon: History },
];

export default function PerformancePanel({ orgId, employees }) {
  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [viewMode, setViewMode]       = useState("overview");
  const [showEditor, setShowEditor]   = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [detailReview, setDetailReview]   = useState(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const loadReviews = async () => {
    if (!orgId) return;
    setLoading(true);
    const data = await base44.entities.PerformanceReview.filter({ organization_id: orgId }, "-created_date", 200);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { loadReviews(); }, [orgId]);

  const handleSaved = () => {
    setShowEditor(false);
    setEditingReview(null);
    loadReviews();
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    await base44.entities.PerformanceReview.update(reviewId, { status: newStatus });
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    if (detailReview?.id === reviewId) setDetailReview(prev => ({ ...prev, status: newStatus }));
  };

  const filtered = useMemo(() => reviews.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (selectedEmployee !== "all" && r.employee_id !== selectedEmployee) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![ r.employee_name, r.review_period, r.manager_comments, r.strengths ]
        .some(v => v?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [reviews, statusFilter, selectedEmployee, search]);

  const avgRating = reviews.filter(r => r.overall_rating > 0).reduce((s, r, _, a) => s + r.overall_rating / a.length, 0);

  const byEmployee = useMemo(() => {
    const map = {};
    reviews.forEach(r => {
      if (!map[r.employee_id]) map[r.employee_id] = { name: r.employee_name, reviews: [] };
      map[r.employee_id].reviews.push(r);
    });
    return Object.entries(map).map(([id, d]) => ({
      id, ...d,
      avgRating: d.reviews.filter(r => r.overall_rating > 0).reduce((s, r, _, a) => s + r.overall_rating / a.length, 0),
      latest: d.reviews[0],
    }));
  }, [reviews]);

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Samlede reviews",  value: reviews.length,                             color: "text-cyan-400",    icon: ClipboardList },
          { label: "Gns. bedømmelse",  value: `${avgRating.toFixed(1)}/5`,                color: "text-amber-400",   icon: Star },
          { label: "Afsluttede",        value: reviews.filter(r=>r.status==="completed").length, color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Under udarbejdelse",value: reviews.filter(r=>r.status==="draft"||r.status==="submitted").length, color: "text-blue-400", icon: Clock },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
          {VIEW_MODES.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.key} onClick={() => setViewMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === m.key ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {m.label}
              </button>
            );
          })}
        </div>
        <Button onClick={() => { setEditingReview(null); setShowEditor(true); }}
          className="bg-amber-600 hover:bg-amber-500 h-9 text-sm">
          <Plus className="w-4 h-4 mr-2" /> Nyt review
        </Button>
      </div>

      {/* Filters */}
      {viewMode !== "overview" && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Søg i reviews..." className="pl-9 bg-slate-900/60 border-slate-700/60 text-white h-9" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-700/60 text-sm text-white rounded-lg px-3 py-2 h-9 focus:outline-none">
            <option value="all">Alle statusser</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k} className="bg-slate-900">{v.label}</option>)}
          </select>
          <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
            className="bg-slate-900/60 border border-slate-700/60 text-sm text-white rounded-lg px-3 py-2 h-9 focus:outline-none">
            <option value="all">Alle medarbejdere</option>
            {employees.map(e => <option key={e.id} value={e.id} className="bg-slate-900">{e.first_name} {e.last_name}</option>)}
          </select>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* OVERVIEW */}
        {viewMode === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {byEmployee.length === 0 ? (
                <div className="col-span-2 text-center py-16 text-slate-500">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm">Ingen performance reviews endnu</p>
                </div>
              ) : byEmployee.map(emp => (
                <div key={emp.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-400">
                        {emp.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.reviews.length} review{emp.reviews.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">{emp.avgRating > 0 ? emp.avgRating.toFixed(1) : "—"}</p>
                      <StarRating value={Math.round(emp.avgRating)} />
                    </div>
                  </div>

                  {/* Competency bars */}
                  {emp.latest?.competencies && (
                    <div className="space-y-1.5 mb-3">
                      {COMPETENCIES.slice(0, 4).map(c => {
                        const val = emp.latest.competencies[c.key] || 0;
                        return (
                          <div key={c.key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 w-24 flex-shrink-0">{c.label}</span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                                style={{ width: `${(val / 5) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400 w-4">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {emp.latest && (
                      <Badge className={`text-[10px] ${STATUS_CONFIG[emp.latest.status]?.cls || ""}`}>
                        {STATUS_CONFIG[emp.latest.status]?.label} · {emp.latest.review_period}
                      </Badge>
                    )}
                    <Button size="sm" variant="ghost"
                      onClick={() => { setSelectedEmployee(emp.id); setViewMode("history"); }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 h-7">
                      <History className="w-3 h-3 mr-1" /> Se historik
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LIST */}
        {viewMode === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm">Ingen reviews matcher dine filtre</p>
              </div>
            ) : filtered.map(rev => <ReviewRow key={rev.id} review={rev}
                onView={() => setDetailReview(rev)}
                onEdit={() => { setEditingReview(rev); setShowEditor(true); }}
                onStatusChange={handleStatusChange} />)}
          </motion.div>
        )}

        {/* HISTORY */}
        {viewMode === "history" && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {selectedEmployee === "all" ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">Vælg en medarbejder for at se historik</p>
              </div>
            ) : (
              <EmployeeHistory
                reviews={filtered}
                employee={employees.find(e => e.id === selectedEmployee)}
                onView={setDetailReview}
                onEdit={r => { setEditingReview(r); setShowEditor(true); }}
                onStatusChange={handleStatusChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor modal */}
      {showEditor && (
        <PerformanceReviewEditor
          review={editingReview}
          orgId={orgId}
          employees={employees}
          onSave={handleSaved}
          onClose={() => { setShowEditor(false); setEditingReview(null); }}
        />
      )}

      {/* Detail modal */}
      {detailReview && (
        <PerformanceReviewDetail
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onEdit={() => { setEditingReview(detailReview); setDetailReview(null); setShowEditor(true); }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

function ReviewRow({ review, onView, onEdit, onStatusChange }) {
  const sc = STATUS_CONFIG[review.status] || STATUS_CONFIG.draft;
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{review.employee_name}</p>
          <p className="text-xs text-slate-500">{review.review_period} · {review.review_date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {review.overall_rating > 0 && <StarRating value={review.overall_rating} />}
        <Badge className={`text-[10px] ${sc.cls}`}>{sc.label}</Badge>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onView}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmployeeHistory({ reviews, employee, onView, onEdit, onStatusChange }) {
  const sorted = [...reviews].sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
  const ratingTrend = sorted.filter(r => r.overall_rating > 0).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg font-bold text-amber-400">
          {employee?.first_name?.charAt(0) || "?"}
        </div>
        <div>
          <p className="font-semibold text-white">{employee?.first_name} {employee?.last_name}</p>
          <p className="text-xs text-slate-500">{employee?.job_title} · {sorted.length} reviews totalt</p>
        </div>
      </div>

      {/* Rating trend */}
      {ratingTrend.length > 1 && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Bedømmelsesudvikling
          </p>
          <div className="flex items-end gap-2 h-16">
            {ratingTrend.map((r, i) => (
              <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-amber-400 font-bold">{r.overall_rating}</span>
                <div className="w-full bg-amber-500/20 rounded-t" style={{ height: `${(r.overall_rating / 5) * 48}px` }}>
                  <div className="w-full h-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t opacity-80" />
                </div>
                <span className="text-[9px] text-slate-600 truncate max-w-full">{r.review_period}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
        {sorted.map(rev => {
          const sc = STATUS_CONFIG[rev.status] || STATUS_CONFIG.draft;
          return (
            <div key={rev.id} className="relative">
              <div className="absolute -left-5 top-3 w-3 h-3 rounded-full border-2 border-slate-700 bg-slate-900" />
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 ml-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{rev.review_period}</p>
                    <p className="text-xs text-slate-500">{rev.review_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rev.overall_rating > 0 && <StarRating value={rev.overall_rating} />}
                    <Badge className={`text-[10px] ${sc.cls}`}>{sc.label}</Badge>
                  </div>
                </div>
                {rev.strengths && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{rev.strengths}</p>
                )}
                {rev.goals?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rev.goals.slice(0, 2).map((g, i) => (
                      <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${g.achieved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800/60 text-slate-400 border-slate-700/40"}`}>
                        {g.achieved ? "✓" : "○"} {g.title}
                      </span>
                    ))}
                    {rev.goals.length > 2 && <span className="text-[10px] text-slate-600">+{rev.goals.length - 2} mål</span>}
                  </div>
                )}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-cyan-400 px-2" onClick={() => onView(rev)}>
                    <Eye className="w-3 h-3 mr-1" /> Vis
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-slate-400 px-2" onClick={() => onEdit(rev)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Rediger
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}