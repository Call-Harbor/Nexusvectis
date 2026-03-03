import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, ListTodo, AlertTriangle, BarChart3, Loader2,
  ChevronDown, ChevronRight, RefreshCw, Target, Clock, CheckCircle2, XCircle
} from "lucide-react";

const TABS = [
  { id: "tasks", label: "Task Generator", icon: ListTodo, color: "text-amber-400" },
  { id: "summary", label: "Project Summary", icon: BarChart3, color: "text-cyan-400" },
  { id: "risks", label: "Risk Register", icon: AlertTriangle, color: "text-red-400" },
];

const STATUS_COLORS = {
  "🟢": "text-emerald-400",
  "🟡": "text-amber-400",
  "🔴": "text-red-400",
};

export default function ProjectManagementPanel({ orgId }) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [projectInput, setProjectInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const prompts = {
    tasks: (name) => `Generate a comprehensive project task list for: "${name}"

Structure the response as a detailed Work Breakdown Structure (WBS) with:
1. **Project Phases** (Discovery, Planning, Execution, Testing, Launch, Post-Launch)
2. For each phase, list 3-5 tasks with:
   - Task title
   - Priority: 🔴 Critical / 🟡 Medium / 🟢 Low
   - Status: 🟢 On Track / 🟡 At Risk / 🔴 Critical
   - Estimated duration
   - Suggested owner/role
   - Dependencies (if any)
3. **Milestones** with target dates
4. **Critical Path** - which tasks block others?
5. **Quick Wins** - what can be done in the first week?

Format as a structured, actionable plan ready for a project manager.`,

    summary: (name) => `Generate a detailed weekly executive project summary for: "${name}"

Include:
1. **Overall Status**: 🟢 On Track / 🟡 At Risk / 🔴 Critical (with reason)
2. **Progress Overview**: % completion per phase
3. **Completed This Week**: Bulleted list of achievements
4. **Blockers & Issues**: What's stopping progress (with severity)
5. **Next Steps (7 days)**: Prioritized action items
6. **KPIs**: Schedule adherence, budget burn rate, team velocity
7. **Decisions Needed**: Items requiring stakeholder attention
8. **Risk Pulse**: Top 3 active risks this week
9. **Team Highlights**: Wins and recognition
10. **Forecast**: Will the project hit its deadline? Confidence %

Write in a concise, executive-ready style.`,

    risks: (name) => `Generate a comprehensive risk register for project: "${name}"

For each risk, provide:
1. **Risk Name** & Category (Technical / Resource / Schedule / Budget / External)
2. **Description**: What could go wrong and why
3. **Probability**: High / Medium / Low (with %)
4. **Impact**: Critical / High / Medium / Low
5. **Risk Score**: Probability × Impact matrix
6. **Traffic Light**: 🔴 Critical / 🟡 Monitor / 🟢 Acceptable
7. **Mitigation Strategy**: Concrete steps to reduce likelihood
8. **Contingency Plan**: What to do if it materializes
9. **Owner**: Who is responsible for managing this risk
10. **Early Warning Signs**: How to detect it early

Include at least 8-10 risks covering: scope creep, resource constraints, technical debt, third-party dependencies, security, budget overrun, timeline slippage, and stakeholder alignment.`,
  };

  const run = async () => {
    if (!projectInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const prompt = prompts[activeTab](projectInput.trim());
      const res = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });
      setResult(typeof res === "string" ? res : res?.output || res?.text || JSON.stringify(res));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const activeTabMeta = TABS.find(t => t.id === activeTab);
  const Icon = activeTabMeta?.icon || Sparkles;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white" style={{ minHeight: 400 }}>
      {/* Tabs */}
      <div className="flex border-b border-slate-800/60 px-4 pt-3 gap-1 flex-shrink-0">
        {TABS.map(tab => {
          const T = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setError(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? `${tab.color} border-current bg-slate-800/50`
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              <T className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={projectInput}
              onChange={e => setProjectInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
              placeholder={`Enter project name or description...`}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <Button
            onClick={run}
            disabled={loading || !projectInput.trim()}
            className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 px-4 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Icon className="w-4 h-4 mr-1.5" />Generate</>}
          </Button>
        </div>

        {/* Quick examples */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {["Fleet Expansion 2026", "New ERP Implementation", "Route Optimization Initiative", "AI Integration Project"].map(ex => (
            <button key={ex} onClick={() => setProjectInput(ex)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-slate-700/40 hover:border-slate-600 transition-all">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <Icon className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-slate-400 text-sm">Generating AI analysis...</p>
              <div className="flex gap-1">
                {[0, 0.15, 0.3].map(d => <div key={d} className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-pulse" style={{ animationDelay: `${d}s` }} />)}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {result && !loading && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Analysis complete</span>
                </div>
                <Button variant="ghost" size="sm" onClick={run} className="text-slate-500 hover:text-cyan-400 h-7 px-2">
                  <RefreshCw className="w-3 h-3 mr-1" />Regenerate
                </Button>
              </div>

              <div className="prose prose-sm prose-invert max-w-none
                prose-headings:text-cyan-300 prose-headings:font-bold
                prose-strong:text-white
                prose-ul:text-slate-300 prose-li:text-slate-300
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-code:text-amber-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded
                prose-blockquote:border-cyan-500 prose-blockquote:text-slate-400
                [&_table]:w-full [&_table]:border-collapse [&_th]:bg-slate-800 [&_th]:p-2 [&_th]:text-xs [&_th]:text-cyan-300 [&_th]:border [&_th]:border-slate-700
                [&_td]:p-2 [&_td]:text-xs [&_td]:border [&_td]:border-slate-800 [&_td]:text-slate-300
                [&_tr:hover_td]:bg-slate-800/40
                [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </motion.div>
          )}

          {!loading && !result && !error && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Icon className={`w-7 h-7 ${activeTabMeta?.color}`} />
              </div>
              <p className="text-slate-400 text-sm font-medium">{activeTabMeta?.label}</p>
              <p className="text-slate-600 text-xs max-w-xs">
                {activeTab === "tasks" && "Enter a project name to generate a structured WBS with tasks, priorities, milestones and critical path."}
                {activeTab === "summary" && "Enter a project name to get an executive weekly summary with KPIs, blockers, and forecasts."}
                {activeTab === "risks" && "Enter a project name to generate a full risk register with mitigation strategies and contingency plans."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}