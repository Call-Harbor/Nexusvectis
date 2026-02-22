import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { 
  X, Loader2, Brain, Search, Plus, Trash2, CheckCircle, AlertCircle, 
  TrendingUp, Users, Award, Target, Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CandidateMatcher({ onClose }) {
  const [step, setStep] = useState('input'); // input, loading, results
  const [jobDescription, setJobDescription] = useState('');
  const [candidates, setCandidates] = useState([{ id: 1, name: '' }]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const nextId = React.useRef(2);

  const addCandidate = () => {
    setCandidates([...candidates, { id: nextId.current, name: '' }]);
    nextId.current += 1;
  };

  const updateCandidate = (id, name) => {
    setCandidates(candidates.map(c => c.id === id ? { ...c, name } : c));
  };

  const removeCandidate = (id) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter(c => c.id !== id));
    }
  };

  const analyzeMatches = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (candidates.filter(c => c.name.trim()).length === 0) {
      setError('Please add at least one candidate');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('loading');

    try {
      const candidateList = candidates.filter(c => c.name.trim()).map(c => c.name);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert recruiter. Analyze the following candidates against this job description and provide detailed matching analysis.

Job Description:
${jobDescription}

Candidates:
${candidateList.map((name, i) => `${i + 1}. ${name}`).join('\n')}

For each candidate, provide:
1. Match Score (0-100)
2. Key Strengths (3-4 points)
3. Gaps/Weaknesses (2-3 points)
4. Recommendation (STRONG MATCH/GOOD MATCH/MODERATE MATCH/POOR MATCH)
5. Why hire/why not (1-2 sentences)

Format as a structured JSON response.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  candidate_name: { type: "string" },
                  match_score: { type: "number" },
                  strengths: { type: "array", items: { type: "string" } },
                  gaps: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" },
                  why: { type: "string" }
                }
              }
            },
            top_pick: { type: "string" },
            overall_assessment: { type: "string" }
          }
        }
      });

      setResults(response);
      setStep('results');
    } catch (err) {
      setError(err.message || 'Failed to analyze candidates');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-violet-950/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-5 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/50">
            <Users className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">Candidate Intelligence</h1>
            <p className="text-emerald-400 text-xs">AI-Powered Candidate Matching</p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">

          {/* INPUT STEP */}
          <AnimatePresence>
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Job Description */}
                <div className="space-y-3">
                  <label className="block text-white font-semibold text-sm">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here... Include requirements, responsibilities, and ideal candidate profile."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-emerald-500/30 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 min-h-32 text-sm leading-relaxed"
                  />
                  <p className="text-slate-400 text-xs">
                    {jobDescription.length} characters
                  </p>
                </div>

                {/* Candidates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-white font-semibold text-sm">Candidates to Analyze</label>
                    <p className="text-slate-400 text-xs">{candidates.filter(c => c.name.trim()).length} added</p>
                  </div>
                  
                  <div className="space-y-2">
                    {candidates.map(candidate => (
                      <div key={candidate.id} className="flex gap-2">
                        <input
                          value={candidate.name}
                          onChange={e => updateCandidate(candidate.id, e.target.value)}
                          placeholder={`Candidate name (e.g. John Smith)`}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 text-sm"
                        />
                        {candidates.length > 1 && (
                          <Button
                            onClick={() => removeCandidate(candidate.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={addCandidate}
                    variant="outline"
                    className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Candidate
                  </Button>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={analyzeMatches}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Analyze Matches
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOADING STEP */}
          {step === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 animate-spin border-t-emerald-400" />
                <Brain className="absolute inset-0 m-auto w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Analyzing Candidates</p>
                <p className="text-slate-400 text-sm mt-1">Evaluating skills, experience, and fit...</p>
              </div>
            </motion.div>
          )}

          {/* RESULTS STEP */}
          <AnimatePresence>
            {step === 'results' && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overall Assessment */}
                {results.overall_assessment && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Assessment</p>
                        <p className="text-white text-sm">{results.overall_assessment}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Pick */}
                {results.top_pick && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/30 flex items-start gap-3">
                    <Award className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 text-xs font-bold uppercase mb-1">Top Recommendation</p>
                      <p className="text-white font-semibold">{results.top_pick}</p>
                    </div>
                  </div>
                )}

                {/* Candidate Matches */}
                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Detailed Analysis</h3>
                  {results.matches?.map((match, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="text-white font-bold text-base">{match.candidate_name}</p>
                          <Badge className={`mt-1 ${
                            match.match_score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            match.match_score >= 60 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                            match.match_score >= 40 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}>
                            {match.recommendation}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-emerald-400">{match.match_score}</div>
                          <div className="text-slate-400 text-xs">/100</div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${match.match_score}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>

                      {/* Why */}
                      {match.why && (
                        <p className="text-slate-300 text-sm mb-3 italic border-l-2 border-emerald-500/30 pl-3">{match.why}</p>
                      )}

                      {/* Strengths */}
                      {match.strengths?.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <p className="text-emerald-400 text-xs font-semibold uppercase">Strengths</p>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {match.strengths.map((strength, i) => (
                              <li key={i} className="text-slate-300 text-xs leading-relaxed">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Gaps */}
                      {match.gaps?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <p className="text-amber-400 text-xs font-semibold uppercase">Gaps</p>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {match.gaps.map((gap, i) => (
                              <li key={i} className="text-slate-300 text-xs leading-relaxed">• {gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Back Button */}
                <Button
                  onClick={() => {
                    setStep('input');
                    setResults(null);
                  }}
                  variant="outline"
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Analyze New Candidates
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
}