import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, Brain, Sparkles, Loader2, CheckCircle2, XCircle,
  ThumbsUp, ThumbsDown, Minus, Trophy, BarChart3, Save,
  AlertCircle, ChevronDown, ChevronUp, Upload
} from "lucide-react";

const RECOMMENDATION_CONFIG = {
  strong_yes: { label: "Strongly Recommended", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", rank_cls: "border-l-emerald-500" },
  yes:        { label: "Recommended",          cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",          rank_cls: "border-l-blue-500" },
  maybe:      { label: "Possible Candidate",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",       rank_cls: "border-l-amber-500" },
  no:         { label: "Not Recommended",      cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",          rank_cls: "border-l-rose-500" },
};

const MEDAL_COLORS = ["text-amber-400", "text-slate-300", "text-amber-600"];

export default function CandidateRanking({ job, onSaveAll, onClose }) {
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });

  const candidates = (job.candidates || []).filter(c => c.stage !== "rejected");

  const runBulkScreening = async () => {
    if (candidates.length === 0) return;
    setLoading(true);
    setResults(null);
    setProgress({ current: 0, total: candidates.length });

    // Screen all candidates in one LLM call for efficiency
    const candidateList = candidates.map((c, i) =>
      `Kandidat ${i + 1}: ${c.name} | Email: ${c.email || "—"} | CV/Baggrund: ${c.cv_summary || "Ingen information"}`
    ).join("\n\n");

    setProgress({ current: 1, total: 1 });

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en erfaren rekrutteringsspecialist og hiring manager. Analyser og rangordner følgende kandidater til stillingen.

STILLING: ${job.job_title} (${job.department})${job.location ? `, ${job.location}` : ""}
${job.description ? `\nSTILLINGSBESKRIVELSE:\n${job.description.slice(0, 800)}` : ""}
${job.requirements ? `\nKRAV & KVALIFIKATIONER:\n${job.requirements.slice(0, 500)}` : ""}

KANDIDATER TIL VURDERING:
${candidateList}

Lav en komplet vurdering af ALLE kandidater og rangorden dem fra bedst til ringest egnet. Svar med JSON (dansk):
{
  "job_key_requirements": ["krav 1", "krav 2", "krav 3", "krav 4"],
  "rankings": [
    {
      "candidate_name": "navn (præcist som angivet)",
      "rank": 1,
      "score": number (0-10),
      "recommendation": "strong_yes" | "yes" | "maybe" | "no",
      "summary": "1-2 sætninger om kandidatens egnethed",
      "top_strengths": ["styrke 1", "styrke 2"],
      "key_concerns": ["bekymring 1"],
      "skills_match": number (0-10),
      "experience_match": number (0-10),
      "culture_fit": number (0-10),
      "interview_questions": ["spørgsmål 1", "spørgsmål 2"]
    }
  ],
  "overall_assessment": "opsummering af kandidatfeltet",
  "recommendation_text": "hvem anbefales til næste trin og hvorfor"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          job_key_requirements: { type: "array", items: { type: "string" } },
          rankings: { type: "array", items: { type: "object" } },
          overall_assessment: { type: "string" },
          recommendation_text: { type: "string" }
        }
      }
    });

    setResults(res);
    setLoading(false);
  };

  const handleSaveAll = async () => {
    if (!results?.rankings) return;
    setSaving(true);
    // Merge AI results back onto candidates
    const updatedCandidates = (job.candidates || []).map(c => {
      const ranking = results.rankings.find(r =>
        r.candidate_name?.toLowerCase().includes(c.name?.toLowerCase()) ||
        c.name?.toLowerCase().includes(r.candidate_name?.toLowerCase())
      );
      if (!ranking) return c;
      return {
        ...c,
        ai_screening: {
          score: ranking.score,
          recommendation: ranking.recommendation,
          summary: ranking.summary,
          strengths: ranking.top_strengths || [],
          concerns: ranking.key_concerns || [],
          interview_questions: ranking.interview_questions || [],
          fit_dimensions: {
            skills_match: ranking.skills_match,
            experience_match: ranking.experience_match,
            culture_fit: ranking.culture_fit,
          },
          rank: ranking.rank,
        }
      };
    });
    await onSaveAll(updatedCandidates);
    setSaving(false);
    onClose();
  };

  const sortedRankings = results?.rankings?.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99)) || [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0 bg-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Candidate Ranking</p>
              <p className="text-xs text-slate-400">{job.job_title} · {candidates.length} candidates</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* No candidates */}
          {candidates.length === 0 && (
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-700" />
              <p className="text-sm text-slate-400">No active candidates to rank</p>
              <p className="text-xs text-slate-600 mt-1">Add candidates with CV information for best results</p>
            </div>
          )}

          {/* Ready state */}
          {candidates.length > 0 && !loading && !results && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Candidates to be screened
                </p>
                <div className="space-y-1.5">
                  {candidates.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">{i + 1}</div>
                      <span className="text-white">{c.name}</span>
                      {c.cv_summary ? (
                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-auto">CV available</Badge>
                      ) : (
                        <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 ml-auto">No CV</Badge>
                      )}
                      {c.ai_screening && (
                        <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">Screened</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {!job.description && (
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Stillingen mangler beskrivelse. Brug AI-assistenten til at generere en for bedre matching.</span>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-cyan-500/30 animate-spin absolute inset-0" />
                <Brain className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-cyan-300 font-medium">AI is ranking {candidates.length} candidates...</p>
              <p className="text-xs text-slate-500 mt-1">Analysing skills, experience and culture fit</p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="space-y-4">
              {/* Key requirements */}
              {results.job_key_requirements?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Identified Key Requirements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.job_key_requirements.map((req, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{req}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rankings */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Ranking ({sortedRankings.length} candidates)</p>
                <div className="space-y-2">
                  {sortedRankings.map((r, i) => {
                    const cfg = RECOMMENDATION_CONFIG[r.recommendation] || RECOMMENDATION_CONFIG.maybe;
                    const isExp = expanded === i;
                    return (
                      <div key={i} className={`bg-slate-900/60 border border-slate-700/50 border-l-4 ${cfg.rank_cls} rounded-r-xl overflow-hidden`}>
                        <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/20 transition-colors text-left"
                          onClick={() => setExpanded(isExp ? null : i)}>
                          <div className="flex-shrink-0 w-7 text-center">
                            {i < 3 ? (
                              <Trophy className={`w-4 h-4 inline ${MEDAL_COLORS[i]}`} />
                            ) : (
                              <span className="text-sm font-bold text-slate-600">#{r.rank || i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{r.candidate_name}</p>
                              <Badge className={`text-[9px] ${cfg.cls}`}>{cfg.label}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{r.summary}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">{r.score}</p>
                              <p className="text-[10px] text-slate-600">/10</p>
                            </div>
                            {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </div>
                        </button>

                        {isExp && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 space-y-3">
                            {/* Score bars */}
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: "Skills", val: r.skills_match },
                                { label: "Experience", val: r.experience_match },
                                { label: "Culture Fit", val: r.culture_fit },
                              ].map(d => (
                                <div key={d.label} className="text-center">
                                  <p className="text-[10px] text-slate-500 mb-1">{d.label}</p>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${(d.val||0) >= 7 ? "bg-emerald-500" : (d.val||0) >= 5 ? "bg-amber-500" : "bg-rose-500"}`}
                                      style={{ width: `${(d.val || 0) * 10}%` }} />
                                  </div>
                                  <p className="text-xs font-bold text-white mt-0.5">{d.val || "—"}</p>
                                </div>
                              ))}
                            </div>

                            {/* Strengths & concerns */}
                            <div className="grid grid-cols-2 gap-3">
                              {r.top_strengths?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase mb-1">Strengths</p>
                                  {r.top_strengths.map((s, si) => (
                                    <div key={si} className="flex items-start gap-1.5 text-xs text-emerald-300 mb-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {r.key_concerns?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase mb-1">Concerns</p>
                                  {r.key_concerns.map((c, ci) => (
                                    <div key={ci} className="flex items-start gap-1.5 text-xs text-rose-300 mb-0.5">
                                      <XCircle className="w-3 h-3 text-rose-500 flex-shrink-0 mt-0.5" />{c}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Interview questions */}
                            {r.interview_questions?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase mb-1.5">Suggested Interview Questions</p>
                                {r.interview_questions.map((q, qi) => (
                                  <div key={qi} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 rounded-lg px-2.5 py-1.5 mb-1">
                                    <span className="text-cyan-400 font-bold flex-shrink-0">Q{qi+1}.</span>{q}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall assessment */}
              {results.overall_assessment && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-cyan-400 uppercase font-semibold mb-1 flex items-center gap-1.5"><Brain className="w-3 h-3" /> AI Overall Assessment</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{results.overall_assessment}</p>
                  {results.recommendation_text && (
                    <p className="text-xs text-cyan-300 mt-2 font-medium">→ {results.recommendation_text}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 h-9 text-sm">Close</Button>
          <div className="flex gap-2">
            {results && (
              <Button onClick={runBulkScreening} variant="outline" disabled={loading}
                className="h-9 text-sm border-slate-700 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Run Again
              </Button>
            )}
            {results ? (
              <Button onClick={handleSaveAll} disabled={saving} className="bg-cyan-600 hover:bg-cyan-500 h-9 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" /> Save All Results</>}
              </Button>
            ) : (
              <Button onClick={runBulkScreening} disabled={loading || candidates.length === 0}
                className="bg-cyan-600 hover:bg-cyan-500 h-9 text-sm">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Brain className="w-3.5 h-3.5 mr-1.5" /> Rank {candidates.length} Candidates</>
                }
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}