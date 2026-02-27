import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, X, FileText, BarChart3, Loader2, Clock,
  AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Copy, Check
} from "lucide-react";
import { STAGES } from "./RecruitmentPipeline";

const TABS = [
  { key: "generator", label: "Stillingsbeskrivelse", icon: FileText },
  { key: "analysis",  label: "Pipeline-analyse",    icon: BarChart3 },
];

export default function RecruitmentAIPanel({ job, onDescriptionGenerated, onClose }) {
  const [tab, setTab]           = useState("generator");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [analysing, setAnalysing]   = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState("");
  const [analysis, setAnalysis]     = useState(null);
  const [copied, setCopied]         = useState(false);
  const [expandSection, setExpandSection] = useState(null);

  const generateDescription = async () => {
    if (!keywords.trim() && !job.job_title) return;
    setGenerating(true);
    setGeneratedDesc("");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en erfaren HR-specialist. Generer en professionel og engagerende stillingsbeskrivelse på dansk for følgende stilling:

Stillingsbetegnelse: ${job.job_title}
Afdeling: ${job.department}
Nøgleord / krav: ${keywords || "Ikke specificeret"}
Lokation: ${job.location || "Ikke specificeret"}

Stillingsbeskrivelsen skal inkludere:
1. En engagerende intro om virksomheden og rollen (2-3 sætninger)
2. Nøgleopgaver og ansvarsområder (5-7 bullet points)
3. Kvalifikationer og erfaring vi søger (5-6 bullet points)
4. Hvad vi tilbyder (3-4 bullet points)

Gør beskrivelsen konkret, professionel og attraktiv for ansøgere. Svar KUN med selve stillingsbeskrivelsen uden ekstra forklaring.`,
    });
    const desc = typeof result === "string" ? result : result?.output || result?.text || JSON.stringify(result);
    setGeneratedDesc(desc);
    setGenerating(false);
  };

  const copyAndApply = () => {
    onDescriptionGenerated(generatedDesc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const analysePipeline = async () => {
    setAnalysing(true);
    setAnalysis(null);
    const candidates = job.candidates || [];
    const stageCounts = STAGES.reduce((acc, s) => {
      acc[s.key] = candidates.filter(c => c.stage === s.key).length;
      return acc;
    }, {});
    const totalDays = candidates.reduce((sum, c) => {
      if (c.applied_date) {
        const days = Math.floor((Date.now() - new Date(c.applied_date)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }
      return sum;
    }, 0);
    const avgDays = candidates.length > 0 ? Math.round(totalDays / candidates.length) : 0;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en dataanalyse-ekspert inden for rekruttering. Analyser følgende rekrutteringsdata for stillingen "${job.job_title}" (${job.department}) og giv en struktureret analyse.

Pipeline data:
${STAGES.map(s => `- ${s.label}: ${stageCounts[s.key]} kandidater`).join("\n")}
Total kandidater: ${candidates.length}
Gennemsnitlig dage siden ansøgning: ${avgDays}
Stilling oprettet: ${job.posted_date || "Ukendt"}
Status: ${job.status}

Svar med JSON i dette format (alle tekster på dansk):
{
  "bottlenecks": [{"stage": "stagenavn", "issue": "beskrivelse af flaskehalsen", "severity": "high|medium|low"}],
  "estimated_hire_days": number,
  "conversion_rate": number,
  "recommendations": ["anbefaling 1", "anbefaling 2", "anbefaling 3"],
  "pipeline_health": "god|ok|dårlig",
  "health_reason": "kort begrundelse",
  "time_predictions": {"screening_days": number, "interview_days": number, "offer_days": number, "total_days": number}
}`,
      response_json_schema: {
        type: "object",
        properties: {
          bottlenecks: { type: "array", items: { type: "object", properties: { stage: { type: "string" }, issue: { type: "string" }, severity: { type: "string" } } } },
          estimated_hire_days: { type: "number" },
          conversion_rate: { type: "number" },
          recommendations: { type: "array", items: { type: "string" } },
          pipeline_health: { type: "string" },
          health_reason: { type: "string" },
          time_predictions: { type: "object" }
        }
      }
    });
    setAnalysis(result);
    setAnalysing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 border border-violet-500/30 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-violet-500/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">AI Rekrutteringsassistent</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6 text-slate-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-px ${
                tab === t.key ? "border-violet-500 text-violet-300" : "border-transparent text-slate-400 hover:text-white"
              }`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {/* GENERATOR TAB */}
        {tab === "generator" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Nøgleord / krav til stillingen</p>
              <div className="flex gap-2">
                <Input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="fx. Python, teamwork, 3 års erfaring, B-kørekort..."
                  className="bg-slate-800/60 border-slate-700 text-white h-9 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && generateDescription()}
                />
                <Button onClick={generateDescription} disabled={generating}
                  className="bg-violet-600 hover:bg-violet-500 h-9 px-4 flex-shrink-0">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {generating && (
              <div className="flex items-center gap-2 text-xs text-violet-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI genererer stillingsbeskrivelse...
              </div>
            )}

            {generatedDesc && (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 max-h-52 overflow-y-auto">
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{generatedDesc}</p>
              </div>
            )}

            {generatedDesc && (
              <div className="flex gap-2">
                <Button size="sm" onClick={copyAndApply}
                  className={`h-8 text-xs ${copied ? "bg-emerald-600 hover:bg-emerald-500" : "bg-violet-600 hover:bg-violet-500"}`}>
                  {copied ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Kopieret!</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Anvend på stilling</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={generateDescription} disabled={generating}
                  className="h-8 text-xs text-slate-400">
                  Regenerer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ANALYSIS TAB */}
        {tab === "analysis" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Analyser pipeline for <span className="text-white font-medium">{job.job_title}</span></p>
              <Button size="sm" onClick={analysePipeline} disabled={analysing}
                className="bg-cyan-600 hover:bg-cyan-500 h-8 text-xs">
                {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <BarChart3 className="w-3.5 h-3.5 mr-1.5" />}
                {analysing ? "Analyserer..." : "Kør analyse"}
              </Button>
            </div>

            {(job.candidates || []).length === 0 && (
              <p className="text-xs text-slate-500 italic">Tilføj kandidater til pipelinen for at aktivere analysen.</p>
            )}

            {analysis && (
              <div className="space-y-3">
                {/* Health */}
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                  analysis.pipeline_health === "god" ? "bg-emerald-500/10 border-emerald-500/30" :
                  analysis.pipeline_health === "ok"  ? "bg-amber-500/10 border-amber-500/30" :
                  "bg-rose-500/10 border-rose-500/30"
                }`}>
                  <TrendingUp className={`w-5 h-5 flex-shrink-0 ${
                    analysis.pipeline_health === "god" ? "text-emerald-400" :
                    analysis.pipeline_health === "ok"  ? "text-amber-400" : "text-rose-400"
                  }`} />
                  <div>
                    <p className="text-xs font-semibold text-white capitalize">Pipeline: {analysis.pipeline_health}</p>
                    <p className="text-[10px] text-slate-400">{analysis.health_reason}</p>
                  </div>
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="text-lg font-bold text-cyan-400">{analysis.estimated_hire_days}</p>
                    <p className="text-[9px] text-slate-500">dage til ansættelse</p>
                  </div>
                </div>

                {/* Time predictions */}
                {analysis.time_predictions && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Screening", val: analysis.time_predictions.screening_days },
                      { label: "Interview", val: analysis.time_predictions.interview_days },
                      { label: "Tilbud",    val: analysis.time_predictions.offer_days },
                      { label: "I alt",     val: analysis.time_predictions.total_days },
                    ].map(p => (
                      <div key={p.label} className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-700/40">
                        <p className="text-sm font-bold text-white">{p.val ?? "?"}</p>
                        <p className="text-[9px] text-slate-500">{p.label} dage</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottlenecks */}
                {analysis.bottlenecks?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Flaskehalse ({analysis.bottlenecks.length})
                    </p>
                    <div className="space-y-1.5">
                      {analysis.bottlenecks.map((b, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs px-2.5 py-2 rounded-lg border ${
                          b.severity === "high"   ? "bg-rose-500/10 border-rose-500/20 text-rose-300" :
                          b.severity === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                          "bg-slate-800/40 border-slate-700/40 text-slate-400"
                        }`}>
                          <span className="font-semibold flex-shrink-0">{b.stage}:</span>
                          <span>{b.issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Anbefalinger</p>
                    <div className="space-y-1">
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-cyan-500 font-bold flex-shrink-0">{i + 1}.</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}