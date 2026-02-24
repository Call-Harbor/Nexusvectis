import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Search, Loader2, User, Linkedin, Mail, MapPin, Building2,
  Award, Users, Brain, Filter, X, GitCompare, ShieldCheck,
  GraduationCap, Briefcase, Globe, ChevronDown, ChevronUp,
  CheckCircle, Code, Network, TrendingUp, Zap, Star,
  FileText, Download, RefreshCw, AlertCircle, Sparkles,
  Phone, Twitter, Github, BookOpen, Mic, Newspaper
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── GDPR Consent ───────────────────────────────────────────────────────────
const GDPRConsent = ({ onAccept }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-lg p-8 space-y-5 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Privacy & GDPR Notice</h2>
          <p className="text-slate-400 text-sm">Before using People Intelligence</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        This tool searches publicly available professional information from LinkedIn, company websites,
        news archives, and other open sources. All data is legally accessible and used solely for
        professional intelligence purposes.
      </p>
      <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
        {[
          'Only publicly available data is collected',
          'Data is used exclusively for business intelligence',
          'Results are not stored permanently beyond your session',
          'Not used for marketing, profiling, or unauthorized purposes',
          'Compliant with GDPR Article 6(1)(f) — legitimate interest',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <Button
        onClick={onAccept}
        className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-semibold py-3 rounded-xl"
      >
        I Understand & Accept — Start Searching
      </Button>
    </motion.div>
  </div>
);

// ─── Score Badge ─────────────────────────────────────────────────────────────
const DataScore = ({ score }) => {
  const color = score >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-red-400 border-red-500/30 bg-red-500/10';
  return (
    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      {score}% match
    </div>
  );
};

// ─── Candidate Picker ─────────────────────────────────────────────────────────
const CandidatePicker = ({ candidates, query, onSelect }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
    <div className="flex items-center gap-2 mb-4">
      <Users className="w-4 h-4 text-cyan-400" />
      <p className="text-slate-300 text-sm font-semibold">
        Found <span className="text-cyan-400 font-bold">{candidates.length}</span> people named{' '}
        <span className="text-white">"{query}"</span> — select the right one:
      </p>
    </div>
    <div className="grid gap-2">
      {candidates.map((c, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(c)}
          className="text-left p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm group-hover:text-cyan-300 transition-colors">{c.full_name}</p>
              <p className="text-cyan-400 text-xs">{c.current_title}</p>
              <p className="text-slate-400 text-xs">{c.current_company}</p>
              {c.location && (
                <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />{c.location}
                </p>
              )}
              {c.short_description && (
                <p className="text-slate-500 text-[11px] mt-1 italic">{c.short_description}</p>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors -rotate-90 flex-shrink-0" />
          </div>
        </motion.button>
      ))}
    </div>
  </motion.div>
);

// ─── Loading State ────────────────────────────────────────────────────────────
const LoadingState = ({ stage }) => {
  const stages = [
    { label: 'Searching public profiles...', done: stage > 0 },
    { label: 'Analyzing career history...', done: stage > 1 },
    { label: 'Extracting skills & expertise...', done: stage > 2 },
    { label: 'Finding achievements & impact...', done: stage > 3 },
    { label: 'Building intelligence report...', done: stage > 4 },
  ];
  return (
    <div className="py-12 flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <Brain className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="space-y-2 w-full max-w-xs">
        {stages.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs transition-all ${i === stage ? 'text-cyan-400' : i < stage ? 'text-slate-500' : 'text-slate-700'}`}>
            {i < stage ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : i === stage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />}
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, color = 'text-cyan-400', children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
      >
        <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
        <span className="text-white font-semibold text-sm flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-slate-800/60 bg-slate-950/40 space-y-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

// ─── Profile Report ───────────────────────────────────────────────────────────
const ProfileReport = ({ data, onReset }) => {
  const completeness = (() => {
    const fields = ['full_name','current_title','current_company','location','linkedin_url',
      'total_experience_years','education','core_skills','career_history','major_accomplishments'];
    const filled = fields.filter(f => {
      const v = data[f];
      return v && (Array.isArray(v) ? v.length > 0 : true);
    });
    return Math.round((filled.length / fields.length) * 100);
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/20 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500" />
        <div className="p-6">
          <div className="flex items-start gap-5 mb-4">
            <div className="relative">
              {data.linkedin_profile_image_url ? (
                <img
                  src={data.linkedin_profile_image_url}
                  alt={data.full_name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-cyan-500/40"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/40 items-center justify-center ${data.linkedin_profile_image_url ? 'hidden' : 'flex'}`}>
                <User className="w-9 h-9 text-cyan-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-slate-900" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-white text-2xl font-bold leading-tight">{data.full_name || 'Unknown'}</h2>
                <DataScore score={completeness} />
              </div>
              <p className="text-cyan-400 font-semibold">{data.current_title}</p>
              <p className="text-slate-300 text-sm">{data.current_company}</p>
              {data.location && (
                <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  {data.location}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {data.total_experience_years && (
              <div className="p-3 rounded-xl bg-slate-800/60 text-center">
                <p className="text-2xl font-bold text-white">{data.total_experience_years}</p>
                <p className="text-slate-400 text-[11px]">Years Exp.</p>
              </div>
            )}
            {data.estimated_seniority && (
              <div className="p-3 rounded-xl bg-slate-800/60 text-center">
                <p className="text-sm font-bold text-cyan-400 leading-tight mt-0.5">{data.estimated_seniority}</p>
                <p className="text-slate-400 text-[11px]">Level</p>
              </div>
            )}
            {data.connections_count && (
              <div className="p-3 rounded-xl bg-slate-800/60 text-center">
                <p className="text-sm font-bold text-violet-400 leading-tight mt-0.5">{data.connections_count}</p>
                <p className="text-slate-400 text-[11px]">Connections</p>
              </div>
            )}
          </div>

          {/* Links row */}
          <div className="flex flex-wrap gap-2">
            {data.linkedin_url && (
              <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {data.email && (
              <a href={`mailto:${data.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                <Mail className="w-3.5 h-3.5" /> {data.email}
              </a>
            )}
            {data.social_media_presence?.twitter && (
              <a href={`https://twitter.com/${data.social_media_presence.twitter}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs hover:bg-sky-500/20 transition-colors">
                <Twitter className="w-3.5 h-3.5" /> Twitter/X
              </a>
            )}
            {data.social_media_presence?.github && (
              <a href={`https://github.com/${data.social_media_presence.github}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/40 border border-slate-600/50 text-slate-300 text-xs hover:bg-slate-700/60 transition-colors">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            <button onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 transition-colors ml-auto">
              <RefreshCw className="w-3.5 h-3.5" /> New Search
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {data.executive_summary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <p className="text-violet-300 text-xs font-bold uppercase tracking-wider">AI Executive Summary</p>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">{data.executive_summary}</p>
        </div>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <Section title="Education" icon={GraduationCap} color="text-emerald-400">
          <div className="space-y-2">
            {data.education.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{e}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Career History */}
      {(data.detailed_career_history?.length > 0 || data.career_history?.length > 0) && (
        <Section title="Career Progression" icon={Briefcase} color="text-amber-400">
          {data.career_trajectory && (
            <p className="text-slate-400 text-xs italic border-l-2 border-amber-500/40 pl-3 mb-3">{data.career_trajectory}</p>
          )}
          <div className="space-y-3 relative">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-700/50" />
            {(data.detailed_career_history || data.career_history).map((job, i) => (
              <div key={i} className="pl-7 relative">
                <div className="absolute left-0.5 top-1.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-amber-400/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-white font-semibold text-sm">{job.title || job.role}</p>
                      <p className="text-amber-400/80 text-xs">{job.company}</p>
                    </div>
                    {(job.period || job.dates) && (
                      <span className="text-slate-500 text-[11px] whitespace-nowrap">{job.period || job.dates}</span>
                    )}
                  </div>
                  {(job.impact_summary || job.description) && (
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">{job.impact_summary || job.description}</p>
                  )}
                  {job.key_achievements?.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {job.key_achievements.map((ach, j) => (
                        <p key={j} className="text-slate-500 text-[11px] pl-2 border-l border-cyan-500/30">✓ {ach}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {data.leadership_experience && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-xs font-semibold mb-1">Leadership Profile</p>
              <p className="text-slate-300 text-xs leading-relaxed">{data.leadership_experience}</p>
            </div>
          )}
          {data.industry_transitions?.length > 0 && (
            <div className="mt-2">
              <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Industry Transitions</p>
              <div className="flex flex-wrap gap-1.5">
                {data.industry_transitions.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-800/60 text-slate-300 border border-slate-700/50">→ {t}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Skills */}
      {(data.core_skills?.length > 0 || data.technical_expertise?.length > 0 || data.certifications?.length > 0) && (
        <Section title="Skills & Expertise" icon={Code} color="text-cyan-400">
          {data.core_skills?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Core Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {data.core_skills.map((s, i) => (
                  <Badge key={i} className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-normal">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.technical_expertise?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Technical Expertise</p>
              <div className="flex flex-wrap gap-1.5">
                {data.technical_expertise.map((s, i) => (
                  <Badge key={i} className="bg-violet-500/15 text-violet-300 border-violet-500/30 text-[11px] font-normal">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.soft_skills?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {data.soft_skills.map((s, i) => (
                  <Badge key={i} className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-normal">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.certifications?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Certifications</p>
              <div className="space-y-1">
                {data.certifications.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.languages?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {data.languages.map((l, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-slate-800/50 text-slate-300 border border-slate-700/50">{l}</span>
                ))}
              </div>
            </div>
          )}
          {data.board_memberships?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Board Positions</p>
              <div className="space-y-1">
                {data.board_memberships.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Achievements */}
      {(data.major_accomplishments?.length > 0 || data.awards_recognitions?.length > 0 || data.founder_history?.length > 0) && (
        <Section title="Achievements & Recognition" icon={Award} color="text-amber-400">
          {data.major_accomplishments?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Major Accomplishments</p>
              <div className="space-y-1.5">
                {data.major_accomplishments.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.awards_recognitions?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Awards & Recognition</p>
              <div className="space-y-1.5">
                {data.awards_recognitions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Award className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.founder_history?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Founder History</p>
              <div className="space-y-1.5">
                {data.founder_history.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.notable_projects?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Notable Projects</p>
              <div className="space-y-1.5">
                {data.notable_projects.map((p, i) => (
                  <div key={i} className="p-2 rounded bg-slate-800/50 text-slate-300 text-sm">📌 {p}</div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Public Presence */}
      {(data.speaking_engagements?.length > 0 || data.publications?.length > 0 || data.media_mentions?.length > 0 || data.patents?.length > 0 || data.thought_leadership_areas?.length > 0) && (
        <Section title="Public Presence & Thought Leadership" icon={Globe} color="text-violet-400" defaultOpen={false}>
          {data.thought_leadership_areas?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Thought Leadership Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {data.thought_leadership_areas.map((t, i) => (
                  <Badge key={i} className="bg-violet-500/15 text-violet-300 border-violet-500/30 text-[11px] font-normal">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {data.speaking_engagements?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Speaking Engagements</p>
              <div className="space-y-1">
                {data.speaking_engagements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.publications?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Publications & Articles</p>
              <div className="space-y-1">
                {data.publications.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.media_mentions?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Media Coverage</p>
              <div className="space-y-1">
                {data.media_mentions.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Newspaper className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.patents?.length > 0 && (
            <div>
              <p className="text-slate-400 text-[11px] font-semibold uppercase mb-2">Patents</p>
              <div className="space-y-1">
                {data.patents.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.network_influence && (
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-slate-300 text-sm">
              <p className="text-violet-400 text-xs font-semibold mb-1">Network Influence</p>
              {data.network_influence}
            </div>
          )}
        </Section>
      )}

      {/* GDPR Footer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-600 p-3 rounded-xl border border-slate-800/50">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
        <span>GDPR compliant · Public data only · Session-only storage · Encrypted transmission</span>
      </div>
    </motion.div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PeopleSearch() {
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loadingStage, setLoadingStage] = useState(-1); // -1 = idle, 0-4 = loading stages
  const [candidates, setCandidates] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const loading = loadingStage >= 0;

  const buildFilters = () => [
    companyFilter && `company: ${companyFilter}`,
    locationFilter && `location: ${locationFilter}`,
    industryFilter && `industry: ${industryFilter}`,
  ].filter(Boolean).join(', ');

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoadingStage(0);
    setCandidates([]);
    setProfileData(null);

    const filters = buildFilters();

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional intelligence research assistant. Search the web RIGHT NOW for real professionals named "${searchInput}"${filters ? ` with filters: ${filters}` : ''}.

Search LinkedIn, company websites, news, Crunchbase, and other public sources. Find UP TO 5 DISTINCT real individuals — each must be a genuinely different person with their own career.

For each person provide: full name, exact current job title, exact current company name, city and country, and a unique 1-sentence description to distinguish them.

IMPORTANT: Only include people you can verify exist. Do NOT fabricate people.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            persons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  current_title: { type: "string" },
                  current_company: { type: "string" },
                  location: { type: "string" },
                  short_description: { type: "string" }
                }
              }
            }
          }
        }
      });

      const found = (response?.persons || []).filter(p => p.full_name);

      if (found.length === 0) {
        await deepSearch(searchInput, companyFilter);
      } else if (found.length === 1) {
        await deepSearch(found[0].full_name, found[0].current_company);
      } else {
        setLoadingStage(-1);
        setCandidates(found);
      }
    } catch (err) {
      console.error('Search error:', err);
      setLoadingStage(-1);
    }
  };

  const deepSearch = async (name, company) => {
    setLoadingStage(0);
    setCandidates([]);
    setProfileData(null);

    const context = company ? `${name}, currently at ${company}` : name;

    try {
      setLoadingStage(1);
      const [r1, r2] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web and find verified profile information for "${context}". Find: full name, current job title, current company, city and country location, LinkedIn profile URL (exact URL), professional email address, connections or followers count on LinkedIn. Also write a 3-sentence executive_summary of who this person is professionally. Only use real verified data from public sources — do not guess.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              current_title: { type: "string" },
              current_company: { type: "string" },
              location: { type: "string" },
              linkedin_url: { type: "string" },
              linkedin_profile_image_url: { type: "string" },
              email: { type: "string" },
              connections_count: { type: "string" },
              executive_summary: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for career history and education of "${context}". List all jobs from most recent to oldest: company name, job title, start/end dates (or approximate years), key impact or achievements per role (with metrics if available), team size led if applicable. List all universities and degrees. Estimate total years of professional experience and seniority level (C-Suite/VP/Director/Senior/Mid/Junior). Also describe their overall career trajectory in 1-2 sentences. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              education: { type: "array", items: { type: "string" } },
              detailed_career_history: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    role: { type: "string" },
                    company: { type: "string" },
                    period: { type: "string" },
                    dates: { type: "string" },
                    impact_summary: { type: "string" },
                    key_achievements: { type: "array", items: { type: "string" } },
                    teams_led: { type: "string" }
                  }
                }
              },
              total_experience_years: { type: "number" },
              estimated_seniority: { type: "string" },
              career_trajectory: { type: "string" },
              leadership_experience: { type: "string" },
              industry_transitions: { type: "array", items: { type: "string" } }
            }
          }
        })
      ]);

      setLoadingStage(2);
      const [r3, r4] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for skills, expertise and professional credentials of "${context}". Find: technical skills (programming languages, tools, platforms), domain expertise areas, soft skills they are known for, professional certifications (with issuing body), board memberships (company name and role), languages spoken, patents filed. Use only real verified public data from LinkedIn, company sites, or news.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              core_skills: { type: "array", items: { type: "string" } },
              technical_expertise: { type: "array", items: { type: "string" } },
              soft_skills: { type: "array", items: { type: "string" } },
              certifications: { type: "array", items: { type: "string" } },
              board_memberships: { type: "array", items: { type: "string" } },
              languages: { type: "array", items: { type: "string" } },
              patents: { type: "array", items: { type: "string" } }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for achievements, public presence and thought leadership of "${context}". Find: major career accomplishments with measurable outcomes (revenue generated, teams scaled, products launched, etc.), industry awards and recognitions received, companies or products they founded, notable projects they led, conference speaking engagements, books or articles published, media mentions and press coverage, social media presence (Twitter/X handle, GitHub username, follower counts), areas they are considered a thought leader in, and their overall network influence. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              major_accomplishments: { type: "array", items: { type: "string" } },
              awards_recognitions: { type: "array", items: { type: "string" } },
              founder_history: { type: "array", items: { type: "string" } },
              notable_projects: { type: "array", items: { type: "string" } },
              speaking_engagements: { type: "array", items: { type: "string" } },
              publications: { type: "array", items: { type: "string" } },
              media_mentions: { type: "array", items: { type: "string" } },
              social_media_presence: { type: "object", additionalProperties: true },
              thought_leadership_areas: { type: "array", items: { type: "string" } },
              network_influence: { type: "string" },
              industry_impact: { type: "string" }
            }
          }
        })
      ]);

      setLoadingStage(4);

      const merged = {
        ...(r1 || {}),
        ...(r2 || {}),
        ...(r3 || {}),
        ...(r4 || {}),
        searched_for: name
      };

      setProfileData(merged);
    } catch (err) {
      console.error('Deep search error:', err);
    } finally {
      setLoadingStage(-1);
    }
  };

  if (!gdprAccepted) {
    return <GDPRConsent onAccept={() => setGdprAccepted(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/40">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">People Intelligence</h1>
            <p className="text-slate-400 text-xs">Deep professional profile analysis powered by AI · GDPR Compliant</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Search */}
        {!profileData && candidates.length === 0 && !loading && (
          <div className="mb-8">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, e.g. 'Satya Nadella' or 'CEO Microsoft'..."
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border-2 border-slate-700/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors text-sm"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchInput.trim()}
                className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 px-6 rounded-xl font-semibold"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                {showFilters ? 'Hide filters' : 'Add filters'}
                {(companyFilter || locationFilter || industryFilter) && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                    {[companyFilter, locationFilter, industryFilter].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 overflow-hidden"
                >
                  {[
                    { value: companyFilter, onChange: setCompanyFilter, placeholder: '🏢 Company' },
                    { value: locationFilter, onChange: setLocationFilter, placeholder: '📍 Location / country' },
                    { value: industryFilter, onChange: setIndustryFilter, placeholder: '🏭 Industry / field' },
                  ].map((f, i) => (
                    <input
                      key={i}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      placeholder={f.placeholder}
                      className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm transition-colors"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            <div className="mt-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-cyan-400/60" />
              </div>
              <p className="text-slate-400 font-medium mb-1">Search any professional</p>
              <p className="text-slate-600 text-sm">Get a comprehensive profile with career history, skills, achievements, and public presence</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {['Elon Musk', 'Jensen Huang', 'Sam Altman', 'Sundar Pichai'].map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSearchInput(name); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-400 text-xs border border-slate-700/50 hover:border-cyan-500/30 hover:text-slate-200 transition-all"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingState stage={loadingStage} />}

        {/* Candidate picker */}
        {!loading && candidates.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-sm">"{searchInput}"</span>
              </div>
              <button onClick={() => { setCandidates([]); }} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            <CandidatePicker candidates={candidates} query={searchInput} onSelect={(c) => deepSearch(c.full_name, c.current_company)} />
          </>
        )}

        {/* Profile report */}
        {!loading && profileData && (
          <ProfileReport data={profileData} onReset={() => { setProfileData(null); setSearchInput(''); }} />
        )}
      </div>
    </div>
  );
}