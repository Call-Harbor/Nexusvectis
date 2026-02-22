import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { 
  X, TrendingUp, Building2, User, Users, BarChart3, 
  Zap, Brain, Loader2, 
  MapPin, Target, Star, Briefcase,
  GraduationCap, Shield, ChevronRight, Search, Linkedin,
  Network, Mail, UserSearch, Leaf, AlertTriangle, Award,
  TrendingDown, Globe, DollarSign, Activity, CheckCircle,
  XCircle, MinusCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const HologramPanel = ({ title, icon: Icon, colorClass, borderClass, glowClass, children, collapsible = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative rounded-2xl border-2 ${borderClass} bg-slate-950/80 backdrop-blur-xl overflow-hidden`}
    >
      <div className={`absolute inset-0 ${glowClass} pointer-events-none rounded-2xl`} />
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-current opacity-50 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-current opacity-50 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-current opacity-30 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-current opacity-30 rounded-br-2xl" />
      <div className="relative">
        <div
          className={`flex items-center gap-3 p-4 border-b ${borderClass} bg-slate-900/40 ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? () => setCollapsed(c => !c) : undefined}
        >
          <div className={`p-2 rounded-lg ${colorClass} border ${borderClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide flex-1">{title}</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-2 h-2 rounded-full bg-current opacity-20 animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            {collapsible && (collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />)}
          </div>
        </div>
        {!collapsed && (
          <div className="p-4 overflow-y-auto max-h-[480px]">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ScoreGauge = ({ label, score, max = 10, color }) => {
  const pct = (score / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{score}/{max}</span>
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

const SWOTItem = ({ icon: Icon, label, items, color, bg }) => (
  <div className={`p-3 rounded-xl border ${bg}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</span>
    </div>
    <ul className="space-y-1">
      {items?.slice(0, 3).map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
          <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default function CompanyAnalysisHologram({ companyName: initialName, onClose }) {
  const [companyInput, setCompanyInput] = useState(initialName || '');
  const [companyName, setCompanyName] = useState(initialName || '');
  const [loading, setLoading] = useState(!!initialName);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [personSearch, setPersonSearch] = useState('');
  const [personLoading, setPersonLoading] = useState(false);
  const [personData, setPersonData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (initialName) fetchData(initialName);
  }, []);

  const fetchData = async (name) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCompanyName(name);
    try {
      // Call 1: Core info + financials + ratings
      const [result1, result2] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `You are a senior investment analyst. Provide accurate data about the company "${name}". Use real publicly available information. Return ONLY valid data, no nulls for required fields.

  Return:
  - Basic info: company_name, industry, sector, country, founded, headquarters, employees, stock_ticker, credit_rating, website
  - description: 2-3 sentence company overview
  - financial: revenue_latest (e.g. "$45B"), market_cap, ebitda_margin, pe_ratio, dividend_yield, debt_ratio (number 0-1), market_share_pct (number), currency
  - financial.revenue_chart: exactly 5 years of data [{year:"2020", revenue:100, profit:20, ebitda:30}]
  - financial.stock_history: exactly 12 months [{month:"Jan", price:150}]
  - financial.competitors: 3-4 competitors [{name:"X", market_share:15}]
  - financial.geographic_markets: 3-5 regions [{region:"Europe", percentage:40}]
  - ratings: ALL scored 0-10: financial_health, growth_potential, innovation, brand_strength, management_quality, market_position, esg_rating, overall
  - history: description (paragraph), business_model (1 sentence), usp (1 sentence), recent_news (array of 4 strings), values (array of 5 strings), milestones (array of 5 objects {year, event})`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              company_name: { type: "string" },
              industry: { type: "string" },
              sector: { type: "string" },
              country: { type: "string" },
              website: { type: "string" },
              employees: { type: "string" },
              founded: { type: "string" },
              headquarters: { type: "string" },
              stock_ticker: { type: "string" },
              credit_rating: { type: "string" },
              description: { type: "string" },
              financial: {
                type: "object",
                properties: {
                  revenue_chart: { type: "array", items: { type: "object", properties: { year: { type: "string" }, revenue: { type: "number" }, profit: { type: "number" }, ebitda: { type: "number" } } } },
                  stock_history: { type: "array", items: { type: "object", properties: { month: { type: "string" }, price: { type: "number" } } } },
                  debt_ratio: { type: "number" },
                  market_share_pct: { type: "number" },
                  market_cap: { type: "string" },
                  revenue_latest: { type: "string" },
                  ebitda_margin: { type: "string" },
                  pe_ratio: { type: "string" },
                  dividend_yield: { type: "string" },
                  currency: { type: "string" },
                  competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, market_share: { type: "number" } } } },
                  geographic_markets: { type: "array", items: { type: "object", properties: { region: { type: "string" }, percentage: { type: "number" } } } }
                }
              },
              ratings: {
                type: "object",
                properties: {
                  financial_health: { type: "number" },
                  growth_potential: { type: "number" },
                  innovation: { type: "number" },
                  brand_strength: { type: "number" },
                  management_quality: { type: "number" },
                  market_position: { type: "number" },
                  esg_rating: { type: "number" },
                  overall: { type: "number" }
                }
              },
              history: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  business_model: { type: "string" },
                  usp: { type: "string" },
                  milestones: { type: "array", items: { type: "object", properties: { year: { type: "string" }, event: { type: "string" } } } },
                  values: { type: "array", items: { type: "string" } },
                  recent_news: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }),
        base44.integrations.Core.InvokeLLM({
          prompt: `You are a senior investment analyst. Provide accurate data about the company "${name}". Use real publicly available information.

  Return:
  - swot.strengths: exactly 3 key strengths (strings)
  - swot.weaknesses: exactly 3 key weaknesses (strings)
  - swot.opportunities: exactly 3 market opportunities (strings)
  - swot.threats: exactly 3 threats/risks (strings)
  - esg: overall_score (0-100), environmental_score (0-100), social_score (0-100), governance_score (0-100), rating_agency (e.g. "MSCI"), co2_target (string), renewable_energy_pct (number), sustainability_initiatives (3 strings), controversies (2 strings)
  - leadership_team: array of at least 3 executives with name, title, age (string), years_in_role (string), background (1-2 sentences), education
  - ownership: ownership_type, listed_exchange, founder_name, founder_year, founder_story (2-3 sentences), founder_current_role, shareholders (3-4 objects: {name, percentage, type})
  - ai_verdict: summary (paragraph), investment_thesis (paragraph), key_risks (3 strings), key_catalysts (3 strings), recommendation (e.g. "STRONG BUY" / "BUY" / "HOLD" / "SELL")`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              swot: {
                type: "object",
                properties: {
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  opportunities: { type: "array", items: { type: "string" } },
                  threats: { type: "array", items: { type: "string" } }
                }
              },
              esg: {
                type: "object",
                properties: {
                  overall_score: { type: "number" },
                  environmental_score: { type: "number" },
                  social_score: { type: "number" },
                  governance_score: { type: "number" },
                  rating_agency: { type: "string" },
                  co2_target: { type: "string" },
                  renewable_energy_pct: { type: "number" },
                  sustainability_initiatives: { type: "array", items: { type: "string" } },
                  controversies: { type: "array", items: { type: "string" } }
                }
              },
              leadership_team: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    title: { type: "string" },
                    age: { type: "string" },
                    years_in_role: { type: "string" },
                    background: { type: "string" },
                    education: { type: "string" }
                  }
                }
              },
              ownership: {
                type: "object",
                properties: {
                  ownership_type: { type: "string" },
                  listed_exchange: { type: "string" },
                  founder_name: { type: "string" },
                  founder_year: { type: "string" },
                  founder_story: { type: "string" },
                  founder_current_role: { type: "string" },
                  shareholders: { type: "array", items: { type: "object", properties: { name: { type: "string" }, percentage: { type: "number" }, type: { type: "string" } } } }
                }
              },
              ai_verdict: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  investment_thesis: { type: "string" },
                  key_risks: { type: "array", items: { type: "string" } },
                  key_catalysts: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        })
      ]);

      const merged = { ...result1, ...result2 };
      console.log('Company data merged:', JSON.stringify(merged).substring(0, 500));
      setData(merged);
    } catch (err) {
      console.error('fetchData error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (companyInput.trim()) fetchData(companyInput.trim());
  };

  const searchPerson = async () => {
    if (!personSearch.trim()) return;
    setPersonLoading(true);
    setPersonData(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find detailed profile information about the person "${personSearch}"${companyName ? ` at the company "${companyName}"` : ''}. 
      Use publicly available information sources including LinkedIn, Wikipedia, company profiles, press coverage and interviews.
      Return as accurate and realistic data as possible.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          current_title: { type: "string" },
          current_company: { type: "string" },
          location: { type: "string" },
          linkedin_url: { type: "string" },
          email_guess: { type: "string" },
          education: { type: "array", items: { type: "string" } },
          career_history: { type: "array", items: { type: "object", properties: { company: { type: "string" }, title: { type: "string" }, period: { type: "string" } } } },
          skills: { type: "array", items: { type: "string" } },
          board_memberships: { type: "array", items: { type: "string" } },
          notable_achievements: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          connections_count: { type: "string" },
          languages: { type: "array", items: { type: "string" } },
          notable_quote: { type: "string" }
        }
      }
    });
    setPersonData(result);
    setPersonLoading(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial' },
    { id: 'swot', label: 'SWOT' },
    { id: 'esg', label: 'ESG' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'verdict', label: 'AI Verdict' },
    { id: 'people', label: 'People Search' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: '#020817' }}>
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
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              Company Intelligence Platform
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">AI POWERED</Badge>
            </h1>
            {data && (
              <p className="text-cyan-400 text-xs">{data.company_name} · {data.industry} · {data.country} {data.stock_ticker && `· ${data.stock_ticker}`}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {data.employees && `${data.employees} employees`}
              {data.credit_rating && ` · Rating: ${data.credit_rating}`}
            </div>
          )}
          <Button onClick={onClose} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative z-10 p-4 border-b border-slate-800/50 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search company (e.g. Maersk, Apple, Novo Nordisk, Tesla)..."
            className="flex-1 px-4 py-2.5 bg-slate-900/60 border-2 border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !companyInput.trim()}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl px-5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Empty / Loading state */}
      {!companyName && !loading && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center">
          <Building2 className="w-16 h-16 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Search a company to begin deep analysis</p>
          <p className="text-slate-600 text-sm mt-2">Financial data · SWOT · ESG · Leadership · AI Verdict</p>
        </div>
      )}

      {loading && (
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 animate-spin border-t-cyan-400" />
            <Brain className="absolute inset-0 m-auto w-7 h-7 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Deep-analyzing "{companyName}"</p>
            <p className="text-slate-400 text-sm mt-1">Fetching financial data, ESG ratings, leadership profiles, SWOT...</p>
          </div>
          <div className="flex gap-2 text-xs text-slate-500 flex-wrap justify-center">
            {['Orbis', 'Bloomberg', 'LinkedIn', 'Annual Reports', 'ESG Ratings', 'SEC Filings'].map(s => (
              <span key={s} className="px-2 py-1 rounded bg-slate-800">{s}</span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="relative z-10 text-center text-red-400 p-6">
          <p>Error: {error}</p>
          <Button onClick={() => fetchData(companyName)} className="mt-3 bg-red-500/20 border border-red-500/40 text-red-300">Try Again</Button>
        </div>
      )}

      {/* Tabs + Content */}
      {data && !loading && (
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
          {/* Tab bar */}
          <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-slate-800/50 overflow-x-auto flex-shrink-0 bg-slate-950/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 border-b-0'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Company card */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-lg">{data.company_name}</p>
                          <p className="text-cyan-400 text-xs">{data.industry} · {data.sector}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Founded', value: data.founded },
                          { label: 'Employees', value: data.employees },
                          { label: 'HQ', value: data.headquarters },
                          { label: 'Ticker', value: data.stock_ticker || 'Private' },
                          { label: 'Revenue', value: data.financial?.revenue_latest },
                          { label: 'Market Cap', value: data.financial?.market_cap },
                        ].filter(i => i.value).map((item, i) => (
                          <div key={i} className="p-2 rounded-lg bg-slate-900/50">
                            <p className="text-slate-500">{item.label}</p>
                            <p className="text-white font-semibold truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall rating */}
                    {data.ratings && (
                      <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-500/5">
                        <p className="text-violet-400 text-xs font-bold uppercase tracking-wide mb-3">AI Company Score</p>
                        <div className="text-center mb-3">
                          <span className="text-5xl font-black text-white">{data.ratings.overall}</span>
                          <span className="text-slate-400 text-lg">/10</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'Financial Health', key: 'financial_health', color: '#06b6d4' },
                            { label: 'Growth Potential', key: 'growth_potential', color: '#8b5cf6' },
                            { label: 'Innovation', key: 'innovation', color: '#10b981' },
                            { label: 'Brand Strength', key: 'brand_strength', color: '#f59e0b' },
                            { label: 'Management', key: 'management_quality', color: '#3b82f6' },
                            { label: 'ESG', key: 'esg_rating', color: '#22c55e' },
                          ].map(r => (
                            <ScoreGauge key={r.key} label={r.label} score={data.ratings[r.key] || 0} color={r.color} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description + news */}
                  <div className="lg:col-span-2 space-y-4">
                    {data.history?.description && (
                      <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                        <p className="text-white text-sm leading-relaxed">{data.history.description}</p>
                      </div>
                    )}

                    {data.history?.business_model && (
                      <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <p className="text-violet-400 text-xs font-semibold mb-1">Business Model</p>
                        <p className="text-white text-xs">{data.history.business_model}</p>
                      </div>
                    )}

                    {data.history?.usp && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-400 text-xs font-semibold mb-1">Unique Selling Points (USP)</p>
                        <p className="text-white text-xs">{data.history.usp}</p>
                      </div>
                    )}

                    {/* Radar chart */}
                    {data.ratings && (
                      <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                        <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">Performance Radar</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={[
                            { metric: 'Financial', value: data.ratings.financial_health || 0 },
                            { metric: 'Growth', value: data.ratings.growth_potential || 0 },
                            { metric: 'Innovation', value: data.ratings.innovation || 0 },
                            { metric: 'Brand', value: data.ratings.brand_strength || 0 },
                            { metric: 'Management', value: data.ratings.management_quality || 0 },
                            { metric: 'ESG', value: data.ratings.esg_rating || 0 },
                          ]}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="metric" stroke="#64748b" style={{ fontSize: '11px' }} />
                            <Radar name="Score" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Recent news */}
                    {data.history?.recent_news?.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Recent News</p>
                        <div className="space-y-1.5">
                          {data.history.recent_news.slice(0, 4).map((n, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-800/40">
                              <ChevronRight className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{n}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FINANCIAL TAB */}
              {activeTab === 'financial' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Revenue', value: data.financial?.revenue_latest, color: 'cyan' },
                      { label: 'Market Cap', value: data.financial?.market_cap, color: 'violet' },
                      { label: 'EBITDA Margin', value: data.financial?.ebitda_margin, color: 'emerald' },
                      { label: 'P/E Ratio', value: data.financial?.pe_ratio, color: 'amber' },
                      { label: 'Dividend Yield', value: data.financial?.dividend_yield, color: 'blue' },
                      { label: 'Debt Ratio', value: data.financial?.debt_ratio?.toString(), color: 'red' },
                    ].filter(m => m.value).map((m, i) => (
                      <div key={i} className={`p-3 rounded-xl bg-${m.color}-500/10 border border-${m.color}-500/20`}>
                        <p className={`text-${m.color}-400 text-xs`}>{m.label}</p>
                        <p className="text-white font-bold text-sm">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stock chart */}
                  {data.financial?.stock_history?.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">Stock Price (12 months)</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={data.financial.stock_history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="price" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Revenue chart */}
                  {data.financial?.revenue_chart?.length > 0 && (
                    <div className="lg:col-span-2 p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">Revenue & Profit ({data.financial.currency || 'mil.'})</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.financial.revenue_chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="year" stroke="#64748b" style={{ fontSize: '11px' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                          <Bar dataKey="revenue" fill="#06b6d4" name="Revenue" radius={[3,3,0,0]} />
                          <Bar dataKey="profit" fill="#8b5cf6" name="Profit" radius={[3,3,0,0]} />
                          <Bar dataKey="ebitda" fill="#10b981" name="EBITDA" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Geographic markets */}
                  {data.financial?.geographic_markets?.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Geographic Revenue Split</p>
                      <div className="space-y-2">
                        {data.financial.geographic_markets.map((m, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-slate-300 text-xs w-24 truncate">{m.region}</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} initial={{ width: 0 }} animate={{ width: `${m.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                            </div>
                            <span className="text-cyan-400 text-xs font-mono w-8">{m.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitors */}
                  {data.financial?.competitors?.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Competitive Landscape</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={[{ name: data.company_name, market_share: data.financial.market_share_pct || 0 }, ...data.financial.competitors]} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="market_share" nameKey="name">
                            {[data.company_name, ...data.financial.competitors.map(c => c.name)].map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} formatter={(v) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.financial.competitors.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i+1) % COLORS.length] }} />
                            <span className="text-slate-300">{c.name}</span>
                            {c.market_share != null && <span className="text-slate-500">{c.market_share}%</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SWOT TAB */}
              {activeTab === 'swot' && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">AI-generated SWOT analysis based on market data, news, and public filings.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SWOTItem icon={CheckCircle} label="Strengths" items={data.swot?.strengths} color="text-emerald-400" bg="border-emerald-500/30 bg-emerald-500/5" />
                    <SWOTItem icon={XCircle} label="Weaknesses" items={data.swot?.weaknesses} color="text-red-400" bg="border-red-500/30 bg-red-500/5" />
                    <SWOTItem icon={TrendingUp} label="Opportunities" items={data.swot?.opportunities} color="text-cyan-400" bg="border-cyan-500/30 bg-cyan-500/5" />
                    <SWOTItem icon={AlertTriangle} label="Threats" items={data.swot?.threats} color="text-amber-400" bg="border-amber-500/30 bg-amber-500/5" />
                  </div>
                  {/* Timeline milestones */}
                  {data.history?.milestones?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">Company Timeline</p>
                      <div className="space-y-2 relative">
                        <div className="absolute left-14 top-0 bottom-0 w-px bg-violet-500/20" />
                        {data.history.milestones.map((m, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-14 text-center">
                              <span className="text-violet-400 text-[10px] font-bold">{m.year}</span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 shadow-lg shadow-violet-500/30" />
                            <p className="text-slate-300 text-xs">{m.event}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ESG TAB */}
              {activeTab === 'esg' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Score cards */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                      <div className="flex items-center gap-2 mb-4">
                        <Leaf className="w-5 h-5 text-emerald-400" />
                        <p className="text-emerald-400 font-bold">ESG Rating</p>
                        {data.esg?.rating_agency && <span className="text-slate-500 text-xs">by {data.esg.rating_agency}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: 'Overall', value: data.esg?.overall_score, color: '#10b981' },
                          { label: 'Environmental', value: data.esg?.environmental_score, color: '#06b6d4' },
                          { label: 'Social', value: data.esg?.social_score, color: '#8b5cf6' },
                          { label: 'Governance', value: data.esg?.governance_score, color: '#f59e0b' },
                        ].filter(s => s.value != null).map((s, i) => (
                          <div key={i} className="text-center p-3 rounded-xl bg-slate-900/50">
                            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-slate-500 text-xs">/100</p>
                          </div>
                        ))}
                      </div>
                      {data.esg?.co2_target && (
                        <div className="p-2 rounded-lg bg-slate-900/40 text-xs">
                          <span className="text-slate-400">CO₂ Target: </span>
                          <span className="text-emerald-300 font-semibold">{data.esg.co2_target}</span>
                        </div>
                      )}
                      {data.esg?.renewable_energy_pct != null && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Renewable Energy</span>
                            <span className="text-emerald-400 font-bold">{data.esg.renewable_energy_pct}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${data.esg.renewable_energy_pct}%` }} transition={{ duration: 0.8 }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sustainability initiatives */}
                    {data.esg?.sustainability_initiatives?.length > 0 && (
                      <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5">
                        <p className="text-cyan-400 text-xs font-bold uppercase mb-3">Sustainability Initiatives</p>
                        <div className="space-y-1.5">
                          {data.esg.sustainability_initiatives.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ESG radar + controversies */}
                  <div className="space-y-3">
                    {data.esg && (
                      <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                        <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">ESG Breakdown</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[
                            { metric: 'Environmental', value: data.esg.environmental_score || 0 },
                            { metric: 'Social', value: data.esg.social_score || 0 },
                            { metric: 'Governance', value: data.esg.governance_score || 0 },
                          ]}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="metric" stroke="#64748b" style={{ fontSize: '11px' }} />
                            <Radar name="ESG" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {data.esg?.controversies?.length > 0 && (
                      <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <p className="text-red-400 text-xs font-bold uppercase">Controversies</p>
                        </div>
                        <div className="space-y-1.5">
                          {data.esg.controversies.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LEADERSHIP TAB */}
              {activeTab === 'leadership' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.leadership_team?.map((person, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/40 hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{person.name}</p>
                          <p className="text-cyan-400 text-xs truncate">{person.title}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {person.age && <span className="text-[10px] text-slate-500">{person.age} y/o</span>}
                            {person.years_in_role && <span className="text-[10px] text-slate-500">· {person.years_in_role}</span>}
                          </div>
                        </div>
                      </div>
                      {person.education && (
                        <div className="flex items-start gap-2 mb-2">
                          <GraduationCap className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-400 text-xs">{person.education}</p>
                        </div>
                      )}
                      {person.background && (
                        <p className="text-slate-400 text-xs leading-relaxed">{person.background}</p>
                      )}
                      <button
                        onClick={() => { setPersonSearch(person.name); setActiveTab('people'); setTimeout(searchPerson, 100); }}
                        className="mt-3 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Linkedin className="w-3 h-3" />
                        Search profile
                      </button>
                    </motion.div>
                  ))}
                  {(!data.leadership_team || data.leadership_team.length === 0) && (
                    <p className="text-slate-500 text-sm col-span-full text-center py-8">No leadership data found</p>
                  )}
                </div>
              )}

              {/* OWNERSHIP TAB */}
              {activeTab === 'ownership' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ownership type */}
                  {data.ownership?.ownership_type && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3">
                      <Shield className="w-8 h-8 text-amber-400" />
                      <div>
                        <p className="text-amber-400 text-xs font-semibold">Ownership Type</p>
                        <p className="text-white text-lg font-bold">{data.ownership.ownership_type}</p>
                        {data.ownership.listed_exchange && <p className="text-slate-400 text-xs">{data.ownership.listed_exchange}</p>}
                      </div>
                    </div>
                  )}

                  {/* Shareholders */}
                  {data.ownership?.shareholders?.length > 0 && (
                    <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Ownership Structure</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={data.ownership.shareholders} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="percentage" nameKey="name">
                            {data.ownership.shareholders.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} formatter={(v) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {data.ownership.shareholders.map((s, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-slate-300">{s.name}</span>
                              {s.type && <span className="text-slate-500">({s.type})</span>}
                            </div>
                            <span className="text-white font-bold font-mono">{s.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Founder */}
                  {data.ownership?.founder_name && (
                    <div className="lg:col-span-2 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                      <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">Founder</p>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/40 flex items-center justify-center">
                          <Star className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{data.ownership.founder_name}</p>
                          <div className="flex gap-2 text-xs text-slate-400 flex-wrap">
                            {data.ownership.founder_year && <span>Founded {data.ownership.founder_year}</span>}
                            {data.ownership.founder_current_role && <span>· {data.ownership.founder_current_role}</span>}
                          </div>
                        </div>
                      </div>
                      {data.ownership.founder_story && (
                        <p className="text-slate-300 text-xs leading-relaxed">{data.ownership.founder_story}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI VERDICT TAB */}
              {activeTab === 'verdict' && (
                <div className="space-y-4 max-w-3xl">
                  {data.ai_verdict?.recommendation && (
                    <div className="p-5 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />
                        <p className="text-white font-bold text-lg">AI Recommendation</p>
                      </div>
                      <p className="text-2xl font-black text-cyan-300">{data.ai_verdict.recommendation}</p>
                    </div>
                  )}

                  {data.ai_verdict?.summary && (
                    <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-2">Executive Summary</p>
                      <p className="text-slate-200 text-sm leading-relaxed">{data.ai_verdict.summary}</p>
                    </div>
                  )}

                  {data.ai_verdict?.investment_thesis && (
                    <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-500/5">
                      <p className="text-violet-400 text-xs font-bold uppercase mb-2">Investment Thesis</p>
                      <p className="text-slate-200 text-sm leading-relaxed">{data.ai_verdict.investment_thesis}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.ai_verdict?.key_catalysts?.length > 0 && (
                      <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <p className="text-emerald-400 text-xs font-bold uppercase">Key Catalysts</p>
                        </div>
                        <div className="space-y-1.5">
                          {data.ai_verdict.key_catalysts.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.ai_verdict?.key_risks?.length > 0 && (
                      <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <p className="text-red-400 text-xs font-bold uppercase">Key Risks</p>
                        </div>
                        <div className="space-y-1.5">
                          {data.ai_verdict.key_risks.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-300">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core values */}
                  {data.history?.values?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Core Values</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.history.values.map((v, i) => (
                          <span key={i} className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS[i % COLORS.length] + '22', color: COLORS[i % COLORS.length], border: `1px solid ${COLORS[i % COLORS.length]}44` }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PEOPLE SEARCH TAB */}
              {activeTab === 'people' && (
                <div>
                  <div className="flex gap-2 mb-4 max-w-xl">
                    <div className="flex-1 relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <input
                        value={personSearch}
                        onChange={e => setPersonSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchPerson()}
                        placeholder={`Search person${companyName ? ` at ${companyName}` : ''} (e.g. CEO, CFO, name)...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border-2 border-blue-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 text-sm"
                      />
                    </div>
                    <button
                      onClick={searchPerson}
                      disabled={personLoading || !personSearch.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {personLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </div>

                  {personLoading && (
                    <div className="flex items-center gap-3 py-8 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      <span className="text-sm">Searching LinkedIn, Wikipedia, press coverage...</span>
                    </div>
                  )}

                  {!personData && !personLoading && (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      <Linkedin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>Search for a person to view their profile, career and network</p>
                    </div>
                  )}

                  {personData && !personLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-500/40 flex items-center justify-center flex-shrink-0">
                            <User className="w-7 h-7 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold">{personData.full_name}</p>
                            <p className="text-blue-400 text-xs">{personData.current_title}</p>
                            <p className="text-slate-400 text-xs">{personData.current_company}</p>
                            {personData.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-500 text-xs">{personData.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {personData.linkedin_url && <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs"><Linkedin className="w-4 h-4 text-blue-400 flex-shrink-0" /><span className="text-slate-300 truncate">{personData.linkedin_url}</span></div>}
                          {personData.email_guess && <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs"><Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="text-slate-300">{personData.email_guess}</span></div>}
                          {personData.connections_count && <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs"><Network className="w-4 h-4 text-violet-400 flex-shrink-0" /><span className="text-slate-300">{personData.connections_count} connections</span></div>}
                        </div>

                        {personData.skills?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {personData.skills.slice(0, 8).map((s, i) => <span key={i} className="px-2 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300">{s}</span>)}
                            </div>
                          </div>
                        )}

                        {personData.languages?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Languages</p>
                            <div className="flex flex-wrap gap-1.5">
                              {personData.languages.map((l, i) => <span key={i} className="px-2 py-1 rounded-full text-xs bg-slate-800/70 border border-slate-700/50 text-slate-300">{l}</span>)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {personData.summary && <p className="text-slate-300 text-xs leading-relaxed p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">{personData.summary}</p>}

                        {personData.career_history?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Career</p>
                            <div className="space-y-1.5 relative">
                              <div className="absolute left-3 top-0 bottom-0 w-px bg-blue-500/20" />
                              {personData.career_history.map((job, i) => (
                                <div key={i} className="flex items-start gap-3 pl-6 relative">
                                  <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                  <div>
                                    <p className="text-white text-xs font-semibold">{job.title}</p>
                                    <p className="text-blue-400 text-xs">{job.company}</p>
                                    {job.period && <p className="text-slate-500 text-[10px]">{job.period}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {personData.education?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Education</p>
                            <div className="space-y-1">
                              {personData.education.map((e, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <GraduationCap className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-300">{e}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {personData.board_memberships?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Board Memberships</p>
                            <div className="space-y-1">
                              {personData.board_memberships.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                                  <span className="text-slate-300">{b}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {personData.notable_quote && (
                          <blockquote className="p-3 rounded-lg border-l-2 border-blue-400/50 bg-blue-500/5 italic">
                            <p className="text-slate-300 text-xs">"{personData.notable_quote}"</p>
                          </blockquote>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}