import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import {
  Search, Loader2, User, Linkedin, Mail, MapPin, Building2,
  TrendingUp, Award, Users, Brain, Filter, X, Plus, GitCompare,
  GraduationCap, Briefcase, Globe, Network, ChevronDown, ChevronUp,
  ExternalLink, AlertTriangle, CheckCircle, Code, Languages
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProfileCard = ({ person, isComparing, onCompare, onRemove }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-slate-700/50 bg-slate-900/40 hover:border-cyan-500/30 transition-all overflow-hidden group"
    >
      {/* Header with profile image */}
      <div className="p-4 pb-3 border-b border-slate-700/30 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
        <div className="flex items-start gap-3 mb-3">
          {person.linkedin_profile_image_url ? (
            <img
              src={person.linkedin_profile_image_url}
              alt={person.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/40 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-2 border-cyan-500/40 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-cyan-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{person.full_name}</p>
            <p className="text-cyan-400 text-xs font-semibold">{person.current_title}</p>
            <p className="text-slate-400 text-xs">{person.current_company}</p>
          </div>
          {isComparing && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {person.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <MapPin className="w-3 h-3" />
            <span>{person.location}</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {person.linkedin_url && (
            <a
              href={person.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            >
              <Linkedin className="w-3 h-3" />
              LinkedIn
            </a>
          )}
          {!isComparing && person.full_name && (
            <Button
              size="sm"
              onClick={onCompare}
              className="h-6 px-2 text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
            >
              <Plus className="w-3 h-3" />
              Compare
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          {person.total_experience_years && (
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-[10px]">Experience</p>
              <p className="text-white font-bold text-sm">{person.total_experience_years}y</p>
            </div>
          )}
          {person.estimated_seniority && (
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-[10px]">Seniority</p>
              <p className="text-white font-bold text-sm">{person.estimated_seniority}</p>
            </div>
          )}
          {person.connections_count && (
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-[10px]">Connections</p>
              <p className="text-white font-bold text-sm">{person.connections_count}</p>
            </div>
          )}
          {person.education?.length > 0 && (
            <div className="p-2 rounded-lg bg-slate-800/50">
              <p className="text-slate-400 text-[10px]">Education</p>
              <p className="text-white font-bold text-sm">{person.education.length}</p>
            </div>
          )}
        </div>

        {/* Education */}
        {person.education?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              Education
            </p>
            <div className="space-y-1">
              {person.education.slice(0, 2).map((e, i) => (
                <p key={i} className="text-slate-300 text-xs">{e}</p>
              ))}
            </div>
          </div>
        )}

        {/* Core skills */}
        {person.core_skills?.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Top Skills
            </p>
            <div className="flex flex-wrap gap-1">
              {person.core_skills.slice(0, 4).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {person.languages?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {person.languages.map((l, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800/50">
                {l}
              </span>
            ))}
          </div>
        )}

        {/* Expandable section */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 pt-2 border-t border-slate-700/30"
        >
          <span className="font-semibold">More Details</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
            {/* Career history */}
            {person.career_history?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  Career History
                </p>
                <div className="space-y-1.5 relative pl-3">
                  <div className="absolute left-0.5 top-0 bottom-0 w-px bg-slate-700/50" />
                  {person.career_history.slice(0, 4).map((job, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-1.5 top-1.5 w-2 h-2 rounded-full bg-amber-400/60" />
                      <p className="text-white text-[10px] font-semibold">{job.title}</p>
                      <p className="text-slate-400 text-[10px]">{job.company}</p>
                      {job.period && <p className="text-slate-500 text-[9px]">{job.period}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {person.major_accomplishments?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Accomplishments
                </p>
                <ul className="space-y-0.5">
                  {person.major_accomplishments.slice(0, 3).map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Board positions */}
            {person.board_memberships?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-violet-400" />
                  Board Positions
                </p>
                <ul className="space-y-0.5">
                  {person.board_memberships.map((b, i) => (
                    <li key={i} className="text-slate-300 text-[10px]">• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Certifications */}
            {person.certifications?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {person.certifications.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ComparisonView = ({ profiles }) => {
  if (profiles.length < 2) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-2xl border border-violet-500/30 bg-violet-500/5">
      <p className="text-violet-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
        <GitCompare className="w-4 h-4" />
        {profiles.length} Professionals Comparison
      </p>

      {/* Experience comparison */}
      <div className="mb-4">
        <p className="text-slate-400 text-xs font-semibold mb-2">Years of Experience</p>
        <div className="space-y-1">
          {profiles.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-slate-300 text-xs w-24 truncate">{p.full_name}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  style={{ width: `${Math.min((p.total_experience_years || 0) * 5, 100)}%` }}
                />
              </div>
              <span className="text-cyan-400 text-xs font-mono w-8">{p.total_experience_years || 0}y</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills overlap */}
      <div>
        <p className="text-slate-400 text-xs font-semibold mb-2">Common Skills</p>
        {profiles.length >= 2 ? (
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set(
              profiles.flatMap(p => p.core_skills || [])
            )).slice(0, 8).map((skill, i) => {
              const count = profiles.filter(p => p.core_skills?.includes(skill)).length;
              return (
                <span key={i} className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  {skill}
                  {count > 1 && <span className="ml-1 text-emerald-500">×{count}</span>}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-xs">Add 2+ profiles to see skill overlap</p>
        )}
      </div>
    </motion.div>
  );
};

export default function PeopleSearch() {
  const [searchInput, setSearchInput] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [comparing, setComparing] = useState([]);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const filters = [
        companyFilter && `company: ${companyFilter}`,
        locationFilter && `location: ${locationFilter}`,
        industryFilter && `industry: ${industryFilter}`,
      ].filter(Boolean).join(', ');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional research assistant. Search the web right now for real professionals named "${searchInput}"${filters ? ` (filters: ${filters})` : ''}.

CRITICAL INSTRUCTIONS:
- Search LinkedIn, company websites, news articles, and public profiles
- Find UP TO 5 DISTINCT real individuals — each must be a genuinely different person
- Provide ACCURATE, VERIFIED information only — no guessing or fabrication
- For each person fill in as many fields as you can find from real sources
- If filters are provided, prioritize matching candidates but still return all plausible matches
- career_history should be an array of objects with fields: title, company, period

Search NOW and return real results in the persons array.`,
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
                  linkedin_url: { type: "string" },
                  linkedin_profile_image_url: { type: "string" },
                  total_experience_years: { type: "number" },
                  estimated_seniority: { type: "string" },
                  connections_count: { type: "number" },
                  education: { type: "array", items: { type: "string" } },
                  core_skills: { type: "array", items: { type: "string" } },
                  languages: { type: "array", items: { type: "string" } },
                  career_history: { type: "array", items: { type: "object", additionalProperties: true } },
                  major_accomplishments: { type: "array", items: { type: "string" } },
                  board_memberships: { type: "array", items: { type: "string" } },
                  certifications: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      const persons = (response?.persons || response?.data?.persons || []);
      setResults(persons.filter(p => p.full_name));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (person) => {
    setComparing(prev => {
      const exists = prev.some(p => p.full_name === person.full_name);
      if (exists) {
        return prev.filter(p => p.full_name !== person.full_name);
      } else {
        return [...prev, person];
      }
    });
  };

  const removeFromComparison = (person) => {
    setComparing(prev => prev.filter(p => p.full_name !== person.full_name));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">Advanced People Search</h1>
          </div>
          <p className="text-slate-400 text-sm">Deep profile analysis with career history, network, and skill matching</p>
        </div>

        {/* Search bar */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, title, or expertise..."
              className="flex-1 px-4 py-3 bg-slate-900/60 border-2 border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !searchInput.trim()}
              className="bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl px-6"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              {!loading && 'Search'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              placeholder="Company (optional)"
              className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
            />
            <input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location / country (optional)"
              className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
            />
            <input
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              placeholder="Industry / field (optional)"
              className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
            />
          </div>
          {(companyFilter || locationFilter || industryFilter) && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="w-3 h-3" />
              Active filters:
              {companyFilter && <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">{companyFilter}</span>}
              {locationFilter && <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">{locationFilter}</span>}
              {industryFilter && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">{industryFilter}</span>}
            </div>
          )}
        </div>

        {!loading && results.length > 0 && (
          <p className="text-slate-400 text-sm mb-4">
            Found <span className="text-cyan-400 font-semibold">{results.length}</span> profile{results.length !== 1 ? 's' : ''} matching <span className="text-white">"{searchInput}"</span>
          </p>
        )}

        {/* Results grid */}
        {!loading && results.length === 0 && !searchInput && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Search for professionals to view detailed profiles</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-slate-400 mt-3">Analyzing profile...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((person, i) => (
                <ProfileCard
                  key={i}
                  person={person}
                  isComparing={comparing.some(p => p.full_name === person.full_name)}
                  onCompare={() => toggleCompare(person)}
                  onRemove={() => removeFromComparison(person)}
                />
              ))}
            </div>

            <ComparisonView profiles={comparing} />
          </div>
        )}
      </div>
    </div>
  );
}