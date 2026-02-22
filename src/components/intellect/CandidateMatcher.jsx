import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { 
  X, Brain, Loader2, Search, CheckCircle, AlertTriangle, TrendingUp,
  Users, FileText, Zap, Award, Target, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ScoreBar = ({ score, max = 100, color }) => {
  const pct = (score / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Match Score</span>
        <span className="font-bold text-white">{score}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
};

export default function CandidateMatcher({ onClose }) {
  const [jobDescription, setJobDescription] = useState('');
  const [candidateNames, setCandidateNames] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const handleSearch = async () => {
    if (!jobDescription.trim() || !candidateNames.trim()) {
      alert('Please enter both job description and candidate names');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // Parse candidate names
      const candidates = candidateNames
        .split('\n')
        .map(n => n.trim())
        .filter(n => n);

      if (candidates.length === 0) {
        alert('Please enter at least one candidate name');
        setLoading(false);
        return;
      }

      // Fetch profile data for each candidate in parallel
      const profilePromises = candidates.map(name =>
        base44.integrations.Core.InvokeLLM({
          prompt: `Find complete professional profile information for "${name}": current title, company, location, LinkedIn URL, years of experience, education, core skills (5-7), certifications, previous roles with dates, achievements, languages. Real data only.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              current_title: { type: "string" },
              current_company: { type: "string" },
              years_experience: { type: "number" },
              education: { type: "array", items: { type: "string" } },
              core_skills: { type: "array", items: { type: "string" } },
              certifications: { type: "array", items: { type: "string" } },
              previous_roles: { type: "array", items: { type: "object", additionalProperties: true } },
              achievements: { type: "array", items: { type: "string" } },
              languages: { type: "array", items: { type: "string" } },
              location: { type: "string" }
            }
          }
        })
      );

      const profilesResponse = await Promise.all(profilePromises);
      const profiles = profilesResponse.map(r => r.data || r);

      // AI matching and analysis
      const matchResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert recruiter. Analyze this job description and the candidate profiles provided, then rank them by fit.

JOB DESCRIPTION:
${jobDescription}

CANDIDATES:
${JSON.stringify(profiles, null, 2)}

For each candidate, provide:
1. Overall match score (0-100)
2. Top 3 strengths vs job requirements
3. Top 2 potential gaps/concerns
4. Detailed professional recommendation (2-3 sentences)

Format as JSON array of objects: { candidate_name, match_score, strengths, gaps, recommendation }`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            ranked_candidates: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setResults({
        candidates: matchResponse.data?.ranked_candidates || [],
        summary: matchResponse.data?.summary,
        jobTitle: jobDescription.split('\n')[0]
      });
    } catch (err) {
      console.error('Matching error:', err);
      alert('Error analyzing candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto bg-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-violet-950/30" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/50">
            <Users className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">Candidate Intelligence</h1>
            <p className="text-emerald-400 text-xs">AI-powered candidate matching & analysis</p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {!results ? (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here (title, requirements, responsibilities, etc.)..."
                  className="w-full h-32 px-4 py-3 bg-slate-900/60 border-2 border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Candidate Names</label>
                <textarea
                  value={candidateNames}
                  onChange={e => setCandidateNames(e.target.value)}
                  placeholder="Enter candidate names (one per line)&#10;e.g.:&#10;John Smith&#10;Sarah Johnson&#10;Michael Chen"
                  className="w-full h-32 px-4 py-3 bg-slate-900/60 border-2 border-emerald-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <Button
                onClick={handleSearch}
                disabled={loading || !jobDescription.trim() || !candidateNames.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing candidates...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Match Candidates
                  </>
                )}
              </Button>

              {loading && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />
                  <span className="text-slate-400">Fetching profiles & analyzing fit...</span>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            {/* Summary */}
            {results.summary && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-bold">AI Analysis Summary</h3>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{results.summary}</p>
              </motion.div>
            )}

            {/* Candidates */}
            <div className="space-y-4">
              {results.candidates && results.candidates.map((cand, idx) => {
                const scoreColor = cand.match_score >= 80 ? '#10b981' : cand.match_score >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden hover:border-emerald-500/30 transition-all"
                  >
                    <button
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                      className="w-full text-left flex items-start justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-lg">{cand.candidate_name || cand.full_name}</p>
                            <p className="text-emerald-400 text-sm">{cand.current_title || 'Professional'}</p>
                          </div>
                        </div>
                        <ScoreBar score={cand.match_score || 0} color={scoreColor} />
                      </div>
                      <motion.div animate={{ rotate: expandedIdx === idx ? 180 : 0 }}>
                        <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                      </motion.div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-slate-700/30 space-y-4"
                        >
                          {/* Strengths */}
                          {cand.strengths && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <p className="text-emerald-400 text-sm font-semibold">Strengths</p>
                              </div>
                              <ul className="space-y-1">
                                {(Array.isArray(cand.strengths) ? cand.strengths : [cand.strengths]).map((s, i) => (
                                  <li key={i} className="text-slate-300 text-sm pl-6 relative">
                                    <span className="absolute left-0 text-emerald-400">•</span>
                                    {typeof s === 'string' ? s : s?.text || JSON.stringify(s)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Gaps */}
                          {cand.gaps && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <p className="text-amber-400 text-sm font-semibold">Potential Gaps</p>
                              </div>
                              <ul className="space-y-1">
                                {(Array.isArray(cand.gaps) ? cand.gaps : [cand.gaps]).map((g, i) => (
                                  <li key={i} className="text-slate-300 text-sm pl-6 relative">
                                    <span className="absolute left-0 text-amber-400">•</span>
                                    {typeof g === 'string' ? g : g?.text || JSON.stringify(g)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendation */}
                          {cand.recommendation && (
                            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                              <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-300 text-sm leading-relaxed">{cand.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Back Button */}
            <motion.button
              onClick={() => setResults(null)}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold transition-all text-center"
            >
              ← Analyze Different Candidates
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}