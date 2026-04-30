import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Globe, Zap, Eye, Target, Brain,
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Radar, Cpu, Shield, ChevronRight, RefreshCw, Loader2,
  BarChart2, Star, Crosshair, Activity
} from "lucide-react";
import {
  RadarChart, Radar as ReRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const COMPETITORS = [
  { id: "samsara", name: "Samsara", color: "#ef4444", segment: "Fleet IoT", founded: 2015 },
  { id: "motive", name: "Motive", color: "#f59e0b", segment: "Fleet AI", founded: 2013 },
  { id: "fleet_complete", name: "Fleet Complete", color: "#8b5cf6", segment: "TMS", founded: 2000 },
  { id: "project44", name: "project44", color: "#ec4899", segment: "Supply Chain Visibility", founded: 2014 },
  { id: "fourkites", name: "FourKites", color: "#f97316", segment: "Real-time Tracking", founded: 2014 },
];

const DIMENSIONS = ["AI Capability", "UX Quality", "API Richness", "Pricing", "Market Reach", "Innovation Speed", "Customer NPS", "Integration Depth"];

function NeonCard({ children, className = "", color = "#06b6d4" }) {
  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden ${className}`}
      style={{ background: `rgba(2,8,20,0.85)`, borderColor: `${color}20`, boxShadow: `0 0 30px ${color}08` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${color}06 0%, transparent 60%)` }} />
      {children}
    </div>
  );
}

function CompetitorRadar({ competitors, ourScores }) {
  const data = DIMENSIONS.map((dim, i) => {
    const row = { dimension: dim.split(" ")[0], nexus: ourScores[i] };
    competitors.forEach(c => {
      // Deterministic pseudo-scores based on name hash
      const seed = c.id.charCodeAt(0) + i * 7;
      row[c.id] = 45 + (seed * 17 + i * 13) % 45;
    });
    return row;
  });

  const COLORS = ["#06b6d4", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316"];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#64748b", fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 8 }} />
        <ReRadar name="NexusVectis" dataKey="nexus" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} strokeWidth={2} />
        {competitors.map((c, i) => (
          <ReRadar key={c.id} name={c.name} dataKey={c.id} stroke={c.color} fill={c.color} fillOpacity={0.05} strokeWidth={1.5} />
        ))}
        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function MarketShareGauge({ share }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (share / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle cx="70" cy="70" r="54" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)" style={{ filter: "drop-shadow(0 0 8px #06b6d480)" }} />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black text-white">{share}%</p>
        <p className="text-[10px] text-slate-500 font-mono uppercase">Market Share</p>
      </div>
    </div>
  );
}

export default function AdminCompetitiveIntel() {
  const [selectedCompetitors, setSelectedCompetitors] = useState(["samsara", "motive", "project44"]);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [activeTab, setActiveTab] = useState("radar");

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: () => base44.entities.Invoice.list(),
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total_amount || 0), 0);

  // Our competitive scores (out of 100)
  const ourScores = [92, 88, 85, 72, 45, 94, 81, 89];

  // Market position timeline
  const positionData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    nexus: 35 + i * 2 + Math.floor(Math.sin(i) * 3),
    samsara: 78 - i * 0.5,
    motive: 65 - i * 0.3,
    project44: 55 + Math.floor(Math.sin(i * 0.8) * 2),
  }));

  const runAIScan = async () => {
    setScanRunning(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a strategic intelligence analyst. Analyze the competitive landscape for NexusVectis, an enterprise fleet management and logistics AI platform operating in Europe. 
        
        Competitors: Samsara, Motive, project44, FourKites, Fleet Complete.
        
        Provide a JSON analysis with:
        - threats: array of 3 most critical competitive threats (each with title, description, urgency: "critical"|"high"|"medium")
        - opportunities: array of 3 strategic opportunities to exploit (each with title, description, potential: "massive"|"high"|"medium")  
        - whitespace: array of 2 underserved market niches NexusVectis could dominate
        - summary: one paragraph executive summary
        
        Be brutally honest and highly specific. Focus on AI/ML differentiation, European market dynamics, and 2025-2026 trends.`,
        response_json_schema: {
          type: "object",
          properties: {
            threats: { type: "array", items: { type: "object" } },
            opportunities: { type: "array", items: { type: "object" } },
            whitespace: { type: "array", items: { type: "object" } },
            summary: { type: "string" }
          }
        }
      });
      setScanResults(res);
      toast.success("AI Competitive Scan complete");
    } catch (e) {
      toast.error("Scan failed");
    }
    setScanRunning(false);
  };

  const visibleCompetitors = COMPETITORS.filter(c => selectedCompetitors.includes(c.id));

  return (
    <AdminLayout currentPage="AdminCompetitiveIntel">
      <div className="p-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Crosshair className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Competitive Intelligence</h1>
            </div>
            <p className="text-slate-400 text-sm">Real-time market positioning, threat detection & strategic whitespace analysis</p>
          </div>
          <Button onClick={runAIScan} disabled={scanRunning}
            className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white gap-2">
            {scanRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {scanRunning ? "Scanning..." : "Run AI Scan"}
          </Button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Market Position", value: "#7", sub: "EU Fleet AI", icon: Target, color: "#06b6d4", trend: "+2" },
            { label: "Customers", value: organizations.length, sub: "active orgs", icon: Globe, color: "#10b981", trend: `+${Math.max(0, organizations.length - 5)}` },
            { label: "Revenue (EUR)", value: `€${(totalRevenue / 1000).toFixed(0)}K`, sub: "total billed", icon: TrendingUp, color: "#f59e0b", trend: "+18%" },
            { label: "Innovation Score", value: "94/100", sub: "AI-first index", icon: Zap, color: "#8b5cf6", trend: "+6" },
            { label: "Churn Risk", value: "2.1%", sub: "last 90 days", icon: Shield, color: "#10b981", trend: "-0.4%" },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <NeonCard color={m.color}>
                <m.icon className="w-4 h-4 mb-2 opacity-60" style={{ color: m.color }} />
                <p className="text-2xl font-black text-white">{m.value}</p>
                <p className="text-xs text-slate-400">{m.label}</p>
                <p className="text-[10px] text-slate-600 mt-1">{m.sub}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-mono">{m.trend}</span>
                </div>
              </NeonCard>
            </motion.div>
          ))}
        </div>

        {/* Competitor selector */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-slate-500 text-xs font-mono uppercase mr-2">Compare vs:</span>
          {COMPETITORS.map(c => (
            <button key={c.id}
              onClick={() => setSelectedCompetitors(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{
                background: selectedCompetitors.includes(c.id) ? `${c.color}15` : "rgba(15,23,42,0.5)",
                borderColor: selectedCompetitors.includes(c.id) ? `${c.color}40` : "rgba(51,65,85,0.4)",
                color: selectedCompetitors.includes(c.id) ? c.color : "#64748b"
              }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Main charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Radar */}
          <NeonCard color="#06b6d4">
            <h3 className="text-white font-semibold mb-1">Multi-Dimensional Positioning</h3>
            <p className="text-slate-500 text-xs mb-4">8-axis competitive scorecard vs selected rivals</p>
            <CompetitorRadar competitors={visibleCompetitors} ourScores={ourScores} />
          </NeonCard>

          {/* Market share + timeline */}
          <div className="space-y-4">
            <NeonCard color="#8b5cf6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">EU Market Share (est.)</h3>
                  <p className="text-slate-500 text-xs">Enterprise Fleet AI segment</p>
                </div>
                <MarketShareGauge share={8} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[{ name: "Samsara", pct: 31, color: "#ef4444" }, { name: "Motive", pct: 24, color: "#f59e0b" }, { name: "Others", pct: 37, color: "#475569" }].map(c => (
                  <div key={c.name} className="text-center">
                    <p className="text-xs font-bold" style={{ color: c.color }}>{c.pct}%</p>
                    <p className="text-[9px] text-slate-600">{c.name}</p>
                  </div>
                ))}
              </div>
            </NeonCard>

            <NeonCard color="#10b981">
              <h3 className="text-white font-semibold mb-3 text-sm">Market Position Trajectory (12m)</h3>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={positionData}>
                  <XAxis dataKey="month" stroke="#334155" tick={{ fontSize: 8 }} />
                  <YAxis stroke="#334155" tick={{ fontSize: 8 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }} />
                  <Line dataKey="nexus" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="NexusVectis" />
                  {visibleCompetitors.map(c => (
                    <Line key={c.id} dataKey={c.id} stroke={c.color} strokeWidth={1} dot={false} strokeDasharray="4 2" name={c.name} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </NeonCard>
          </div>
        </div>

        {/* AI Scan Results */}
        <AnimatePresence>
          {scanResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8">
              <NeonCard color="#8b5cf6">
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <h3 className="text-white font-bold">AI Strategic Intelligence Report</h3>
                  <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/25 text-[9px] ml-2">LIVE ANALYSIS</Badge>
                </div>

                {scanResults.summary && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/40 mb-5">
                    <p className="text-slate-300 text-sm leading-relaxed">{scanResults.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {/* Threats */}
                  <div>
                    <p className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3">⚠ Threats</p>
                    <div className="space-y-2">
                      {(scanResults.threats || []).map((t, i) => (
                        <div key={i} className="p-3 rounded-xl border bg-red-500/5 border-red-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge className={`text-[8px] ${t.urgency === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/25"}`}>{t.urgency}</Badge>
                          </div>
                          <p className="text-white text-xs font-semibold">{t.title}</p>
                          <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div>
                    <p className="text-green-400 text-xs font-mono uppercase tracking-wider mb-3">✦ Opportunities</p>
                    <div className="space-y-2">
                      {(scanResults.opportunities || []).map((o, i) => (
                        <div key={i} className="p-3 rounded-xl border bg-green-500/5 border-green-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge className="text-[8px] bg-green-500/15 text-green-400 border-green-500/25">{o.potential}</Badge>
                          </div>
                          <p className="text-white text-xs font-semibold">{o.title}</p>
                          <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{o.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Whitespace */}
                  <div>
                    <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-3">◈ Market Whitespace</p>
                    <div className="space-y-2">
                      {(scanResults.whitespace || []).map((w, i) => (
                        <div key={i} className="p-3 rounded-xl border bg-cyan-500/5 border-cyan-500/20">
                          <p className="text-white text-xs font-semibold">{w.title || w.niche || `Whitespace ${i + 1}`}</p>
                          <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">{w.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </NeonCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Competitive scorecard table */}
        <NeonCard color="#06b6d4">
          <h3 className="text-white font-semibold mb-4">Full Competitive Scorecard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left text-slate-500 font-mono uppercase py-2 pr-4">Dimension</th>
                  <th className="text-center text-cyan-400 font-bold py-2 px-3">NexusVectis</th>
                  {visibleCompetitors.map(c => (
                    <th key={c.id} className="text-center py-2 px-3 font-medium" style={{ color: c.color }}>{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((dim, i) => {
                  const ourScore = ourScores[i];
                  return (
                    <tr key={dim} className="border-b border-slate-900/60 hover:bg-slate-900/30 transition-colors">
                      <td className="text-slate-400 py-2.5 pr-4">{dim}</td>
                      <td className="text-center py-2.5 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${ourScore}%` }} />
                          </div>
                          <span className="text-white font-bold w-6">{ourScore}</span>
                        </div>
                      </td>
                      {visibleCompetitors.map((c, ci) => {
                        const seed = c.id.charCodeAt(0) + i * 7;
                        const score = 45 + (seed * 17 + i * 13) % 45;
                        const isWinning = ourScore > score;
                        return (
                          <td key={c.id} className="text-center py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`font-medium ${isWinning ? "text-green-400" : "text-red-400"}`}>{score}</span>
                              {isWinning ? <ArrowUpRight className="w-3 h-3 text-green-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </NeonCard>
      </div>
    </AdminLayout>
  );
}