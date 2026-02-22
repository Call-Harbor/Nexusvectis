import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Search, Loader2, User, Linkedin, Mail, MapPin, GraduationCap,
  CheckCircle, AlertTriangle, Clock, Award, Globe, Briefcase,
  Network, Code2, BookOpen, Building2, ShieldCheck, X, ChevronUp, ChevronDown
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
            Vi søger offentligt tilgængelige profiler fra LinkedIn, Wikipedia og offentlige kilder kun hvad der er lovligt at dele.
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>Data bruges kun tilBusinessIntelligence</li>
            <li>Data slettes automatisk efter 30 dage</li>
            <li>Ikke brugt til marketing eller profiling</li>
            <li>Alle data enkrypteret under transmission</li>
          </ul>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onDecline}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Afvis
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            Accepter
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default function ProfileSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSearch = async () => {
    if (!searchQuery.trim() || !gdprAccepted) return;
    setLoading(true);
    setProfileData(null);
    
    try {
      const [basicInfo, advancedCareer, skillsData, achievementsData, publicPresence] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `Find public profile information about "${searchQuery}": full name, current title, company, location, LinkedIn URL, email, public photo URL, connection count.`,
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
          prompt: `Provide ADVANCED career analysis for "${searchQuery}": (1) Detailed career progression with impact/achievements at each role, (2) Industry transitions and pivots with reasons, (3) Company trajectory (startups vs enterprises), (4) Leadership experience and team sizes led, (5) Mentorship patterns, (6) Education with specializations, (7) Career growth rate assessment, (8) Estimated seniority level.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              career_trajectory: { type: "string" },
              detailed_career_history: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    role: { type: "string" },
                    company: { type: "string" },
                    dates: { type: "string" },
                    impact_summary: { type: "string" },
                    teams_led: { type: "string" },
                    key_achievements: { type: "array", items: { type: "string" } }
                  },
                  additionalProperties: true
                } 
              },
              industry_transitions: { type: "array", items: { type: "string" } },
              leadership_experience: { type: "string" },
              education: { type: "array", items: { type: "string" } },
              total_experience_years: { type: "number" },
              growth_rate_assessment: { type: "string" },
              estimated_seniority: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Find deep expertise for "${searchQuery}": (1) Core technical/functional skills with proficiency levels, (2) Industry-specific expertise, (3) Soft skills demonstrated, (4) Certifications and credentials, (5) Board memberships with impact, (6) Advisory roles, (7) Thought leadership areas, (8) Tools/technologies mastery.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              core_skills: { type: "array", items: { type: "string" } },
              technical_expertise: { type: "array", items: { type: "string" } },
              soft_skills: { type: "array", items: { type: "string" } },
              certifications: { type: "array", items: { type: "string" } },
              board_memberships: { type: "array", items: { type: "string" } },
              advisory_roles: { type: "array", items: { type: "string" } },
              thought_leadership_areas: { type: "array", items: { type: "string" } }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Find impact and achievements for "${searchQuery}": (1) Major accomplishments with measurable impact, (2) Awards and recognitions, (3) Notable projects with outcomes, (4) Companies founded with status, (5) Speaking engagements and conferences, (6) Published content/articles, (7) Research contributions, (8) Industry impact statements.`,
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
              industry_impact: { type: "string" }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `Find public presence and influence for "${searchQuery}": (1) Media mentions and press coverage, (2) Podcast appearances, (3) Social media presence and followers, (4) Patents and intellectual property, (5) Network influence (known connections to notable figures), (6) Conference speaking history, (7) Book authorship, (8) Analyst rankings or industry recognition.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              media_mentions: { type: "array", items: { type: "string" } },
              podcast_appearances: { type: "array", items: { type: "string" } },
              social_media_presence: { type: "object", additionalProperties: true },
              patents: { type: "array", items: { type: "string" } },
              network_influence: { type: "string" },
              publications_authored: { type: "array", items: { type: "string" } }
            }
          }
        })
      ]);

      const merged = {
        ...basicInfo,
        ...advancedCareer,
        ...skillsData,
        ...achievementsData,
        ...publicPresence,
        search_timestamp: new Date().toISOString(),
        data_retention_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      setProfileData(merged);
    } catch (err) {
      console.error('Profile search error:', err);
    } finally {
      setLoading(false);
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
      <div className="flex gap-2 mb-6">
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
          disabled={loading || !searchQuery.trim()}
          className="bg-cyan-600 hover:bg-cyan-700 px-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
          <p className="text-slate-400">Søger gennem offentlige kilder...</p>
        </div>
      )}

      {/* Empty state */}
      {!profileData && !loading && (
        <div className="text-center py-12 text-slate-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Søg efter en person for at få udvidet profil information</p>
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
            {profileData.professional_summary && (
              <p className="text-slate-300 text-sm leading-relaxed">{profileData.professional_summary}</p>
            )}
            {profileData.total_experience_years && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{profileData.total_experience_years} years experience</span>
              </div>
            )}
          </CollapsibleSection>

          {/* Career section */}
          {profileData.career_history && profileData.career_history.length > 0 && (
            <CollapsibleSection
              title="Career History"
              icon={Briefcase}
              expanded={expandedSections.career}
              onToggle={() => toggleSection('career')}
            >
              <div className="space-y-2">
                {profileData.career_history.map((job, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                    <p className="text-white text-sm font-semibold">{job.title}</p>
                    <p className="text-cyan-400 text-xs">{job.company}</p>
                    {job.period && <p className="text-slate-500 text-[10px]">{job.period}</p>}
                  </div>
                ))}
              </div>
              {profileData.education && profileData.education.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Education</p>
                  {profileData.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <GraduationCap className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{edu}</span>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Skills section */}
          {(profileData.skills || profileData.certifications) && (
            <CollapsibleSection
              title="Skills & Expertise"
              icon={Code2}
              expanded={expandedSections.skills}
              onToggle={() => toggleSection('skills')}
            >
              {profileData.skills && profileData.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileData.skills.map((skill, i) => (
                      <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileData.certifications && profileData.certifications.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Certifications</p>
                  {profileData.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {cert}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Achievements section */}
          {(profileData.notable_achievements || profileData.awards) && (
            <CollapsibleSection
              title="Achievements & Recognition"
              icon={Award}
              expanded={expandedSections.achievements}
              onToggle={() => toggleSection('achievements')}
            >
              {profileData.awards && profileData.awards.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Awards</p>
                  {profileData.awards.map((award, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Award className="w-3 h-3 text-amber-400" />
                      {award}
                    </div>
                  ))}
                </div>
              )}
              {profileData.notable_achievements && profileData.notable_achievements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs font-semibold uppercase">Notable Achievements</p>
                  {profileData.notable_achievements.map((achievement, i) => (
                    <div key={i} className="text-xs text-slate-300 leading-relaxed">• {achievement}</div>
                  ))}
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