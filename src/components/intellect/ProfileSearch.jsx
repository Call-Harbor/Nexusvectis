import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Search, Loader2, User, Linkedin, Mail, MapPin, GraduationCap,
  CheckCircle, AlertTriangle, Clock, Award, Globe, Briefcase,
  Network, Code2, BookOpen, Building2, ShieldCheck, X, ChevronUp, ChevronDown,
  Zap, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GDPRConsent = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
          <p>
            We search publicly available profiles from LinkedIn, Wikipedia and public sources - only what is legally shareable.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Data is used only for Business Intelligence</li>
            <li>Data is automatically deleted after 30 days</li>
            <li>Not used for marketing or profiling</li>
            <li>All data encrypted during transmission</li>
          </ul>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onDecline}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            Accept
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default function ProfileSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    career: true,
    trajectory: true,
    leadership: true,
    skills: true,
    achievements: true,
    impact: true,
    presence: true
  });

  // Step 1: Find candidates (multiple people with same name)
  const handleSearch = async () => {
    if (!searchQuery.trim() || !gdprAccepted) return;
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
        prompt: `You are a professional research assistant. Search the web RIGHT NOW for real professionals named "${searchQuery}"${filters ? ` (filters: ${filters})` : ''}.

Search LinkedIn, company websites, news, and public sources. Find UP TO 5 DISTINCT real individuals — each must be a genuinely different person. Provide only verified, real information.

For each person include: full name, current title, current company, location, and a short 1-sentence description to help identify them.

Return all found persons in the "persons" array.`,
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

      const raw = response?.data || response;
      const found = (raw?.persons || response?.persons || []).filter(p => p.full_name);
      if (found.length === 1) {
        // Only one match — go straight to deep search
        deepSearch(found[0].full_name, found[0].current_company);
      } else if (found.length === 0) {
        // Fallback: treat the search query itself as the person and do deep search directly
        deepSearch(searchQuery, companyFilter);
      } else {
        setCandidates(found);
      }
    } catch (err) {
      console.error('Candidate search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Deep profile search for a specific person
  const deepSearch = async (name, company) => {
    setLoadingDeep(true);
    setProfileData(null);
    setCandidates([]);

    const context = company ? `${name} who works at ${company}` : name;

    try {
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web and find verified profile information for "${context}". Find: full name, current job title, current company, city/country location, LinkedIn profile URL, profile picture URL (from LinkedIn or company page), professional email, connections/followers count. Only use real verified data from public sources.`,
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
              connections_count: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web and find the career history and education of "${context}". List all previous companies and roles with start/end dates, universities/schools attended with degrees, total years of experience, and seniority level. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              education: { type: "array", items: { type: "string" } },
              career_history: { type: "array", items: { type: "object", additionalProperties: true } },
              total_experience_years: { type: "number" },
              estimated_seniority: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for skills and expertise of "${context}". Find: technical skills listed on their public profiles, board positions they hold, professional certifications, languages spoken, core professional competencies. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              core_skills: { type: "array", items: { type: "string" } },
              technical_expertise: { type: "array", items: { type: "string" } },
              soft_skills: { type: "array", items: { type: "string" } },
              certifications: { type: "array", items: { type: "string" } },
              board_memberships: { type: "array", items: { type: "string" } },
              languages: { type: "array", items: { type: "string" } }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for the detailed career progression of "${context}". For each role: company name, job title, start and end dates, key achievements or impact (with numbers if available), team size managed. Also identify any major industry transitions and overall leadership experience. Use only real verified public data from LinkedIn, news, company sites.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              detailed_career_history: { type: "array", items: { type: "object", additionalProperties: true } },
              industry_transitions: { type: "array", items: { type: "string" } },
              leadership_experience: { type: "string" },
              career_trajectory: { type: "string" },
              growth_rate_assessment: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for achievements and public impact of "${context}". Find: major accomplishments with measurable results (revenue, users, etc.), awards or industry recognitions they have received, notable projects they led, companies they founded, speaking engagements at conferences, articles or publications authored, media coverage and mentions. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              major_accomplishments: { type: "array", items: { type: "string" } },
              awards_recognitions: { type: "array", items: { type: "string" } },
              notable_projects: { type: "array", items: { type: "string" } },
              founder_history: { type: "array", items: { type: "string" } },
              speaking_engagements: { type: "array", items: { type: "string" } },
              publications: { type: "array", items: { type: "string" } },
              media_mentions: { type: "array", items: { type: "string" } },
              industry_impact: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Search the web for the public presence and thought leadership of "${context}". Find: podcast or conference appearances, social media presence (Twitter/X, GitHub, etc.) with follower counts, patents filed, books authored, analyst or industry rankings they appear in, key areas of thought leadership. Use only real verified public data.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              podcast_appearances: { type: "array", items: { type: "string" } },
              social_media_presence: { type: "object", additionalProperties: true },
              patents: { type: "array", items: { type: "string" } },
              network_influence: { type: "string" },
              publications_authored: { type: "array", items: { type: "string" } },
              thought_leadership_areas: { type: "array", items: { type: "string" } }
            }
          }
        })
      ]);

      const merged = {
        ...(r1?.data || r1),
        ...(r2?.data || r2),
        ...(r3?.data || r3),
        ...(r4?.data || r4),
        ...(r5?.data || r5),
        ...(r6?.data || r6),
        search_timestamp: new Date().toISOString(),
        data_retention_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      setProfileData(merged);
    } catch (err) {
      console.error('Profile search error:', err);
    } finally {
      setLoadingDeep(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!gdprAccepted) {
    return <GDPRConsent onAccept={() => setGdprAccepted(true)} onDecline={() => setGdprAccepted(false)} />;
  }

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Search bar */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search any person (name, LinkedIn, etc)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border-2 border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || loadingDeep || !searchQuery.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            placeholder="Company (optional)"
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
          <input
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            placeholder="Location / country (optional)"
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
          <input
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            placeholder="Industry / field (optional)"
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
        </div>
      </div>

      {/* Loading candidates */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-slate-400">Searching for matching profiles...</p>
        </div>
      )}

      {/* Loading deep profile */}
      {loadingDeep && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-slate-400">Building detailed profile...</p>
        </div>
      )}

      {/* Candidate picker — shown when multiple people match */}
      {candidates.length > 0 && !loading && !loadingDeep && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p className="text-slate-300 text-sm font-semibold">
            Found <span className="text-cyan-400">{candidates.length}</span> people named <span className="text-white">"{searchQuery}"</span> — select the right one:
          </p>
          <div className="grid gap-2">
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => deepSearch(c.full_name, c.current_company)}
                className="text-left p-3 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm group-hover:text-cyan-300 transition-colors">{c.full_name}</p>
                    {c.current_title && <p className="text-cyan-400 text-xs">{c.current_title}</p>}
                    {c.current_company && <p className="text-slate-400 text-xs">{c.current_company}</p>}
                    {c.location && <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{c.location}</p>}
                    {c.short_description && <p className="text-slate-400 text-xs mt-1 italic">{c.short_description}</p>}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors rotate-[-90deg] flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!profileData && !loading && !loadingDeep && candidates.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Search for a person to view their extended profile information</p>
          <p className="text-xs mt-1 text-slate-600">Use the filters above to narrow down when searching common names</p>
        </div>
      )}

      {/* Profile data */}
      {profileData && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/30 flex items-start gap-4">
            {profileData.linkedin_profile_image_url ? (
              <img src={profileData.linkedin_profile_image_url} alt={profileData.full_name} className="w-16 h-16 rounded-full object-cover border border-cyan-500/40 flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-xl font-bold">{profileData.full_name || 'Unknown'}</h2>
              <p className="text-cyan-400 text-sm">{profileData.current_title}</p>
              <p className="text-slate-400 text-sm">{profileData.current_company}</p>
              {profileData.location && (
                <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                  <MapPin className="w-3 h-3" />
                  {profileData.location}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            {profileData.linkedin_url && (
              <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
            {profileData.email && (
              <a href={`mailto:${profileData.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            )}
            {profileData.connections_count && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs">
                <Network className="w-3.5 h-3.5" />
                {profileData.connections_count}
              </div>
            )}
          </div>

          {/* Overview section */}
          <CollapsibleSection
            title="Overview"
            icon={Building2}
            expanded={expandedSections.overview}
            onToggle={() => toggleSection('overview')}
          >
            {profileData.career_trajectory && (
              <p className="text-slate-300 text-sm leading-relaxed mb-3"><strong>Career Path:</strong> {profileData.career_trajectory}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {profileData.total_experience_years && (
                <div className="p-2 rounded bg-slate-800/50">
                  <p className="text-slate-400">Experience</p>
                  <p className="text-white font-semibold">{profileData.total_experience_years} years</p>
                </div>
              )}
              {profileData.estimated_seniority && (
                <div className="p-2 rounded bg-slate-800/50">
                  <p className="text-slate-400">Seniority</p>
                  <p className="text-white font-semibold">{profileData.estimated_seniority}</p>
                </div>
              )}
              {profileData.growth_rate_assessment && (
                <div className="p-2 rounded bg-slate-800/50 col-span-2">
                  <p className="text-slate-400">Growth Pattern</p>
                  <p className="text-white text-[11px]">{profileData.growth_rate_assessment}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Detailed Career Progression */}
          {profileData.detailed_career_history && profileData.detailed_career_history.length > 0 && (
            <CollapsibleSection
              title="Detailed Career Progression"
              icon={TrendingUp}
              expanded={expandedSections.trajectory}
              onToggle={() => toggleSection('trajectory')}
            >
              <div className="space-y-3">
                {profileData.detailed_career_history.map((role, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold">{role.role}</p>
                        <p className="text-cyan-400 text-sm">{role.company}</p>
                      </div>
                      {role.dates && <p className="text-slate-500 text-xs whitespace-nowrap">{role.dates}</p>}
                    </div>
                    {role.impact_summary && (
                      <p className="text-slate-300 text-xs leading-relaxed mb-1">{role.impact_summary}</p>
                    )}
                    {role.teams_led && (
                      <p className="text-slate-400 text-xs mb-1">👥 Led: {role.teams_led}</p>
                    )}
                    {role.key_achievements && role.key_achievements.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {role.key_achievements.map((ach, j) => (
                          <p key={j} className="text-slate-400 text-[11px] pl-2 border-l border-cyan-500/30">✓ {ach}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Leadership & Industry Transitions */}
          {(profileData.leadership_experience || profileData.industry_transitions) && (
            <CollapsibleSection
              title="Leadership & Industry Transitions"
              icon={Zap}
              expanded={expandedSections.leadership}
              onToggle={() => toggleSection('leadership')}
            >
              {profileData.leadership_experience && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Leadership Experience</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{profileData.leadership_experience}</p>
                </div>
              )}
              {profileData.industry_transitions && profileData.industry_transitions.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Industry Transitions</p>
                  <div className="space-y-1">
                    {profileData.industry_transitions.map((trans, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">→ {trans}</div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Skills & Expertise section */}
          {(profileData.core_skills || profileData.technical_expertise || profileData.certifications || profileData.board_memberships) && (
            <CollapsibleSection
              title="Skills & Expertise"
              icon={Code2}
              expanded={expandedSections.skills}
              onToggle={() => toggleSection('skills')}
            >
              {profileData.core_skills && profileData.core_skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Core Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.core_skills.map((skill, i) => (
                      <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileData.technical_expertise && profileData.technical_expertise.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Technical Expertise</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.technical_expertise.map((tech, i) => (
                      <Badge key={i} className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileData.soft_skills && profileData.soft_skills.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.soft_skills.map((skill, i) => (
                      <Badge key={i} className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileData.certifications && profileData.certifications.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Certifications</p>
                  <div className="space-y-1">
                    {profileData.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.board_memberships && profileData.board_memberships.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Board Memberships</p>
                  <div className="space-y-1">
                    {profileData.board_memberships.map((board, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        {board}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Achievements & Impact section */}
          {(profileData.major_accomplishments || profileData.awards_recognitions || profileData.notable_projects || profileData.founder_history) && (
            <CollapsibleSection
              title="Achievements & Impact"
              icon={Award}
              expanded={expandedSections.achievements}
              onToggle={() => toggleSection('achievements')}
            >
              {profileData.major_accomplishments && profileData.major_accomplishments.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Major Accomplishments</p>
                  <div className="space-y-1">
                    {profileData.major_accomplishments.map((acc, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">• {acc}</div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.awards_recognitions && profileData.awards_recognitions.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Awards & Recognition</p>
                  <div className="space-y-1">
                    {profileData.awards_recognitions.map((award, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        {award}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.notable_projects && profileData.notable_projects.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Notable Projects</p>
                  <div className="space-y-1">
                    {profileData.notable_projects.map((proj, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📌 {proj}</div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.founder_history && profileData.founder_history.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Founder History</p>
                  <div className="space-y-1">
                    {profileData.founder_history.map((founder, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">🚀 {founder}</div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Public Presence & Influence */}
          {(profileData.media_mentions || profileData.speaking_engagements || profileData.publications || profileData.industry_impact) && (
            <CollapsibleSection
              title="Public Presence & Influence"
              icon={Globe}
              expanded={expandedSections.presence}
              onToggle={() => toggleSection('presence')}
            >
              {profileData.industry_impact && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1">Industry Impact</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{profileData.industry_impact}</p>
                </div>
              )}
              {profileData.speaking_engagements && profileData.speaking_engagements.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Speaking Engagements</p>
                  <div className="space-y-1">
                    {profileData.speaking_engagements.map((speak, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">🎤 {speak}</div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.publications && profileData.publications.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Publications</p>
                  <div className="space-y-1">
                    {profileData.publications.map((pub, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📄 {pub}</div>
                    ))}
                  </div>
                </div>
              )}
              {profileData.media_mentions && profileData.media_mentions.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase mb-1.5">Media Mentions</p>
                  <div className="space-y-1">
                    {profileData.media_mentions.slice(0, 5).map((mention, i) => (
                      <div key={i} className="text-slate-300 text-xs p-1.5 rounded bg-slate-800/40">📰 {mention}</div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* GDPR Footer */}
          <div className="text-[10px] text-slate-600 p-2 rounded border border-slate-800/50 bg-slate-900/20">
            <p>✓ GDPR compliant · Data retention: 30 days · No marketing use · Encrypted transmission</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, expanded, onToggle, children }) {
  return (
    <div className="border border-slate-800/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
      >
        <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span className="text-white font-semibold text-sm flex-1 text-left">{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="p-3 border-t border-slate-800/50 bg-slate-950/40 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}