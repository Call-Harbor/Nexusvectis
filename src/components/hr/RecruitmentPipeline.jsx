import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, Plus, Users, X, Sparkles, BarChart3, Brain
} from "lucide-react";
import RecruitmentAIPanel from "./RecruitmentAIPanel";
import CandidateScreener from "./CandidateScreener";

export const STAGES = [
  { key: "applied",   label: "Ansøgt",    color: "bg-slate-500/20 text-slate-400" },
  { key: "screening", label: "Screening", color: "bg-blue-500/20 text-blue-400" },
  { key: "interview", label: "Interview", color: "bg-violet-500/20 text-violet-400" },
  { key: "offer",     label: "Tilbud",    color: "bg-amber-500/20 text-amber-400" },
  { key: "hired",     label: "Ansat",     color: "bg-emerald-500/20 text-emerald-400" },
  { key: "rejected",  label: "Afvist",    color: "bg-rose-500/20 text-rose-400" },
];

const STATUS_CONFIG = {
  open:      { label: "Åben",         cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  in_review: { label: "Under review", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  on_hold:   { label: "På hold",      cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  filled:    { label: "Besat",        cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  cancelled: { label: "Annulleret",   cls: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

const DEPTS = ["Operations", "Logistics", "Fleet", "Finance", "HR", "IT", "Sales", "Management"];

export default function RecruitmentPipeline({ orgId }) {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [screeningCandidate, setScreeningCandidate] = useState(null);
  const [jobForm, setJobForm] = useState({ job_title: "", department: "Operations", employment_type: "full_time", status: "open", priority: "medium", description: "", requirements: "", location: "", salary_min: "", salary_max: "", hiring_manager: "" });
  const [candForm, setCandForm] = useState({ name: "", email: "", phone: "", stage: "applied", notes: "", cv_summary: "" });
  const [saving, setSaving] = useState(false);

  const loadJobs = async () => {
    if (!orgId) return;
    const data = await base44.entities.Recruitment.filter({ organization_id: orgId }, "-created_date", 50);
    setJobs(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
  };

  useEffect(() => { loadJobs(); }, [orgId]);

  const setJob = (k, v) => setJobForm(prev => ({ ...prev, [k]: v }));
  const setCand = (k, v) => setCandForm(prev => ({ ...prev, [k]: v }));

  const handleDescriptionGenerated = (desc) => setJobForm(prev => ({ ...prev, description: desc }));

  const saveJob = async () => {
    if (!jobForm.job_title) return;
    setSaving(true);
    const created = await base44.entities.Recruitment.create({
      ...jobForm,
      organization_id: orgId,
      candidates: [],
      posted_date: new Date().toISOString().split("T")[0],
    });
    await loadJobs();
    const updated = await base44.entities.Recruitment.filter({ organization_id: orgId }, "-created_date", 50);
    setSelected(updated.find(j => j.id === created.id) || updated[0]);
    setShowJobForm(false);
    setSaving(false);
    setJobForm({ job_title: "", department: "Operations", employment_type: "full_time", status: "open", priority: "medium", description: "", requirements: "", location: "", salary_min: "", salary_max: "", hiring_manager: "" });
  };

  const addCandidate = async () => {
    if (!selected || !candForm.name) return;
    const newCand = { ...candForm, applied_date: new Date().toISOString().split("T")[0], rating: 0 };
    const updatedCandidates = [...(selected.candidates || []), newCand];
    await base44.entities.Recruitment.update(selected.id, { candidates: updatedCandidates });
    const refreshed = { ...selected, candidates: updatedCandidates };
    setSelected(refreshed);
    setJobs(prev => prev.map(j => j.id === selected.id ? refreshed : j));
    setShowCandidateForm(false);
    setCandForm({ name: "", email: "", phone: "", stage: "applied", notes: "", cv_summary: "" });
  };

  const updateCandidateStage = async (idx, stage) => {
    const candidates = [...(selected.candidates || [])];
    candidates[idx] = { ...candidates[idx], stage };
    await base44.entities.Recruitment.update(selected.id, { candidates });
    const refreshed = { ...selected, candidates };
    setSelected(refreshed);
    setJobs(prev => prev.map(j => j.id === selected.id ? refreshed : j));
  };

  const updateCandidateScreening = async (idx, screeningResult) => {
    const candidates = [...(selected.candidates || [])];
    candidates[idx] = { ...candidates[idx], ai_screening: screeningResult };
    await base44.entities.Recruitment.update(selected.id, { candidates });
    const refreshed = { ...selected, candidates };
    setSelected(refreshed);
    setJobs(prev => prev.map(j => j.id === selected.id ? refreshed : j));
    setScreeningCandidate(null);
  };

  return (
    <div className="flex gap-4" style={{ minHeight: "600px" }}>
      {/* Job list */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <Button onClick={() => setShowJobForm(!showJobForm)} className="bg-cyan-600 hover:bg-cyan-500 flex-1 h-9 text-sm">
            <Plus className="w-4 h-4 mr-2" /> Opret stilling
          </Button>
          {selected && (
            <Button onClick={() => setShowAI(!showAI)} variant="outline"
              className={`h-9 border-violet-500/40 px-3 ${showAI ? "bg-violet-500/20 text-violet-300" : "text-violet-400 hover:bg-violet-500/10"}`}
              title="AI-assistent">
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>

        {showJobForm && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 space-y-2 flex-shrink-0">
            <Input placeholder="Stillingsbetegnelse *" value={jobForm.job_title} onChange={e => setJob("job_title", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs" />
            <Select value={jobForm.department} onValueChange={v => setJob("department", v)}>
              <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">{DEPTS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Lokation" value={jobForm.location} onChange={e => setJob("location", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs" />
            {jobForm.description && (
              <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/40">
                <p className="text-[10px] text-violet-400 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI-genereret beskrivelse klar</p>
                <p className="text-[10px] text-slate-400 line-clamp-2">{jobForm.description}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={saveJob} disabled={saving || !jobForm.job_title} className="bg-cyan-600 hover:bg-cyan-500 h-7 text-xs flex-1">{saving ? "..." : "Gem"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowJobForm(false)} className="h-7 text-xs text-slate-400">Annuller</Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {jobs.map(job => {
            const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.open;
            return (
              <div key={job.id} onClick={() => setSelected(job)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.id === job.id ? "bg-cyan-500/10 border-cyan-500/40" : "bg-slate-900/40 border-slate-700/50 hover:border-slate-600/60"}`}>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-medium text-white leading-tight">{job.job_title}</p>
                  <Badge className={`text-[9px] flex-shrink-0 ${sc.cls}`}>{sc.label}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{job.department}{job.location && ` · ${job.location}`}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
                  <Users className="w-3 h-3" />
                  <span>{(job.candidates || []).length} kandidater</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-3">
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{selected.job_title}</h3>
                <p className="text-xs text-slate-400">{selected.department}{selected.location && ` · ${selected.location}`}</p>
              </div>
              <Button size="sm" onClick={() => setShowCandidateForm(!showCandidateForm)}
                className="bg-violet-600 hover:bg-violet-500 h-8 text-xs flex-shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tilføj kandidat
              </Button>
            </div>

            {/* AI Panel */}
            {showAI && (
              <div className="mb-4 flex-shrink-0">
                <RecruitmentAIPanel
                  job={selected}
                  onDescriptionGenerated={handleDescriptionGenerated}
                  onClose={() => setShowAI(false)}
                />
              </div>
            )}

            {showCandidateForm && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 mb-3 space-y-2 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Navn *" value={candForm.name} onChange={e => setCand("name", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs" />
                  <Input placeholder="E-mail" value={candForm.email} onChange={e => setCand("email", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs" />
                  <Input placeholder="Telefon" value={candForm.phone} onChange={e => setCand("phone", e.target.value)} className="bg-slate-800/60 border-slate-700 text-white h-8 text-xs" />
                </div>
                <textarea
                  value={candForm.cv_summary}
                  onChange={e => setCand("cv_summary", e.target.value)}
                  placeholder="CV-resumé / baggrund (bruges til AI-screening)..."
                  rows={2}
                  className="w-full bg-slate-800/60 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-violet-500/50 placeholder:text-slate-600"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCandidate} className="bg-violet-600 hover:bg-violet-500 h-7 text-xs">Tilføj</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCandidateForm(false)} className="h-7 text-xs text-slate-400">Annuller</Button>
                </div>
              </div>
            )}

            {/* Kanban pipeline */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>
                {STAGES.map(stage => {
                  const stageCandidates = (selected.candidates || [])
                    .map((c, idx) => ({ ...c, _idx: idx }))
                    .filter(c => c.stage === stage.key);
                  return (
                    <div key={stage.key} className="w-44 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.color}`}>{stage.label}</span>
                        <span className="text-xs text-slate-600">{stageCandidates.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {stageCandidates.map(c => (
                          <div key={c._idx} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2.5 text-xs">
                            <p className="font-medium text-white truncate">{c.name}</p>
                            {c.email && <p className="text-slate-500 truncate mt-0.5">{c.email}</p>}

                            {/* AI screening badge */}
                            {c.ai_screening && (
                              <div className={`mt-1.5 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border w-fit ${
                                c.ai_screening.recommendation === "strong_yes" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                c.ai_screening.recommendation === "yes" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                c.ai_screening.recommendation === "maybe" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}>
                                <Brain className="w-2.5 h-2.5" />
                                AI: {c.ai_screening.score}/10
                              </div>
                            )}

                            <div className="mt-2 flex gap-1 flex-wrap">
                              <button
                                onClick={() => setScreeningCandidate({ candidate: c, candidateIdx: c._idx })}
                                className="text-[9px] px-1.5 py-0.5 bg-violet-800/40 rounded text-violet-400 hover:bg-violet-700/50 transition-colors flex items-center gap-0.5"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> Screen
                              </button>
                              {STAGES.filter(s => s.key !== stage.key && s.key !== "rejected").slice(0, 2).map(ns => (
                                <button
                                  key={ns.key}
                                  onClick={() => updateCandidateStage(c._idx, ns.key)}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                  → {ns.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p>Vælg eller opret en stilling</p>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Screener modal */}
      {screeningCandidate && (
        <CandidateScreener
          candidate={screeningCandidate.candidate}
          job={selected}
          onSave={(result) => updateCandidateScreening(screeningCandidate.candidateIdx, result)}
          onClose={() => setScreeningCandidate(null)}
        />
      )}
    </div>
  );
}