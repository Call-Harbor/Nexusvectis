import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from "@/api/base44Client";
import { 
  X, TrendingUp, Building2, User, Users, BarChart3, 
  Clock, Globe, Award, Zap, Brain, Activity, Loader2, 
  MapPin, DollarSign, Sparkles, Target, Star, Briefcase,
  GraduationCap, Shield, ChevronRight, Search, Linkedin,
  Network, Mail, Phone, ExternalLink, UserSearch
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const HologramPanel = ({ title, icon: Icon, colorClass, borderClass, glowClass, children }) => (
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
      <div className={`flex items-center gap-3 p-4 border-b ${borderClass} bg-slate-900/40`}>
        <div className={`p-2 rounded-lg ${colorClass} border ${borderClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-white font-bold text-sm tracking-wide">{title}</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="w-2 h-2 rounded-full bg-current opacity-20 animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
      <div className="p-4 overflow-y-auto max-h-[420px]">
        {children}
      </div>
    </div>
  </motion.div>
);

const LoadingPanel = ({ colorClass, borderClass }) => (
  <div className={`rounded-2xl border-2 ${borderClass} bg-slate-950/80 flex items-center justify-center h-64`}>
    <div className="text-center">
      <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-3 ${colorClass.replace('bg-', 'text-').replace('/10', '/80')}`} />
      <p className="text-slate-400 text-sm">Henter data...</p>
    </div>
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

  useEffect(() => {
    if (initialName) fetchData(initialName);
  }, []);

  const fetchData = async (name) => {
    setLoading(true);
    setError(null);
    setData(null);
    setCompanyName(name);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Du er en professionel virksomhedsanalytiker. Analyser virksomheden "${name}" grundigt baseret på offentligt tilgængelige oplysninger.
Returner alle felter så præcist og realistisk som muligt. For finansielle data, brug de seneste tilgængelige tal (estimater er acceptable).
For revenue_chart, giv realistiske tal i mio. DKK/EUR/USD (tilpas til virksomhedens størrelse).
For milestones, giv de vigtigste begivenheder i kronologisk rækkefølge.
For shareholders, inkluder alle kendte ejere.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          industry: { type: "string" },
          country: { type: "string" },
          website: { type: "string" },
          employees: { type: "string" },
          financial: {
            type: "object",
            properties: {
              revenue_chart: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    year: { type: "string" },
                    revenue: { type: "number" },
                    profit: { type: "number" },
                    ebitda: { type: "number" }
                  }
                }
              },
              current_ratio: { type: "number" },
              debt_ratio: { type: "number" },
              market_share_pct: { type: "number" },
              market_cap: { type: "string" },
              currency: { type: "string" },
              competitors: {
                type: "array",
                items: {
                  type: "object",
                  properties: { name: { type: "string" }, market_share: { type: "number" } }
                }
              },
              geographic_markets: {
                type: "array",
                items: {
                  type: "object",
                  properties: { region: { type: "string" }, percentage: { type: "number" } }
                }
              },
              target_audience: {
                type: "object",
                properties: {
                  primary: { type: "string" },
                  demographics: { type: "string" },
                  psychographics: { type: "string" }
                }
              }
            }
          },
          history: {
            type: "object",
            properties: {
              founded: { type: "string" },
              headquarters: { type: "string" },
              description: { type: "string" },
              business_model: { type: "string" },
              usp: { type: "string" },
              milestones: {
                type: "array",
                items: {
                  type: "object",
                  properties: { year: { type: "string" }, event: { type: "string" } }
                }
              },
              values: { type: "array", items: { type: "string" } },
              media_sentiment: { type: "string" },
              recent_news: { type: "array", items: { type: "string" } }
            }
          },
          ceo: {
            type: "object",
            properties: {
              name: { type: "string" },
              title: { type: "string" },
              education: { type: "string" },
              background: { type: "string" },
              years_in_role: { type: "string" },
              age: { type: "string" },
              leadership_style: { type: "string" },
              key_achievements: { type: "array", items: { type: "string" } },
              notable_quote: { type: "string" },
              previous_roles: { type: "array", items: { type: "string" } }
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
              shareholders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    percentage: { type: "number" },
                    type: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    });
    setData(result);
    setLoading(false);
  };

  const handleSearch = () => {
    if (companyInput.trim()) fetchData(companyInput.trim());
  };

  const searchPerson = async () => {
    if (!personSearch.trim()) return;
    setPersonLoading(true);
    setPersonData(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find detaljeret profil-information om personen "${personSearch}"${companyName ? ` hos virksomheden "${companyName}"` : ''}. 
Brug offentligt tilgængelige informationskilder inkl. LinkedIn, Wikipedia, virksomhedsprofiler, presseomtale og interviews.
Returner så præcise og realistiske data som muligt.`,
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
          career_history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                company: { type: "string" },
                title: { type: "string" },
                period: { type: "string" }
              }
            }
          },
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
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-500/50">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
              Holografisk Virksomhedsanalyse
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">AI</Badge>
            </h1>
            {companyName && (
              <p className="text-cyan-400 text-sm">{data?.company_name || companyName} · {data?.industry || ''} · {data?.country || ''}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {data.employees && `${data.employees} medarbejdere`}
              {data.website && ` · ${data.website}`}
            </div>
          )}
          <Button onClick={onClose} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative z-10 p-4 sm:p-6 border-b border-slate-800/50">
        <div className="max-w-xl mx-auto flex gap-2">
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Søg virksomhed (f.eks. Mærsk, Novo Nordisk, Apple)..."
            className="flex-1 px-4 py-2.5 bg-slate-900/60 border-2 border-cyan-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !companyInput.trim()}
            className="bg-gradient-to-r from-cyan-500 to-violet-500 rounded-xl px-4"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 p-4 sm:p-6">
        {!companyName && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-slate-400 text-lg">Søg en virksomhed for at starte analysen</p>
            <p className="text-slate-600 text-sm mt-2">AI henter realtidsdata fra offentlige kilder</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 animate-spin border-t-cyan-400" />
              <Brain className="absolute inset-0 m-auto w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">AI analyserer "{companyName}"</p>
              <p className="text-slate-400 text-sm mt-1">Søger i offentlige databaser, årsrapporter, nyheder...</p>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 rounded bg-slate-800">Orbis</span>
              <span className="px-2 py-1 rounded bg-slate-800">Bloomberg</span>
              <span className="px-2 py-1 rounded bg-slate-800">LinkedIn</span>
              <span className="px-2 py-1 rounded bg-slate-800">Årsrapporter</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 p-6">
            <p>Fejl: {error}</p>
            <Button onClick={() => fetchData(companyName)} className="mt-3 bg-red-500/20 border border-red-500/40 text-red-300">
              Prøv igen
            </Button>
          </div>
        )}

        {data && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mx-auto">

            {/* HOLOGRAM 1: Teknisk Økonomi */}
            <HologramPanel
              title="1 · Teknisk Analyse – Økonomi & Marked"
              icon={TrendingUp}
              colorClass="bg-cyan-500/10 text-cyan-400"
              borderClass="border-cyan-500/40"
              glowClass="bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent"
            >
              {/* Revenue chart */}
              {data.financial?.revenue_chart?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Omsætning & Profit ({data.financial.currency || 'mio.'})</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.financial.revenue_chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#f1f5f9' }} />
                      <Bar dataKey="revenue" fill="#06b6d4" name="Omsætning" radius={[3,3,0,0]} />
                      <Bar dataKey="profit" fill="#8b5cf6" name="Profit" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {data.financial?.market_cap && (
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-cyan-400 text-xs">Markedsværdi</p>
                    <p className="text-white font-bold text-sm">{data.financial.market_cap}</p>
                  </div>
                )}
                {data.financial?.market_share_pct != null && (
                  <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <p className="text-violet-400 text-xs">Markedsandel</p>
                    <p className="text-white font-bold text-sm">{data.financial.market_share_pct}%</p>
                  </div>
                )}
                {data.financial?.current_ratio != null && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 text-xs">Current Ratio</p>
                    <p className="text-white font-bold text-sm">{data.financial.current_ratio}</p>
                  </div>
                )}
                {data.financial?.debt_ratio != null && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-400 text-xs">Gældsgrad</p>
                    <p className="text-white font-bold text-sm">{data.financial.debt_ratio}</p>
                  </div>
                )}
              </div>

              {/* Geographic markets */}
              {data.financial?.geographic_markets?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Geografisk Fordeling</p>
                  <div className="space-y-1.5">
                    {data.financial.geographic_markets.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs w-24 truncate">{m.region}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${m.percentage}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                        <span className="text-cyan-400 text-xs font-mono w-8">{m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors */}
              {data.financial?.competitors?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Konkurrenter</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.financial.competitors.map((c, i) => (
                      <div key={i} className="px-2 py-1 rounded-lg bg-slate-800/70 border border-slate-700/50 text-xs">
                        <span className="text-white">{c.name}</span>
                        {c.market_share != null && <span className="text-slate-400 ml-1">{c.market_share}%</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target audience */}
              {data.financial?.target_audience && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Målgruppe</p>
                  <div className="space-y-1.5">
                    {data.financial.target_audience.primary && (
                      <div className="flex items-start gap-2 text-xs">
                        <Target className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{data.financial.target_audience.primary}</span>
                      </div>
                    )}
                    {data.financial.target_audience.demographics && (
                      <div className="flex items-start gap-2 text-xs">
                        <Users className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{data.financial.target_audience.demographics}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </HologramPanel>

            {/* HOLOGRAM 2: Historie */}
            <HologramPanel
              title="2 · Virksomhedens Historie & Forretningsmodel"
              icon={Building2}
              colorClass="bg-violet-500/10 text-violet-400"
              borderClass="border-violet-500/40"
              glowClass="bg-gradient-to-br from-violet-500/10 via-transparent to-transparent"
            >
              {/* Overview */}
              {data.history?.description && (
                <p className="text-slate-300 text-xs leading-relaxed mb-4 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                  {data.history.description}
                </p>
              )}

              {/* Business model */}
              {(data.history?.business_model || data.history?.usp) && (
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {data.history.business_model && (
                    <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <p className="text-violet-400 text-xs font-semibold mb-1">Forretningsmodel</p>
                      <p className="text-white text-xs">{data.history.business_model}</p>
                    </div>
                  )}
                  {data.history.usp && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-emerald-400 text-xs font-semibold mb-1">Unikke Salgsargumenter (USP)</p>
                      <p className="text-white text-xs">{data.history.usp}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              {data.history?.milestones?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Tidslinje</p>
                  <div className="space-y-2 relative">
                    <div className="absolute left-7 top-0 bottom-0 w-px bg-violet-500/20" />
                    {data.history.milestones.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 relative"
                      >
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

              {/* Core values */}
              {data.history?.values?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Kerneværdier</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.history.values.map((v, i) => (
                      <span key={i} className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS[i % COLORS.length] + '22', color: COLORS[i % COLORS.length], border: `1px solid ${COLORS[i % COLORS.length]}44` }}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent news */}
              {data.history?.recent_news?.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Seneste Nyheder</p>
                  <div className="space-y-1.5">
                    {data.history.recent_news.slice(0, 3).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-800/40">
                        <ChevronRight className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </HologramPanel>

            {/* HOLOGRAM 3: CEO */}
            <HologramPanel
              title="3 · Administrerende Direktør (CEO)"
              icon={User}
              colorClass="bg-emerald-500/10 text-emerald-400"
              borderClass="border-emerald-500/40"
              glowClass="bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
            >
              {data.ceo?.name ? (
              <>
                {/* CEO Header */}
                <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border-2 border-emerald-500/40 flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-blue-400/60 transition-all group"
                    onClick={() => { setPersonSearch(data.ceo.name); setTimeout(() => searchPerson(), 100); }}
                    title="Søg på LinkedIn"
                  >
                    <User className="w-7 h-7 text-emerald-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                    <div>
                      <p className="text-white font-bold">{data.ceo.name}</p>
                      <p className="text-emerald-400 text-xs">{data.ceo.title || 'CEO'}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {data.ceo.years_in_role && <Badge className="bg-slate-800 text-slate-300 text-[10px]">{data.ceo.years_in_role}</Badge>}
                        {data.ceo.age && <Badge className="bg-slate-800 text-slate-300 text-[10px]">{data.ceo.age} år</Badge>}
                        <button
                          onClick={() => { setPersonSearch(data.ceo.name); setTimeout(() => searchPerson(), 100); }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] hover:bg-blue-500/30 transition-all"
                        >
                          <Linkedin className="w-2.5 h-2.5" />
                          Søg person
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quote */}
                  {data.ceo.notable_quote && (
                    <blockquote className="mb-4 p-3 rounded-lg border-l-2 border-emerald-400/50 bg-emerald-500/5 italic">
                      <p className="text-slate-300 text-xs">"{data.ceo.notable_quote}"</p>
                      <p className="text-emerald-400 text-xs mt-1 not-italic">— {data.ceo.name}</p>
                    </blockquote>
                  )}

                  {/* Education & Background */}
                  <div className="space-y-2 mb-4">
                    {data.ceo.education && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40">
                        <GraduationCap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-400 text-[10px]">Uddannelse</p>
                          <p className="text-white text-xs">{data.ceo.education}</p>
                        </div>
                      </div>
                    )}
                    {data.ceo.background && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40">
                        <Briefcase className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-400 text-[10px]">Baggrund</p>
                          <p className="text-white text-xs">{data.ceo.background}</p>
                        </div>
                      </div>
                    )}
                    {data.ceo.leadership_style && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40">
                        <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-400 text-[10px]">Ledelsesstil</p>
                          <p className="text-white text-xs">{data.ceo.leadership_style}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Previous roles */}
                  {data.ceo.previous_roles?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Tidligere Stillinger</p>
                      <div className="space-y-1">
                        {data.ceo.previous_roles.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                            <span className="text-slate-300">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key achievements */}
                  {data.ceo.key_achievements?.length > 0 && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Nøglepræstationer</p>
                      <div className="space-y-1.5">
                        {data.ceo.key_achievements.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Star className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm">Ingen CEO-data fundet</p>
              )}
            </HologramPanel>

            {/* HOLOGRAM 4: Ejere & Stiftere */}
            <HologramPanel
              title="4 · Ejere, Aktionærer & Stiftende Person"
              icon={Users}
              colorClass="bg-amber-500/10 text-amber-400"
              borderClass="border-amber-500/40"
              glowClass="bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"
            >
              {/* Ownership type */}
              {data.ownership?.ownership_type && (
                <div className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-amber-400 text-xs font-semibold">Ejerskabstype</p>
                    <p className="text-white text-sm font-bold">{data.ownership.ownership_type}</p>
                    {data.ownership.listed_exchange && <p className="text-slate-400 text-xs">{data.ownership.listed_exchange}</p>}
                  </div>
                </div>
              )}

              {/* Shareholders pie + list */}
              {data.ownership?.shareholders?.length > 0 && (
                <div className="mb-4">
                  <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">Ejerstruktur</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={data.ownership.shareholders}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="percentage"
                        nameKey="name"
                      >
                        {data.ownership.shareholders.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
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
                <div>
                  <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Stifter</p>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/40 flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{data.ownership.founder_name}</p>
                        <div className="flex gap-2">
                          {data.ownership.founder_year && <p className="text-amber-400 text-xs">Grundlagt {data.ownership.founder_year}</p>}
                          {data.ownership.founder_current_role && <p className="text-slate-400 text-xs">· {data.ownership.founder_current_role}</p>}
                        </div>
                      </div>
                    </div>
                    {data.ownership.founder_story && (
                      <p className="text-slate-300 text-xs leading-relaxed">{data.ownership.founder_story}</p>
                    )}
                  </div>
                </div>
              )}
            </HologramPanel>

            {/* HOLOGRAM 5: Person/LinkedIn Search */}
            <div className="lg:col-span-2">
              <HologramPanel
                title="5 · Person & LinkedIn Søgning"
                icon={UserSearch}
                colorClass="bg-blue-500/10 text-blue-400"
                borderClass="border-blue-500/40"
                glowClass="bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"
              >
                {/* Search bar */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input
                      value={personSearch}
                      onChange={e => setPersonSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchPerson()}
                      placeholder={`Søg person${companyName ? ` hos ${companyName}` : ''} (fx CEO, CFO, navn)...`}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border-2 border-blue-500/30 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 text-sm"
                    />
                  </div>
                  <button
                    onClick={searchPerson}
                    disabled={personLoading || !personSearch.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {personLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Søg
                  </button>
                </div>

                {personLoading && (
                  <div className="flex items-center justify-center gap-3 py-8 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-sm">Søger i LinkedIn, Wikipedia, presseomtale...</span>
                  </div>
                )}

                {!personData && !personLoading && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <Linkedin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Søg efter en person for at se deres profil, karriere og netværk</p>
                  </div>
                )}

                {personData && !personLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Profile card */}
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

                      {/* Contact info */}
                      <div className="space-y-1.5">
                        {personData.linkedin_url && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs">
                            <Linkedin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="text-slate-300 truncate">{personData.linkedin_url}</span>
                          </div>
                        )}
                        {personData.email_guess && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs">
                            <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-slate-300">{personData.email_guess}</span>
                          </div>
                        )}
                        {personData.connections_count && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 text-xs">
                            <Network className="w-4 h-4 text-violet-400 flex-shrink-0" />
                            <span className="text-slate-300">{personData.connections_count} forbindelser</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {personData.skills?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Kompetencer</p>
                          <div className="flex flex-wrap gap-1.5">
                            {personData.skills.slice(0, 8).map((s, i) => (
                              <span key={i} className="px-2 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {personData.languages?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Sprog</p>
                          <div className="flex flex-wrap gap-1.5">
                            {personData.languages.map((l, i) => (
                              <span key={i} className="px-2 py-1 rounded-full text-xs bg-slate-800/70 border border-slate-700/50 text-slate-300">{l}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Career & achievements */}
                    <div className="space-y-3">
                      {/* Summary */}
                      {personData.summary && (
                        <p className="text-slate-300 text-xs leading-relaxed p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                          {personData.summary}
                        </p>
                      )}

                      {/* Career history */}
                      {personData.career_history?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Karriere</p>
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

                      {/* Education */}
                      {personData.education?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Uddannelse</p>
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

                      {/* Board memberships */}
                      {personData.board_memberships?.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">Bestyrelsesposter</p>
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

                      {/* Notable quote */}
                      {personData.notable_quote && (
                        <blockquote className="p-3 rounded-lg border-l-2 border-blue-400/50 bg-blue-500/5 italic">
                          <p className="text-slate-300 text-xs">"{personData.notable_quote}"</p>
                        </blockquote>
                      )}
                    </div>
                  </div>
                )}
              </HologramPanel>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}