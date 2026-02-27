import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, Search, Brain, BookOpen, Star, Target,
  TrendingUp, CheckCircle2, Clock, Users, ChevronRight, Zap
} from "lucide-react";

const TYPE_LABELS = {
  course: "Kursus", workshop: "Workshop", elearning: "E-læring",
  certification: "Certificering", mentoring: "Mentoring", seminar: "Seminar"
};

const PRIORITY_CLS = {
  høj: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  lav: "bg-slate-700/40 text-slate-400 border-slate-600/30",
};

export default function LearningAIRecommender({ employees, courses, orgId }) {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [enrolling, setEnrolling]   = useState({});

  const filteredEmps = useMemo(() =>
    employees.filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [e.first_name, e.last_name, e.job_title, e.department].some(v => v?.toLowerCase().includes(q));
    }),
    [employees, search]
  );

  const getRecommendations = async (emp) => {
    setSelected(emp);
    setResult(null);
    setLoading(true);

    // Gather employee's reviews
    const reviews = await base44.entities.PerformanceReview.filter({ organization_id: orgId, employee_id: emp.id }, "-created_date", 5);

    const catalogSummary = courses.filter(c => c.status === "active").map(c =>
      `ID:${c.id} | "${c.title}" | Type: ${c.type} | Kategori: ${c.category || "—"} | Kompetencer: ${(c.target_skills || []).join(", ") || "—"} | ${c.duration_hours || "?"}t | ${c.format}`
    ).join("\n");

    const reviewSummary = reviews.length > 0 ? reviews.map(r =>
      `Periode: ${r.review_period}, Bedømmelse: ${r.overall_rating}/5, Styrker: ${r.strengths?.slice(0, 100) || "—"}, Udviklingsområder: ${r.areas_for_improvement?.slice(0, 100) || "—"}`
    ).join("\n") : "Ingen reviews";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en professionel L&D (Learning & Development) specialist. Analyser medarbejderens profil og anbefal de mest relevante kurser fra vores katalog.

MEDARBEJDER:
Navn: ${emp.first_name} ${emp.last_name}
Stilling: ${emp.job_title || "Ikke oplyst"} | Afdeling: ${emp.department}
Kompetencer: ${(emp.skills || []).join(", ") || "Ingen"}
Certificeringer: ${(emp.certifications || []).map(c => c.name).join(", ") || "Ingen"}
Karrieremål: ${emp.career_goals || "Ikke oplyst"}
Ønskede roller: ${(emp.desired_roles || []).join(", ") || "Ingen"}
Interesseområder: ${(emp.career_interests || []).join(", ") || "Ingen"}

SENESTE PERFORMANCE REVIEWS:
${reviewSummary}

TILGÆNGELIGT KURSKATALOG:
${catalogSummary || "Ingen kurser tilgængelige endnu"}

Svar med JSON (dansk):
{
  "profile_summary": "2 sætninger om medarbejderens nuværende kompetenceprofil og udviklingsbehov",
  "recommendations": [
    {
      "course_id": "ID fra kataloget (præcist som angivet)",
      "course_title": "kursusnavn",
      "priority": "høj" | "medium" | "lav",
      "reason": "konkret begrundelse (1-2 sætninger)",
      "expected_impact": "hvad det vil bidrage med",
      "timeline_suggestion": "fx. inden for 3 måneder"
    }
  ],
  "missing_courses": ["kursus/emne der mangler i kataloget men ville være relevant"],
  "development_focus": "overordnet fokusområde for denne medarbejder"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          profile_summary: { type: "string" },
          recommendations: { type: "array", items: { type: "object" } },
          missing_courses: { type: "array", items: { type: "string" } },
          development_focus: { type: "string" }
        }
      }
    });

    setResult(res);
    setLoading(false);
  };

  const enrollEmployee = async (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || !selected) return;
    const existing = (course.enrollments || []).find(e => e.employee_id === selected.id);
    if (existing) return;
    setEnrolling(prev => ({ ...prev, [courseId]: true }));
    const enrollments = [...(course.enrollments || []), {
      employee_id: selected.id,
      employee_name: `${selected.first_name} ${selected.last_name}`,
      status: "requested",
      requested_date: new Date().toISOString().split("T")[0],
      progress_pct: 0,
    }];
    await base44.entities.TrainingCourse.update(courseId, { enrollments });
    setEnrolling(prev => ({ ...prev, [courseId]: false }));
  };

  return (
    <div className="flex gap-4" style={{ minHeight: "560px" }}>
      {/* Employee selector */}
      <div className="w-60 flex-shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg medarbejder..." className="pl-9 bg-slate-900/60 border-slate-700/60 text-white h-9" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredEmps.map(emp => (
            <button key={emp.id} onClick={() => getRecommendations(emp)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selected?.id === emp.id ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900/40 border-slate-700/50 hover:border-slate-600/60"}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{emp.first_name} {emp.last_name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{emp.job_title || emp.department}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="flex-1 min-w-0">
        {!selected && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Sparkles className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm">Vælg en medarbejder for AI-kursusanbefalinger</p>
            <p className="text-xs mt-1 text-slate-600">Baseret på kompetencer, karrieremål og performance</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm text-emerald-300 animate-pulse">AI analyserer og matcher kurser...</p>
          </div>
        )}

        {result && selected && !loading && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-y-auto h-full space-y-4 pr-1">
            {/* Header summary */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 flex-shrink-0">
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white">{selected.first_name} {selected.last_name}</p>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.profile_summary}</p>
                {result.development_focus && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-300 font-medium">{result.development_focus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-emerald-400" /> Anbefalede kurser ({result.recommendations.length})
                </p>
                <div className="space-y-3">
                  {result.recommendations.map((rec, i) => {
                    const course = courses.find(c => c.id === rec.course_id || c.title === rec.course_title);
                    const isEnrolled = course && (course.enrollments || []).some(e => e.employee_id === selected.id);
                    return (
                      <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-lg font-bold text-slate-600 flex-shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white leading-tight">{rec.course_title}</p>
                              {course && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500">{TYPE_LABELS[course.type]}</span>
                                  {course.duration_hours && <span className="text-[10px] text-slate-600">· {course.duration_hours}t</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={`text-[10px] ${PRIORITY_CLS[rec.priority] || PRIORITY_CLS.medium}`}>{rec.priority}</Badge>
                            {course ? (
                              isEnrolled ? (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tilmeldt</span>
                              ) : (
                                <Button size="sm" onClick={() => enrollEmployee(course.id)} disabled={enrolling[course.id]}
                                  className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2">
                                  {enrolling[course.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1" />Tilmeld</>}
                                </Button>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">Ikke i katalog</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-1.5">{rec.reason}</p>
                        {rec.expected_impact && (
                          <p className="text-xs text-emerald-400/80 flex items-start gap-1">
                            <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />{rec.expected_impact}
                          </p>
                        )}
                        {rec.timeline_suggestion && (
                          <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{rec.timeline_suggestion}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Missing courses */}
            {result.missing_courses?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-400" /> Mangler i kataloget
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missing_courses.map((c, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}