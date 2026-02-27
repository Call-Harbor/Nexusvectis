import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X, Brain, Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle,
  Star, ThumbsUp, ThumbsDown, Minus, Save
} from "lucide-react";

const RECOMMENDATION_CONFIG = {
  strong_yes: { label: "Stærkt anbefalet",  icon: ThumbsUp,  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  yes:        { label: "Anbefalet",         icon: ThumbsUp,  cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  maybe:      { label: "Mulig kandidat",    icon: Minus,     cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  no:         { label: "Ikke anbefalet",    icon: ThumbsDown,cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

export default function CandidateScreener({ candidate, job, onSave, onClose }) {
  const [screening, setScreening] = useState(false);
  const [result, setResult] = useState(candidate.ai_screening || null);

  const runScreening = async () => {
    setScreening(true);
    setResult(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en erfaren rekrutteringsspecialist. Lav en objektiv screening-analyse af følgende kandidat til en stilling.

STILLING: ${job.job_title} (${job.department})${job.location ? `, ${job.location}` : ""}
${job.description ? `\nSTILLINGSBESKRIVELSE:\n${job.description.slice(0, 600)}` : ""}
${job.requirements ? `\nKRAV:\n${job.requirements.slice(0, 400)}` : ""}

KANDIDAT:
Navn: ${candidate.name}
E-mail: ${candidate.email || "Ikke oplyst"}
CV-resumé: ${candidate.cv_summary || "Ikke oplyst"}
Eksisterende noter: ${candidate.notes || "Ingen"}

Analyser kandidatens egnethed og svar med JSON (dansk):
{
  "score": number (0-10),
  "recommendation": "strong_yes" | "yes" | "maybe" | "no",
  "summary": "kort opsummering på 2-3 sætninger",
  "strengths": ["styrke 1", "styrke 2", "styrke 3"],
  "concerns": ["bekymring 1", "bekymring 2"],
  "interview_questions": ["spørgsmål 1", "spørgsmål 2", "spørgsmål 3"],
  "fit_dimensions": {
    "skills_match": number (0-10),
    "experience_match": number (0-10),
    "culture_fit": number (0-10)
  }
}`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          recommendation: { type: "string" },
          summary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          concerns: { type: "array", items: { type: "string" } },
          interview_questions: { type: "array", items: { type: "string" } },
          fit_dimensions: {
            type: "object",
            properties: {
              skills_match: { type: "number" },
              experience_match: { type: "number" },
              culture_fit: { type: "number" }
            }
          }
        }
      }
    });
    setResult(res);
    setScreening(false);
  };

  const recCfg = result ? (RECOMMENDATION_CONFIG[result.recommendation] || RECOMMENDATION_CONFIG.maybe) : null;
  const RecIcon = recCfg?.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-violet-500/30 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0 bg-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400">
              {candidate.name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{candidate.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Brain className="w-3 h-3 text-violet-400" /> AI Kandidat-screening · {job.job_title}
              </p>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!result && !screening && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-sm text-slate-300 mb-1">Klar til AI-screening</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                AI'en vil analysere kandidatens profil op mod stillingskravene og give en struktureret vurdering.
              </p>
              {!candidate.cv_summary && (
                <p className="text-xs text-amber-400 mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Ingen CV-information — resultatet baseres på stillingsprofil alene
                </p>
              )}
            </div>
          )}

          {screening && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-violet-300 animate-pulse">AI screener kandidaten...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Score + recommendation */}
              <div className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${recCfg?.cls}`}>
                <div className="text-center flex-shrink-0">
                  <p className="text-3xl font-bold text-white">{result.score}</p>
                  <p className="text-[10px] text-slate-400">/ 10</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {RecIcon && <RecIcon className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{recCfg?.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{result.summary}</p>
                </div>
              </div>

              {/* Fit dimensions */}
              {result.fit_dimensions && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Match-dimensioner</p>
                  {[
                    { key: "skills_match",      label: "Kompetencer" },
                    { key: "experience_match",  label: "Erfaring" },
                    { key: "culture_fit",       label: "Kultur-fit" },
                  ].map(d => {
                    const val = result.fit_dimensions[d.key] || 0;
                    return (
                      <div key={d.key} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-28 flex-shrink-0">{d.label}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${val >= 7 ? "bg-emerald-500" : val >= 5 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${val * 10}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-white w-6 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Styrker</p>
                  <div className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-500" />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {result.concerns?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Bekymringer</p>
                  <div className="space-y-1">
                    {result.concerns.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-rose-300">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-500" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview questions */}
              {result.interview_questions?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Foreslåede interviewspørgsmål</p>
                  <div className="space-y-1.5">
                    {result.interview_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 rounded-lg px-3 py-2">
                        <span className="text-violet-400 font-bold flex-shrink-0">Q{i+1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 h-9 text-sm">Luk</Button>
          <div className="flex gap-2">
            {result && (
              <Button onClick={() => runScreening()} variant="outline"
                className="h-9 text-sm border-slate-700 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerer
              </Button>
            )}
            {result ? (
              <Button onClick={() => onSave(result)} className="bg-violet-600 hover:bg-violet-500 h-9 text-sm">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Gem screening
              </Button>
            ) : (
              <Button onClick={runScreening} disabled={screening} className="bg-violet-600 hover:bg-violet-500 h-9 text-sm">
                {screening ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Brain className="w-3.5 h-3.5 mr-1.5" /> Start screening</>}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}