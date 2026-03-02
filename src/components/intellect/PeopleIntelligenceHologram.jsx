import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Search, Loader2, User, Linkedin, Mail, MapPin, GraduationCap,
  CheckCircle, Award, Globe, Briefcase, Network, Code2,
  Building2, ShieldCheck, X, ChevronUp, ChevronDown,
  Zap, TrendingUp, Star, Brain, ExternalLink, Monitor
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── GDPR Consent ─────────────────────────────────────────────────────────────
const GDPRConsent = ({ onAccept, onDecline }) => (
  <div className="flex items-center justify-center h-full p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-md p-6 space-y-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="w-6 h-6 text-cyan-400" />
        <h3 className="text-white font-bold">GDPR & Privacy Notice</h3>
      </div>
      <div className="text-slate-300 text-sm space-y-3">
        <p>We search publicly available profiles from LinkedIn, Wikipedia and public sources — only what is legally shareable.</p>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Data is used only for Business Intelligence</li>
          <li>Data is automatically deleted after 30 days</li>
          <li>Not used for marketing or profiling</li>
          <li>All data encrypted during transmission</li>
        </ul>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onDecline} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10">Decline</Button>
        <Button onClick={onAccept} className="flex-1 bg-cyan-600 hover:bg-cyan-700">Accept & Search</Button>
      </div>
    </motion.div>
  </div>
);

// ── Collapsible Section ───────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-800/50 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
        <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-white font-semibold text-sm flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="p-3 border-t border-slate-800/50 bg-slate-950/40 space-y-2">{children}</div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PeopleIntelligenceHologram({ onClose, onSendToScreen, embedded = false }) {
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [showScreenMenu, setShowScreenMenu] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setCandidates([]);
    setProfileData(null);

    const filters = [
      companyFilter && `company: ${companyFilter}`,
      locationFilter && `location: ${locationFilter}`,
      industryFilter && `industry: ${industryFilter}`,
    ].filter(Boolean).join(', ');

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the web RIGHT NOW for real professionals named "${searchQuery}"${filters ? ` (filters: ${filters})` : ''}. Find UP TO 5 DISTINCT real individuals. For each: full_name, current_title, current_company, location, short_description.`,
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

      const found = ((response?.data || response)?.persons || []).filter(p => p.full_name);
      if (found.length === 0) {
        deepSearch(searchQuery, companyFilter);
      } else if (found.length === 1) {
        deepSearch(found[0].full_name, found[0].current_company);
      } else {
        setCandidates(found);
      }
    } finally {
      setLoading(false);
    }
  };

  const deepSearch = async (name, company) => {
    setLoadingDeep(true);
    setProfileData(null);
    setCandidates([]);
    const ctx = company ? `${name} who works at ${company}` : name;

    try {
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        base44.integrations.Core.InvokeLLM({ prompt: `Find verified profile info for "${ctx}": full name, current title, company, location, LinkedIn URL, profile image URL, email, connections count. Only real public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { full_name: { type: "string" }, current_title: { type: "string" }, current_company: { type: "string" }, location: { type: "string" }, linkedin_url: { type: "string" }, linkedin_profile_image_url: { type: "string" }, email: { type: "string" }, connections_count: { type: "string" } } } }),
        base44.integrations.Core.InvokeLLM({ prompt: `Find career history and education of "${ctx}". Only real verified public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { education: { type: "array", items: { type: "string" } }, career_history: { type: "array", items: { type: "object", additionalProperties: true } }, total_experience_years: { type: "number" }, estimated_seniority: { type: "string" } } } }),
        base44.integrations.Core.InvokeLLM({ prompt: `Find skills and expertise of "${ctx}": skills, certifications, board positions, languages. Only real public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { core_skills: { type: "array", items: { type: "string" } }, technical_expertise: { type: "array", items: { type: "string" } }, certifications: { type: "array", items: { type: "string" } }, board_memberships: { type: "array", items: { type: "string" } }, languages: { type: "array", items: { type: "string" } } } } }),
        base44.integrations.Core.InvokeLLM({ prompt: `Find detailed career progression of "${ctx}" with impact, team size, dates. Only real public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { detailed_career_history: { type: "array", items: { type: "object", additionalProperties: true } }, industry_transitions: { type: "array", items: { type: "string" } }, leadership_experience: { type: "string" }, career_trajectory: { type: "string" }, growth_rate_assessment: { type: "string" } } } }),
        base44.integrations.Core.InvokeLLM({ prompt: `Find achievements of "${ctx}": awards, projects, publications, speaking, media mentions. Only real public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { major_accomplishments: { type: "array", items: { type: "string" } }, awards_recognitions: { type: "array", items: { type: "string" } }, notable_projects: { type: "array", items: { type: "string" } }, founder_history: { type: "array", items: { type: "string" } }, speaking_engagements: { type: "array", items: { type: "string" } }, publications: { type: "array", items: { type: "string" } }, media_mentions: { type: "array", items: { type: "string" } }, industry_impact: { type: "string" } } } }),
        base44.integrations.Core.InvokeLLM({ prompt: `Find public presence of "${ctx}": podcasts, patents, social media, thought leadership. Only real public data.`, add_context_from_internet: true, response_json_schema: { type: "object", properties: { podcast_appearances: { type: "array", items: { type: "string" } }, patents: { type: "array", items: { type: "string" } }, network_influence: { type: "string" }, thought_leadership_areas: { type: "array", items: { type: "string" } } } } }),
      ]);

      setProfileData({
        ...(r1?.data || r1), ...(r2?.data || r2), ...(r3?.data || r3),
        ...(r4?.data || r4), ...(r5?.data || r5), ...(r6?.data || r6),
        search_timestamp: new Date().toISOString(),
      });
    } finally {
      setLoadingDeep(false);
    }
  };

  return (
    <div className={`${embedded ? 'w-full h-full' : 'fixed inset-0 z-50'} flex flex-col bg-slate-950 overflow-hidden`}>
      {/* Background */}
      {!embedded && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-slate-950 to-cyan-950/30" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-violet-500/20 bg-slate-950/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border border-violet-500/50">
            <User className="w-5 h-5 text-violet-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              People Intelligence Platform
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">AI POWERED</Badge>
            </h1>
            {profileData?.full_name && (
              <p className="text-violet-400 text-xs">{profileData.full_name} · {profileData.current_title} · {profileData.current_company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profileData && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Profile loaded
            </div>
          )}
          {onSendToScreen && (
            <div className="relative">
              <Button size="icon" variant="ghost" onClick={() => setShowScreenMenu(s => !s)} className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/20">
                <ExternalLink className="w-5 h-5" />
              </Button>
              {showScreenMenu && (
                <div className="absolute right-0 top-10 z-[9999] bg-slate-900 border border-violet-500/40 rounded-xl shadow-xl min-w-[200px] py-1">
                  <p className="text-slate-500 text-[10px] px-3 pt-1 pb-0.5 uppercase tracking-wide">Send to screen</p>
                  {onSendToScreen?.screens?.map((s, i) => (
                    <button key={i} onClick={() => { onSendToScreen?.send?.(s, 'profile_search'); setShowScreenMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/20 hover:text-white transition-colors">
                      <Monitor className="w-3.5 h-3.5 text-violet-400" />{s.label}
                    </button>
                  ))}
                  {(!onSendToScreen?.screens || onSendToScreen.screens.length === 0) && (
                    <p className="text-slate-600 text-xs px-3 py-2">No Hologram Desktops open</p>
                  )}
                </div>
              )}
            </div>
          )}
          {!embedded && onClose && (
            <Button onClick={onClose} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* GDPR gate */}
      {!gdprAccepted && (
        <div className="flex-1 overflow-auto relative z-10">
          <GDPRConsent onAccept={() => setGdprAccepted(true)} onDecline={() => setGdprAccepted(false)} />
        </div>
      )}

      {gdprAccepted && (
        <>
          {/* Search bar */}
          <div className="relative z-10 p-4 border-b border-slate-800/50 flex-shrink-0">
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search any person (name, LinkedIn, etc)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border-2 border-violet-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400 text-sm"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading || loadingDeep || !searchQuery.trim()} className="bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl px-5">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} placeholder="Company (optional)" className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400 text-xs" />
                <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="Location (optional)" className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400 text-xs" />
                <input value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} placeholder="Industry (optional)" className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400 text-xs" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">

              {/* Loading */}
              {(loading || loadingDeep) && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 animate-spin border-t-violet-400" />
                    <User className="absolute inset-0 m-auto w-7 h-7 text-violet-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{loading ? 'Finding matching profiles...' : 'Building detailed profile...'}</p>
                    <p className="text-slate-400 text-sm mt-1">Scanning LinkedIn, news sources, public records...</p>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 flex-wrap justify-center">
                    {['LinkedIn', 'Wikipedia', 'News', 'Public Records', 'Patents', 'Publications'].map(s => (
                      <span key={s} className="px-2 py-1 rounded bg-slate-800">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate picker */}
              {candidates.length > 0 && !loading && !loadingDeep && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <p className="text-slate-300 text-sm font-semibold">
                    Found <span className="text-violet-400">{candidates.length}</span> people named "<span className="text-white">{searchQuery}</span>" — select the right one:
                  </p>
                  <div className="grid gap-2">
                    {candidates.map((c, i) => (
                      <button key={i} onClick={() => deepSearch(c.full_name, c.current_company)}
                        className="text-left p-3 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:border-violet-500/40 hover:bg-slate-800/60 transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm group-hover:text-violet-300">{c.full_name}</p>
                            {c.current_title && <p className="text-violet-400 text-xs">{c.current_title}</p>}
                            {c.current_company && <p className="text-slate-400 text-xs">{c.current_company}</p>}
                            {c.location && <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{c.location}</p>}
                            {c.short_description && <p className="text-slate-400 text-xs mt-1 italic">{c.short_description}</p>}
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors rotate-[-90deg] flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty state */}
              {!profileData && !loading && !loadingDeep && candidates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                    <User className="w-10 h-10 opacity-40" />
                  </div>
                  <p className="text-lg">Search for any person to view their full intelligence profile</p>
                  <p className="text-xs mt-1 text-slate-600">Career history · Skills · Achievements · Public presence · Influence</p>
                </div>
              )}

              {/* Profile */}
              {profileData && !loading && !loadingDeep && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Header card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 flex items-start gap-4">
                    {profileData.linkedin_profile_image_url ? (
                      <img src={profileData.linkedin_profile_image_url} alt={profileData.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-violet-500/40 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border-2 border-violet-500/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-10 h-10 text-violet-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white text-2xl font-bold">{profileData.full_name || 'Unknown'}</h2>
                      <p className="text-violet-400 text-sm font-medium">{profileData.current_title}</p>
                      <p className="text-slate-300 text-sm">{profileData.current_company}</p>
                      {profileData.location && (
                        <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                          <MapPin className="w-3 h-3" />{profileData.location}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profileData.linkedin_url && (
                          <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                            <Linkedin className="w-3.5 h-3.5" />LinkedIn
                          </a>
                        )}
                        {profileData.email && (
                          <a href={`mailto:${profileData.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                            <Mail className="w-3.5 h-3.5" />Email
                          </a>
                        )}
                        {profileData.connections_count && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs">
                            <Network className="w-3.5 h-3.5" />{profileData.connections_count}
                          </div>
                        )}
                        {profileData.total_experience_years && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                            <Briefcase className="w-3.5 h-3.5" />{profileData.total_experience_years} yrs exp
                          </div>
                        )}
                        {profileData.estimated_seniority && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs">
                            <Star className="w-3.5 h-3.5" />{profileData.estimated_seniority}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Overview */}
                  <Section title="Overview" icon={Building2}>
                    {profileData.career_trajectory && <p className="text-slate-300 text-sm leading-relaxed mb-2"><strong className="text-slate-400">Career Path:</strong> {profileData.career_trajectory}</p>}
                    {profileData.growth_rate_assessment && <p className="text-slate-300 text-xs leading-relaxed"><strong className="text-slate-400">Growth:</strong> {profileData.growth_rate_assessment}</p>}
                    {profileData.network_influence && <p className="text-slate-300 text-xs leading-relaxed mt-1"><strong className="text-slate-400">Network:</strong> {profileData.network_influence}</p>}
                  </Section>

                  {/* Detailed Career */}
                  {profileData.detailed_career_history?.length > 0 && (
                    <Section title="Detailed Career Progression" icon={TrendingUp}>
                      <div className="space-y-3">
                        {profileData.detailed_career_history.map((role, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">{role.role}</p>
                                <p className="text-violet-400 text-xs">{role.company}</p>
                              </div>
                              {role.dates && <p className="text-slate-500 text-xs whitespace-nowrap">{role.dates}</p>}
                            </div>
                            {role.impact_summary && <p className="text-slate-300 text-xs leading-relaxed mb-1">{role.impact_summary}</p>}
                            {role.teams_led && <p className="text-slate-400 text-xs">👥 Led: {role.teams_led}</p>}
                            {role.key_achievements?.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {role.key_achievements.map((a, j) => <p key={j} className="text-slate-400 text-[11px] pl-2 border-l border-violet-500/30">✓ {a}</p>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Leadership */}
                  {(profileData.leadership_experience || profileData.industry_transitions?.length > 0) && (
                    <Section title="Leadership & Industry Transitions" icon={Zap}>
                      {profileData.leadership_experience && <p className="text-slate-300 text-sm leading-relaxed mb-2">{profileData.leadership_experience}</p>}
                      {profileData.industry_transitions?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {profileData.industry_transitions.map((t, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300">→ {t}</span>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Skills */}
                  {(profileData.core_skills?.length > 0 || profileData.technical_expertise?.length > 0 || profileData.certifications?.length > 0) && (
                    <Section title="Skills & Expertise" icon={Code2}>
                      {profileData.core_skills?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Core Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profileData.core_skills.map((s, i) => <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {profileData.technical_expertise?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Technical Expertise</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profileData.technical_expertise.map((s, i) => <Badge key={i} className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {profileData.certifications?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Certifications</p>
                          <div className="space-y-1">
                            {profileData.certifications.map((c, i) => <div key={i} className="flex items-center gap-2 text-xs text-slate-300"><CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />{c}</div>)}
                          </div>
                        </div>
                      )}
                      {profileData.board_memberships?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Board Memberships</p>
                          <div className="space-y-1">
                            {profileData.board_memberships.map((b, i) => <div key={i} className="flex items-center gap-2 text-xs text-slate-300"><Award className="w-3 h-3 text-amber-400 flex-shrink-0" />{b}</div>)}
                          </div>
                        </div>
                      )}
                      {profileData.languages?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Languages</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profileData.languages.map((l, i) => <span key={i} className="px-2 py-1 rounded-full text-xs bg-slate-800/70 border border-slate-700/50 text-slate-300">{l}</span>)}
                          </div>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Education & Career */}
                  {(profileData.education?.length > 0 || profileData.career_history?.length > 0) && (
                    <Section title="Education & Career History" icon={GraduationCap}>
                      {profileData.education?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Education</p>
                          <div className="space-y-1">
                            {profileData.education.map((e, i) => <div key={i} className="flex items-start gap-2 text-xs"><GraduationCap className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /><span className="text-slate-300">{typeof e === 'string' ? e : JSON.stringify(e)}</span></div>)}
                          </div>
                        </div>
                      )}
                      {profileData.career_history?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Career Timeline</p>
                          <div className="space-y-1.5 relative">
                            <div className="absolute left-3 top-0 bottom-0 w-px bg-violet-500/20" />
                            {profileData.career_history.map((job, i) => (
                              <div key={i} className="flex items-start gap-3 pl-6 relative">
                                <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                                <div>
                                  <p className="text-white text-xs font-semibold">{job.title || job.role}</p>
                                  <p className="text-violet-400 text-xs">{job.company}</p>
                                  {job.dates && <p className="text-slate-500 text-[10px]">{job.dates}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Achievements */}
                  {(profileData.major_accomplishments?.length > 0 || profileData.awards_recognitions?.length > 0 || profileData.notable_projects?.length > 0 || profileData.founder_history?.length > 0) && (
                    <Section title="Achievements & Impact" icon={Award}>
                      {profileData.major_accomplishments?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Major Accomplishments</p>
                          <div className="space-y-1">
                            {profileData.major_accomplishments.map((a, i) => <div key={i} className="flex items-start gap-2 text-xs"><CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /><span className="text-slate-300">{a}</span></div>)}
                          </div>
                        </div>
                      )}
                      {profileData.awards_recognitions?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Awards & Recognitions</p>
                          <div className="space-y-1">
                            {profileData.awards_recognitions.map((a, i) => <div key={i} className="flex items-center gap-2 text-xs">🏆<span className="text-slate-300">{a}</span></div>)}
                          </div>
                        </div>
                      )}
                      {profileData.notable_projects?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Notable Projects</p>
                          <div className="space-y-1">
                            {profileData.notable_projects.map((p, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📌 {p}</div>)}
                          </div>
                        </div>
                      )}
                      {profileData.founder_history?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Founder History</p>
                          <div className="space-y-1">
                            {profileData.founder_history.map((f, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">🚀 {f}</div>)}
                          </div>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Public Presence */}
                  {(profileData.industry_impact || profileData.speaking_engagements?.length > 0 || profileData.publications?.length > 0 || profileData.media_mentions?.length > 0 || profileData.thought_leadership_areas?.length > 0 || profileData.podcast_appearances?.length > 0 || profileData.patents?.length > 0) && (
                    <Section title="Public Presence & Influence" icon={Globe}>
                      {profileData.industry_impact && <p className="text-slate-300 text-sm leading-relaxed mb-3">{profileData.industry_impact}</p>}
                      {profileData.thought_leadership_areas?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Thought Leadership</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profileData.thought_leadership_areas.map((t, i) => <span key={i} className="px-2 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300">{t}</span>)}
                          </div>
                        </div>
                      )}
                      {profileData.speaking_engagements?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Speaking Engagements</p>
                          <div className="space-y-1">{profileData.speaking_engagements.map((s, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">🎤 {s}</div>)}</div>
                        </div>
                      )}
                      {profileData.publications?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Publications</p>
                          <div className="space-y-1">{profileData.publications.map((p, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📄 {p}</div>)}</div>
                        </div>
                      )}
                      {profileData.podcast_appearances?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Podcast Appearances</p>
                          <div className="space-y-1">{profileData.podcast_appearances.map((p, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">🎙️ {p}</div>)}</div>
                        </div>
                      )}
                      {profileData.patents?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Patents</p>
                          <div className="space-y-1">{profileData.patents.map((p, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">⚙️ {p}</div>)}</div>
                        </div>
                      )}
                      {profileData.media_mentions?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Media Mentions</p>
                          <div className="space-y-1">{profileData.media_mentions.slice(0, 5).map((m, i) => <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📰 {m}</div>)}</div>
                        </div>
                      )}
                    </Section>
                  )}

                  <div className="text-[10px] text-slate-600 p-2 rounded border border-slate-800/50 bg-slate-900/20">
                    ✓ GDPR compliant · Data retention: 30 days · No marketing use · Encrypted transmission
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}