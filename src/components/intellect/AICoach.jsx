import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Brain, X, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, Sparkles, CheckCircle2, Loader2, GraduationCap } from 'lucide-react';

/* ─── Types of coaching messages ─── */
const COACH_TYPES = {
  tip:     { icon: Lightbulb,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  label: 'Tip' },
  warning: { icon: AlertTriangle, color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/25',   label: 'Watch out' },
  insight: { icon: Brain,         color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25', label: 'AI Insight' },
  praise:  { icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',label: 'Nice work' },
};

/* ─── Debounce hook ─── */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

/* ─── Individual Coach Bubble ─── */
function CoachBubble({ msg, onDismiss }) {
  const cfg = COACH_TYPES[msg.type] || COACH_TYPES.tip;
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 18s
    const t = setTimeout(onDismiss, 18000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} backdrop-blur-xl overflow-hidden max-w-xs shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={`p-1 rounded-lg ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-wide ${cfg.color}`}>{cfg.label}</p>
          <p className="text-white text-xs font-semibold truncate leading-tight">{msg.headline}</p>
        </div>
        <div className="flex items-center gap-1 ml-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors p-0.5">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDismiss} className="text-slate-600 hover:text-slate-300 transition-colors p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && msg.detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3"
          >
            <p className="text-slate-300 text-xs leading-relaxed border-t border-slate-700/50 pt-2 mt-1">{msg.detail}</p>
            {msg.action && (
              <p className={`text-xs font-bold mt-2 ${cfg.color}`}>→ {msg.action}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Coach Panel (collapsed/expanded) ─── */
function CoachPanel({ messages, onDismiss, isLoading, coachLevel }) {
  const [minimized, setMinimized] = useState(false);

  if (messages.length === 0 && !isLoading) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Toggle button */}
      <button
        onClick={() => setMinimized(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-violet-500/30 text-violet-400 text-[11px] font-bold hover:border-violet-500/60 transition-all backdrop-blur-xl shadow-lg"
      >
        <Brain className="w-3.5 h-3.5 animate-pulse" />
        AI Coach
        {messages.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-black flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>

      {/* Messages */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-2 items-end"
          >
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-violet-500/20 bg-violet-500/8 backdrop-blur-xl">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span className="text-violet-300 text-xs">Coaching…</span>
              </div>
            )}
            {messages.map(msg => (
              <CoachBubble key={msg.id} msg={msg} onDismiss={() => onDismiss(msg.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── MAIN AICoach HOOK + COMPONENT ──────────────── */

let _coachId = 0;
const mkId = () => ++_coachId;

// Context fingerprint — detects what the user is currently doing
function buildActivityContext(openWindows, fleetData, courseSession) {
  const windowTypes = openWindows.map(w => w.windowType || w.type || 'unknown');
  const { vehicles = [], routes = [], shipments = [], alerts = [] } = fleetData;

  const ctx = {
    activeTools: windowTypes,
    fleetSize: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    maintenanceDue: vehicles.filter(v => v.fuel_level < 20).length,
    pendingAlerts: alerts.filter(a => !a.is_resolved).length,
    delayedShipments: shipments.filter(s => s.status === 'delayed').length,
    routeCount: routes.length,
    courseLevel: courseSession?.level || null,
    courseTrack: courseSession?.selectedTrack?.label || null,
    courseStreak: courseSession?.streak || 0,
  };
  return ctx;
}

export function useAICoach({ openWindows = [], fleetData = {}, courseSession = null, userLevel = 1, performanceHistory = [] }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastContextRef = useRef('');
  const cooldownRef = useRef(false);

  const ctx = buildActivityContext(openWindows, fleetData, courseSession);
  const ctxKey = JSON.stringify({ tools: ctx.activeTools, alerts: ctx.pendingAlerts, delayed: ctx.delayedShipments });
  const debouncedCtxKey = useDebounce(ctxKey, 3500); // wait 3.5s before triggering

  const dismiss = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages(prev => {
      // Max 3 visible at once
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
      return [...trimmed, { ...msg, id: mkId() }];
    });
  }, []);

  // Trigger AI coaching when context meaningfully changes
  useEffect(() => {
    if (debouncedCtxKey === lastContextRef.current) return;
    if (cooldownRef.current) return;
    if (ctx.activeTools.length === 0) return;

    lastContextRef.current = debouncedCtxKey;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 45000); // 45s cooldown between proactive tips

    // Only coach if user is actively doing something meaningful
    const interestingTools = ctx.activeTools.filter(t => !['fleet_globe', 'chat'].includes(t));
    if (interestingTools.length === 0 && ctx.pendingAlerts === 0 && ctx.delayedShipments === 0) return;

    fetchCoachingTip(ctx, userLevel, performanceHistory, addMessage, setIsLoading);
  }, [debouncedCtxKey]);

  // Immediate coaching on urgent fleet signals
  useEffect(() => {
    if (ctx.pendingAlerts >= 3) {
      addMessage({
        type: 'warning',
        headline: `${ctx.pendingAlerts} unresolved alerts`,
        detail: 'High alert volume can indicate systemic issues. Consider grouping them by category and resolving root causes first.',
        action: 'Open Alerts dashboard'
      });
    }
  }, [ctx.pendingAlerts]);

  useEffect(() => {
    if (ctx.delayedShipments >= 2) {
      addMessage({
        type: 'warning',
        headline: `${ctx.delayedShipments} shipments delayed`,
        detail: 'Multiple simultaneous delays often point to route congestion or driver availability issues. Run a route analysis or check current vehicle positions.',
        action: 'Check Fleet Monitor'
      });
    }
  }, [ctx.delayedShipments]);

  useEffect(() => {
    if (ctx.maintenanceDue >= 2) {
      addMessage({
        type: 'warning',
        headline: `${ctx.maintenanceDue} vehicles critically low fuel`,
        detail: 'Vehicles below 20% fuel risk mid-route failures. Schedule refuelling stops proactively using predictive maintenance data.',
        action: 'Open Maintenance'
      });
    }
  }, [ctx.maintenanceDue]);

  return { messages, isLoading, dismiss };
}

async function fetchCoachingTip(ctx, userLevel, performanceHistory, addMessage, setIsLoading) {
  setIsLoading(true);
  const recentPerf = performanceHistory.slice(-5);
  const accuracy = recentPerf.length ? Math.round(recentPerf.filter(p => p.passed).length / recentPerf.length * 100) : null;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an elite real-time AI coach embedded in a Fleet Management platform called NexusVectis.

Current user context:
- Active tools open: ${ctx.activeTools.join(', ') || 'none'}
- Fleet: ${ctx.fleetSize} vehicles, ${ctx.activeVehicles} active
- Pending alerts: ${ctx.pendingAlerts}
- Delayed shipments: ${ctx.delayedShipments}
- Routes: ${ctx.routeCount}
- User level: ${userLevel}/5
- Course track (if any): ${ctx.courseTrack || 'none'}, Level: ${ctx.courseLevel || 'N/A'}
- Recent quiz accuracy: ${accuracy !== null ? accuracy + '%' : 'no data'}

Based on what the user is currently doing, generate ONE short, non-intrusive, highly contextual coaching message.
Be specific and actionable. Do NOT be generic. Reference their actual context.
Choose the best type: "tip" (best practice suggestion), "warning" (potential mistake), "insight" (deeper AI analysis), or "praise" (if accuracy ≥ 80%).

Return JSON:
{
  "type": "tip|warning|insight|praise",
  "headline": "Max 8 words. Direct and specific.",
  "detail": "2-3 sentences of actionable expert advice relevant to what they're doing right now.",
  "action": "Short suggested next action (max 6 words) or null"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          headline: { type: 'string' },
          detail: { type: 'string' },
          action: { type: 'string' }
        }
      }
    });

    if (result?.headline) {
      addMessage(result);
    }
  } catch (e) {
    // silent fail
  } finally {
    setIsLoading(false);
  }
}

/* ─── Exported Component ─── */
export default function AICoach({ openWindows, fleetData, courseSession, userLevel, performanceHistory }) {
  const { messages, isLoading, dismiss } = useAICoach({
    openWindows, fleetData, courseSession, userLevel, performanceHistory
  });

  return (
    <div className="fixed bottom-24 right-4 z-[90] lg:bottom-8 lg:right-6 pointer-events-none">
      <div className="pointer-events-auto">
        <CoachPanel
          messages={messages}
          onDismiss={dismiss}
          isLoading={isLoading}
          coachLevel={userLevel}
        />
      </div>
    </div>
  );
}