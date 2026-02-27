import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  GraduationCap, Brain, Zap, CheckCircle2, XCircle, ChevronRight, ChevronDown,
  Star, Trophy, Target, Loader2, Send, RefreshCw, TrendingUp, Lightbulb,
  Award, Flame, Shield, Clock, BarChart3, Cpu, GitBranch, Activity,
  Sparkles, Lock, Unlock, AlertTriangle, ArrowRight, Eye, EyeOff, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from 'recharts';

/* ─── Constants ─── */
const TRACKS = [
  { id: 'fleet_basics',    label: 'Fleet Operations',         icon: '🚛', color: 'from-cyan-500 to-blue-600',    border: 'border-cyan-500/40',    glow: 'shadow-cyan-500/20',    desc: 'Vehicle management, routing & logistics fundamentals', topics: ['Vehicle types', 'Route planning', 'Load optimization', 'KPIs', 'Cost control'] },
  { id: 'ai_analytics',   label: 'AI & Fleet Intelligence',  icon: '🤖', color: 'from-violet-500 to-purple-700', border: 'border-violet-500/40',  glow: 'shadow-violet-500/20',  desc: 'Fleet AI commands, predictive analytics & data interpretation', topics: ['AI predictions', 'Anomaly detection', 'Data analysis', 'Automation', 'ML concepts'] },
  { id: 'maintenance',    label: 'Predictive Maintenance',   icon: '🔧', color: 'from-amber-500 to-orange-600',  border: 'border-amber-500/40',   glow: 'shadow-amber-500/20',   desc: 'Failure prediction, maintenance scheduling & cost optimization', topics: ['Failure modes', 'MTBF/MTTR', 'Predictive models', 'Cost analysis', 'Parts planning'] },
  { id: 'sustainability', label: 'Green & Sustainability',   icon: '🌱', color: 'from-emerald-500 to-green-600', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20', desc: 'CO2 reduction, fuel efficiency & eco-routing strategies', topics: ['Emissions calc', 'Eco-driving', 'EV transition', 'Carbon reporting', 'Green KPIs'] },
  { id: 'crisis',         label: 'Crisis & Risk Management', icon: '⚡', color: 'from-rose-500 to-red-700',     border: 'border-rose-500/40',    glow: 'shadow-rose-500/20',    desc: 'Disruptions, exceptions, SLA breaches & emergency response', topics: ['Risk matrix', 'Exception handling', 'SLA management', 'Contingency', 'Insurance'] },
];

const LEVEL_LABELS = { 1: 'Rookie', 2: 'Operator', 3: 'Analyst', 4: 'Strategist', 5: 'Master AI' };
const LEVEL_COLORS = { 1: 'text-slate-400', 2: 'text-cyan-400', 3: 'text-violet-400', 4: 'text-amber-400', 5: 'text-rose-400' };
const LEVEL_BG    = { 1: 'from-slate-500/20 to-slate-600/10', 2: 'from-cyan-500/20 to-blue-600/10', 3: 'from-violet-500/20 to-purple-600/10', 4: 'from-amber-500/20 to-orange-600/10', 5: 'from-rose-500/20 to-red-600/10' };
const XP_PER_LEVEL = [0, 0, 150, 350, 650, 1100]; // cumulative XP needed for each level

const ACHIEVEMENTS = [
  { id: 'first_blood',   icon: '🎯', label: 'First Strike',     desc: 'Complete your first task',        cond: (s) => s.tasksCompleted >= 1 },
  { id: 'streak3',       icon: '🔥', label: 'On Fire',          desc: '3 correct answers in a row',      cond: (s) => s.streak >= 3 },
  { id: 'streak5',       icon: '💥', label: 'Unstoppable',      desc: '5 correct answers in a row',      cond: (s) => s.streak >= 5 },
  { id: 'perfectstar',   icon: '⭐', label: 'Perfectionist',    desc: 'Score 3 stars on a task',         cond: (s) => s.maxStars >= 3 },
  { id: 'lvl2',          icon: '🚀', label: 'Leveling Up',      desc: 'Reach Level 2',                   cond: (s) => s.level >= 2 },
  { id: 'lvl3',          icon: '🧠', label: 'Deep Thinker',     desc: 'Reach Level 3',                   cond: (s) => s.level >= 3 },
  { id: 'xp500',         icon: '💎', label: 'XP Diamond',       desc: 'Earn 500 total XP',               cond: (s) => s.totalXp >= 500 },
  { id: 'speed',         icon: '⚡', label: 'Speed Runner',     desc: 'Answer in under 30 seconds',      cond: (s) => s.fastAnswer === true },
  { id: 'boss',          icon: '👑', label: 'Boss Slayer',      desc: 'Complete a Boss Challenge',       cond: (s) => s.bossCompleted >= 1 },
];

const TASK_TYPES = {
  multiple_choice:  { label: 'Multiple Choice', icon: '🔘', color: 'text-cyan-400' },
  open_question:    { label: 'Open Analysis',   icon: '📝', color: 'text-violet-400' },
  scenario_analysis:{ label: 'Scenario Sim',    icon: '🎭', color: 'text-amber-400' },
  data_challenge:   { label: 'Data Challenge',  icon: '📊', color: 'text-emerald-400' },
  boss_challenge:   { label: 'BOSS CHALLENGE',  icon: '👑', color: 'text-rose-400' },
};

/* ─── Hologram Typing Effect ─── */
function HologramText({ text, speed = 18, className = '' }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-px align-middle" />}
    </span>
  );
}

/* ─── Skill Radar ─── */
function SkillRadar({ skills }) {
  const data = Object.entries(skills).map(([area, val]) => ({ area, val }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={data}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="area" tick={{ fontSize: 9, fill: '#64748b' }} />
        <Radar dataKey="val" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ─── XP Progress ─── */
function XPBar({ session }) {
  const lvl = session.level;
  const from = XP_PER_LEVEL[lvl] || 0;
  const to   = XP_PER_LEVEL[lvl + 1] || from + 200;
  const pct  = Math.min(100, ((session.totalXp - from) / (to - from)) * 100);
  const color = ['', 'bg-slate-400', 'bg-cyan-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400'][lvl] || 'bg-cyan-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className={`font-bold ${LEVEL_COLORS[lvl]}`}>Lv.{lvl} {LEVEL_LABELS[lvl]}</span>
        <span className="text-slate-400">{session.totalXp - from}/{to - from} XP to Lv.{lvl+1}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

/* ─── Timer Ring ─── */
function TimerRing({ seconds, maxSeconds }) {
  const pct = Math.max(0, seconds / maxSeconds);
  const color = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
      </svg>
      <span className={`text-sm font-black relative z-10`} style={{ color }}>{seconds}</span>
    </div>
  );
}

/* ─── Achievement Toast ─── */
function AchievementToast({ achievement, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
      className="fixed top-16 right-4 z-[200] p-4 rounded-2xl border border-amber-500/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-amber-500/20 flex items-center gap-3 max-w-xs"
    >
      <span className="text-3xl">{achievement.icon}</span>
      <div>
        <p className="text-amber-300 font-black text-sm">Achievement Unlocked!</p>
        <p className="text-white font-bold text-xs">{achievement.label}</p>
        <p className="text-slate-400 text-[10px]">{achievement.desc}</p>
      </div>
    </motion.div>
  );
}

/* ─── Level Up Splash ─── */
function LevelUpSplash({ level, onDismiss }) {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      {particles.map(i => (
        <motion.div key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: ['#06b6d4','#8b5cf6','#f59e0b','#10b981'][i%4] }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: (Math.random()-0.5)*600, y: (Math.random()-0.5)*600, opacity: 0 }}
          transition={{ duration: 1.2, delay: i*0.04 }}
        />
      ))}
      <div className="text-center space-y-5 relative z-10">
        <motion.div animate={{ rotate: [0,-15,15,-15,15,0], scale: [1,1.3,1] }} transition={{ duration: 0.8 }}>
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-amber-400/40 scale-150" />
            <Trophy className="w-28 h-28 text-amber-400 relative drop-shadow-[0_0_40px_rgba(251,191,36,1)]" />
          </div>
        </motion.div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
          <p className="text-amber-300 text-5xl font-black tracking-tight">LEVEL UP!</p>
          <div className={`inline-block mt-2 px-6 py-2 rounded-xl bg-gradient-to-r ${LEVEL_BG[level]} border border-amber-500/30`}>
            <p className={`text-2xl font-black ${LEVEL_COLORS[level]}`}>Level {level} — {LEVEL_LABELS[level]}</p>
          </div>
        </motion.div>
        <p className="text-slate-400 text-sm">The AI will now generate harder, more nuanced challenges</p>
        <Button onClick={onDismiss} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black px-10 py-3 text-lg">
          Continue →
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Boss Intro ─── */
function BossIntro({ onStart }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-2xl border-2 border-rose-500/60 bg-rose-500/5 text-center space-y-4"
    >
      <div className="relative inline-block">
        <div className="absolute inset-0 blur-2xl bg-rose-500/30 scale-150 animate-pulse" />
        <span className="text-6xl relative">👑</span>
      </div>
      <p className="text-rose-400 text-xl font-black tracking-wider">BOSS CHALLENGE</p>
      <p className="text-slate-300 text-sm">You've proven yourself. Face the ultimate multi-part scenario — only the best advance.</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['⏱ Timed', '90 sec'], ['🎯 Multi-part', '3 sections'], ['💎 Reward', '150+ XP']].map(([k,v],i)=>(
          <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-rose-500/20">
            <p className="text-rose-300 text-xs font-bold">{k}</p>
            <p className="text-white text-[11px]">{v}</p>
          </div>
        ))}
      </div>
      <Button onClick={onStart} className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 font-black text-lg py-3">
        <Flame className="w-5 h-5 mr-2" /> Accept Challenge
      </Button>
    </motion.div>
  );
}

/* ─── Task Card ─── */
function TaskCard({ task, onSubmit, isLoading, timedMode, onTimeUp }) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timedMode ? (task.time_limit || 60) : null);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timedMode) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); onTimeUp?.(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timedMode]);

  const isMultiChoice = task.type === 'multiple_choice';
  const isBoss = task.type === 'boss_challenge';
  const typeInfo = TASK_TYPES[task.type] || TASK_TYPES.open_question;

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    const val = isMultiChoice ? selectedOption : answer.trim();
    if (!val) return;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    onSubmit(val, elapsed);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`rounded-2xl border overflow-hidden ${isBoss ? 'border-rose-500/50' : 'border-cyan-500/25'}`}
      style={isBoss ? { boxShadow: '0 0 30px rgba(239,68,68,0.15)' } : {}}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-800/50 flex items-center gap-3 ${isBoss ? 'bg-gradient-to-r from-rose-500/15 to-red-600/10' : 'bg-gradient-to-r from-slate-900/80 to-slate-800/40'}`}>
        <span className="text-xl">{typeInfo.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-black text-sm truncate">{task.title}</p>
            <Badge className={`text-[9px] uppercase font-bold ${typeInfo.color} bg-slate-900 border-slate-700`}>{typeInfo.label}</Badge>
            <Badge className="text-[9px] bg-violet-500/20 text-violet-300 border-violet-500/30 font-bold">+{task.xp_reward} XP</Badge>
            {task.combo_multiplier > 1 && (
              <Badge className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/30 font-black">x{task.combo_multiplier} COMBO</Badge>
            )}
          </div>
          <p className="text-slate-500 text-[10px] mt-0.5">{task.difficulty_label}</p>
        </div>
        {timedMode && timeLeft !== null && (
          <TimerRing seconds={timeLeft} maxSeconds={task.time_limit || 60} />
        )}
      </div>

      {/* Curriculum breadcrumb */}
      {task.curriculum_position && (
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/30 flex items-center gap-1 text-[10px] text-slate-500">
          <BookOpen className="w-3 h-3" />
          {task.curriculum_position.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-40" />}
              <span className={i === task.curriculum_position.length - 1 ? 'text-cyan-400' : ''}>{p}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Description with hologram effect for boss */}
        <div className="prose prose-sm prose-invert max-w-none">
          {isBoss
            ? <ReactMarkdown className="text-slate-200 text-sm leading-relaxed font-medium">{task.description}</ReactMarkdown>
            : <ReactMarkdown className="text-slate-200 text-sm leading-relaxed">{task.description}</ReactMarkdown>
          }
        </div>

        {/* Data table if task has it */}
        {task.data_table && (
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60">
                <tr>{task.data_table[0]?.map((h,i) => <th key={i} className="px-3 py-2 text-slate-300 font-bold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {task.data_table.slice(1).map((row, ri) => (
                  <tr key={ri} className={`border-t border-slate-800/50 ${ri%2===0?'bg-slate-900/20':''}`}>
                    {row.map((cell,ci) => <td key={ci} className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hint toggle */}
        {task.hint && (
          <button onClick={() => setShowHint(v => !v)} className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 text-xs transition-colors">
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? 'Hide hint' : 'Show hint (-5 XP)'}
          </button>
        )}
        {showHint && task.hint && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-amber-200 text-xs">{task.hint}</p>
          </motion.div>
        )}

        {/* Multiple choice */}
        {isMultiChoice && task.options && (
          <div className="space-y-2">
            {task.options.map((opt, i) => (
              <motion.button key={i} whileHover={{ x: 4 }} onClick={() => setSelectedOption(opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selectedOption === opt
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-slate-700/40 bg-slate-800/30 text-slate-300 hover:border-slate-600/70 hover:bg-slate-800/60'
                }`}
              >
                <span className={`font-black mr-2.5 ${selectedOption === opt ? 'text-cyan-400' : 'text-slate-500'}`}>{String.fromCharCode(65+i)}.</span>
                {opt}
              </motion.button>
            ))}
          </div>
        )}

        {/* Open / scenario / boss text area */}
        {!isMultiChoice && (
          <div className="space-y-2">
            {isBoss && <p className="text-rose-300/70 text-xs">⚡ Boss mode: Be exhaustive. Address all aspects for full XP.</p>}
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
              placeholder={isBoss ? 'Your comprehensive answer… (Ctrl+Enter)' : 'Your answer… (Ctrl+Enter to submit)'}
              rows={isBoss ? 7 : 4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/60 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 resize-none transition-all leading-relaxed"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || (isMultiChoice ? !selectedOption : !answer.trim())}
          className={`w-full font-black text-sm py-3 ${isBoss
            ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
            : 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600'}`}
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />AI Evaluating…</>
                     : <><Send className="w-4 h-4 mr-2" />Submit Answer</>}
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Feedback Card ─── */
function FeedbackCard({ feedback, onNext, onRetry, session }) {
  const passed = feedback.passed;
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border overflow-hidden ${passed ? 'border-emerald-500/40' : 'border-red-500/40'}`}
    >
      {/* Result banner */}
      <div className={`px-4 py-4 flex items-center gap-3 ${passed ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10' : 'bg-gradient-to-r from-red-500/15 to-rose-500/10'}`}>
        <motion.div animate={passed ? { scale: [1,1.3,1] } : { x: [-4,4,-4,4,0] }} transition={{ duration: 0.5 }}>
          {passed ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
        </motion.div>
        <div className="flex-1">
          <p className={`font-black text-base ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
            {passed ? `Correct! +${feedback.xp_earned} XP` : 'Incorrect'}
          </p>
          {feedback.speed_bonus > 0 && <p className="text-amber-300 text-xs font-bold">⚡ Speed bonus: +{feedback.speed_bonus} XP</p>}
        </div>
        {passed && feedback.stars && (
          <div className="flex gap-0.5">
            {[1,2,3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.15 }}>
                <Star className={`w-5 h-5 ${s <= feedback.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Explanation */}
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown className="text-slate-200 text-sm leading-relaxed">{feedback.explanation}</ReactMarkdown>
        </div>

        {/* Correct answer if failed */}
        {feedback.correct_answer && !passed && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <p className="text-slate-500 text-[10px] uppercase mb-1">Model Answer</p>
            <p className="text-emerald-300 text-sm">{feedback.correct_answer}</p>
          </div>
        )}

        {/* Deep dive toggle */}
        {feedback.deep_insight && (
          <button onClick={() => setExpanded(v=>!v)} className="flex items-center gap-1.5 text-violet-400/70 hover:text-violet-300 text-xs transition-colors">
            <Brain className="w-3.5 h-3.5" />
            {expanded ? 'Hide deep insight' : 'View deep insight →'}
          </button>
        )}
        {expanded && feedback.deep_insight && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <p className="text-violet-200 text-xs leading-relaxed">{feedback.deep_insight}</p>
          </motion.div>
        )}

        {/* Skill impact */}
        {feedback.skill_impact && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(feedback.skill_impact).map(([skill, delta]) => (
              <span key={skill} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${delta > 0 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'}`}>
                {delta > 0 ? '↑' : '↓'} {skill}
              </span>
            ))}
          </div>
        )}

        {/* Next teaser */}
        {feedback.next_hint && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
            <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-cyan-200 text-xs">{feedback.next_hint}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!passed && (
            <Button onClick={onRetry} variant="outline" className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
            </Button>
          )}
          <Button onClick={onNext} className={`${passed ? 'w-full' : 'flex-1'} bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 font-bold`}>
            <ChevronRight className="w-4 h-4 mr-1.5" /> {passed ? 'Next Challenge' : 'Skip & Continue'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Performance Dashboard ─── */
function PerformanceDashboard({ session, history, onClose }) {
  const accuracyData = history.slice(-10).map((h, i) => ({ i: i + 1, passed: h.passed ? 1 : 0, stars: h.stars || 0 }));
  const avgStars = history.length ? (history.reduce((s,h) => s + (h.stars||0), 0) / history.length).toFixed(1) : 0;
  const accuracy = history.length ? Math.round(history.filter(h => h.passed).length / history.length * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/50 bg-slate-900/80 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <p className="text-white font-bold text-sm">Performance Dashboard</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xs">✕</button>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Avg Stars', value: avgStars, color: 'text-amber-400' },
            { label: 'Total XP', value: session.totalXp, color: 'text-violet-400' },
          ].map((s,i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {history.length >= 3 && (
          <div>
            <p className="text-slate-500 text-[10px] uppercase mb-2">Last 10 Tasks</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={accuracyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="i" tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis domain={[0,3]} tick={{ fontSize: 8, fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="stars" fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {session.skills && (
          <div>
            <p className="text-slate-500 text-[10px] uppercase mb-1">Skill Radar</p>
            <SkillRadar skills={session.skills} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────── MAIN ──────────────────────────── */
const BookOpen = GraduationCap; // alias

export default function CourseAIEngine({ vehicles = [], routes = [], shipments = [] }) {
  const [phase, setPhase] = useState('track_select');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [session, setSession] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [history, setHistory] = useState([]);
  const [assessmentAnswer, setAssessmentAnswer] = useState('');
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [pendingBoss, setPendingBoss] = useState(false);
  const [bossStarted, setBossStarted] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [showHintBar, setShowHintBar] = useState(false);
  const achievementQueueRef = useRef([]);

  const contextSummary = `${vehicles.length} vehicles (${vehicles.filter(v=>v.status==='active').length} active), ${routes.length} routes, ${shipments.length} shipments.`;

  /* ── Check achievements ── */
  const checkAchievements = useCallback((sess, fastAnswer = false) => {
    const enriched = { ...sess, fastAnswer };
    const newly = ACHIEVEMENTS.filter(a =>
      !unlockedAchievements.includes(a.id) && a.cond(enriched)
    );
    if (newly.length) {
      setUnlockedAchievements(prev => [...prev, ...newly.map(a => a.id)]);
      achievementQueueRef.current = [...achievementQueueRef.current, ...newly];
      if (achievementQueueRef.current.length === newly.length) {
        showNextAchievement();
      }
    }
  }, [unlockedAchievements]);

  const showNextAchievement = () => {
    if (achievementQueueRef.current.length === 0) return;
    const next = achievementQueueRef.current[0];
    setNewAchievements([next]);
    setTimeout(() => {
      achievementQueueRef.current = achievementQueueRef.current.slice(1);
      setNewAchievements([]);
      setTimeout(showNextAchievement, 300);
    }, 3800);
  };

  /* ── Assessment ── */
  const startAssessment = (track) => { setSelectedTrack(track); setPhase('assessment'); };

  const submitAssessment = async () => {
    setAssessmentLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite adaptive learning AI for fleet management certification.
A professional is starting the "${selectedTrack.label}" learning track.
Self-assessment response: "${assessmentAnswer}"

Determine their starting level (1=Rookie, 2=Operator, 3=Analyst, 4=Strategist) and initial skill scores.
Return JSON:
{
  "level": 1-4,
  "rationale": "2 sentences of technical reasoning",
  "encouragement": "personalized motivational message",
  "skills": { "Knowledge": 0-100, "Speed": 0-100, "Accuracy": 0-100, "Strategy": 0-100, "Innovation": 0-100 }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            level: { type: 'number' },
            rationale: { type: 'string' },
            encouragement: { type: 'string' },
            skills: { type: 'object', additionalProperties: true }
          }
        }
      });
      const lvl = Math.max(1, Math.min(4, res.level || 1));
      setSession({ level: lvl, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0, maxStars: 0, bossCompleted: 0,
        rationale: res.rationale, encouragement: res.encouragement,
        skills: res.skills || { Knowledge: 40, Speed: 40, Accuracy: 40, Strategy: 40, Innovation: 40 } });
      setAssessmentDone(true);
    } catch {
      setSession({ level: 1, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0, maxStars: 0, bossCompleted: 0,
        skills: { Knowledge: 30, Speed: 30, Accuracy: 30, Strategy: 30, Innovation: 30 } });
      setAssessmentDone(true);
    } finally { setAssessmentLoading(false); }
  };

  const skipAssessment = () => {
    setSession({ level: 1, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0, maxStars: 0, bossCompleted: 0,
      skills: { Knowledge: 25, Speed: 25, Accuracy: 25, Strategy: 25, Innovation: 25 } });
    setAssessmentDone(true);
  };

  useEffect(() => {
    if (assessmentDone && session) { setPhase('learning'); generateTask(session); }
  }, [assessmentDone]);

  /* ── Generate Task ── */
  const generateTask = async (sess) => {
    setLoadingTask(true);
    setFeedback(null);
    setBossStarted(false);

    // Boss every 5 tasks
    const isBossTime = sess.tasksCompleted > 0 && sess.tasksCompleted % 5 === 0;
    if (isBossTime) { setPendingBoss(true); setLoadingTask(false); return; }
    setPendingBoss(false);

    const recentResults = history.slice(-6).map(h => `task:"${h.taskTitle}" passed:${h.passed} stars:${h.stars||0}`).join(' | ');
    const perfTrend = history.length >= 3
      ? history.slice(-3).filter(h => h.passed).length >= 2 ? 'push harder' : 'ease slightly'
      : 'calibrate';

    // Enable timed mode for level 3+
    const shouldTime = sess.level >= 3;
    setTimedMode(shouldTime);

    try {
      const task = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite Fleet Management AI tutor generating ONE highly engaging, realistic task.

Track: ${selectedTrack?.label}
Topics in track: ${selectedTrack?.topics?.join(', ')}
Student level: ${sess.level}/5 (${LEVEL_LABELS[sess.level]})
Tasks completed: ${sess.tasksCompleted}
Streak: ${sess.streak}
Skill scores: ${JSON.stringify(sess.skills)}
Performance trend: ${perfTrend}
Recent tasks: ${recentResults || 'none'}
Fleet context: ${contextSummary}
Timed mode: ${shouldTime}

Generate a highly realistic task. For level 3+ use actual numeric data and multi-step reasoning. Add variety across types.

Return JSON:
{
  "title": "Concise task title",
  "type": "multiple_choice|open_question|scenario_analysis|data_challenge",
  "difficulty_label": "Level X — Label",
  "description": "Rich markdown task. Use **bold**, bullet lists, real numbers. For scenario_analysis: describe a fleet crisis or business decision. For data_challenge: include specific metrics the student must interpret.",
  "options": ["A","B","C","D"],
  "data_table": [["Col1","Col2","Col3"],["row1val1","row1val2","row1val3"]],
  "hint": "A hint string or null",
  "xp_reward": 20-80,
  "time_limit": 45-90,
  "combo_multiplier": 1-3,
  "correct_answer_key": "ideal answer for evaluation",
  "curriculum_position": ["${selectedTrack?.label}", "subtopic", "specific concept"],
  "skill_tags": ["Knowledge","Strategy"]
}
Only include "options" for multiple_choice. Only include "data_table" for data_challenge. Omit otherwise.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' }, type: { type: 'string' }, difficulty_label: { type: 'string' },
            description: { type: 'string' }, options: { type: 'array', items: { type: 'string' } },
            data_table: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
            hint: { type: 'string' }, xp_reward: { type: 'number' }, time_limit: { type: 'number' },
            combo_multiplier: { type: 'number' }, correct_answer_key: { type: 'string' },
            curriculum_position: { type: 'array', items: { type: 'string' } },
            skill_tags: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setCurrentTask({ ...task, combo_multiplier: sess.streak >= 3 ? Math.min(3, Math.floor(sess.streak / 3) + 1) : 1 });
    } catch (e) { console.error(e); }
    finally { setLoadingTask(false); }
  };

  /* ── Evaluate Answer ── */
  const evaluateAnswer = async (answer, elapsedSec = 60) => {
    setLoadingEval(true);
    const isFast = elapsedSec < 30;
    try {
      const ev = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Fleet AI tutor evaluating a student response with surgical precision.

Track: ${selectedTrack?.label}
Student level: ${session.level}/5 (${LEVEL_LABELS[session.level]})
Task: "${currentTask.title}"
Type: ${currentTask.type}
Task description: ${currentTask.description}
Correct answer key: ${currentTask.correct_answer_key}
Student answer: "${answer}"
Time taken: ${elapsedSec}s ${isFast ? '(FAST — under 30s)' : ''}
Combo multiplier: ${currentTask.combo_multiplier || 1}x

Evaluate rigorously but constructively. For open/scenario questions, look for correct concepts not exact wording.
Award speed bonus of 10 XP if fast and correct.

Return JSON:
{
  "passed": true/false,
  "stars": 1-3,
  "xp_earned": 0-${(currentTask.xp_reward||40) * (currentTask.combo_multiplier||1)},
  "speed_bonus": 0 or 10,
  "explanation": "Detailed markdown feedback. Reference specific parts of their answer. Add industry context.",
  "correct_answer": "Model answer if they failed",
  "deep_insight": "1 expert-level insight about this topic they should internalize",
  "next_hint": "Teaser of the next concept in the curriculum",
  "difficulty_adjust": -1|0|1,
  "skill_impact": {"Knowledge": +5, "Strategy": +3}
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' }, stars: { type: 'number' }, xp_earned: { type: 'number' },
            speed_bonus: { type: 'number' }, explanation: { type: 'string' }, correct_answer: { type: 'string' },
            deep_insight: { type: 'string' }, next_hint: { type: 'string' }, difficulty_adjust: { type: 'number' },
            skill_impact: { type: 'object', additionalProperties: true }
          }
        }
      });

      setFeedback(ev);

      setSession(prev => {
        const xp = (ev.xp_earned || 0) + (ev.speed_bonus || 0);
        const newTotal = prev.totalXp + xp;
        const newLevel = Math.min(5, [0,0,150,350,650,1100].findIndex(t => t > newTotal) - 1 || 1);
        const actualLevel = newTotal >= 1100 ? 5 : newTotal >= 650 ? 4 : newTotal >= 350 ? 3 : newTotal >= 150 ? 2 : 1;
        if (actualLevel > prev.level) setTimeout(() => setShowLevelUp(true), 500);
        const newSkills = { ...prev.skills };
        if (ev.skill_impact) Object.entries(ev.skill_impact).forEach(([k,v]) => {
          if (newSkills[k] !== undefined) newSkills[k] = Math.min(100, Math.max(0, newSkills[k] + v));
        });
        const newSess = {
          ...prev, totalXp: newTotal, tasksCompleted: prev.tasksCompleted + 1,
          streak: ev.passed ? prev.streak + 1 : 0,
          maxStars: Math.max(prev.maxStars || 0, ev.stars || 0),
          level: actualLevel, skills: newSkills
        };
        setTimeout(() => checkAchievements({ ...newSess, fastAnswer: isFast && ev.passed }), 100);
        return newSess;
      });

      setHistory(prev => [...prev, { taskTitle: currentTask.title, passed: ev.passed, stars: ev.stars, elapsed: elapsedSec }]);
    } catch (e) { console.error(e); }
    finally { setLoadingEval(false); }
  };

  /* ── Boss ── */
  const startBoss = async () => {
    setBossStarted(true);
    setPendingBoss(false);
    setLoadingTask(true);
    try {
      const task = await base44.integrations.Core.InvokeLLM({
        prompt: `You are generating a BOSS CHALLENGE — the hardest possible task for a Level ${session.level} Fleet AI student.
Track: ${selectedTrack?.label}
Fleet context: ${contextSummary}
This should be a comprehensive, multi-angle scenario that requires synthesis of all track knowledge.
Make it genuinely hard but fair. Include specific data.

Return JSON:
{
  "title": "BOSS: [dramatic title]",
  "type": "boss_challenge",
  "difficulty_label": "BOSS — Ultimate Challenge",
  "description": "Very detailed markdown scenario with multiple sub-questions labeled **Part A**, **Part B**, **Part C**. Include real numbers. Expect 3-5 paragraphs.",
  "hint": null,
  "xp_reward": 150,
  "time_limit": 90,
  "combo_multiplier": 1,
  "correct_answer_key": "comprehensive ideal answer covering all parts",
  "curriculum_position": ["${selectedTrack?.label}", "BOSS", "Synthesis Challenge"]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' }, type: { type: 'string' }, difficulty_label: { type: 'string' },
            description: { type: 'string' }, hint: { type: 'string' }, xp_reward: { type: 'number' },
            time_limit: { type: 'number' }, combo_multiplier: { type: 'number' }, correct_answer_key: { type: 'string' },
            curriculum_position: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setCurrentTask(task);
    } catch (e) { console.error(e); }
    finally { setLoadingTask(false); setTimedMode(true); }
  };

  const handleBossResult = (ev) => {
    setSession(prev => ({ ...prev, bossCompleted: (prev.bossCompleted || 0) + 1 }));
  };

  const nextTask = () => { setFeedback(null); setCurrentTask(null); generateTask(session); };
  const handleTimeUp = () => {
    setFeedback({ passed: false, stars: 0, xp_earned: 0, explanation: '⏱ **Time\'s up!** You ran out of time on this challenge. Don\'t worry — use this as a benchmark. Review the topic and try again.', correct_answer: currentTask?.correct_answer_key || '', next_hint: 'Practice faster decision-making with real fleet data.' });
    setHistory(prev => [...prev, { taskTitle: currentTask?.title, passed: false, stars: 0, elapsed: 999 }]);
  };

  const resetSession = () => {
    setPhase('track_select'); setSession(null); setCurrentTask(null); setFeedback(null);
    setHistory([]); setAssessmentDone(false); setAssessmentAnswer(''); setPendingBoss(false);
    setBossStarted(false); setUnlockedAchievements([]);
  };

  /* ─── RENDER ─── */
  if (phase === 'track_select') {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/25 to-cyan-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <GraduationCap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-black text-base">Fleet AI Academy</p>
              <p className="text-slate-400 text-xs">Adaptive neural learning · Dynamic difficulty · Real-world challenges</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-slate-400 text-xs px-1">Select a track. The AI will profile your level and dynamically adjust every challenge.</p>
          {TRACKS.map((track, i) => (
            <motion.button key={track.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.99 }}
              onClick={() => startAssessment(track)}
              className={`w-full p-4 rounded-2xl border ${track.border} bg-slate-900/50 hover:bg-slate-900/80 text-left transition-all group shadow-lg ${track.glow}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{track.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-black text-sm group-hover:text-white/90">{track.label}</p>
                  <div className={`h-0.5 w-20 rounded-full bg-gradient-to-r ${track.color} mt-1 opacity-70 group-hover:opacity-100 transition-opacity`} />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <p className="text-slate-400 text-xs mb-2">{track.desc}</p>
              <div className="flex flex-wrap gap-1">
                {track.topics.map((t, ti) => (
                  <span key={ti} className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 text-[9px] border border-slate-700/50">{t}</span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'assessment') {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white">
        <div className="p-4 border-b border-slate-800/50 flex items-center gap-3">
          <button onClick={() => setPhase('track_select')} className="text-slate-500 hover:text-white text-xs transition-colors">← Back</button>
          <span className="text-xl ml-1">{selectedTrack?.icon}</span>
          <p className="text-white font-black text-sm">{selectedTrack?.label}</p>
          <div className={`ml-auto h-1 w-16 rounded-full bg-gradient-to-r ${selectedTrack?.color}`} />
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/8 to-slate-900/80"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-violet-400" />
              <p className="text-white font-black">AI Level Assessment</p>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[9px]">Neural Profiling</Badge>
            </div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Describe your background and experience. The AI will analyze your response to calibrate the exact starting difficulty — ensuring every challenge is optimally matched to your level.
            </p>
            <textarea
              value={assessmentAnswer}
              onChange={e => setAssessmentAnswer(e.target.value)}
              placeholder="e.g. 'I've managed a fleet of 15 trucks for 3 years using SAP TMS. Comfortable with KPIs but new to AI-driven analytics.' Or 'Completely new to logistics.'"
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-900/70 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/60 resize-none mb-4 leading-relaxed"
            />
            <div className="flex gap-2">
              <Button onClick={skipAssessment} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm">
                Skip → Beginner
              </Button>
              <Button onClick={submitAssessment} disabled={!assessmentAnswer.trim() || assessmentLoading}
                className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 font-bold"
              >
                {assessmentLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Profiling…</>
                                   : <><Brain className="w-4 h-4 mr-2" />Calibrate My Level</>}
              </Button>
            </div>
          </motion.div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
            {[['🎯 Adaptive', 'Difficulty adjusts in real-time'], ['👑 Boss Challenges', 'Every 5 tasks'], ['📊 Skill Radar', 'Track 5 skill dimensions']].map(([k,v],i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 space-y-1">
                <p className="font-bold text-slate-300">{k}</p>
                <p>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Learning phase */
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Achievement toasts */}
      <AnimatePresence>
        {newAchievements.map(a => <AchievementToast key={a.id} achievement={a} onDone={() => setNewAchievements([])} />)}
      </AnimatePresence>
      {/* Level up */}
      <AnimatePresence>{showLevelUp && <LevelUpSplash level={session.level} onDismiss={() => setShowLevelUp(false)} />}</AnimatePresence>

      {/* Header */}
      <div className={`p-4 border-b border-slate-800/50 flex-shrink-0 bg-gradient-to-r ${LEVEL_BG[session.level]} bg-slate-950/95`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{selectedTrack?.icon}</span>
            <div>
              <p className="text-white font-black text-sm leading-tight">{selectedTrack?.label}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black ${LEVEL_COLORS[session.level]}`}>{LEVEL_LABELS[session.level]}</span>
                <span className="text-slate-600 text-[10px]">·</span>
                <span className="text-slate-500 text-[10px]">{session.tasksCompleted} tasks</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.streak >= 2 && (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-xs font-black">{session.streak}x</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1 bg-violet-500/15 border border-violet-500/30 px-2 py-1 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-300 text-xs font-black">{session.totalXp}</span>
            </div>
            <button onClick={() => setShowDashboard(v => !v)} className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
              <BarChart3 className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
        <XPBar session={session} />
        {/* Unlocked achievements mini-row */}
        {unlockedAchievements.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).map(a => (
              <span key={a.id} title={a.label} className="text-sm">{a.icon}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dashboard overlay */}
        {showDashboard && (
          <PerformanceDashboard session={session} history={history} onClose={() => setShowDashboard(false)} />
        )}

        {/* Welcome message */}
        {session.encouragement && session.tasksCompleted === 0 && !currentTask && !loadingTask && !pendingBoss && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5"
          >
            <p className="text-cyan-300 text-sm font-bold mb-1">🤖 AI Assessment Result</p>
            <p className="text-slate-300 text-sm leading-relaxed">{session.encouragement}</p>
            <p className="text-slate-500 text-xs mt-2">{session.rationale}</p>
          </motion.div>
        )}

        {/* Loading */}
        {loadingTask && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 animate-spin border-t-violet-400" />
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 animate-spin border-b-cyan-400 absolute inset-0 m-auto" style={{ animationDirection: 'reverse' }} />
              <Cpu className="absolute inset-0 m-auto w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-sm">Generating adaptive challenge…</p>
              <p className="text-slate-500 text-xs mt-1">Level {session.level} · {LEVEL_LABELS[session.level]} · {selectedTrack?.label}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {['Skill profiling', 'Difficulty calibration', 'Content synthesis', 'Context injection'].map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px] animate-pulse">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Boss intro */}
        {!loadingTask && pendingBoss && !bossStarted && (
          <BossIntro onStart={startBoss} />
        )}

        {/* Task */}
        {!loadingTask && currentTask && !feedback && (
          <TaskCard task={currentTask} onSubmit={evaluateAnswer} isLoading={loadingEval}
            timedMode={timedMode} onTimeUp={handleTimeUp} />
        )}

        {/* Feedback */}
        {!loadingTask && feedback && (
          <FeedbackCard feedback={feedback} onNext={nextTask} onRetry={() => setFeedback(null)} session={session} />
        )}

        {/* Start button */}
        {!loadingTask && !currentTask && !feedback && !pendingBoss && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <GraduationCap className="w-14 h-14 text-amber-400/70" />
            </motion.div>
            <p className="text-slate-300 text-sm font-bold">Ready for your first challenge?</p>
            <p className="text-slate-500 text-xs max-w-xs">The AI has profiled you at <span className={`font-black ${LEVEL_COLORS[session.level]}`}>{LEVEL_LABELS[session.level]}</span>. Tasks will adapt after every answer.</p>
            <Button onClick={() => generateTask(session)} className="bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-600 hover:to-cyan-600 font-black px-8 py-3 text-sm">
              <Zap className="w-4 h-4 mr-2" /> Begin Training
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <button onClick={resetSession} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Change track</button>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span>{history.length} tasks total</span>
          <span>·</span>
          <span>{history.filter(h => h.passed).length} correct</span>
          {currentTask && !feedback && !loadingEval && (
            <button onClick={nextTask} className="flex items-center gap-1 text-slate-600 hover:text-slate-400 transition-colors">
              <RefreshCw className="w-3 h-3" /> skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}