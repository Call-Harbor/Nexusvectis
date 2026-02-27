import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Loader2, Search, Brain, Target, BookOpen,
  TrendingUp, ChevronRight, Star, Award, CheckCircle2, Users
} from "lucide-react";

export default function CandidateMatcher({ employees, orgId }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const filtered = useMemo(() =>
    employees.filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [e.first_name, e.last_name, e.job_title, e.department].some(v => v?.toLowerCase().includes(q));
    }),
    [employees, search]
  );

  const runMatch = async (emp) => {
    setSelected(emp);
    setResult(null);
    setLoading(true);

    const jobs = await base44.entities.Recruitment.filter({ organization_id: orgId, status: "open" }, "-created_date", 20);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en erfaren HR-karriererådgiver. Analyser følgende medarbejder og identificer de bedste interne karrieremuligheder og uddannelsesplaner.

MEDARBEJDER:
Navn: ${emp.first_name} ${emp.last_name}
Nuværende stilling: ${emp.job_title || "Ikke oplyst"}
Afdeling: ${emp.department}
Kompetencer: ${(emp.skills || []).join(", ") || "Ikke oplyst"}
Certificeringer: ${(emp.certifications || []).map(c => c.name).join(", ") || "Ingen"}
Karrieremål: ${emp.career_goals || "Ikke oplyst"}
Ønskede roller: ${(emp.desired_roles || []).join(", ") || "Ikke oplyst"}
Interesseområder: ${(emp.career_interests || []).join(", ") || "Ikke oplyst"}
Foretrukket læring: ${emp.learning_preferences || "Ikke oplyst"}
Ansættelsesdato: ${emp.hire_date || "Ukendt"}

ÅBNE INTERNE STILLINGER:
${jobs.length > 0 ? jobs.map(j => `- ${j.job_title} (${j.department}${j.location ? `, ${j.location}` : ""}): ${j.description?.slice(0,150) || "Ingen beskrivelse"}`).join("\n") : "Ingen åbne stillinger aktuelt"}

Svar med JSON (dansk):
{
  "career_summary": "2-3 sætninger om medarbejderens profil og potentiale",
  "internal_opportunities": [
    {
      "role": "stillingsnavn",
      "department": "afdeling",
      "match_score": number (0-100),
      "match_reason": "kort begrundelse",
      "readiness": "klar" | "næsten_klar" | "med_udvikling"
    }
  ],
  "skill_gaps": ["manglende kompetence 1", "manglende kompetence 2"],
  "learning_plan": [
    {
      "title": "kursusnavn / aktivitet",
      "type": "kursus" | "certificering" | "mentoring" | "projekt" | "workshop",
      "duration": "estimeret varighed",
      "priority": "høj" | "medium" | "lav",
      "rationale": "hvorfor dette er relevant"
    }
  ],
  "development_timeline": "estimeret tid til næste karrieretrin",
  "strengths_summary": ["styrke 1", "styrke 2", "styrke 3"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          career_summary: { type: "string" },
          internal_opportunities: { type: "array", items: { type: "object" } },
          skill_gaps: { type: "array", items: { type: "string" } },
          learning_plan: { type: "array", items: { type: "object" } },
          development_timeline: { type: "string" },
          strengths_summary: { type: "array", items: { type: "string" } }
        }
      }
    });

    setResult(res);
    setLoading(false);
  };

  const readinessCfg = {
    "klar":           { label: "Ready Now",        cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    "næsten_klar":    { label: "Almost Ready",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    "med_udvikling":  { label: "With Development", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  };

  const priorityCls = {
    "høj":    "text-rose-400",
    "medium": "text-amber-400",
    "lav":    "text-slate-400",
    "high":   "text-rose-400",
    "low":    "text-slate-400",
  };

  const typeCls = {
    "kursus":         "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "certificering":  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "mentoring":      "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "projekt":        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "workshop":       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "course":         "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "certification":  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "project":        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className="flex gap-4" style={{ minHeight: "580px" }}>
      {/* Employee list */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="pl-9 bg-slate-900/60 border-slate-700/60 text-white h-9" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map(emp => {
            const hasProfile = emp.career_goals || (emp.desired_roles?.length > 0) || (emp.skills?.length > 0);
            return (
              <button key={emp.id} onClick={() => runMatch(emp)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === emp.id ? "bg-violet-500/10 border-violet-500/40" : "bg-slate-900/40 border-slate-700/50 hover:border-slate-600/60"
                }`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{emp.first_name} {emp.last_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{emp.job_title || emp.department}</p>
                  </div>
                </div>
                {hasProfile && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <Target className="w-2.5 h-2.5 text-violet-400" />
                    <span className="text-[9px] text-violet-400">Career profile filled</span>
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-8">No employees found</p>
          )}
        </div>
      </div>

      {/* Result panel */}
      <div className="flex-1 min-w-0">
        {!selected && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Brain className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm">Select an employee for AI career analysis</p>
            <p className="text-xs mt-1 text-slate-600">Matches skills and goals with internal opportunities</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-3" />
            <p className="text-sm text-violet-300 animate-pulse">AI is analysing career opportunities...</p>
          </div>
        )}

        {result && selected && !loading && (
          <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-y-auto h-full space-y-4 pr-1">
            {/* Header */}
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-bold text-violet-400 flex-shrink-0">
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-white">{selected.first_name} {selected.last_name}</p>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{result.career_summary}</p>
              </div>
              {result.development_timeline && (
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-slate-500">Next career step</p>
                <p className="text-sm font-semibold text-cyan-400">{result.development_timeline}</p>
              </div>
              )}
            </div>

            {/* Strengths */}
            {result.strengths_summary?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5"><Star className="w-3 h-3 text-amber-400" /> Key Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {result.strengths_summary.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Internal opportunities */}
            {result.internal_opportunities?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-cyan-400" /> Internal Career Opportunities</p>
                <div className="space-y-2">
                  {result.internal_opportunities.map((opp, i) => {
                    const rcfg = readinessCfg[opp.readiness] || readinessCfg["med_udvikling"];
                    return (
                      <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{opp.role}</p>
                            <p className="text-xs text-slate-400">{opp.department}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">{opp.match_score}<span className="text-xs text-slate-500">%</span></p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${rcfg.cls}`}>{rcfg.label}</span>
                          </div>
                        </div>
                        {/* Match bar */}
                        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${opp.match_score >= 70 ? "bg-emerald-500" : opp.match_score >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${opp.match_score}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{opp.match_reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill gaps */}
            {result.skill_gaps?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5"><Target className="w-3 h-3 text-rose-400" /> Skill Gaps</p>
                <div className="flex flex-wrap gap-2">
                  {result.skill_gaps.map((g, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning plan */}
            {result.learning_plan?.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-blue-400" /> Learning Plan</p>
                <div className="space-y-2">
                  {result.learning_plan.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${typeCls[item.type] || typeCls["kursus"]}`}>
                        {item.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white font-medium">{item.title}</p>
                          <span className={`text-[10px] font-semibold ${priorityCls[item.priority] || ""}`}>{item.priority}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.rationale}</p>
                        {item.duration && <p className="text-[10px] text-slate-600 mt-0.5">⏱ {item.duration}</p>}
                      </div>
                    </div>
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