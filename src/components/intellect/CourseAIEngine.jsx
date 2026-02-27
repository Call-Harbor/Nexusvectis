import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  GraduationCap, Brain, Zap, CheckCircle2, XCircle, ChevronRight,
  Star, Trophy, Target, Loader2, Send, RefreshCw, BookOpen,
  BarChart3, TrendingUp, AlertCircle, Lightbulb, Lock, Unlock, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';

const TRACKS = [
  { id: 'fleet_basics', label: 'Fleet Operations', icon: '🚛', color: 'from-cyan-500 to-blue-500', desc: 'Vehicle management, routing, and logistics fundamentals' },
  { id: 'ai_analytics', label: 'AI & Analytics', icon: '🤖', color: 'from-violet-500 to-purple-600', desc: 'Fleet AI commands, data analysis, and predictions' },
  { id: 'maintenance', label: 'Predictive Maintenance', icon: '🔧', color: 'from-amber-500 to-orange-500', desc: 'Maintenance planning, failure prediction, cost optimization' },
  { id: 'sustainability', label: 'Green & Sustainability', icon: '🌱', color: 'from-emerald-500 to-green-600', desc: 'CO2, fuel efficiency, eco-routing strategies' },
];

const LEVEL_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert', 5: 'Master' };
const LEVEL_COLORS = { 1: 'text-slate-400', 2: 'text-cyan-400', 3: 'text-violet-400', 4: 'text-amber-400', 5: 'text-rose-400' };

/* ─── XP Bar ─── */
function XPBar({ xp, level }) {
  const xpForLevel = level * 100;
  const pct = Math.min(100, (xp % 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>Level {level} — {LEVEL_LABELS[level] || 'Master'}</span>
        <span>{xp % 100}/{xpForLevel} XP</span>
      </div>
      <Progress value={pct} className="h-1.5 bg-slate-800" />
    </div>
  );
}

/* ─── Task Card ─── */
function TaskCard({ task, onSubmit, isLoading }) {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const textareaRef = useRef(null);

  const isMultiChoice = task.type === 'multiple_choice';
  const isCode = task.type === 'code_challenge';

  const handleSubmit = () => {
    const val = isMultiChoice ? selectedOption : answer.trim();
    if (!val) return;
    onSubmit(val);
    setAnswer('');
    setSelectedOption(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 overflow-hidden"
    >
      {/* Task header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-b border-slate-800/50 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-cyan-500/20">
          <Target className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-sm">{task.title}</p>
            <Badge className="text-[10px] bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{task.type?.replace('_', ' ')}</Badge>
            <Badge className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30">+{task.xp_reward} XP</Badge>
          </div>
          <p className="text-slate-400 text-[11px]">{task.difficulty_label}</p>
        </div>
      </div>

      {/* Task body */}
      <div className="p-4 space-y-4">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown className="text-slate-200 text-sm leading-relaxed">{task.description}</ReactMarkdown>
        </div>

        {task.hint && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-amber-200 text-xs">{task.hint}</p>
          </div>
        )}

        {/* Multiple choice */}
        {isMultiChoice && task.options && (
          <div className="space-y-2">
            {task.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selectedOption === opt
                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                    : 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span className="font-mono text-cyan-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Free text / code */}
        {!isMultiChoice && (
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
            placeholder={isCode ? 'Write your solution here… (Ctrl+Enter to submit)' : 'Type your answer… (Ctrl+Enter to submit)'}
            rows={isCode ? 5 : 3}
            className={`w-full px-3 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/60 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60 resize-none transition-all ${isCode ? 'font-mono' : ''}`}
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || (isMultiChoice ? !selectedOption : !answer.trim())}
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          {isLoading ? 'AI is evaluating…' : 'Submit Answer'}
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Feedback Card ─── */
function FeedbackCard({ feedback, onNext, onRetry }) {
  const passed = feedback.passed;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border overflow-hidden ${passed ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'}`}
    >
      <div className={`px-4 py-3 flex items-center gap-3 ${passed ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        {passed
          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          : <XCircle className="w-5 h-5 text-red-400" />}
        <p className={`font-bold text-sm ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
          {passed ? `Correct! +${feedback.xp_earned} XP earned` : 'Not quite right'}
        </p>
        {passed && feedback.stars && (
          <div className="ml-auto flex gap-0.5">
            {[1,2,3].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= feedback.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
            ))}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown className="text-slate-200 text-sm leading-relaxed">{feedback.explanation}</ReactMarkdown>
        </div>
        {feedback.correct_answer && !passed && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <p className="text-slate-400 text-[11px] uppercase mb-1">Correct answer</p>
            <p className="text-emerald-300 text-sm font-semibold">{feedback.correct_answer}</p>
          </div>
        )}
        {feedback.next_hint && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <TrendingUp className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <p className="text-violet-200 text-xs">{feedback.next_hint}</p>
          </div>
        )}
        <div className="flex gap-2">
          {!passed && (
            <Button onClick={onRetry} variant="outline" className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/10">
              <RefreshCw className="w-4 h-4 mr-2" /> Try again
            </Button>
          )}
          <Button onClick={onNext} className={`${passed ? 'w-full' : 'flex-1'} bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600`}>
            <ChevronRight className="w-4 h-4 mr-2" /> {passed ? 'Next challenge' : 'Skip & continue'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Level Up Splash ─── */
function LevelUpSplash({ level, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="text-center space-y-4">
        <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
          <Trophy className="w-24 h-24 text-amber-400 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
        </motion.div>
        <p className="text-amber-300 text-3xl font-black">LEVEL UP!</p>
        <p className="text-white text-xl font-bold">Level {level} — {LEVEL_LABELS[level] || 'Master'}</p>
        <p className="text-slate-400 text-sm">Tasks will now adapt to your new skill level</p>
        <Button onClick={onDismiss} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8">
          Continue Training
        </Button>
      </div>
    </motion.div>
  );
}

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */
export default function CourseAIEngine({ vehicles = [], routes = [], shipments = [] }) {
  const [phase, setPhase] = useState('track_select'); // track_select | assessment | learning
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [session, setSession] = useState(null); // { level, xp, totalXp, tasksCompleted, streak }
  const [currentTask, setCurrentTask] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [history, setHistory] = useState([]); // task history for difficulty adaptation
  const [assessmentAnswer, setAssessmentAnswer] = useState('');
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  /* ── Context summary for AI ── */
  const contextSummary = `Fleet: ${vehicles.length} vehicles, ${routes.length} routes, ${shipments.length} shipments.`;

  /* ── Start track after optional assessment ── */
  const startAssessment = async (track) => {
    setSelectedTrack(track);
    setPhase('assessment');
  };

  const submitAssessment = async () => {
    setAssessmentLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an adaptive learning AI for fleet management training.
A student is starting the "${selectedTrack.label}" learning track.
They answered this self-assessment: "${assessmentAnswer}"

Based on their answer, determine their starting level (1=beginner, 2=intermediate, 3=advanced, 4=expert).
Return JSON:
{
  "level": 1-4,
  "rationale": "1-2 sentences explaining why",
  "encouragement": "short motivational sentence for the student"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            level: { type: "number" },
            rationale: { type: "string" },
            encouragement: { type: "string" }
          }
        }
      });
      const startLevel = Math.max(1, Math.min(4, res.level || 1));
      setSession({ level: startLevel, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0, rationale: res.rationale, encouragement: res.encouragement });
      setAssessmentDone(true);
    } catch (e) {
      setSession({ level: 1, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0 });
      setAssessmentDone(true);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const skipAssessment = () => {
    setSession({ level: 1, xp: 0, totalXp: 0, tasksCompleted: 0, streak: 0 });
    setAssessmentDone(true);
  };

  useEffect(() => {
    if (assessmentDone && session) {
      setPhase('learning');
      generateTask(session);
    }
  }, [assessmentDone]);

  /* ── Generate a task adapted to current level + history ── */
  const generateTask = async (sess) => {
    setLoadingTask(true);
    setFeedback(null);
    const recentResults = history.slice(-5).map(h => `(task: "${h.taskTitle}", passed: ${h.passed}, stars: ${h.stars || 0})`).join(', ');
    const difficultyTrend = history.length >= 3
      ? (history.slice(-3).filter(h => h.passed).length >= 2 ? 'increase difficulty' : 'decrease difficulty slightly')
      : 'maintain level';

    try {
      const task = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an adaptive Fleet Management AI tutor. Generate ONE interactive training task.

Track: ${selectedTrack?.label}
Student level: ${sess.level}/5 (${LEVEL_LABELS[sess.level] || 'Advanced'})
Tasks completed: ${sess.tasksCompleted}
Streak: ${sess.streak}
Difficulty trend from recent performance: ${difficultyTrend}
Recent task history: ${recentResults || 'none yet'}
Fleet context: ${contextSummary}

Generate a task that:
- Matches the student's current level (${LEVEL_LABELS[sess.level]})
- Is relevant to real fleet management scenarios
- Builds on previous tasks if history exists
- Uses variety: mix of explanation tasks, scenario analysis, multiple choice, or hands-on challenges

Return JSON:
{
  "title": "Short task title",
  "type": "multiple_choice|open_question|scenario_analysis|code_challenge",
  "difficulty_label": "e.g. Level 2 — Intermediate",
  "description": "Full task description in markdown. Include scenario context, data, or a problem to solve. Be specific and realistic.",
  "options": ["option A", "option B", "option C", "option D"],
  "hint": "Optional hint string or null",
  "xp_reward": 15-50,
  "correct_answer_key": "for internal evaluation only — the ideal answer or correct option"
}
Only include "options" if type is "multiple_choice". Omit it otherwise.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string" },
            difficulty_label: { type: "string" },
            description: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            hint: { type: "string" },
            xp_reward: { type: "number" },
            correct_answer_key: { type: "string" }
          }
        }
      });
      setCurrentTask(task);
    } catch (e) {
      console.error('generateTask error:', e);
    } finally {
      setLoadingTask(false);
    }
  };

  /* ── Evaluate student answer ── */
  const evaluateAnswer = async (answer) => {
    setLoadingEval(true);
    try {
      const evaluation = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Fleet Management AI tutor evaluating a student's answer.

Track: ${selectedTrack?.label}
Student level: ${session.level}/5 (${LEVEL_LABELS[session.level]})
Task: "${currentTask.title}"
Task description: ${currentTask.description}
Correct answer key: ${currentTask.correct_answer_key}
Student's answer: "${answer}"

Evaluate fairly and constructively. Give partial credit where deserved. Award 1-3 stars based on quality.

Return JSON:
{
  "passed": true/false,
  "stars": 1-3,
  "xp_earned": 0 to ${currentTask.xp_reward},
  "explanation": "Detailed explanation in markdown. Acknowledge what they got right. Correct mistakes gently. Add insight.",
  "correct_answer": "The correct answer (only shown if passed=false)",
  "next_hint": "A hint or teaser about what's coming next in the curriculum",
  "difficulty_adjust": -1|0|1
}`,
        response_json_schema: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            stars: { type: "number" },
            xp_earned: { type: "number" },
            explanation: { type: "string" },
            correct_answer: { type: "string" },
            next_hint: { type: "string" },
            difficulty_adjust: { type: "number" }
          }
        }
      });

      setFeedback(evaluation);

      // Update session
      setSession(prev => {
        const xpEarned = evaluation.xp_earned || 0;
        const newTotalXp = prev.totalXp + xpEarned;
        const newXp = prev.xp + xpEarned;
        const newTasksCompleted = prev.tasksCompleted + 1;
        const newStreak = evaluation.passed ? prev.streak + 1 : 0;

        // Level up at every 100 XP
        const newLevel = Math.min(5, Math.floor(newTotalXp / 100) + 1);
        const didLevelUp = newLevel > prev.level;
        if (didLevelUp) setTimeout(() => setShowLevelUp(true), 400);

        return { ...prev, xp: newXp, totalXp: newTotalXp, tasksCompleted: newTasksCompleted, streak: newStreak, level: newLevel };
      });

      // Save to history
      setHistory(prev => [...prev, {
        taskTitle: currentTask.title,
        passed: evaluation.passed,
        stars: evaluation.stars,
        difficultyAdjust: evaluation.difficulty_adjust
      }]);

    } catch (e) {
      console.error('evaluateAnswer error:', e);
    } finally {
      setLoadingEval(false);
    }
  };

  const nextTask = () => {
    setFeedback(null);
    setCurrentTask(null);
    generateTask(session);
  };

  /* ───────────────── RENDER ───────────────── */

  /* Track selection */
  if (phase === 'track_select') {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white">
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-bold">Fleet AI Learning Engine</p>
              <p className="text-slate-400 text-xs">Adaptive AI-driven hologram courses</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-slate-300 text-sm">Choose a learning track to begin. The AI will assess your level and adapt every task dynamically.</p>
          <div className="grid grid-cols-1 gap-3">
            {TRACKS.map(track => (
              <motion.button
                key={track.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => startAssessment(track)}
                className="p-4 rounded-2xl border border-slate-700/50 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900/80 text-left transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{track.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm group-hover:text-cyan-300 transition-colors">{track.label}</p>
                    <div className={`h-0.5 w-16 rounded-full bg-gradient-to-r ${track.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto transition-colors" />
                </div>
                <p className="text-slate-400 text-xs">{track.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Assessment phase */
  if (phase === 'assessment') {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-white">
        <div className="p-4 border-b border-slate-800/50 flex items-center gap-3">
          <button onClick={() => setPhase('track_select')} className="text-slate-500 hover:text-white text-xs">← Back</button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-lg">{selectedTrack?.icon}</span>
            <p className="text-white font-bold text-sm">{selectedTrack?.label}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-violet-400" />
              <p className="text-white font-bold">Level Assessment</p>
            </div>
            <p className="text-slate-300 text-sm mb-4">Tell the AI about your experience level so it can tailor the course to you. Or skip to start at beginner level.</p>
            <textarea
              value={assessmentAnswer}
              onChange={e => setAssessmentAnswer(e.target.value)}
              placeholder="Describe your experience with fleet management, logistics, or transport… (e.g. 'I manage 20 trucks daily', 'I'm new to logistics', 'I have 5 years TMS experience')"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/60 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-400/60 resize-none mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={skipAssessment} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white text-sm">
                Skip (Start at Beginner)
              </Button>
              <Button
                onClick={submitAssessment}
                disabled={!assessmentAnswer.trim() || assessmentLoading}
                className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-sm"
              >
                {assessmentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                {assessmentLoading ? 'Assessing…' : 'Assess My Level'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Learning phase */
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      <AnimatePresence>{showLevelUp && <LevelUpSplash level={session.level} onDismiss={() => setShowLevelUp(false)} />}</AnimatePresence>

      {/* Header stats */}
      <div className="p-4 border-b border-slate-800/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedTrack?.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{selectedTrack?.label}</p>
              <p className={`text-xs font-bold ${LEVEL_COLORS[session.level] || 'text-slate-400'}`}>{LEVEL_LABELS[session.level]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {session.streak >= 2 && (
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                <span className="font-bold">{session.streak} streak</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="font-bold text-white">{session.totalXp} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{session.tasksCompleted} done</span>
            </div>
          </div>
        </div>
        <XPBar xp={session.totalXp} level={session.level} />
      </div>

      {/* Session encouragement (shown once at start) */}
      {session.encouragement && session.tasksCompleted === 0 && !currentTask && !loadingTask && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{session.encouragement} {session.rationale}</span>
        </div>
      )}

      {/* Task area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingTask && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-violet-500/20 animate-spin border-t-violet-400" />
              <Brain className="absolute inset-0 m-auto w-6 h-6 text-violet-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Generating adaptive task…</p>
              <p className="text-slate-400 text-xs mt-1">Level {session.level} · {LEVEL_LABELS[session.level]}</p>
            </div>
          </div>
        )}

        {!loadingTask && currentTask && !feedback && (
          <TaskCard task={currentTask} onSubmit={evaluateAnswer} isLoading={loadingEval} />
        )}

        {!loadingTask && feedback && (
          <FeedbackCard
            feedback={feedback}
            onNext={nextTask}
            onRetry={() => setFeedback(null)}
          />
        )}

        {!loadingTask && !currentTask && !feedback && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <GraduationCap className="w-12 h-12 text-amber-400/60" />
            <p className="text-slate-400 text-sm">Ready to start your first challenge?</p>
            <Button onClick={() => generateTask(session)} className="bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-600 hover:to-cyan-600">
              <Zap className="w-4 h-4 mr-2" /> Begin Training
            </Button>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="p-3 border-t border-slate-800/50 flex items-center justify-between flex-shrink-0">
        <button onClick={() => { setPhase('track_select'); setSession(null); setCurrentTask(null); setFeedback(null); setHistory([]); setAssessmentDone(false); setAssessmentAnswer(''); }}
          className="text-slate-500 hover:text-white text-xs transition-colors">
          ← Change track
        </button>
        {currentTask && !feedback && !loadingEval && (
          <button onClick={nextTask} className="text-slate-500 hover:text-slate-300 text-xs transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Skip task
          </button>
        )}
      </div>
    </div>
  );
}